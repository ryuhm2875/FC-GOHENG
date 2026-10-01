// 시즌 운영: 주말리그 순위표, 전국대회 조별리그·토너먼트, 진학 연습경기 상대 정하기
import { LEAGUE_OPPONENTS, NATIONAL_OPPONENTS, HIGH_SCHOOLS, HS_TIERS } from "../../data/world.js";
import { COMPS } from "../../data/calendar.js";
import { rand, normal, shuffle, chance, weighted, pick } from "../rng.js";
import { ovr } from "./team.js";

export const US = "us";
export const TEAM_NAME = "고흥FC";
const KO_BONUS = { "16강": 1, "8강": 2, "4강": 3, "결승": 4 };

function poisson(lambda) {
  const L = Math.exp(-lambda); let k = 0, p = 1;
  do { k++; p *= rand(); } while (p > L);
  return k - 1;
}
export function simScore(a, b) {
  return [poisson(1.3 * Math.exp((a - b) / 12)), poisson(1.3 * Math.exp((b - a) / 12))];
}

const row = (id, name) => ({ id, name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
function addResult(table, id, gf, ga) {
  const r = table.find(x => x.id === id);
  if (!r) return;
  r.p++; r.gf += gf; r.ga += ga;
  if (gf > ga) { r.w++; r.pts += 3; } else if (gf === ga) { r.d++; r.pts += 1; } else r.l++;
}
export const sortTable = t => t.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name));

// 원형 방식 리그 대진: 8팀이 7라운드 동안 한 번씩 만남
function roundRobin(ids) {
  const arr = ids.slice(); const rounds = [];
  for (let r = 0; r < arr.length - 1; r++) {
    const pairs = [];
    for (let i = 0; i < arr.length / 2; i++) pairs.push([arr[i], arr[arr.length - 1 - i]]);
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop());
  }
  return shuffle(rounds);
}

// ── 시즌 시작 ───────────────────────
export function ensureSeason(state, info) {
  if (!info) return;
  if (info.phase === "league1" || info.phase === "league2") {
    const key = `${info.grade}-${info.phase}`;
    if (state.league?.key !== key) {
      const teams = [{ id: US, name: TEAM_NAME, strength: null },
        ...LEAGUE_OPPONENTS.map((o, i) => ({ id: `L${i}`, name: o.name, strength: 51 + o.strength + normal(0, 1.2) }))];
      state.league = {
        key, grade: info.grade, half: info.phase === "league1" ? "전반기" : "후반기",
        teams, table: teams.map(t => row(t.id, t.name)),
        rounds: roundRobin(teams.map(t => t.id)), played: 0, finished: false,
      };
    }
  }
  if (info.match && (info.match.comp === "summer" || info.match.comp === "winter")) {
    const key = `${info.grade}-${info.match.comp}`;
    if (state.tour?.key !== key) {
      const comp = COMPS[info.match.comp];
      const opps = shuffle(NATIONAL_OPPONENTS).map((o, i) => ({ id: `N${i}`, name: o.name, strength: 47 + o.strength + comp.bonus + normal(0, 1.2) }));
      const group = [{ id: US, name: TEAM_NAME, strength: null }, ...opps.slice(0, 3)];
      state.tour = {
        key, grade: info.grade, comp: info.match.comp, name: comp.name, label: comp.label,
        group, table: group.map(t => row(t.id, t.name)), pool: opps.slice(3),
        stage: "group", groupPlayed: 0, alive: true, best: "조별리그", log: [],
      };
    }
  }
}

