// 메시지 만들기: 경기 전 분석, 경기 후 피드백, 주간 조언.
// 모든 문장은 지금 게임 속 숫자(능력치, 순위, 피로, 학업)를 넣어 만듭니다.
import { STAT_LABEL, POSITIONS } from "../../data/player.js";
import { ACTIONS } from "../../data/actions.js";
import { STAFF, ROSTER, CAPTAINS } from "../../data/roster.js";
import { mail, mailFrom } from "../state.js";
import { turnInfo } from "./calendar.js";
import { ovr, depthChart, teamStrength } from "./team.js";
import { sortTable, US, TEAM_NAME } from "./season.js";
import { getPath, pick } from "../rng.js";
import { conditionOf } from "./growth.js";
import { lifeMail, afterMatchChat } from "./life.js";
import { eligibility } from "./match.js";
import { stillScheduled } from "./season.js";
import { chance } from "../rng.js";
import { isBirthdayWeek } from "./birthday.js";
import { chatText } from "./life.js";

const f0 = v => Math.floor(v);
// 받침 판단. 숫자는 읽는 소리 기준 (0 십/영, 1 일, 3 삼, 6 육, 7 칠, 8 팔은 받침 있음)
const has = w => {
  const t = String(w); const ch = t[t.length - 1];
  if (/[0-9]/.test(ch)) return "013678".includes(ch);
  const c = t.charCodeAt(t.length - 1);
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
};
// 으로/로: ㄹ 받침(1, 7, 8, 일·칠·팔)은 '로'
const ro = w => { const t = String(w); const ch = t[t.length - 1]; if (/[0-9]/.test(ch)) return "036".includes(ch) ? "으로" : "로";
  const c = t.charCodeAt(t.length - 1); const j = (c - 0xAC00) % 28; return c >= 0xAC00 && c <= 0xD7A3 && j !== 0 && j !== 8 ? "으로" : "로"; };
const ida = n => `${n}${has(n) ? "이다" : "다"}`;
const pp = (w, a, b) => (has(w) ? a : b);          // 조사만
const josa = (w, a, b) => w + pp(w, a, b);         // 낱말 + 조사

// 그 능력치를 가장 많이 올리는 훈련
export function drillFor(stat) {
  let best = null, v = 0;
  for (const a of ACTIONS) { const g = a.gains[stat] || 0; if (g > v) { v = g; best = a; } }
  return best;
}


// 상대 팀 성향 (이름으로 늘 같은 성향이 나옴)
const STYLES = [
  { label: "전방 압박이 강한 팀", stat: "tech.firstTouch", tip: "공을 받기 전에 주변을 먼저 봐라. 원터치로 내주는 선택이 안전하다." },
  { label: "롱볼과 높이로 밀어붙이는 팀", stat: "phys.jump", tip: "공중볼 경합이 많을 거다. 세컨드볼 위치를 먼저 잡아라." },
  { label: "빠른 역습을 노리는 팀", stat: "phys.speed", tip: "공을 뺏기는 순간이 제일 위험하다. 무리한 드리블은 아껴라." },
  { label: "공을 오래 돌리는 팀", stat: "phys.stamina", tip: "많이 뛰어야 하는 경기다. 후반에 체력이 갈린다." },
  { label: "몸싸움이 거친 팀", stat: "phys.strength", tip: "부딪힐 때 버티는 쪽이 이긴다. 등지는 플레이를 조심해라." },
];
function styleOf(name) {
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return STYLES[h % STYLES.length];
}

function strengthWord(diff) {
  if (diff > 5) return "전력은 우리보다 확실히 한 수 위다";
  if (diff > 2) return "전력은 우리보다 조금 앞선다";
  if (diff > -2) return "전력은 비슷하다";
  if (diff > -5) return "전력은 해볼 만하다";
  return "전력은 우리가 앞선다";
}

