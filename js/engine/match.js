// 경기 엔진: 시간순 사건을 미리 깔아 두고, 내 장면에서 멈춰 선택을 받습니다.
// 각 해설 줄에는 공 위치(ball)와 공을 가진 팀(poss)이 붙어 있어 화면이 선수들을 움직입니다.
import { SITUATIONS, OUTCOMES, LINES, HALFTIME_TALK, PLAYS, FINISH, RESULT, AMBIENT, TO_ME, SIGNATURE, ME_IN_PLAY, BREAK, PREMATCH } from "../../data/match.js";
import { SURNAMES, GIVEN_NAMES } from "../../data/world.js";
import { POSITIONS } from "../../data/player.js";
import { GOALKEEPERS, STAFF } from "../../data/roster.js";
import { rand, int, range, normal, chance, pick, weighted, clamp, getPath, shuffle } from "../rng.js";
import { ovr, depthChart, teamStrength, activeRoster, mateGrade } from "./team.js";
import { hasTrait, applyGain, conditionOf } from "./growth.js";
import { applyResult, TEAM_NAME } from "./season.js";
import { matchMails } from "./advice.js";

export const LENGTH = 70;
export const MY_SLOT = { FW: 0, MF: 1, DF: 1 };        // 경기장에서 내가 서는 자리 (포지션 안 순서)          // 중등부 전후반 35분씩
export const HALF = 35;
export const STATUS_LABEL = { start: "선발 출전", sub: "교체 출전", bench: "벤치 대기", out: "명단 제외" };

