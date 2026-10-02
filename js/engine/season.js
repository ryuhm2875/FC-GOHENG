// 시즌 운영: 주말리그 순위표, 전국대회 조별리그·토너먼트, 진학 연습경기 상대 정하기
import { LEAGUE_OPPONENTS, NATIONAL_OPPONENTS, HIGH_SCHOOLS, HS_TIERS, ELEMENTARY_OPPONENTS } from "../../data/world.js";
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

// 원형 방식 리그 대진: 10팀이 9라운드 동안 한 번씩 만남 (팀 수가 짝수여야 함)
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
    const stale = state.league?.key === key && !state.league.played && state.league.teams.length !== LEAGUE_OPPONENTS.length + 1;   // 예전 저장 파일
    if (state.league?.key !== key || stale) {
      const teams = [{ id: US, name: TEAM_NAME, strength: null },
        ...LEAGUE_OPPONENTS.map((o, i) => ({ id: `L${i}`, name: o.name, strength: 51 + o.strength + normal(0, 1.2), color: o.color, color2: o.color2 }))];
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
      const opps = shuffle(NATIONAL_OPPONENTS).map((o, i) => ({ id: `N${i}`, name: o.name, strength: 47 + o.strength + comp.bonus + normal(0, 1.2), color: o.color, color2: o.color2 }));
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
    if (!pairs) { if (!lg.finished) closeLeague(state, lg); return null; }   // 예전 저장 파일(7라운드)이 새 일정(9라운드)을 만난 경우
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
      const o = t.pool.length ? t.pool.shift() : { id: "Nx", ...pick(NATIONAL_OPPONENTS), strength: 54 };
      opp = state.rolls[key] = { ...o, strength: o.strength + (KO_BONUS[m.round] || 0) };
    }
    return { ...base, opponent: opp };
  }

  // 연습경기 / 진학 연습경기
  let isHs = m.comp === "hs";
  if (m.comp === "friendly" && m.hsChance) {
    const key = `hs-${info.turn}`;
    // 진학할 학교를 이미 정한 중3에게는 고등학교 연습경기를 잡지 않음
    if (state.rolls[key] === undefined) state.rolls[key] = !(info.grade === 3 && state.career?.school) && chance(m.hsChance[info.grade] || 0);
    isHs = state.rolls[key];
  }
  if (isHs) {
    const key = `school-${info.turn}`;
    if (!state.rolls[key]) state.rolls[key] = pickSchool(state).id;
    const school = HIGH_SCHOOLS.find(s => s.id === state.rolls[key]);
    return { ...base, comp: "hs", compLabel: COMPS.hs.label, official: false, school,
      opponent: { id: school.id, name: `${school.name} 1학년`, strength: school.strength, color: school.color, color2: school.color2 } };
  }
  // 초등학교 팀과의 연습경기 (우리가 조금 우세)
  if (m.comp === "friendly" && m.elemChance) {
    const key = `el-${info.turn}`;
    if (state.rolls[key] === undefined) state.rolls[key] = chance(m.elemChance[info.grade] || 0) ? pick(ELEMENTARY_OPPONENTS).name : false;
    const el = ELEMENTARY_OPPONENTS.find(e => e.name === state.rolls[key]);
    if (el) return { ...base, elementary: true, opponent: { id: "E", name: el.name, strength: 50 + el.strength, color: el.color, color2: el.color2 } };
  }
  const key = `fr-${info.turn}`;
  if (!state.rolls[key]) {
    const o = pick(LEAGUE_OPPONENTS);
    state.rolls[key] = { id: "F", name: o.name, strength: 50 + o.strength, color: o.color, color2: o.color2 };
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
export function applyResult(state, fx, gf, ga, { shootoutWin = null, rating = null, my = null } = {}) {
  const notes = [];
  if (fx.comp === "league") {
    const lg = state.league;
    for (const [a, b] of lg.rounds[fx.leagueRound] || []) {
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
    if (lg.played >= lg.rounds.length) notes.push(closeLeague(state, lg));
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
        t.alive = false; t.best = fx.round === "결승" ? "준우승" : fx.round;
        notes.push(fx.round === "결승" ? "결승에서 아쉽게 졌다. 최종 성적 준우승." : `${fx.round}에서 탈락. 최종 성적 ${fx.round}.`);
        if (fx.round === "결승") state.flags.celebrate = { kind: "runnerUp", label: t.label, turn: state.calendar.turn };
        finishTour(state);
      } else if (fx.round === "결승") {
        t.alive = false; t.best = "우승"; t.champion = true;
        state.record.titles.push({ grade: t.grade, name: `${t.label} 우승`, national: true });
        state.flags.nationalChampion = true;
        state.flags.celebrate = { kind: "national", label: t.label, turn: state.calendar.turn };
        notes.push(`${t.name} 우승! 🏆`);
        finishTour(state);
      } else {
        t.best = { "16강": "8강", "8강": "4강", "4강": "결승" }[fx.round];
        notes.push(`${fx.round} 통과! 다음은 ${t.best}.`);
      }
    }
  }

  if (fx.comp === "hs") notes.push(...scoutAfter(state, fx, rating, my, gf, ga));
  if (fx.elementary) notes.push(...elementaryAfter(state, fx, rating, my, gf, ga));
  return notes;
}

