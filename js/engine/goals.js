// 중간 목표 (중2부터): 전남 대표 선발, 우수선수상, 주장 후보, 스카우트의 관심, 지역 신문 인터뷰
// 이벤트는 data/events.js의 goal_* 이벤트. 여기서는 조건 확인과 진행 상황, 이벤트 예약을 맡습니다.
import { GOALS, GOAL_ORDER } from "../../data/goals.js";
import { ovr } from "./team.js";
import { mail } from "../state.js";
import { STAFF } from "../../data/roster.js";

export const goalsOf = state => (state.goals ||= { main: null, done: {}, failed: {}, queue: [] });
const yearMatches = (state, g = state.calendar.grade) => state.record.matches.filter(m => m.grade === g);

// 전남 대표 선발 점수: 능력치 + 올해 경기 평점 + 감독 신뢰
export function jnScore(state) {
  const ms = yearMatches(state).filter(m => m.rating != null && m.official);
  const avg = ms.length ? ms.reduce((a, m) => a + m.rating, 0) / ms.length : 6.4;
  return ovr(state.player) + (avg - 6.6) * 6 + (state.relations.coach - 50) * 0.08 + (state.flags.jnBoost || 0);
}
export const JN_NEED = { 2: 61, 3: 75 };          // 이 점수를 넘기면 선발 (중3은 경쟁이 훨씬 세다)
export const AWARD_NEED = { 2: 4, 3: 12 };        // 한 해 경기 최우수 선수 횟수
export const NEWS_NEED = { 2: { FW: 20, MF: 12, DF: 6 }, 3: { FW: 40, MF: 24, DF: 12 } };   // 한 해 공격 포인트
export const CAP_NEED = { coach: 72, teamwork: 64 };
const gr = g => Math.min(3, Math.max(2, g));
export const JN_CALL = 5;                          // 선발 기준보다 이만큼 낮아도 선발전에는 불려 감

// 진행 상황 (홈 화면용): { id, label, icon, desc, state: "done" | "fail" | "open", text, main }
export function goalProgress(state) {
  const G = goalsOf(state), p = state.player, g = state.calendar.grade;
  const ys = yearMatches(state);
  return GOAL_ORDER.map(id => {
    const d = GOALS[id];
    let text = "";
    if (id === "jn") text = `선발 점수 ${Math.round(jnScore(state))} / 기준 ${JN_NEED[gr(g)]} (4월 선발전)`;
    if (id === "award") text = `올해 최우수 선수 ${ys.filter(m => m.mom).length} / ${AWARD_NEED[gr(g)]}번`;
    if (id === "captain") text = `감독 신뢰 ${Math.round(state.relations.coach)} / ${CAP_NEED.coach} · 팀워크 ${Math.round(p.stats.mental.teamwork)} / ${CAP_NEED.teamwork}`;
    if (id === "scout") { const best = Math.max(0, ...ys.filter(m => m.rating != null).map(m => m.rating)); text = best ? `올해 최고 평점 ${best.toFixed(1)} (고교 연습경기 7.8 · 토너먼트 8.3)` : "아직 기록 없음"; }
    if (id === "news") text = `올해 공격 포인트 ${ys.reduce((a, m) => a + m.goals + m.assists, 0)} / ${NEWS_NEED[gr(g)][p.position]} (또는 전국대회 우승)`;
    const st = G.done[id] ? "done" : G.failed[id] ? "fail" : "open";
    return { id, ...d, state: st, text, main: G.main === id };
  });
}

// 목표를 이뤘을 때. 가장 이루고 싶었던 목표면 보상이 조금 더 큼
export function achieve(state, id) {
  const G = goalsOf(state);
  if (G.done[id]) return false;
  G.done[id] = state.calendar.turn;
  delete G.failed[id];
  if (G.main === id) {
    state.player.condition.morale = Math.min(100, state.player.condition.morale + 8);
    state.relations.coach = Math.min(100, state.relations.coach + 3);
    mail(state, "coach", `목표를 이뤘다: ${GOALS[id].label}`, `3월에 네가 말한 목표였지. 해냈다.\n\n목표는 이루는 순간 다음 목표가 된다. 오늘까지만 기뻐하고, 내일은 다시 처음이다.`);
  }
  return true;
}

