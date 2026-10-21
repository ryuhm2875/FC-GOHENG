// 다른 학교 맞수: 같은 학년의 다른 팀 핵심 선수 (data/world.js OPPONENT_STARS의 "동기")
// 처음엔 리그에서 만나는 지역 맞수, 내가 전국 수준(종합 66 이상, 중2부터)이 되면 전국 최강 군포FC의 동갑내기로 바뀜
import { OPPONENT_STARS, LEAGUE_OPPONENTS, NATIONAL_OPPONENTS } from "../../data/world.js";
import { mail } from "../state.js";
import { ovr } from "./team.js";
import { pick } from "../rng.js";

export const NATIONAL_TEAM = "군포FC U-15";
export const NATIONAL_OVR = 66;
const POS_KO = { FW: "공격수", MF: "미드필더", DF: "수비수" };
const has = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
const j = (w, a, b) => w + (has(w) ? a : b);

const sameYear = team => (OPPONENT_STARS[team] || []).filter(r => r[0] === "동기").map(r => ({ team, pos: r[1], name: r[2], trait: r[3] }))[0] || null;

// 지역 맞수: 리그 팀의 동갑내기 중 나와 같은 포지션, 그중 강한 팀
function regionalPick(state) {
  const p = state.player;
  const cands = LEAGUE_OPPONENTS.map(t => ({ t, s: sameYear(t.name) })).filter(x => x.s);
  const same = cands.filter(x => x.s.pos === p.position).sort((a, b) => b.t.strength - a.t.strength);
  const c = same[0] || cands.sort((a, b) => b.t.strength - a.t.strength)[0];
  return c?.s || null;
}

// 매주 확인: 중1 4월부터 지역 맞수, 조건이 되면 전국 맞수로
export function nemesisWeekly(state, info) {
  if (!info) return;
  const p = state.player;
  if (!state.nemesis && (info.grade > 1 || info.month >= 4 && info.month <= 12)) {
    const s = regionalPick(state);
    if (!s) return;
    state.nemesis = { ...s, level: "region", since: state.calendar.turn, log: [] };
    mail(state, "assist", "그 녀석 이름 기억해 둬라",
      `${s.team}의 ${s.name}. 너랑 동갑이고 ${POS_KO[s.pos]}다. 장점은 ${s.trait}.\n\n${s.pos === p.position ? "같은 포지션이라 앞으로 계속 비교될 거다." : "포지션은 달라도 경기장에서 자주 부딪힐 거다."} 리그에서 1년에 몇 번씩 만난다. 그때마다 한 번은 이겨 봐라.`);
    return;
  }
  const n = state.nemesis;
  if (n && n.level === "region" && info.grade >= 2 && ovr(p) >= NATIONAL_OVR) {
    const s = sameYear(NATIONAL_TEAM);
    if (!s) return;
    state.nemesis = { ...s, level: "national", since: state.calendar.turn, log: n.log, prev: { team: n.team, name: n.name } };
    mail(state, "coach", "이제 전국을 봐라",
      `요즘 네 경기를 보면 지역에서는 맞수가 없다. ${j(n.name, "이도", "도")} 이제 너를 따라오느라 바쁘다.\n\n${NATIONAL_TEAM}의 ${s.name}. 너랑 동갑이고 전국에서 제일 잘한다는 ${POS_KO[s.pos]}다. 장점은 ${s.trait}. 전국대회에 가면 결국 그 팀을 넘어야 한다.\n\n이름 외워 둬라.`);
  }
}

export const nemesisOf = (state, team) => state.nemesis && state.nemesis.team === team ? state.nemesis : null;

// 맞대결이 끝난 뒤 기록과 짧은 메일
export function nemesisAfter(state, fx, res, m) {
  const n = nemesisOf(state, fx.opponent?.name);
  if (!n || !m.nemesisOn || !(res.minutes > 0)) return null;                     // 내가 뛴 경기만
  const his = m.goalsLog.filter(g => g.team === "them" && g.name === n.name).length;
  const rec = { turn: state.calendar.turn, grade: state.calendar.grade, comp: fx.compLabel, round: fx.round || null, team: n.team, name: n.name,
    gf: res.gf, ga: res.ga, result: res.result, rating: res.rating, goals: res.goals, assists: res.assists, his };
  n.log.push(rec);
  const W = n.log.filter(x => x.name === n.name && x.result === "승").length, L = n.log.filter(x => x.name === n.name && x.result === "패").length;
  const score = `${j(n.name, "과", "와")}의 맞대결 ${W}승 ${n.log.filter(x => x.name === n.name).length - W - L}무 ${L}패.`;
  const line = res.result === "승"
    ? pick([`${n.name}, 경기 끝나고 한참 동안 바닥만 보더라. 오늘은 네가 이겼다.`, `오늘은 우리가 웃었다. 근데 ${j(n.name, "이는", "는")} 다음엔 더 독하게 나올 거다.`])
    : res.result === "패"
      ? pick([`${n.name}, 오늘은 그쪽이 한 수 위였다. 인정할 건 인정하자.`, `졌다. ${his ? `${n.name}한테 ${his}골이나 먹었다. ` : ""}다음에 만날 때까지 뭘 고칠지 생각해 와라.`])
      : pick([`${j(n.name, "이랑", "랑")} 비겼다. 둘 다 서로를 잘 아니까 쉽지 않았다.`, `무승부. ${n.name}도 너도 결정적인 한 방이 없었다.`]);
  mail(state, "assist", `맞수 ${n.name}`, `${line}\n\n${score}`);
  return rec;
}

// 시즌 결산·엔딩에 쓰는 맞대결 요약
export function nemesisSummary(state, grade = null) {
  const n = state.nemesis;
  if (!n) return null;
  const log = n.log.filter(x => x.name === n.name && (grade == null || x.grade === grade));
  const W = log.filter(x => x.result === "승").length, L = log.filter(x => x.result === "패").length;
  return { name: n.name, team: n.team, level: n.level, pos: n.pos, games: log.length, W, D: log.length - W - L, L };
}
