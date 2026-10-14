// 경기 엔진: 경기장 시뮬레이션(sim.js)이 실제로 경기를 굴리고, 여기서는 그 사건을 중계 문장으로 받아 적습니다.
// 공이나 상황이 실제로 나에게 오면 그때의 자리와 압박에 맞는 장면(SITUATIONS)을 골라 멈추고 선택을 받습니다.
// 선택 결과는 다시 경기장에서 일어나게 합니다 (슛이면 실제로 차고, 뺏기면 상대 공으로 이어짐).
import { SITUATIONS, OUTCOMES, LINES, HALFTIME_TALK, HT_TALK, PLAYS, FINISH, RESULT, AMBIENT, TO_ME, SIGNATURE, ME_IN_PLAY, BREAK, PREMATCH, FLOW, SIM_LINES } from "../../data/match.js";
import { SURNAMES, GIVEN_NAMES } from "../../data/world.js";
import { POSITIONS } from "../../data/player.js";
import { GOALKEEPERS, STAFF } from "../../data/roster.js";
import { rand, int, range, normal, chance, pick, weighted, clamp, getPath, shuffle } from "../rng.js";
import { ovr, depthChart, teamStrength, activeRoster, mateGrade } from "./team.js";
import { hasTrait, applyGain, conditionOf } from "./growth.js";
import { applyResult, TEAM_NAME } from "./season.js";
import { matchMails, styleOf } from "./advice.js";
import { isBirthdayWeek } from "./birthday.js";
import { turnInfo } from "./calendar.js";
import { oppLineup, noteOpp } from "./opponents.js";
import { SCENES } from "../../data/scenes.js";
import { createSim, step as simStep, DT, RATE, HALF_T, kickoffSetup, setScript, stageStart, minuteOf, meOf, gkOf, setRestart, passTo } from "./sim.js";

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
  // 교체 출전 예정이어도 경기 전에는 벤치 선수와 똑같이 보임 (투입은 깜짝)
  if (status === "sub" || status === "bench") keys.push("bench");
  if (status === "start") {
    if (fx.tournament) keys.push("big");
    if (fx.ko) keys.push("ko");
    if (fx.comp === "hs") keys.push("hs");
    if (p.condition.fatigue >= 60) keys.push("tired");
    if (star >= 1) keys.push("star");
  }
  if (!keys.length) return null;
  if (fx.jn && status === "start") return pick([
    { who: "coach", text: "여기 있는 애들, 다 자기 학교에서 제일 잘하는 애들이다. 그러니까 공을 혼자 들고 있지 마라. 믿고 줘라.", tag: "pass" },
    { who: "coach", text: "전남 마크 달고 뛰는 거다. 고흥에서 온 걸 부끄러워하지 마라. 오늘은 네가 고흥이다.", tag: null },
    { who: "assistant", text: "상대 지역 대표는 몸싸움이 세다. 첫 번째 부딪힘에서 밀리지 마라.", tag: "physical" },
    { who: "coach", text: "하루 걸러 한 경기다. 다리 아끼지 말고, 대신 머리는 차갑게 써라.", tag: "safe" },
  ].filter(t => !t.tag || tagFit(p.position, t.tag) >= 0.18));
  if (status === "start" && !(state.record.starts > 0))
    return { who: "coach", text: "첫 선발이다. 떨리는 거 안다. 첫 패스 하나만 정확하게 해라. 나머지는 몸이 알아서 한다.", tag: tagFit(p.position, "pass") >= 0.18 ? "pass" : "safe" };
  // 내 포지션에서 실제로 따를 수 있는 지시만 (공격수에게 '수비 먼저' 같은 지시가 가지 않게)
  const fits = t => !t.tag || tagFit(p.position, t.tag) >= 0.18;
  const special = PREMATCH.filter(t => keys.includes(t.when) && !["start", "sub", "bench"].includes(t.when) && fits(t));
  const pool = special.length && chance(0.6) ? special : PREMATCH.filter(t => keys.includes(t.when) && fits(t));
  const t = pool.length ? pick(pool) : null;
  return t ? { who: t.who, text: t.t, tag: t.tag } : null;
}
// 포지션별로 그 지시를 따를 수 있는 장면의 비율 (처음 한 번 계산)
let FIT = null;
export function tagFit(pos, tag) {
  if (!FIT) {
    FIT = {};
    for (const ps of ["FW", "MF", "DF"]) {
      const sits = SITUATIONS.filter(x => x.pos.includes(ps));
      const tot = sits.reduce((a, x) => a + x.weight, 0) || 1;
      FIT[ps] = {};
      for (const tg of ["shoot", "pass", "dribble", "defend", "physical", "safe"])
        FIT[ps][tg] = sits.filter(x => x.choices.some(c => choiceTag(c) === tg)).reduce((a, x) => a + x.weight, 0) / tot;
    }
  }
  return FIT[pos]?.[tag] ?? 0;
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
  if (["shot", "chip", "head", "tapIn", "pk", "longShot", "acro"].includes(c.win)) return "shot";
  const st = c.stats || {};
  if ((st["tech.defense"] || 0) >= 0.5) return "tackle";
  if (["assist", "killPass"].includes(c.win)) return "pass";
  if ((st["tech.dribble"] || 0) >= 0.5 && c.win !== "keep") return "dribble";
  return null;
}

// 타이밍 버튼의 제목과 문구: 선택지가 실제로 하는 동작에 맞춤
const TIMING_RULES = [
  [/바이시클/, "바이시클 킥", "몸을 던진다!"],
  [/칩슛/, "칩슛", "살짝 띄운다!"],
  [/방향만 바꾼다/, "니어포스트", "방향을 바꾼다!"],
  [/반칙/, "전술적 반칙", "붙잡는다!"],
  [/몸을 던져/, "육탄 방어", "몸을 던진다!"],
  [/띄워 준다/, "로빙 패스", "띄워 준다!"],
  [/사포/, "사포", "띄운다!"],
  [/라보나/, "라보나", "감아 올린다!"],
  [/힐킥/, "힐킥", "뒤꿈치로!"],
  [/헛다리/, "헛다리", "제친다!"],
  [/중거리/, "중거리 슈팅", "때린다!"],
  [/뺏/, "태클", "발을 뻗는다!"],
  [/헤더/, "헤더", "뛰어오른다!"],
  [/발리/, "발리", "발을 갖다 댄다!"],
  [/밀어 넣/, "마무리", "밀어 넣는다!"],
  [/구석으로|가운데로/, "페널티킥", "찬다!"],
  [/직접 찬다/, "프리킥", "감아 찬다!"],
  [/돌아선다/, "턴", "돌아선다!"],
  [/제친다/, "돌파", "제친다!"],
  [/탈압박/, "탈압박", "빠져나간다!"],
  [/몰고|직접 해결/, "돌파", "치고 나간다!"],
  [/원투/, "원투 패스", "주고 들어간다!"],
  [/침투/, "침투", "뛰어든다!"],
  [/압박|달려든다/, "압박", "달려든다!"],
  [/슬라이딩/, "태클", "몸을 던진다!"],
  [/태클/, "태클", "발을 뻗는다!"],
  [/늦추기|거리를 두고|버틴다|지켜/, "버티기", "버틴다!"],
  [/크로스/, "크로스", "올린다!"],
  [/스루패스/, "스루패스", "찔러 준다!"],
  [/내준다|내줘|동료를 찾는다/, "패스", "내준다!"],
];
const TIMING_DEFAULT = { shot: ["슈팅", "때린다!"], pass: ["패스", "찔러 준다!"], tackle: ["수비", "막아선다!"], dribble: ["돌파", "치고 나간다!"] };
export function timingOf(c) {
  const kind = timingKind(c);
  if (!kind) return null;
  const hit = TIMING_RULES.find(([re]) => re.test(c.label));
  const [label, btn] = hit ? [hit[1], hit[2]] : TIMING_DEFAULT[kind];
  const stat = Object.entries(c.stats || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "tech.shoot";   // 바늘 난이도는 이 선택의 핵심 능력치로
  return { kind, label, btn, stat };
}

// ── 경기 준비 ───────────────────────
// 경기 결과 수치 맞추기 (tools/dev/baseline.mjs로 기준선과 비교하며 정한 값)
// brk: 공격 단계에서 끊길 확률 배율, att: 공을 잡았을 때 바로 공격을 거는 비율, conv: 슈팅이 골이 될 확률 배율
// 모두 우리 전력 − 상대 전력(D)에 따라 바뀜
// 시험 도구(tools/dev)가 경기 끝마다 내용을 받아 볼 수 있게
export const DEV = { onFinish: null };
export const CAL = { brk: 0.1, kb: 30, a0: 2, ka: 14, cu: 5.8, kcu: 5.8, kcun: 80, ct: 3.3, kct: 22, kctn: 13, ft: 0.2, meShot: 1.1, meBias: 0.62, meBiasMF: 1.0, luck: 0.5, mq: 0.8, fin: 0.09 };   // mq: 선발 경기에서 내 순간이 하나 더 생길 확률, fin: 내 순간 슈팅 성공률 보정
const sig = x => 1 / (1 + Math.exp(-x));

// 상대 성향 → 경기장 움직임
const STYLE_SIM = {
  "전방 압박이 강한 팀": { press: true, block: "high" }, "롱볼과 높이로 밀어붙이는 팀": { long: true }, "빠른 역습을 노리는 팀": { counter: true },
  "공을 오래 돌리는 팀": { keep: true }, "몸싸움이 거친 팀": { rough: true }, "측면 크로스가 많은 팀": { cross: true },
  "수비를 내리고 버티는 팀": { block: "low" }, "에이스 한 명이 끌고 가는 팀": { ace: true },
};
export const styleSim = name => STYLE_SIM[styleOf(name).label] || {};

// 경기장 위 22명 (우리 팀은 왼쪽 수비 → 오른쪽 공격). 점 하나하나가 명단의 실제 선수와 이어져 있음
const SLOTS = [["GK", 1], ["DF", 4], ["MF", 4], ["FW", 2]];
const TILT = { GK: {}, DF: { pass: -2, shoot: -12, drib: -8, def: 6, jump: 4 }, MF: { pass: 4, shoot: -2, drib: 2, def: -2, jump: 0 }, FW: { pass: -2, shoot: 6, drib: 4, def: -12, jump: 2 } };
function pitchPlayers(state, m) {
  const p = state.player;
  const list = [];
  const ours = { GK: [{ name: m.gk.us, number: 1 }], DF: [], MF: [], FW: [] };
  for (const x of m.lineup) ours[x.pos].push({ ...x });
  const avg = m.lineup.reduce((a, x) => a + (x.ovr ?? m.ours), 0) / Math.max(1, m.lineup.length);
  const st = (base, pos) => { const t = TILT[pos] || {}; return { pass: base + (t.pass || 0), shoot: base + (t.shoot || 0), drib: base + (t.drib || 0), def: base + (t.def || 0), jump: base + (t.jump || 0) }; };
  for (const [pos, n] of SLOTS) {
    for (let i = 0; i < n; i++) {
      let who = ours[pos][i], me = false;
      const mySlot = pos === p.position && i === MY_SLOT[pos];
      if (mySlot && m.status === "start") { ours[pos].splice(i, 0, { name: p.name, number: p.number }); who = ours[pos][i]; me = true; }
      const base = m.ours + ((who?.ovr ?? avg) - avg) * 0.5;
      list.push({ id: `u-${pos}-${i}`, team: "us", pos, name: who?.name ?? "", number: who?.number ?? "", me, subSlot: mySlot && m.status === "sub",
        st: me ? myStats(p) : st(base, pos), longShot: me ? p.stats.tech.shoot >= 62 && pos !== "DF" : pos === "MF" && (who?.ovr ?? 0) >= 64,
        qMul: me ? myShotMul(state, m) : null });
      const opp = pos === "GK" ? { name: m.gk.them, number: 1 } : m.oppPlayers.filter(o => o.pos === pos)[i];
      const ace = !!(opp && m.oppAce && opp.name === m.oppAce.name);
      list.push({ id: `t-${pos}-${i}`, team: "them", pos, name: opp?.name ?? "", number: opp?.number ?? "", me: false,
        st: st(m.theirs + (ace ? 6 : opp?.star != null ? 3 : 0), pos), ace, longShot: ace && pos !== "DF" });
    }
  }
  return list;
}
const myStats = p => ({ pass: p.stats.tech.pass, shoot: p.stats.tech.shoot, drib: p.stats.tech.dribble, def: p.stats.tech.defense, jump: p.stats.phys.jump });
// 내 슈팅: 슈팅 능력치(시뮬레이션이 팀 전력과 비교), 자신감·컨디션·해결사 특성, 헤딩은 점프력 60%
function myShotMul(state, m) {
  const pl = state.player;
  const cond = conditionOf(pl).match;
  return kind => {
    let k = CAL.meShot * Math.exp((pl.stats.mental.confidence - 50) / 220) * (1 + cond * 3) * (hasTrait(pl, "finisher") ? 1.15 : 1);
    if (kind === "head") k *= Math.exp(((pl.stats.phys.jump * 0.6 + pl.stats.tech.shoot * 0.4) - pl.stats.tech.shoot) / 40);
    return k;
  };
}

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
  const cup = fx.jn ? state.jnCup : null;           // 전남 대표 경기: 뽑힌 선수라 늘 선발
  if (cup) { status = elig.ok ? "start" : "out"; minIn = 0; }
  if (status === "start" && fx.official && !fx.ko && p.condition.fatigue >= 85) {
    status = "sub"; minIn = int(40, 50);
    restNote = `피로가 ${Math.round(p.condition.fatigue)}까지 쌓여 감독님이 후반에 넣기로 하셨다.`;
  }
  const onPitch = status === "start" || status === "sub";
  const cond = conditionOf(p);
  const teamAvg = cup ? cup.str : teamStrength(state, false);
  const myOvr = ovr(p);
  const star = onPitch ? clamp((myOvr - teamAvg) / 15 + (hasTrait(p, "ace") ? 0.2 : 0), 0, 1.7) : 0;

  const roster = cup ? cup.squad.map(x => ({ name: x.name, number: x.number, position: x.pos, ovrNow: cup.str })) : activeRoster(state);
  const lineup = [];
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const n = def.slots - (status === "start" && pos === p.position ? 1 : 0);
    roster.filter(m => m.position === pos).sort((a, b) => b.ovrNow - a.ovrNow).slice(0, n)
      .forEach(m => lineup.push({ name: m.name, number: m.number, pos, ovr: m.ovrNow }));
  }
  // 안전장치: 어느 포지션이 모자라면 다른 포지션 후보가 내려오거나 올라가서 채우고, 그래도 없으면 신입생이 채움
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const need = def.slots - (status === "start" && pos === p.position ? 1 : 0);
    let have = lineup.filter(x => x.pos === pos).length;
    while (have < need) {
      const spare = roster.filter(m => !lineup.some(l => l.name === m.name)).sort((a, b) => b.ovrNow - a.ovrNow)[0];
      if (spare) lineup.push({ name: spare.name, number: spare.number, pos, ovr: spare.ovrNow });
      else lineup.push({ name: `신입생 ${randomName()}`, number: 90 + have, pos, ovr: 40 });
      have++;
    }
  }
  // 상대 필드 선수 10명 (DF 4, MF 4, FW 2). 경기장 위 번호와 중계 이름이 같은 사람
  const usedNames = new Set([p.name, ...roster.map(r => r.name), ...GOALKEEPERS.map(g => g.name)]);
  // 핵심 선수가 있는 팀은 그 판에서 고정된 선수단으로 (data/world.js의 OPPONENT_STARS)
  const known = oppLineup(state, fx.opponent.name, info.turn);
  let oppPlayers;
  if (known) {
    oppPlayers = known.lineup.map(x => ({ name: x.name, number: x.number, pos: x.pos, star: x.star }));
    oppPlayers.forEach(x => usedNames.add(x.name));
    for (const [pos, n] of [["DF", 4], ["MF", 4], ["FW", 2]]) {
      for (let have = oppPlayers.filter(x => x.pos === pos).length; have < n; have++) {
        let name; do { name = randomName(); } while (usedNames.has(name)); usedNames.add(name);
        oppPlayers.push({ name, number: 40 + oppPlayers.length, pos });
      }
    }
    oppPlayers.sort((a, b) => ["DF", "MF", "FW"].indexOf(a.pos) - ["DF", "MF", "FW"].indexOf(b.pos));
  } else {
    oppPlayers = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 17]).slice(0, 10).map((n, i) => {
      let name; do { name = randomName(); } while (usedNames.has(name)); usedNames.add(name);
      return { name, number: n, pos: i < 4 ? "DF" : i < 8 ? "MF" : "FW" };
    });
  }
  const oppAce = known?.ace ? { name: known.ace.name, pos: known.ace.pos, trait: known.ace.trait, grade: known.ace.grade, number: known.ace.number } : null;
  // 교체로 들어갈 같은 포지션 후보 (부상 교체용)
  const benchAll = roster.filter(m => !lineup.some(l => l.name === m.name)).sort((a, b) => (b.position === p.position) - (a.position === p.position) || b.ovrNow - a.ovrNow);
  const bench = benchAll.map(m => ({ name: m.name, number: m.number }));

  // 내가 뛰면 내 능력치와 컨디션이 팀 전력에 직접 더해짐
  const ours = cup ? cup.str * 0.6 + 50 * 0.4 + (onPitch ? (myOvr - teamAvg) * 0.12 + cond.match * 15 : 0)
    : teamStrength(state, onPitch) * 0.6 + 50 * 0.4 + (onPitch ? (myOvr - teamAvg) * 0.12 + cond.match * 15 : 0)
    + (keeperOf(state).strong ? 1.5 : 0);
  const theirs = fx.opponent.strength + (oppAce ? 0.6 : known?.absent ? -1.5 : 0);   // 에이스가 뛰면 조금 더 강하고, 빠지면 약해짐

  // 시간에 맞춰 일어나는 일 (분위기 문장, 교체 투입, 부상). 골과 공격은 경기장에서 실제로 일어남
  const timed = [];
  for (let i = 0, n = int(3, 5); i < n; i++) timed.push({ type: "ambient", minute: int(2, LENGTH - 1) });
  const momentQ = [];
  if (onPitch) {
    const from = status === "start" ? 1 : minIn + 1;
    // 능력치가 팀 평균보다 높을수록 공이 더 자주 나에게 옴
    const n = status === "start" ? int(6, 7) + Math.round(star * 1.5) + (chance(CAL.mq) ? 1 : 0) : Math.max(2, Math.round((LENGTH - minIn) / LENGTH * (7 + star * 2)));
    for (let i = 0; i < n; i++) momentQ.push(int(from, Math.max(from + 4, LENGTH - 6)));   // 경기장에서 상황이 올 때까지 기다리므로 끝나기 조금 전까지만
    if (status === "sub") timed.push({ type: "subIn", minute: minIn });
    // 경기 중 부상 (드묾). 피로가 높을수록, 유리몸이면 더 자주
    const share = (LENGTH - (status === "start" ? 0 : minIn)) / LENGTH;
    const injP = 0.012 * share * (1 + p.condition.fatigue / 60) * (hasTrait(p, "glassBody") ? 1.8 : 1) * (hasTrait(p, "comeback") ? 0.8 : 1);
    if (chance(injP)) timed.push({ type: "injury", minute: int(from + 3, LENGTH - 2) });
  }
  timed.sort((a, b) => a.minute - b.minute);
  momentQ.sort((a, b) => a - b);

  // 날씨와 시간대 (화면 연출과 중계 문장에만 쓰임. 승패 계산에는 영향 없음)
  const mo = info.month;
  const weather = [6, 7].includes(mo) ? (chance(0.38) ? "rain" : mo === 7 && chance(0.4) ? "hot" : "clear")
    : mo === 8 ? (chance(0.18) ? "rain" : chance(0.5) ? "hot" : "clear")
    : [12, 1, 2].includes(mo) ? (chance(0.45) ? "cold" : chance(0.2) ? "wind" : "clear")
    : chance(0.1) ? "rain" : chance(0.22) ? "wind" : "clear";
  const sky = ["summer", "winter"].includes(fx.comp) ? (chance(0.5) ? "night" : "day") : fx.comp === "league" && chance(0.3) ? "dusk" : "day";
  let physGap = 0;
  if (fx.comp === "hs") physGap = clamp((172 - p.body.height) / 120 + (58 - p.stats.phys.strength) / 160, 0, 0.12);

  const m = {
    fx, turn: info.turn, grade: info.grade, status, reason: elig.ok ? null : elig.reason, restNote,
    star, me: p.name, myPos: p.position,
    minIn: status === "sub" ? minIn : 0, onPitch,
    prep: state.meetingBuff?.turn === info.turn ? state.meetingBuff : null,    // 경기 전 미팅에서 한 대답
    order: (() => {                                  // 감독님 주간 지시를 따른 주 (orders.js)
      const o = state.order;
      if (!o || !o.done || o.turn !== state.calendar.turn || !o.stat || o.stat.startsWith("student")) return null;
      return o.tag ? { tag: o.tag, bonus: 0.03 } : { tag: null, bonus: 0.015 };
    })(),
    bond: (() => {                                   // 복선 회수: 정해진 기간 안의 선발 경기 한 번
      const b = state.flags.bond; if (!b) return null;
      if (b.until != null && info.turn > b.until) { state.flags.bond = null; return null; }
      if (status !== "start") return null;
      state.flags.bond = null; return b;
    })(),
    lineupStart: lineup.map(x => ({ ...x })),
    ours, theirs, lineup, oppPlayers, oppAce, oppAceAbsent: known?.absent?.name || null, bench, talk: pickTalk(state, fx, status, star),
    gk: { us: cup ? cup.gk : ourKeeper(state), them: (() => { let n; do { n = randomName(); } while (usedNames.has(n)); usedNames.add(n); return n; })() }, myNumber: p.number,
    timed, momentQ, minute: 0, score: [0, 0],
    stats: { us: { shots: 0, on: 0, corners: 0, cards: 0 }, them: { shots: 0, on: 0, corners: 0, cards: 0 }, poss: 50 },
    goalsLog: [],
    my: { goals: 0, assists: 0, delta: 0, decisions: 0, successes: 0, log: [], followed: 0, timing: [] },
    formSwing: hasTrait(p, "inconsistent") ? normal(0, 0.06) : 0, physGap,
    feed: [], pending: null, half: 1, done: false, used: {}, trailed: { us: false, them: false },
    weather, sky,
    flow: 0,                                       // 경기 흐름 −1(상대) ~ +1(우리). 내 선택의 성공·실패로 바뀜
    started: false, lastT: -9,
  };
  // 경기장 시뮬레이션
  m.players = pitchPlayers(state, m);
  const oppStyle = styleSim(fx.opponent.name);
  const S = createSim({ players: m.players, str: { us: ours, them: theirs }, style: { us: {}, them: oppStyle }, blocks: { us: "mid", them: oppStyle.block || "mid" } });
  const D = ours - theirs;
  S.brk = { us: CAL.brk * Math.exp(-D / CAL.kb), them: CAL.brk * Math.exp(D / CAL.kb) };
  S.attackP = { us: sig(CAL.a0 + D / CAL.ka), them: sig(CAL.a0 - D / CAL.ka) };
  // 그날그날 운 (같은 전력이라도 잘 들어가는 날, 안 들어가는 날이 있음)
  S.conv = { us: CAL.cu * Math.exp(D / (D > 0 ? CAL.kcu : CAL.kcun)) * Math.exp(normal(0, CAL.luck)),
    them: CAL.ct * (CAL.ft + (1 - CAL.ft) * Math.exp(-D / (D < 0 ? CAL.kctn : CAL.kct))) * Math.exp(normal(0, CAL.luck)) };
  S.meBias = onPitch ? (p.position === "MF" ? CAL.meBiasMF : CAL.meBias) / (1 + star * 0.4) : 1;   // 잘하는 선수일수록 동료들이 더 자주 찾음
  S.noPen = {};
  Object.defineProperty(m, "sim", { value: S, enumerable: false, configurable: true, writable: true });
  m.oppBlock = oppStyle.block || "mid";
  return m;
}