// ── 경기 전 분석 (코치) ─────────────
// 숫자를 늘어놓기보다, 코치가 옆에서 툭 건네는 말처럼 씁니다.
const levelWord = v => v < 45 ? "low" : v > 65 ? "high" : "mid";
export function previewMail(state, fx) {
  const info = turnInfo(state);
  const p = state.player;
  const style = styleOf(fx.opponent.name);
  const d = depthChart(state);
  const lines = [];
  lines.push(`${info.month}월 ${info.week}주 ${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}, 상대는 ${fx.opponent.name}.`);

  if (fx.comp === "hs") {
    const s = fx.school;
    const tierWord = { footballHS: "축구부가 탄탄한 학교", regional: "이 지역에서 손꼽히는 학교", national: "전국대회 단골인 학교", proYouth: "프로 구단 유스팀" }[s.tier];
    lines.push(`${josa(s.name, "은", "는")} ${ida(tierWord)}. ${s.coach}님께서 직접 보러 오신다는구나.`);
    const small = p.body.height < 170 || p.stats.phys.strength < 55;
    lines.push(small ? "고등학생들은 한 뼘은 더 크고 단단하다. 정면으로 부딪히기보다 한 박자 먼저 움직여라."
      : "몸으로 밀릴 정도는 아니다. 오히려 형들한테 네 몸을 보여 줄 기회다.");
    lines.push("이런 경기 하나가 진로를 바꾸기도 한다. 이기는 것보다, 네가 어떤 선수인지 보여 주고 와라.");
  } else {
    const ourStr = teamStrength(state, true) * 0.6 + 50 * 0.4;
    const diff = fx.opponent.strength - ourStr;
    lines.push(`${style.label}이다. ${diff > 5 ? "솔직히 쉽지 않은 상대다. 버티는 시간이 길 거다." : diff > 2 ? "만만치 않다. 집중력 싸움이 될 거다." : diff > -2 ? "해 볼 만한 상대다. 먼저 실수하는 쪽이 진다." : "우리가 할 것만 하면 된다. 그래도 방심하는 순간 뒤집힌다."}`);
    if (state.league && fx.comp === "league" && state.league.played > 0) {
      const rows = sortTable(state.league.table);
      const them = rows.findIndex(r => r.id === fx.opponent.id);
      const us = rows.findIndex(r => r.id === US);
      lines.push(them < us ? "순위표에서 우리보다 위에 있는 팀이다. 여기서 잡으면 판이 달라진다." : them < 3 ? "요즘 기세가 좋은 팀이다." : "순위는 아래지만, 그런 팀이 제일 독하게 나온다.");
    }
    const lv = levelWord(getPath(p.stats, style.stat));
    const st = STAT_LABEL[style.stat];
    lines.push(`${style.tip} ${lv === "low" ? `네 ${josa(st, "은", "는")} 아직 몸에 덜 붙었으니 무리하지 말고.` : lv === "high" ? `이런 경기에선 네 ${josa(st, "이", "가")} 오히려 무기가 된다.` : `네 ${josa(st, "이", "가")} 얼마나 버텨 주느냐가 관건이다.`}`);
    if (fx.ko) lines.push("토너먼트다. 지면 그대로 짐 싸서 고흥 내려간다.");
  }

  const elig = eligibility(state, fx);
  if (!elig.ok) {                                      // 다쳤거나 성적 때문에 못 뛰는 주에는 그 이야기만
    lines.push(p.condition.injury ? "이번 주는 재활이 먼저다. 벤치 옆에서 경기 흐름이라도 읽어 둬라."
      : "그리고… 성적 때문에 이번엔 명단에 너를 못 넣는다. 감독님도 아쉬워하신다. 책상 앞에서 먼저 이기고 와라.");
  } else {
    lines.push(d.rank <= d.slots ? "감독님은 이번 주도 네 이름을 먼저 적어 두실 것 같다. 기대에 답해라."
      : d.rank <= d.slots + 2 ? "벤치에서 시작할 수도 있다. 그래도 기회는 언제 올지 모른다. 준비하고 있어라."
      : "아직은 앞에 선 선수들이 많다. 이번 주 훈련에서 감독님 눈에 띄는 게 먼저다.");
    const c = conditionOf(p);
    if (c.score < 50) lines.push(`그리고 요즘 몸이 많이 무거워 보인다. 이대로면 가진 것의 반도 못 보여 준다.${p.condition.fatigue >= 85 ? " 감독님도 너를 선발로 쓰기 부담스러워하신다." : ""} 주중에 하루는 푹 쉬어라.`);
    else if (c.score >= 85) lines.push("몸 상태는 지금이 제일 좋다. 이럴 때 보여 줘야 한다.");
  }

  mail(state, "assist", `[경기 분석] vs ${fx.opponent.name}`, lines.join("\n\n"));
}