// ── 이번 주 경기 상대 ───────────────
export function matchFor(state, info) {
  if (!info?.match) return null;
  ensureSeason(state, info);
  const m = info.match, comp = COMPS[m.comp];
  const base = { comp: m.comp, compLabel: comp.label, round: m.round || null, official: comp.official, tournament: comp.tournament, ko: m.stage === "ko" };

  if (m.comp === "league") {
    const lg = state.league;
    const pairs = lg.rounds[info.leagueRound];
    const pair = pairs.find(p => p.includes(US));
    const opp = lg.teams.find(t => t.id === (pair[0] === US ? pair[1] : pair[0]));
    return { ...base, round: `${lg.half} ${info.leagueRound + 1}라운드`, leagueRound: info.leagueRound, opponent: opp };
  }

  if (m.comp === "summer" || m.comp === "winter") {
    const t = state.tour;
    if (!t.alive) return null;
    if (m.stage === "group") {
      const opp = t.group[1 + t.groupPlayed];
      return { ...base, opponent: opp };
    }
    if (t.stage !== "ko") return null;
    const key = `ko-${info.turn}`;
    let opp = state.rolls[key];
    if (!opp) {
      const o = t.pool.length ? t.pool.shift() : { id: "Nx", name: pick(NATIONAL_OPPONENTS).name, strength: 54 };
      opp = state.rolls[key] = { ...o, strength: o.strength + (KO_BONUS[m.round] || 0) };
    }
    return { ...base, opponent: opp };
  }

  // 연습경기 / 진학 연습경기
  let isHs = m.comp === "hs";
  if (m.comp === "friendly" && m.hsChance) {
    const key = `hs-${info.turn}`;
    if (state.rolls[key] === undefined) state.rolls[key] = chance(m.hsChance[info.grade] || 0);
    isHs = state.rolls[key];
  }
  if (isHs) {
    const key = `school-${info.turn}`;
    if (!state.rolls[key]) state.rolls[key] = pickSchool(state).id;
    const school = HIGH_SCHOOLS.find(s => s.id === state.rolls[key]);
    return { ...base, comp: "hs", compLabel: COMPS.hs.label, official: false, school,
      opponent: { id: school.id, name: `${school.name} 1학년`, strength: school.strength } };
  }
  const key = `fr-${info.turn}`;
  if (!state.rolls[key]) {
    const o = pick(LEAGUE_OPPONENTS);
    state.rolls[key] = { id: "F", name: o.name, strength: 50 + o.strength };
  }
  return { ...base, opponent: state.rolls[key] };
}

// 선수 수준에 맞는 학교가 더 자주 보러 옴
function pickSchool(state) {
  const o = ovr(state.player);
  const target = o >= 70 ? 4 : o >= 62 ? 3 : o >= 52 ? 2 : 1;
  return weighted(HIGH_SCHOOLS.map(s => [s, Math.exp(-Math.abs(HS_TIERS[s.tier].order - target) * 1.2)]));
}