// ── 이름 ────────────────────────────
const mateName = (m, prefer = ["FW", "MF"]) => {
  const pool = m.lineup.filter(x => prefer.includes(x.pos));
  return pick(pool.length ? pool : m.lineup)?.name || "동료";
};
const oppName = (m, prefer = ["FW", "MF"]) => {
  if (m.oppAce && prefer.includes(m.oppAce.pos) && m.oppPlayers.some(x => x.name === m.oppAce.name) && chance(0.35)) return m.oppAce.name;
  const pool = m.oppPlayers.filter(x => prefer.includes(x.pos));
  return pick(pool.length ? pool : m.oppPlayers).name;
};

// 골이 들어간 뒤 스코어와 흐름을 알려 주는 한 줄
function goalNote(m, team, min, ts) {
  const [a, b] = m.score;
  const d = team === "us" ? a - b : b - a;      // 득점한 팀 기준 점수 차
  const behind = team === "us" ? m.trailed.us : m.trailed.them;
  // 골 뒤 한 줄 (같은 문장이 반복되지 않게 몇 가지 중에서 고름)
  const N = {
    tie:   [["동점골! 승부는 다시 원점이다.", "균형을 맞췄다! 이제부터 다시 시작이다."], ["동점을 허용했다.", "다시 동점이 됐다. 아쉽다."]],
    flip:  [["역전골! 경기를 뒤집었다!", "뒤집었다! 벤치가 모두 일어섰다!"], ["역전을 허용했다…", "경기가 뒤집혔다. 다시 따라가야 한다."]],
    first: [["선제골! 경기장 분위기가 우리 쪽으로 넘어온다.", "먼저 골문을 열었다!"], ["먼저 실점했다.", "선제골을 내줬다. 아직 시간은 많다."]],
    ahead: [["앞서 나가는 골!", "다시 앞서 간다!"], ["다시 리드를 내줬다.", "상대가 다시 앞서 나간다."]],
    more:  [["달아나는 골! 격차를 벌린다.", "한 골 더! 상대가 고개를 숙인다."], ["격차가 벌어진다.", "두 골 차 이상. 따라가기가 버거워진다."]],
    chase: [["한 골 따라붙었다!", "추격골! 아직 끝나지 않았다!"], ["상대가 한 골 따라붙었다.", "한 골 차로 좁혀졌다. 긴장해야 한다."]],
  };
  const kind = d === 0 ? "tie" : d === 1 && behind ? "flip" : d === 1 ? (a + b === 1 ? "first" : "ahead") : d >= 2 ? "more" : "chase";
  const note = pick(N[kind][team === "us" ? 0 : 1]);
  if (a < b) m.trailed.us = true;
  if (b < a) m.trailed.them = true;
  return { t: `${note} ${TEAM_NAME} ${a} : ${b} ${m.fx.opponent.name}`, k: "stat", minute: min, ts };
}

// ── 경기장 ↔ 중계 ───────────────────
// 경기장에서 일어난 사건(sim.js의 ev)을 중계 문장과 기록으로 바꿈
const SP = (m, name, team) => (name ? m.sim.P.find(p => p.name === name && (!team || p.team === team)) : null) || null;
const ownX = (team, x) => (team === "us" ? x : 105 - x);
const PLAY_BY = Object.fromEntries(PLAYS.map(p => [p.id, p]));
const FIN_KIND = { shot: "shot", head: "header", long: "long", fk: "fk", pk: "pk" };
const ambFor = (m, ev) => AMBIENT.filter(a => a.ev === ev && (!a.wx || a.wx.includes(m.weather || "clear")) && (m.tplUse?.[a.t] || 0) < 2
  && m.sim.t - (m.tplT?.[a.t] ?? -99) > 40);                     // 같은 경기에서 두 번까지, 그것도 한참 떨어져서
// 문장 고르기: 같은 묶음에서 이번 경기에 덜 쓴 문장부터 (같은 문장이 되풀이되지 않게)
function fresh(m, arr) {
  const u = (m.tplUse ||= {}), key = x => (typeof x === "string" ? x : x.t);
  let low = Infinity; for (const x of arr) low = Math.min(low, u[key(x)] || 0);
  const x = pick(arr.filter(y => (u[key(y)] || 0) === low));
  u[key(x)] = (u[key(x)] || 0) + 1;
  (m.tplT ||= {})[key(x)] = m.sim?.t ?? 0;
  return x;
}

