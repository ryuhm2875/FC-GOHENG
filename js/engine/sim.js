// 경기장 시뮬레이션: 22명과 공이 실제로 움직이며 경기를 만듭니다. 화면과 상관없는 순수 모듈.
// 같은 코드가 경기 화면(프레임을 기록해 그림)과 자동 진행(기록 없이 빠르게) 둘 다에서 돕니다.
// 좌표는 늘 우리 팀이 오른쪽(+x)으로 공격하는 기준 (105×68). 후반 진영 교체는 화면에서만 뒤집습니다.
// 난수는 rng.js만 씁니다 (같은 시드면 같은 경기).
import { rand, range, int, clamp } from "../rng.js";
import { PLAYS } from "../../data/match.js";

export const DT = 0.1;                      // 한 틱 (초)
export const RATE = 20;                     // 시뮬레이션 1초 = 경기 시간 20초
export const HALF_T = 35 * 60 / RATE;       // 전반 길이 (시뮬레이션 초)

const ROLES = { GK: ["GK"], DF: ["LB", "LCB", "RCB", "RB"], MF: ["LM", "LCM", "RCM", "RM"], FW: ["ST1", "ST2"] };
// 4-4-2. 자기 진영 기준 [수비 라인에서 앞으로 몇 m, 좌우 비율]. d 수비할 때, a 공격할 때
const FORM = {
  LB: { d: [0, -0.88], a: [20, -0.95] }, LCB: { d: [0, -0.3], a: [0, -0.42] }, RCB: { d: [0, 0.3], a: [0, 0.42] }, RB: { d: [0, 0.88], a: [14, 0.95] },
  LM: { d: [11, -0.92], a: [30, -0.6] }, LCM: { d: [11, -0.28], a: [11, -0.14] }, RCM: { d: [11, 0.28], a: [19, 0.2] }, RM: { d: [11, 0.92], a: [31, 0.88] },
  ST1: { d: [24, -0.2], a: [41, -0.14] }, ST2: { d: [22, 0.22], a: [38, 0.24] },
};
// 수비 블록 높이: [공에서 몇 m 뒤에 라인, 라인 최소, 라인 최대] (자기 골문에서 잰 거리)
const BLOCK = { low: [24, 9, 24], mid: [25, 16, 38], high: [21, 24, 50] };
const KICKOFF_X = { GK: 4, DF: 25, MF: 37, FW: 47 };
const JOG = 6.2, RUN = 7.4, SPRINT = 8.6, DRIB = 6.2;

// 대본 목표 (모양을 하나로 맞춰 두면 빨라짐)
const OV = (x, y, v, f = "") => ({ x, y, v, recv: f === "recv", carry: f === "carry", plan: f === "plan", keep: f === "keep", stage: f === "stage" });
const other = t => (t === "us" ? "them" : "us");
const dirOf = t => (t === "us" ? 1 : -1);
const ox = (t, x) => (t === "us" ? x : 105 - x);          // 그 팀 기준 x (늘 +x로 공격)
const oy = (t, y) => (t === "us" ? y : 68 - y);
const hyp = (a, b) => Math.sqrt(a * a + b * b);
const sig = x => 1 / (1 + Math.exp(-x));

// 그 팀 기준 좌표에서 이 자리에서 공을 가졌을 때의 위협 (골까지 가까울수록 큼)
function threat(ax, ay) {
  const dx = Math.max(0.5, 105 - ax), dy = Math.abs(34 - ay), d = hyp(dx, dy), c = dx / d;
  return 0.6 * Math.exp(-d / 10) * (0.3 + 0.7 * c * c) + 0.025 * Math.exp(-d / 40);
}
// 슈팅 기대 득점 (그 팀 기준 좌표)
export function xgAt(ax, ay) {
  const dx = Math.max(0.5, 105 - ax), dy = Math.abs(34 - ay), d = hyp(dx, dy);
  const cos = dx / d;
  return clamp(0.95 * Math.exp(-0.135 * d) * (0.3 + 0.7 * cos * cos), 0.004, 0.7);
}

// ── 만들기 ──
// cfg.players: [{ id, team, pos, name, number, me, st: { pass, shoot, drib, def, jump } }]
// cfg.str: { us, them } 팀 전력. cfg.style: { us, them } 성향 (press, block, long, cross, counter, keep, rough, ace)
export function createSim(cfg) {
  const P = cfg.players.map(p => {
    const [, pos, i] = p.id.split("-");
    const role = ROLES[pos][+i] || pos;
    return { id: p.id, team: p.team, pos: p.pos, name: p.name, number: p.number, me: !!p.me, st: { pass: 50, shoot: 50, drib: 50, def: 50, jump: 50, ...p.st },
      longShot: !!p.longShot, ace: !!p.ace, qMul: p.qMul || null, slot: p.slot ?? null, tune: p.tune || [0, 0, 0],   // tune: 세부 포지션 [공격, 수비] 앞뒤 조정, [2] 공격할 때 터치라인 쪽으로 (m)
      role, ri: RI[role], runner: ["ST1", "ST2", "LM", "RM"].includes(role), x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, v: JOG, ov: null, stun: 0, cool: 0,
      press: false, held: false, pressedAt: 0, eng: 0, waitT: 0,
      runUntil: 0, runTo: [0, 0], overlap: false, ovStay: 0, boxRun: false,   // 경기 중에 쓰는 값도 처음부터 만들어 둠 (객체 모양이 바뀌면 느려짐)
      ph: [rand() * 6.3, rand() * 6.3, rand() * 6.3, rand() * 6.3] };
  });
  const S = {
    P, t: 0, half: 1, ball: { x: 52.5, y: 34, z: 0, fl: null }, holder: null, poss: "us", last: null, lastTeam: "us",
    str: { ...cfg.str }, style: { us: {}, them: {}, ...cfg.style }, block: { us: "mid", them: "mid", ...(cfg.blocks || {}) },
    ev: [], rec: null, phase: "play", restart: null, decideAt: 0, script: [], scur: null, stage: null, noFoulUntil: 0,
    pass: null, chain: [], possT: { us: 0, them: 0 }, flow: 0, bias: null, gkHold: 0, stopped: false, kickTeam: "us",
    pickOnly: null, trace: null, traceEnd: false, onTick: null, lastRestart: null, deflect: null, wonAt: null, wonBy: null, lastClear: false, oneOn: null,
    shot: null, pending: null, clockOff: 0, tk: cfg.tk ?? 0.32, ik: cfg.ik ?? 0.8, prog: cfg.prog ?? 0.00045, dw: cfg.dw ?? 17, ft: cfg.ft ?? 1, brk0: cfg.brk ?? 1,
  };
  S.GK = P.filter(p => p.pos === "GK");
  kickoffSetup(S, "us", true);
  return S;
}
export const meOf = S => S.P.find(p => p.me) || null;
export const gkOf = (S, team) => S.P.find(p => p.team === team && p.pos === "GK");
export const minuteOf = S => Math.min(70, Math.floor(S.t * RATE / 60));

function emit(S, type, o = {}) { S.ev.push({ type, t: S.t, minute: minuteOf(S), ...o }); }

// ── 공 ──
function launch(S, x1, y1, { air = false, T, h, shot = false, kind = "pass", to = null, then = null } = {}) {
  const b = S.ball, d = hyp(x1 - b.x, y1 - b.y);
  const T0 = T ?? (shot ? 0.1 + d / 25 : air ? 0.35 + d / 26 : 0.12 + d / 15.5);
  b.fl = { x0: b.x, y0: b.y, x1, y1, T: Math.max(0.12, T0), u: 0, air, h: h ?? Math.min(8, 0.8 + d * 0.13), z0: b.z || 0, kind, to, then };
  S.holder = null;
  return b.fl.T;
}
function ballAt(S, u) {                   // 비행 중 u(0~1) 시점의 공 자리
  const f = S.ball.fl, e = f.air ? u : 1 - (1 - u) * (1 - u);
  return [f.x0 + (f.x1 - f.x0) * e, f.y0 + (f.y1 - f.y0) * e];
}
function moveBall(S) {
  const b = S.ball, f = b.fl;
  if (!f) {
    const h = S.holder;
    if (h) {                                 // 발밑에서 따라감
      const fx = clamp(h.x + dirOf(h.team) * 0.8, 0.3, 104.7), fy = h.y;
      const dx = fx - b.x, dy = fy - b.y, d = hyp(dx, dy);
      const step = Math.min(d, 40 * DT + (d < 2 ? d : 0));
      if (d > 0.001) { b.x += dx / d * step; b.y += dy / d * step; }
      b.z *= 0.4;
    } else if (b.roll) {                     // 흘러가는 공은 천천히 멈춤
      b.x += b.roll[0] * DT; b.y += b.roll[1] * DT;
      b.roll[0] *= 0.8; b.roll[1] *= 0.8;
      if (hyp(b.roll[0], b.roll[1]) < 0.3) b.roll = null;
    }
    return;
  }
  f.u = Math.min(1, f.u + DT / f.T);
  const [x, y] = ballAt(S, f.u);
  b.x = x; b.y = y;
  b.z = (f.air ? f.h * 4 * f.u * (1 - f.u) : 0) + f.z0 * Math.max(0, 1 - f.u * 3);
  if (f.u >= 1) {
    b.fl = null; b.z = 0;
    const cb = f.then; f.then = null;
    cb?.(S);
  }
}
function give(S, p) {
  if (S.trace) { const d = hyp(p.x - S.ball.x, p.y - S.ball.y); if (d > 3) S.trace.push({ t: S.t, k: "glide", p: p.name, d, scur: S.scur?.name || null }); }   // 점검용: 공이 멀리서 붙음
  S.holder = p; S.ball.fl = null; S.ball.roll = null; S.pending = null; p.held = false; p.pressedAt = 0;
  if (S.pickOnly === p) S.pickOnly = null;
  for (const q of S.P) if (q.ov && (q.ov.recv || q.ov.carry)) q.ov = null;
  if (S.poss !== p.team) { S.poss = p.team; S.chain = []; endPlan(S); S.wonAt = S.t; S.wonBy = p; }
  S.last = p; S.lastTeam = p.team;
  S.decideAt = S.t + (p.pos === "GK" ? range(0.7, 1.3) : range(0.25, 0.5));
}
function loose(S, vx = 0, vy = 0) { S.holder = null; S.ball.fl = null; S.ball.roll = vx || vy ? [vx, vy] : null; S.pending = null; for (const q of S.P) if (q.ov && (q.ov.recv || q.ov.carry)) q.ov = null; }

// ── 대형 ──
const ROLE_LIST = ["GK", "LB", "LCB", "RCB", "RB", "LM", "LCM", "RCM", "RM", "ST1", "ST2"];
const RI = Object.fromEntries(ROLE_LIST.map((r, i) => [r, i]));
const FA = ROLE_LIST.map(r => FORM[r]?.a || [0, 0]), FD = ROLE_LIST.map(r => FORM[r]?.d || [0, 0]);
const SH = { us: new Float64Array(22), them: new Float64Array(22) };
// 그 팀 기준 좌표로 역할마다 설 자리 (out[ri*2], out[ri*2+1])
function shape(S, team) {
  const out = SH[team];
  const att = S.poss === team;
  const bx = ox(team, S.ball.x), by = oy(team, S.ball.y);
  let line, W, cy;
  if (att) { line = clamp(bx - 31, 12, 58); W = 29; cy = 34 + (by - 34) * 0.15; }
  else {
    const B = BLOCK[S.block[team]] || BLOCK.mid;
    line = clamp(bx - B[0], B[1], Math.min(B[2], Math.max(B[1], bx - 4)));
    W = S.dw; cy = clamp(34 + (by - 34) * 0.55, 19, 49);
  }
  const stretch = att ? 1.05 : S.block[team] === "high" && bx > 70 ? 1.5 : 0.95;
  const F = att ? FA : FD;
  for (let i = 1; i < 11; i++) { out[i * 2] = line + F[i][0] * stretch; out[i * 2 + 1] = cy + F[i][1] * W; }
  if (att && bx > 78) {                     // 공이 상대 박스 근처면 문전과 박스 앞을 채움
    const fy = by < 34 ? 1 : -1;
    out[RI.ST1 * 2] = Math.max(out[RI.ST1 * 2], 95); out[RI.ST1 * 2 + 1] = 34 - fy * 3;
    out[RI.ST2 * 2] = Math.max(out[RI.ST2 * 2], 91.5); out[RI.ST2 * 2 + 1] = 34 + fy * 5;
    const fw = fy > 0 ? RI.RM : RI.LM;
    out[fw * 2] = Math.max(out[fw * 2], 88); out[fw * 2 + 1] = 34 + fy * 12;
    out[RI.RCM * 2] = Math.max(out[RI.RCM * 2], 80); out[RI.RCM * 2 + 1] = 34 + fy * 4;
  }
  if (att) { out[0] = clamp(line * 0.38, 4, 17); out[1] = 34 + (by - 34) * 0.15; }
  else { out[0] = clamp(3 + (bx - 25) * 0.06, 3, 8); out[1] = 34 + (by - 34) * 0.32; }
  return out;
}
// 공격 팀 기준 오프사이드 선: 상대 뒤에서 두 번째 선수, 공, 하프라인 중 가장 앞
function offLine(S, att) {
  let a = -1, b = -1;
  for (const p of S.P) { if (p.team === att) continue; const x = ox(att, p.x); if (x > a) { b = a; a = x; } else if (x > b) b = x; }
  return Math.max(b, ox(att, S.ball.x), 52.5);
}

