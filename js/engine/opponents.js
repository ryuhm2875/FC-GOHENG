// 상대 팀 선수단: 핵심 선수(data/world.js의 OPPONENT_STARS) + 자동으로 만든 선수
// 한 판 안에서는 같은 이름이 계속 나오고, 해마다 한 학년씩 올라가며 3학년은 1월에 졸업합니다.
import { OPPONENT_STARS, SURNAMES, GIVEN_NAMES } from "../../data/world.js";
import { GOALKEEPERS } from "../../data/roster.js";
import { pick, weighted, shuffle, rand } from "../rng.js";
import { mateGrade } from "./team.js";
import { TURNS_PER_YEAR, GRAD_INDEX } from "./calendar.js";

const COHORTS = ["3학년선배", "2학년선배", "동기", "1년후배", "2년후배"];
const FILL = { DF: 2, MF: 2, FW: 1 };            // 학년마다 자동으로 만드는 선수 수
const STAR_NUMBERS = { FW: [9, 10, 11, 7], MF: [10, 8, 7, 6], DF: [4, 5, 3, 2] };
const NEED = { DF: 4, MF: 4, FW: 2 };            // 경기장에 서는 필드 선수

const randomName = () => weighted(SURNAMES) + pick(GIVEN_NAMES);
const allStarNames = () => new Set(Object.values(OPPONENT_STARS).flat().map(r => r[2]));

// 핵심 선수 정보는 저장 파일이 아니라 data에서 바로 읽음 (이름을 고치면 진행 중인 게임에도 반영)
function starOf(team, i) {
  const r = OPPONENT_STARS[team]?.[i];
  return r ? { cohort: r[0], pos: r[1], name: r[2], trait: r[3] } : null;
}

// 팀 선수단을 처음 한 번 만들고 저장 (핵심 선수가 없는 팀은 null)
export function oppSquad(state, team) {
  if (!OPPONENT_STARS[team]) return null;
  state.oppSquads ||= {};
  if (state.oppSquads[team]) return state.oppSquads[team];
  const stars = OPPONENT_STARS[team].map((r, i) => ({ star: i, cohort: r[0], pos: r[1] }));
  const used = new Set([state.player.name, ...state.team.roster.map(m => m.name), ...GOALKEEPERS.map(g => g.name), ...allStarNames()]);
  for (const sq of Object.values(state.oppSquads)) for (const m of sq) if (m.name) used.add(m.name);
  const numbers = new Set();
  const list = [];
  for (const s of stars) {
    const n = STAR_NUMBERS[s.pos].find(x => !numbers.has(x)) ?? 20 + list.length;
    numbers.add(n); list.push({ ...s, number: n });
  }
  const free = shuffle(Array.from({ length: 34 }, (_, i) => i + 2).filter(n => !numbers.has(n) && n !== 1));
  for (const cohort of COHORTS) for (const [pos, k] of Object.entries(FILL)) {
    const have = stars.filter(s => s.cohort === cohort && s.pos === pos).length;
    for (let i = have; i < k; i++) {
      let name; do { name = randomName(); } while (used.has(name)); used.add(name);
      list.push({ name, cohort, pos, number: free.pop() ?? 40 + list.length });
    }
  }
  state.oppSquads[team] = list;
  return list;
}

// 지금 뛰는 선수 (학년 1~3, 1월 졸업식 뒤에는 3학년 제외)
export function activeOpp(state, team) {
  const sq = oppSquad(state, team);
  if (!sq) return null;
  const g = state.calendar.grade;
  const t = (state.calendar.turn - 1) % TURNS_PER_YEAR;
  const top = t > GRAD_INDEX ? 2 : 3;
  return sq.map(m => {
    const s = m.star != null ? starOf(team, m.star) : null;
    if (m.star != null && !s) return null;
    const p = s ? { ...m, ...s, number: m.number } : { ...m };
    p.grade = mateGrade(p, g);
    return p;
  }).filter(p => p && p.grade >= 1 && p.grade <= top);
}

// 이번 경기 에이스: 지금 뛰는 핵심 선수 중 학년이 가장 높은 선수
export function aceOf(state, team) {
  const act = activeOpp(state, team);
  if (!act) return null;
  const order = { FW: 0, MF: 1, DF: 2 };
  return act.filter(p => p.star != null).sort((a, b) => b.grade - a.grade || order[a.pos] - order[b.pos])[0] || null;
}

// 에이스 결장 여부: 같은 주·같은 팀이면 언제 물어봐도 같은 답 (경기 분석 메일과 경기가 어긋나지 않게)
export function aceAbsent(state, team, turn = state.calendar.turn) {
  let h = 2166136261;
  state.meta ||= {}; state.meta.oppSeed ||= 1 + Math.floor(rand() * 1e9);
  for (const ch of `${team}|${turn}|${state.meta.oppSeed}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100 < 12;
}

// 경기에 나서는 필드 선수 10명. 핵심 선수 먼저, 그다음 학년 높은 순
export function oppLineup(state, team, turn) {
  const act = activeOpp(state, team);
  if (!act) return null;
  const ace = aceOf(state, team);
  const out = aceAbsent(state, team, turn) && ace ? ace.name : null;
  const lineup = [];
  for (const [pos, n] of Object.entries(NEED)) {
    act.filter(p => p.pos === pos && p.name !== out).sort((a, b) => (b.star != null) - (a.star != null) || b.grade - a.grade)
      .slice(0, n).forEach(p => lineup.push({ name: p.name, number: p.number, pos, star: p.star != null, trait: p.trait || null, grade: p.grade }));
  }
  return { lineup, ace: ace && !out ? ace : null, absent: out ? ace : null };
}

// 맞대결 기록 (에이스 이름별): 경기 수, 우리에게 넣은 골, 마지막으로 만난 학년
export function noteOpp(state, m) {
  if (!m.oppAce) return;
  state.oppMemo ||= {};
  const k = m.oppAce.name;
  const r = state.oppMemo[k] ||= { games: 0, goals: 0, grade: 0 };
  r.games++;
  r.goals += m.goalsLog.filter(g => g.team === "them" && g.name === k).length;
  r.grade = state.calendar.grade;
}