// ── 경기 후: 단톡방 결과 + 감독님 피드백 ─
export function matchMails(state, m, res, notes) {
  const p = state.player, fx = m.fx;
  const scorers = side => m.goalsLog.filter(g => g.team === side).map(g => `${g.name} ${g.minute}'${g.assist ? ` (도움 ${g.assist})` : ""}`).join(", ");
  const body = [];
  body.push(afterMatchChat(state, res, fx, res.grade === 3 && noFixtureLeft(state)));
  const bdayGoal = res.goals > 0 && isBirthdayWeek(state, turnInfo(state));
  if (bdayGoal) body.push(chatText(state, pick(["{friend}: 생일골 ㅋㅋㅋ 이거 평생 우려먹겠네", "{mate}: 생일에 골 넣는 거 실화냐\n\n{friend}: 케이크 두 개 사야 됨"])));
  if (res.gf) body.push(`⚽ 득점: ${scorers("us")}`);
  if (res.ga) body.push(`실점: ${scorers("them")}`);
  body.push(`점유율 ${m.stats.poss}%, 슈팅 ${m.stats.us.shots} 대 ${m.stats.them.shots}`);
  if (state.league && fx.comp === "league") {
    const rows = sortTable(state.league.table);
    const us = rows.findIndex(r => r.id === US);
    body.push(`📊 리그 ${us + 1}위 (승점 ${rows[us].pts}, ${state.league.played}/${state.league.rounds.length}라운드)`);
  }
  for (const n of notes) if (typeof n === "string") body.push(n);
  const nxt = nextFixtureText(state);
  if (nxt) body.push(`다음 경기: ${nxt}`);
  body.push(`${STAFF.assistant}: ${res.result === "패" ? "월요일엔 영상 보면서 실점 장면 짚고 간다." : "월요일은 회복 훈련. 무리하지 마라."}`);
  mail(state, "group", `${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}: ${TEAM_NAME} ${res.gf} : ${res.ga} ${fx.opponent.name}${res.shootout ? ` (승부차기 ${res.shootout.us}:${res.shootout.them})` : ""}`, body.join("\n\n"));

  for (const n of notes) if (typeof n === "object") mailFrom(state, n.from, "scout", n.title, n.body);

  // 감독님 개인 피드백: 숫자 대신 장면과 느낌으로
  const fb = [];
  if (res.minutes > 0) {
    const r = res.rating;
    const band = r >= 8.3 ? 0 : r >= 7.4 ? 1 : r >= 6.6 ? 2 : r >= 6 ? 3 : 4;
    const FEEDBACK = [
      ["오늘은 네 경기였다. 집에 가서 부모님께 자랑해도 된다.", "오늘 같은 날이 쌓이면 그게 실력이 된다. 잘했다.", "상대 감독이 경기 끝나고 네 이름을 물어보더라. 그 정도였다."],
      ["오늘 좋았다. 네가 있어서 팀이 편했다.", "오늘 움직임 좋았다. 공 없을 때 뛰는 게 보이더라.", "실수가 적었다. 그게 제일 어려운 거다."],
      ["제 몫은 했다. 그런데 너는 그 이상을 할 수 있는 선수다.", "나쁘지 않았다. 다만 결정적인 순간에 한 번 더 용기를 내 봐라.", "무난했다. 다음엔 네가 경기를 바꾸는 장면을 하나 보여 줘라."],
      ["오늘은 좀 조용했다. 공이 오길 기다리기만 하면 안 된다.", "공을 기다리지 말고 받으러 가라. 오늘은 그게 아쉬웠다.", "경기에 늦게 들어온 느낌이다. 첫 10분에 한 번은 공을 만져라."],
      ["오늘은 스스로도 알 거다. 오늘 밤은 너무 오래 곱씹지는 마라.", "이런 경기도 있다. 다음 주에 어떻게 하는지가 더 중요하다.", "오늘 일은 내가 기억할 테니, 너는 잊고 다음 경기 준비해라."],
    ];
    fb.push(pick(FEEDBACK[band]));
    const firstGoal = res.goals > 0 && state.record.matches.slice(0, -1).every(x => !x.goals);
    if (res.goals > 0 && isBirthdayWeek(state, turnInfo(state))) fb.unshift("생일 주간에 골이라니. 이번 주 케이크는 네가 제일 큰 조각 먹어라.");
    if (res.goals >= 3) fb.unshift("세 골. 공에 날짜 적어서 가져가라. 그리고 내일은 다시 빈손으로 와라.");
    else if (firstGoal) fb.unshift("첫 골이구나. 오늘 밤은 마음껏 기뻐해라. 내일부터는 두 번째 골 준비다.");
    if (m.comeback) fb.push("복귀전 치고는 충분했다. 이번 주는 다리 상태부터 보고 훈련 강도 정하자.");
    if (res.injury) fb.unshift("몸은 좀 어떠냐. 경기 생각은 나중에 해라. 치료부터 제대로 받자.");
    if (m.my.log.some(x => x.out === "card")) fb.push(pick(["경고는 꼭 필요할 때만 받는 거다. 오늘 그 파울, 정말 필요했는지 생각해 봐라.", "카드 하나 받으면 그 뒤로는 태클을 못 한다. 영리하게 끊는 법을 배우자."]));
    const log = m.my.log;
    if (log.length) {
      const okN = log.filter(x => x.ok).length;
      if (okN === log.length && log.length >= 3) fb.push(pick(["공을 잡을 때마다 뭔가 됐다. 그 감각, 잊지 마라.", "오늘은 고르는 것마다 맞았다. 판단이 빨라졌다는 뜻이다.", "네 선택에 동료들이 맞춰 움직이더라. 그게 좋은 선수다."]));
      else if (okN <= log.length / 3) fb.push(pick(["몇 번은 번뜩였는데, 중요한 순간마다 한 템포씩 늦었다.", "공을 잡고 나서 생각하니까 늦는 거다. 받기 전에 정해 둬라.", "오늘은 손에 잡힐 듯한 장면들이 다 미끄러졌다. 그런 날도 있다. 같은 실수만 반복하지 마라."]));
      const fails = log.filter(x => !x.ok);
      const byStat = {};
      for (const f of fails) (byStat[f.stat] ||= []).push(f);
      const worst = Object.entries(byStat).sort((a, b) => b[1].length - a[1].length)[0];
      if (worst) {
        const [stat, list] = worst;
        const drill = drillFor(stat);
        fb.push(`"${list[0].label}" 같은 장면에서 자꾸 막히더라. ${josa(STAT_LABEL[stat], "이", "가")} 아직 몸에 덜 붙었다.${drill ? ` 이번 주엔 ${josa(drill.label, "을", "를")} 조금 더 해 보자.` : ""}`);
      }
      const brave = log.find(x => x.ok && x.level === "낮음");
      if (brave) fb.push(pick([`${brave.minute}분에 "${brave.label}", 그거 아무나 하는 선택 아니다. 그런 배짱은 좋다. 다만 매번 통하진 않는다는 것도 알고.`,
        `${brave.minute}분 장면, 다들 안 될 거라고 봤을 거다. 그걸 해냈다. 그 배짱은 오래 가져가라.`]));
      const safe = log.filter(x => x.level === "높음").length;
      if (log.length >= 4 && safe === log.length && res.goals + res.assists === 0 && r < 7.4) fb.push(pick(["실수는 없었다. 그런데 상대가 무서워할 장면도 없었다. 가끔은 승부를 걸어 봐라.", "안전하게만 갔다. 그것도 실력이지만, 경기를 바꾸는 건 결국 한 번의 모험이다."]));
      const sig = log.find(x => x.ok && x.signature);
      if (sig) fb.push(pick([`"${sig.label}" 그거 연습 많이 했구나. 관중석이 다 일어나더라.`, `"${sig.label}", 경기에서 그걸 꺼낼 줄은 몰랐다. 대신 질 때는 그게 독이 된다. 쓸 때를 골라라.`]));
    }
    if (res.involved >= 3) fb.push(m.star >= 1 ? pick(["상대가 너만 따라다니는데도 계속 공에 관여하더라. 이제 다들 너를 안다.", "두 명이 붙어도 공을 지키더라. 이제 상대 감독들이 너부터 막으라고 할 거다."])
      : pick(["공이 너를 거쳐 가는 일이 많아졌다. 팀이 너를 찾기 시작했다는 뜻이다.", "동료들이 공 잡으면 너부터 보더라. 믿음은 그렇게 쌓이는 거다."]));
    if (res.stops >= 2) fb.push(pick(["뒤에서 몇 번이나 끊어 줬다. 그런 건 기록에 안 남아도 감독은 다 본다.", "궂은일 많이 했다. 골 넣은 애들보다 네 이름을 먼저 부르고 싶다.",
      ...(res.ga === 0 ? ["오늘 실점 안 한 건 네가 몇 번 막아 준 덕이 크다."] : [])]));
    const cnow = conditionOf(p);
    if (cnow.score < 50) fb.push("경기 내내 다리가 무거워 보였다. 쉬는 것도 훈련이다.");
    if (m.goalsLog.some(g => g.myFault)) fb.push("실점 장면, 너도 마음에 걸릴 거다. 내일 영상으로 같이 보자.");
    if (fx.comp === "hs" && m.physGap > 0.04) fb.push("고등학생 몸싸움에 자꾸 밀리더라. 웨이트는 하루아침에 안 된다. 꾸준히 해라.");
    if (res.mom) fb.push(pick(["오늘 최우수 선수는 너다. 그래도 들뜨지 마라. 내일 훈련은 똑같다.", "오늘 최우수 선수. 상은 오늘까지만 기뻐하고, 내일은 다시 처음부터다."]));
    if (fx.elementary && res.result !== "승") fb.push("초등학생 팀한테 이 결과는 말이 안 된다. 방심했지? 다음 주 훈련에서 다시 보자.");
    if (fx.elementary && res.result === "승" && r >= 7) fb.push("동생들 앞에서 제대로 보여 줬다. 너를 보고 축구 시작하는 애가 생길지도 모른다.");
  } else if (res.status === "bench" || res.status === "out") {
    if (res.reason?.includes("학업")) fb.push("성적 때문에 못 데려갔다. 나도 아쉽다. 공부도 훈련이다. 책상 앞에서 먼저 이기고 와라.");
    else if (res.reason?.includes("부상")) {
      state.advice ||= {};
      if (state.advice.injMeet == null || state.calendar.turn - state.advice.injMeet > 4) {   // 다쳐서 빠질 때마다 같은 말을 반복하지 않게
        state.advice.injMeet = state.calendar.turn;
        fb.push("다친 건 어쩔 수 없다. 조급해하지 말고 재활 제대로 하고 돌아와라. 자리는 기다려 준다.");
      }
    }
    else {
      const d = depthChart(state);
      const gap = d.list[d.slots - 1] ? d.list[d.slots - 1].ovr - ovr(p) : 0;
      fb.push(res.status === "bench" ? pick(["끝까지 못 넣어 줘서 미안하다. 벤치에서 본 것도 다 공부다.", "오늘은 못 넣었다. 대신 벤치에서 본 걸 다음 주 훈련에서 보여 줘라."])
        : pick(["이번엔 명단에서 뺐다. 서운하겠지.", "이번 주도 명단엔 못 넣었다. 대신 훈련장에선 계속 보고 있다.", "명단에 없다고 팀이 아닌 건 아니다. 다음 주 훈련에서 보여 줘라."]));
      fb.push(gap > 8 ? "앞에 선 선수들과는 아직 거리가 좀 있다. 하루아침에 좁혀지진 않는다. 대신 매일 조금씩은 좁혀진다."
        : gap > 3 ? "앞에 있는 선수들이 아직 한 걸음 앞서 있다. 그 한 걸음, 훈련장에서 좁혀 와라."
        : "솔직히 거의 다 왔다. 다음엔 네 이름을 먼저 적을지도 모른다.");
      if (state.relations.coach < 45) fb.push("그리고 단체훈련 때 좀 더 얼굴을 보여라. 나는 거기서 선수를 본다.");
    }
  }
  // 우승·준우승, 중학교 마지막 경기
  if (notes.some(n => typeof n === "string" && /우승!/.test(n))) fb.push("우승했다고 끝은 아니다. 그래도 오늘은 다 같이 웃어라. 3월의 너희랑 지금은 다른 팀이다.");
  if (fx.round === "결승" && res.result !== "승" && !(res.shootout?.win)) fb.push("결승까지 온 것도 실력이다. 은메달 걸고 다녀도 된다. 다음엔 그 한 골을 우리가 넣자.");
  const lastOfAll = res.grade === 3 && noFixtureLeft(state);
  if (lastOfAll) fb.push("중학교에서 뛰는 마지막 경기였다. 3년 동안 고흥FC 유니폼 입어 줘서 고맙다.");
  if (fb.length) mail(state, "coach", `경기 후 면담: vs ${fx.opponent.name}`, fb.join("\n\n"));
  if (res.goals > 0 && res.minutes > 0 && state.record.matches.slice(0, -1).every(x => !x.goals))
    mail(state, "mom", "첫 골 축하해!", "아빠가 단톡방 보고 거실에서 소리를 질렀어. 오늘 저녁은 네가 먹고 싶은 거로 하자.");
  if (res.status === "start" && state.record.starts === 1)
    mail(state, "dad", "첫 선발", "이름이 선발 명단 맨 위에 있더라. 아빠는 그 사진만 열 번 봤다.");
  // 코치님의 짧은 전술 메모 (가끔, 포지션과 오늘 경기에 맞춰)
  if (res.minutes > 0 && chance(0.45)) {
    const tips = {
      FW: ["수비 뒷공간 노릴 때 한 번 내려왔다가 뛰어라. 그냥 서 있으면 오프사이드 라인에 걸린다.", "슈팅은 골키퍼 보고 차는 거다. 골대 보고 차면 골키퍼 정면으로 간다.", "크로스 들어올 때 니어 포스트로 한 번 끊어 들어가라. 수비가 너를 놓친다."],
      MF: ["공 받기 전에 어깨 너머로 두 번 봐라. 등지고 받으면 뺏기기 쉽다.", "패스하고 멈추지 마라. 주고 바로 움직여야 다시 받는다.", "압박 들어오면 원터치로 빼라. 끌면 끌수록 위험해진다."],
      DF: ["라인 올릴 때 소리를 더 크게 내라. 수비는 입으로도 하는 거다.", "태클은 마지막 수단이다. 늦추고, 따라가고, 그다음에 발을 내밀어라.", "공 잡으면 첫 패스를 앞으로 줄 수 있는지부터 봐라. 옆으로만 돌리면 상대가 편해진다."],
    }[p.position] || [];
    const pre = res.result === "승" ? "이긴 경기라도 복기는 한다. " : res.result === "패" ? "진 경기는 오늘 밤 한 번만 떠올리고, 이것만 기억해 둬라. " : "";
    if (tips.length) mail(state, "assist", "영상 보고 하나만", pre + pick(tips));
  }
}