function targets(S) {
  const att = S.poss || "us", def = other(att);
  const shA = shape(S, att), shD = shape(S, def);
  const off = offLine(S, att);
  const H = S.holder, c = S.t, P = S.P;
  const flying = S.ball.fl;
  const markOn = ox(def, S.ball.x) < 60;
  for (const p of P) {
    const A = p.team === att, sh = A ? shA : shD;
    let x = sh[p.ri * 2], y = sh[p.ri * 2 + 1];
    if (p.ri) { x += A ? p.tune[0] : p.tune[1]; if (A && p.tune[2]) y += (y < 34 ? -1 : 1) * p.tune[2]; }   // 세부 포지션: 수비형은 한 칸 아래, 공격형은 한 칸 위, 윙어는 공격할 때 더 넓게
    if (A && p.ri) {
      if (p.pos === "FW") x = Math.max(x, off - 3.5);                // 공격수는 상대 마지막 수비 라인에 붙어 섬
      else if (p.runner) x = Math.max(x, Math.min(off - 9, x + 12));
      if (p.runner) { const q = Math.max(0, Math.sin(c * 0.55 + p.ph[0] * 1.7)); x += q * q * 9; }   // 뒷공간으로 뛰어들었다 돌아옴
      x = Math.min(x, off - 0.6);
    }
    // 수비: 자기 진영에서는 가까운 상대 공격수 쪽으로 붙음 (골문 쪽에서)
    if (!A && p.ri && markOn) {
      let best = null, bd = 9;
      for (const q of P) if (q.team === att && q.ri) { const qx = ox(def, q.x), qy = oy(def, q.y), d = Math.abs(qx - x) + Math.abs(qy - y); if (d < bd) { bd = d; best = q; } }
      if (best) { const k = p.pos === "DF" ? 0.55 : 0.35; x += (ox(def, best.x) - 1.6 - x) * k; y += (oy(def, best.y) - y) * k; }
    }
    // 공격 팀의 공 없는 움직임 (팀 기준 좌표)
    if (A && p.ri && H && p !== H) {
      const hx = ox(att, H.x), hy = oy(att, H.y);
      // 오버래핑: 측면 미드필더가 상대 진영에서 공을 잡으면 같은 쪽 측면 수비가 바깥으로 올라감
      if ((p.role === "LB" && H.role === "LM") || (p.role === "RB" && H.role === "RM")) {
        if (hx > 48 && hx < 88) { x = Math.min(off - 1, hx + 9); y = hy < 34 ? 4 : 64; p.overlap = true; }
      } else p.overlap = false;
      // 공격수 내려오기: 빌드업 중이면 한 명이 받으러 내려옴
      if (p.role === "ST2" && S.plan?.build && hx < 55) { x = Math.min(x, hx + 16); y += (hy - y) * 0.3; }
      // 패스하고 움직이기 (원투)
      if (p.runUntil > c) { x = ox(att, p.runTo[0]); y = oy(att, p.runTo[1]); }
      // 측면 깊은 곳에서 공을 잡으면: 공격수는 니어·먼 쪽 포스트로, 반대쪽 중앙 미드필더는 페널티 지점으로 뛰어듦
      p.boxRun = false;
      if (hx > 76 && Math.abs(hy - 34) > 13 && H.pos !== "GK") {
        const nr = hy < 34 ? -1 : 1, far = (r => r === (nr < 0 ? "RCM" : "LCM"));
        const wingFar = p.tune[2] > 0 && ((p.role === "LM" && nr > 0) || (p.role === "RM" && nr < 0));   // 세부 포지션 윙어: 반대편 측면에서 공이 깊이 들어가면 먼 쪽 포스트로
        const slot = p.role === "ST1" ? [95.5, 34 + nr * 3.5] : p.role === "ST2" ? [96, 34 - nr * 6] : far(p.role) ? [88.5, 34 - nr * 1.5] : wingFar ? [92, 34 - nr * 9] : null;
        if (slot && p !== H) { x = Math.min(slot[0], off - 0.3); y = slot[1]; p.boxRun = true; }
      }
    }
    if (p.team !== "us") { x = 105 - x; y = 68 - y; }
    // 빈 공간 찾기: 공격 팀 선수 옆에 수비가 3.5m 안으로 붙으면 옆으로 빠져 패스 길을 엶
    if (A && p.ri && p !== H && !p.runUntil) {
      let nd = 3.5, ox2 = 0, oy2 = 0;
      for (const q of P) if (q.team !== att && q.ri) { const d = hyp(q.x - p.x, q.y - p.y); if (d < nd) { nd = d; ox2 = q.x; oy2 = q.y; } }
      if (nd < 3.5) { const ux = (p.x - ox2) / Math.max(0.5, nd), uy = (p.y - oy2) / Math.max(0.5, nd); x += ux * (3.5 - nd) * 1.2; y += uy * (3.5 - nd) * 1.2; }
    }
    if (p.runUntil && p.runUntil <= c) p.runUntil = 0;
    // 작은 흔들림 (숨 고르기 정도로만)
    const a = p.ri ? 0.35 : 0.15, f = p.ph;
    x += a * (1.6 * Math.sin(c * 0.33 + f[0]) + 0.7 * Math.sin(c * 0.87 + f[1]));
    y += a * (1.3 * Math.sin(c * 0.29 + f[2]) + 0.6 * Math.sin(c * 0.71 + f[3]));
    p.tx = clamp(x, 1.5, 103.5); p.ty = clamp(y, 1.5, 66.5); p.v = p.boxRun ? RUN + 0.8 : p.runUntil > c || p.overlap ? RUN : JOG; p.press = false;
  }
  // 공 가진 선수 주변의 지원: 가까운 동료 둘이 받을 자리로
  if (H && H.ri && !S.stage) {
    let m1 = null, m2 = null, d1 = 1e9, d2 = 1e9;
    for (const p of P) {
      if (p.team !== H.team || p === H || !p.ri || p.ov || p.boxRun) continue;
      const d = (p.x - H.x) ** 2 + (p.y - H.y) ** 2;
      if (d < d1) { m2 = m1; d2 = d1; m1 = p; d1 = d; } else if (d < d2) { m2 = p; d2 = d; }
    }
    const g = dirOf(H.team), sy = H.y < 34 ? 1 : -1;
    if (m1) { m1.tx = clamp(H.x + g * 9, 3, 102); m1.ty = clamp(H.y + sy * 9, 3, 65); m1.v = RUN; }
    if (m2) { m2.tx = clamp(H.x - g * 5, 3, 102); m2.ty = clamp(H.y + sy * 12, 3, 65); m2.v = RUN; }
  }
  // 압박: 공에 가장 가까운 수비가 나가고 두 번째가 뒤를 받침
  const pressR = S.style[def].press ? 28 : S.block[def] === "low" ? 17 : 22;
  const bpx = flying ? flying.x1 : S.ball.x, bpy = flying ? flying.y1 : S.ball.y;
  if (!S.stage && S.phase === "play") {
    let c1 = null, c2 = null, d1 = 1e9, d2 = 1e9, a1 = null, da = 1e9;
    for (const p of P) {
      if (!p.ri || p.ov) continue;
      const d = hyp(p.x - bpx, p.y - bpy);
      if (p.team === def) { if (p.stun > 0) continue; if (d < d1) { c2 = c1; d2 = d1; c1 = p; d1 = d; } else if (d < d2) { c2 = p; d2 = d; } }
      else if (d < da) { da = d; a1 = p; }
    }
    const g = -dirOf(def);
    if (c1 && (d1 < pressR || !H)) { c1.tx = bpx + g * (H ? 1.5 : 0); c1.ty = bpy + (34 - bpy) * 0.05; c1.v = d1 > 6 ? SPRINT : RUN; c1.press = true; }
    if (c2 && d2 < 15) { c2.tx = bpx + g * 6; c2.ty = bpy + (34 - bpy) * 0.3; c2.v = RUN; }
    // 흘러 있는 공: 공격 팀도 가장 가까운 선수가 달려감
    if (!H && !flying && a1) { a1.tx = S.ball.x; a1.ty = S.ball.y; a1.v = SPRINT; a1.press = true; }
  }
  // 골키퍼: 공이 박스 근처면 골문과 공 사이로
  for (const gk of S.GK) {
    if (gk.ov || gk === H) continue;
    const team = gk.team, bx = ox(team, S.ball.x), by = oy(team, S.ball.y);
    if (S.poss !== team && bx < 30) { const k = clamp((30 - bx) / 30, 0, 1); gk.tx = ox(team, clamp(2.5 + k * 3 + Math.max(0, 18 - bx) * 0.12, 1.5, 10)); gk.ty = oy(team, 34 + (by - 34) * (0.25 + 0.2 * k)); gk.v = RUN; }
  }
  // 안전장치: 경기 흐름 중(대본·장면 연출이 아닐 때) 지시 자리에 도착해 1.5초 넘게 머문 지시는 풂 (선수가 한자리에 묶이지 않게)
  const free = S.phase === "play" && !S.stage && !S.scur && !S.script.length;
  for (const p of P) {
    if (p.ov && free && p !== H && !p.ov.recv && !p.ov.carry) {
      p.ovStay = hyp(p.x - p.ov.x, p.y - p.ov.y) < 1 ? (p.ovStay || 0) + DT : 0;
      if (p.ovStay > 1.5) { p.ov = null; p.ovStay = 0; }
    } else p.ovStay = 0;
  }
  for (const p of P) { if (p.ov) { p.tx = p.ov.x; p.ty = p.ov.y; p.v = p.ov.v; } if (p.stun > 0 && p.v > 2.5) p.v = 2.5; }
  if (H && !H.ov) { const gH = dirOf(H.team); H.tx = clamp(H.x + gH * 1.2, 2, 103); H.ty = H.y; H.v = 1.6; }   // 판단 사이에도 멈춰 서지 않고 공을 살살 몰고 감
  // 서로 너무 붙지 않게
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[i], fa = a.press || a.ov || a === H || !a.ri;
    for (let j = i + 1; j < n; j++) {
      const b = P[j];
      let dx = b.tx - a.tx, dy = b.ty - a.ty;
      if (dx > 3.5 || dx < -3.5 || dy > 3.5 || dy < -3.5) continue;
      const fb = b.press || b.ov || b === H || !b.ri;
      if (fa && fb) continue;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d >= 3.5) continue;
      if (d < 0.01) { dx = 0; dy = 1; d = 1; }
      const k = (3.5 - d) / d, ka = fa ? 0 : fb ? 1 : 0.5, kb = fb ? 0 : fa ? 1 : 0.5;
      a.tx -= dx * k * ka; a.ty -= dy * k * ka; b.tx += dx * k * kb; b.ty += dy * k * kb;
    }
  }
}
function movePlayers(S) {
  const ACC = 16 * DT;
  for (const p of S.P) {
    if (p.stun > 0) p.stun -= DT;
    const dx = p.tx - p.x, dy = p.ty - p.y, d = hyp(dx, dy);
    const v = d < 0.05 ? 0 : Math.min(p.v, d * 2.2);
    const wx = d < 0.05 ? 0 : dx / d * v, wy = d < 0.05 ? 0 : dy / d * v;
    let ax = wx - p.vx, ay = wy - p.vy; const am = hyp(ax, ay);
    const acc = p.ov && p.ov.v >= 11 ? ACC * 2 : ACC;
    if (am > acc) { ax *= acc / am; ay *= acc / am; }
    p.vx += ax; p.vy += ay;
    let mx = p.vx * DT, my = p.vy * DT;
    if (hyp(mx, my) > d && d < 0.5) { mx = dx; my = dy; p.vx *= 0.5; p.vy *= 0.5; }
    p.x = clamp(p.x + mx, -1, 106); p.y = clamp(p.y + my, -1, 69);
  }
  // 서로 비켜서기: 두 선수가 1.2m 안으로 붙으면 조금씩 떨어뜨림 (화면에서 점 두 개가 하나로 겹치지 않게)
  const P = S.P, n = P.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy);
    if (d >= SEP) continue;
    const ux = d > 1e-3 ? dx / d : (i % 2 ? 1 : -1), uy = d > 1e-3 ? dy / d : 0.3;
    const push = Math.min(0.12, (SEP - d) * 0.3);       // 한 틱에 최대 12cm (초속 1.2m): 미끄러지듯 자연스럽게
    a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
  }
}
const SEP = 1.2;

// ── 판단 ──
// 패스 길에서 가로채일 확률 (실제로 차기 전 판단에도, 찬 순간 결과를 정할 때도 같은 계산)
function laneRisk(S, from, to, tp, air) {
  const b = S.ball, d = hyp(tp[0] - b.x, tp[1] - b.y);
  const T = air ? 0.35 + d / 26 : 0.12 + d / 15.5;
  const opp = other(from.team);
  const passQ = from.st.pass, list = [];
  let keep = 1;
  for (const o of S.P) {
    if (o.team !== opp) continue;
    if (o.pos === "GK" && !(ox(from.team, tp[0]) > 93 && Math.abs(tp[1] - 34) < 12)) continue;
    let s = ((o.x - b.x) * (tp[0] - b.x) + (o.y - b.y) * (tp[1] - b.y)) / Math.max(1, d * d);
    s = clamp(s, 0.05, 1);
    if (air && s < 0.85) continue;
    const lx = b.x + (tp[0] - b.x) * s, ly = b.y + (tp[1] - b.y) * s;
    const dl = hyp(o.x - lx, o.y - ly);
    const tb = 0.1 + s * T;
    const to_ = Math.max(0, dl - (o.pos === "GK" ? 1.6 : 0.9)) / 7.6 + 0.22 + (o.stun > 0 ? 0.4 : 0);
    let pi = sig((tb - to_) * 5) * (air ? 0.5 : S.ik) * Math.exp((o.st.def - passQ) / 70) * (ox(from.team, lx) > 70 ? S.ft : 1);
    if (s > 0.92 && to) { const tr = hyp(to.x - tp[0], to.y - tp[1]) / 7.6; pi *= clamp(1.4 - (to_ - tr) * 1.5, 0.3, 1.4); }
    pi = clamp(pi, 0, 0.92);
    if (pi > 0.01) { list.push([o, pi, [lx, ly], s]); keep *= 1 - pi; }
  }
  if (air && to) {                          // 공중볼은 떨어지는 자리에서 경합: 받는 선수보다 수비가 가까우면 손해
    let dD = 99; for (const o of S.P) if (o.team === opp && o.ri) dD = Math.min(dD, hyp(o.x - tp[0], o.y - tp[1]));
    const dR = hyp(to.x - tp[0], to.y - tp[1]);
    keep *= clamp(0.5 + (dD - dR) / 8, 0.15, 0.92);
  }
  return { risk: 1 - keep, list, T };
}