// 리그를 마치고 순위를 기록
function closeLeague(state, lg) {
  lg.finished = true;
  const rank = sortTable(lg.table).findIndex(r => r.id === US) + 1;
  lg.finalRank = rank;
  state.record.leagues.push({ grade: lg.grade, half: lg.half, rank });
  if (rank === 1) {
    state.record.titles.push({ grade: lg.grade, name: `${lg.half} 주말리그 우승` });
    state.flags.celebrate = { kind: "league", label: `${lg.half} 주말리그`, turn: state.calendar.turn };
  }
  return rank === 1 ? `${lg.half} 주말리그 우승! ${lg.teams.length}팀 중 1위로 마쳤다 🏆` : `${lg.half} 주말리그가 끝났다. ${lg.teams.length}팀 중 최종 ${rank}위.`;
}

function finishTour(state) {
  const t = state.tour;
  state.record.tournaments.push({ grade: t.grade, comp: t.comp, name: t.label, best: t.best });
}

// ── 진학 연습경기 후 스카우트 관심도와 상대 감독 평가 ─
// 평가 문장은 [첫마디] + [내 경기에서 눈에 띈 점] + [몸·자세 이야기] + [끝맺음]을 상황에 맞게 골라 이어 붙임
const HS_TALK = {
  open: {
    great: ["오늘 경기 잘 봤다. 중학생이 고등학생 상대로 그렇게 뛰는 건 쉽지 않다.", "솔직히 놀랐다. 우리 1학년들이 너 하나를 못 막더라.", "경기 끝나고 우리 코치들이 네 번호부터 묻더라."],
    good:  ["오늘 경기 잘 봤다. 끝까지 공을 쫓아다니는 게 보이더구나.", "형들 상대로 겁먹지 않는 게 보였다. 그게 제일 어렵다.", "생각보다 침착하더라. 공을 받을 때 고개를 드는 게 좋았다."],
    ok:    ["고생했다. 고등학생 상대로 쉽지 않았을 거다.", "오늘은 무난했다. 아직 보여 줄 게 더 있을 것 같은데.", "한두 장면은 괜찮았다. 나머지는 다음에 보자."],
    low:   ["오늘은 몸이 좀 무거워 보였다.", "형들 속도에 많이 당황하더구나.", "오늘 경기는 너한테도 공부가 됐을 거다."],
  },
  detail: {
    goal:   ["골 장면, 마무리할 때 망설이지 않더라. 그건 가르쳐서 되는 게 아니다.", "우리 골키퍼가 꽤 하는 앤데, 그 앞에서 침착하게 넣더구나."],
    assist: ["골은 동료가 넣었지만 그 패스는 네 거였다. 시야가 좋다.", "도움 장면, 수비 사이를 보는 눈이 있더라."],
    sharp:  ["공을 잡을 때마다 뭔가를 만들어 내려는 게 보였다.", "선택이 빠르고 정확했다. 머리가 좋은 선수다."],
    shaky:  ["다만 공을 너무 오래 끌다 뺏기는 장면이 몇 번 있었다.", "결정적인 순간에 한 템포씩 늦었다. 고등학교는 그 한 템포가 다르다."],
    FW: ["공 없을 때 수비 뒷공간을 노리는 움직임은 합격이다."],
    MF: ["중원에서 공을 받는 위치가 좋았다. 형들 사이에서도 숨을 곳을 찾더라."],
    DF: ["수비 라인 맞추는 소리가 우리 쪽까지 들리더라. 그런 목소리 좋다."],
  },
  body: {
    weak:  ["몸은 아직 중학생이다. 웨이트는 지금부터 꾸준히 해라.", "몸싸움에서 자꾸 밀리더라. 고등학교 와서 1년은 몸 만드는 데 쓸 각오 해라."],
    fine:  ["몸싸움도 생각보다 버티더라. 기본기가 있는 몸이다."],
  },
  close: {
    offer: ["우리 학교에 올 생각이 있다면 문은 열려 있다. 너희 감독님께도 따로 말씀드려 두마."],
    watch: ["앞으로도 관심 있게 지켜보겠다.", "다음 경기도 보러 갈 생각이다. 그때도 오늘처럼만 해라.", "감독님께 네 이야기 잘 전해 두마."],
    cold:  ["중학교 마지막까지 어떻게 크는지 보겠다.", "아직은 판단하기 이르다. 다음에 또 보자."],
    young: ["중3 때 다시 보자. 그때도 오늘처럼만 해라.", "아직 어린데 기특하다. 몇 년 뒤가 더 기대된다.", "이름 기억해 두마. 몇 년 뒤에 다시 만나자."],
  },
};
export function scoutAfter(state, fx, rating, my = null, gf = 0, ga = 0) {
  const s = fx.school;
  const sc = state.scouting[s.id] ||= { interest: 10, seen: 0, offered: false };
  sc.seen++;
  if (rating == null) {
    sc.interest = Math.max(0, sc.interest - 5);
    return [`${s.name} 감독님 앞에서 뛰지 못했다.`];
  }
  const g3 = state.calendar.grade === 3;
  const gain = (rating - 6.3) * 20 * (g3 ? 1 : 0.5);                 // 중1·중2 때 본 경기는 관심도에 절반만
  sc.interest = Math.max(0, Math.min(100, sc.interest + gain));
  const band = rating >= 8.2 ? "great" : rating >= 7.3 ? "good" : rating >= 6.4 ? "ok" : "low";
  const T = HS_TALK;
  const parts = [pick(T.open[band])];
  if (my?.goals) parts.push(pick(T.detail.goal));
  else if (my?.assists) parts.push(pick(T.detail.assist));
  if (my?.n >= 3) parts.push(my.ok / my.n >= 0.6 ? pick(T.detail.sharp) : my.ok / my.n <= 0.34 ? pick(T.detail.shaky) : pick(T.detail[my.pos] || T.detail.MF));
  else if (my?.pos) parts.push(pick(T.detail[my.pos]));
  if (my) parts.push(my.phys > 0.05 ? pick(T.body.weak) : pick(T.body.fine));
  if (band === "great" && !sc.offered && g3) { sc.offered = true; parts.push(pick(T.close.offer)); }   // 입학 제안은 중3에게만
  else if (!g3 && (band === "great" || band === "good")) parts.push(pick(T.close.young));
  else parts.push(pick(band === "low" ? T.close.cold : T.close.watch));
  if (band === "low" && rating < 5.8) return [`${s.name} 감독님은 짧게 한마디만 하고 돌아가셨다. "${parts[0]}"`];
  const title = sc.offered && band === "great" ? `${s.name}에서 연락이 왔습니다` : `${s.name} 감독님의 평가`;
  return [{ from: s.coach, title, body: parts.join(" ") }];
}