// ── 문장 채우기 (받침에 맞는 조사) ───
function batchim(word) {
  const w = String(word);
  const c = w.charCodeAt(w.length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 !== 0;
  return false;
}
export function fill(tpl, vars) {
  return tpl.replace(/\{(\w+)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => {
    const v = vars[k] ?? "";
    return a ? v + (batchim(v) ? a : b) : v;
  });
}
const say = (arr, vars) => fill(pick(arr), vars);
const randomName = () => weighted(SURNAMES) + pick(GIVEN_NAMES);

function poisson(lambda) {
  const L = Math.exp(-lambda); let k = 0, q = 1;
  do { k++; q *= rand(); } while (q > L);
  return k - 1;
}

export function eligibility(state, fx) {
  const p = state.player;
  if (p.condition.injury) return { ok: false, reason: "부상으로 결장" };
  const lv = state.flags.academicLevel;
  if (fx.official && lv >= 4) return { ok: false, reason: "학업 부진으로 공식 경기 출전 정지" };
  if (fx.tournament && lv >= 3) return { ok: false, reason: "학업 부진으로 대회 출전 제한" };
  return { ok: true };
}

// 학년이 높은 골키퍼가 나서되, 강한 골키퍼(strong)가 있으면 그 선수가 먼저 나섭니다
function keeperOf(state) {
  const g = state.calendar.grade;
  const list = GOALKEEPERS.map(k => ({ ...k, g: mateGrade(k, g) })).filter(k => k.g >= 1 && k.g <= 3)
    .sort((a, b) => (b.strong ? 1 : 0) - (a.strong ? 1 : 0) || b.g - a.g);
  return list[0] || { name: "골키퍼" };
}
function ourKeeper(state) { return keeperOf(state).name; }

// 경기 전 감독·코치 한마디 (지시 tag와 같은 종류의 선택을 하면 성공률 +4%p)
function pickTalk(state, fx, status, star) {
  const p = state.player;
  const keys = [];
  if (status === "start") keys.push("start");
  if (status === "sub") keys.push("sub");
  if (status === "bench") keys.push("bench");
  if (status === "start" || status === "sub") {
    if (fx.tournament) keys.push("big");
    if (fx.ko) keys.push("ko");
    if (fx.comp === "hs") keys.push("hs");
    if (p.condition.fatigue >= 60) keys.push("tired");
    if (star >= 1) keys.push("star");
  }
  if (!keys.length) return null;
  const special = PREMATCH.filter(t => keys.includes(t.when) && !["start", "sub", "bench"].includes(t.when));
  const pool = special.length && chance(0.6) ? special : PREMATCH.filter(t => keys.includes(t.when));
  const t = pool.length ? pick(pool) : null;
  return t ? { who: t.who, text: t.t, tag: t.tag } : null;
}
export const TAG_LABEL = { shoot: "슈팅", pass: "패스", dribble: "돌파", defend: "수비", physical: "몸싸움", safe: "안정적으로" };
export function choiceTag(c) {
  const st = c.stats || {};
  const top = Object.entries(st).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  if (st["tech.shoot"] >= 0.5) return "shoot";
  if (st["tech.defense"] >= 0.5) return "defend";
  if ((st["tech.pass"] || 0) + (st["tech.cross"] || 0) >= 0.5) return "pass";
  if (st["tech.dribble"] >= 0.5 || top === "phys.agility" || top === "phys.speed") return "dribble";
  if (top === "phys.strength" || top === "phys.jump") return "physical";
  if (c.diff <= -6 || top.startsWith("mental")) return "safe";
  return null;
}
// 타이밍 버튼이 붙는 결정적 장면
export function timingKind(c) {
  if (["shot", "chip", "head", "tapIn", "pk"].includes(c.win)) return "shot";
  const st = c.stats || {};
  if ((st["tech.defense"] || 0) >= 0.5) return "tackle";
  if (["assist", "killPass"].includes(c.win)) return "pass";
  if ((st["tech.dribble"] || 0) >= 0.5 && c.win !== "keep") return "dribble";
  return null;
}

// ── 경기 준비 ───────────────────────
export function prepareMatch(state, info, fx) {
  const p = state.player;
  const elig = eligibility(state, fx);
  const depth = depthChart(state);

  let status = "out", minIn = 0;
  if (elig.ok) {
    if (depth.rank <= depth.slots) status = "start";
    else if (!fx.official) { status = "sub"; minIn = int(30, 40); }
    else if (depth.rank <= depth.slots + 2 && chance(0.65)) { status = "sub"; minIn = int(45, 60); }
    else if (depth.rank <= depth.slots + 3) status = "bench";
  }
  let restNote = null;
  if (status === "start" && fx.official && !fx.ko && p.condition.fatigue >= 85) {
    status = "sub"; minIn = int(40, 50);
    restNote = `피로가 ${Math.round(p.condition.fatigue)}까지 쌓여 감독님이 후반에 넣기로 했다.`;
  }
  const onPitch = status === "start" || status === "sub";
  const cond = conditionOf(p);
  const teamAvg = teamStrength(state, false);
  const myOvr = ovr(p);
  const star = onPitch ? clamp((myOvr - teamAvg) / 15 + (hasTrait(p, "ace") ? 0.2 : 0), 0, 1.7) : 0;

  const roster = activeRoster(state);
  const lineup = [];
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const n = def.slots - (status === "start" && pos === p.position ? 1 : 0);
    roster.filter(m => m.position === pos).sort((a, b) => b.ovrNow - a.ovrNow).slice(0, n)
      .forEach(m => lineup.push({ name: m.name, number: m.number, pos }));
  }
  // 상대 필드 선수 10명 (DF 4, MF 4, FW 2). 경기장 위 번호와 중계 이름이 같은 사람
  const usedNames = new Set([p.name, ...roster.map(r => r.name)]);
  const oppPlayers = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 17]).slice(0, 10).map((n, i) => {
    let name; do { name = randomName(); } while (usedNames.has(name)); usedNames.add(name);
    return { name, number: n, pos: i < 4 ? "DF" : i < 8 ? "MF" : "FW" };
  });
  // 교체로 들어갈 같은 포지션 후보 (부상 교체용)
  const bench = roster.filter(m => m.position === p.position && !lineup.some(l => l.name === m.name)).sort((a, b) => b.ovrNow - a.ovrNow)
    .map(m => ({ name: m.name, number: m.number }));

  // 내가 뛰면 내 능력치와 컨디션이 팀 전력에 직접 더해짐
  const ours = teamStrength(state, onPitch) * 0.6 + 50 * 0.4 + (onPitch ? (myOvr - teamAvg) * 0.12 + cond.match * 15 : 0)
    + (keeperOf(state).strong ? 1.5 : 0);
  const theirs = fx.opponent.strength;

  const events = [{ type: "kickoff", minute: 0 }];
  const nOur = poisson(6.8 * Math.exp((ours - theirs) / 14));
  const nTheir = poisson(6.8 * Math.exp((theirs - ours) / 14));
  for (let i = 0; i < nOur; i++) events.push({ type: "ours", minute: int(1, LENGTH) });
  for (let i = 0; i < nTheir; i++) events.push({ type: "theirs", minute: int(1, LENGTH) });
  for (let i = 0, n = int(4, 6); i < n; i++) events.push({ type: "ambient", minute: int(2, LENGTH - 1) });
  if (onPitch) {
    const from = status === "start" ? 1 : minIn + 1;
    // 능력치가 팀 평균보다 높을수록 공이 더 자주 나에게 옴
    const n = status === "start" ? int(6, 7) + Math.round(star * 1.5) : Math.max(2, Math.round((LENGTH - minIn) / LENGTH * (7 + star * 2)));
    for (let i = 0; i < n; i++) events.push({ type: "moment", minute: int(from, LENGTH) });
    if (status === "sub") events.push({ type: "subIn", minute: minIn - 0.5 });
    // 경기 중 부상 (드묾). 피로가 높을수록, 유리몸이면 더 자주
    const share = (LENGTH - (status === "start" ? 0 : minIn)) / LENGTH;
    const injP = 0.012 * share * (1 + p.condition.fatigue / 60) * (hasTrait(p, "glassBody") ? 1.8 : 1) * (hasTrait(p, "comeback") ? 0.8 : 1);
    if (chance(injP)) events.push({ type: "injury", minute: int(from + 3, LENGTH - 2) + 0.3 });
  }
  events.push({ type: "ht", minute: HALF + 0.5 }, { type: "2h", minute: HALF + 0.6 }, { type: "ft", minute: LENGTH + 0.5 });
  events.sort((a, b) => a.minute - b.minute);

  let physGap = 0;
  if (fx.comp === "hs") physGap = clamp((172 - p.body.height) / 120 + (58 - p.stats.phys.strength) / 160, 0, 0.12);

  return {
    fx, turn: info.turn, grade: info.grade, status, reason: elig.ok ? null : elig.reason, restNote,
    star, meRate: onPitch ? clamp(0.09 + star * 0.11 + (hasTrait(p, "ace") ? 0.03 : 0), 0.08, 0.32) : 0, me: p.name, myPos: p.position,
    minIn: status === "sub" ? minIn : 0, onPitch,
    ours, theirs, lineup, oppPlayers, bench, talk: pickTalk(state, fx, status, star),
    gk: { us: ourKeeper(state), them: randomName() }, myNumber: p.number,
    events, i: 0, minute: 0, score: [0, 0],
    stats: { us: { shots: 0, on: 0, corners: 0, cards: 0 }, them: { shots: 0, on: 0, corners: 0, cards: 0 },
             poss: Math.round(clamp(50 + (ours - theirs) * 1.1 + normal(0, 4), 28, 72)) },
    goalsLog: [],
    my: { goals: 0, assists: 0, delta: 0, decisions: 0, successes: 0, log: [], followed: 0, timing: [] },
    formSwing: hasTrait(p, "inconsistent") ? normal(0, 0.06) : 0, physGap,
    feed: [], pending: null, half: 1, done: false, used: {}, trailed: { us: false, them: false },
  };
}

// ── 좌표 ────────────────────────────
function yOf(spec, side) {
  if (typeof spec === "number") return clamp(spec + range(-2, 2), 2, 66);
  if (spec === "W") return side ? range(5, 10) : range(58, 63);
  if (spec === "H") return side ? range(16, 24) : range(44, 52);
  if (spec === "K") return side ? 1 : 67;
  return range(27, 41);
}
const flip = (team, x) => (team === "us" ? x : 105 - x);
const goalPt = team => [team === "us" ? 104.6 : 0.4, range(31, 37)];
const keeperPt = team => [team === "us" ? 101 : 4, range(31, 37)];