// 공 가진 선수의 판단: 슈팅 / 패스 / 드리블 / 걷어 내기
// 값 = 공을 지킨 채 그 자리에 있을 때의 위협(+기본 소유 가치), 잃으면 상대가 그 자리에서 갖는 위협만큼 손해
const keepV = (ax, ay) => threat(ax, ay) + 0.012;
const lossV = (ax, ay) => threat(105 - ax, 68 - ay) + 0.012;
// 골키퍼와 1 대 1: 공 가진 선수 앞(골문 쪽)에 수비가 없음
function oneOnOne(S, H) {
  if (H.pos === "GK" || H.me && S.bias?.me) return false;
  const team = H.team, hx = ox(team, H.x), hy = oy(team, H.y);
  if (hx < 72 || hx > 100 || Math.abs(hy - 34) > 15) return false;                                  // 측면 끝에서는 1 대 1이 아님 (각이 없음)
  for (const o of S.P) {
    if (o.team === team || !o.ri || o.pos === "GK") continue;
    const dx = ox(team, o.x) - hx, dy = Math.abs(oy(team, o.y) - hy);
    if (dx > -1.5 && dy < dx * 0.55 + 3 && hyp(dx, dy) < 26) return false;
  }
  return true;
}
// 1 대 1 처리: 골키퍼가 각을 좁히며 나오고, 공격수는 일찍 차거나·골키퍼를 제치거나·칩슛
function oneOnOneAct(S, H) {
  const team = H.team, g = dirOf(team), gk = gkOf(S, other(team));
  if (!gk) return false;
  const hx = ox(team, H.x), hy = oy(team, H.y), dGoal = hyp(105 - hx, 34 - hy);
  if (S.oneOn !== H) { S.oneOn = H; emit(S, "gkOut", { gk: gk.name, by: H.name, team, me: H.me }); }
  const gx = team === "us" ? 105 : 0, k = clamp(0.45 - dGoal / 120, 0.22, 0.42);
  if (!(gk.stun > 0)) gk.ov = OV(gx + (H.x - gx) * k, 34 + (H.y - 34) * k, RUN + 0.6, "recv");    // 각을 좁히며 나옴
  const dk = hyp(gk.x - H.x, gk.y - H.y), gkOut = Math.abs(ox(team, gk.x) - 105) > 5;
  if (gk.stun > 0 && dGoal < 20) { shoot(S, H, {}); return true; }                                 // 골키퍼를 제쳤으면 빈 골문으로
  if (dk < 6.5 && !(gk.stun > 0) && hx < 99) {
    if (rand() < 0.3 + (H.st.drib - 50) / 140) {                                                    // 골키퍼까지 제침
      const side = hy < 34 ? 1 : -1;
      H.ov = OV(clamp(H.x + g * 4, 2, 103), clamp(H.y + side * 5.5, 3, 65), DRIB + 1, "carry");
      gk.stun = 1.3; gk.ov = OV(gk.x, gk.y + (H.y < gk.y ? -1 : 1) * 1.2, 2, "recv");
      emit(S, "roundGK", { by: H.name, team, me: H.me });
      S.decideAt = S.t + 0.55; return true;
    }
    shoot(S, H, {}); return true;
  }
  if (gkOut && dGoal > 10 && dGoal < 26 && dk > 4.5 && rand() < 0.18) { shoot(S, H, { kind: "chip" }); return true; }   // 나와 있는 골키퍼 머리 위로
  if (dGoal <= 12) { shoot(S, H, {}); return true; }
  H.ov = OV(clamp(H.x + g * 6, 2, 103), clamp(H.y + (34 - H.y) * 0.3, 3, 65), DRIB + 0.8, "carry");   // 골문 쪽으로 몰고 감
  S.decideAt = S.t + 0.3; return true;
}
function decide(S) {
  const H = S.holder; if (!H) return;
  if (oneOnOne(S, H) && oneOnOneAct(S, H)) return;
  if (S.oneOn && S.oneOn !== H) S.oneOn = null;
  if (!S.plan || S.plan.team !== H.team) newPlan(S, H);
  if (S.plan && !S.plan.recycle && planDecide(S, H)) return;
  if (S.plan?.recycle && (S.t >= S.plan.until || (S.plan.build && (S.plan.done >= S.plan.need || ox(H.team, H.x) > 60)))) {   // 빌드업이 끝나면(패스 몇 번 또는 상대 진영) 공격 시작
    endPlan(S); newPlan(S, H, true); if (S.plan && !S.plan.recycle && planDecide(S, H)) return;
  }
  const team = H.team, g = dirOf(team), foe = other(team);
  const hx = ox(team, H.x), hy = oy(team, H.y);
  let near = 99, nearO = null;
  for (const o of S.P) if (o.team === foe && o.ri) { const d = hyp(o.x - H.x, o.y - H.y); if (d < near) { near = d; nearO = o; } }
  const st = S.style[team] || {};
  const noise = () => Math.exp((rand() - 0.5) * 0.7);
  const opts = [];
  const here = keepV(hx, hy), lose = lossV(hx, hy);

  if (H.pos === "GK") {                     // 골키퍼: 짧게 수비수에게, 아니면 길게
    for (const r of S.P) {
      if (r.team !== team || !r.ri) continue;
      const long = r.pos !== "DF";
      const tp = [clamp(r.x + g * (long ? 2 : 0), 2, 103), r.y], lr = laneRisk(S, H, r, tp, long);
      const v = keepV(ox(team, tp[0]), oy(team, tp[1])) * (long ? (st.long ? 0.6 : 0.35) : 1);
      opts.push({ k: "pass", r, tp, air: long, u: Math.max(0, (1 - lr.risk) * v - lr.risk * lossV(ox(team, tp[0]), oy(team, tp[1]))) * noise() });
    }
  } else {
    // 슈팅 (공격 3분의 1 지역에서만. 중거리는 성향이 있을 때만 가끔)
    const dGoal = hyp(105 - hx, 34 - hy);
    if (hx >= 70 && dGoal < 30 && (dGoal <= 21 || (H.longShot && rand() < 0.35))) {
      const q = xgAt(hx, hy) * (near < 1.6 ? 0.55 : near < 3 ? 0.8 : 1);
      opts.push({ k: "shoot", u: (q * 1.5 + 0.02) * noise() * (S.shootMul?.[team] ?? 1) });
    }
    // 패스
    const off = offLine(S, team);
    for (const r of S.P) {
      if (r.team !== team || r === H || !r.ri) continue;
      const lead = r.ov?.recv ? 0 : 0.45;
      const tp = [clamp(r.x + r.vx * lead + g * (r.pos === "FW" ? 1.5 : 0.5), 2, 103), clamp(r.y + r.vy * lead, 2, 66)];
      const rx = ox(team, tp[0]), ry = oy(team, tp[1]);
      const dist = hyp(tp[0] - H.x, tp[1] - H.y);
      const build = S.plan?.build && S.plan.team === team;
      if (dist < 4 || dist > (build ? 26 : st.long ? 50 : 40)) continue;
      const wide = hx > 78 && Math.abs(hy - 34) > 12 && rx > 86 && Math.abs(ry - 34) < 12;
      const air = wide || dist > 32;
      const lr = laneRisk(S, H, r, tp, air);
      const offside = ox(team, r.x) > off + 0.3 && rx > 52.5;
      let v = keepV(rx, ry);
      if (wide) v = 0.17 * Math.exp((r.st.jump - 50) / 60) * (st.cross ? 1.3 : 1);          // 크로스: 문전 경합
      const mid = lossV((hx + rx) / 2, (hy + ry) / 2);
      let free = 99; for (const o of S.P) if (o.team === foe && o.ri) free = Math.min(free, hyp(o.x - tp[0], o.y - tp[1]));
      v += clamp(free - 2, 0, 6) * 0.0012;                                                 // 받을 자리에 여유가 있으면 더 좋음
      let u = (1 - lr.risk) * (v + clamp(rx - hx, -15, 30) * S.prog) - lr.risk * mid;
      if (offside) u = Math.min(u, 0) - 0.01;
      if (air && !wide) u *= st.long ? 0.6 : 0.4;
      if (r === S.chain[S.chain.length - 1]) u *= 0.75;                                       // 방금 준 선수에게 바로 돌려주는 건 덜
      if (st.keep && !air) u *= 1.1;
      if (st.ace && r.ace) u *= 1.5;
      if (build) { if (air) continue; u = (1 - lr.risk) * (keepV(rx, ry) + clamp(rx - hx, -10, 20) * S.prog * 0.5 + 0.006) - lr.risk * mid * 1.4; }   // 빌드업: 안전한 짧은 패스
      if (r.runUntil > S.t && free > 3) u *= 1.35;                                           // 패스하고 뛰어든 선수 (원투)
      if (r.me && S.bias?.me) u = u > 0 ? u * S.bias.me : u;
      opts.push({ k: "pass", r, tp, air, cross: wide, u: (u > 0 ? u * noise() : u), risk: lr.risk });
      // 침투 패스: 뛰어드는 선수 앞 빈 공간으로
      if ((r.runner || r.pos === "FW" || r.runUntil > S.t) && !build && !offside && ox(team, r.x) > 55 && ox(team, r.x) > hx - 5) {
        for (const L of [7, 12]) {
          const sp = [clamp(r.x + g * L, 3, 102), clamp(r.y + (34 - r.y) * 0.15, 3, 65)];
          const sx = ox(team, sp[0]), sy = oy(team, sp[1]);
          if (sx > 101) continue;
          const d2 = hyp(sp[0] - H.x, sp[1] - H.y);
          if (d2 > 48) continue;
          const air2 = d2 > 30;
          const lr2 = laneRisk(S, H, r, sp, air2);
          let u2 = (1 - lr2.risk) * (keepV(sx, sy) + clamp(sx - hx, -15, 30) * S.prog) - lr2.risk * lossV((hx + sx) / 2, (hy + sy) / 2);
          u2 *= (S.style[team]?.counter ? 1.15 : 1) * (air2 ? 0.45 : 1);
          if (r.me && S.bias?.me) u2 = u2 > 0 ? u2 * S.bias.me : u2;
          opts.push({ k: "pass", r, tp: sp, air: air2, through: true, space: true, u: u2 > 0 ? u2 * noise() : u2, risk: lr2.risk });
        }
      }
    }
    // 드리블: 앞에 공간이 있으면 몰고 나감, 수비가 막고 있으면 제치기
    // 앞으로 7m. 박스 근처에서는 골문 쪽으로 파고듦
    const wing = Math.abs(hy - 34) > 14 && hx < 94;                                            // 측면에서는 터치라인을 따라 끝까지
    const k = wing ? 0 : clamp((hx - 72) / 22, 0, 1), gxT = ox(team, 99), dxT = gxT - H.x, dyT = 34 - H.y, dT = hyp(dxT, dyT) || 1;
    const ux = (1 - k) * g + k * dxT / dT, uy = (1 - k) * (34 - H.y) * 0.004 + k * dyT / dT, un = hyp(ux, uy) || 1;
    const ahead = [clamp(H.x + ux / un * 7, 2, 103), clamp(H.y + uy / un * 7, 3, 65)];
    let block = 0, front = false;
    for (const o of S.P) {
      if (o.team !== foe || !o.ri) continue;
      const d = hyp(o.x - ahead[0], o.y - ahead[1]); if (d < 6) block += (6 - d) / 6;
      if (hyp(o.x - H.x, o.y - H.y) < 3.5 && (o.x - H.x) * g > -0.5) front = true;
    }
    const va = keepV(ox(team, ahead[0]), oy(team, ahead[1])) + 7 * S.prog;
    let carryU;
    if (front || block > 0.6) {
      const pT = clamp(S.tk + 0.06 + ((nearO?.st.def ?? 50) - H.st.drib) / 85, 0.1, 0.8);
      carryU = (1 - pT) * va - pT * lose * 0.9;
    } else carryU = va * (1 - Math.min(0.5, block * 0.25)) * (near < 6 ? 0.75 : 1);
    if (st.counter && S.chain.length < 3) carryU *= 1.15;
    if (near > 7 && !front && block < 0.3) carryU *= 1.25;                                   // 앞이 비었으면 몰고 나감
    if (S.plan?.build && near > 6 && hx < 55) carryU *= 1.15;                                 // 빌드업 중 압박이 없으면 몰고 올라감
    if (S.plan?.build && near < 4 && carryU > 0) carryU *= 0.3 + Math.max(0, (H.st.drib - 55) / 100);   // 빌드업 중 압박이 오면 혼자 끌지 않고 짧게 내줌 (드리블 좋은 선수만 가끔 벗겨 냄)
    if ((H.pos === "FW" || H.role === "LM" || H.role === "RM") && hx > 62 && front) carryU *= 1 + (H.st.drib - 50) / 120;   // 공격 3분의 1: 드리블 좋은 선수는 제치기를 더 시도
    if (hx > 70 && carryU > 0) carryU *= near < 5 ? 0.55 : 0.8;                            // 박스 근처에서 계속 끌면 막힘
    opts.push({ k: "carry", tp: ahead, u: carryU > 0 ? carryU * noise() : carryU });
    // 걷어 내기: 자기 박스 근처에서 압박받으면
    if (hx < 25 && near < 3.5) opts.push({ k: "clear", u: 0.01 * noise() });
    // 공 지키기 (잠깐 기다림)
    if (!H.held) opts.push({ k: "hold", u: near < 2.5 ? here * 0.5 - lose * 0.35 : here * 0.85 * noise() });
  }
  let best = opts[0];
  for (const o of opts) if (o.u > best.u) best = o;
  if (S.dbg) { const k = (S.plan?.build ? "B_" + (near < 3 ? "압박_" : "") : "") + (hx > 70 ? "F_" : "") + best.k + (H.pos === "GK" ? "GK" : "") + (best.air ? "A" : "") + (best.through ? "T" : "") + (best.k === "pass" && best.r && ox(team, best.tp[0]) < hx - 3 ? "back" : ""); S.dbg[k] = (S.dbg[k] || 0) + 1; }
  act(S, H, best);
}
function avgDef(S, team) { let s = 0, n = 0; for (const p of S.P) if (p.team === team && p.pos !== "GK") { s += p.st.def; n++; } return n ? s / n : 50; }

function act(S, H, o) {
  const g = dirOf(H.team);
  if (o.k === "shoot") return shoot(S, H, {});
  if (o.k === "pass") return passTo(S, H, o.r, o.tp, { air: o.air, cross: o.cross, space: !!o.space });
  if (o.k === "carry") {
    H.ov = OV(o.tp[0], o.tp[1], DRIB + (H.st.drib - 50) / 60, "carry");
    S.decideAt = S.t + range(0.5, 0.9);
    return;
  }
  if (o.k === "clear") {
    const tx = clamp(H.x + g * range(35, 50), 3, 102), ty = clamp(H.y + range(-18, 18), 2, 66);
    emit(S, "clear", { by: H.name, team: H.team, me: H.me, x: ox(H.team, H.x) });
    launch(S, tx, ty, { air: true, h: 9, kind: "clear", then: S2 => landLoose(S2) });
    S.last = H; S.lastTeam = H.team;
    return;
  }
  // 공 지키기: 제자리에 서 있지 않고 가장 가까운 상대 반대쪽으로 몸을 돌려 비켜섬
  let nx = 0, ny = 0, nd = 99;
  for (const q of S.P) if (q.team !== H.team && q.ri) { const d = hyp(q.x - H.x, q.y - H.y); if (d < nd) { nd = d; nx = q.x; ny = q.y; } }
  if (nd < 8) { const ux = (H.x - nx) / Math.max(0.5, nd), uy = (H.y - ny) / Math.max(0.5, nd); H.ov = OV(clamp(H.x + ux * 2.5 + g * 0.6, 3, 102), clamp(H.y + uy * 2.5, 3, 65), 2.6, "carry"); }
  else H.ov = OV(clamp(H.x + g * 2.5, 3, 102), H.y, 3.2, "carry");
  H.held = true; S.decideAt = S.t + range(0.3, 0.6);
}