function narrate(state, m, e) {
  const pick = arr => fresh(m, arr);
  const S = m.sim, out = [];
  const minute = Math.min(LENGTH, e.minute);
  const add = (t, k, extra = {}) => { out.push({ t, k, minute, ts: e.t, ...extra }); m.lastT = e.t; };
  const quiet = () => e.t - m.lastT < 1.4;                 // 중계가 너무 잦지 않게 (작은 사건만)
  const kt = team => (team === "us" ? "us" : "them");
  const my = m.my;
  switch (e.type) {
    case "step": {
      const pl = PLAY_BY[e.play], st = pl?.steps[e.i];
      if (!st) break;
      const near = e.x == null || Math.abs(e.x - st.at[0]) <= 13;                 // 문장이 말하는 자리와 실제 공 자리가 맞을 때만
      const tx = st.t.filter(t => !/\{b[|}]/.test(t) || (e.b && e.b !== e.a));
      if (e.me && e.team === "us") {
        my.involved = (my.involved || 0) + 1; my.delta += m.myPos === "MF" ? 0.008 : 0.02;
        if (S.bias?.me) break;                                                   // 곧 내 장면이 이어지면 따로 적지 않음
        if (tx.length && near) add(fill(pick(tx), { a: e.a, b: e.b }), "me-auto");
        else if (!quiet()) add(fill(pick(ME_IN_PLAY.build), { me: m.me }), "me-auto");
        break;
      }
      if (!tx.length || !near || quiet() || !chance(e.first ? 0.55 : 0.85)) break;
      add(fill(pick(tx), { a: e.a, b: e.b }), kt(e.team));
      break;
    }
    case "recv":
      if (e.me) my.involved = (my.involved || 0) + 1;
      // 수비수인 내가 빌드업에서 이어 준 패스 (한 경기 최대 +0.3)
      if (m.myPos === "DF" && e.team === "us" && e.from === m.me && (my.buildCredit || 0) < 0.3) { my.buildCredit = (my.buildCredit || 0) + 0.015; my.delta += 0.015; }
      if (m.switchPend && m.switchPend.to === e.p && e.t - m.switchPend.t < 4) {
        const sp = m.switchPend; m.switchPend = null;
        if (!quiet() && chance(0.65) && tac(m, "switch", 3, 15)) { add(fill(pick(SIM_LINES.switch), { a: sp.from, b: e.p }), e.me ? "me-auto" : kt(e.team)); break; }
      }
      if (e.overlap && !quiet() && e.ax > 55) add(fill(pick(SIM_LINES.overlap), { a: e.p }), e.me ? "me-auto" : kt(e.team));
      break;
    case "build":
      if (!quiet() && chance(0.55) && tac(m, "build" + e.team, 2, 30)) add(fill(pick(e.team === "us" ? SIM_LINES.buildUs : SIM_LINES.buildThem), { a: e.by }), kt(e.team));
      break;
    case "intercept": case "tackle": {
      const atk = e.team === "us" ? "them" : "us";
      const ax = ownX(atk, S.ball.x);
      if (e.me) {
        my.delta += m.myPos === "DF" ? 0.24 : 0.2; my.stops = (my.stops || 0) + 1; my.involved = (my.involved || 0) + 1;
        add(fill(pick(ME_IN_PLAY.stop.slice(0, 2)), { me: m.me }), "me-auto");
      } else if (e.victimMe) {
        my.delta -= 0.04;
        add(fill(pick(BREAK.tackle), { d: e.by, a: m.me }), "them");
      } else if (ax > 58 && !quiet()) {
        if (e.type === "intercept") add(fill(pick(BREAK.intercept), { d: e.by, a: e.from, r: e.r }), kt(e.team));
        else add(fill(pick(BREAK.tackle), { d: e.by, a: e.victim }), kt(e.team));
      }
      break;
    }
    case "header": {
      if (e.me) { my.delta += 0.15; my.stops = (my.stops || 0) + 1; add(fill(pick(SIM_LINES.headClear), { d: m.me }), "me-auto"); break; }
      const atk = e.team === "us" ? "them" : "us";
      if (ownX(atk, S.ball.x) > 84 && !quiet() && chance(0.6)) add(fill(pick(SIM_LINES.headClear), { d: e.by }), kt(e.team));
      break;
    }
    case "claim": {
      const amb = e.team === "us" && chance(0.4) ? ambFor(m, "claimUs") : [];
      add(amb.length ? fill(pick(amb).t, { gk: e.by }) : fill(pick(BREAK.claim), { gk: e.by }), kt(e.team));
      break;
    }
    case "beat": {
      if (e.me) { my.delta += 0.03; my.involved = (my.involved || 0) + 1; }
      if ((e.me || ownX(e.team, S.ball.x) > 62) && !quiet() && e.t - (m.beatT ?? -9) > 5 && chance(e.me ? 0.8 : 0.45)) { m.beatT = e.t; add(fill(pick(SIM_LINES.beat), { a: e.by, d: e.victim }), e.me ? "me-auto" : kt(e.team)); }
      break;
    }
    case "foul": {
      const victim = e.team === "us" ? "them" : "us";
      if (e.me) my.delta -= e.card ? 0.15 : 0.05;
      if (e.card) {
        m.stats[e.team].cards++;
        const amb = AMBIENT.filter(a => a.card === e.team);
        add(fill(pick(amb).t, { o: e.by, a: e.by }), "card");
      }
      if (e.pen) { add(victim === "us" ? fill(PLAY_BY.penalty.steps[0].t[0], { a: e.victim }) : fill(pick(SIM_LINES.pkThem), { d: e.by }), kt(victim)); break; }
      const vx = ownX(victim, S.ball.x);
      if (vx > 70 && Math.abs(S.ball.y - 34) < 20) add(pick(victim === "us" ? SIM_LINES.fkUs : SIM_LINES.fkThem), kt(victim));
      else if (!e.card && !quiet() && chance(0.5)) {
        const amb = victim === "us" && chance(0.25) ? ambFor(m, "foulOnUs") : [];
        add(amb.length ? fill(pick(amb).t, { a: e.victim, o: e.by }) : fill(pick(SIM_LINES.foul), { d: e.by, v: e.victim }), "info");
      }
      break;
    }
    case "offside": {
      if (e.me) my.delta -= 0.05;
      add(chance(0.25) ? ambFor(m, "offside")[0]?.t || "오프사이드." : fill(pick(BREAK.offside), { r: e.r }), "info");
      break;
    }
    case "out": {
      if (e.kind === "corner") { m.stats[e.team].corners++; add(pick(e.team === "us" ? SIM_LINES.cornerUs : SIM_LINES.cornerThem), kt(e.team)); break; }
      if (e.shot || quiet()) break;
      if (e.kind === "throw") {
        const amb = e.byTeam === "us" && S.lastClear ? ambFor(m, "clearOut") : e.byTeam === "them" && e.team === "us" ? ambFor(m, "themOut") : [];
        if (amb.length && chance(0.35)) add(fill(pick(amb).t, { a: e.by, o: e.by }), kt(e.byTeam));
        else if (chance(0.06)) { const far = ambFor(m, "outFar"); if (far.length) add(pick(far).t, "info"); }
      } else if (e.kind === "goalkick" && ownX(e.byTeam, 105) && chance(0.5)) add(fill(pick(BREAK.out), { a: e.by }), kt(e.byTeam));
      break;
    }
    case "setup": {
      if (e.kind === "corner") add(fill(pick(e.team === "us" ? SIM_LINES.cornerTake : SIM_LINES.cornerTakeThem), { a: e.taker }), kt(e.team));
      else if (e.kind === "fk" && e.x > 70 && e.team === "us") add(fill(pick(SIM_LINES.fkTake), { a: e.taker }), "us");
      else if (e.kind === "throw" && e.team === "us" && !quiet() && chance(0.2)) { const a = ambFor(m, "throwUs"); if (a.length) add(fill(pick(a).t, { a: e.taker }), "us"); }
      else if (e.kind === "goalkick" && e.team === "them" && !quiet() && chance(0.15)) { const a = ambFor(m, "gkLongThem"); if (a.length) add(pick(a).t, "them"); }
      break;
    }
    case "clear":
      S.lastClear = true;
      if (e.me && e.x != null && e.x < 40 && m.myPos !== "FW") { my.delta += 0.16; my.stops = (my.stops || 0) + 1; }   // 우리 진영에서 내가 걷어 낸 공 (수비 기여)
      break;
    case "pass": {
      S.lastClear = false;
      if (e.silent) break;
      const lp = m.lastPass;
      m.lastPass = { from: e.from, to: e.to, t: e.t, team: e.team };
      // 원투: A→B 다음 바로 B→A
      if (lp && lp.team === e.team && lp.from === e.to && lp.to === e.from && e.t - lp.t < 3 && !quiet() && chance(0.75) && tac(m, "oneTwo", 3, 15)) { add(fill(pick(SIM_LINES.oneTwo), { a: e.to, b: e.from }), e.me || e.toMe ? "me-auto" : kt(e.team)); break; }
      // 방향 전환: 반대편으로 길게. 문장은 공이 그 선수에게 닿았을 때
      if ((e.kind === "air" || e.kind === "long") && e.fy != null && Math.abs(e.ty - e.fy) > 28) m.switchPend = { from: e.from, to: e.to, t: e.t, team: e.team };
      break;
    }
    case "shot": {
      if (e.forced) break;
      m.stats[e.team].shots++;
      const fk = FIN_KIND[e.kind] || "shot";
      if (e.me) add(fill(pick(ME_IN_PLAY[{ header: "head", fk: "fk", pk: "pk" }[fk]] || ME_IN_PLAY.shot), { me: m.me }), "me-auto");
      else add(fill(pick(FINISH[fk]), { a: e.by }), kt(e.team));
      break;
    }
    case "shotEnd": {
      if (e.forced) break;
      const team = e.team, R = RESULT[team];
      const vars = { a: e.by, gk: e.gk || (team === "us" ? m.gk.them : m.gk.us), d: e.blocker || (team === "us" ? oppName(m, ["DF"]) : mateName(m, ["DF"])) };
      if (e.result === "goal" || e.result === "save") m.stats[team].on++;
      if (e.blockerMe) { my.delta += 0.15; my.stops = (my.stops || 0) + 1; }
      if (e.result === "goal") {
        team === "us" ? m.score[0]++ : m.score[1]++;
        const ast = e.kind === "long" || e.kind === "fk" || e.kind === "pk" ? null : e.assist;
        m.goalsLog.push({ team, name: e.by, minute, assist: ast, me: team === "us" && e.me, myAssist: team === "us" && !!ast && e.assistMe });
        if (team === "us" && e.me) { my.goals++; my.delta += 0.85; }
        if (team === "us" && ast && e.assistMe) { my.assists++; my.delta += 0.45; }
        add(fill(pick(R.goal), vars), e.me && team === "us" ? "goal-me" : team === "us" ? "goal-us" : "goal-them", { score: [...m.score] });
        out.push(goalNote(m, team, minute, e.t));
      } else add(fill(pick(R[e.result] || R.save), vars), kt(team));
      break;
    }
    case "lines": for (const l of e.lines) out.push({ ...l, minute, ts: e.t }); m.lastT = e.t; break;
    default: break;
  }
  return out;
}

// 전술 문장 횟수 제한: 같은 종류는 한 경기 max번까지, gap초(시뮬레이션) 넘게 떨어져서
function tac(m, key, max, gap) {
  const r = ((m.tacUse ||= {})[key] ||= { n: 0, t: -99 });
  if (r.n >= max || m.sim.t - r.t < gap) return false;
  r.n++; r.t = m.sim.t; return true;
}
// 해설이 한참 없을 때: 지금 공 가진 선수와 자리를 짧게 (경기 시간 2분 40초쯤 조용하면)
function holdLine(m) {
  const S = m.sim, H = S.holder, x = ownX(H.team, H.x);
  const zone = x < 35 ? "def" : x < 70 ? "mid" : "att";
  const pool = SIM_LINES.hold[`${H.team}_${zone}`];
  m.lastT = S.t;
  return [{ t: fill(fresh(m, pool), { a: H.name }), k: H.me ? "me-auto" : H.team, minute: Math.min(LENGTH, minuteOf(S)), ts: S.t }];
}

// 시간에 맞춰 일어나는 일: 분위기 문장, 교체 투입, 부상
function timedEvent(state, m, ev, ts) {
  const S = m.sim, min = Math.min(LENGTH, ev.minute), out = [];
  const L = (t, k = "info", extra = {}) => out.push({ t, k, minute: min, ts, ...extra });
  if (ev.type === "ambient") {
    const dead = S.phase === "dead", recycle = S.poss === "them" && S.ball.x > 60;
    const fit = AMBIENT.filter(x => (!x.ev || (x.ev === "dead" && dead) || (x.ev === "themRecycle" && recycle)) && !x.card
      && (!x.wx || x.wx.includes(m.weather || "clear")) && (!x.sky || x.sky === m.sky) && (!x.early || min < 15) && (!x.late || min >= 58) && (!x.min || min >= x.min) && !m.used[`amb${AMBIENT.indexOf(x)}`]);
    if (!fit.length) return out;
    const a = pick(fit);
    m.used[`amb${AMBIENT.indexOf(a)}`] = true;                  // 같은 경기에서 같은 문장은 한 번만
    const av = { a: mateName(m, ["DF", "MF"]), o: oppName(m), coach: STAFF.coach, gk: m.gk.us };
    L(fill(a.t, av), "info", { amb: true });
  }
  if (ev.type === "injury" && m.onPitch && !m.injured) {
    const type = weighted([["ankle", 0.55], ["hamstring", 0.3], ["knee", 0.15]]);
    const t = INJURY_LINES[type];
    m.injured = { type, minute: min, cause: t.cause };
    m.onPitch = false;
    L(fill(pick(t.lines), { me: m.me }), "me-bad");
    L(fill("의무 트레이너가 뛰어 들어간다. {coach|이/가} 벤치에서 교체 사인을 보낸다.", { coach: STAFF.coach }), "coach");
    const rep = m.bench?.[0];
    if (rep) m.lineup.push({ name: rep.name, number: rep.number, pos: m.myPos });
    swapMe(m, rep || { name: "교체 선수", number: "" }, false);
    L(pick(t.after) + (rep ? fill(` ${rep.number}번 {r|이/가} 대신 들어간다.`, { r: rep.name }) : ""), "info", { injuredOff: rep || { name: "교체 선수", number: "" } });
  }
  if (ev.type === "subIn") {
    // 경기장 위에서 내 자리에 서 있던 동료가 나간다 (화면의 점도 같은 사람)
    const same = m.lineup.filter(x => x.pos === m.myPos);
    const outP = same.at(-1);                       // 같은 자리에서 가장 약한 선수가 나감 (명단은 능력치 순)
    if (outP) m.lineup = m.lineup.filter(x => x !== outP);
    const tok = (outP && m.sim.P.find(p => p.team === "us" && p.name === outP.name)) || m.sim.P.find(p => p.subSlot);
    if (tok) swapIn(state, m, tok);
    L(fill(`교체: {o|이/가} 나오고 {me|이/가} 들어간다. `, { o: outP?.name || "동료", me: m.me }) + pick(LINES.subIn), "me",
      { subIn: true, outNo: outP?.number ?? "", outName: outP?.name || "" });
    // 들어가는 순간 받는 지시. 이 지시를 따르면 성공률 +4%p
    const st = pick(PREMATCH.filter(t => t.when === "sub" && (!t.tag || tagFit(m.myPos, t.tag) >= 0.18)));
    if (st) {
      m.talk = { who: st.who, text: st.t, tag: st.tag };
      L(`${st.who === "coach" ? STAFF.coach : STAFF.assistant}: "${st.t}"${st.tag ? ` (지시: ${TAG_LABEL[st.tag]})` : ""}`, "coach", { fast: true });
    }
  }
  return out;
}
// 경기장 위 내 점을 다른 선수에게 넘김 (부상·하프타임 교체) / 내 점으로 바꿈 (교체 투입)
function swapMe(m, who, _me) {
  const p = meOf(m.sim); if (!p) return;
  p.me = false; p.name = who.name; p.number = who.number; p.qMul = null; p.longShot = false;
  p.st = { pass: m.ours, shoot: m.ours, drib: m.ours, def: m.ours, jump: m.ours };
}
function swapIn(state, m, tok) {
  const pl = state.player;
  tok.me = true; tok.name = pl.name; tok.number = pl.number; tok.st = myStats(pl); tok.qMul = myShotMul(state, m);
  tok.longShot = pl.stats.tech.shoot >= 62 && tok.pos !== "DF";
}