function namesOf(m, team, pos) {
  if (pos === "GK") return [team === "us" ? m.gk.us : m.gk.them];
  const pool = team === "us" ? m.lineup : m.oppPlayers;
  const list = pool.filter(x => x.pos === pos);
  return (list.length ? list : pool).map(x => x.name);
}
const mateName = (m, prefer = ["FW", "MF"]) => {
  const pool = m.lineup.filter(x => prefer.includes(x.pos));
  return pick(pool.length ? pool : m.lineup)?.name || "동료";
};
const oppName = (m, prefer = ["FW", "MF"]) => pick(m.oppPlayers.filter(x => prefer.includes(x.pos))).name;

// 골이 들어간 뒤 스코어와 흐름을 알려 주는 한 줄
function goalNote(m, team, min) {
  const [a, b] = m.score;
  const d = team === "us" ? a - b : b - a;      // 득점한 팀 기준 점수 차
  const behind = team === "us" ? m.trailed.us : m.trailed.them;
  let note;
  if (d === 0) note = team === "us" ? "동점골! 승부는 다시 원점이다." : "동점을 허용했다.";
  else if (d === 1 && behind) note = team === "us" ? "역전골! 경기를 뒤집었다!" : "역전을 허용했다…";
  else if (d === 1) note = team === "us" ? "앞서 나가는 골!" : "먼저 실점했다.";
  else if (d >= 2) note = team === "us" ? "달아나는 골! 격차를 벌린다." : "격차가 벌어진다.";
  else note = team === "us" ? "한 골 따라붙었다!" : "상대가 한 골 따라붙었다.";
  if (a < b) m.trailed.us = true;
  if (b < a) m.trailed.them = true;
  return { t: `${note} ${TEAM_NAME} ${a} : ${b} ${m.fx.opponent.name}`, k: "stat", minute: min };
}