// 패스 실행: 찬 순간 결과(성공·가로채기·빗나감·오프사이드)를 정하고 공을 보냄
export function passTo(S, H, r, tp, { air = false, cross = false, force = false, kind, noOff = false, step = null, space = false } = {}) {
  const team = H.team;
  const d = hyp(tp[0] - S.ball.x, tp[1] - S.ball.y);
  const offside = !force && !noOff && ox(team, r.x) > offLine(S, team) + 0.3 && ox(team, tp[0]) > 52.5;
  const lr = laneRisk(S, H, r, tp, air);
  const pk = kind || (cross ? "cross" : air ? (d > 40 ? "long" : "air") : (ox(team, tp[0]) - ox(team, H.x) > 14 && ox(team, tp[0]) > 60 ? "through" : "ground"));
  emit(S, "pass", { from: H.name, to: r.name, team, kind: pk, fx: ox(team, H.x), fy: oy(team, H.y), tx: ox(team, tp[0]), ty: oy(team, tp[1]), me: H.me, toMe: r.me });
  if (S.plan?.build && S.plan.team === team) S.plan.done++;
  // 패스하고 움직이기: 준 선수는 앞쪽 빈 공간으로 뛰어 다시 받을 준비 (원투). 수비·골키퍼는 빼고
  if (!force && H.pos !== "GK" && H.pos !== "DF" && ox(team, H.x) > 30 && ox(team, H.x) < 88 && rand() < 0.6) {
    const g = dirOf(team), side = Math.abs(r.y - H.y) > 2 ? Math.sign(H.y - r.y) * 0 : (H.y < 34 ? 1 : -1);
    H.runUntil = S.t + range(1.3, 2.0);
    H.runTo[0] = clamp(r.x + g * range(7, 11), 3, 102); H.runTo[1] = clamp(H.y + (r.y - H.y) * 0.3 + side * 3, 4, 64);
  }
  S.last = H; S.lastTeam = team;
  S.chain.push(H);
  H.ov = null;
  const err = force ? 0 : clamp(0.035 + (55 - H.st.pass) / 650 + (air ? 0.04 : 0), 0.01, 0.12) * (step != null ? 0.5 : 1)
    * (S.plan?.build && S.plan.team === team && !air && d < 20 ? 0.5 : 1);                 // 빌드업의 짧은 패스는 실수가 적음
  let roll = rand();
  if (roll < err) {                                    // 빗나간 패스: 엉뚱한 곳으로 흘러감
    const ex = clamp(tp[0] + range(-7, 7), -2, 107), ey = clamp(tp[1] + range(-7, 7), -2, 70);
    launch(S, ex, ey, { air, kind: "pass", then: S2 => landLoose(S2) });
    r.ov = OV(ex, ey, SPRINT, "recv");
    return;
  }
  roll = rand();
  const brk = step != null ? (S.brk?.[team] ?? S.brk0) * (team === "them" && S.bias?.them ? 0.5 : 1) : 1;
  if (!force && roll < Math.min(0.95, lr.risk * brk) && lr.list.length) {     // 가로채기
    let w = rand() * lr.list.reduce((a, x) => a + x[1], 0), pick = lr.list[0];
    for (const x of lr.list) { if ((w -= x[1]) <= 0) { pick = x; break; } }
    const [o, , pt, s] = pick;
    const T = 0.1 + s * lr.T;
    launch(S, pt[0], pt[1], { air: air && s > 0.85, T, kind: "pass", then: S2 => {
      if (hyp(o.x - pt[0], o.y - pt[1]) < 2.8) { emit(S2, air ? "header" : "intercept", { by: o.name, team: o.team, from: H.name, r: r.name, me: o.me, x: pt[0] });
        if (air && o.pos !== "GK") { const g2 = dirOf(o.team); launch(S2, clamp(pt[0] + g2 * range(14, 26), 2, 103), clamp(pt[1] + range(-12, 12), 2, 66), { air: true, h: 5, kind: "clear", then: S3 => landLoose(S3) }); S2.last = o; S2.lastTeam = o.team; }
        else { give(S2, o); if (o.pos === "GK") emit(S2, "claim", { by: o.name, team: o.team }); } }
      else landLoose(S2);
    } });
    o.ov = OV(pt[0], pt[1], 9, "recv");
    r.ov = OV(tp[0], tp[1], RUN, "recv");
    return;
  }
  if (S.plan && S.plan.team === team) S.plan.expect = step != null ? { r, i: step } : null;
  let chaser = null;
  if (space) {                                          // 수비 뒤 공간: 가장 가까운 수비가 반 박자 늦게 쫓아감
    chaser = S.P.filter(p => p.team !== team && p.ri && p.pos !== "GK" && !(p.stun > 0)).sort((a, b) => hyp(a.x - tp[0], a.y - tp[1]) - hyp(b.x - tp[0], b.y - tp[1]))[0] || null;
    if (chaser) chaser.ov = OV(tp[0] - dirOf(team) * 2.4, tp[1] + (chaser.y < tp[1] ? -1.3 : 1.3), 7.5, "recv");
  }
  const T = launch(S, tp[0], tp[1], { air, kind: "pass", h: cross ? 3.2 : air && space ? Math.min(9, 2.5 + d * 0.12) : undefined, then: S2 => arrive(S2, r, H, pk, offside, space ? chaser?.name || "" : null) });
  if (space && S.ball.fl) { const need = hyp(r.x - tp[0], r.y - tp[1]) / 8.4 + 0.1; if (S.ball.fl.T < need) S.ball.fl.T = need; }
  const need = hyp(r.x - tp[0], r.y - tp[1]) / Math.max(0.2, S.ball.fl?.T ?? T);
  r.ov = OV(tp[0] - dirOf(team) * 0.6, tp[1], clamp(Math.max(space ? SPRINT : RUN, need * 1.05), RUN, 9.5), "recv");
  if (cross) { let n = 0; for (const p of S.P) if (p.team === team && p !== H && p.ri && (p.boxRun || ox(team, p.x) > 86)) n++; if (n >= 2) emit(S, "boxRun", { by: H.name, team, n, me: H.me }); }
}
function arrive(S, r, from, kind, offside, space = null) {
  const b = S.ball;
  if (offside && hyp(r.x - b.x, r.y - b.y) < 4) {
    emit(S, "offside", { r: r.name, team: r.team, me: r.me });
    return setRestart(S, "fk", other(r.team), b.x, b.y);
  }
  // 공중볼: 문전 경합 (헤더, 골키퍼, 수비가 걷어 냄)
  if (kind === "cross" || kind === "air" || kind === "long") {
    const def = other(r.team);
    const gk = gkOf(S, def);
    const inBox = ox(r.team, b.x) > 88.5 && Math.abs(b.y - 34) < 20;
    if (gk && inBox && hyp(gk.x - b.x, gk.y - b.y) < 3.2 && ox(r.team, b.x) > 94 && rand() < 0.55) { emit(S, "claim", { by: gk.name, team: def }); return give(S, gk); }   // 골키퍼가 손 닿는 거리일 때만 (멀리서 공이 미끄러져 붙지 않게)
    const ds = S.P.filter(p => p.team === def && p.pos !== "GK" && hyp(p.x - b.x, p.y - b.y) < 3.2);
    const rd = hyp(r.x - b.x, r.y - b.y);
    if (space != null && rd < 3.4) { give(S, r); emit(S, "recv", { p: r.name, team: r.team, from: from.name, kind, me: r.me, x: b.x, y: b.y, air: true, behind: true, chaser: space || null }); planRecv(S, r); return; }
    if (rd > 3.4 && !ds.length) { if (S.dbg) S.dbg["missA_" + kind] = (S.dbg["missA_" + kind] || 0) + 1; return landLoose(S); }
    let pAtt = rd > 3.4 ? 0 : ds.length ? clamp(0.5 + (r.st.jump - Math.max(...ds.map(d => d.st.jump))) / 70 - (ds.length - 1) * 0.12, 0.12, 0.85) : 0.92;
    if (S.dbg) S.dbg["duelA_" + kind] = (S.dbg["duelA_" + kind] || 0) + 1;
    if (rand() < pAtt) {
      if (inBox && ox(r.team, b.x) > 90 && kind !== "long" && !(r.me && S.bias?.me)) { planRecv(S, r, true); return shoot(S, r, { kind: "head", assist: from }); }   // 내 장면을 기다릴 때는 내가 받고 멈춤
      give(S, r); emit(S, "recv", { p: r.name, team: r.team, from: from.name, kind, me: r.me, x: b.x, y: b.y, air: true, behind: space != null, chaser: space || null }); planRecv(S, r);
      return;
    }
    const d = ds.sort((a, b2) => hyp(a.x - b.x, a.y - b.y) - hyp(b2.x - b.x, b2.y - b.y))[0];
    if (!d) return landLoose(S);
    emit(S, "header", { by: d.name, team: d.team, me: d.me, from: from.name, r: r.name, x: b.x });
    S.last = d; S.lastTeam = d.team;
    const g = dirOf(d.team);
    const mate = ox(d.team, b.x) > 30 && rand() < 0.5 ? S.P.filter(p => p.team === d.team && p !== d && p.ri && hyp(p.x - b.x, p.y - b.y) < 16).sort((p, q) => hyp(p.x - b.x, p.y - b.y) - hyp(q.x - b.x, q.y - b.y))[0] : null;
    if (mate) { S.poss = d.team; S.chain = []; return passTo(S, d, mate, [mate.x, mate.y], { air: true, force: true, kind: "head" }); }
    launch(S, clamp(b.x + g * range(12, 24), 2, 103), clamp(b.y + range(-14, 14), 1, 67), { air: true, h: 5, kind: "clear", then: S2 => landLoose(S2) });
    return;
  }
  if (hyp(r.x - b.x, r.y - b.y) < 2.6) { give(S, r); emit(S, "recv", { p: r.name, team: r.team, from: from.name, kind, me: r.me, x: b.x, y: b.y, overlap: !!r.overlap, ax: ox(r.team, b.x), behind: space != null, chaser: space || null }); planRecv(S, r); }
  else { if (S.dbg) S.dbg["miss_" + kind] = (S.dbg["miss_" + kind] || 0) + 1; landLoose(S); }
}
// 장면 연출용: from이 찬 땅볼이 (x, y)에 멈춤 (받는 선수 없음, 마지막 터치는 from)
export function kickLoose(S, from, x, y, T) {
  S.last = from; S.lastTeam = from.team; S.holder = null; from.ov = null;
  emit(S, "pass", { from: from.name, to: "", team: from.team, kind: "through", me: from.me, toMe: false, silent: true });
  launch(S, clamp(x, 1, 104), clamp(y, 1, 67), { T, kind: "pass", then: S2 => landLoose(S2) });
}
// 공이 땅에 떨어짐: 밖이면 경기 재개, 아니면 흘러 있는 공
function landLoose(S) {
  const b = S.ball;
  for (const q of S.P) if (q.ov && (q.ov.recv || q.ov.carry)) q.ov = null;
  if (outCheck(S)) return;
  S.holder = null; b.roll = null;
}
function outCheck(S) {
  const b = S.ball;
  if (b.x > 0 && b.x < 105 && b.y > 0 && b.y < 68) return false;
  const lastTeam = S.lastTeam || "us";
  if (b.y <= 0 || b.y >= 68) {
    emit(S, "out", { kind: "throw", team: other(lastTeam), by: S.last?.name, byTeam: lastTeam });
    setRestart(S, "throw", other(lastTeam), clamp(b.x, 1, 104), b.y <= 0 ? 0.3 : 67.7);
    return true;
  }
  const atkGoalOf = b.x >= 105 ? "us" : "them";            // 이 골라인을 공격하는 팀
  if (lastTeam === atkGoalOf) { emit(S, "out", { kind: "goalkick", team: other(atkGoalOf), by: S.last?.name, byTeam: lastTeam }); setRestart(S, "goalkick", other(atkGoalOf)); }
  else { emit(S, "out", { kind: "corner", team: atkGoalOf, by: S.last?.name, byTeam: lastTeam, cause: S.deflect && S.t - S.deflect.t < 4 ? S.deflect.kind : S.last?.pos === "GK" ? "save" : "clear" }); S.deflect = null; setRestart(S, "corner", atkGoalOf, b.x >= 105 ? 104.3 : 0.7, b.y < 34 ? 0.7 : 67.3); }
  return true;
}