// ── 내 순간: 공이나 상황이 실제로 나에게 왔을 때 ──────
// 장면(SITUATIONS)의 출발 방식(data/scenes.js의 from, holder)을 경기장 상황 종류로 묶음
function sitCat(sit) {
  const sc = SCENES[sit.id] || {}, f = sc.from;
  if (sc.holder === "mate" || sc.holder === "df") return "mate";
  if (f === "corner") return "set:corner";
  if (f === "kicker") return (sc.at?.[0]?.[0] ?? 0) > 100 ? "set:cornerKick" : "set:fkKick";
  if (f === "fk") return "set:fkShot";
  if (f === "pk") return "set:pk";
  if (f === "throw") return "set:throw";
  if (f === "oppCorner") return "defset:corner";
  if (f === "oppThrow") return "defset:throw";
  if (["oppLong", "oppCross"].includes(f)) return "defair";
  if (sit.poss === "them") return "def";
  if (["cross", "lowcross", "long"].includes(f)) return "air";
  if (["loose", "save"].includes(f)) return "loose";
  if (f === "turn") return "turn";
  return "recv";
}
// 경기장 상황 → 어울리는 장면 종류 (1이면 딱 맞음)
const COMPAT = {
  recv: { recv: 1, loose: 0.5, turn: 0.3, air: 0.2, mate: 0.4 },
  air: { air: 1, loose: 0.6, recv: 0.35 },
  turn: { turn: 1, loose: 0.6, recv: 0.5 },
  def: { def: 1, defair: 0.6 },
  defair: { defair: 1, def: 0.6 },
  mate: { mate: 1, recv: 0.8, turn: 0.3 },
};
const ZONE_BOX = { att: [[78, 94], [16, 52]], mid: [[44, 66], [8, 60]], def: [[10, 32], [8, 60]] };
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function momentCtx(state, m, evs) {
  const S = m.sim, M = meOf(S);
  if (!M || S.stage) return null;
  const relax = m.minute - m.momentQ[0] >= 3 || m.minute >= 63 || m.momentQ.length >= 2 && m.minute >= m.momentQ[1];
  for (const e of evs) {
    if (e.type === "setup" && S.restart) {
      const R = S.restart, sp = R.spot || [S.ball.x, S.ball.y];
      if (e.team === "us") {
        if (e.kind === "corner") return { cat: R.taker === M ? "set:cornerKick" : "set:corner", poss: "us", set: R };
        if (e.kind === "fk" && e.x >= 74 && Math.abs(e.y - 34) < 16 && M.pos !== "DF") return { cat: "set:fkShot", poss: "us", set: R };
        if (e.kind === "fk" && R.taker === M) return { cat: "set:fkKick", poss: "us", set: R };
        if (e.kind === "pk" && M.pos !== "DF") return { cat: "set:pk", poss: "us", set: R };
        if (e.kind === "throw" && M.pos !== "FW" && Math.hypot(M.x - sp[0], M.y - sp[1]) < 20) return { cat: "set:throw", poss: "us", set: R };
      } else {
        if (e.kind === "corner" && M.pos !== "FW") return { cat: "defset:corner", poss: "them", set: R };
        if (e.kind === "throw" && M.pos === "DF" && sp[0] < 32) return { cat: "defset:throw", poss: "them", set: R };
      }
    }
    if (e.type === "recv" && e.me) return { cat: e.air ? "air" : "recv", poss: "us", fresh: true };
    if ((e.type === "win" || e.type === "tackle" || e.type === "intercept") && e.me) return { cat: "turn", poss: "us" };
    if (e.type === "recv" && e.team === "them" && e.air && S.holder && dist2(S.holder, M) < 9 && M.pos !== "FW") return { cat: "defair", poss: "them", holder: S.holder };
  }
  if (S.phase !== "play" || S.ball.fl || S.script.length || S.scur) return null;
  const H = S.holder; if (!H) return null;
  if (H === M) return { cat: "recv", poss: "us" };
  const wait = m.want ? m.minute - m.want.t0 : 0;
  const reach = relax ? 16 : 8.5 + Math.min(1, wait / 3) * (m.want?.sit.poss === "them" ? 14 : 0);      // 상대 공을 기다린 지 오래되면 조금 멀어도
  if (H.team === "them" && H.ri && dist2(H, M) < reach && (M.pos !== "FW" ? H.x < 60 || dist2(H, M) < 8.5 : H.x > 66 || relax)) return { cat: "def", poss: "them", holder: H };
  // 동료가 내 가까이에서 공을 가졌을 때 (골키퍼가 잡았을 때는 조금 멀어도). 그 동료가 나에게 주며 장면이 이어짐
  if (H.team === "us" && dist2(H, M) < (H.pos === "GK" ? 26 : relax ? 22 : 15)) return { cat: "mate", poss: "us", holder: H };
  return null;
}

// 지금 나올 수 있는 장면 (포지션, 능력치, 날씨, 경기 흐름, 시간, 점수 조건)
function canSit(state, m, s) {
  const [a, b] = m.score, late = m.minute >= 55;
  if (!s.pos.includes(state.player.position) || (s.once && m.used[s.id]) || !meets(state, s.requires)) return false;
  if (s.wx && !s.wx.includes(m.weather || "clear")) return false;
  if ((s.flowUp && (m.flow || 0) < 0.3) || (s.flowDown && (m.flow || 0) > -0.3)) return false;   // 경기 흐름에 맞는 장면
  if ((s.late && !late) || (s.leading && a <= b) || (s.trailing && a >= b)) return false;
  return true;
}
const sitWeight = (m, s) => s.weight * (m.score[0] < m.score[1] && m.minute > 50 && s.zone === "att" ? 1.6 : 1) * 0.3 ** (m.seen?.[s.id] || 0);   // 같은 장면이 되풀이되지 않게
// 장면이 말하는 자리와 지금 공 자리가 얼마나 맞는지 (1이면 그 자리)
// 장면이 시작될 때 공이 있을 자리: 동료가 공을 가졌는데 장면은 내가 받는 장면이면 동료가 나에게 패스하므로 내 자리
function sceneBall(m, s) {
  const S = m.sim, M = meOf(S), sc = SCENES[s.id] || {};
  const mateHolds = sc.holder === "mate" || sc.holder === "df";
  if ((s.poss || "us") === "us" && !mateHolds && M && S.holder && S.holder.team === "us" && S.holder !== M) return [M.x, M.y];
  return [S.ball.x, S.ball.y];
}
function geoFit(m, s) {
  const [bx, by] = sceneBall(m, s);
  const box = s.spot || SCENES[s.id]?.at || ZONE_BOX[s.zone] || ZONE_BOX.mid;
  const dx = Math.max(0, box[0][0] - bx, bx - box[0][1]);
  const dyA = Math.max(0, box[1][0] - by, by - box[1][1]), dyB = Math.max(0, box[1][0] - (68 - by), (68 - by) - box[1][1]);
  return Math.exp(-Math.hypot(dx, Math.min(dyA, dyB)) / 6);
}
const ctxFits = (ctx, cat) => (ctx.cat.includes(":") || cat.includes(":") ? (ctx.cat === cat ? 1 : 0) : cat === "mate" && ctx.cat !== "mate" ? 0 : COMPAT[ctx.cat]?.[cat] ?? 0);   // 세트피스는 그 세트피스일 때만, 동료가 공 가진 장면은 동료가 실제로 가졌을 때만

// 이번에 나올 장면을 먼저 고름 (예전처럼 장면 비중대로). 그다음 경기장에서 그 장면에 맞는 상황이 오기를 기다림
function wantSituation(state, m) {
  const pool = SITUATIONS.filter(s => canSit(state, m, s)).map(s => [s, sitWeight(m, s)]);
  return pool.length ? weighted(pool) : null;
}
// 기다리던 장면과 맞지 않는 상황이 너무 오래 이어질 때: 지금 상황에 가장 어울리는 장면
function pickSituation(state, m, ctx) {
  const pool = [];
  let best = 0;
  for (const s of SITUATIONS) {
    if (!canSit(state, m, s) || (s.poss || "us") !== ctx.poss) continue;
    const cat = sitCat(s), c = ctxFits(ctx, cat);
    if (!c) continue;
    const geo = cat.includes(":") ? 1 : geoFit(m, s);
    if (geo < 0.12) continue;                                                       // 공 자리와 너무 먼 장면은 안 고름 (13m)
    const w = sitWeight(m, s) * c * geo * (SCENES[s.id]?.at || s.spot || cat.includes(":") ? 1 : 0.35);   // 자리가 정해지지 않은 장면은 어디서나 맞으므로 덜 고름 (한 장면만 되풀이되지 않게)
    if (w > 0.002) { pool.push([s, w]); best = Math.max(best, w); }
  }
  const ok = pool.filter(([, w]) => w >= best * 0.12);
  if (!ok.length || best < 0.03) return null;
  return weighted(ok);
}
// 기다리던 장면이 지금 상황과 맞는지. 오래 기다릴수록 자리는 덜 따짐
function wantFits(m, want, ctx) {
  const s = want.sit;
  if ((s.poss || "us") !== ctx.poss) return false;
  const c = ctxFits(ctx, want.cat), wait = m.minute - want.t0;
  if (c < (wait < 1.5 ? 1 : wait < 3 ? 0.5 : 0.3)) return false;                    // 처음엔 딱 맞는 상황만, 기다릴수록 비슷한 상황도
  if (want.cat.includes(":")) return true;
  return geoFit(m, s) >= Math.max(0.12, 0.3 * Math.max(0, 1 - wait / 3));         // 아무리 오래 기다려도 장면 자리에서 13m 안
}
// 기다리던 장면을 언제 포기하고 지금 상황에 맞는 장면으로 바꿀지 (분)
// 공격 장면을 기다리는데 상대 공 상황이 왔을 때, 세트피스를 기다릴 때는 더 오래 참음 (한쪽 장면으로 쏠리지 않게)
function wantPatience(m, want, ctx) {
  if (want.cat.includes(":")) return 6;
  return (want.sit.poss || "us") === ctx.poss ? 3 : 4.5;
}
// 세트피스 장면을 기다리는데 오래 안 나오면, 그럴듯한 순간에 경기장에서 만들어 줌 (코너킥, 박스 앞 반칙, 스로인…)
function makeSetPiece(m, want) {
  const S = m.sim, H = S.holder, b = S.ball;
  if (S.phase !== "play" || b.fl || S.script.length || S.scur || S.stage) return;
  const cat = want.cat, dfr = S.P.filter(p => p.team === "them" && p.ri), opp = (pt) => dfr.sort((p, q) => Math.hypot(p.x - pt.x, p.y - pt.y) - Math.hypot(q.x - pt.x, q.y - pt.y))[0];
  const ev = (type, o) => S.ev.push({ type, t: S.t, minute: minuteOf(S), ...o });
  if ((cat === "set:corner" || cat === "set:cornerKick") && S.poss === "us" && b.x > 84) {
    ev("out", { kind: "corner", team: "us", by: opp(b)?.name, byTeam: "them" });
    return setRestart(S, "corner", "us", 104.3, b.y < 34 ? 0.7 : 67.3);
  }
  if ((cat === "set:fkShot" || cat === "set:fkKick") && H?.team === "us" && b.x > 66 && b.x < 86 && Math.abs(b.y - 34) < 15) {
    const d = opp(H); ev("foul", { by: d?.name, team: "them", victim: H.name, victimMe: H.me, card: false, pen: false });
    return setRestart(S, "fk", "us", H.x, H.y);
  }
  if (cat === "set:pk" && H?.team === "us" && b.x > 89 && Math.abs(b.y - 34) < 18) {
    const d = opp(H); ev("foul", { by: d?.name, team: "them", victim: H.name, victimMe: H.me, card: false, pen: true });
    return setRestart(S, "pk", "us");
  }
  if (cat === "set:throw" && S.poss === "us" && (b.y < 11 || b.y > 57) && b.x > 30) {
    ev("out", { kind: "throw", team: "us", by: opp(b)?.name, byTeam: "them" });
    return setRestart(S, "throw", "us", b.x, b.y < 34 ? 0.3 : 67.7);
  }
  if (cat === "defset:corner" && S.poss === "them" && b.x < 20) {
    ev("out", { kind: "corner", team: "them", by: null, byTeam: "us" });
    return setRestart(S, "corner", "them", 0.7, b.y < 34 ? 0.7 : 67.3);
  }
  if (cat === "defset:throw" && S.poss === "them" && b.x < 32 && (b.y < 11 || b.y > 57)) {
    ev("out", { kind: "throw", team: "them", by: null, byTeam: "us" });
    return setRestart(S, "throw", "them", b.x, b.y < 34 ? 0.3 : 67.7);
  }
}