// 팀 공격 한 번: 패스 전개 → 마무리 → 결과
function runPlay(m, team) {
  // 페널티킥 전개는 한 경기에 팀당 한 번까지
  const plays = PLAYS.filter(pl => pl.finish !== "pk" || !m.used[`pk_${team}`]);
  const play = weighted(plays.map(pl => [pl, pl.weight]));
  if (play.finish === "pk") m.used[`pk_${team}`] = true;
  const side = chance(0.5);
  const min = m.minute;
  const lines = [];
  const onNow = m.onPitch && min >= m.minIn;

  // 내가 끼는 공격: 같은 자리 단계 하나를 내가 맡음 (문장을 만들기 전에 먼저 정함)
  let meIdx = -1;
  if (team === "us" && onNow && chance(m.meRate)) {
    const idx = play.steps.map((st, i) => (st.who === m.myPos || (m.myPos !== "DF" && i === play.steps.length - 1)) ? i : -1).filter(i => i >= 0);
    if (idx.length) meIdx = pick(idx);
  }
  // 단계마다 공을 가진 선수. same: true 단계는 앞 단계 선수가 그대로 이어 감
  let prev = null;
  const actors = play.steps.map((st, i) => {
    if (st.same && prev) return prev;
    if (i === meIdx) { prev = m.me; return prev; }
    const names = namesOf(m, team, st.who).filter(n => n !== prev);
    prev = pick(names.length ? names : namesOf(m, team, st.who));
    return prev;
  });
  // 내가 맡은 단계 뒤에 same 단계가 이어지면 그것도 나
  if (meIdx >= 0) for (let i = meIdx + 1; i < play.steps.length && play.steps[i].same; i++) actors[i] = m.me;
  play.steps.forEach((st, i) => {
    const pt = [flip(team, st.at[0]), yOf(st.at[1], side)];
    const mine = actors[i] === m.me && team === "us";
    const last = i === play.steps.length - 1;
    let t = st.t.length ? fill(pick(st.t), { a: actors[i], b: actors[i + 1] || actors[i] }) : "";
    if (mine && !last && !st.t.length) t = fill(pick(i === play.steps.length - 2 ? ME_IN_PLAY.pass : ME_IN_PLAY.build), { me: m.me });
    if (t) lines.push({ t, k: mine ? "me-auto" : team === "us" ? "us" : "them", minute: min, ball: pt, poss: team, fast: true, meHold: mine, actor: actors[i] });
    else lines.push({ t: "", k: "", minute: min, ball: pt, poss: team, fast: true, silent: true, actor: actors[i] });
  });
  // 슈팅까지 못 가고 끊기는 공격 (약 30%)
  if (!["pk", "fk"].includes(play.finish) && play.steps.length >= 2 && chance(0.3)) {
    const k = int(1, play.steps.length - 1);           // 이 단계에서 끊김
    const cut = lines.slice(0, k);
    const other = team === "us" ? "them" : "us";
    const kind = play.finish === "header" && k === play.steps.length - 1 ? "claim"
      : weighted([["intercept", 0.38], ["tackle", 0.32], ["offside", 0.15], ["out", 0.15]]);
    let d = team === "us" ? oppName(m, ["DF", "MF"]) : mateName(m, ["DF", "MF"]);
    // 상대 공격을 내가 끊는 장면 (수비수·미드필더)
    const meCut = other === "us" && onNow && (m.myPos === "DF" || m.myPos === "MF") && ["intercept", "tackle"].includes(kind) && chance(m.meRate);
    if (meCut) { d = m.me; m.my.delta += 0.1; m.my.involved = (m.my.involved || 0) + 1; m.my.stops = (m.my.stops || 0) + 1; }
    const gk = team === "us" ? m.gk.them : m.gk.us;
    const at = cut.at(-1)?.ball || [52.5, 34];
    const ballPt = kind === "out" ? [flip(team, 104), chance(0.5) ? 0.5 : 67.5] : kind === "claim" ? keeperPt(team) : [Math.max(2, Math.min(103, at[0] + (team === "us" ? 6 : -6))), at[1]];
    const txt = fill(pick(BREAK[kind]), { a: actors[k - 1], d, gk });
    cut.push({ t: (meCut ? "" : "") + txt, k: meCut ? "me-auto" : other === "us" ? "us" : "them", minute: min, ball: ballPt, poss: other,
      actor: kind === "claim" ? gk : ["intercept", "tackle"].includes(kind) ? d : null, meHold: meCut });
    if (meIdx >= 0 && meIdx < k) { m.my.delta += 0.03; m.my.involved = (m.my.involved || 0) + 1; }
    return cut;
  }
  if (meIdx >= 0) { m.my.delta += 0.05; m.my.involved = (m.my.involved || 0) + 1; }

  // 상대 공격: 수비 능력이 좋으면 내가 끊어 냄
  if (team === "them" && onNow && (m.myPos === "DF" || m.myPos === "MF") && chance(m.meRate * (m.myPos === "DF" ? 1.1 : 0.7))) {
    const pl = m._p;
    const q = clamp(0.3 + (pl.stats.tech.defense - m.theirs) / 60 + conditionOf(pl).match, 0.1, 0.85);
    if (rand() < q) {
      lines.push({ t: fill(pick(ME_IN_PLAY.stop), { me: m.me }), k: "me-auto", minute: min, ball: lines.at(-1).ball, poss: "us", meHold: true, actor: m.me });
      m.my.delta += 0.2; m.my.involved = (m.my.involved || 0) + 1; m.my.stops = (m.my.stops || 0) + 1;
      return lines;
    }
  }

  const shooter = actors.at(-1);
  const assister = actors.length > 1 ? actors.at(-2) : null;
  const meShoots = shooter === m.me && team === "us";
  const finTxt = meShoots ? (ME_IN_PLAY[{ header: "head", fk: "fk", pk: "pk" }[play.finish]] || ME_IN_PLAY.shot) : FINISH[play.finish];
  lines.push({ t: fill(pick(finTxt), { a: shooter, me: m.me }), k: meShoots ? "me-auto" : team === "us" ? "us" : "them", minute: min, ball: lines.at(-1).ball, poss: team, fast: true, meHold: meShoots, actor: shooter });

  const st = m.stats[team];
  st.shots++;
  if (play.id === "corner") st.corners++;
  const diff = team === "us" ? m.ours - m.theirs : m.theirs - m.ours;
  const mult = { shot: 1, header: 0.85, long: 0.45, fk: 0.5 }[play.finish] || 1;
  let conv = clamp((0.24 + diff / 200) * mult, 0.06, 0.42);
  if (meShoots) {
    const pl = m._p;
    const stat = play.finish === "header" ? pl.stats.phys.jump * 0.6 + pl.stats.tech.shoot * 0.4 : pl.stats.tech.shoot;
    conv = clamp((0.06 + (stat - (m.theirs + 4)) / 110 + conditionOf(pl).match * 0.6 + (hasTrait(pl, "finisher") ? 0.04 : 0)) * mult, 0.04, 0.36);
  }
  if (play.finish === "pk") conv = meShoots ? clamp(0.62 + (m._p.stats.tech.shoot - 55) / 200 + conditionOf(m._p).match, 0.5, 0.88) : clamp(0.72 + diff / 300, 0.6, 0.84);
  const vars = { a: shooter, gk: team === "us" ? m.gk.them : m.gk.us, d: team === "us" ? oppName(m, ["DF"]) : mateName(m, ["DF"]) };
  const R = RESULT[team];
  if (rand() < conv) {
    st.on++;
    team === "us" ? m.score[0]++ : m.score[1]++;
    const ast = play.id === "longshot" ? null : assister;
    m.goalsLog.push({ team, name: shooter, minute: min, assist: ast, me: meShoots, myAssist: ast === m.me });
    if (meShoots) { m.my.goals++; m.my.delta += 0.85; }
    if (team === "us" && ast === m.me) { m.my.assists++; m.my.delta += 0.45; }
    lines.push({ t: say(R.goal, vars), k: meShoots ? "goal-me" : team === "us" ? "goal-us" : "goal-them", minute: min, ball: goalPt(team), poss: team });
    lines.push(goalNote(m, team, min));
  } else {
    const kind = play.finish === "pk" ? weighted([["save", 0.7], ["wide", 0.2], ["post", 0.1]])
      : weighted([["save", 0.42], ["wide", 0.3], ["block", 0.16], ["post", 0.12]]);
    if (kind === "save") st.on++;
    const ball = kind === "save" ? keeperPt(team) : kind === "wide" ? [flip(team, 105), range(18, 50)] : kind === "post" ? [flip(team, 104.5), chance(0.5) ? 30.4 : 37.6] : [flip(team, 88), range(26, 42)];
    lines.push({ t: say(R[kind], vars), k: team === "us" ? "us" : "them", minute: min, ball, poss: kind === "save" || kind === "wide" ? (team === "us" ? "them" : "us") : team,
      actor: kind === "save" ? vars.gk : kind === "block" ? vars.d : null });
    if ((kind === "save" || kind === "block") && chance(0.35)) {
      st.corners++;
      const taker = team === "us" ? mateName(m, ["MF"]) : oppName(m, ["MF"]);
      lines.push({ t: team === "us" ? `코너킥을 얻었다. ${taker}의 킥은 수비 머리에 걸린다.` : `상대 코너킥. ${taker}의 킥을 우리 수비가 걷어 냈다.`, k: team === "us" ? "us" : "them", minute: min, ball: [flip(team, 104), chance(0.5) ? 1 : 67], poss: team, fast: true, actor: taker });
    }
  }
  return lines;
}