// ── 슈팅 ──
// 결과는 찬 순간 정함 (opts.result로 정해서 넣을 수도 있음: 내 장면 선택 결과)
export function shoot(S, H, opts = {}) {
  const team = H.team, def = other(team);
  const hx = ox(team, H.x), hy = oy(team, H.y);
  const kind = opts.kind || (hyp(105 - hx, 34 - hy) > 21 ? "long" : "shot");
  let result = opts.result;
  let q = 0;
  if (!result) {
    const near = S.P.filter(p => p.team === def && p.pos !== "GK").reduce((m, o) => Math.min(m, hyp(o.x - H.x, o.y - H.y)), 99);
    q = xgAt(hx, hy) * (near < 1.5 ? 0.6 : near < 3 ? 0.82 : 1) * (kind === "head" ? 0.75 : kind === "chip" ? 1.6 : 1);
    q *= Math.exp(((H.st.shoot ?? 50) - (S.str[team] || 50)) / 40);
    q *= 1 + (team === "us" ? 1 : -1) * (S.flow || 0) * 0.3;
    if (H.qMul) q *= H.qMul(kind);
    q = clamp(q * (S.conv?.[team] ?? 1), 0.005, 0.8);
    const gk0 = gkOf(S, def); if (gk0 && gk0.stun > 0) q = Math.max(q, 0.35);                       // 골키퍼를 제친 뒤 빈 골문
    const r = rand();
    if (r < q) result = "goal";
    else {
      const w = rand(), pBlock = near < 2 ? 0.28 : 0.1;
      result = w < pBlock ? "block" : w < pBlock + 0.42 ? "save" : w < pBlock + 0.42 + 0.08 ? "post" : "wide";
    }
  }
  const assist = opts.assist !== undefined ? opts.assist : (S.chain.length && S.chain[S.chain.length - 1] !== H && S.chain[S.chain.length - 1].team === team ? S.chain[S.chain.length - 1] : null);
  const gk = gkOf(S, def);
  const goalX = team === "us" ? 105 : 0;
  let ty = range(30.8, 37.2);
  let tx = goalX + dirOf(team) * 0.8;
  if (result === "wide") { ty = rand() < 0.5 ? range(26, 30) : range(38, 42); tx = goalX + dirOf(team) * 1.2; }
  if (result === "post") { ty = rand() < 0.5 ? 30.35 : 37.65; tx = goalX - dirOf(team) * 0.2; }
  if (result === "save" && gk && gk.stun > 0) result = "post";                // 쓰러진 골키퍼는 막을 수 없음 (골대를 맞고 나옴)
  if (result === "save") { tx = goalX - dirOf(team) * 1.3; if (gk) { tx = gk.x + (goalX - gk.x) * 0.25; ty = clamp(gk.y, 29.5, 38.5); } }   // 선방: 골키퍼가 있는 쪽으로 (멀리서 공이 손에 붙지 않게)
  let blocker = null;
  if (result === "block" && opts.blocker) { blocker = opts.blocker; tx = blocker.x - dirOf(team) * 0.4; ty = blocker.y; }       // 정해진 수비(나)의 몸에 맞음
  else if (result === "block") {
    blocker = S.P.filter(p => p.team === def && p.pos !== "GK").sort((a, b) => hyp(a.x - H.x, a.y - H.y) - hyp(b.x - H.x, b.y - H.y))[0];
    if (blocker) { tx = (H.x + blocker.x) / 2 + dirOf(team) * 0.8; ty = (H.y + blocker.y) / 2; } else result = "save";
  }
  if (gk && result !== "block") {
    const dive = result === "save" ? ty : result === "goal" ? ty + (ty > 34 ? -2.4 : 2.4) : 34 + (ty - 34) * 0.4;
    gk.ov = result === "save" ? OV(tx, ty, 9) : OV(goalX - dirOf(team) * 1.2, clamp(dive, 30, 38), 9);
  }
  S.shot = { by: H, team, result, kind, assist, forced: !!opts.result, gk, blocker, saveKind: opts.saveKind || null, parryTo: opts.parryTo || null };
  emit(S, "shot", { by: H.name, team, kind, result, me: H.me, assist: assist?.name || null, assistMe: !!assist?.me, x: hx, y: hy, q, silent: !!opts.silent, forced: !!opts.result });
  S.last = H; S.lastTeam = team; H.ov = null;
  launch(S, tx, ty, { shot: true, air: kind === "head" || kind === "long" || kind === "chip" || rand() < 0.3, h: kind === "head" ? 1.6 : kind === "chip" ? 4.5 : 1.2, T: kind === "chip" ? 0.5 + hyp(tx - H.x, ty - H.y) / 14 : undefined, kind: "shot", then: S2 => shotEnd(S2) });
}
function shotEnd(S) {
  const sh = S.shot; S.shot = null;
  if (!sh) return landLoose(S);
  const { team, result, gk, by } = sh;
  const def = other(team);
  if (gk) gk.ov = null;
  // 선방: 잡음(catch) / 쳐 냄(parry) / 쳐 내서 골라인 밖(corner). 중계 문장이 이 값을 보고 고름
  let save = null;
  if (result === "save") save = sh.saveKind || (gk && rand() < 0.62 ? "catch" : rand() < 0.45 ? "corner" : "parry");
  if (save === "catch" && (!gk || hyp(gk.x - S.ball.x, gk.y - S.ball.y) > 2.6)) save = "parry";   // 손이 닿을 때만 잡음
  emit(S, "shotEnd", { by: by.name, team, result, me: by.me, gk: gk?.name, blocker: sh.blocker?.name, blockerMe: !!sh.blocker?.me, kind: sh.kind, forced: sh.forced, assist: sh.assist?.name || null, assistMe: !!sh.assist?.me, save });
  if (result === "goal") {
    S.ball.x = team === "us" ? 104.6 : 0.4;
    emit(S, "goal", { team, by: by.name, me: by.me, assist: sh.assist?.name || null, assistMe: !!sh.assist?.me, forced: sh.forced, kind: sh.kind });
    S.phase = "dead"; S.restart = { kind: "kickoff", team: def, at: S.t + 99, celebrate: S.t + 1.4 };
    S.holder = null;
    return;
  }
  // 공을 골라인 밖으로 실제로 보냄 (코너킥은 공이 라인을 넘은 뒤 outCheck가 선언)
  const overLine = (kind, spread) => {
    const goalX = team === "us" ? 106.5 : -1.5;
    let ty = S.ball.y + range(-spread, spread);
    if (Math.abs(ty - 34) < 6) ty = 34 + (ty < 34 ? -1 : 1) * range(6, 12);
    S.deflect = { kind, t: S.t };
    launch(S, goalX, clamp(ty, 2, 66), { air: true, h: 2.2, kind: "deflect", then: S2 => landLoose(S2) });
  };
  if (result === "save") {
    if (save === "catch") return give(S, gk);
    S.last = gk; S.lastTeam = def;
    if (save === "corner") return overLine("save", 9);
    const g = dirOf(def);
    if (sh.parryTo) { launch(S, sh.parryTo[0], sh.parryTo[1], { air: true, h: 2, kind: "parry", then: S2 => landLoose(S2) }); return; }   // 장면 결과: 쳐 낸 공이 정해진 자리로 (흘러나온 공이 내 앞)
    launch(S, clamp(S.ball.x + g * range(6, 12), 2, 103), clamp(S.ball.y + range(-10, 10), 2, 66), { air: true, h: 2, kind: "parry", then: S2 => landLoose(S2) });
    return;
  }
  if (result === "block") {
    S.last = sh.blocker; S.lastTeam = def;
    if (rand() < 0.3) return overLine("block", 12);
    const g = dirOf(def);
    launch(S, clamp(S.ball.x + g * range(4, 12), 2, 103), clamp(S.ball.y + range(-9, 9), 2, 66), { air: rand() < 0.5, h: 2, kind: "deflect", then: S2 => landLoose(S2) });
    return;
  }
  if (result === "post") {
    S.last = by; S.lastTeam = team;
    launch(S, clamp(S.ball.x - dirOf(team) * range(5, 10), 2, 103), clamp(S.ball.y + (S.ball.y < 34 ? -1 : 1) * range(2, 6), 2, 66), { air: true, h: 2, kind: "rebound", then: S2 => landLoose(S2) });
    return;
  }
  // 빗나감: 골킥
  emit(S, "out", { kind: "goalkick", team: def, by: by.name, byTeam: team, shot: true });
  setRestart(S, "goalkick", def);
}


// ── 공격 계획 (data/match.js의 PLAYS) ──
// 공을 잡은 팀은 공격 방식 하나를 정하고(측면, 침투, 롱볼, 역습…), 단계마다 그 자리로 공을 보냄.
// 패스가 끊기는지, 몸싸움에서 지는지는 실제 위치(패스 길, 거리)로 정해지고, brk가 팀 전력 차이를 반영함
const OPEN_PLAYS = PLAYS.filter(p => !["corner", "freekick", "penalty", "throwin"].includes(p.id));
function zoneY(spec, side) {
  if (typeof spec === "number") return spec;
  if (spec === "W") return side < 0 ? 7.5 : 60.5;
  if (spec === "H") return side < 0 ? 20 : 48;
  return 34 + side * 3;
}
function endPlan(S) {
  if (S.plan) for (const p of S.P) if (p.ov?.plan) p.ov = null;
  S.plan = null;
}
function newPlan(S, H, force = false) {
  const team = H.team, hx = ox(team, H.x), st = S.style[team] || {};
  const won = S.wonAt != null && S.t - S.wonAt < 1.2 && S.lastRestart == null;
  S.lastRestart = null;
  const pA = force || (team === "them" && S.bias?.them) ? 1 : (S.attackP?.[team] ?? 0.75);
  // 빌드업: 자기 진영에서 공을 잡으면(역습이 아닐 때) 짧은 패스로 몇 번 돌리며 전진한 뒤 공격 방식을 고름
  if (!force && hx < 52 && H.pos !== "GK" && !(won && hx > 22 && (st.counter || rand() < 0.35)) && rand() < (st.keep ? 0.9 : st.long ? 0.35 : 0.7)) {
    S.plan = { team, recycle: true, build: true, need: int(2, 5) + (st.keep ? 2 : 0), done: 0, until: S.t + range(5, 8) };
    emit(S, "build", { team, by: H.name, x: hx });
    return;
  }
  if (!force && H.pos === "GK" && rand() < (st.long ? 0.3 : 0.65)) {   // 골키퍼가 잡으면 대부분 짧게 수비수에게
    S.plan = { team, recycle: true, build: true, need: int(2, 4), done: 0, until: S.t + range(5, 8) };
    return;
  }
  if (rand() > pA) { S.plan = { team, recycle: true, until: S.t + range(1.8, 3.6) }; return; }
  const mates = S.P.filter(p => p.team === team);
  const hasLong = mates.some(p => p.longShot && p.ri);
  const pairs = [];
  for (const pl of OPEN_PLAYS) {
    let w = pl.weight;
    const first = pl.steps[0];
    if (pl.id === "keeper") { if (H.pos !== "GK") continue; w *= 3; }
    else if (H.pos === "GK") continue;
    if (pl.id === "counter") { if (!won || hx < 22 || hx > 62) continue; w *= st.counter ? 3 : 1.8; }
    if (pl.id === "press") { if (!won || hx < 70 || H.pos !== "FW") continue; w *= 4; }
    if (pl.id === "solo" && (H.pos !== "FW" || hx < 45 || hx > 72)) continue;
    if (pl.id === "longshot" && !hasLong) continue;
    if (S.bias?.planPos && team === "us" && pl.steps.some(st => st.who === S.bias.planPos && st.at[0] >= 78)) w *= 2.5;   // 내 장면을 기다릴 때: 내가 마무리 근처에 끼는 공격
    if (st.long && ["long", "keeper", "switch"].includes(pl.id)) w *= 1.8;
    if (st.cross && ["wing", "overlap", "wingdribble"].includes(pl.id)) w *= 1.6;
    if (st.keep && ["build", "buildup", "onetwo"].includes(pl.id)) w *= 1.5;
    // 지금 공 자리보다 한참 뒤에서 시작하는 공격은 중간부터
    const lastX = pl.steps[pl.steps.length - 1].at[0];
    if (lastX < hx - 4) continue;
    if (first.at[0] > hx + 45) w *= 0.4;
    pairs.push([pl, w]);
  }
  if (!pairs.length) { S.plan = { team, recycle: true, until: S.t + range(1.5, 3) }; return; }
  let r = rand() * pairs.reduce((a, x) => a + x[1], 0), pl = pairs[0][0];
  for (const [x, w] of pairs) if ((r -= w) <= 0) { pl = x; break; }
  let side = rand() < 0.5 ? -1 : 1;
  const me = S.bias?.defSide && team === "them" ? S.P.find(p => p.me) : null;          // 내 수비 장면을 기다릴 때: 상대 공격이 내 쪽으로
  if (me) side = oy(team, me.y) < 34 ? -1 : 1;
  // 시작 단계: 공 자리를 이미 지난 단계는 건너뜀. 지금 공 가진 선수가 그 단계 포지션이면 그 단계를 맡음
  let i = 0;
  while (i < pl.steps.length - 1 && pl.steps[i].at[0] < hx - 6) i++;
  const cur = pl.steps[i];
  const fits = cur.who === H.pos || (cur.who === "GK" && H.pos === "GK");
  S.plan = { team, id: pl.id, steps: pl.steps, finish: pl.finish, side, i: fits ? i : i - 1, actors: [], t0: S.t };
  if (fits) S.plan.actors[i] = H;
  planRun(S);
  if (fits) emit(S, "step", { play: pl.id, i, a: H.name, b: S.plan.actors[i + 1]?.name || null, team, me: H.me, first: true, x: hx });
}
// 다음 단계 선수를 고르고 그 자리로 뛰어가게 함
function planNext(S) {
  const P = S.plan; if (!P || P.recycle) return null;
  const j = P.i + 1, step = P.steps[j];
  if (!step) return null;
  if (P.actors[j]) return { j, step, r: P.actors[j] };
  const H = S.holder;
  if (step.same) return { j, step, r: H };
  const team = P.team;
  const zx = ox(team, step.at[0]), zy = oy(team, zoneY(step.at[1], P.side));
  let best = null, bd = 1e9;
  for (const p of S.P) {
    if (p.team !== team || p === H) continue;
    if (step.who === "GK" ? p.pos !== "GK" : p.pos !== step.who) continue;
    let d = hyp(p.x - zx, p.y - zy);
    if (p.me) d *= S.bias?.me ? 0.35 : (S.meBias ?? 1);    // 내 차례가 다가오면, 그리고 잘할수록 공이 나에게 더 자주 옴
    if (p.ace && S.style[team]?.ace) d *= 0.6;
    if (d < bd) { bd = d; best = p; }
  }
  if (!best) return null;
  P.actors[j] = best;
  return { j, step, r: best };
}
function planRun(S) {
  const P = S.plan; if (!P || P.recycle) return;
  const n = planNext(S); if (!n || n.step.same || n.r === S.holder) return;
  const zx = ox(P.team, n.step.at[0]), zy = oy(P.team, zoneY(n.step.at[1], P.side));
  const off = offLine(S, P.team) - 0.8;
  n.r.ov = OV(clamp(ox(P.team, Math.min(ox(P.team, zx), off)), 2, 103), clamp(zy, 2, 66), RUN + 0.6, "plan");
}
// 계획대로 받으면 다음 단계로
function planRecv(S, r, header = false) {
  const P = S.plan;
  if (!P || P.recycle || P.team !== r.team) return;
  if (P.expect && P.expect.r === r) {
    P.i = P.expect.i; P.expect = null;
    if (r.ov?.plan) r.ov = null;
    planRun(S);
    emit(S, "step", { play: P.id, i: P.i, a: r.name, b: P.actors[P.i + 1]?.name || null, team: r.team, me: r.me, header, prev: P.actors[P.i - 1]?.name || null, x: ox(r.team, r.x) });
  } else if (!header) { endPlan(S); }
}
// 계획에 따른 판단. 처리했으면 true
function planDecide(S, H) {
  const P = S.plan, team = H.team, g = dirOf(team);
  const hx = ox(team, H.x), hy = oy(team, H.y);
  const dGoal = hyp(105 - hx, 34 - hy);
  let near = 99; for (const o of S.P) if (o.team !== team && o.ri) near = Math.min(near, hyp(o.x - H.x, o.y - H.y));
  // 좋은 슈팅 자리면 계획과 상관없이 때림
  if (hx >= 70 && dGoal <= 21 && xgAt(hx, hy) * (near < 1.6 ? 0.55 : 1) > 0.17) { shoot(S, H, {}); return true; }
  const n = planNext(S);
  if (!n) {                                            // 마지막 단계: 마무리
    if (P.finish === "long" && dGoal < 32) { shoot(S, H, { kind: "long" }); return true; }
    P.fin ??= S.t;
    const open = near > 4.5;                           // 앞이 비어 있으면 조금 더 들어가서
    if (hx >= 70 && (dGoal <= (open ? 14 : 21) || (dGoal <= 23 && S.t - P.fin > 0.9))) { shoot(S, H, {}); return true; }
    if (S.t - P.fin < 1.8 && hx < 97) {                // 슈팅 자리까지 몰고 감
      const tx = ox(team, Math.min(hx + 7, 93)), ty = oy(team, hy + (34 - hy) * 0.5);
      H.ov = OV(tx, ty, DRIB + (H.st.drib - 50) / 60, "carry"); S.decideAt = S.t + 0.35; return true;
    }
    endPlan(S); return false;
  }
  const { j, step, r } = n;
  const zx = ox(team, step.at[0]), zy = oy(team, zoneY(step.at[1], P.side));
  if (step.same || r === H) {                          // 같은 선수가 몰고 감
    if (hyp(H.x - zx, H.y - zy) < 4 || (ox(team, H.x) > step.at[0] - 3)) {
      P.i = j; P.actors[j] = H;
      planRun(S);
      emit(S, "step", { play: P.id, i: j, a: H.name, b: P.actors[j + 1]?.name || null, team, me: H.me, carried: true, x: ox(team, H.x) });
      S.decideAt = S.t + 0.15; return true;
    }
    H.ov = OV(zx, zy, DRIB + (H.st.drib - 50) / 60 + (step.at[1] === "W" ? 0.6 : 0), "carry");
    S.decideAt = S.t + range(0.35, 0.6);
    return true;
  }
  // 받을 선수가 아직 자리에 없으면 잠깐 기다림 (압박이 없을 때만)
  const rd = hyp(r.x - zx, r.y - zy);
  if (rd > 9 && near > 3 && !(H.waitT > 0.8) && !step.behind) {
    H.waitT = (H.waitT || 0) + 0.3; H.ov = null; S.decideAt = S.t + 0.3; return true;
  }
  H.waitT = 0;
  // 수비 뒤 공간으로 (뒷공간·스루패스): 받을 선수는 라인에 붙어 있다가 공이 떠나는 순간 뛰어듦
  if (step.behind) {
    const line = offLine(S, team), rx = ox(team, r.x), ry = oy(team, r.y);
    const px = clamp(Math.max(rx + 8, line + 5), hx + 8, 92), py = ry + (34 - ry) * 0.25;
    const tp2 = [ox(team, px), oy(team, py)], d2 = hyp(tp2[0] - H.x, tp2[1] - H.y);
    passTo(S, H, r, tp2, { air: d2 > 30 || P.id === "behind", step: j, space: true, kind: d2 > 30 || P.id === "behind" ? (d2 > 40 ? "long" : "air") : "through" });
    return true;
  }
  // 패스: 달려가는 선수면 그 공간으로, 서 있는 선수면 발밑으로
  const runner = r.ov?.plan && rd > 3;
  let tp = [clamp(r.x + g * 0.8, 2, 103), r.y];
  if (runner) {                                        // 뛰는 선수가 닿을 수 있는 만큼만 앞으로
    const d0 = hyp(r.x - H.x, r.y - H.y), T0 = 0.12 + d0 / 15.5, reach = 7.6 * T0 + 1;
    const k = Math.min(1, reach / Math.max(1, rd)) * 0.9;
    tp = [clamp(r.x + (zx - r.x) * k, 2, 103), clamp(r.y + (zy - r.y) * k, 2, 66)];
  }
  const d = hyp(tp[0] - H.x, tp[1] - H.y);
  const prevSpec = P.steps[P.i]?.at?.[1];
  const cross = step.at[1] === "C" && prevSpec === "W" && hx > 84;
  const air = cross || d > 32 || (["long", "switch", "keeper"].includes(P.id) && j === (P.id === "keeper" ? 1 : P.id === "switch" ? 1 : 1) && d > 22);
  passTo(S, H, r, tp, { air, cross, step: j, kind: cross ? "cross" : undefined });
  return true;
}

