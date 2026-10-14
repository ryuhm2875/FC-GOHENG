// 감독님 주간 지시: 한 주에 하나. 지시한 훈련을 한 칸이라도 하면 감독 신뢰가 오르고,
// 그 주 경기에서 지시와 맞는 선택의 성공률이 조금 오름. 세 주 연속으로 무시하면 따로 부름
import { ACTIONS } from "../../data/actions.js";
import { POSITIONS, STAT_LABEL } from "../../data/player.js";
import { mail } from "../state.js";
import { turnInfo } from "./calendar.js";
import { styleOf } from "./advice.js";
import { pick, getPath, rand } from "../rng.js";

// 능력치 → 경기 선택 태그 (match.js choiceTag와 같은 이름)
const TAG_OF = {
  "tech.shoot": "shoot", "tech.pass": "pass", "tech.cross": "pass", "tech.dribble": "dribble", "phys.agility": "dribble",
  "phys.speed": "dribble", "tech.defense": "defend", "phys.strength": "physical", "phys.jump": "physical",
};

// 상대 성향에 맞춘 지시 (advice.js STYLES의 stat과 짝)
const VS_STYLE = {
  "tech.firstTouch": ["주말 상대는 전방 압박이 세다. 공 받을 때 첫 터치에서 다 갈린다.", "주말에 붙을 팀은 앞에서부터 몰아붙인다. 받기 전에 보는 습관, 이번 주에 들여라."],
  "phys.jump": ["주말 상대는 롱볼로 밀어붙인다. 공중볼에서 밀리면 끝이다.", "이번 주 상대는 키 큰 공격수 하나 보고 차는 팀이다. 머리싸움 준비해 둬라."],
  "phys.speed": ["주말 상대는 역습이 빠르다. 한 발 늦으면 바로 실점이다.", "이번 주 상대는 세 번 패스로 골문까지 온다. 발을 키워 둬라."],
  "phys.stamina": ["주말 상대는 공을 오래 돌린다. 후반에 다리 남아 있는 쪽이 이긴다.", "이번 주는 많이 뛰는 경기가 된다. 체력부터 채워라."],
  "phys.strength": ["주말 상대는 몸싸움이 거칠다. 부딪혀서 버텨야 한다.", "이번 주 상대는 밀어붙이는 팀이다. 몸 만들어 둬라."],
  "mental.focus": ["주말 상대는 측면 크로스가 많다. 박스 안에서 한순간도 놓치지 마라.", "이번 주 상대는 집중력 싸움이다. 머리부터 정리해 둬라."],
  "tech.pass": ["주말 상대는 내려앉아 버틴다. 패스 한 번으로 열어야 한다.", "이번 주 상대는 박스 앞에 다 서 있을 거다. 찔러 주는 패스 연습해 둬라."],
  "tech.defense": ["주말 상대는 에이스 하나가 다 한다. 그 선수를 묶어야 한다.", "이번 주 상대 10번, 혼자 경기를 끌고 다닌다. 수비 훈련 빼먹지 마라."],
};
// 경기가 없는 주: 내 포지션 능력치 중 아쉬운 것
const PLAIN = {
  "tech.shoot": "슈팅이 골문 앞에서 자꾸 뜬다. 이번 주는 슈팅 훈련 빼먹지 마라.",
  "tech.pass": "패스가 반 박자씩 늦다. 이번 주는 패스에 시간 써라.",
  "tech.dribble": "공 잡으면 자꾸 뒤로 돌린다. 한 명은 제칠 줄 알아야 한다.",
  "tech.firstTouch": "첫 터치가 길다. 공이 발에서 떨어지면 아무것도 못 한다.",
  "tech.defense": "수비 가담이 아쉽다. 공 없을 때 네가 뭘 하는지 보고 있다.",
  "phys.speed": "뒷공간 싸움에서 한 발씩 늦는다. 스프린트 해 둬라.",
  "phys.stamina": "후반 20분이 되면 발이 멈춘다. 체력 훈련 해라.",
  "phys.strength": "부딪히면 자꾸 넘어진다. 웨이트 거르지 마라.",
  "phys.jump": "공중볼을 계속 내준다. 점프 타이밍부터 다시 잡아라.",
  "mental.teamwork": "혼자 하려는 게 보인다. 이번 주는 동료랑 맞추는 훈련을 해라.",
  "mental.focus": "경기 중에 멍해지는 순간이 있다. 전술 훈련 들어와서 머리 써라.",
};

const doable = (state, allowed, stat) => ACTIONS
  .filter(a => (a.gains?.[stat] || 0) >= 0.6 && a.injured !== "only" && allowed(state, a).ok)
  .sort((a, b) => b.gains[stat] - a.gains[stat]).map(a => a.id);