// ── 진행 ────────────────────────────
// kind: "line" 계속 / "moment" 선택 대기 / "ht" 하프타임 / "ft" 종료
export function next(state, m) {
  if (m.pending || m.done) return { kind: m.done ? "ft" : "moment", lines: [] };
  const ev = m.events[m.i++];
  if (!ev) { m.done = true; return { kind: "ft", lines: [] }; }
  m.minute = Math.min(LENGTH, Math.floor(ev.minute));
  const min = m.minute;
  const L = (t, k = "info", extra = {}) => ({ t, k, minute: min, ...extra });
  let lines = [];

  if (ev.type === "kickoff") {
    lines.push(L(say(LINES.kickoff, { us: TEAM_NAME }), "whistle", { ball: [52.5, 34], poss: "us" }));
    if (!m.onPitch) lines.push(L(m.status === "bench" ? "벤치에서 경기를 지켜본다. 언제 부를지 모른다." : (m.reason || "관중석에서 경기를 지켜본다.")));
    if (m.restNote) lines.push(L(m.restNote, "coach"));
    if (m.star >= 1 && m.status === "start") lines.push(L(fill(pick(ME_IN_PLAY.marked), { me: m.me }), "me-auto"));
  }
  if (ev.type === "injury" && m.onPitch && !m.injured) {
    const type = weighted([["ankle", 0.55], ["hamstring", 0.3], ["knee", 0.15]]);
    const t = INJURY_LINES[type];
    m.injured = { type, minute: min, cause: t.cause };
    m.onPitch = false;
    lines.push(L(fill(pick(t.lines), { me: m.me }), "me-bad", { ball: [range(40, 80), range(15, 55)], poss: "them" }));
    lines.push(L(fill("의무 트레이너가 뛰어 들어간다. {coach|이/가} 벤치에서 교체 사인을 보낸다.", { coach: STAFF.coach }), "coach"));
    const rep = m.bench?.[0];
    if (rep) m.lineup.push({ name: rep.name, number: rep.number, pos: m.myPos });
    lines.push(L(pick(t.after) + (rep ? fill(` ${rep.number}번 {r|이/가} 대신 들어간다.`, { r: rep.name }) : ""), "info", { injuredOff: rep || { name: "교체 선수", number: "" } }));
  }
  if (ev.type === "2h") lines.push(L(say(LINES.secondHalf, {}), "whistle", { ball: [52.5, 34], poss: "them" }));
  if (ev.type === "subIn") {
    // 경기장 위에서 내 자리에 서 있던 동료가 나간다 (화면의 점도 같은 사람)
    const same = m.lineup.filter(x => x.pos === m.myPos);
    const out = same[MY_SLOT[m.myPos]] || same.at(-1);
    if (out) m.lineup = m.lineup.filter(x => x !== out);
    lines.push(L(fill(`교체: {o|이/가} 나오고 {me|이/가} 들어간다. `, { o: out?.name || "동료", me: m.me }) + pick(LINES.subIn), "me", { ball: [52.5, 34], poss: "us", subIn: true }));
  }
  Object.defineProperty(m, "_p", { value: state.player, enumerable: false, configurable: true, writable: true });
  if (ev.type === "ours") lines = runPlay(m, "us");
  if (ev.type === "theirs") lines = runPlay(m, "them");
  if (ev.type === "ambient") {
    const fit = AMBIENT.filter(x => (!x.early || min < 15) && (!x.late || min >= 58) && (!x.min || min >= x.min));
    const a = pick(fit.length ? fit : AMBIENT);
    if (a.card) m.stats[a.card].cards++;
    const poss = a.side === "them" ? "them" : a.side === "us" ? "us" : chance(m.stats.poss / 100) ? "us" : "them";
    const av = { a: mateName(m, ["DF", "MF"]), o: oppName(m), coach: STAFF.coach, gk: m.gk.us };
    const actor = /\{a[|}]/.test(a.t) ? av.a : /\{o[|}]/.test(a.t) ? av.o : /\{gk[|}]/.test(a.t) ? av.gk : null;
    lines.push(L(fill(a.t, av), a.card ? "card" : "info",
      { ball: actor === av.gk ? [range(5, 9), range(28, 40)] : [range(30, 75), range(10, 58)], poss, actor }));
  }
  if (ev.type === "moment" && m.injured) { m.feed.push(...lines); return { kind: "line", lines }; }
  if (ev.type === "moment") {
    const sit = pickSituation(state, m);
    const poss = sit.poss || "us";
    if (sit.once) m.used[sit.id] = true;
    const myPos = state.player.position;
    const oppPref = poss === "them" ? ({ DF: ["FW"], MF: ["MF", "FW"], FW: ["DF"] }[myPos]) : (myPos === "DF" ? ["FW", "MF"] : ["DF", "MF"]);
    const sv = { mate: mateName(m), opp: oppName(m, oppPref), gk: m.gk.us, ogk: m.gk.them };
    const zone = sit.zone;
    const ball = zone === "att" ? [range(80, 88), range(24, 44)] : zone === "mid" ? [range(48, 60), range(18, 50)] : [range(20, 30), range(18, 50)];
    const holder = poss === "them" ? sv.opp : m.me;
    if (sit.intro !== false) lines.push(L(fill(pick(TO_ME[poss === "them" ? "def" : zone] || TO_ME.mid), sv), "me", { ball, poss, toMe: poss !== "them", actor: holder, press: poss === "them" }));
    else lines.push({ t: "", k: "", minute: min, ball, poss, toMe: poss !== "them", silent: true, actor: holder, press: poss === "them" });
    m._sitPoss = poss;
    const list = sit.choices.slice();
    const sig = SIGNATURE[sit.id];
    if (sig && Object.entries(sig.requires).every(([k, v]) => getPath(state.player.stats, k) >= v)) list.push({ ...sig, signature: true });
    const choices = list.map(c => { const p = prob(state, m, c); return { label: c.label, p, signature: !!c.signature,
      level: p >= 0.65 ? "높음" : p >= 0.4 ? "보통" : "낮음", timing: timingKind(c), follow: !!(m.talk?.tag && choiceTag(c) === m.talk.tag) }; });
    m.pending = { sit, list, vars: sv, text: fill(pick(sit.text), sv), choices, ball };
    m.feed.push(...lines);
    return { kind: "moment", lines };
  }
  if (ev.type === "ht") {
    m.half = 2;
    const [a, b] = m.score;
    const mood = a > b ? "winning" : a === b ? "drawing" : "losing";
    lines.push(L(`전반 종료. ${TEAM_NAME} ${a} : ${b} ${m.fx.opponent.name}`, "whistle", { ball: [52.5, 34], poss: null }));
    lines.push(L(statLine(m), "stat"));
    lines.push(L(`감독님: "${pick(HALFTIME_TALK[mood])}"`, "coach"));
    m.feed.push(...lines);
    return { kind: "ht", lines };
  }
  if (ev.type === "ft") {
    lines.push(L(say(LINES.fulltime, {}), "whistle", { ball: [52.5, 34], poss: null }));
    lines.push(L(statLine(m), "stat"));
    m.done = true;
    m.feed.push(...lines);
    return { kind: "ft", lines };
  }
  m.feed.push(...lines);
  return { kind: "line", lines };
}