// ── 몸싸움 (태클) ──
function duels(S) {
  const H = S.holder;
  if (!H || H.pos === "GK" || S.stage || S.scur || S.phase !== "play") return;
  const fresh = S.t - (S.wonAt ?? -9);                     // 공을 막 따낸 직후에는 상대도 자리를 잡느라 바로 태클하지 못함
  for (const d of S.P) {
    if (d.team === H.team || d.pos === "GK" || d.cool > S.t || d.stun > 0) continue;
    if (fresh < (S.style[d.team]?.press ? 0.4 : 0.9)) continue;
    if (hyp(d.x - H.x, d.y - H.y) > 1.7) { d.eng = 0; continue; }
    if (!d.eng) { d.eng = S.t + range(0.3, 0.6); continue; }          // 붙자마자 들어가지 않고 잠깐 맞섬 (그사이 패스할 수 있음)
    if (S.t < d.eng) continue;
    d.cool = S.t + range(1.0, 1.6); d.eng = 0;
    const rough = S.style[d.team]?.rough ? 1.5 : 1;
    const inPlan = S.plan && !S.plan.recycle && S.plan.team === H.team;
    const building = S.plan?.build && S.plan.team === H.team;
    let p = clamp((S.tk * (ox(H.team, H.x) > 70 ? S.ft : 1) + (d.st.def - H.st.drib) / 85) * (inPlan ? (S.brk?.[H.team] ?? S.brk0) : 1) * (building ? 0.75 : 1), 0.04, 0.75);
    const r = rand();
    if (r < p) {
      emit(S, "tackle", { by: d.name, team: d.team, victim: H.name, me: d.me, victimMe: H.me, x: ox(d.team, H.x) });
      H.stun = 0.5; H.ov = null;
      if (rand() < 0.75) give(S, d);
      else { S.last = d; S.lastTeam = d.team; loose(S, dirOf(d.team) * range(2, 6), range(-4, 4)); }
      return;
    }
    if (r < p + 0.05 * rough && !(S.noFoulUntil > S.t)) {   // 반칙 (내 수비 장면 직후 몇 초는 없음)
      const hx = ox(H.team, H.x), hy = oy(H.team, H.y);
      const pen = hx > 88.5 && Math.abs(hy - 34) < 20;
      const card = rand() < (pen ? 0.35 : 0.14 * rough);
      emit(S, "foul", { by: d.name, team: d.team, victim: H.name, me: d.me, victimMe: H.me, card, pen, x: hx, y: hy });
      d.stun = 0.4;
      if (pen && !S.noPen?.[H.team]) return setRestart(S, "pk", H.team);
      return setRestart(S, "fk", H.team, H.x, H.y);
    }
    // 제쳤다
    d.stun = 0.7;
    emit(S, "beat", { by: H.name, team: H.team, victim: d.name, me: H.me, victimMe: d.me, x: ox(H.team, H.x) });
    S.decideAt = Math.min(S.decideAt, S.t + 0.2);
    return;
  }
}
// 흘러 있는 공 줍기
function pickup(S) {
  if (S.holder || S.ball.fl || S.phase !== "play") return;
  const b = S.ball;
  let best = null, bd = 1.5;
  for (const p of S.P) { if (S.pickOnly && p !== S.pickOnly) continue; const d = hyp(p.x - b.x, p.y - b.y) - (p.pos === "GK" && ox(p.team, b.x) < 16 ? 0.8 : 0); if (d < bd) { bd = d; best = p; } }
  if (best) {
    const prev = S.poss;
    give(S, best);
    if (prev !== best.team) emit(S, "win", { by: best.name, team: best.team, me: best.me, x: ox(best.team, b.x) });
  }
}

// ── 경기 재개 ──
export function setRestart(S, kind, team, x, y) {
  S.phase = "dead"; S.holder = null; S.ball.roll = null; endPlan(S);
  S.shot = null;
  for (const p of S.P) if (p.ov?.recv || p.ov?.carry) p.ov = null;
  const delay = { throw: 0.8, goalkick: 1.1, corner: 1.5, fk: 1.3, pk: 2.4, kickoff: 2.4 }[kind] || 1.0;
  S.restart = { kind, team, x, y, at: S.t + delay };
  S.poss = team; S.chain = [];
}
function prepRestart(S) {
  const R = S.restart, team = R.team, g = dirOf(team);
  if (R.ready) return;
  if (R.kind === "kickoff") return;
  let spot;
  if (R.kind === "goalkick") spot = [team === "us" ? 5.5 : 99.5, 34 + range(-8, 8)];
  else if (R.kind === "pk") spot = [team === "us" ? 94 : 11, 34];
  else spot = [clamp(R.x, 0.5, 104.5), clamp(R.y, 0.3, 67.7)];
  R.spot = spot;
  let taker = R.taker;
  if (!taker) {
    if (R.kind === "goalkick") taker = gkOf(S, team);
    else if (R.kind === "pk") taker = S.pkTaker?.(team) || S.P.filter(p => p.team === team && p.pos !== "GK").sort((a, b) => b.st.shoot - a.st.shoot)[0];
    else if (R.kind === "corner") taker = S.P.filter(p => p.team === team && p.pos === "MF").sort((a, b) => hyp(a.x - spot[0], a.y - spot[1]) - hyp(b.x - spot[0], b.y - spot[1]))[0];
    else taker = S.P.filter(p => p.team === team && p.pos !== "GK").sort((a, b) => hyp(a.x - spot[0], a.y - spot[1]) - hyp(b.x - spot[0], b.y - spot[1]))[0];
  }
  R.taker = taker;
  // 공은 그 자리로 굴러가거나 날아감 (순간이동 없음)
  const d = hyp(spot[0] - S.ball.x, spot[1] - S.ball.y);
  if (d > 0.5) launch(S, spot[0], spot[1], { air: d > 8, T: 0.35 + d / 24, h: Math.min(5, 0.8 + d * 0.12), kind: "reset" });   // 공이 그 자리로 날아감 (그동안 기다림)
  taker.ov = OV(spot[0] - g * 1.0, spot[1] + (R.kind === "throw" ? (spot[1] < 34 ? -0.6 : 0.6) : 0), 11, "keep");
  if (R.kind === "corner") packBox(S, team, taker);
  if (R.kind === "pk") {
    for (const p of S.P) {
      if (p === taker) continue;
      if (p.pos === "GK") { p.ov = p.team !== team ? OV(team === "us" ? 104.4 : 0.6, 34, 9, "keep") : null; continue; }
      const inBox = team === "us" ? p.x > 86 : p.x < 19;
      if (inBox || hyp(p.x - spot[0], p.y - 34) < 10) p.ov = OV(team === "us" ? 84.5 : 20.5, clamp(p.y, 16, 52), 10, "keep");   // 차고 나면 풀림
    }
  }
  if (R.kind === "fk" && ox(team, spot[0]) > 70) {        // 프리킥 벽
    const goalX = team === "us" ? 105 : 0, dd = hyp(goalX - spot[0], 34 - spot[1]), ux = (goalX - spot[0]) / dd, uy = (34 - spot[1]) / dd;
    const wall = S.P.filter(p => p.team !== team && p.pos !== "GK").sort((a, b) => hyp(a.x - spot[0], a.y - spot[1]) - hyp(b.x - spot[0], b.y - spot[1])).slice(0, 4);
    wall.forEach((p, i) => { p.ov = OV(spot[0] + ux * 9.2 - uy * (i - 1.5) * 1.1, spot[1] + uy * 9.2 + ux * (i - 1.5) * 1.1, 10, "keep"); });   // 벽: 프리킥을 차면 풀림 (예전엔 안 풀려서 벽 선 선수들이 그 자리에 묶여 있었음)
    if (ox(team, spot[0]) > 75) packBox(S, team, taker, true);
  }
  else if (R.kind === "fk" && R.pack) packBox(S, team, taker, true);
  R.ready = true;
  R.setupAt = { team, taker, spot };                      // "공을 내려놓는다" 같은 문장은 차는 선수가 그 자리에 왔을 때
}
function announceSetup(S) {
  const R = S.restart, a = R.setupAt; if (!a) return;
  const { team, taker, spot } = a;
  if (taker && hyp(taker.x - spot[0], taker.y - spot[1]) > 4 && S.t < R.at + 3) return;
  R.setupAt = null;
  emit(S, "setup", { kind: R.kind, team, taker: taker?.name, me: !!taker?.me, x: ox(team, spot[0]), y: oy(team, spot[1]) });
}
function packBox(S, team, except, soft) {
  const gx = dirOf(team), goalX = team === "us" ? 105 : 0;
  const A = [[-7, -5], [-9, 3], [-12, -1], [-5, 6], [-14, 7]], D = [[-5, -3], [-6, 2], [-8, 6], [-10, -6], [-4, 0], [-11, 2]];
  const key = ["LCB", "RCB", "ST1", "ST2", "RCM"];
  const atk = S.P.filter(p => p.team === team && p !== except && p.pos !== "GK" && !p.ov).sort((a, b) => (key.includes(b.role) ? 1 : 0) - (key.includes(a.role) ? 1 : 0));
  const dfn = S.P.filter(p => p.team !== team && p.pos !== "GK" && !p.ov).sort((a, b) => Math.abs(a.x - goalX) - Math.abs(b.x - goalX));
  atk.slice(0, soft ? 3 : 5).forEach((p, i) => { p.ov = OV(goalX + gx * A[i][0], 34 + A[i][1] + range(-1, 1), 10, "keep"); });
  dfn.slice(0, soft ? 3 : 6).forEach((p, i) => { p.ov = OV(goalX + gx * D[i][0], 34 + D[i][1] + range(-1, 1), 10, "keep"); });
}
function takeRestart(S) {
  const R = S.restart; S.restart = null; S.phase = "play";
  for (const p of S.P) if (p.ov?.keep) p.ov = null;
  const team = R.team, g = dirOf(team);
  if (R.kind === "kickoff") { const k = S.P.find(p => p.team === team && p.role === "ST1"); give(S, k); const r = S.P.find(p => p.team === team && p.role === "LCM"); emit(S, "kickoff", { team }); passTo(S, k, r, [r.x, r.y], { force: true, kind: "ground" }); return; }
  const T = R.taker; if (!T) return;
  if (hyp(T.x - S.ball.x, T.y - S.ball.y) > 3) { S.ball.fl = null; S.ball.x = clamp(T.x + g * 0.8, 0.3, 104.7); S.ball.y = T.y; }
  give(S, T);
  S.lastRestart = R.kind;
  emit(S, "restart", { kind: R.kind, team, taker: T.name, me: T.me, x: ox(team, R.spot[0]) });
  if (R.script) return;                                  // 내 장면이 이어서 정함
  const mates = S.P.filter(p => p.team === team && p !== T && p.pos !== "GK");
  if (R.kind === "pk") return shoot(S, T, { kind: "pk" });
  if (R.kind === "corner") {
    const box = mates.filter(p => ox(team, p.x) > 88).sort((a, b) => b.st.jump - a.st.jump);
    const r = box[Math.floor(rand() * Math.min(3, box.length))] || mates[0];
    return passTo(S, T, r, [r.x + range(-1, 1), r.y + range(-1, 1)], { air: true, cross: true, noOff: true, kind: "cross" });
  }
  if (R.kind === "fk") {
    const fx = ox(team, R.spot[0]), fy = oy(team, R.spot[1]), dg = hyp(105 - fx, 34 - fy);
    if (dg < 28 && Math.abs(fy - 34) < 16 && rand() < 0.55) return shoot(S, T, { kind: "fk" });
    if (fx > 75) { const box = mates.filter(p => ox(team, p.x) > 86); const r = box[Math.floor(rand() * box.length)]; if (r) return passTo(S, T, r, [r.x, r.y], { air: true, cross: true, kind: "cross" }); }
  }
  if (R.kind === "goalkick" && rand() < (S.style[team]?.long ? 0.8 : 0.5)) {
    const fws = mates.filter(p => p.pos === "FW" || p.pos === "MF");
    const r = fws[Math.floor(rand() * fws.length)];
    return passTo(S, T, r, [clamp(r.x + g * 3, 2, 103), r.y], { air: true, kind: "long" });
  }
  // 짧게 가까운 동료에게
  const r = mates.sort((a, b) => hyp(a.x - T.x, a.y - T.y) - hyp(b.x - T.x, b.y - T.y))[0];
  passTo(S, T, r, [r.x, r.y], { air: R.kind === "throw", force: true, kind: R.kind === "throw" ? "throw" : "ground" });
}
export function kickoffSetup(S, team, instant, script = false) {
  S.phase = "dead"; S.holder = null; S.ball.roll = null; S.shot = null; S.chain = []; S.poss = team; endPlan(S);
  for (const p of S.P) {
    const f = FORM[p.role];
    let pt = p.pos === "GK" ? [4, 34] : [KICKOFF_X[p.pos], 34 + (f ? f.d[1] : 0) * 21];
    if (p.team === team && p.role === "ST1") pt = [51.6, 34];
    if (p.team === team && p.role === "ST2") pt = [49.5, 27.5];
    const x = ox(p.team, pt[0]), y = oy(p.team, pt[1]);
    if (instant) { p.x = x; p.y = y; p.tx = x; p.ty = y; p.vx = 0; p.vy = 0; p.ov = null; }
    else p.ov = OV(x, y, 10.5, "keep");
  }
  if (instant) { S.ball.fl = null; S.ball.x = 52.5; S.ball.y = 34; S.ball.z = 0; }
  else { const d = hyp(52.5 - S.ball.x, 34 - S.ball.y); if (d > 0.5) launch(S, 52.5, 34, { air: true, T: 0.4 + d / 24, h: 5, kind: "reset" }); }
  S.restart = { kind: "kickoff", team, at: S.t + (instant ? 0.6 : 2.4), ready: true, script };
}

