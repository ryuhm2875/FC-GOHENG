// 종합 능력치, 팀 명단, 선발 경쟁
import { POSITIONS, ROLES } from "../../data/player.js";
import { getPath, int, range } from "../rng.js";
import { TURNS_PER_YEAR, GRAD_INDEX } from "./calendar.js";

export function ovr(player, pos = player.position) {
  const w = POSITIONS[pos].weights;
  let sum = 0;
  for (const [path, weight] of Object.entries(w)) sum += getPath(player.stats, path) * weight;
  return sum;
}

const COHORT_OFFSET = { "3학년선배": 2, "2학년선배": 1, "동기": 0, "1년후배": -1, "2년후배": -2 };

// 주인공 학년 g일 때 그 선수의 학년
export const mateGrade = (mate, g) => g + COHORT_OFFSET[mate.cohort];

// 1월 졸업식 뒤(1~2월)에는 3학년이 빠짐
export function activeRoster(state) {
  const g = state.calendar.grade;
  const t = (state.calendar.turn - 1) % TURNS_PER_YEAR;
  const graduated = t > GRAD_INDEX;              // 1월 1주(졸업식) 다음부터
  return state.team.roster.filter(m => { const mg = mateGrade(m, g); return mg >= 1 && mg <= (graduated ? 2 : 3); });
}

// 학년이 바뀔 때: 남아 있는 선수들 능력치 상승
export function ageRoster(state) {
  const g = state.calendar.grade;
  for (const m of state.team.roster) {
    const mg = mateGrade(m, g);
    const prev = mateGrade(m, g - 1);
    if (mg >= 2 && mg <= 3 && prev >= 1) m.ovrNow = Math.min(80, m.ovrNow + range(9, 13));
  }
}

// 선발 점수: 능력치 75% + 감독 신뢰 25%
export const selectionScore = (o, coach) => o * 0.75 + coach * 0.25;

export function depthChart(state) {
  const me = state.player;
  const myScore = selectionScore(ovr(me), state.relations.coach);
  const mates = activeRoster(state).filter(m => m.position === me.position)
    .map(m => ({ name: m.name, number: m.number, ovr: m.ovrNow, score: selectionScore(m.ovrNow, 50), me: false }));
  const list = [...mates, { name: me.name, number: me.number, ovr: ovr(me), score: myScore, me: true }]
    .sort((a, b) => b.score - a.score);
  const rank = list.findIndex(x => x.me) + 1;
  return { list, rank, slots: POSITIONS[me.position].slots };
}

export function roleFor(state) {
  const { rank, slots } = depthChart(state);
  if (rank === 1) return ROLES[0];
  if (rank <= slots) return ROLES[1];
  if (rank <= slots + 2) return ROLES[2];
  if (state.calendar.grade === 1) return ROLES[3];
  return ROLES[4];
}

// 팀 전력: 포지션별 상위 선수 평균 (4-4-2)
export function teamStrength(state, withMe) {
  const pool = activeRoster(state).map(m => ({ pos: m.position, ovr: m.ovrNow }));
  if (withMe) pool.push({ pos: state.player.position, ovr: ovr(state.player) });
  let total = 0, n = 0;
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const top = pool.filter(p => p.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, def.slots);
    for (const p of top) { total += p.ovr; n++; }
    for (let i = top.length; i < def.slots; i++) { total += 45; n++; }
  }
  return total / n;
}

export function freeNumbers(state, from, to) {
  const used = new Set(activeRoster(state).map(m => m.number));
  const out = [];
  for (let i = from; i <= to; i++) if (!used.has(i)) out.push(i);
  return out;
}

export function randomFreeNumber(state, from, to) {
  const free = freeNumbers(state, from, to);
  return free.length ? free[int(0, free.length - 1)] : from;
}