// ── 결과 반영 ───────────────────────
// 반환: 메시지에 쓸 소식 목록
export function applyResult(state, fx, gf, ga, { shootoutWin = null, rating = null } = {}) {
  const notes = [];
  if (fx.comp === "league") {
    const lg = state.league;
    for (const [a, b] of lg.rounds[fx.leagueRound]) {
      if (a === US || b === US) {
        const them = a === US ? b : a;
        addResult(lg.table, US, gf, ga); addResult(lg.table, them, ga, gf);
      } else {
        const ta = lg.teams.find(t => t.id === a), tb = lg.teams.find(t => t.id === b);
        const [x, y] = simScore(ta.strength, tb.strength);
        addResult(lg.table, a, x, y); addResult(lg.table, b, y, x);
      }
    }
    lg.played++;
    if (lg.played >= lg.rounds.length) {
      lg.finished = true;
      const rank = sortTable(lg.table).findIndex(r => r.id === US) + 1;
      lg.finalRank = rank;
      state.record.leagues.push({ grade: lg.grade, half: lg.half, rank });
      if (rank === 1) state.record.titles.push({ grade: lg.grade, name: `${lg.half} 주말리그 우승` });
      notes.push(rank === 1 ? `${lg.half} 주말리그 우승! 8팀 중 1위로 마쳤다 🏆` : `${lg.half} 주말리그가 끝났다. 최종 ${rank}위.`);
    }
  }

  if (fx.comp === "summer" || fx.comp === "winter") {
    const t = state.tour;
    t.log.push({ round: fx.round, opponent: fx.opponent.name, gf, ga, shootoutWin });
    if (!fx.ko) {
      const i = t.groupPlayed;
      const opp = t.group[1 + i];
      addResult(t.table, US, gf, ga); addResult(t.table, opp.id, ga, gf);
      // 같은 조 나머지 두 팀 경기
      const others = t.group.slice(1).filter(x => x.id !== opp.id);
      const [x, y] = simScore(others[0].strength, others[1].strength);
      addResult(t.table, others[0].id, x, y); addResult(t.table, others[1].id, y, x);
      t.groupPlayed++;
      if (t.groupPlayed === 3) {
        const rank = sortTable(t.table).findIndex(r => r.id === US) + 1;
        if (rank <= 2) { t.stage = "ko"; notes.push(`조 ${rank}위로 토너먼트 진출!`); t.best = "토너먼트 진출"; }
        else { t.alive = false; t.best = "조별리그 탈락"; notes.push(`조 ${rank}위. 조별리그에서 탈락했다.`); finishTour(state); }
      }
    } else {
      const win = gf > ga || (gf === ga && shootoutWin);
      if (!win) {
        t.alive = false; t.best = fx.round;
        notes.push(`${fx.round}에서 탈락. 최종 성적 ${fx.round}.`);
        finishTour(state);
      } else if (fx.round === "결승") {
        t.alive = false; t.best = "우승"; t.champion = true;
        state.record.titles.push({ grade: t.grade, name: `${t.label} 우승`, national: true });
        state.flags.nationalChampion = true;
        notes.push(`${t.name} 우승! 🏆`);
        finishTour(state);
      } else {
        t.best = { "16강": "8강", "8강": "4강", "4강": "결승" }[fx.round];
        notes.push(`${fx.round} 통과! 다음은 ${t.best}.`);
      }
    }
  }

  if (fx.comp === "hs") notes.push(...scoutAfter(state, fx, rating));
  return notes;
}

function finishTour(state) {
  const t = state.tour;
  state.record.tournaments.push({ grade: t.grade, comp: t.comp, name: t.label, best: t.best });
}

// ── 진학 연습경기 후 스카우트 관심도 ─
export function scoutAfter(state, fx, rating) {
  const s = fx.school;
  const sc = state.scouting[s.id] ||= { interest: 10, seen: 0, offered: false };
  sc.seen++;
  if (rating == null) {
    sc.interest = Math.max(0, sc.interest - 5);
    return [`${s.name} 감독님 앞에서 뛰지 못했다.`];
  }
  const gain = (rating - 6.3) * 20;
  sc.interest = Math.max(0, Math.min(100, sc.interest + gain));
  const notes = [];
  if (rating >= 8.2 && !sc.offered) {
    sc.offered = true;
    notes.push({ from: s.coach, title: `${s.name}에서 연락이 왔습니다`,
      body: `오늘 경기 잘 봤다. 중학생이 고등학생 상대로 그렇게 뛰는 건 쉽지 않다.\n\n우리 학교에 올 생각이 있다면 문은 열려 있다. 감독님께도 따로 말씀드려 두마.` });
  } else if (rating >= 7.5) {
    notes.push({ from: s.coach, title: `${s.name} 감독님의 한마디`,
      body: `몸 싸움에서 밀리지 않더구나. 앞으로도 관심 있게 지켜보겠다.` });
  } else if (rating < 5.8) {
    notes.push(`${s.name} 감독님은 아무 말 없이 돌아가셨다.`);
  }
  return notes;
}

export function tierLabel(tier) { return HS_TIERS[tier].label; }