// ── 한 틱 ──
export function step(S) {
  S.t += DT;
  if (S.poss) S.possT[S.poss] += DT;
  // 대본(내 장면 결과)이 있으면 먼저
  if (S.script.length || S.scur) runScript(S);
  if (S.phase === "dead" && S.restart) {
    const R = S.restart;
    if (R.kind === "kickoff" && R.celebrate != null && S.t >= R.celebrate) kickoffSetup(S, R.team, false, R.script);
    else if (R.kind !== "kickoff") { prepRestart(S); announceSetup(S); }
    // 차는 선수가 공 자리에 올 때까지 기다림 (멀리 있던 선수에게 공이 순간이동하지 않게). 너무 오래 걸리면 그냥 진행
    const T = S.restart.taker, sp = S.restart.spot, far = T && sp && R.kind !== "kickoff" && hyp(T.x - sp[0], T.y - sp[1]) > 2.5 && S.t < S.restart.at + 4;
    if (S.t >= S.restart.at && !S.ball.fl && !S.restart.hold && !far && !S.restart.setupAt) takeRestart(S);
  } else if (S.phase === "play" && !S.stage) {
    if (S.holder && S.t >= S.decideAt && !S.scur) {
      decide(S);
    }
    // 드리블 도착하면 다시 판단
    const H = S.holder;
    if (H?.ov?.carry && hyp(H.x - H.ov.x, H.y - H.ov.y) < 0.6) { H.ov = null; S.decideAt = Math.min(S.decideAt, S.t + 0.1); }
    // 수비가 막 붙으면 바로 다시 판단 (반응 시간 0.2초)
    if (H && H.ri && !H.pressedAt) { for (const o of S.P) if (o.team !== H.team && o.ri && hyp(o.x - H.x, o.y - H.y) < 2.6) { H.pressedAt = S.t; S.decideAt = Math.min(S.decideAt, S.t + 0.2); break; } }
    duels(S);
    pickup(S);
  }
  if (S.stage) stageTick(S);
  targets(S);
  movePlayers(S);
  moveBall(S);
  if (!S.ball.fl && !S.holder && S.phase === "play") outCheck(S);
  if (S.rec) record(S);
  if (S.onTick) S.onTick(S);                               // 점검 도구용 (tools/dev/audit.mjs)
}
function record(S) {
  const f = new Float32Array(4 + S.P.length * 2);
  f[0] = S.t; f[1] = S.ball.x; f[2] = S.ball.y; f[3] = S.ball.z;
  for (let i = 0; i < S.P.length; i++) { f[4 + i * 2] = S.P[i].x; f[5 + i * 2] = S.P[i].y; }
  S.rec.push(f);
}
export function frameNow(S) { const r = S.rec; S.rec = []; record(S); const f = S.rec[0]; S.rec = r; return f; }

// ── 내 장면 연출 (짧게 자리 잡기) ──
// hint: { holder, press, pressGap, gk:[dx,dy], dur }
export function stageStart(S, hint) {
  S.stage = { ...hint, until: S.t + (hint.dur ?? 0.8) };
  const H = hint.holder;
  if (H && S.holder !== H) {
    if (hyp(H.x - S.ball.x, H.y - S.ball.y) < 3 && !S.ball.fl) give(S, H);
  }
  if (H && S.holder !== H) S.stage.holder = S.holder || null;          // 공이 그 선수에게 없으면 실제로 공 가진 선수 기준으로
  if (H) H.ov = OV(H.x + dirOf(H.team) * 0.6, H.y, 2.5);
  // 장면이 말하는 자리로 미리 움직일 선수들 (컷백을 받으러 뛰는 상대, 골키퍼 앞에 서는 나…). 공 가진 선수가 들어 있으면 공을 몰고 감
  for (const [p, x, y, v, tag] of hint.moves || []) p.ov = OV(clamp(x, 1, 104), clamp(y, 1.5, 66.5), v ?? RUN, tag === "carry" && p === S.holder ? "carry" : "stage");
}
function stageTick(S) {
  const st = S.stage;
  // 공이 날아가는 중이면 받는 선수가 잡을 때까지 기다림 (그 선수 기준으로 자리를 잡게)
  if (!st.holder || st.holder !== S.holder) { if (S.holder && !S.ball.fl) { st.holder = S.holder; st.pressers = null; } else { if (S.t >= st.until + 3) { S.stage = null; for (const p of S.P) if (p.ov?.stage) p.ov = null; } return; } }
  const H = st.holder;
  const def = other(H.team);
  const n = st.press ?? (H.team === "us" ? 1 : 0);
  // 압박하는 선수는 처음 정한 사람을 끝까지 (가까운 순서가 바뀌어도 다른 선수로 바뀌지 않게)
  if (!st.pressers) {
    const pool = S.P.filter(p => p.team === def && p.pos !== "GK" && !p.me), near = pt => pool.slice().sort((a, b) => hyp(a.x - pt.x, a.y - pt.y) - hyp(b.x - pt.x, b.y - pt.y));
    st.pressers = near(H).slice(0, n);
    // 센터백 짝을 막는 선수: 그 짝에게 가장 가까운 상대 (첫 번째 압박 선수 말고)
    const pair = st.mark2 && (S.P.find(q => q.team === H.team && q !== H && (q.role === "LCB" || q.role === "RCB") && (H.role === "LCB" || H.role === "RCB")) || S.P.filter(q => q.team === H.team && q !== H && q.pos === "DF" && !q.me).sort((a, b) => hyp(a.x - H.x, a.y - H.y) - hyp(b.x - H.x, b.y - H.y))[0]);   // 센터백 짝 (공 가진 선수가 센터백이면 다른 센터백)
    if (pair && n >= 2) { st.pressers[1] = near(pair).find(p => p !== st.pressers[0]); st.pair = pair; }
  }
  let arrived = true;
  st.pressers.forEach((p, i) => {
    let tx, ty;
    if (i === 1 && st.mark2) {
      // 두 번째 선수는 공 가진 선수 옆의 다른 동료(센터백 짝)를 막음
      const pair = st.pair;
      if (pair) {
        // 짝 센터백은 공 가진 선수와 12m 넘게 벌려 섬 (골키퍼 앞에 뭉치지 않게)
        if (!st.pairAt) { const sy = pair.y >= H.y ? 1 : -1; let py = Math.abs(pair.y - H.y) < 12 ? H.y + sy * 14 : pair.y; if (py < 6 || py > 62) py = H.y - sy * 14; st.pairAt = [Math.max(pair.x, H.x), clamp(py, 6, 62)]; }
        pair.ov = OV(st.pairAt[0], st.pairAt[1], RUN, "stage");
        tx = pair.x - dirOf(def) * 2; ty = pair.y;
        if (hyp(pair.x - st.pairAt[0], pair.y - st.pairAt[1]) > 2) arrived = false;
      }
    }
    if (tx == null) { const gap = (st.pressGap ?? 1.8) + i * 1.4, side = i === 0 ? 0 : (i % 2 ? 2.6 : -2.6); tx = H.x - dirOf(def) * gap; ty = H.y + side; }
    p.ov = OV(clamp(tx, 1, 104), clamp(ty, 1, 67), hyp(p.x - tx, p.y - ty) > 5 ? SPRINT : RUN, "stage");
    if (hyp(p.x - tx, p.y - ty) > 2.5) arrived = false;
  });
  // 한쪽으로 몰린 장면: 상대 필드 선수들이 공 쪽 측면으로 좁혀 들어옴 (반대편 측면이 빔)
  if (st.shift) {
    if (!st.shiftY) st.shiftY = new Map(S.P.filter(p => p.team === def && p.pos !== "GK" && !st.pressers.includes(p)).map(p => [p, [p.x, clamp(p.y + (H.y - p.y) * 0.45, 3, 65)]]));
    for (const [p, t] of st.shiftY) { p.ov = OV(t[0], t[1], RUN, "stage"); if (hyp(p.x - t[0], p.y - t[1]) > 3) arrived = false; }
  }
  // 빈 공간 장면: 공 가진 선수 앞 12m 길목의 상대는 옆으로 비켜남 (한 박자 늦게 돌아오는 모습)
  if (st.clear) {
    const g = dirOf(H.team);
    for (const p of S.P) {
      if (p.team !== def || p.pos === "GK" || st.pressers.includes(p)) continue;
      const ax = (p.x - H.x) * g;
      if (ax > -1.5 && ax < 13.5 && Math.abs(p.y - H.y) < 8.5) {
        const sy = p.y >= H.y ? 1 : -1;
        let ty = H.y + sy * 9.5; if (ty < 2 || ty > 66) ty = H.y - sy * 9.5;
        p.ov = OV(clamp(p.x - g * 3, 1, 104), clamp(ty, 1, 67), SPRINT, "stage");
        arrived = false;
      } else if (p.ov?.stage) p.ov = null;
    }
  }
  const me = meOf(S);
  if (me && H.team !== me.team && st.mePress !== false && !(st.moves || []).some(mv => mv[0] === me)) me.ov = OV(clamp(H.x - dirOf(me.team) * (st.meGap ?? 2.4), 1, 104), H.y + (34 - H.y) * 0.1, RUN, "stage");
  if (st.gk) { const g = gkOf(S, def); if (g) g.ov = OV(clamp(H.x + dirOf(H.team) * st.gk, 1, 104), 34 + (H.y - 34) * 0.4, 7, "stage"); }
  // 미리 움직일 선수들이 그 자리에 왔는지 (몰고 가는 선수는 ov가 풀리지 않게 다시 걸어 둠)
  if (st.moves) for (const [p, x, y, v, tag] of st.moves) {
    const tx = clamp(x, 1, 104), ty = clamp(y, 1.5, 66.5);
    if (hyp(p.x - tx, p.y - ty) > 2.2) { arrived = false; if (!p.ov) p.ov = OV(tx, ty, v ?? RUN, tag === "carry" && p === S.holder ? "carry" : "stage"); }
  }
  // 상대 공 장면: 내가 그 선수 가까이 붙을 때까지 (최대 2.5초 더). 화면에서 "막아야 한다" 때 내가 멀리 있지 않게
  const close = !me || H.team === me.team || st.mePress === false || hyp(me.x - H.x, me.y - H.y) < (st.meGap ?? 2.4) + 2.5;
  // 센터백 둘을 막는 장면(mark2)은 두 번째 상대가 닿을 때까지 조금 더 기다림
  if (S.t >= st.until && ((close && arrived) || S.t >= st.until + (st.mark2 || st.moves ? 4 : 2.5))) { S.stage = null; for (const p of S.P) if (p.ov?.stage) p.ov = null; if (H.ov) H.ov = null; }
}
export function stageDone(S) { return !S.stage; }

