// 전남 대표: 선발되면 5월 2주 전국소년체전에 나감 (1회전 → 준결승 → 결승, 지면 그 자리에서 끝)
// 같은 주에 경기를 이어서 치르고, 결과는 고흥FC 리그·대회 기록과 따로 남음
import { SURNAMES, GIVEN_NAMES, HIGH_SCHOOLS, LEAGUE_OPPONENTS, OPPONENT_STARS } from "../../data/world.js";
import { POSITIONS } from "../../data/player.js";
import { shuffle, weighted, pick } from "../rng.js";
import { teamStrength } from "./team.js";

export const JN_WEEK = { month: 5, week: 2 };
export const JN_ROUNDS = ["1회전", "준결승", "결승"];
export const JN_NAME = "전남 대표";
export const PROVINCES = [
  { name: "경기 대표", color: "#1E88E5", color2: "#FFFFFF" }, { name: "서울 대표", color: "#C62828", color2: "#FFFFFF" },
  { name: "경북 대표", color: "#2E7D32", color2: "#FFFFFF" }, { name: "부산 대표", color: "#212121", color2: "#29B6F6" },
  { name: "충남 대표", color: "#6A1B9A", color2: "#FFFFFF" }, { name: "경남 대표", color: "#00897B", color2: "#FFFFFF" },
  { name: "대구 대표", color: "#F3F5FB", color2: "#1F2C8F" }, { name: "인천 대표", color: "#FDD835", color2: "#1A237E" },
  { name: "강원 대표", color: "#F3F5FB", color2: "#2E7D32" }, { name: "전북 대표", color: "#43A047", color2: "#FFFFFF" },
];
const ROUND_EDGE = [-0.5, 1, 2.5];                 // 라운드가 오를수록 상대가 강해짐

// 전남 대표 코칭스태프 (가상 인물). 고흥FC의 김 감독·정 코치와 다른 사람
export const JN_STAFF = { coach: "서 감독", coachFrom: "목포", assistant: "한 코치", assistantFrom: "광양" };
// 도내(전남) 리그 팀. 광주는 다른 시·도라 빠짐
export const JN_TEAMS = LEAGUE_OPPONENTS.map(t => t.name).filter(n => !n.startsWith("광주"));
export const shortSchool = n => String(n || "").replace(/\s*U-15$/, "");
// 핵심 선수의 학년: 내가 g학년일 때 "3학년선배"는 g+2학년 (3학년을 넘으면 이미 졸업)
const YEAR_OFF = { "3학년선배": 2, "2학년선배": 1, "동기": 0, "1년후배": -1, "2년후배": -2 };

// 선발 발표 때 한 번 만듦: 전남 각 팀 에이스로 꾸린 동료들과 세 상대
// 각 팀 핵심 선수(OPPONENT_STARS) 중 지금 중학생인 선수를 학년 높은 순으로 포지션마다 채우고, 모자라면 도내 학교 이름을 붙여 새로 만듦
// 다른 학교 맞수가 전남 팀이면 같은 편으로 들어옴
export function startJnCup(state) {
  const p = state.player, g = state.calendar.grade;
  // 중3 두 번째 소집: 작년 대회 기록은 jnHistory로 옮겨 둠 (명예의 전당·업적은 둘 다 봄). 작년 동료 이름은 다시 뽑히면 again 표시
  const prev = state.jnCup && state.jnCup.grade !== g ? state.jnCup : null;
  if (prev) (state.jnHistory ||= []).push({ grade: prev.grade, medal: prev.medal || null, mates: (prev.squad || []).map(x => x.name) });
  const used = new Set([p.name, ...state.team.roster.map(m => m.name)]);
  const name = () => { let n; do { n = weighted(SURNAMES) + pick(GIVEN_NAMES); } while (used.has(n)); used.add(n); return n; };
  const nums = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].filter(n => n !== p.number));
  const stars = JN_TEAMS.flatMap(team => (OPPONENT_STARS[team] || []).map(r => ({ team, rel: r[0], pos: r[1], name: r[2], g: g + (YEAR_OFF[r[0]] ?? 0) })))
    .filter(s => s.g >= 2 && s.g <= 3 && !used.has(s.name));
  const nem = state.nemesis;
  const squad = [];
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const want = def.slots + 1;
    const pool = shuffle(stars.filter(s => s.pos === pos)).sort((a, b) => b.g - a.g);
    if (nem && JN_TEAMS.includes(nem.team) && nem.pos === pos && !used.has(nem.name)) pool.unshift({ team: nem.team, pos, name: nem.name, g, nemesis: true });
    const teamsUsed = {};
    for (const s of pool) {
      if (squad.filter(x => x.pos === pos).length >= want - 1) break;           // 한 자리는 새 얼굴로 (명단이 늘 같은 이름만 되지 않게)
      if (used.has(s.name) || (teamsUsed[s.team] || 0) >= 1 && !s.nemesis) continue;   // 한 팀에서 포지션마다 한 명
      used.add(s.name); teamsUsed[s.team] = (teamsUsed[s.team] || 0) + 1;
      squad.push({ name: s.name, number: nums.shift(), pos, school: s.team, ...(s.nemesis ? { nemesis: true } : {}), ...(prev?.squad?.some(x => x.name === s.name) ? { again: true } : {}) });
    }
    while (squad.filter(x => x.pos === pos).length < want) squad.push({ name: name(), number: nums.shift(), pos, school: pick(JN_TEAMS) });
  }
  const str = Math.max(60, teamStrength(state, false) + 4) + (g === 3 ? 1 : 0);
  const base = str * 0.6 + 20;
  const opps = shuffle(PROVINCES).slice(0, 3).map((o, i) => ({ id: `JN${i}`, ...o, strength: Math.round((base + ROUND_EDGE[i]) * 10) / 10 }));
  state.jnCup = { grade: g, str, squad, gk: name(), opps, stage: 0, alive: true, medal: null, log: [] };
}