const nearestP = (S, team, pt, f = () => true) => {
  let best = null, bd = 1e9;
  for (const p of S.P) if (p.team === team && f(p)) { const d = Math.hypot(p.x - pt.x, p.y - pt.y); if (d < bd) { bd = d; best = p; } }
  return best;
};
// 장면 시작: 이름은 경기장에 실제로 있는 선수로, 자리는 장면 연출 값(data/scenes.js)으로 잠깐 다듬음
function startMoment(state, m, sit, ctx, lines, ts) {
  const S = m.sim, M = meOf(S);
  const poss = sit.poss || "us";
  if (sit.once) m.used[sit.id] = true;
  (m.seen ||= {})[sit.id] = (m.seen[sit.id] || 0) + 1;
  m.momentQ.shift();
  const sc = SCENES[sit.id] || {};
  const holder = ctx.holder || S.holder || null;
  let mateP = null, passer = null;
  const last = S.chain[S.chain.length - 1];
  if (last && last.team === "us" && !last.me && last.ri) passer = last;            // 방금 나에게 공을 준 동료 (공이 오는 문장에만)
  if (ctx.cat === "mate" && holder?.team === "us") mateP = holder;
  else if (ctx.cat === "set:corner" || ctx.cat === "set:throw" || ctx.cat === "set:cornerKick") mateP = ctx.set?.taker && ctx.set.taker !== M ? ctx.set.taker : nearestP(S, "us", { x: 96, y: 34 }, p => !p.me && p.ri && p.pos !== "GK");
  else if (poss === "us") {
    // 같이 공격할 동료: 내 앞쪽(또는 나란히)에 있는 공격수·미드필더 중 가까운 선수. 없으면 방금 패스한 동료
    mateP = nearestP(S, "us", { x: M.x + 8, y: M.y }, p => !p.me && p.ri && (p.pos === "FW" || p.pos === "MF") && p.x >= M.x - 6) || passer
      || nearestP(S, "us", M, p => !p.me && p.ri && (p.pos === "FW" || p.pos === "MF"));
  } else mateP = nearestP(S, "us", M, p => !p.me && p.ri && p.pos !== "GK");     // 수비 장면: 가까이에서 같이 막는 동료
  const oppP = poss === "them" ? (holder?.team === "them" ? holder : ctx.set?.taker || nearestP(S, "them", M, p => p.ri))
    : nearestP(S, "them", M, p => p.ri);
  const sv = { mate: mateP?.name || mateName(m), opp: oppP?.name || oppName(m), gk: m.gk.us, ogk: m.gk.them, coach: STAFF.coach };
  const zone = sit.zone;
  const min = m.minute;
  const L = (t, k, extra = {}) => lines.push({ t, k, minute: min, ts, ...extra });
  // 공이 오는 문장: 막 받은 순간이거나 상대가 다가올 때만 (이미 공을 갖고 있었으면 장면 설명으로 바로)
  if (sit.intro !== false && (ctx.fresh || poss === "them")) {
    const pool = (TO_ME[poss === "them" ? "def" : zone] || TO_ME.mid).filter(t => !m.used[`to:${t}`]);
    const t = pick(pool.length ? pool : TO_ME[poss === "them" ? "def" : zone] || TO_ME.mid);
    m.used[`to:${t}`] = true;
    L(fill(t, { ...sv, mate: passer?.name || sv.mate }), "me", { toMe: poss !== "them" });
  }
  // 상대 에이스와 처음 마주칠 때 한 줄 (경기마다 한 번)
  if (poss === "them" && sit.intro !== false && m.oppAce && sv.opp === m.oppAce.name && !m._aceSeen) {
    m._aceSeen = true;
    L(fill(pick(["{a|이다/다}. 경기 전 분석에서 몇 번이나 들은 이름이다.", "상대 에이스 {a}. 오늘 제일 조심하라던 선수다."]), { a: sv.opp }), "me");
  }
  // 경기장: 세트피스면 차기 전에 멈춰 두고, 아니면 공 가진 선수 주변을 장면처럼 다듬음
  const setPiece = ctx.cat.includes(":");
  if (setPiece && S.restart) S.restart.hold = true;
  // 공 가진 선수: 장면이 "동료가 갖고 있음"(holder mate·df)이 아니면 우리 공 장면은 나, 상대 공 장면은 상대
  const mateHolds = sc.holder === "mate" || sc.holder === "df";
  const stageHolder = poss === "them" ? (holder?.team === "them" ? holder : null) : mateHolds ? mateP : M;
  const hint = setPiece ? { dur: 0.3, press: 0, mePress: false } : {
    holder: stageHolder, dur: 0.7,
    press: typeof sc.press === "number" ? sc.press : poss === "us" ? 1 : 0, pressGap: sc.pressGap, meGap: sc.meGap, mePress: sc.mePress,
    gk: sc.gk ? sc.gk[0] : sc.gkNear ? 10 : null,
  };
  m.staging = { sit, ctx, sv, mateP, oppP };
  // 내가 받아야 하는 장면인데 동료가 공을 갖고 있으면: 그 동료가 실제로 나에게 패스한 뒤 장면 시작
  const passer2 = S.holder, D = stageHolder;                 // D: 장면이 말하는 공 가진 선수
  if (!setPiece && poss === "us" && D && passer2 && passer2 !== D && passer2.team === "us" && !S.ball.fl && Math.hypot(passer2.x - D.x, passer2.y - D.y) < 45) {
    passTo(S, passer2, D, [clamp(D.x + (D === M ? 1 : 0), 2, 103), D.y], { force: true, kind: "ground" });
    if (S.ball.fl) { const need = Math.hypot(D.x - S.ball.fl.x1, D.y - S.ball.fl.y1) / 8 + 0.1; if (S.ball.fl.T < need) S.ball.fl.T = need; }
    m.staging.waitRecv = S.t + 4; m.staging.hint = hint; m.staging.recvBy = D;
    if (D === M && !lines.some(l => l.toMe)) {
      const pool = TO_ME[zone] || TO_ME.mid, t = pick(pool.filter(x => /\{mate/.test(x)));
      if (t) L(fill(t, { ...sv, mate: passer2.name }), "me", { toMe: true });
    }
    S.bias = null;
    return;
  }
  stageStart(S, hint);
  S.bias = null;
}
function finishStaging(state, m) {
  const { sit, ctx, sv } = m.staging;
  m.staging = null;
  const S = m.sim;
  m._sitPoss = sit.poss || "us";
  const list = sit.choices.filter(c => meets(state, c.requires)).map(c => (c.requires ? { ...c, signature: true } : c));
  const sig = SIGNATURE[sit.id];
  if (sig && Object.entries(sig.requires).every(([k, v]) => getPath(state.player.stats, k) >= v)) list.push({ ...sig, signature: true });
  const choices = list.map(c => { const p = prob(state, m, c); return { label: c.label, p, signature: !!c.signature,
    level: p >= 0.65 ? "높음" : p >= 0.4 ? "보통" : "낮음", timing: timingOf(c), follow: !!(m.talk?.tag && choiceTag(c) === m.talk.tag) }; });
  m.pending = { sit, list, vars: sv, text: fill(pick(sit.text), sv), choices, ball: [S.ball.x, S.ball.y], ctx };
}

// 경기 시작 줄
function kickoffLines(state, m) {
  const out = [], L = (t, k = "info", extra = {}) => out.push({ t, k, minute: 0, ts: m.sim.t, ...extra });
  L(say(LINES.kickoff, { us: m.fx.usName || TEAM_NAME }), "whistle");
  if (m.bond && m.status === "start") L(m.bond.line, "me");   // 예전 선택이 돌아오는 순간
  if (m.status !== "start") L(m.status === "bench" || m.status === "sub" ? "벤치에서 경기를 지켜본다. 언제 부를지 모른다." : (m.reason || "관중석에서 경기를 지켜본다."));
  if (m.restNote) L(m.restNote, "coach");
  if (m.star >= 1 && m.status === "start") L(fill(pick(ME_IN_PLAY.marked), { me: m.me }), "me-auto");
  if (m.status === "start" && isBirthdayWeek(state, turnInfo(state)))
    L(fill("생일 주간에 선발 출전한 {me}. 벤치에서 {a|이/가} 손가락으로 케이크 모양을 그려 보인다.", { me: m.me, a: STAFF.assistant }), "coach");
  if (state.flags.captain && m.status === "start") L(fill("주장 완장을 찬 {me|이/가} 상대 주장과 악수하고 동전 던지기에 나선다.", { me: m.me }), "me");
  if (state.player.number === 10 && m.grade === 3 && m.status === "start" && !state.flags.played10) {
    state.flags.played10 = true;
    L("등에 10번을 단 첫 경기. 관중석에서 엄마가 휴대폰을 높이 든다.", "me");
  }
  // 큰 부상 뒤 복귀전
  if (m.status === "start" && state.flags.returnTurn != null && m.turn - state.flags.returnTurn <= 3) {
    m.comeback = true; state.flags.returnTurn = null;
    L(fill("{me}의 복귀전. 벤치에서 {a|이/가} 엄지를 들어 보인다.", { me: m.me, a: STAFF.assistant }), "coach");
  }
  return out;
}

// ── 진행 ────────────────────────────
// 경기장을 조금씩 굴리며 중계 줄을 만듦. kind: "line" 계속 / "moment" 선택 대기 / "ht" 하프타임 / "ft" 종료
// m.record가 켜져 있으면 그사이 경기장 모습(frames)을 함께 돌려줌 (화면이 그대로 그림)
const CHUNK = 5;                                   // 한 번에 굴리는 시뮬레이션 시간(초)
export function next(state, m) {
  if (m.pending || m.done) return { kind: m.done ? "ft" : "moment", lines: [], frames: [] };
  const S = m.sim;
  S.flow = m.flow || 0;
  if (m.record) S.rec = [];
  const lines = [];
  let cut = false;
  if (!m.started) { m.started = true; lines.push(...kickoffLines(state, m)); }
  // 경기 막판 블록 높이: 이기는 팀은 내려앉고, 지는 팀은 올라감
  { const [a, b] = m.score, late = m.minute >= 52;
    S.block.us = late && a > b ? "low" : late && a < b ? "high" : "mid";
    S.block.them = late && b > a ? "low" : late && b < a ? "high" : m.oppBlock; }
  if (m.half2Pending) {
    m.half2Pending = false; cut = true;
    kickoffSetup(S, "them", true);
    lines.push({ t: say(LINES.secondHalf, {}), k: "whistle", minute: HALF, ts: S.t, half2: true });
  }
  const t0 = S.t;
  let kind = "line";
  for (let guard = 0; guard < 2000; guard++) {
    const n0 = S.ev.length;
    simStep(S);
    m.minute = Math.min(LENGTH, minuteOf(S));
    for (let i = n0; i < S.ev.length; i++) lines.push(...narrate(state, m, S.ev[i]));
    if (S.t - m.lastT > 8 && S.phase === "play" && S.holder && S.holder.pos !== "GK" && !S.ball.fl && !S.script.length && !S.scur && !m.staging) lines.push(...holdLine(m));
    while (m.timed.length && m.timed[0].minute <= m.minute) lines.push(...timedEvent(state, m, m.timed.shift(), S.t));
    if (m.staging?.waitRecv) {                              // 동료 패스가 나에게 닿으면 장면 연출 시작
      const M = meOf(S);
      if (S.holder === (m.staging.recvBy || M) || S.t > m.staging.waitRecv) { m.staging.waitRecv = 0; stageStart(S, m.staging.hint); }
      continue;
    }
    if (m.staging) { if (!S.stage) { finishStaging(state, m); kind = "moment"; break; } continue; }
    // 내 순간: 정해 둔 때가 되면 공이나 상황이 나에게 오기를 기다림 (그동안 동료들이 나를 더 찾음)
    const halfEnd = m.half === 1 ? HALF_T : 2 * HALF_T;
    const due = m.onPitch && !m.injured && !m.subbedOff && m.momentQ.length && m.minute >= m.momentQ[0] && S.t >= (m.nextOk || 0)
      && S.t < halfEnd - 4;                                   // 휘슬 직전에는 새 장면을 시작하지 않음 (결과가 경기장에서 다 이어지도록)
    if (due && !S.script.length && !S.scur) {
      if (!m.want) { const w = wantSituation(state, m); m.want = w ? { sit: w, cat: sitCat(w), t0: m.minute } : null; }
      S.bias = { me: 3, planPos: m.want && (m.want.sit.poss || "us") === "us" && m.want.sit.zone === "att" ? state.player.position : null,
        defSide: m.want?.sit.poss === "them",
        them: m.want?.sit.poss === "them" && m.minute - m.want.t0 >= 1.5 };          // 내 수비 장면을 오래 기다리면 상대가 조금 더 적극적으로 올라옴
      const ctx = momentCtx(state, m, S.ev.slice(n0));
      let sit = null;
      if (ctx && m.want && wantFits(m, m.want, ctx)) sit = m.want.sit;
      else if (ctx && (!m.want || m.minute - m.want.t0 >= wantPatience(m, m.want, ctx))) sit = pickSituation(state, m, ctx);   // 오래 안 맞으면 지금 상황에 맞는 장면으로
      if (sit) { m.want = null; startMoment(state, m, sit, ctx, lines, S.t); }
      else if (m.want?.cat.includes(":") && m.minute - m.want.t0 >= 1.5) makeSetPiece(m, m.want);
    } else if (S.bias && !due) S.bias = null;
    const end = m.half === 1 ? HALF_T : 2 * HALF_T;
    const busy = S.ball.fl || S.shot || S.script.length || S.scur || m.staging;
    if (S.t >= end && !busy) { kind = m.half === 1 ? "ht" : "ft"; break; }
    if (S.t >= end + (S.script.length || S.scur ? 20 : 6)) { kind = m.half === 1 ? "ht" : "ft"; flushScript(m, lines); break; }   // 안전장치: 끝나지 않은 장면 결과는 휘슬 전에 마저 적음
    if (S.t - t0 >= CHUNK && !m.staging && !S.scur) break;
  }
  const min = m.minute;
  const L = (t, k = "info", extra = {}) => lines.push({ t, k, minute: min, ts: S.t, ...extra });
  if (kind === "moment") { m.nextOk = S.t + 3; }
  if (kind === "ht") {
    m.half = 2; m.half2Pending = true; m.minute = HALF;
    const [a, b] = m.score;
    const mood = a > b ? "winning" : a === b ? "drawing" : "losing";
    L(`전반 종료. ${TEAM_NAME} ${a} : ${b} ${m.fx.opponent.name}`, "whistle", { poss: null, htWhistle: true });
    L(statLine(m), "stat");
    L(`${STAFF.coach}: "${pick(HALFTIME_TALK[mood])}"`, "coach");
    // 전반 내 경기 평가 → 라커룸에서 따로 하는 이야기. 전반이 많이 아쉬우면 교체
    if (m.status === "start" && m.onPitch && !m.injured) {
      const d1 = m.my.delta, dec = m.my.decisions, suc = m.my.successes;
      const poor = dec >= 2 && (d1 <= -0.35 || (suc === 0 && d1 < -0.1));
      const good = d1 >= 0.6 || m.my.goals > 0 || m.my.assists > 0;
      const rep = m.bench?.find(b => !m.lineup.some(l => l.name === b.name));
      const off = poor && rep && chance((m.fx.ko ? 0.35 : 0.6) * (m.star >= 1 ? 0.5 : 1));
      const md = off ? "off" : good ? "praise" : poor ? "scold" : "calm";
      const T = HT_TALK[md];
      m.htTalk = { mood: md, text: fill(pick(T.text), { me: state.player.name.length === 3 ? state.player.name.slice(1) : state.player.name }), choices: T.choices };
      if (off) {
        m.onPitch = false; m.subbedOff = { minute: HALF };
        m.lineup.push({ name: rep.name, number: rep.number, pos: m.myPos });
        swapMe(m, rep, false);
        L(fill("교체: {me|이/가} 나오고 {r|이/가} 들어간다. 전반의 아쉬움을 안고 벤치로 걸어 나간다.", { me: m.me, r: rep.name }), "me-bad",
          { injuredOff: { name: rep.name, number: rep.number } });
      }
    }
  }
  if (kind === "ft") {
    m.minute = LENGTH;
    L(say(LINES.fulltime, {}), "whistle", { poss: null });
    L(statLine(m), "stat");
    m.done = true;
  }
  m.feed.push(...lines);
  const frames = m.record ? S.rec : [];
  if (m.record) S.rec = [];
  return { kind, lines, frames, cut };
}

// 전반·후반 종료 휘슬이 장면 결과보다 먼저 울릴 때: 남은 중계 문장을 휘슬 전에 내보내고 대본은 버림 (후반 킥오프 뒤에 나오지 않게)
function flushScript(m, lines) {
  const S = m.sim;
  for (const st of S.script) if (st.do === "emit") for (const l of st.lines) lines.push({ ...l, minute: Math.min(LENGTH, m.minute), ts: S.t });
  setScript(S, []);
  m.lastT = S.t;
}

// 점유율은 경기장에서 실제로 공을 가진 시간으로
function possShare(m) {
  const S = m.sim, a = S?.possT.us || 0, b = S?.possT.them || 0;
  return a + b > 1 ? Math.round(clamp(a / (a + b) * 100, 22, 78)) : 50;
}
export function statLine(m) {
  m.stats.poss = possShare(m);
  const u = m.stats.us, t = m.stats.them;
  return `점유율 ${m.stats.poss}% 대 ${100 - m.stats.poss}%, 슈팅 ${u.shots} 대 ${t.shots} (유효 ${u.on} 대 ${t.on}), 코너킥 ${u.corners} 대 ${t.corners}`;
}

// 능력치 조건 (장면·선택지가 열리는지)
function meets(state, req) {
  return !req || Object.entries(req).every(([k, v]) => getPath(state.player.stats, k) >= v);
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
  if (hasTrait(p, "modelStudent") && (c.stats["mental.focus"] || 0) >= 0.3) x += 0.03;   // 모범생: 집중력 장면
  if (m.talk?.tag && choiceTag(c) === m.talk.tag) x += 0.04;
  if (m.prep && (!m.prep.tag || choiceTag(c) === m.prep.tag)) x += m.prep.bonus;   // 미팅에서 다짐한 대로
  if (m.htBuff && (!m.htBuff.tag || choiceTag(c) === m.htBuff.tag)) x += m.htBuff.bonus;   // 하프타임 이야기
  if (m.order && (!m.order.tag || choiceTag(c) === m.order.tag)) x += m.order.bonus;   // 감독님 지시대로 준비한 주
  if (m.bond) x += m.bond.bonus;                                                            // 예전에 쌓은 인연
  if (hasTrait(p, "clutch") && m.score[0] < m.score[1] && m.minute > HALF) x += 0.07;
  if (c.physical) x -= m.physGap;
  x += m.formSwing;
  return clamp(x, 0.05, 0.95);
}

// ── 내 선택 처리 ────────────────────
// 성공·실패와 골 확률 계산은 예전과 같고, 결과는 경기장에서 실제로 일어나게 함(대본).
// 결과 문장 중 골·선방처럼 공이 도착해야 알 수 있는 줄은 경기장에서 그 순간이 왔을 때 나옴
// 결과 문장 → 경기장에서 보여 줄 슈팅 결과 (문장과 화면이 어긋나지 않게 문장 내용으로 정함)
function shotResOf(t, fallback) {
  if (/골대를 맞|골포스트를 맞|골대 안쪽|크로스바를 (맞|때)|골대를 때/.test(t)) return "post";
  if (/빗나|벗어|넘어|옆으로|비껴|위로|관중석/.test(t)) return "wide";
  if (/벽에|수비 발|굴절|걷어 냈/.test(t)) return "block";
  if (/골키퍼|품으로|쳐 냈|막아|막혔|잡아 낸|선방|정면/.test(t)) return "save";
  return fallback;
}
export function resolve(state, m, ci, timing = null) {
  const pick = arr => fresh(m, arr);                 // 같은 경기에서 같은 결과 문장이 되풀이되지 않게
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
  const S = m.sim, ts = S.t;
  // 상황 설명을 기록에 남겨야 나중에 읽어도 앞뒤가 이어짐
  const head = [{ t: pd.text, k: "me", minute: min, ts, fast: true },
                { t: `▶ ${c.label}${timing ? ` ${{ perfect: "(완벽한 타이밍!)", good: "(좋은 타이밍)", miss: "(타이밍이 어긋났다)" }[timing]}` : ""}`, k: "me", minute: min, ts }];
  // 결과 문장은 경기장에서 그 동작이 끝나는 순간에 나옴 (대본 안에 넣음, scriptFor). 문장 틀은 동작을 고르는 데도 씀
  const outTpl = pick(ok ? c.winText : c.loseText);
  const outLines = [{ t: fill(outTpl, v), k: ok ? "me-good" : "me-bad", minute: min, ts }];
  if (ok && pd.choices[ci].follow) outLines.push({ t: fill("{c|이/가} 벤치에서 주먹을 쥔다. 경기 전 지시 그대로다.", { c: m.talk.who === "coach" ? STAFF.coach : STAFF.assistant }), k: "coach", minute: min, ts });

  const main = Object.entries(c.stats).sort((a, b) => b[1] - a[1])[0][0];
  m.my.decisions++; if (ok) m.my.successes++;
  m.my.log.push({ sit: pd.sit.id, label: c.label, ok, out, stat: main, value: getPath(pl.stats, main), level: pd.choices[ci].level, minute: min, signature: !!c.signature });
  m.my.delta += OUTCOMES[out].rating;
  if (pd.sit.id === "penalty" && out === "miss") { m.stats.us.shots++; m.stats.us.on++; }
  else if (out === "miss" && isShotChoice(c)) m.stats.us.shots++;   // 빗나간 슈팅도 슈팅 수에
  if (/corner/.test(pd.sit.id)) m.stats.us.corners++;

  const tail = [];
  let R = null;
  const L = (t, k, extra = {}) => tail.push({ t, k, ...extra });
  const finish = (stat, goalTxt, saveTxt, wideTxt, kind = "shot") => {
    m.stats.us.shots++;
    const q = clamp(0.035 + CAL.fin + (stat - (m.theirs + 4)) / 120 + (pl.stats.mental.confidence - 50) / 400 + conditionOf(pl).match * 0.6
      + (hasTrait(pl, "finisher") ? 0.04 : 0), 0.04, 0.36 + CAL.fin);
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++; m.my.goals++; m.my.delta += 0.75;
      m.goalsLog.push({ team: "us", name: pl.name, minute: min, me: true });
      L(fill(pick(goalTxt), v), "goal-me", { score: [...m.score] });
      tail.push(goalNote(m, "us", min));
      R = { who: "me", res: "goal", kind };
    } else {
      const saved = rand() < 0.6;
      const t = pick(saved ? saveTxt : wideTxt);
      L(fill(t, v), "me");
      R = { who: "me", res: shotResOf(t, saved ? "save" : "wide"), kind };
      if (R.res === "save") m.stats.us.on++;                       // 유효 슈팅은 골키퍼가 막은 것만
    }
  };
  const teammateFinish = (q, goalTxt = LINES.assistGoal, missTxt = LINES.assistMiss, credit = true, kind = "shot") => {
    m.stats.us.shots++;
    if (credit && hasTrait(pl, "playmaker")) q += 0.06;
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++;
      if (credit) { m.my.assists++; m.my.delta += 0.6; }
      m.goalsLog.push({ team: "us", name: v.mate, minute: min, assist: credit ? pl.name : null, myAssist: credit });
      L(fill(pick(goalTxt), v), "goal-us", { score: [...m.score] });
      tail.push(goalNote(m, "us", min));
      R = { who: "mate", res: "goal", kind };
    } else {
      const t = pick(missTxt);
      L(fill(t, v), "us");
      R = { who: "mate", res: shotResOf(t, "save"), kind };
    }
  };
  const concede = (q, txtGoal, txtSave) => {
    if (rand() < q) {
      m.stats.them.shots++; m.stats.them.on++; m.score[1]++; m.my.delta -= 0.25;
      m.goalsLog.push({ team: "them", name: v.opp, minute: min, myFault: true });
      L(fill(pick(txtGoal), v), "goal-them", { score: [...m.score] });
      tail.push(goalNote(m, "them", min));
      R = { who: "opp", res: "goal" };
    } else if (txtSave) {
      m.stats.them.shots++;
      const saver = nearestP(m.sim, "us", m.sim.ball, p => !p.me && p.ri && p.pos !== "GK");   // 실제로 공 가까이 있던 동료가 걷어 냄
      const t = pick(txtSave);
      L(fill(t, { ...v, mate: saver?.name || mateName(m, ["DF"]) }), "them");
      R = { who: "opp", res: shotResOf(t, "save") };
    }
  };

  if (out === "shot") finish(pl.stats.tech.shoot, LINES.myShotGoal, LINES.myShotSaved, LINES.myShotWide);
  if (out === "chip") finish(pl.stats.tech.shoot + 8, LINES.myChipGoal, LINES.myChipMiss, LINES.myChipMiss);
  if (out === "head") finish(pl.stats.phys.jump * 0.6 + pl.stats.tech.shoot * 0.4, LINES.myHeadGoal, LINES.myHeadMiss, LINES.myHeadMiss, "head");
  // 우리 진영 깊은 곳에서 나온 결정적 패스: 받은 동료가 한 번 더 앞으로 연결하고 공격수가 마무리 (혼자 60m를 몰고 가지 않게)
  if (["assist", "keyPass", "killPass"].includes(out) && pd.ball[0] < 62) {
    const partner = SP(m, v.mate, "us");
    const fin = nearestP(S, "us", { x: 92, y: 34 }, p => !p.me && p.ri && p.pos === "FW" && p !== partner);
    if (partner && fin && fin.x > partner.x + 8) { pd.relay = partner; v.mate = fin.name; }
  }
  if (out === "assist") teammateFinish(0.35);
  if (out === "keyPass") teammateFinish(0.18);
  if (out === "killPass") teammateFinish(0.5);
  if (out === "tapIn") finish(pl.stats.tech.shoot + 20, LINES.tapGoal, LINES.myShotSaved, LINES.myShotWide);
  if (out === "pk") {
    m.stats.us.shots++; m.stats.us.on++; m.score[0]++; m.my.goals++; m.my.delta += 0.6;
    m.goalsLog.push({ team: "us", name: pl.name, minute: min, me: true });
    L(fill(pick(LINES.pkGoal), v), "goal-me", { score: [...m.score] });
    tail.push(goalNote(m, "us", min));
    R = { who: "me", res: "goal", kind: "pk" };
  }
  if (out === "matePk") teammateFinish(0.72, LINES.matePkGoal, LINES.matePkMiss, false, "pk");
  if (out === "setPiece") {
    // 골문과 먼 곳에서 얻은 프리킥은 직접 차지 않고 박스 안으로 길게 올림 (공격 3분의 1 밖에서는 슛하지 않음)
    const [bx, by] = pd.ball, deep = !(pd.ctx?.cat || "").startsWith("set:") && (bx < 72 || Math.abs(by - 34) >= 18);
    if (deep && bx < 52) R = { far: true };                // 우리 진영 반칙: 슈팅 없이 프리킥으로 다시 시작 (짧게 이어 감)
    const tgt = deep && !R ? nearestP(S, "us", { x: 93, y: 34 }, p => !p.me && p.ri && p.pos === "FW") || nearestP(S, "us", { x: 93, y: 34 }, p => !p.me && p.ri) : null;
    if (R?.far) { /* 다시 시작만 */ }
    else if (tgt) { v.mate = tgt.name; teammateFinish(0.12, LINES.fkCrossGoal, LINES.fkCrossMiss, false, "head"); R.cross = true; }
    else teammateFinish(0.16, LINES.fkGoal, LINES.fkMiss, false, "fk");
  }
  if (out === "longShot") finish(pl.stats.tech.shoot - 14, LINES.myLongGoal, LINES.myLongSaved, LINES.myLongWide, "long");
  if (out === "acro") finish((pl.stats.phys.jump + pl.stats.phys.agility + pl.stats.tech.shoot) / 3 + 2, LINES.acroGoal, LINES.acroMiss, LINES.acroMiss, "head");
  if (out === "card") m.stats.us.cards++;
  if (out === "decoy") teammateFinish(0.3, ["{mate|이/가} 빈 공간에서 마무리한다! 골!", "내가 비운 자리로 {mate|이/가} 뛰어들었다! 골!"], LINES.assistMiss, false);   // 도움은 아니지만 공간을 만든 몫
  if (out === "pkAgainst") concede(0.74, LINES.pkAgainstGoal, LINES.pkAgainstSave);
  if (out === "turnover") concede(0.1, pd.sit.poss === "them" ? LINES.leakGoal : LINES.turnoverGoal, null);
  if (out === "danger") concede(0.38, LINES.dangerGoal, LINES.dangerSave);
  if (out === "pk" || out === "miss") { /* pk는 위에서, miss는 대본에서 */ }
  if (out === "miss" && pd.sit.id === "penalty") R = { who: "me", res: "save", kind: "pk" };

  // 경기 흐름: 내 선택이 통하면 우리 쪽으로, 막히면 상대 쪽으로 (흐름을 탄 팀이 더 잘 넣음)
  const big = ["shot", "chip", "head", "tapIn", "pk", "longShot", "acro", "win", "killPass", "assist"].includes(out);
  const bad = ["danger", "turnover", "pkAgainst", "card"].includes(out);
  const before = m.flow || 0;
  m.flow = clamp(before * 0.7 + (ok ? (big ? 0.32 : 0.2) : (bad ? -0.32 : -0.14)), -1, 1);
  if (m.flow >= 0.45 && before < 0.45) L(pick(FLOW.up), "stat");
  if (m.flow <= -0.45 && before > -0.45) L(pick(FLOW.down), "stat");

  setScript(S, scriptFor(state, m, pd, c, out, R, tail, outLines, outTpl));
  m.pending = null;
  m.feed.push(...head);
  return { ok, outcome: out, lines: head, outText: outLines[0].t, outTpl, act: m._lastAct };
}
const isShotChoice = c => (c.stats["tech.shoot"] || 0) >= 0.5 || ["shot", "chip", "head", "tapIn", "longShot", "acro", "pk"].includes(c.win);