// ── 대본: 내 장면 선택 결과를 경기장에서 실제로 일어나게 함 ──
// 단계: { do: "shot", by, result, kind } { do: "pass", from, to, air } { do: "carry", by, dist } { do: "steal", by }
//       { do: "give", to } { do: "restart", kind, team, x, y, taker, then:[...] } { do: "emit", lines } { do: "wait", t }
export function setScript(S, steps) { S.script = steps.slice(); S.scur = null; S.stage = null; S.pickOnly = null; for (const p of S.P) if (p.ov?.stage) p.ov = null; }
function runScript(S) {
  for (let guard = 0; guard < 6; guard++) {
    if (S.scur) {
      const c = S.scur;
      if (c.until && !c.until(S)) { if (S.t < c.deadline) return; S.timeouts = (S.timeouts || 0) + 1; S.pickOnly = null; if (S.trace) S.trace.push({ t: S.t, k: "timeout", step: c.name }); }
      S.scur = null;
    }
    const st = S.script.shift();
    if (!st) { if (S.trace && !S.traceEnd) { S.traceEnd = true; S.trace.push({ t: S.t, k: "end", team: S.restart ? S.restart.team : S.holder ? S.holder.team : null, restart: S.restart?.kind || null, fl: !!S.ball.fl }); } return; }
    S.traceEnd = false;
    S.scur = startStep(S, st);
    if (S.scur) S.scur.name = st.do + (st.by ? ":" + st.by.name : st.to ? ":" + st.to.name : "");
  }
}
function startStep(S, st) {
  const busy = (fn, max = 6) => ({ until: fn, deadline: S.t + max });
  const ready = () => !S.ball.fl && S.phase === "play";
  if (st.do === "emit") { emit(S, "lines", { lines: st.lines }); return null; }
  if (st.do === "runTo") { const p = st.p; if (p && p !== S.holder) p.ov = OV(clamp(st.x, 2, 103), clamp(st.y, 2, 66), st.v ?? SPRINT, "recv"); return null; }   // 공 없는 선수가 먼저 뛰어 들어감
  if (st.do === "waitNear") { const { p } = st; if (st.hold && S.holder === st.hold) st.hold.ov = OV(st.hold.x, st.hold.y, 1.5, "carry"); return busy(() => hyp(p.x - st.x, p.y - st.y) < (st.r ?? 3), st.max ?? 3); }
  if (st.do === "wait") { const end = S.t + st.t; return busy(() => S.t >= end, st.t + 0.1); }
  if (st.do === "give") { const p = st.to; if (hyp(p.x - S.ball.x, p.y - S.ball.y) > 2.5 && !S.ball.fl) { launch(S, p.x, p.y, { T: 0.3, kind: "pass" }); return busy(() => !S.ball.fl, 1); } give(S, p); S.decideAt = S.t + range(0.4, 0.8); return null; }
  if (st.do === "steal") {
    // 공 가진 선수는 거의 멈추고, 빼앗는 선수가 달려가 발을 넣음 (공이 미끄러져 붙지 않게 실제로 닿을 때까지)
    const p = st.by, H = S.holder;
    if (H === p) return null;
    if (H) { H.stun = 0.8; H.ov = OV(H.x, H.y, 1.2); }
    S.pickOnly = p;
    emit(S, "steal", { by: p.name, team: p.team, victim: H?.name, silent: true });
    return { until: S2 => { const b = S2.ball; p.ov = OV(b.x, b.y, SPRINT);
        if (S2.holder === p) { p.ov = null; S2.pickOnly = null; return true; }
        if (!b.fl && hyp(p.x - b.x, p.y - b.y) < 1.4) { p.ov = null; give(S2, p); S2.decideAt = S2.t + range(0.3, 0.6); S2.pickOnly = null; return true; }
        return false; },
      deadline: S.t + 1.2 + hyp(p.x - S.ball.x, p.y - S.ball.y) / 7.5 };
  }
  // 걷어 내기 / 밖으로 차기: 공에 닿은 뒤 멀리 (out: "touch" 터치라인 밖, "goal" 골라인 밖)
  if (st.do === "clear") {
    const p = st.by, H = S.holder;
    if (H && H !== p) { H.stun = 0.8; H.ov = OV(H.x, H.y, 1.2); }
    S.pickOnly = p;
    const kick = S2 => {
      S2.pickOnly = null; p.ov = null;
      const g = dirOf(p.team), b = S2.ball;
      let tx = clamp(b.x + g * range(20, 32), 2, 103), ty = clamp(b.y + range(-14, 14), 3, 65);
      if (st.out === "touch") { tx = clamp(b.x + g * range(4, 12), 2, 103); ty = b.y < 34 ? -3 : 71; }
      if (st.out === "goal") { tx = p.team === "us" ? 108 : -3; ty = clamp(b.y + range(-10, 10), 10, 58); }
      S2.last = p; S2.lastTeam = p.team; S2.holder = null;
      emit(S2, "clear", { by: p.name, team: p.team, me: p.me, x: ox(p.team, b.x), silent: true });
      launch(S2, tx, ty, { air: true, h: st.out ? 3 : 6, kind: "clear", then: S3 => landLoose(S3) });
    };
    return { until: S2 => { const b = S2.ball; if (b.fl) return false;
        if (S2.holder === p || hyp(p.x - b.x, p.y - b.y) < 1.5) { kick(S2); return true; }
        p.ov = OV(b.x, b.y, SPRINT); return false; },
      deadline: S.t + 1.2 + hyp(p.x - S.ball.x, p.y - S.ball.y) / 7.5 };
  }
  // 가로채기: from이 to에게 준 패스를 by가 길목에서 끊음
  if (st.do === "passCut") {
    const { from, to } = st;
    if (S.holder !== from) return null;
    const b = S.ball, dx = to.x - b.x, dy = to.y - b.y, L2 = Math.max(1, dx * dx + dy * dy);
    // 패스 길 위에서 가장 빨리 닿을 수 있는 상대가 끊음 (문장이 이름을 말하면 그 선수, 단 너무 멀면 가까운 선수)
    const reach = (o, uu) => hyp(o.x - (b.x + dx * uu), o.y - (b.y + dy * uu)) / 8.2 - (st.air ? 0.35 : 0.12) - uu * Math.sqrt(L2) / (st.air ? 26 : 15.5);
    const bestU = o => { let bu = 0.5, bv = 1e9; for (let uu = 0.25; uu <= 0.86; uu += 0.05) { const v = reach(o, uu); if (v < bv) { bv = v; bu = uu; } } return [bu, bv]; };
    let [u, slack] = bestU(st.by);
    if (slack > 1.2) { for (const o of S.P) if (o.team !== from.team && o.ri && o.pos !== "GK") { const [uu, vv] = bestU(o); if (vv < slack) { slack = vv; u = uu; st.by = o; } } }
    const cutBy = st.by, P = [b.x + dx * u, b.y + dy * u];
    const T = Math.max((st.air ? 0.35 + hyp(P[0] - b.x, P[1] - b.y) / 26 : 0.15 + hyp(P[0] - b.x, P[1] - b.y) / 15.5), hyp(cutBy.x - P[0], cutBy.y - P[1]) / 8.2 + 0.1);
    const by = cutBy;
    S.last = from; S.lastTeam = from.team; from.ov = null;
    emit(S, "pass", { from: from.name, to: to.name, team: from.team, kind: "ground", me: from.me, toMe: to.me, silent: true });
    by.ov = OV(P[0], P[1], SPRINT, "recv");
    S.pickOnly = by;
    launch(S, P[0], P[1], { kind: "pass", T, air: !!st.air, h: st.air ? 3.5 : undefined, then: S2 => { S2.pickOnly = null;
      if (hyp(by.x - P[0], by.y - P[1]) < 2.8) {
        if (st.air && st.headClear) { emit(S2, "header", { by: by.name, team: by.team, me: by.me, from: from.name, r: to.name, x: P[0], silent: true }); S2.last = by; S2.lastTeam = by.team;
          launch(S2, clamp(P[0] + dirOf(by.team) * range(14, 22), 2, 103), clamp(P[1] + range(-10, 10), 2, 66), { air: true, h: 5, kind: "clear", then: S3 => landLoose(S3) }); return; }
        give(S2, by); emit(S2, "intercept", { by: by.name, team: by.team, from: from.name, r: to.name, me: by.me, silent: true });
      } else { S2.pickOnly = by; by.ov = OV(P[0], P[1], SPRINT, "recv"); landLoose(S2); } } });
    return busy(() => !S.ball.fl && (S.holder === by || S.phase !== "play" || (st.air && st.headClear && S.holder !== from)), T + 2.5);   // 머리로 걷어 낸 공은 떨어지면 끝
  }
  // 제치기: by가 공을 몰고 victim을 지나쳐 감 (victim은 잠깐 멈칫)
  if (st.do === "beat") {
    const p = st.by, v = st.victim;
    if (S.holder !== p) return null;
    if (v) { v.stun = 1.2; v.ov = OV(v.x, v.y, 1); }
    const g = dirOf(p.team), tx = clamp(p.x + g * (st.dist ?? 9), 3, 102), ty = clamp(p.y + (v && Math.abs(v.y - p.y) < 3 ? (p.y < 34 ? 3 : -3) : 0), 3, 65);
    p.ov = OV(tx, ty, 8, "carry");
    return busy(S2 => { if (hyp(p.x - tx, p.y - ty) < 0.8 || S2.holder !== p) { if (v) v.ov = null; return true; } return false; }, (st.dist ?? 9) / 7 + 1);
  }
  if (st.do === "carry") {
    const p = st.by;
    if (S.holder !== p) {
      // 공이 멀리 있으면 먼저 가서 잡고 나서 몰고 감 (공이 미끄러져 붙지 않게)
      if (S.ball.fl || hyp(p.x - S.ball.x, p.y - S.ball.y) > 2.5) { S.script.unshift({ ...st, reached: true }); return st.reached ? null : startStep(S, { do: "steal", by: p }); }
      give(S, p);
    }
    const g = dirOf(p.team);
    const dist = st.toGoal != null ? clamp(105 - ox(p.team, p.x) - st.toGoal, 0, 60) : st.dist ?? 9;   // toGoal: 골문에서 이만큼 남을 때까지
    if (dist < 1) return null;
    const ty0 = st.toGoal != null ? p.y + (34 - p.y) * 0.45 : p.y + (st.dy ?? (34 - p.y) * 0.25);
    const tx = clamp(p.x + g * dist, 3, 102), ty = clamp(ty0, 3, 65);
    p.ov = OV(tx, ty, st.v ?? 7.6, "carry");
    for (const o of S.P) if (o.team !== p.team && hyp(o.x - p.x, o.y - p.y) < (st.beat ? 7 : 4) && (o.pos !== "GK" || st.roundGK)) o.stun = st.beat ? 1.3 : 0.9;   // 제친 수비는 잠깐 휘청
    if (st.gkOut) { const gk = gkOf(S, other(p.team)); if (gk) { const gx = p.team === "us" ? 105 : 0, k = 0.38; gk.ov = OV(gx + (tx - gx) * k, 34 + (ty - 34) * k, RUN, "recv"); } }   // 골키퍼가 각을 좁히며 나옴
    return busy(S2 => hyp(p.x - tx, p.y - ty) < 0.8 || S2.holder !== p, hyp(tx - p.x, ty - p.y) / (st.v ?? 7.6) + 2.2);   // 옆으로 길게 모는 경우도 시간 넉넉히
  }
  // 공간 패스: 받을 선수가 먼저 뛰기 시작하고, 공은 그 선수가 닿을 빈 공간(수비 라인 뒤·사이)으로
  // air: 수비 머리 위로 띄움(뒷공간 한 방) / cross: 박스 안으로 / cut: 컷백(받는 선수가 뒤에서 들어옴) / overhit: 너무 길어서 골키퍼가 잡음
  if (st.do === "space") {
    const { from, to } = st, team = from.team, g = dirOf(team);
    if (S.holder !== from) give(S, from);
    const fx = ox(team, from.x), rx = ox(team, to.x), ry = to.y;
    let px, py;
    if (st.cross) { px = range(92, 96); py = 34 + (ry < 34 ? -1 : 1) * range(1, 5); }
    else if (st.cut) { px = range(88, 91.5); py = 34 + (from.y < 34 ? 1 : -1) * range(0, 5); }
    else {
      const line = offLine(S, team);
      px = clamp(Math.max(rx + (st.air ? 11 : 8), line + (st.air ? 6 : 4)), fx + 6, st.overhit ? 98 : 90);
      py = ry + (34 - ry) * (st.air ? 0.15 : 0.3);
      if (st.wide) { px = clamp(rx + 6, fx - 4, 88); py = ry; }
      if (st.along) { px = clamp(rx + 9, fx + 4, 88); py = ry + (ry < 34 ? -1.5 : 1.5); }   // 터치라인을 따라 달리는 선수 앞으로 (오버래핑)
    }
    if (st.overhit) { px = Math.max(px, 95.5); py = 34 + (py - 34) * 0.4; }
    const tp = [clamp(ox(team, px), 2, 103), clamp(py, 3, 65)];
    const d = hyp(tp[0] - S.ball.x, tp[1] - S.ball.y);
    S.last = from; S.lastTeam = team; S.chain.push(from); from.ov = null;
    emit(S, "pass", { from: from.name, to: to.name, team, kind: st.cross ? "cross" : st.air ? (d > 40 ? "long" : "air") : "through", fx, fy: oy(team, from.y), tx: px, ty: oy(team, tp[1]), me: from.me, toMe: to.me, silent: true });
    const air = !!(st.air || st.cross);
    const T0 = air ? 0.35 + d / 26 : 0.12 + d / 15.5;
    const need = hyp(to.x - tp[0], to.y - tp[1]) / 8.4 + 0.15;           // 받을 선수가 그 자리에 닿는 시간만큼은 날아감
    const T = Math.max(T0, st.overhit ? T0 : need);
    to.ov = OV(tp[0] - g * 0.4, tp[1], SPRINT, "recv");
    // 수비: 가장 가까운 한 명이 반 박자 늦게 따라감 (뒷공간 경주)
    const chaser = S.P.filter(p => p.team !== team && p.ri && p.pos !== "GK" && !p.stun).sort((a, b) => hyp(a.x - tp[0], a.y - tp[1]) - hyp(b.x - tp[0], b.y - tp[1]))[0];
    if (chaser && !st.cross) chaser.ov = OV(tp[0] - g * 2.2, tp[1] + (chaser.y < tp[1] ? -1.2 : 1.2), 7.6, "recv");
    const gk = gkOf(S, other(team));
    if (st.overhit && gk) gk.ov = OV(tp[0], tp[1], SPRINT, "recv");
    launch(S, tp[0], tp[1], { air, T, h: st.cross ? 3.2 : st.air ? Math.min(9, 2.5 + d * 0.12) : undefined, kind: "pass", then: S2 => {
      if (st.overhit && gk) { give(S2, gk); return; }                                   // 문장은 결과 문장이 말함 (골키퍼가 잡는다)
      if (hyp(to.x - tp[0], to.y - tp[1]) < 2.6) give(S2, to);
      else { S2.pickOnly = to; S2.holder = null; S2.ball.fl = null; S2.ball.roll = null; to.ov = OV(tp[0], tp[1], SPRINT, "recv"); }   // 공은 그 자리에 멈추고 받을 선수가 달려가 잡음 (밖으로 나가지 않게)
    } });
    return busy(() => !S.ball.fl && S.holder === (st.overhit && gk ? gk : to), T + 3);
  }
  if (st.do === "pass") {
    const { from, to } = st;
    if (S.holder !== from) {
      if (S.ball.fl || hyp(from.x - S.ball.x, from.y - S.ball.y) > 2.5) { if (st.reached) return null; S.script.unshift({ ...st, reached: true }); return startStep(S, { do: "steal", by: from }); }
      give(S, from);
    }
    const g = dirOf(to.team);
    const tp = st.tp || [clamp(to.x + g * (st.lead ?? 2), 2, 103), clamp(to.y, 2, 66)];
    passTo(S, from, to, tp, { air: !!st.air, cross: !!st.cross, force: true, kind: st.kind || (st.air ? "air" : "ground") });
    if (S.ball.fl) {
      const need = hyp(to.x - tp[0], to.y - tp[1]) / 8.2 + 0.1;              // 받을 선수가 그 자리에 닿을 시간만큼은 공이 날아가게 (도착 전에 공이 미끄러져 붙지 않게)
      if (S.ball.fl.T < need) S.ball.fl.T = need;
      S.ball.fl.then = S2 => { give(S2, to); };
    }
    return busy(() => !S.ball.fl, (S.ball.fl?.T ?? 0) + 1.5);
  }
  if (st.do === "shot") {
    const p = st.by;
    if (S.holder !== p) { if (hyp(p.x - S.ball.x, p.y - S.ball.y) > 3) { S.ball.fl = null; S.ball.x = p.x + dirOf(p.team) * 0.8; S.ball.y = p.y; } give(S, p); }
    shoot(S, p, { result: st.result, kind: st.kind || "shot", assist: st.assist ?? null, silent: true, saveKind: st.saveKind || null, blocker: st.blocker || null, parryTo: st.parryTo || null });
    return busy(() => !S.shot, 4);                         // 슈팅 결과가 나는 순간 다음 단계(중계 문장)로
  }
  if (st.do === "restart") {
    setRestart(S, st.kind, st.team, st.x, st.y);
    S.restart.taker = st.taker || null;
    S.restart.script = true;
    S.restart.at = S.t + (st.delay ?? 1.4);
    S.restart.pack = !!st.pack;                          // 먼 프리킥: 박스 안에 모임
    if (st.runner) st.runner.ov = OV(st.runTo[0], st.runTo[1], SPRINT, "recv");   // 받을 동료는 먼저 박스로 뛰어 들어감 (공을 받으면 풀림)
    return busy(S2 => S2.phase === "play" && !S2.restart, (st.delay ?? 1.4) + 5);
  }
  // 몸으로 막아 공을 골라인 밖으로: 공은 천천히 굴러 라인을 넘고(마지막 터치는 상대 → 우리 골킥), 나는 공 옆에서 등으로 막고, 상대는 등 뒤에
  if (st.do === "shield") {
    const p = st.by, o = st.opp, b = S.ball;
    if (S.holder) { S.holder.ov = null; S.holder = null; }
    if (o) { S.last = o; S.lastTeam = o.team; }
    const gx = p.team === "us" ? -2.2 : 107.2, ty = clamp(b.y + (b.y < 34 ? -1 : 1), 2, 66);
    launch(S, gx, ty, { T: 1.5, kind: "pass", then: S2 => landLoose(S2) });
    const lx = p.team === "us" ? 0.9 : 104.1, g = dirOf(p.team);            // 공과 함께 라인 쪽으로 걸어가며 등으로 막음 (착지하면 풀림)
    p.ov = OV(lx, clamp(ty + (ty < 34 ? 1.1 : -1.1), 1, 67), 4.4, "recv");
    if (o) { o.stun = 1.4; o.ov = OV(lx + g * 1.6, clamp(ty + (ty < 34 ? 2.4 : -2.4), 1, 67), 4.2, "recv"); }
    return busy(S2 => !S2.ball.fl, 2.2);
  }
  if (st.do === "release") { S.decideAt = S.t + 0.3; return null; }
  return null;
}
// 대본이 다 끝났는지
export const scriptDone = S => !S.script.length && !S.scur;
export const isDead = S => S.phase === "dead";