// 이번 주 전남 대표 경기 (없으면 null). 다쳤으면 나가지 못함
export function jnFixture(state, info) {
  const c = state.jnCup;
  if (!c || !c.alive || !info || info.grade !== c.grade || info.month !== JN_WEEK.month || info.week !== JN_WEEK.week) return null;
  if (state.player.condition.injury) return null;
  if (c.stage >= JN_ROUNDS.length) return null;
  return { comp: "jn", compLabel: "전국소년체전", round: JN_ROUNDS[c.stage], official: false, tournament: true, ko: true, jn: true,
    usName: JN_NAME, opponent: c.opps[c.stage] };
}

// 경기 결과 반영. 메시지에 붙일 소식을 돌려줌
export function jnAfter(state, fx, gf, ga, shootoutWin, rating) {
  const c = state.jnCup, notes = [];
  if (!c) return notes;
  const win = gf > ga || (gf === ga && shootoutWin);
  c.log.push({ round: fx.round, opponent: fx.opponent.name, gf, ga, win });
  // 전국에서 고등학교 감독들이 보러 옴
  if (rating != null) {
    const bonus = Math.max(0, Math.round((rating - 6.4) * 6));
    if (bonus) {
      for (const s of HIGH_SCHOOLS) { const sc = state.scouting[s.id] ||= { interest: 10, seen: 0, offered: false }; sc.interest = Math.min(100, sc.interest + bonus); }
      notes.push(`관중석의 고등학교 감독들이 수첩에 무언가를 적었다. (모든 학교 관심도 +${bonus})`);
    }
  }
  if (!win) {
    c.alive = false;
    c.medal = fx.round === "결승" ? "silver" : fx.round === "준결승" ? "bronze" : "first";
    notes.push(fx.round === "결승" ? "결승에서 졌다. 전남 대표 은메달." : fx.round === "준결승" ? "준결승에서 졌다. 전남 대표 동메달." : "1회전에서 졌다. 소년체전은 여기까지다.");
  } else {
    c.stage++;
    if (c.stage >= JN_ROUNDS.length) {
      c.alive = false; c.medal = "gold";
      state.record.titles.push({ grade: c.grade, name: "전국소년체전 금메달 (전남 대표)", national: true });
      state.player.condition.fatigue = Math.max(0, state.player.condition.fatigue - 20);
      notes.push("전국소년체전 우승! 전남 대표 금메달 🥇");
    } else notes.push(`${fx.round} 통과! 다음은 ${JN_ROUNDS[c.stage]}.`);
  }
  return notes;
}

// 이번까지 전남 대표로 뽑힌 횟수, 가장 좋은 메달 (명예의 전당·업적)
const MEDAL_RANK = { gold: 3, silver: 2, bronze: 1 };
export function jnTimes(state) { return (state.jnHistory || []).length + (state.jnCup ? 1 : 0); }
export function bestJnMedal(state) {
  return [...(state.jnHistory || []).map(h => h.medal), state.jnCup?.medal].filter(m => MEDAL_RANK[m]).sort((a, b) => MEDAL_RANK[b] - MEDAL_RANK[a])[0] || null;
}