// 주 끝에 확인: 조건을 채운 목표의 이벤트를 예약 (실제로 보여 주는 건 events.js rollEvent)
export function goalsWeekly(state, info) {
  if (!info || info.grade < 2) return;
  const G = goalsOf(state), p = state.player;
  const q = G.queue;
  const push = id => { if (!q.includes(id)) q.push(id); };
  const last = state.record.matches.at(-1);
  const recent = last && last.turn >= state.calendar.turn - 1 ? last : null;
  // 스카우트의 관심
  if (!G.done.scout && !G.flags?.scout && recent?.rating != null && ((recent.compId === "hs" && recent.rating >= 7.8) || (recent.ko && recent.rating >= 8.3))) {
    (G.flags ||= {}).scout = true; push("goal_scout");
  }
  // 지역 신문 인터뷰: 올해 공격 포인트 10개 또는 우승
  const ys = yearMatches(state);
  const pts = ys.reduce((a, m) => a + m.goals + m.assists, 0);
  const lastYear = info.month === 3 && info.week === 1;      // 새 학년 첫 주에는 지난 학년 기록으로 한 번 더 확인
  const yg = lastYear ? info.grade - 1 : info.grade;
  const ysN = lastYear ? yearMatches(state, yg) : ys;
  const ptsN = lastYear ? ysN.reduce((a, m) => a + m.goals + m.assists, 0) : pts;
  const title = state.record.titles.some(t => t.grade === yg && t.national);
  const needN = NEWS_NEED[gr(yg)]?.[p.position] ?? 99;
  if (yg >= 2 && !G.done.news && !G.flags?.news && (ptsN >= needN || title)) { (G.flags ||= {}).news = title && ptsN < needN ? "title" : "points"; push("goal_news"); }
  // 주장 후보: 중2 2학기부터 (중3 3월 2주 선거 전까지)
  const before = info.grade === 2 ? info.semester === 2 || [1, 2].includes(info.month) : info.grade === 3 && info.month === 3 && info.week <= 1;
  if (!G.done.captain && !G.flags?.captain && before && state.relations.coach >= CAP_NEED.coach && p.stats.mental.teamwork >= CAP_NEED.teamwork) {
    (G.flags ||= {}).captain = true; push("goal_captain");
  }
  // 가장 이루고 싶은 목표가 마감까지 안 됐을 때 (실패 면담)
  const m = G.main;
  if (m && !G.done[m] && !G.failed[m]) {
    const dead = { jn: info.grade === 3 && info.month === 5 && info.week === 1,
      award: info.grade === 3 && info.month === 11 && info.week === 3,
      captain: info.grade === 3 && info.month === 3 && info.week === 3,
      scout: info.grade === 3 && info.month === 11 && info.week === 2,
      news: info.grade === 3 && info.month === 12 && info.week === 2 }[m];
    if (dead) { G.failed[m] = state.calendar.turn; push("goal_fail"); }
  }
}

// 이번 주 정해진 날에 꼭 나오는 목표 이벤트 (없으면 null)
export function fixedGoalEvent(state, info) {
  if (!info || info.grade < 2) return null;
  const G = goalsOf(state);
  const at = (mo, w) => info.month === mo && info.week === w;
  // 목표 면담: 중2 3월 3주. 예전 저장 파일처럼 그 주가 이미 지나갔으면 다음 주에 바로
  const after33 = info.grade === 3 || !(info.month === 3 && info.week < 3);
  const tooLate = info.grade === 3 && (info.month >= 9 || info.month <= 2);
  if (!G.metAt && !G.main && after33 && !tooLate && !info.exam) return "goal_meeting";
  if (info.grade === 2 && at(9, 2) && !G.checkAt) return "goal_check";
  // 전남 대표: 4월 1주 선발전 명단 → 4월 3주 발표 → 5월 2주 전국소년체전 (예전 저장 파일은 4월 2주·4주까지 기다려 줌)
  if ((at(4, 1) || at(4, 2)) && !G.done.jn && !(G.jnCalled?.[info.grade])) {
    if (jnScore(state) >= JN_NEED[info.grade] - JN_CALL) return "goal_jn_call";
    if (G.main === "jn" && !(G.jnMissed?.[info.grade])) {
      (G.jnMissed ||= {})[info.grade] = true;
      mail(state, "coach", "전남 대표 선발전 명단", `이번 선발전 명단에 네 이름은 없었다.\n\n${info.grade === 2 ? "내년에 한 번 더 기회가 있다. 그때는 내가 먼저 네 이름을 적게 만들어라." : "속상하겠지만 여기서 멈추면 안 된다. 고등학교에도 대표팀은 있다."}`);
    }
  }
  if ((at(4, 3) || at(4, 4) || at(6, 1)) && G.jnCalled?.[info.grade] && !G.jnResult?.[info.grade]) {
    const sc = jnScore(state);
    G.jnOutcome = sc >= JN_NEED[info.grade];
    G.jnLast = Math.round(sc);
    state.flags.jnBoost = 0;                       // 선발전 준비 효과는 그해 한 번만
    return "goal_jn_result";
  }
  if (at(11, 2) && !G.done.award && !(G.awardSeen?.[info.grade])) {
    const ys = yearMatches(state).filter(m => m.mom).length;
    if (ys >= AWARD_NEED[info.grade]) return "goal_award";
    if (G.main === "award") {
      (G.awardSeen ||= {})[info.grade] = true;
      mail(state, "coach", "올해 우수선수상", `올해 우수선수상은 다른 학교 선수가 받았다. 너는 최우수 선수 ${ys}번. 조금 모자랐다.${info.grade === 2 ? "\n\n내년에 한 번 더 기회가 있다." : ""}`);
    }
  }
  return null;
}