// 결과 문장 → 경기장에서 할 동작 (문장이 말한 대로 바둑알이 움직이게)
// 우리 공 장면: keep(지킴) / turnover·danger(잃음). 상대 공 장면: win(막음) / keep(못 막음)
function actOf(tpl, out, poss) {
  const t = tpl || "";
  if (/오프사이드/.test(t)) return "offside";
  if (poss === "us") {
    if (out === "keep") {
      if (/스로인을 얻었다/.test(t)) return "throwUs";
      if (/밖으로 찼|터치라인 밖으로|밖으로 걷어/.test(t)) return /돌려준다/.test(t) ? "outReturn" : "outThem";
      if (/\{gk\}에게|골키퍼에게|골키퍼를 거쳐/.test(t)) return "passGK";
      if (/측면|넓게|벌렸|반대편|반대쪽|압박 반대편/.test(t)) return "passWide";
      if (/뒤로|수비에게/.test(t)) return "passBack";
      if (/내줬|내준다|연결|이었|원터치|주고|돌려줬|옆으로|줬다|돌리며/.test(t)) return "passNear";
      if (/흘러갔|흘렀|다른 곳으로/.test(t)) return "none";
      return "hold";
    }
    if (out === "turnover" || out === "danger") {
      if (/라인 밖|라인을 넘|멀리 날아|너무 멀리/.test(t)) return "outLoss";
      if (/킥이 짧/.test(t)) return "cut";
      if (/골키퍼|\{ogk|품으로|덮친다|안았다/.test(t)) return "gkLoss";
      if (/끊|가로채|걸렸|걸린|읽고|그대로 갔|막혔|막아섰/.test(t)) return "cut";
      if (/걷어|받아 냈/.test(t)) return "oppClear";
      return "steal";
    }
    return null;
  }
  // 상대 공 장면
  if (out === "win") {
    if (/경고를 받|오히려 경고/.test(t)) return "foulThem";
    if (/우리 스로인/.test(t)) return "outThrowUs";
    if (/골라인 밖/.test(t)) return "outGoalUs";
    if (/관중석|라인을 넘|터치라인 밖/.test(t)) return "outThem";
    if (/\{gk[|}]/.test(t) && /잡|걷어|안/.test(t)) return "gkUs";
    if (/빼앗|우리 공|내 것|찾아왔|빼냈|주웠|내 발에 걸렸|끊어 냈|먼저 끊었|가로채|가슴으로 받아/.test(t)) return "steal";
    if (/걷어|차 냈|날아간|튀어 나간|쳐 냈|공을 툭|흐른다|흘렀|아무도 없는 곳|떨어진다|발끝보다 먼저/.test(t)) return "clear";
    if (/뒤로 돌린|옆으로 돌린|돌린다/.test(t)) return "oppBack";
    return "contain";
  }
  if (out === "danger" || out === "pkAgainst") return out === "danger" ? "oppAttack" : null;
  if (out === "keep") {
    if (/휘슬/.test(t)) return "foulUs";
    if (/\{gk\}의 가슴|안겼다/.test(t)) return "toOurGK";
    if (/\{ogk[|}]/.test(t) && /돌린|침착하게 반대/.test(t)) return "oppToGK";
    if (/길게 찬다|길게 차 낸|길게 걷어|먼저 걷어|먼저 찼/.test(t)) return /동료가 따냈다/.test(t) ? "oppLongLost" : "oppLong";
    if (/골키퍼에게 돌린/.test(t)) return "oppToGK";
    if (/터치라인 밖으로 차 냈/.test(t)) return "oppOutThrowUs";
    if (/벗겨 냈|빠져나간/.test(t)) return "beat";
    if (/앞으로|찔렀/.test(t)) return "oppForward";
    if (/넘겼|돌렸|돌린다|공을 돌린/.test(t)) return "oppSide";
    if (/걷어 냈/.test(t)) return "clearMate";
    return "contain";
  }
  return null;
}

// 선택 결과 → 경기장 대본
function scriptFor(state, m, pd, c, out, R, tail, outLines = [], outTpl = "") {
  const steps = scriptSteps(state, m, pd, c, out, R, tail, outTpl);
  // 결과 문장은 핵심 동작(main) 바로 뒤에. 없으면 맨 앞
  const i = steps.findIndex(x => x.main);
  steps.splice(i >= 0 ? i + 1 : 0, 0, { do: "emit", lines: outLines });
  return steps;
}
function scriptSteps(state, m, pd, c, out, R, tail, outTpl) {
  const S = m.sim, M = meOf(S);
  const ctx = pd.ctx || { cat: "recv", poss: pd.sit.poss || "us" };
  const v = pd.vars;
  const steps = [];
  const emit = { do: "emit", lines: tail };
  m._lastAct = null;
  if (!M) return [emit, { do: "release" }];
  const mate = (v.mate && SP(m, v.mate, "us")) || nearestP(S, "us", S.ball, p => !p.me && p.ri);
  const opp = (v.opp && SP(m, v.opp, "them")) || nearestP(S, "them", M, p => p.ri);
  let holder = S.holder;
  // 세트피스: 경기 재개 자리부터
  const setKind = { "set:corner": "corner", "set:cornerKick": "corner", "set:fkShot": "fk", "set:fkKick": "fk", "set:pk": "pk", "set:throw": "throw", "defset:corner": "corner", "defset:throw": "throw" }[ctx.cat];
  if (setKind) {
    const team = ctx.poss, set = ctx.set;
    let taker = set?.taker || (team === "us" ? mate : opp);
    if (["set:cornerKick", "set:fkShot", "set:fkKick", "set:pk", "set:throw"].includes(ctx.cat)) taker = M;
    if (out === "matePk" || out === "setPiece") taker = mate;                       // 동료에게 맡김
    const spot = set?.spot || (set && set.x != null ? [set.x, set.y] : [S.ball.x, S.ball.y]);   // 아직 공을 내려놓기 전이면 재개 자리로
    steps.push({ do: "restart", kind: setKind, team, x: spot[0], y: spot[1], taker, delay: 0.7, main: !["set:corner", "defset:corner", "defset:throw"].includes(ctx.cat) });
    holder = taker;
    if (ctx.cat === "set:corner") { steps.push({ do: "pass", from: taker, to: M, air: true, cross: true, tp: [M.x, M.y], kind: "cross", main: true }); holder = M; }
    if (ctx.cat.startsWith("defset")) {
      const tgt = ["win", "keep"].includes(out) ? M : opp !== taker ? opp : nearestP(S, "them", { x: 10, y: 34 }, p => p.ri && p !== taker);
      steps.push({ do: "pass", from: taker, to: tgt, air: true, cross: true, tp: [tgt.x, tgt.y], kind: "cross", main: true }); holder = tgt;
    }
  }
  const ensure = (p, main = false) => {
    if (!p || holder === p) return;
    if (!holder || holder.team !== p.team) steps.push({ do: "steal", by: p, main });
    else steps.push({ do: "pass", from: holder, to: p, lead: 0.5, main });
    holder = p;
  };
  const nearOpp = (pt, f = () => true) => nearestP(S, "them", pt, p => p.ri && f(p));
  const nearMate = (pt, f = () => true) => nearestP(S, "us", pt, p => !p.me && p.ri && p.pos !== "GK" && f(p));
  const shotBy = (p, res, kind) => { steps.push({ do: "shot", by: p, result: res || "wide", kind }); holder = null; };
  // 슈팅 자리까지 몰고 감 (예전 엔진처럼 골문 앞 25m 안에서 때리게). 대본 단계 전에 공 가진 선수가 바뀌므로 그 선수 자리로 셈
  const approach = (p, far = 20, main = false) => steps.push({ do: "carry", by: p, toGoal: far, v: 8.2, main });
  const shootKind = { shot: "shot", chip: "shot", tapIn: "shot", longShot: "long", acro: "head", head: "head" };
  const shotOut = ["shot", "chip", "tapIn", "longShot", "acro", "head"].includes(out) || (out === "miss" && isShotChoice(c));
  if (shotOut || out === "pk") {
    ensure(M);
    // 결과 문장: 성공(슈팅 기회)은 슈팅 자리에 왔을 때, 실패(빗나감)는 슈팅이 끝났을 때
    if (!setKind) approach(M, out === "longShot" || c.win === "longShot" ? 25 : out === "head" || out === "tapIn" ? 9 : 17, out !== "miss");
    const kind = setKind === "pk" ? "pk" : ctx.cat === "set:fkShot" ? "fk" : R?.kind === "head" || out === "head" || out === "acro" || (c.stats["phys.jump"] || 0) >= 0.5 ? "head" : shootKind[out] || (R?.kind ?? "shot");
    shotBy(M, R?.res || (out === "miss" ? "wide" : "save"), kind);
    if (out === "miss" || setKind) steps[steps.length - 1].main = !steps.some(x => x.main);
    steps.push(emit);
  } else if (["assist", "keyPass", "killPass"].includes(out)) {
    ensure(M);
    const tgt = mate && mate !== M ? mate : nearestP(S, "us", { x: 92, y: 34 }, p => !p.me && p.ri);
    if (tgt && pd.relay && pd.relay !== tgt) {
      steps.push({ do: "pass", from: M, to: pd.relay, lead: 2, main: true });           // 나 → 동료 → 공격수
      steps.push({ do: "pass", from: pd.relay, to: tgt, lead: 3.5 });
      holder = tgt;
      approach(tgt, 15);
      shotBy(tgt, R?.res, "shot");
    } else if (tgt) {
      steps.push({ do: "pass", from: M, to: tgt, lead: 2.5, air: setKind === "corner", cross: setKind === "corner", main: true });
      holder = tgt;
      if (!setKind) approach(tgt, 15);
      shotBy(tgt, R?.res, R?.kind === "head" ? "head" : "shot");
    }
    steps.push(emit);
  } else if (out === "decoy") {
    ensure(mate, true);
    approach(mate, 14);
    shotBy(mate, R?.res, "shot");
    steps.push(emit);
  } else if (out === "setPiece" && R?.far && !setKind) {
    steps.push({ do: "restart", kind: "fk", team: "us", x: S.ball.x, y: S.ball.y, taker: nearestP(S, "us", S.ball, p => p.ri && p.pos !== "GK"), delay: 1.0 });   // 가까운 선수가 짧은 프리킥으로 이어 감 (반칙 문장은 휘슬과 함께)
    steps.push(emit);
  } else if (out === "setPiece" && R?.cross && !setKind) {
    // 먼 프리킥: 박스에 동료들이 모인 뒤 길게 올리고, 동료가 머리로 마무리
    const taker = nearestP(S, "us", S.ball, p => p !== mate && p.ri && p.pos !== "GK");
    const box = [96, 34 + range(-4, 4)];
    steps.push({ do: "restart", kind: "fk", team: "us", x: S.ball.x, y: S.ball.y, taker, delay: clamp(Math.hypot(mate.x - box[0], mate.y - box[1]) / 8.5, 1.6, 4.5), pack: true, runner: mate, runTo: box });
    steps.push({ do: "waitNear", p: mate, x: box[0], y: box[1], r: 3, max: 3 });
    steps.push({ do: "pass", from: taker, to: mate, air: true, cross: true, tp: box, kind: "cross" });   // 반칙 문장은 휘슬과 함께 (맨 앞)
    holder = mate;
    shotBy(mate, R.res, "head");
    steps.push(emit);
  } else if (out === "matePk" || out === "setPiece") {
    if (!setKind) { steps.push({ do: "restart", kind: out === "matePk" ? "pk" : "fk", team: "us", x: S.ball.x, y: S.ball.y, taker: mate, delay: 0.9 }); holder = mate; }   // 반칙·양보 문장은 바로
    shotBy(holder || mate, R?.res, out === "matePk" ? "pk" : "fk");
    steps.push(emit);
  } else if (!setKind && ["win", "keep", "turnover", "danger", "offside", "card"].includes(out) && actOf(outTpl, out, ctx.poss)) {
    const act = actOf(outTpl, out, ctx.poss);
    m._lastAct = act;
    const H = S.holder;                                                          // 지금 공 가진 선수 (장면 연출 뒤)
    const oppH = H && H.team === "them" ? H : opp;
    const restart = (kind, team, x, y, extra = {}) => steps.push({ do: "restart", kind, team, x, y, delay: 1.0, ...extra });   // 휘슬 문장은 바로 (main 아님)
    const sideY = y => (y < 34 ? 0.3 : 67.7);
    switch (act) {
      // ── 우리 공 장면 ──
      case "hold": ensure(M); steps.push({ do: "wait", t: 0.8, main: true }); break;
      case "none": steps.push({ do: "wait", t: 0.4, main: true }); break;
      case "passNear": case "passWide": case "passBack": case "passGK": {
        ensure(M);
        const tgt = act === "passGK" ? gkOf(S, "us")
          : act === "passWide" ? (nearMate({ x: M.x + 4, y: M.y < 34 ? 60 : 8 }) || mate)
          : act === "passBack" ? (nearMate({ x: M.x - 12, y: M.y }, p => p.x < M.x - 2) || mate)
          : (mate && mate !== M && Math.hypot(mate.x - M.x, mate.y - M.y) < 30 ? mate : nearMate(M));
        if (tgt) { steps.push({ do: "pass", from: M, to: tgt, lead: act === "passBack" || act === "passGK" ? 0 : 1, main: true }); holder = tgt; }
        break;
      }
      case "throwUs": ensure(M); restart("throw", "us", M.x, sideY(M.y), { taker: nearMate({ x: M.x, y: sideY(M.y) }) }); break;
      case "outReturn": ensure(M); steps.push({ do: "clear", by: M, out: "touch", main: true }); break;
      case "outThem": ensure(M); steps.push({ do: "clear", by: M, out: "touch", main: true }); break;
      case "outLoss": ensure(M); steps.push({ do: "clear", by: M, out: M.y < 20 || M.y > 48 ? "touch" : "goal", main: true }); break;
      case "gkLoss": { ensure(M); const gk = gkOf(S, "them"); if (gk) { steps.push({ do: "pass", from: M, to: gk, lead: 0, main: true }); holder = gk; } break; }
      case "cut": {
        // 공 가진 쪽이 동료면 그 동료가 나에게 주는 패스가, 나면 내가 동료에게 주는 패스가 끊김
        const from = H && H.team === "us" ? H : M;
        if (from === M) ensure(M);
        const to = from === M ? (mate && mate !== M ? mate : nearMate(M)) : M;
        const cutter = nearOpp({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 });
        if (cutter && to) { steps.push({ do: "passCut", from, to, by: cutter, main: true }); holder = cutter; } else ensure(cutter, true);
        break;
      }
      case "oppClear": { const d = nearOpp(S.ball); steps.push({ do: "clear", by: d, main: true }); holder = null; break; }
      case "steal":
        if (ctx.poss === "them") ensure(M, true);                                          // 상대 공 장면: 내가 빼앗음
        else ensure(oppH !== H ? oppH : nearOpp(S.ball), true);                          // 우리 공 장면: 상대가 빼앗음
        break;
      // ── 상대 공 장면 ──
      case "offside": restart("fk", ctx.poss === "them" ? "us" : "them", ctx.poss === "them" ? (oppH?.x ?? S.ball.x) : M.x, ctx.poss === "them" ? (oppH?.y ?? S.ball.y) : M.y); break;
      case "foulThem": restart("fk", "us", S.ball.x, S.ball.y); break;
      case "foulUs": restart("fk", "them", S.ball.x, S.ball.y); break;
      case "outThrowUs": steps.push({ do: "clear", by: M, out: "touch", main: true }); break;
      case "outGoalUs": steps.push({ do: "clear", by: M, out: "goal", main: true }); break;
      case "clear": case "clearMate": steps.push({ do: "clear", by: act === "clearMate" ? (nearMate(S.ball) || M) : M, main: true }); holder = null; break;
      case "gkUs": {                                                              // 우리 골키퍼가 잡음 (공이 우리 골문 가까이 있을 때만. 아니면 내가 걷어 냄)
        const gk = gkOf(S, "us");
        if (gk && S.ball.x < 22) ensure(gk, true); else { steps.push({ do: "clear", by: M, main: true }); holder = null; }
        break;
      }
      case "toOurGK": { const gk = gkOf(S, "us"); if (H && H.team === "them" && gk) { steps.push({ do: "pass", from: H, to: gk, lead: 0, main: true }); holder = gk; } break; }
      case "oppToGK": { const gk = gkOf(S, "them"); if (H && H.team === "them" && gk && H !== gk) { steps.push({ do: "pass", from: H, to: gk, lead: 0, main: true }); holder = gk; } else steps.push({ do: "wait", t: 0.6, main: true }); break; }
      case "oppLong": case "oppLongLost": {
        const kicker = H && H.team === "them" ? H : nearOpp(S.ball);
        if (kicker) steps.push({ do: "clear", by: kicker, main: true });
        holder = null; break;
      }
      case "oppOutThrowUs": { const k2 = H && H.team === "them" ? H : nearOpp(S.ball); steps.push({ do: "clear", by: k2, out: "touch", main: true }); break; }
      case "beat": if (H && H.team === "them") { steps.push({ do: "beat", by: H, victim: M, dist: 9, main: true }); } break;
      case "oppForward": case "oppSide": case "oppBack": {
        if (!H || H.team !== "them") { steps.push({ do: "wait", t: 0.6, main: true }); break; }
        const dir = act === "oppForward" ? -12 : act === "oppBack" ? 12 : 0;        // 상대는 -x로 공격
        const tgt = nearestP(S, "them", { x: H.x + dir, y: act === "oppSide" ? 68 - H.y : H.y }, p => p !== H && p.ri && p.pos !== "GK" && (act === "oppBack" ? p.x > H.x + 2 : act === "oppForward" ? p.x < H.x - 2 : true));
        if (tgt) { steps.push({ do: "pass", from: H, to: tgt, lead: 0, main: true }); holder = tgt; }
        break;
      }
      case "oppAttack": {                                                         // 상대가 나를 제치고 몰고 감 (슈팅은 아래에서)
        const att = H && H.team === "them" ? H : opp;
        if (S.holder !== att) ensure(att, true);
        else steps.push({ do: "beat", by: att, victim: M, dist: 7, main: true });
        holder = att;
        break;
      }
      case "contain": default:
        if (ctx.poss === "them" && H && H.team === "them") { steps.push({ do: "wait", t: 0.9, main: true }); }   // 막아서자 상대가 머뭇거림
        else if (out === "win") { ensure(M, true); }
        break;
    }
    // 공을 잃은 뒤 실점·위기로 이어질 때: 공 가진 상대가 (골키퍼면 공격수에게 길게 차 준 뒤) 몰고 가서 슈팅
    const attacker = () => {
      if (holder && holder.team === "them" && holder.pos !== "GK") return holder;
      const fw = nearestP(S, "them", { x: 35, y: 34 }, p => p.ri && p.pos !== "GK");
      if (holder && holder.team === "them" && holder.pos === "GK" && fw) { steps.push({ do: "pass", from: holder, to: fw, air: true, lead: 0 }); holder = fw; }
      return fw || opp;
    };
    if (out === "danger") {
      const att = attacker();
      if (R) { approach(att, 15); shotBy(att, R.res, "shot"); }
      else if (holder === att) steps.push({ do: "carry", by: att, dist: 10 });
    }
    if (out === "turnover" && R?.res === "goal") { const att = attacker(); approach(att, 15); shotBy(att, "goal", "shot"); }
    if (out === "card") restart("fk", "them", S.ball.x, S.ball.y);
    steps.push(emit);
  } else if (out === "win") {
    if (ctx.poss === "them") { ensure(M, true); steps.push(emit); }
    else { ensure(M); steps.push({ do: "carry", by: M, dist: 9, main: true }); steps.push(emit); }
  } else if (out === "keep") {
    if (ctx.poss === "us") {
      ensure(M);
      const back = nearestP(S, "us", { x: M.x - 8, y: M.y }, p => !p.me && p.ri && p.x < M.x + 2);
      if (back) { steps.push({ do: "pass", from: M, to: back, lead: 0, main: true }); holder = back; }
    }
    steps.push(emit);
  } else if (out === "turnover" || out === "miss") {
    ensure(opp, true);
    if (R?.res === "goal") { approach(opp, 15); shotBy(opp, "goal", "shot"); }
    steps.push(emit);
  } else if (out === "danger") {
    ensure(opp, true);
    if (R) { approach(opp, 15); shotBy(opp, R.res, "shot"); }
    else steps.push({ do: "carry", by: opp, dist: 10 });
    steps.push(emit);
  } else if (out === "pkAgainst") {
    steps.push({ do: "restart", kind: "pk", team: "them", taker: opp, delay: 1.2, main: true });
    holder = opp;
    shotBy(opp, R?.res || "save", "pk");
    steps.push(emit);
  } else if (out === "offside" || out === "card") {
    steps.push(emit);
    steps.push({ do: "restart", kind: "fk", team: "them", x: out === "offside" ? M.x : S.ball.x, y: out === "offside" ? M.y : S.ball.y, delay: 1.0 });
  } else steps.push(emit);
  steps.push({ do: "release" });
  return steps;
}

// 하프타임 라커룸 대답 반영 (화면에서 고름). 돌려주는 값: 감독님 대답과 바뀐 수치
export function applyHalftime(state, m, idx) {
  const t = m.htTalk, c = t?.choices[idx];
  if (!c) return null;
  const p = state.player, changes = [];
  m.htBuff = c.buff ? { ...c.buff } : null;
  for (const [path, v] of Object.entries(c.s || {})) changes.push({ path, d: applyGain(state, path, v, { raw: true }) });
  if (c.morale) p.condition.morale = clamp(p.condition.morale + c.morale, 0, 100);
  if (c.coach) state.relations.coach = clamp(state.relations.coach + c.coach, 0, 100);
  m.htTalk.chosen = idx;
  return { reply: c.reply, changes };
}

const VALUE = { goal: 1, chip: 0.45, shot: 0.35, head: 0.3, assist: 0.45, killPass: 0.55, keyPass: 0.3, win: 0.3, keep: 0.1, miss: 0, turnover: -0.12, danger: -0.38,
  tapIn: 0.6, pk: 1, matePk: 0.6, setPiece: 0.2, offside: -0.05, pkAgainst: -0.75, longShot: 0.2, acro: 0.35, card: -0.15, decoy: 0.25 };
export function autoChoice(m) {
  const pd = m.pending;
  let best = 0, bestV = -9;
  pd.list.forEach((c, i) => {
    const p = pd.choices[i].p;
    const v = p * (VALUE[c.win] ?? 0) + (1 - p) * (VALUE[c.lose] ?? 0);
    if (v > bestV) { bestV = v; best = i; }
  });
  return best;
}

export function autoPlay(state, m) {
  let guard = 0;
  while (!m.done && guard++ < 5000) {
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
    after: ["더 뛰겠다고 했지만 감독님은 고개를 저으셨다.", "벤치에 앉아 수건을 머리에 덮는다."] },
  knee: { cause: "몸싸움 끝에 무릎을 다쳤다.",
    lines: ["경합 끝에 넘어진 {me|이/가} 무릎을 감싸 쥔다. 경기가 멈췄다.", "{me}의 무릎이 상대와 부딪혔다. 쉽게 일어나지 못한다."],
    after: ["들것이 들어왔다. 관중석이 조용해진다.", "부축을 받고 나가며 하늘을 올려다본다."] },
};

// ── 경기 끝 ─────────────────────────
export function finishMatch(state, m) {
  const p = state.player, fx = m.fx;
  m.stats.poss = possShare(m);
  const [gf, ga] = m.score;
  let shootout = null;
  if (fx.ko && gf === ga) {
    const pw = 0.5 + (m.ours - m.theirs) / 80 + (m.onPitch ? (p.stats.tech.shoot - 50) / 400 : 0);
    const win = chance(clamp(pw, 0.2, 0.8));
    const k = int(3, 5);
    shootout = win ? { win, us: k, them: k - 1 } : { win, us: k - 1, them: k };
    m.feed.push({ t: `승부차기 ${shootout.us} : ${shootout.them}. ${win ? "이겼다!" : "졌다…"}`, k: win ? "goal-us" : "goal-them", minute: LENGTH });
  }

  noteOpp(state, m);                               // 상대 에이스 맞대결 기록
  state.meetingBuff = null;
  let minutes = m.status === "start" ? LENGTH : m.status === "sub" ? LENGTH - m.minIn : 0;
  if (m.injured) minutes = Math.max(1, m.injured.minute - (m.status === "sub" ? m.minIn : 0));
  if (m.subbedOff) minutes = m.subbedOff.minute;
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

  // 동료 평점과 경기 최우수 선수 (진 경기면 상대 팀에서 나옴)
  const team = [], seenN = new Set([p.name]);
  for (const x of [...(m.lineupStart || []), ...m.lineup]) {
    if (seenN.has(x.name)) continue; seenN.add(x.name);
    const late = m.lineupStart && !m.lineupStart.some(y => y.name === x.name);      // 교체로 들어온 선수
    const g = m.goalsLog.filter(z => z.team === "us" && z.name === x.name).length;
    const a = m.goalsLog.filter(z => z.team === "us" && z.assist === x.name).length;
    let r = 6.3 + (result === "승" ? 0.3 : result === "패" ? -0.3 : 0) + normal(0, 0.42) + g * 0.9 + a * 0.5
      + (x.pos === "DF" && ga === 0 ? 0.3 : 0) - (x.pos === "DF" && ga >= 3 ? 0.25 : 0);
    if (late) r = 6.2 + (r - 6.2) * 0.6;
    team.push({ name: x.name, number: x.number, pos: x.pos, r });
  }
  team.push({ name: m.gk.us, number: 1, pos: "GK", r: 6.3 + (ga === 0 ? 0.6 : -0.2 * Math.max(0, ga - 1)) + (m.stats.them.on - ga) * 0.12 + normal(0, 0.35) });
  team.forEach(t => { t.r = Math.round(clamp(t.r, 4.5, 9.6) * 10) / 10; });
  let momName = null, momTeam = "us";
  if (result === "패") {
    momTeam = "them";
    const sc = {}; for (const z of m.goalsLog) if (z.team === "them") sc[z.name] = (sc[z.name] || 0) + 1;
    momName = Object.entries(sc).sort((x, y) => y[1] - x[1])[0]?.[0] || m.oppAce?.name || pick(m.oppPlayers).name;
  } else if (mom) {
    team.forEach(t => { if (t.r >= rating) t.r = Math.round((rating - 0.1) * 10) / 10; });
    momName = p.name;
  } else {
    const top = team.slice().sort((x, y) => y.r - x.r)[0];
    if (rating != null && top.r <= rating) top.r = Math.min(10, Math.round((rating + 0.1) * 10) / 10);
    momName = top.name;
  }
  if (minutes > 0) team.push({ name: p.name, number: p.number, pos: p.position, r: rating, me: true });
  const ORD = { GK: 0, DF: 1, MF: 2, FW: 3 };
  m.teamRatings = team.sort((x, y) => ORD[x.pos] - ORD[y.pos] || y.r - x.r);
  m.mom = { name: momName, team: momTeam };

  const rec = state.record;
  if (minutes > 0) {
    rec.apps++; if (m.status === "start") rec.starts++;
    rec.goals += m.my.goals; rec.assists += m.my.assists; rec.ratings.push(rating);
    if (mom) rec.mom = (rec.mom || 0) + 1;
    state.relations.coach = clamp(state.relations.coach + (rating - 6.6) * 0.8, 0, 100);
    p.condition.fatigue = clamp(p.condition.fatigue + (fx.jn ? 9 : 16) * minutes / LENGTH, 0, 100);   // 소년체전은 하루 걸러 한 경기씩
    if (m.my.goals) applyGain(state, "mental.confidence", m.my.goals * 1.2, { raw: true });
    applyGain(state, "mental.competitive", 0.4, { raw: true });
    if (rating >= 7.5) applyGain(state, "mental.confidence", 0.5, { raw: true });
    if (rating < 5.8) applyGain(state, "mental.confidence", -0.6, { raw: true });
  }
  p.condition.morale = clamp(p.condition.morale + (result === "승" ? 6 : result === "패" ? -5 : 0)
    + (m.onPitch ? 0 : -3) + (mom ? 5 : 0), 0, 100);

  const notes = applyResult(state, fx, gf, ga, { shootoutWin: shootout?.win ?? null, rating,
    my: { goals: m.my.goals, assists: m.my.assists, ok: m.my.successes, n: m.my.decisions, pos: p.position, phys: m.physGap || 0 } });

  const res = {
    turn: m.turn, grade: m.grade, comp: fx.compLabel, compId: fx.comp, round: fx.round, official: fx.official,
    opponent: fx.opponent.name, gf, ga, result, status: m.status, minutes, goals: m.my.goals, assists: m.my.assists,
    rating, reason: m.reason, shootout, mom, momName, school: fx.school?.name || null,
    possession: m.stats.poss, shots: [m.stats.us.shots, m.stats.them.shots], involved: m.my.involved || 0, stops: m.my.stops || 0,
    injury: m.injured || null, subbedOff: !!m.subbedOff, clutch, elementary: !!fx.elementary, ko: !!fx.ko,
    decisions: m.my.decisions, successes: m.my.successes,
  };
  DEV.onFinish?.(m, res);                          // 시험 도구가 경기 내용을 들여다볼 때만
  rec.matches.push(res);
  matchMails(state, m, res, notes);
  res.notes = notes.map(n => typeof n === "string" ? n : n.title);
  return res;
}