// ── 초등학교 팀과의 연습경기 뒤 ─
const ELEM_TALK = {
  win:  ["오늘 우리 아이들 상대해 줘서 고맙다. 형들 공 차는 거 보고 많이 배웠을 거다.", "역시 중학생은 다르구나. 우리 애들 눈이 반짝반짝하더라."],
  draw: ["비겼네! 우리 애들 오늘 저녁에 자랑하느라 정신없겠다. 형들이 봐준 거 다 안다.", "우리 애들이 형들 상대로 비겼다고 난리다. 다음에 또 붙자."],
  loss: ["하하, 오늘은 우리 애들이 이겼구나. 형들이 좀 방심했지?", "우리 애들도 놀랐다. 중학생 형들을 이길 줄은 몰랐다고."],
  me:   ["{name} 형 사인 받고 싶다는 애가 셋이나 된다. 다음엔 펜 좀 챙겨 와라.", "우리 애들 중에 {name} 형처럼 되고 싶다는 녀석이 생겼다.", "경기 끝나고 {name} 형 몇 번이냐고 묻는 애들이 있었다."],
};
export function elementaryAfter(state, fx, rating, my, gf, ga) {
  const key = gf > ga ? "win" : gf < ga ? "loss" : "draw";
  const parts = [pick(ELEM_TALK[key])];
  if (rating != null && (rating >= 7.2 || my?.goals)) parts.push(pick(ELEM_TALK.me).replaceAll("{name}", state.player.name));
  const notes = [{ from: `${fx.opponent.name} 감독님`, title: "오늘 경기 고맙다", body: parts.join("\n\n") }];
  if (gf <= ga) notes.push("초등학생 팀을 상대로 이기지 못했다. 한동안 놀림감이 될 것 같다.");
  return notes;
}

// 그 주 경기가 아직 열리는지 (탈락한 대회의 다음 라운드, 예전 저장 파일의 없는 리그 라운드는 false)
export function stillScheduled(state, i) {
  if (!i.match) return true;
  if (i.match.comp === "league" && state.league?.key === `${i.grade}-${i.phase}` && !state.league.rounds[i.leagueRound]) return false;
  if ((i.match.comp === "summer" || i.match.comp === "winter") && i.match.stage === "ko") {
    const t = state.tour;
    if (t && t.key === `${i.grade}-${i.match.comp}` && (!t.alive || t.stage !== "ko")) return t.alive && t.stage === "group" ? true : false;
  }
  return true;
}

export function tierLabel(tier) { return HS_TIERS[tier].label; }