export function statLine(m) {
  const u = m.stats.us, t = m.stats.them;
  return `점유율 ${m.stats.poss}% 대 ${100 - m.stats.poss}%, 슈팅 ${u.shots} 대 ${t.shots} (유효 ${u.on} 대 ${t.on}), 코너킥 ${u.corners} 대 ${t.corners}`;
}

function pickSituation(state, m) {
  const pos = state.player.position;
  const [a, b] = m.score;
  const late = m.minute >= 55;
  const pool = SITUATIONS.filter(s => s.pos.includes(pos) && (!s.once || !m.used[s.id])
    && (!s.late || late) && (!s.leading || a > b) && (!s.trailing || a < b));
  const losingLate = a < b && m.minute > 50;
  return weighted(pool.map(s => [s, s.weight * (losingLate && s.zone === "att" ? 1.6 : 1)]));
}

export function prob(state, m, c) {
  const p = state.player;
  let s = 0, w = 0;
  for (const [path, k] of Object.entries(c.stats)) { s += getPath(p.stats, path) * k; w += k; }
  s /= w;
  let x = 0.45 + (s - (m.theirs + c.diff)) / 70;
  x += (p.stats.mental.confidence - 50) / 350;
  x += conditionOf(p).match;                       // 컨디션 (피로 + 사기)
  // 후반이 될수록 체력이 낮거나 지친 선수는 무뎌짐
  if (m.minute > HALF) {
    const tired = Math.max(0, (p.condition.fatigue - 40) / 100) + Math.max(0, (60 - p.stats.phys.stamina) / 100);
    x -= tired * ((m.minute - HALF) / HALF) * 0.15 * (hasTrait(p, "ironLungs") ? 0.4 : 1);
  }
  const big = m.fx.tournament || m.fx.comp === "hs";
  if (big && hasTrait(p, "bigGame")) x += 0.05;
  if (big && hasTrait(p, "timid")) x -= 0.06;
  if (big && hasTrait(p, "champion")) x += 0.03;
  if (m._sitPoss === "them" && hasTrait(p, "wall")) x += 0.05;
  if (m.talk?.tag && choiceTag(c) === m.talk.tag) x += 0.04;
  if (hasTrait(p, "clutch") && m.score[0] < m.score[1] && m.minute > HALF) x += 0.07;
  if (c.physical) x -= m.physGap;
  x += m.formSwing;
  return clamp(x, 0.05, 0.95);
}