// 졸업 전까지 남은 경기가 하나도 없는지 (3학년 마지막 경기 판정용)
function noFixtureLeft(state) {
  for (let i = 1; i < 60; i++) {
    const info = turnInfo(state, i);
    if (!info) return true;
    if (info.match && stillScheduled(state, info)) return false;
  }
  return true;
}

function nextFixtureText(state) {
  for (let i = 1; i < 8; i++) {
    const info = turnInfo(state, i);
    if (!info) return null;
    if (info.match && stillScheduled(state, info)) return `${info.month}월 ${info.week}주 ${info.comp.label}${info.match.round ? ` ${info.match.round}` : ""}`;
  }
  return null;
}

// ── 주간 조언 (주 끝에 최대 두 개) ──
export function weeklyAdvice(state, rep) {
  const p = state.player;
  const out = [];
  state.advice ||= {};
  const push = (key, cd, fn) => {
    if (out.length >= 2) return;
    const last = state.advice[key];
    if (last != null && state.calendar.turn - last < cd) return;
    if (fn()) { state.advice[key] = state.calendar.turn; out.push(key); }
  };
  const s = p.stats.student;
  const hist = state.history || [];

  // 시험 예고
  const soon = [1, 2].map(i => turnInfo(state, i - 1)).find(x => x?.exam && !x.exam.free);
  push("exam", 3, () => {
    if (!soon) return false;
    const v = s.academic;
    const tier = v >= 85 ? "상위권" : v >= 70 ? "중상위권" : v >= 55 ? "중위권" : v >= 40 ? "중하위권" : "하위권";
    mail(state, "teacher", `${soon.exam.name} 안내`,
      `${soon.month}월 ${soon.week}주에 ${soon.exam.name}이 있어.\n\n지금 수업 태도랑 과제로 보면, 이대로는 ${tier} 정도가 아닐까 싶어.\n\n시험 주에 하루라도 책을 펴면 결과가 꽤 달라져. 운동부라고 봐주는 거 없다는 거 알지?${state.flags.academicLevel > 0 ? "\n\n감독님도 이번 시험 결과를 보신대." : ""}`);
    return true;
  });

  // 피로
  push("fatigue", 4, () => {
    if (p.condition.fatigue < 70) return false;
    mail(state, "mom", "요즘 너무 지쳐 보여",
      `집에 오자마자 씻지도 않고 잠들더라.\n\n코치님 말씀이 이렇게 지친 채로 훈련하면 효과도 반쯤 날아가고, 다치기도 쉽대.\n\n이번 주엔 하루라도 일찍 자. 엄마가 맛있는 거 해 줄게.`);
    return true;
  });

  // 사기
  push("morale", 5, () => {
    if (p.condition.morale >= 35) return false;
    mail(state, "mom", "괜찮니?",
      `요즘 말수가 줄었네. 경기 못 뛰어서 그러니?\n\n마음이 가라앉으면 훈련도 잘 안 된대. 이번 주엔 가족이랑 밥 한 끼 하든지, 친구들이랑 바람 좀 쐬고 와. 그래도 괜찮아.`);
    return true;
  });

  // 감독 신뢰
  push("trust", 6, () => {
    if (state.relations.coach >= 35) return false;
    const teamCnt = hist.slice(-4).flatMap(h => h.acts).filter(a => ACTIONS.find(x => x.id === a)?.cat === "team").length;
    mail(state, "assist", "감독님 눈치 좀 봐라",
      `요즘 감독님이 네 얘기를 잘 안 하신다.\n\n${teamCnt <= 1 ? "단체훈련에서 네 얼굴을 본 지가 꽤 됐다는 말씀을 하시더라." : "훈련 태도 얘기가 한 번 나왔다."} 감독님은 단체훈련에서 선수를 보신다. 같은 실력이면 믿을 만한 쪽을 내보내는 게 감독이다.`);
    return true;
  });

  // 성장 급등
  push("growth", 10, () => {
    if (!rep.body || rep.body.cm < 3.5) return false;
    mail(state, "mom", (p.body.history?.length ?? 0) > 2 ? "바지가 또 짧아졌네" : "바지가 짧아졌네",
      `이번 측정에서 ${rep.body.cm}cm나 컸다며? 지금 ${p.body.height.toFixed(1)}cm.\n\n키 클 때는 무릎이나 뒤꿈치가 아플 수 있대. 아프면 참지 말고 바로 말해. 우유는 냉장고에 있다.`);
    return true;
  });

  // 학업 하락
  push("academic", 6, () => {
    if (hist.length < 6 || s.academic >= 48 || turnInfo(state)?.vacation) return false;   // 방학에는 담임 선생님 학교 이야기 없음
    const schoolCnt = hist.slice(-6).flatMap(h => h.acts).filter(a => ACTIONS.find(x => x.id === a)?.cat === "school").length;
    mail(state, "teacher", "요즘 수업 시간에",
      `피곤한 건 알지만 수업 시간에 자주 졸더라.\n\n${schoolCnt <= 1 ? "요즘 학교 공부엔 거의 손을 안 댄 것 같더라. " : ""}이대로 가면 감독님께 연락을 드려야 할 것 같아. 그러면 대회에 못 나갈 수도 있어.\n\n일주일에 하루만이라도 책을 펴 보자. 생각보다 금방 올라.`);
    return true;
  });

  // 6주마다 훈련 점검 (코치)
  push("review", 6, () => {
    if (hist.length < 6) return false;
    const recent = hist.slice(-6).flatMap(h => h.acts);
    const cnt = { personal: 0, team: 0, school: 0, rest: 0 };
    for (const a of recent) { const c = ACTIONS.find(x => x.id === a)?.cat; if (c) cnt[c]++; }
    const keys = Object.keys(POSITIONS[p.position].weights);
    const weak = keys.slice().sort((a, b) => getPath(p.stats, a) - getPath(p.stats, b))[0];
    const drill = drillFor(weak);
    const used = drill ? recent.filter(a => a === drill.id).length : 0;
    const total = recent.length || 1;
    const lines = [];
    if (cnt.personal / total > 0.6) lines.push("요 몇 주 혼자 하는 훈련만 하더라. 열심인 건 아는데, 축구는 같이 하는 거다.");
    else if (cnt.team / total > 0.6) lines.push("단체훈련엔 빠짐없이 나왔더라. 감독님도 알고 계신다. 다만 네 것도 따로 챙겨라.");
    else lines.push("훈련은 고르게 잘 나눠 하고 있다. 그게 제일 어렵다.");
    lines.push(`네 자리에서 지금 제일 아쉬운 건 ${ida(STAT_LABEL[weak])}.${drill ? used === 0 ? ` 그런데 ${josa(drill.label, "은", "는")} 한 번도 안 했더라.` : used <= 1 ? ` ${josa(drill.label, "을", "를")} 조금 더 늘려 보자.` : " 그래도 꾸준히 채우고 있으니 곧 올라올 거다." : ""}`);
    if (cnt.rest === 0) lines.push("쉬는 날이 하나도 없었다. 몸은 쉬는 동안 자란다.");
    if (cnt.school === 0) lines.push("그리고 담임 선생님이 수업 시간 얘기를 하시더라. 공부 칸도 잊지 마라.");
    mail(state, "assist", "요즘 훈련 이야기", lines.join("\n\n"));
    return true;
  });

  // 일상 메시지 (다른 소식이 적은 주에)
  if (out.length < 2 && chance(out.length ? 0.3 : 0.6)) lifeMail(state, turnInfo(state) || {});

  // 부상 중 재활 독려
  push("rehab", 3, () => {
    const inj = p.condition.injury;
    if (!inj || rep.injury) return false;
    mail(state, "medical", "재활 경과",
      `복귀까지 약 ${Math.max(1, Math.ceil(inj.weeksLeft))}주 남았다.\n\n재활 훈련 한 칸은 회복을 1주 앞당긴다. 이 기간에 공부나 독서로 학업과 집중력을 챙겨 두는 선수들이 많다.`);
    return true;
  });
}

