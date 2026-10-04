// 전남 대표: 선발되면 5월 2주 전국소년체전에 나감 (1회전 → 준결승 → 결승, 지면 그 자리에서 끝)
// 같은 주에 경기를 이어서 치르고, 결과는 고흥FC 리그·대회 기록과 따로 남음
import { SURNAMES, GIVEN_NAMES, HIGH_SCHOOLS } from "../../data/world.js";
import { POSITIONS } from "../../data/player.js";
import { shuffle, weighted, pick } from "../rng.js";
import { teamStrength } from "./team.js";

export const JN_WEEK = { month: 5, week: 2 };
export const JN_ROUNDS = ["1회전", "준결승", "결승"];
export const JN_NAME = "전남 대표";
const PROVINCES = [
  { name: "경기 대표", color: "#1E88E5", color2: "#FFFFFF" }, { name: "서울 대표", color: "#C62828", color2: "#FFFFFF" },
  { name: "경북 대표", color: "#2E7D32", color2: "#FFFFFF" }, { name: "부산 대표", color: "#212121", color2: "#29B6F6" },
  { name: "충남 대표", color: "#6A1B9A", color2: "#FFFFFF" }, { name: "경남 대표", color: "#00897B", color2: "#FFFFFF" },
  { name: "대구 대표", color: "#F3F5FB", color2: "#1F2C8F" }, { name: "인천 대표", color: "#FDD835", color2: "#1A237E" },
  { name: "강원 대표", color: "#F3F5FB", color2: "#2E7D32" }, { name: "전북 대표", color: "#43A047", color2: "#FFFFFF" },
];
const ROUND_EDGE = [-0.5, 1, 2.5];                 // 라운드가 오를수록 상대가 강해짐

// 선발 발표 때 한 번 만듦: 도내 다른 학교에서 뽑힌 동료들과 세 상대
export function startJnCup(state) {
  const p = state.player, g = state.calendar.grade;
  const used = new Set([p.name, ...state.team.roster.map(m => m.name)]);
  const name = () => { let n; do { n = weighted(SURNAMES) + pick(GIVEN_NAMES); } while (used.has(n)); used.add(n); return n; };
  const nums = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].filter(n => n !== p.number));
  const squad = [];
  for (const [pos, def] of Object.entries(POSITIONS)) for (let i = 0; i < def.slots + 1; i++) squad.push({ name: name(), number: nums.shift(), pos });
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