// ── 내 선택 처리 ────────────────────
export function resolve(state, m, ci, timing = null) {
  const pd = m.pending;
  const c = pd.list[ci];
  const bonus = timing ? { perfect: 0.12, good: 0.06, miss: -0.04 }[timing] || 0 : 0;
  const p = clamp(pd.choices[ci].p + bonus, 0.03, 0.97);
  if (timing) m.my.timing.push(timing);
  if (pd.choices[ci].follow) m.my.followed++;
  const ok = rand() < p;
  const out = ok ? c.win : c.lose;
  const v = pd.vars;
  const min = m.minute;
  const pl = state.player;
  const [bx, by] = pd.ball;
  // 상황 설명을 기록에 남겨야 나중에 읽어도 앞뒤가 이어짐
  const them = pd.sit.poss === "them";
  const holder0 = them ? v.opp : m.me;
  const lines = [{ t: pd.text, k: "me", minute: min, ball: pd.ball, poss: pd.sit.poss || "us", fast: true, actor: holder0, press: them },
                 { t: `▶ ${c.label}${timing ? ` ${{ perfect: "(완벽한 타이밍!)", good: "(좋은 타이밍)", miss: "(타이밍이 어긋났다)" }[timing]}` : ""}`, k: "me", minute: min, ball: pd.ball, poss: pd.sit.poss || "us", actor: holder0, press: them }];

  // 결과 문장과 공의 움직임
  const after = {
    win: [[bx + 10, by], "us"], keep: [[bx + 5, by + range(-6, 6)], "us"], miss: [[100, 34], "them"],
    turnover: [[bx - 4, by], "them"], danger: [[range(14, 20), range(28, 40)], "them"],
    shot: [[Math.max(bx, 86), range(28, 40)], "us"], chip: [[Math.max(bx, 88), range(30, 38)], "us"], head: [[94, range(30, 38)], "us"],
    assist: [[90, range(28, 40)], "us"], keyPass: [[84, range(22, 46)], "us"], killPass: [[93, range(30, 38)], "us"],
    tapIn: [[97, range(31, 37)], "us"], pk: [[94, 34], "us"], matePk: [[94, 34], "us"], setPiece: [[80, range(26, 42)], "us"],
    offside: [[bx, by], "them"], pkAgainst: [[11, 34], "them"],
  }[out] || [[bx, by], "us"];
  // 결과 장면에서 공을 가진 사람
  const actorOf = { win: m.me, keep: m.me, shot: m.me, chip: m.me, head: m.me, tapIn: m.me, pk: m.me,
    assist: v.mate, keyPass: v.mate, killPass: v.mate, matePk: v.mate, setPiece: v.mate,
    turnover: v.opp, danger: v.opp, pkAgainst: v.opp, offside: null, miss: null }[out];
  lines.push({ t: fill(pick(ok ? c.winText : c.loseText), v), k: ok ? "me-good" : "me-bad", minute: min, ball: after[0], poss: after[1], actor: actorOf });
  if (ok && pd.choices[ci].follow) lines.push({ t: fill("{c|이/가} 벤치에서 주먹을 쥔다. 경기 전 지시 그대로다.", { c: m.talk.who === "coach" ? STAFF.coach : STAFF.assistant }), k: "coach", minute: min });

  const main = Object.entries(c.stats).sort((a, b) => b[1] - a[1])[0][0];
  m.my.decisions++; if (ok) m.my.successes++;
  m.my.log.push({ sit: pd.sit.id, label: c.label, ok, out, stat: main, value: getPath(pl.stats, main), level: pd.choices[ci].level, minute: min });
  m.my.delta += OUTCOMES[out].rating;
  if (pd.sit.id === "penalty" && out === "miss") { m.stats.us.shots++; m.stats.us.on++; }
  else if (out === "miss" && (c.stats["tech.shoot"] || 0) >= 0.5) m.stats.us.shots++;   // 빗나간 슈팅도 슈팅 수에
  if (/corner/.test(pd.sit.id)) m.stats.us.corners++;

  const finish = (stat, goalTxt, saveTxt, wideTxt) => {
    m.stats.us.shots++;
    const q = clamp(0.035 + (stat - (m.theirs + 4)) / 120 + (pl.stats.mental.confidence - 50) / 400 + conditionOf(pl).match * 0.6
      + (hasTrait(pl, "finisher") ? 0.04 : 0), 0.04, 0.36);
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++; m.my.goals++; m.my.delta += 0.75;
      m.goalsLog.push({ team: "us", name: pl.name, minute: min, me: true });
      lines.push({ t: fill(pick(goalTxt), v), k: "goal-me", minute: min, ball: goalPt("us"), poss: "us" });
      lines.push(goalNote(m, "us", min));
    } else {
      const saved = rand() < 0.6;
      if (saved) m.stats.us.on++;
      lines.push({ t: fill(pick(saved ? saveTxt : wideTxt), v), k: "me", minute: min, ball: saved ? keeperPt("us") : [105, range(20, 48)], poss: "them", actor: saved ? m.gk.them : null });
    }
  };
  const teammateFinish = (q, goalTxt = LINES.assistGoal, missTxt = LINES.assistMiss, credit = true) => {
    m.stats.us.shots++;
    if (credit && hasTrait(pl, "playmaker")) q += 0.06;
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++;
      if (credit) { m.my.assists++; m.my.delta += 0.6; }
      m.goalsLog.push({ team: "us", name: v.mate, minute: min, assist: credit ? pl.name : null, myAssist: credit });
      lines.push({ t: fill(pick(goalTxt), v), k: "goal-us", minute: min, ball: goalPt("us"), poss: "us" });
      lines.push(goalNote(m, "us", min));
    } else lines.push({ t: fill(pick(missTxt), v), k: "us", minute: min, ball: keeperPt("us"), poss: "them", actor: m.gk.them });
  };
  const concede = (q, txtGoal, txtSave) => {
    m.stats.them.shots++;
    if (rand() < q) {
      m.stats.them.on++; m.score[1]++; m.my.delta -= 0.25;
      m.goalsLog.push({ team: "them", name: v.opp, minute: min, myFault: true });
      lines.push({ t: fill(pick(txtGoal), v), k: "goal-them", minute: min, ball: goalPt("them"), poss: "them" });
      lines.push(goalNote(m, "them", min));
    } else if (txtSave) lines.push({ t: fill(pick(txtSave), { ...v, mate: mateName(m, ["DF"]) }), k: "them", minute: min, ball: keeperPt("them"), poss: "us", actor: m.gk.us });
  };

  if (out === "shot") finish(pl.stats.tech.shoot, LINES.myShotGoal, LINES.myShotSaved, LINES.myShotWide);
  if (out === "chip") finish(pl.stats.tech.shoot + 8, LINES.myChipGoal, LINES.myChipMiss, LINES.myChipMiss);
  if (out === "head") finish(pl.stats.phys.jump * 0.6 + pl.stats.tech.shoot * 0.4, LINES.myHeadGoal, LINES.myHeadMiss, LINES.myHeadMiss);
  if (out === "assist") teammateFinish(0.35);
  if (out === "keyPass") teammateFinish(0.18);
  if (out === "killPass") teammateFinish(0.5);
  if (out === "tapIn") finish(pl.stats.tech.shoot + 20, LINES.tapGoal, LINES.myShotSaved, LINES.myShotWide);
  if (out === "pk") {
    m.stats.us.shots++; m.stats.us.on++; m.score[0]++; m.my.goals++; m.my.delta += 0.6;
    m.goalsLog.push({ team: "us", name: pl.name, minute: min, me: true });
    lines.push({ t: fill(pick(LINES.pkGoal), v), k: "goal-me", minute: min, ball: goalPt("us"), poss: "us" });
    lines.push(goalNote(m, "us", min));
  }
  if (out === "matePk") teammateFinish(0.72, LINES.matePkGoal, LINES.matePkMiss, false);
  if (out === "setPiece") teammateFinish(0.16, LINES.fkGoal, LINES.fkMiss, false);
  if (out === "pkAgainst") concede(0.74, LINES.pkAgainstGoal, LINES.pkAgainstSave);
  if (out === "turnover") concede(0.1, pd.sit.poss === "them" ? LINES.leakGoal : LINES.turnoverGoal, null);
  if (out === "danger") concede(0.38, LINES.dangerGoal, LINES.dangerSave);

  m.pending = null;
  m.feed.push(...lines);
  return { ok, outcome: out, lines };
}

const VALUE = { goal: 1, chip: 0.45, shot: 0.35, head: 0.3, assist: 0.45, killPass: 0.55, keyPass: 0.3, win: 0.3, keep: 0.1, miss: 0, turnover: -0.12, danger: -0.38,
  tapIn: 0.6, pk: 1, matePk: 0.6, setPiece: 0.2, offside: -0.05, pkAgainst: -0.75 };