// 처음 받는 안내 메시지들
export function welcomeMails(state) {
  const p = state.player;
  mail(state, "mom", "첫날 어땠어?",
    `감독님 무섭지는 않았어? 저녁은 뭐 먹고 싶어?\n\n엄마는 네가 축구하는 거 응원해. 대신 공부 손 놓으면 안 되는 거 알지? 학교 성적표 나오면 같이 보자.`);
  mail(state, "assist", "1학년 생활 안내",
    [`${p.name}, ${STAFF.assistant}다. 처음이니 몇 가지만 알려 준다.`,
     "한 주는 평일 두 칸, 주말 한 칸이다. 주말에 경기가 있으면 주말 칸은 경기로 고정된다.",
     "개인훈련은 능력치를 올리고, 단체훈련은 감독님 신뢰를 올린다. 선발은 능력치 75%, 감독 신뢰 25%로 정해진다.",
     "피로가 30을 넘으면 훈련 효율이 떨어지기 시작하고, 높을수록 더 크게 떨어진다. 다칠 위험도 커진다. 수면과 가족 시간이 피로를 푼다.",
     "학업은 가만있으면 매주 조금씩 떨어진다. 40 아래로 내려가면 감독님 경고, 20 아래면 대회 출전이 막힌다.",
     `지금 ${POSITIONS[p.position].label} 자리엔 형들이 있다. 1학년은 기회가 많지 않다. 조급해하지 마라.`].join("\n\n"));
  const captain = CAPTAINS?.[1] || ROSTER.filter(r => r.cohort === "3학년선배").sort((a, b) => b.ovr - a.ovr)[0]?.name || "주장";
  mail(state, "group", "고흥FC 단톡방에 초대되었습니다",
    `${STAFF.assistant}: 신입생들 환영한다~ 3월 2주부터 주말리그 시작이다.\n\n주장 ${captain}: 1학년들 선배 보면 인사 잘하고, 축구화는 각자 챙겨라. 물통 당번은 1학년 돌아가면서 😄`);
}