function build(state, allowed, fx) {
  const p = state.player, info = turnInfo(state);
  const mk = (kind, stat, acts, text) => acts.length ? { turn: state.calendar.turn, kind, stat, tag: TAG_OF[stat] || null, acts, text } : null;
  if (p.condition.injury) {
    const acts = ["rehab"].filter(id => allowed(state, ACTIONS.find(a => a.id === id)).ok);
    return mk("rehab", null, acts, "지금은 재활이 훈련이다. 급하게 돌아오면 더 오래 쉰다.");
  }
  if (p.condition.fatigue >= 76)
    return mk("rest", null, ["sleep", "family", "hobby"].filter(id => allowed(state, ACTIONS.find(a => a.id === id)).ok),
      pick(["얼굴이 반쪽이다. 이번 주 하루는 푹 쉬어라. 쉬는 것도 지시다.", "지친 몸으로 뛰면 다친다. 하루는 일찍 자라."]));
  if (info.exam && !info.exam.free && p.stats.student.academic < 75)
    return mk("study", "student.academic", doable(state, allowed, "student.academic"),
      pick(["시험 주다. 하루는 책 펴라. 성적 떨어지면 나도 못 데려간다.", "이번 주 시험이지? 담임 선생님께 연락 오는 일 없게 해라."]));
  if (fx?.opponent && !fx.jn && fx.comp !== "hs") {
    const st = styleOf(fx.opponent.name);
    const acts = doable(state, allowed, st.stat);
    if (acts.length && VS_STYLE[st.stat]) return mk("vs", st.stat, acts, pick(VS_STYLE[st.stat]));
  }
  // 포지션 능력치 가운데 가장 낮은 것 (가끔은 둘째로 낮은 것)
  const keys = Object.keys(POSITIONS[p.position].weights).filter(k => PLAIN[k]).sort((a, b) => getPath(p.stats, a) - getPath(p.stats, b));
  const stat = keys[rand() < 0.7 ? 0 : 1] || keys[0];
  return mk("plain", stat, doable(state, allowed, stat), PLAIN[stat]);
}

// 이번 주 지시가 없으면 만듦 (화면에서도 부름)
export function ensureOrder(state, allowed, fx) {
  if (state.finished) return null;
  if (state.order?.turn === state.calendar.turn) return state.order;
  state.order = build(state, allowed, fx) || { turn: state.calendar.turn, none: true };
  return state.order;
}

// 한 주가 끝날 때: 지시를 따랐는지 판정. 돌려주는 값은 주간 결과에 붙일 한 줄
export function judgeOrder(state, chosenIds) {
  const o = state.order;
  if (!o || o.none || o.turn !== state.calendar.turn) return null;
  const ok = chosenIds.some(id => o.acts.includes(id));
  o.done = ok;
  const log = state.orderLog ||= { kept: 0, missed: 0, streakMiss: 0, streakKept: 0 };
  if (ok) {
    log.kept++; log.streakKept++; log.streakMiss = 0;
    const up = o.kind === "vs" || o.kind === "plain" ? 0.4 : 0.2;     // 쉬기·재활·공부 지시는 따르기 쉬우니 조금만
    state.relations.coach = Math.min(100, state.relations.coach + up);
    if (log.streakKept === 5) {
      state.relations.coach = Math.min(100, state.relations.coach + 1.5);
      mail(state, "coach", "요즘 보기 좋다", "말한 걸 그대로 해 오는 선수가 생각보다 드물다. 너는 그걸 다섯 주째 하고 있다.\n\n계속 그렇게만 해라. 기회는 그런 선수한테 먼저 간다.");
    }
    return { ok: true, text: `📋 감독님 지시를 따랐다. 감독 신뢰 +${up}` + (o.tag || o.kind === "vs" ? ", 이번 경기 관련 선택 성공률 상승" : "") };
  }
  log.missed++; log.streakMiss++; log.streakKept = 0;
  state.relations.coach = Math.max(0, state.relations.coach - 0.3);
  if (log.streakMiss >= 3 && state.calendar.turn - (log.lastCall ?? -99) >= 12) {
    log.lastCall = state.calendar.turn;
    state.relations.coach = Math.max(0, state.relations.coach - 1);
    mail(state, "coach", "끝나고 잠깐 보자", "세 주째 내가 한 말이 너한테 안 들어가는 것 같다.\n\n네 생각이 있으면 말로 해라. 말없이 다른 걸 하는 건 생각이 아니라 고집이다.");
  }
  return { ok: false, text: `📋 감독님 지시(${o.stat ? STAT_LABEL[o.stat] || "" : o.kind === "rest" ? "휴식" : "재활"})를 따르지 않았다. 감독 신뢰 −0.3` };
}
// 경기 보너스는 match.js prepareMatch의 order에서 (같은 값: 태그 맞으면 +3%p, 태그 없으면 모든 선택 +1.5%p)