export function autoChoice(m) {
  const pd = m.pending;
  let best = 0, bestV = -9;
  pd.list.forEach((c, i) => {
    const p = pd.choices[i].p;
    const v = p * VALUE[c.win] + (1 - p) * VALUE[c.lose];
    if (v > bestV) { bestV = v; best = i; }
  });
  return best;
}

export function autoPlay(state, m) {
  let guard = 0;
  while (!m.done && guard++ < 300) {
    if (m.pending) resolve(state, m, autoChoice(m));
    else next(state, m);
  }
}

const rec0 = state => state.record;

// 경기 중 부상 문장
const INJURY_LINES = {
  ankle: { cause: "경기 중 상대 태클에 발목이 꺾였다.",
    lines: ["{me|이/가} 상대 태클에 걸려 넘어졌다. 발목을 붙잡고 일어나지 못한다.", "착지하던 {me}의 발목이 안쪽으로 꺾였다. 표정이 일그러진다."],
    after: ["동료의 부축을 받아 절뚝이며 경기장을 빠져나간다.", "벤치에서 얼음찜질을 한다. 발목이 금세 부어오른다."] },
  hamstring: { cause: "전력 질주 중 허벅지 뒤가 당겼다.",
    lines: ["전력으로 뛰던 {me|이/가} 갑자기 멈춰 선다. 허벅지 뒤를 잡는다.", "{me|이/가} 공을 쫓다가 다리를 절기 시작한다. 햄스트링이다."],
    after: ["더 뛰겠다고 했지만 감독님은 고개를 저었다.", "벤치에 앉아 수건을 머리에 덮는다."] },
  knee: { cause: "몸싸움 끝에 무릎을 다쳤다.",
    lines: ["경합 끝에 넘어진 {me|이/가} 무릎을 감싸 쥔다. 경기가 멈췄다.", "{me}의 무릎이 상대와 부딪혔다. 쉽게 일어나지 못한다."],
    after: ["들것이 들어왔다. 관중석이 조용해진다.", "부축을 받고 나가며 하늘을 올려다본다."] },
};

// ── 경기 끝 ─────────────────────────
export function finishMatch(state, m) {
  const p = state.player, fx = m.fx;
  const [gf, ga] = m.score;
  let shootout = null;
  if (fx.ko && gf === ga) {
    const pw = 0.5 + (m.ours - m.theirs) / 80 + (m.onPitch ? (p.stats.tech.shoot - 50) / 400 : 0);
    const win = chance(clamp(pw, 0.2, 0.8));
    const k = int(3, 5);
    shootout = win ? { win, us: k, them: k - 1 } : { win, us: k - 1, them: k };
    m.feed.push({ t: `승부차기 ${shootout.us} : ${shootout.them}. ${win ? "이겼다!" : "졌다…"}`, k: win ? "goal-us" : "goal-them", minute: LENGTH });
  }

  let minutes = m.status === "start" ? LENGTH : m.status === "sub" ? LENGTH - m.minIn : 0;
  if (m.injured) minutes = Math.max(1, m.injured.minute - (m.status === "sub" ? m.minIn : 0));
  // 후반 승부처 골 (55분 이후, 동점을 만들거나 앞서게 한 내 골)
  let clutch = 0;
  { let a = 0, b = 0;
    for (const g of m.goalsLog.slice().sort((x, y) => x.minute - y.minute)) {
      if (g.team === "us") { const before = a - b; a++; if (g.me && g.minute >= 55 && before <= 0 && a - b >= 0) clutch++; } else b++;
    } }
  if (clutch) rec0(state).clutchGoals = (rec0(state).clutchGoals || 0) + clutch;
  let rating = null;
  if (minutes > 0) {
    let r = 6.1 + m.my.delta * 0.66 + (gf > ga ? 0.3 : gf < ga ? -0.3 : 0) + normal(0, 0.2);
    if (p.position === "DF" && ga === 0) r += 0.3;
    if (minutes < 25) r = 6 + (r - 6) * 0.6;
    rating = Math.round(clamp(r, 4, 10) * 10) / 10;
  }
  const result = gf > ga ? "승" : gf < ga ? "패" : (shootout ? (shootout.win ? "승" : "패") : "무");
  const mom = rating != null && rating >= 8 && result !== "패";

  const rec = state.record;
  if (minutes > 0) {
    rec.apps++; if (m.status === "start") rec.starts++;
    rec.goals += m.my.goals; rec.assists += m.my.assists; rec.ratings.push(rating);
    if (mom) rec.mom = (rec.mom || 0) + 1;
    state.relations.coach = clamp(state.relations.coach + (rating - 6.6) * 0.8, 0, 100);
    p.condition.fatigue = clamp(p.condition.fatigue + 16 * minutes / LENGTH, 0, 100);
    if (m.my.goals) applyGain(state, "mental.confidence", m.my.goals * 1.2, { raw: true });
    applyGain(state, "mental.competitive", 0.4, { raw: true });
    if (rating >= 7.5) applyGain(state, "mental.confidence", 0.5, { raw: true });
    if (rating < 5.8) applyGain(state, "mental.confidence", -0.6, { raw: true });
  }
  p.condition.morale = clamp(p.condition.morale + (result === "승" ? 6 : result === "패" ? -5 : 0)
    + (m.onPitch ? 0 : -3) + (mom ? 5 : 0), 0, 100);

  const notes = applyResult(state, fx, gf, ga, { shootoutWin: shootout?.win ?? null, rating });

  const res = {
    turn: m.turn, grade: m.grade, comp: fx.compLabel, compId: fx.comp, round: fx.round, official: fx.official,
    opponent: fx.opponent.name, gf, ga, result, status: m.status, minutes, goals: m.my.goals, assists: m.my.assists,
    rating, reason: m.reason, shootout, mom, school: fx.school?.name || null,
    possession: m.stats.poss, shots: [m.stats.us.shots, m.stats.them.shots], involved: m.my.involved || 0, stops: m.my.stops || 0,
    injury: m.injured || null, clutch,
  };
  rec.matches.push(res);
  matchMails(state, m, res, notes);
  res.notes = notes.map(n => typeof n === "string" ? n : n.title);
  return res;
}
