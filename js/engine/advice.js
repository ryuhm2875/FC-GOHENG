// 메시지 만들기: 경기 전 미팅, 경기 후 피드백, 주간 조언.
// 모든 문장은 지금 게임 속 숫자(능력치, 순위, 피로, 학업)를 넣어 만듭니다.
import { STAT_LABEL, POSITIONS } from "../../data/player.js";
import { ACTIONS } from "../../data/actions.js";
import { STAFF, ROSTER, CAPTAINS } from "../../data/roster.js";
import { mail, mailFrom } from "../state.js";
import { turnInfo } from "./calendar.js";
import { ovr, depthChart, teamStrength } from "./team.js";
import { sortTable, US, TEAM_NAME } from "./season.js";
import { getPath, pick } from "../rng.js";
import { conditionOf, applyGain } from "./growth.js";
import { lifeMail, afterMatchChat } from "./life.js";
import { eligibility } from "./match.js";
import { stillScheduled } from "./season.js";
import { chance } from "../rng.js";
import { isBirthdayWeek } from "./birthday.js";
import { chatText } from "./life.js";
import { aceOf, aceAbsent } from "./opponents.js";
import { ACE_TALK, COACH_TALK } from "../../data/messages.js";

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
// 상대 에이스 문장: {ace} {gw} {posw} {trait} {team} {goals}를 먼저 채우고, 나머지({mate} 등)는 단톡방 규칙으로 채움
const POSW = { FW: "공격수", MF: "미드필더", DF: "수비수" };
function aceText(state, t, ace, extra = {}) {
  const v = { ace: ace.name, gw: `${ace.grade}학년`, posw: POSW[ace.pos], trait: ace.trait || "", ...extra };
  const once = t.replace(/\{(ace|gw|posw|trait|team|goals)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => { const x = String(v[k] ?? ""); return a ? x + (has(x) ? a : b) : x; });
  return chatText(state, once);
}
const josa = (w, a, b) => w + pp(w, a, b);         // 낱말 + 조사

// 그 능력치를 가장 많이 올리는 훈련
export function drillFor(stat) {
  let best = null, v = 0;
  for (const a of ACTIONS) { const g = a.gains[stat] || 0; if (g > v) { v = g; best = a; } }
  return best;
}


// 상대 팀 성향 (이름으로 늘 같은 성향이 나옴)
// 팀마다 스타일은 고정 (같은 팀은 늘 같은 색깔), 조언 문장은 매번 골라 씀
const STYLES = [
  { label: "전방 압박이 강한 팀", stat: "tech.firstTouch", tips: ["공을 받기 전에 주변을 먼저 봐라. 원터치로 내주는 선택이 안전하다.", "이 팀은 첫 10분에 미친 듯이 뛴다. 그 시간만 버티면 뒤에 공간이 생긴다.", "골키퍼한테 돌리는 것도 겁내지 마라. 압박을 한 번 벗기면 그다음은 우리 차례다."] },
  { label: "롱볼과 높이로 밀어붙이는 팀", stat: "phys.jump", tips: ["공중볼 경합이 많을 거다. 세컨드볼 위치를 먼저 잡아라.", "머리싸움에서 지더라도 떨어지는 공은 우리가 먼저 줍자. 그게 이 경기의 반이다.", "키 큰 공격수 하나만 보고 차는 팀이다. 그 선수 등 뒤를 비우지 마라."] },
  { label: "빠른 역습을 노리는 팀", stat: "phys.speed", tips: ["공을 뺏기는 순간이 제일 위험하다. 무리한 드리블은 아껴라.", "우리가 공격할 때 한 명은 꼭 뒤에 남겨라. 이 팀은 세 번 패스로 골문 앞까지 온다.", "뺏기면 바로 반칙으로라도 끊어야 하는 순간이 온다. 그 판단은 네가 해라."] },
  { label: "공을 오래 돌리는 팀", stat: "phys.stamina", tips: ["많이 뛰어야 하는 경기다. 후반에 체력이 갈린다.", "공 쫓아다니다 지치면 지는 거다. 따라가지 말고 길목에 서 있어라.", "점유율은 줘도 된다. 대신 공을 뺏었을 때 한 번에 찔러라."] },
  { label: "몸싸움이 거친 팀", stat: "phys.strength", tips: ["부딪힐 때 버티는 쪽이 이긴다. 등지는 플레이를 조심해라.", "넘어져도 바로 일어나라. 아픈 척하면 이 팀은 더 세게 들어온다.", "몸으로 밀리면 공을 빨리 내줘라. 공이 사람보다 빠르다."] },
  { label: "측면 크로스가 많은 팀", stat: "mental.focus", tips: ["양쪽 날개가 빠르다. 크로스 올라오기 전에 박스 안 자리부터 잡아라.", "크로스는 막는 것보다 올라오기 전에 끊는 게 쉽다. 측면에서 한 발 먼저 붙어라.", "반대편 포스트를 비우지 마라. 이 팀 골은 대부분 거기서 나온다."] },
  { label: "수비를 내리고 버티는 팀", stat: "tech.pass", tips: ["공은 우리가 오래 잡을 거다. 서두르면 역습 맞는다. 옆으로 흔들다가 한 번에 찔러라.", "박스 앞에 열 명이 서 있을 거다. 중거리 하나가 경기를 연다.", "이런 팀은 한 골 먹으면 무너진다. 선제골이 전부다."] },
  { label: "에이스 한 명이 끌고 가는 팀", stat: "tech.defense", tips: ["10번 하나만 묶으면 반은 끝난다. 그 선수가 공 잡으면 두 명이 붙어라.", "그 에이스가 왼발잡이다. 오른쪽으로 몰아라.", "에이스 쪽 측면은 내버려 두지 마라. 거기로만 공이 간다."] },
];
function styleOf(name) {
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return STYLES[h % STYLES.length];
}
// 원정 길 (리그 팀 이름의 지역으로)
const TRAVEL = {
  목포: "목포까지 버스로 한 시간 반. 버스에서 자 두고, 내리면 바로 몸부터 풀자.",
  광양: "광양은 바닷바람이 세다. 긴 패스는 바람 보고 차라.",
  광주: "광주는 인조잔디다. 공이 생각보다 빨리 구른다. 첫 터치 조심.",
  순천: "순천은 가까워서 부모님들 많이 오신다. 긴장하지 말고 평소대로.",
  장흥: "장흥 운동장은 좁다. 측면이 금방 막히니 가운데로 빨리 빼라.",
  해남: "해남까지는 멀다. 아침 거르지 말고, 버스에서 간식 챙겨 먹어라.",
  영광: "영광 운동장은 잔디가 길다. 땅볼 패스가 느려지니 조금 세게.",
  여수: "여수 원정은 늘 바람이 문제다. 전반엔 바람을 등지고 뛸지 모르니 그때 몰아쳐라.",
};
const pickOr = (arr, p = 1) => (chance(p) ? pick(arr) : null);

function strengthWord(diff) {
  if (diff > 5) return "전력은 우리보다 확실히 한 수 위다";
  if (diff > 2) return "전력은 우리보다 조금 앞선다";
  if (diff > -2) return "전력은 비슷하다";
  if (diff > -5) return "전력은 해 볼 만하다";
  return "전력은 우리가 앞선다";
}

// ── 경기 전 미팅 (정 코치 분석 → 감독님 한마디 → 내 대답) ─────────────
// 메시지가 아니라 경기 직전 장면으로 보여 줍니다 (js/ui/modals.js meetingModal).
// 반환: { scene, lines: [{ who: "assist" | "coach" | "nar", t }], choices: [{ label, reply, who, buff, fx }] }
const levelWord = v => v < 45 ? "low" : v > 65 ? "high" : "mid";
// 최근 공식 경기 흐름: +n 연승, -n 연패
function streakOf(state) {
  const ms = state.record.matches.filter(x => x.official && x.minutes != null);
  let k = 0;
  for (let i = ms.length - 1; i >= 0; i--) {
    const r = ms[i].result;
    if (k === 0) { if (r === "무") break; k = r === "승" ? 1 : -1; continue; }
    if ((k > 0 && r === "승") || (k < 0 && r === "패")) k += k > 0 ? 1 : -1; else break;
  }
  return k;
}
export function meetingScript(state, fx) {
  const info = turnInfo(state);
  const p = state.player;
  const style = styleOf(fx.opponent.name);
  const d = depthChart(state);
  const L = [];
  const A = t => L.push({ who: "assist", t }), C = t => L.push({ who: "coach", t }), N = t => L.push({ who: "nar", t });
  const tour = fx.comp === "summer" || fx.comp === "winter";
  const place = tour ? pick(["대회 숙소 회의실. 선수들이 바닥에 둘러앉았다.", "숙소 식당 한쪽에 화이트보드가 세워졌다. 다들 숟가락을 내려놓는다."])
    : fx.comp === "hs" ? "고등학교 운동장 옆 그늘. 형들이 몸 푸는 소리가 들린다."
    : fx.elementary ? "운동장 벤치 앞. 초등학생들이 공을 차며 떠드는 소리가 들린다."
    : pick(["라커룸. 화이트보드에 상대 대형이 그려져 있다.", "경기 전 라커룸. 축구화 끈 묶는 소리만 들린다.", `원정 버스에서 내려 라커룸에 모였다. ${STAFF.assistant}님이 마커 뚜껑을 여신다.`, "몸 풀기 전, 다 같이 라커룸에 둘러앉았다."]);
  N(place);
  A(`${pick(["자, 다들 모여 봐라. 이번 상대 얘기 짧게 한다.", "화이트보드 봐라. 한 번만 설명한다.", "영상 몇 경기 돌려 봤다. 요점만 말한다.", "길게 안 한다. 귀만 열어 둬라."])} ${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}, 상대는 ${fx.opponent.name}.`);
  const lastVs = state.record.matches.slice().reverse().find(x => x.opponent === fx.opponent.name);
  if (lastVs && fx.comp !== "hs") A(lastVs.result === "승" ? pick([`지난번엔 ${lastVs.gf}:${lastVs.ga}${ro(lastVs.ga)} 이겼다. 저쪽도 그걸 기억하고 나온다.`, "지난 맞대결은 우리가 이겼다. 그래서 더 조심해야 한다. 갚으러 오는 팀이 제일 무섭다."])
    : lastVs.result === "패" ? pick([`지난번엔 ${lastVs.gf}:${lastVs.ga}${ro(lastVs.ga)} 졌다. 이번엔 갚아 줘야지.`, "지난 맞대결에서 졌던 거, 다들 기억하지? 같은 실수는 두 번 안 한다."])
    : pick([`지난번엔 ${lastVs.gf}:${lastVs.ga}${ro(lastVs.ga)} 비겼다. 이번엔 결판내자.`, "지난번엔 승부를 못 냈다. 이번엔 한 골 차라도 이기자."]));

  let ace = null;
  if (fx.comp === "hs") {
    const s = fx.school;
    const tierWord = { footballHS: "축구부가 탄탄한 학교", regional: "이 지역에서 손꼽히는 학교", national: "전국대회 단골인 학교", proYouth: "프로 구단 유스팀" }[s.tier];
    A(`${josa(s.name, "은", "는")} ${ida(tierWord)}. 오늘 ${s.coach}님께서 직접 보러 오셨다.`);
    const small = p.body.height < 170 || p.stats.phys.strength < 55;
    A(small ? "고등학생들은 한 뼘은 더 크고 단단하다. 정면으로 부딪히기보다 한 박자 먼저 움직여라."
      : "몸으로 밀릴 정도는 아니다. 오히려 형들한테 네 몸을 보여 줄 기회다.");
  } else if (fx.elementary) {
    A(pick(["초등학생들이라고 웃지 마라. 쟤들은 지는 걸 모른다.", "작다고 얕보다가 한 골 먹으면, 그 영상 평생 돈다. 알지?"]));
  } else {
    const ourStr = teamStrength(state, true) * 0.6 + 50 * 0.4;
    const diff = fx.opponent.strength - ourStr;
    const diffLine = diff > 5 ? pick(["솔직히 쉽지 않은 상대다. 버티는 시간이 길 거다.", "한 수 위인 팀이다. 대신 이런 팀한테 이기면 그게 오래 간다.", "전력만 보면 우리가 밀린다. 그래서 더 재미있는 경기다.", "다들 겁먹은 얼굴 하지 마라. 저쪽도 사람이다."])
      : diff > 2 ? pick(["만만치 않다. 집중력 싸움이 될 거다.", "조금 앞서는 팀이다. 실점만 늦추면 기회는 온다.", "비슷해 보여도 경험이 많은 팀이다. 흔들리지 마라."])
      : diff > -2 ? pick(["해 볼 만한 상대다. 먼저 실수하는 쪽이 진다.", "딱 우리만 한 팀이다. 누가 더 많이 뛰느냐다.", "50 대 50이다. 세트피스 하나가 갈라 놓을 거다.", "누가 먼저 한 발 더 뛰느냐. 그게 다다."])
      : pick(["우리가 할 것만 하면 된다. 그래도 방심하는 순간 뒤집힌다.", "전력은 우리가 앞선다. 이런 경기를 쉽게 이겨야 강팀이다.", "이겨야 본전인 경기다. 일찍 골 넣고 편하게 가자.", "쉬운 경기라고 생각하는 순간 어려워진다."]);
    A(`${style.label}이다. ${diffLine}`);
    const a0 = aceOf(state, fx.opponent.name);
    if (a0) {
      const team = fx.opponent.name;
      if (aceAbsent(state, team, info.turn)) A(aceText(state, pick(ACE_TALK.absent), a0, { team }));
      else {
        ace = a0;
        const memo = state.oppMemo?.[ace.name];
        const parts = [aceText(state, pick(ACE_TALK.intro), ace, { team }), aceText(state, pick(ACE_TALK.trait), ace)];
        if (memo?.goals >= 1) parts.push(aceText(state, pick(ACE_TALK.scoredBefore), ace, { goals: memo.goals }));
        else if (memo?.games && memo.grade < state.calendar.grade) parts.push(aceText(state, pick(ACE_TALK.metLastYear), ace));
        A(parts.join(" "));
      }
    }
    if (state.league && fx.comp === "league" && state.league.played > 0) {
      const rows = sortTable(state.league.table);
      const them = rows.findIndex(r => r.id === fx.opponent.id);
      const us = rows.findIndex(r => r.id === US);
      A(them < us && diff <= -2 ? pick(["순위는 저쪽이 위지만, 전력으로는 밀리지 않는다. 여기서 잡으면 판이 달라진다.", "순위표에선 우리보다 위에 있다. 그래도 붙어 보면 우리가 낫다. 증명하고 와라."])
        : them < us ? pick(["순위표에서 우리보다 위에 있는 팀이다. 여기서 잡으면 판이 달라진다.", "우리 위에 있는 팀이다. 승점 3점이 아니라 6점짜리 경기라고 생각해라."])
        : them < 3 ? pick(["요즘 기세가 좋은 팀이다.", "최근에 지는 법을 잊은 팀이다. 그 흐름을 우리가 끊자."])
        : pick(["순위는 아래지만, 그런 팀이 제일 독하게 나온다.", "순위표만 보고 들어가면 큰코다친다. 아래 있는 팀일수록 물고 늘어진다."]));
    }
    // 따로 불러서 하는 이야기
    const an = `${STAFF.assistant}님`;
    N(pick([`미팅이 끝나고 ${an}이 너를 따로 부르신다.`, `다들 일어서는데 ${an}이 네 어깨를 툭 치신다.`, `${an}이 너만 잠깐 남으라고 손짓하신다.`]));
    if (ace) {
      const mu = ACE_TALK.matchup[`${p.position}-${ace.pos}`];
      if (mu?.length) A(aceText(state, pick(mu), ace));
    }
    const lv = levelWord(getPath(p.stats, style.stat));
    const st = STAT_LABEL[style.stat];
    const isTech = String(style.stat).startsWith("tech.");
    const stLine = lv === "low" ? pick([`네 ${josa(st, "은", "는")} 아직 ${isTech ? "몸에 덜 붙었으니" : "모자라니"} 무리하지 말고.`, `${josa(st, "은", "는")} 아직 네 약점이다. 오늘은 숨기고, 잘하는 걸로 승부해라.`])
      : lv === "high" ? pick([`이런 경기에선 네 ${josa(st, "이", "가")} 오히려 무기가 된다.`, `네 ${josa(st, "이", "가")} 이 팀한테는 제일 귀찮을 거다. 마음껏 써라.`])
      : pick([`네 ${josa(st, "이", "가")} 얼마나 버텨 주느냐가 관건이다.`, `${josa(st, "은", "는")} 딱 중간이다. 오늘 경기가 그걸 끌어올릴 기회다.`]);
    let tips = style.tips;
    if (ace) tips = tips.filter(x => !x.includes("왼발잡이")).map(x => x.replace("10번 하나만", `${ace.number}번 ${ace.name} 하나만`));
    A(`${pick(tips)} ${stLine}`);
    const city = Object.keys(TRAVEL).find(c => fx.opponent.name.startsWith(c));
    if (city && fx.comp === "league" && chance(0.4)) A(TRAVEL[city]);
  }

  // 감독님: 상황에 맞는 한마디
  const sk = streakOf(state);
  const elig = eligibility(state, fx);
  const back = state.flags.returnTurn != null && info.turn - state.flags.returnTurn <= 3;
  const exam = info.exam && !info.exam.free;
  const ctx = [];
  if (fx.round === "결승") ctx.push(pick(["결승이다. 여기까지 온 것만으로 잘했다는 말은 안 하겠다. 이기러 왔다.", "결승전은 실력보다 마음이 먼저 지친다. 끝까지 우리 축구 하자.", "오늘 이기면 이 버스 타고 우승 트로피 들고 고흥 간다."]));
  else if (tour && fx.round === "조별리그 1차전") ctx.push(pick(["대회 첫 경기다. 첫 경기에서 몸이 풀리면 끝까지 간다.", "여기 오려고 합숙하면서 버텼다. 그 땀 오늘 다 꺼내 써라."]));
  else if (fx.ko) ctx.push(pick(["토너먼트다. 지면 그대로 짐 싸서 고흥 내려간다.", "오늘 지면 숙소 짐부터 싸야 한다. 그 생각만 해도 다리가 움직일 거다.", "토너먼트에서 다음은 없다. 70분 동안 후회 남기지 마라."]));
  if (sk <= -3) ctx.push(pick([`${-sk}연패다. 남 탓 하지 마라. 나부터 반성하고 있다. 오늘은 한 발씩만 더 뛰자.`, `${-sk}경기째 못 이겼다. 고개 숙이지 마라. 오늘 끊으면 된다.`]));
  else if (sk <= -2) ctx.push(pick(["두 경기 연속 졌다. 지는 데 익숙해지면 안 된다.", "연패는 오늘 여기서 끊는다. 다들 눈빛부터 바꿔라."]));
  else if (sk >= 4) ctx.push(pick([`${sk}연승이다. 이럴 때가 제일 위험하다. 들뜨는 순간 무너진다.`, `${sk}연승 했다고 상대가 알아서 져 주지 않는다. 오늘도 처음처럼.`]));
  else if (sk >= 2) ctx.push(pick(["요즘 흐름 좋다. 그 흐름은 우리가 만든 거다. 오늘도 이어 가자.", "이기는 맛 봤으면, 그 맛 잊지 마라."]));
  if (exam) ctx.push(pick(["시험 기간인데 경기까지 있다. 공부하느라 고생 많다. 오늘 70분은 축구만 생각해라.", "시험 기간에 운동장 나온 것만으로도 대단하다. 그래도 경기장에선 핑계 없다."]));
  else if (info.vacation && !tour && chance(0.5)) ctx.push(pick(["방학이라고 몸이 풀리면 안 된다. 다른 팀은 지금 이 순간에도 뛰고 있다.", "방학 동안 쌓은 게 오늘 나온다."]));
  if (back && elig.ok) ctx.push(pick(["오래 쉬었다. 오늘은 무리하지 말고 감각부터 찾아라. 네가 돌아온 것만으로 팀이 든든하다.", "다쳤던 데는 이제 괜찮지? 겁먹지 말고, 그렇다고 서두르지도 마라."]));
  if (isBirthdayWeek(state, info) && elig.ok) ctx.push("생일 주간이라며. 선물은 네가 직접 골로 챙겨라.");
  if (fx.comp === "hs") ctx.push("이런 경기 하나가 진로를 바꾸기도 한다. 이기는 것보다, 네가 어떤 선수인지 보여 주고 와라.");
  if (fx.elementary) ctx.push("이겨야 본전이다. 그래도 형답게 깔끔하게 이기고, 끝나면 악수 꼭 해라.");
  const say1 = ctx.length ? ctx.slice(0, 2).join(" ") : pick(["오늘도 우리 축구 하자. 서두르지 말고.", "준비한 대로만 해라. 결과는 내가 책임진다.", "공 없을 때 더 많이 뛰는 팀이 이긴다.", "한 명이 열 걸음 가는 것보다, 열한 명이 한 걸음씩 더 가는 게 낫다."]);
  C(say1);

  if (!elig.ok) {
    C(p.condition.injury ? pick(["넌 이번 주 재활이 먼저다. 벤치 옆에서 경기 흐름이라도 읽어 둬라.", "다친 몸으로 뛰는 건 용기가 아니다. 오늘은 보면서 배워라."])
      : "그리고… 성적 때문에 이번엔 명단에 너를 못 넣는다. 나도 아쉽다. 책상 앞에서 먼저 이기고 와라.");
  } else {
    C(d.rank <= d.slots ? pick(["오늘도 네 이름 먼저 적었다. 기대에 답해라.", "선발 명단에 네 이름 있다. 그 자리, 당연한 거 아니다.", "처음부터 뛴다. 몸 상태 숨기지 말고 말해라."])
      : d.rank <= d.slots + 2 ? pick(["벤치에서 시작할 수도 있다. 그래도 기회는 언제 올지 모른다. 준비하고 있어라.", "선발은 장담 못 한다. 대신 들어가는 순간 바로 뛸 수 있게 몸은 데워 둬라.", "주전이랑 차이가 거의 없다. 들어가면 보여 줘라."])
      : pick(["아직은 앞에 선 선수들이 많다. 오늘은 벤치에서 경기 읽는 법부터 배워라.", "이번 주는 명단이 어렵다. 대신 훈련장에서 내 눈을 붙잡아라.", "지금은 순서가 뒤다. 순서는 훈련장에서 바뀐다."]));
    const c = conditionOf(p);
    if (c.score < 50) C(`요즘 몸이 많이 무거워 보인다.${p.condition.fatigue >= 85 ? " 이 상태면 처음부터 쓰기 어렵다." : ""} 오늘 끝나면 푹 쉬어라.`);
    else if (c.score >= 85) C(pick(["몸 상태는 지금이 제일 좋다. 이럴 때 보여 줘야 한다.", "요즘 몸이 가볍다는 거 다 보인다. 그 다리로 뛰어라."]));
  }

  // 내 대답 (작은 효과: 경기 중 해당 종류 선택 성공률 조금 ↑ 등)
  const ch = [];
  const coachName = STAFF.coach, asst = STAFF.assistant;
  if (!elig.ok) {
    ch.push({ label: "\"벤치에서 목소리로 돕겠습니다\"", who: "coach", reply: "그래. 벤치도 경기장이다. 네 목소리가 들리게 해라.", fx: { coach: 1.5, morale: 2 } });
    ch.push({ label: "상대 분석 노트를 대신 정리하겠다고 한다", who: "assist", reply: "좋다. 보는 눈도 실력이다. 끝나고 같이 보자.", fx: { s: { "mental.focus": 0.4 } } });
    ch.push({ label: "말없이 고개만 끄덕인다", who: "coach", reply: "속상한 거 안다. 오늘 이 마음, 잊지 마라.", fx: { s: { "mental.competitive": 0.3 } } });
  } else {
    if (ace && (p.position === "DF" || p.position === "MF")) ch.push({ label: `"${ace.name}, 제가 막겠습니다"`, who: "coach",
      reply: pick([`좋다. ${josa(ace.name, "이", "가")} 공 잡을 때마다 네 얼굴이 보이게 해라.`, "말했으면 책임져라. 대신 혼자 다 하려고 하진 마라."]),
      buff: { tag: "defend", bonus: 0.03, label: "수비 선택 성공률 +3%p" }, fx: { coach: 1 } });
    if (p.position !== "DF") ch.push({ label: "\"오늘은 제가 골로 보여 드리겠습니다\"", who: "coach",
      reply: p.stats.mental.confidence >= 55 ? pick(["그 자신감 좋다. 대신 한 번 놓쳐도 고개 숙이지 마라.", "말한 대로 해 봐라. 기대하겠다."]) : "말은 좋다. 손이 떨리는 거 보니 아직 반은 걱정이구나. 한 번만 침착하게.",
      buff: { tag: "shoot", bonus: p.stats.mental.confidence >= 55 ? 0.03 : 0.015, label: "슈팅 선택 성공률 상승" }, fx: { morale: 3 } });
    if (p.position === "DF" && !ace) ch.push({ label: "\"뒤는 제가 책임지겠습니다\"", who: "coach", reply: "좋다. 수비가 버티면 기회는 앞에서 온다.",
      buff: { tag: "defend", bonus: 0.025, label: "수비 선택 성공률 +2.5%p" }, fx: { coach: 0.5 } });
    if (fx.comp === "hs") ch.push({ label: "\"형들한테 몸으로 안 밀리겠습니다\"", who: "assist", reply: "그 각오면 됐다. 부딪히기 전에 먼저 자리부터 잡아라.",
      buff: { tag: "physical", bonus: 0.03, label: "몸싸움 선택 성공률 +3%p" }, fx: { morale: 2 } });
    ch.push({ label: "\"지시대로 하겠습니다\"", who: "coach", reply: pick(["그래. 오늘은 그게 제일 어렵고, 제일 중요하다.", "좋다. 약속한 대로만 하면 진다고 해도 할 말 있다."]),
      buff: { tag: null, bonus: 0.015, label: "모든 선택 성공률 +1.5%p" }, fx: { coach: 0.5 } });
    ch.push({ label: `${asst}님께 궁금한 걸 여쭤본다`, who: "assist", reply: pick(["좋은 질문이다. 그런 걸 물어보는 선수가 오래 간다.", "그건 경기장에서 직접 확인해 봐라. 대신 하나만 기억해라. 공 받기 전에 한 번 더 봐라."]),
      buff: { tag: null, bonus: 0.01, label: "모든 선택 성공률 +1%p" }, fx: { s: { "mental.focus": 0.3 } } });
  }
  return { lines: L, choices: ch.slice(0, 3), coach: coachName, assistant: asst };
}

// 미팅에서 고른 대답 반영. 경기 중 효과는 state.meetingBuff에 남겨 prepareMatch가 가져감
export function applyMeeting(state, choice) {
  const p = state.player, out = [];
  const f = choice.fx || {};
  for (const [path, v] of Object.entries(f.s || {})) { const dd = applyGain(state, path, v, { raw: true }); out.push({ label: STAT_LABEL[path], d: dd }); }
  if (f.coach) { state.relations.coach = Math.min(100, Math.max(0, state.relations.coach + f.coach)); out.push({ label: "감독 신뢰", d: f.coach }); }
  if (f.morale) { p.condition.morale = Math.min(100, Math.max(0, p.condition.morale + f.morale)); out.push({ label: "사기", d: f.morale }); }
  state.meetingBuff = choice.buff ? { turn: state.calendar.turn, tag: choice.buff.tag, bonus: choice.buff.bonus, label: choice.buff.label } : null;
  return out;
}

// 경기 전 단톡방: 상대 에이스 이야기 (복수전이면 꼭, 아니면 가끔)
export function previewChat(state, fx) {
  if (fx.comp === "hs" || fx.elementary) return;
  const info = turnInfo(state);
  const ace = aceOf(state, fx.opponent.name);
  if (!ace || aceAbsent(state, fx.opponent.name, info.turn)) return;
  const memo = state.oppMemo?.[ace.name];
  const team = fx.opponent.name;
  if (memo?.goals >= 1 || chance(0.3)) mail(state, "group", `이번 주 상대: ${team}`, aceText(state, pick(memo?.goals >= 1 ? ACE_TALK.chatRevenge : ACE_TALK.chatBefore), ace, { team }));
}

// ── 경기 후: 단톡방 결과 + 감독님 피드백 ─
export function matchMails(state, m, res, notes) {
  const p = state.player, fx = m.fx;
  const scorers = side => m.goalsLog.filter(g => g.team === side).map(g => `${g.name} ${g.minute}'${g.assist ? ` (도움 ${g.assist})` : ""}`).join(", ");
  const body = [];
  body.push(fx.jn ? jnChat(state, res) : afterMatchChat(state, res, fx, res.grade === 3 && noFixtureLeft(state)));
  const aceGoals = m.oppAce ? m.goalsLog.filter(g => g.team === "them" && g.name === m.oppAce.name).length : 0;
  if (m.oppAce && aceGoals >= 1 && res.result !== "승" && chance(0.7)) body.push(aceText(state, pick(ACE_TALK.chatAfterScored), m.oppAce));
  else if (m.oppAce && aceGoals === 0 && res.ga <= 1 && chance(0.45)) body.push(aceText(state, pick(ACE_TALK.chatAfterHeld), m.oppAce));
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
  const cup = fx.jn ? state.jnCup : null;
  const nxt = cup ? (cup.alive ? `이틀 뒤 소년체전 ${["1회전", "준결승", "결승"][cup.stage]}` : null) : nextFixtureText(state);
  if (nxt) body.push(`다음 경기: ${nxt}`);
  if (cup) body.push(`${STAFF.assistant}: ${res.result === "승" ? pick(["숙소 들어가서 바로 얼음찜질. 다음 경기까지 하루밖에 없다.", "잘했다. 오늘 밤엔 휴대폰 보지 말고 일찍 자라."]) : pick(["고개 들어라. 전남에서 뽑힌 것부터가 실력이다.", "버스 타기 전에 같이 뛴 애들한테 인사하고 와라. 고등학교 가면 또 만난다."])}`);
  else body.push(`${STAFF.assistant}: ${res.result === "패" ? pick(["월요일엔 영상 보면서 실점 장면 짚고 간다.", "오늘 진 거 오늘까지만 생각해라. 월요일에 다시 시작한다.", "고개 숙이고 집에 가지 마라. 월요일에 영상 보자."])
    : res.result === "승" ? pick(["월요일은 회복 훈련. 무리하지 마라.", "오늘 잘했다. 월요일엔 가볍게 몸만 푼다.", "이긴 날일수록 일찍 자라. 월요일 회복 훈련 빠지지 말고."])
    : pick(["월요일은 회복 훈련. 무리하지 마라.", "비긴 경기는 아쉬움이 오래 간다. 월요일에 털고 가자.", "승점 1점도 소중하다. 월요일은 가볍게 간다."])}`);
  mail(state, "group", `${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}: ${fx.usName || TEAM_NAME} ${res.gf} : ${res.ga} ${fx.opponent.name}${res.shootout ? ` (승부차기 ${res.shootout.us}:${res.shootout.them})` : ""}`, body.join("\n\n"));

  for (const n of notes) if (typeof n === "object") mailFrom(state, n.from, "scout", n.title, n.body);

  // 감독님 개인 피드백: 숫자 대신 장면과 느낌으로
  const fb = [];
  if (res.minutes > 0) {
    const r = res.rating;
    const band = r >= 8.3 ? 0 : r >= 7.4 ? 1 : r >= 6.6 ? 2 : r >= 6 ? 3 : 4;
    const FEEDBACK = [
      ["오늘은 네 경기였다. 집에 가서 부모님께 자랑해도 된다.", "오늘 같은 날이 쌓이면 그게 실력이 된다. 잘했다.", "상대 감독이 경기 끝나고 네 이름을 물어보더라. 그 정도였다.",
        "오늘은 내가 따로 할 말이 별로 없다. 그게 칭찬이다.", "벤치에서 보는데 나도 모르게 일어나 있더라. 오늘 너 때문이다.", "오늘 경기 영상은 1학년들한테 보여 줄 거다. 교재로."],
      ["오늘 좋았다. 네가 있어서 팀이 편했다.", "오늘 움직임 좋았다. 공 없을 때 뛰는 게 보이더라.", "실수가 적었다. 그게 제일 어려운 거다.",
        "오늘은 믿고 볼 수 있었다. 감독한테 그것만큼 고마운 게 없다.", "자기 자리 지키면서 한 발씩 더 뛰었다. 그게 주전이다.", "오늘 같은 경기를 다섯 번만 더 하면 너를 빼는 게 어려워진다."],
      ["제 몫은 했다. 그런데 너는 그 이상을 할 수 있는 선수다.", "나쁘지 않았다. 다만 결정적인 순간에 한 번 더 용기를 내 봐라.", "무난했다. 다음엔 네가 경기를 바꾸는 장면을 하나 보여 줘라.",
        "점수로 치면 70점이다. 나머지 30점은 네가 겁낸 장면들에 있다.", "실수는 없었는데 기억나는 장면도 없다. 다음엔 하나만 남겨라.", "오늘은 팀에 맞췄다. 다음엔 팀이 너한테 맞추게 해 봐라."],
      ["오늘은 좀 조용했다. 공이 오길 기다리기만 하면 안 된다.", "공을 기다리지 말고 받으러 가라. 오늘은 그게 아쉬웠다.", "경기에 늦게 들어온 느낌이다. 첫 10분에 한 번은 공을 만져라.",
        "몸은 경기장에 있었는데 머리는 다른 데 있더라. 무슨 일 있으면 말해라.", "오늘은 네가 보이지 않았다. 다음엔 실수해도 좋으니 보이게 뛰어라.", "훈련 때 하던 게 하나도 안 나왔다. 긴장했으면 그것도 연습이다."],
      ["스스로도 알 거다. 오늘 밤은 너무 오래 곱씹지는 마라.", "이런 경기도 있다. 다음 주에 어떻게 하는지가 더 중요하다.", "오늘 일은 내가 기억할 테니, 너는 잊고 다음 경기 준비해라.",
        "다 큰 선수들도 이런 날 있다. 다만 같은 날이 두 번 연속 오면 그건 실력이다.", "화나는 거 안다. 그 화를 월요일 훈련에 써라.", "오늘 경기로 너를 판단하지 않는다. 대신 다음 경기로 판단할 거다."],
    ];
    // 결과에 맞춘 첫마디 (가끔)
    const open = res.result === "승" ? pickOr(["이긴 날은 다 좋아 보인다. 그래도 네 경기는 따로 보자.", "팀은 이겼다. 너는 어땠는지 보자."], 0.35)
      : res.result === "패" ? pickOr(["졌다. 팀 얘기는 내일 하고, 오늘은 네 얘기만 하자.", "결과는 내 책임이다. 너는 네 장면만 돌아봐라."], 0.35)
      : pickOr(["비긴 경기는 늘 아쉽다. 네 장면부터 보자."], 0.3);
    if (open) fb.push(open);
    fb.push(pick(FEEDBACK[band]));
    const firstGoal = res.goals > 0 && state.record.matches.slice(0, -1).every(x => !x.goals);
    if (res.goals > 0 && isBirthdayWeek(state, turnInfo(state))) fb.unshift("생일 주간에 골이라니. 이번 주 케이크는 네가 제일 큰 조각 먹어라.");
    if (res.goals >= 3) fb.unshift("세 골. 공에 날짜 적어서 가져가라. 그리고 내일은 다시 빈손으로 와라.");
    else if (firstGoal) fb.unshift("첫 골이구나. 오늘 밤은 마음껏 기뻐해라. 내일부터는 두 번째 골 준비다.");
    if (res.subbedOff) fb.unshift(pick(["전반 끝나고 뺀 거, 서운했을 거다. 그런데 그날은 너를 위해서도 그게 맞았다.", "하프타임에 바꾼 이유는 너도 알 거다. 다음 경기에서 내 판단이 틀렸다고 증명해라.", "교체당한 날 밤이 제일 길다. 그 밤을 어떻게 보내는지가 선수를 가른다."]));
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
        fb.push(`"${list[0].label}" 같은 장면에서 자꾸 막히더라. ${josa(STAT_LABEL[stat], "이", "가")} 아직 ${String(stat).startsWith("tech.") ? "몸에 덜 붙었다" : "모자라다"}.${drill ? ` 이번 주엔 ${josa(drill.label, "을", "를")} 조금 더 해 보자.` : ""}`);
      }
      const brave = log.find(x => x.ok && x.level === "낮음");
      if (brave) fb.push(pick([`${brave.minute}분에 "${brave.label}", 그거 아무나 하는 선택 아니다. 그런 배짱은 좋다. 다만 매번 통하진 않는다는 것도 알고.`,
        `${brave.minute}분 장면, 다들 안 될 거라고 봤을 거다. 그걸 해냈다. 그 배짱은 오래 가져가라.`]));
      const safe = log.filter(x => x.level === "높음").length;
      if (log.length >= 4 && safe === log.length && res.goals + res.assists === 0 && r < 7.4) fb.push(pick(["실수는 없었다. 그런데 상대가 무서워할 장면도 없었다. 가끔은 승부를 걸어 봐라.", "안전하게만 갔다. 그것도 실력이지만, 경기를 바꾸는 건 결국 한 번의 모험이다."]));
      const sig = log.find(x => x.ok && x.signature);
      if (sig) fb.push(pick([`"${sig.label}" 그거 연습 많이 했구나. 관중석이 다 일어나더라.`, `"${sig.label}", 경기에서 그걸 꺼낼 줄은 몰랐다. 다만 안 통하면 그게 독이 된다. 쓸 때를 골라라.`]));
    }
    if (res.involved >= 3) fb.push(m.star >= 1 ? pick(["상대가 너만 따라다니는데도 계속 공에 관여하더라. 이제 다들 너를 안다.", "두 명이 붙어도 공을 지키더라. 이제 상대 감독들이 너부터 막으라고 할 거다."])
      : pick(["공이 너를 거쳐 가는 일이 많아졌다. 팀이 너를 찾기 시작했다는 뜻이다.", "동료들이 공 잡으면 너부터 보더라. 믿음은 그렇게 쌓이는 거다."]));
    if (res.stops >= 2) fb.push(pick(["뒤에서 몇 번이나 끊어 줬다. 그런 건 기록에 안 남아도 감독은 다 본다.", "궂은일 많이 했다. 골 넣은 애들보다 네 이름을 먼저 부르고 싶다.",
      ...(res.ga === 0 ? ["오늘 실점 안 한 건 네가 몇 번 막아 준 덕이 크다."] : [])]));
    if (m.oppAce) {
      const guard = (p.position === "DF" && ["FW", "MF"].includes(m.oppAce.pos)) || (p.position === "MF" && ["MF", "FW"].includes(m.oppAce.pos));
      if (aceGoals >= 2 && ["DF", "MF"].includes(p.position)) fb.push(aceText(state, pick(ACE_TALK.coachScored), m.oppAce, { goals: aceGoals }));
      else if (aceGoals === 0 && guard && res.minutes >= 45 && res.result !== "패") fb.push(aceText(state, pick(res.result === "승" ? ACE_TALK.coachHeldWin : ACE_TALK.coachHeldDraw), m.oppAce));
    }
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
    mail(state, "mom", "첫 골 축하해!", "아빠가 단톡방 보고 거실에서 소리를 질렀어. 오늘 저녁은 네가 먹고 싶은 걸로 하자.");
  if (res.status === "start" && state.record.starts === 1)
    mail(state, "dad", "첫 선발", "이름이 선발 명단 맨 위에 있더라. 아빠는 그 사진만 열 번 봤다.");
  // 코치님의 짧은 전술 메모 (가끔, 포지션과 오늘 경기에 맞춰)
  if (res.minutes > 0 && chance(0.45)) {
    const tips = {
      FW: ["수비 뒷공간 노릴 때 한 번 내려왔다가 뛰어라. 그냥 서 있으면 오프사이드 라인에 걸린다.", "슈팅은 골키퍼 보고 차는 거다. 골대 보고 차면 골키퍼 정면으로 간다.", "크로스 들어올 때 니어포스트로 한 번 끊어 들어가라. 수비가 너를 놓친다.",
        "공 없을 때 수비수 등 뒤에 숨어 있다가 튀어나와라. 수비는 안 보이는 선수를 제일 무서워한다.", "슈팅 전에 고개를 한 번만 들어라. 두 번 들면 늦는다.", "골 못 넣은 날도 수비 한 번 더 해 주면 감독님은 그걸 기억하신다."],
      MF: ["공 받기 전에 어깨 너머로 두 번 봐라. 등지고 받으면 뺏기기 쉽다.", "패스하고 멈추지 마라. 주고 바로 움직여야 다시 받는다.", "압박 들어오면 원터치로 빼라. 끌면 끌수록 위험해진다.",
        "몸을 반쯤 열고 받아라. 그래야 앞도 뒤도 다 보인다.", "공격할 때 박스 안까지 한 번은 들어가라. 미드필더 골이 경기를 바꾼다.", "패스 길이 안 보이면 공을 쥐고 기다려도 된다. 동료가 길을 만들어 준다."],
      DF: ["라인 올릴 때 소리를 더 크게 내라. 수비는 입으로도 하는 거다.", "태클은 마지막 수단이다. 늦추고, 따라가고, 그다음에 발을 내밀어라.", "공 잡으면 첫 패스를 앞으로 줄 수 있는지부터 봐라. 옆으로만 돌리면 상대가 편해진다.",
        "공을 보지 말고 상대 골반을 봐라. 공은 속여도 골반은 못 속인다.", "크로스 막을 때 몸을 공 쪽으로 반만 돌려라. 다 돌리면 뒤로 누가 뛰는지 못 본다.", "실점은 수비 한 명 잘못이 아니다. 그러니 다음 공에서는 고개 들고 소리부터 내라."],
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

// 전남 대표 경기를 고흥에서 지켜본 친구들 단톡방
function jnChat(state, res) {
  const win = res.result === "승";
  return chatText(state, pick(win ? [
    "{mate}: 소년체전 중계 봤냐?? {name} 전남 유니폼 입은 거 실화냐 ㅋㅋ\n\n{mentor}: 고흥 이름 걸고 뛰는 거다. 잘했다",
    "{friend}: 반 애들 다 같이 봄 ㅋㅋㅋ 선생님도 보심\n\n{mate}: 다음 경기도 이겨라!!",
    "{mate2}: 전남 대표 이겼다 ㅋㅋ 우리 학교에서 나간 애가 뛰고 있음\n\n{mate}: 돌아오면 사인 받자",
  ] : [
    "{mate}: 고생했다… 전남 대표까지 간 것만 해도 대단한 거임\n\n{mentor}: 돌아오면 다시 우리 팀에서 보자",
    "{friend}: 졌다고 기죽지 마라. 고흥에서 너만큼 간 애 없음\n\n{mate2}: ㄹㅇ",
  ]));
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
      `요즘 말수가 줄었네. 경기 못 뛰어서 그러니?\n\n마음이 가라앉으면 훈련도 잘 안 된대. 이번 주엔 아빠랑 셋이 외식하든지, 친구들이랑 바람 좀 쐬고 와. 그래도 괜찮아.`);
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
    if (cnt.school === 0 && !turnInfo(state)?.vacation) lines.push("그리고 담임 선생님이 수업 시간 얘기를 하시더라. 공부 칸도 잊지 마라.");
    mail(state, "assist", "요즘 훈련 이야기", lines.join("\n\n"));
    return true;
  });

  // 상황에 맞는 감독님·코치님 메시지 (연패, 연승, 부상 복귀, 시험 주간, 대회 직전, 방학, 학업 우수)
  const now = turnInfo(state);
  const sk = streakOf(state);
  const recent = state.record.matches.filter(x => x.official).slice(-3);
  const lastM = state.record.matches.at(-1), fresh = lastM && lastM.turn >= state.calendar.turn - 1;
  const myApps = state.record.matches.filter(x => x.minutes > 0).slice(-5);
  const ctxKey = !now ? null
    : now.grade === 3 && ((now.month === 2) || (now.month === 1 && now.week >= 3)) && !state.flags.lastDaysMail ? "lastDays"
    : now.grade >= 2 && now.month === 3 && now.week === 1 ? "newYear"
    : fresh && lastM.gf - lastM.ga >= 3 ? "afterBigWin"
    : fresh && lastM.ga - lastM.gf >= 3 ? "afterBigLoss"
    : sk <= -3 ? "lossStreak"
    : sk >= 4 ? "winStreak"
    : state.flags.returnTurn != null && state.calendar.turn - state.flags.returnTurn <= 1 ? "comeback"
    : now.exam && !now.exam.free ? "examWeek"
    : (now.month === 7 && now.week === 4) || (now.month === 1 && now.week === 3) ? "preTournament"
    : (now.month === 7 && now.week === 3) || (now.month === 1 && now.week === 2) ? "vacation"
    : s.academic >= 80 && !state.flags.academicPraise?.[`${now.grade}-${now.semester}`] ? "scholar"
    : recent.length === 3 && recent.every(x => x.status !== "start") && !p.condition.injury ? "benchLong"
    : p.position === "FW" && myApps.length === 5 && myApps.every(x => !x.goals) ? "goalDrought" : null;
  if (ctxKey) push(`ctx_${ctxKey}`, ctxKey === "examWeek" ? 3 : ["benchLong", "goalDrought"].includes(ctxKey) ? 8 : 6, () => {
    const pool = COACH_TALK[ctxKey];
    const used = (state.advice.ctxUsed ||= {});
    const cand = pool.filter((_, i) => !(used[ctxKey] || []).includes(i));
    const list = cand.length ? cand : pool;
    if (!cand.length) used[ctxKey] = [];
    const t = pick(list);
    (used[ctxKey] ||= []).push(pool.indexOf(t));
    if (ctxKey === "lastDays") state.flags.lastDaysMail = true;
    if (ctxKey === "scholar") (state.flags.academicPraise ||= {})[`${now.grade}-${now.semester}`] = true;
    mail(state, t.from, t.title, t.body);
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
    [`${p.name}, ${ida(STAFF.assistant)}. 처음이니 몇 가지만 알려 준다.`,
     "한 주는 평일 두 칸, 주말 한 칸이다. 주말에 경기가 있으면 주말 칸은 경기로 고정된다.",
     "개인훈련은 능력치를 올리고, 단체훈련은 감독님 신뢰를 올린다. 선발은 능력치 75%, 감독 신뢰 25%로 정해진다.",
     "피로가 30을 넘으면 훈련 효율이 떨어지기 시작하고, 높을수록 더 크게 떨어진다. 다칠 위험도 커진다. 수면과 가족 시간이 피로를 푼다.",
     "학업은 가만있으면 매주 조금씩 떨어진다. 40 아래로 내려가면 감독님 경고, 20 아래면 대회 출전이 막힌다.",
     `지금 ${POSITIONS[p.position].label} 자리엔 형들이 있다. 1학년은 기회가 많지 않다. 조급해하지 마라.`].join("\n\n"));
  const captain = CAPTAINS?.[1] || ROSTER.filter(r => r.cohort === "3학년선배").sort((a, b) => b.ovr - a.ovr)[0]?.name || "주장";
  mail(state, "group", "고흥FC 단톡방에 초대되었습니다",
    `${STAFF.assistant}: 신입생들 환영한다~ 3월 2주부터 주말리그 시작이다.\n\n주장 ${captain}: 1학년들 선배 보면 인사 잘하고, 축구화는 각자 챙겨라. 물통 당번은 1학년 돌아가면서 😄`);
}
