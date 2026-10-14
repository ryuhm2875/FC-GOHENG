// 경기장 움직임: 22명이 대형을 지키며 공 위치에 따라 움직이고, 공은 패스·드리블·슈팅처럼 굴러가거나 떠서 날아감
// 결과는 엔진(engine/match.js)이 정하고, 여기서는 중계 문장(공 위치·소유 팀·공 가진 선수)을 움직임으로 옮기기만 함
// 좌표는 엔진 기준(우리 팀이 오른쪽 +x로 공격, 105×68). 후반 진영 교체는 그릴 때만 뒤집음
import { SCENES } from "../../data/scenes.js";

const ROLES = { GK: ["GK"], DF: ["LB", "LCB", "RCB", "RB"], MF: ["LM", "LCM", "RCM", "RM"], FW: ["ST1", "ST2"] };
// 4-4-2. 자기 진영 기준 [수비 라인에서 앞으로 몇 m, 좌우 비율(−1 왼쪽 터치라인 쪽 ~ 1 오른쪽)]. d 수비할 때, a 공격할 때
// 공격할 때는 왼쪽 풀백이 높이 오르고 왼쪽 미드필더가 안쪽(하프스페이스)으로 좁혀 2-3-5에 가까워짐
const FORM = {
  LB: { d: [0, -0.88], a: [20, -0.95] }, LCB: { d: [0, -0.3], a: [0, -0.42] }, RCB: { d: [0, 0.3], a: [0, 0.42] }, RB: { d: [0, 0.88], a: [14, 0.95] },
  LM: { d: [11, -0.92], a: [30, -0.6] }, LCM: { d: [11, -0.28], a: [11, -0.14] }, RCM: { d: [11, 0.28], a: [19, 0.2] }, RM: { d: [11, 0.92], a: [31, 0.88] },
  ST1: { d: [24, -0.2], a: [41, -0.14] }, ST2: { d: [22, 0.22], a: [38, 0.24] },
};
// 수비 블록 높이: [공에서 몇 m 뒤에 라인, 라인 최소, 라인 최대] (자기 골문에서 잰 거리)
const BLOCK = { low: [24, 9, 24], mid: [25, 16, 38], high: [21, 24, 50] };
const KICKOFF_X = { GK: 4, DF: 25, MF: 37, FW: 47 };
const JOG = 6.2, RUN = 7.4, SPRINT = 8.6, DRIBBLE = 5.8;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const own = (team, [x, y]) => team === "us" ? [x, y] : [105 - x, 68 - y];      // 절대 좌표 ↔ 그 팀 기준 좌표 (같은 식으로 왕복)
const dirOf = team => team === "us" ? 1 : -1;                                   // 공격 방향 (절대 x)
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const other = t => t === "us" ? "them" : "us";

export function createPitch({ svg, players, dotEls, ballEl, shadowEl, calm = false, blocks = {} }) {
  const T = players;
  for (const p of T) {
    const [, pos, i] = p.id.split("-");
    p.role = ROLES[pos][+i] || pos;
    p.tx = p.x; p.ty = p.y; p.speed = JOG; p.ov = null; p.press = false;
    p.vx = 0; p.vy = 0; p.ph = [Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3];
    const el = dotEls[p.id]; if (el) el.style.transform = "";        // 위치는 SVG transform 속성으로 (아이폰 사파리에서 더 부드러움)
  }
  ballEl.style.transform = ""; shadowEl.style.transform = "";
  const S = {
    ball: { x: 52.5, y: 34, z: 0, fl: null }, holder: null, poss: "us", pending: null,
    block: { us: blocks.us || "mid", them: blocks.them || "mid" }, scale: 1, flipped: false,
    queue: [], cur: null, wait: 0, done: null, chasers: [], frozen: false, clock: 0,
  };
  let raf = 0, last = 0, idle = 0;

  // ── 대형 ──
  function shape(team) {
    const att = S.poss === team;
    const [bx, by] = own(team, S.focus || [S.ball.x, S.ball.y]);       // 장면 중에는 장면 공 자리 기준으로 대형을 잡음
    const out = {};
    let line, W, cy;
    if (att) { line = clamp(bx - 31, 12, 58); W = 29; cy = 34 + (by - 34) * 0.15; }
    else {
      const [back, lo, hi] = BLOCK[S.block[team]] || BLOCK.mid;
      line = clamp(bx - back, lo, Math.min(hi, Math.max(lo, bx - 4)));
      W = 17; cy = clamp(34 + (by - 34) * 0.55, 19, 49);
      if (S.forceLine && S.forceLine.team === team) line = own(team, [S.forceLine.x, 0])[0];   // 장면: 수비 라인이 이미 뚫림
    }
    const stretch = att ? 1.05 : S.block[team] === "high" && bx > 70 ? 1.5 : 0.95;     // 전방 압박 때는 앞줄이 상대 수비수에게 붙음
    for (const [role, f] of Object.entries(FORM)) {
      const [rx, ry] = att ? f.a : f.d;
      out[role] = [line + rx * stretch, cy + ry * W];
    }
    // 공이 상대 박스 근처면 공격수·미드필더가 문전과 박스 앞을 채움
    if (att && bx > 80) {
      const fy = by < 34 ? 1 : -1;                                     // 먼 쪽
      out.ST1 = [Math.max(out.ST1[0], 96), 34 - fy * 3];
      out.ST2 = [Math.max(out.ST2[0], 92.5), 34 + fy * 5];
      const farWing = fy > 0 ? "RM" : "LM";
      out[farWing] = [Math.max(out[farWing][0], 89), 34 + fy * 11];
      out.RCM = [Math.max(out.RCM[0], 80), 34 + fy * 4];
    }
    out.GK = att ? [clamp(line * 0.38, 4, 17), 34 + (by - 34) * 0.15] : [clamp(3 + (bx - 25) * 0.06, 3, 8), 34 + (by - 34) * 0.32];
    return out;
  }
  function targets() {
    const att = S.poss || "us", def = other(att);
    const shD = shape(def), shA = shape(att);
    const lastDef = Math.min(...["LB", "LCB", "RCB", "RB"].map(r => shD[r][0]));
    const ballAtt = own(att, [S.ball.x, S.ball.y])[0];
    const offAtt = Math.max(105 - lastDef, ballAtt) - 0.6;               // 오프사이드: 상대 마지막 수비수와 공보다 앞서지 않음
    for (const p of T) {
      const sh = p.team === att ? shA : shD;
      let [x, y] = sh[p.role] || [52.5, 34];
      if (p.team === att && p.role !== "GK") x = Math.min(x, offAtt);
      [x, y] = own(p.team, [x, y]);
      // 제자리에 서 있지 않고 늘 조금씩 움직임 (자리를 고쳐 잡는 걸음)
      const a = p.role === "GK" ? 0.35 : 1, c = S.clock, f = p.ph;
      x += a * (1.3 * Math.sin(c * 0.43 + f[0]) + 0.6 * Math.sin(c * 1.17 + f[1]));
      y += a * (1.1 * Math.sin(c * 0.37 + f[2]) + 0.5 * Math.sin(c * 0.91 + f[3]));
      p.tx = clamp(x, 1.5, 103.5); p.ty = clamp(y, 1.5, 66.5); p.speed = JOG; p.press = false;
    }
    const H = S.holder;
    const free = !S.ball.fl && !(H && H.role === "GK");
    // 압박: 공에 가장 가까운 수비 팀 선수가 나가고, 두 번째가 뒤를 받침
    if (free && S.poss && !S.chasers.length && !S.noPress) {
      const g = -dirOf(def);
      const cands = T.filter(p => p.team === def && p.role !== "GK" && !p.ov).map(p => ({ p, d: Math.hypot(p.x - S.ball.x, p.y - S.ball.y) })).sort((a, b) => a.d - b.d);
      if (cands[0] && cands[0].d < 22) { const p = cands[0].p; p.tx = S.ball.x + g * 3; p.ty = S.ball.y + (34 - S.ball.y) * 0.06; p.speed = RUN; p.press = true; }
      if (cands[1] && cands[1].d < 16) { const p = cands[1].p; p.tx = S.ball.x + g * 7; p.ty = S.ball.y + (34 - S.ball.y) * 0.3; p.speed = 6.8; }
    }
    for (const c of S.chasers) {                                          // 장면에서 정한 압박: 공을 향해 계속 좁혀 감
      const p = c.p; if (p.ov) continue;
      const g = -dirOf(p.team);
      p.tx = S.ball.x + g * Math.max(2.8, c.gap); p.ty = S.ball.y + c.side; p.speed = c.v; p.press = true;
    }
    for (const p of T) if (p.ov?.keep && Math.hypot(p.x - p.ov.x, p.y - p.ov.y) < 0.6) p.ov = null;
    for (const p of T) if (p.ov) { p.tx = p.ov.x; p.ty = p.ov.y; p.speed = p.ov.v; }
    if (H && !H.ov && !S.ball.fl) { H.tx = H.x; H.ty = H.y; }            // 공 가진 선수는 대본이 없으면 그 자리에서 공을 지킴
    // 서로 너무 붙지 않게 (공 가진 선수·압박·대본 선수는 움직이지 않고 남이 비켜 줌)
    for (let it = 0; it < 2; it++) for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const a = T[i], b = T[j];
      const fa = a.press || a.ov || a === H || a.role === "GK", fb = b.press || b.ov || b === H || b.role === "GK";
      if (fa && fb) continue;
      let dx = b.tx - a.tx, dy = b.ty - a.ty, d = Math.hypot(dx, dy);
      const MIN = 4;
      if (d >= MIN) continue;
      if (d < 0.01) { dx = 0; dy = 1; d = 1; }
      const k = (MIN - d) / d, ka = fa ? 0 : fb ? 1 : 0.5, kb = fb ? 0 : fa ? 1 : 0.5;
      a.tx -= dx * k * ka; a.ty -= dy * k * ka; b.tx += dx * k * kb; b.ty += dy * k * kb;
    }
  }

  // ── 움직임 ──
  // 가속도가 있어서 갑자기 서거나 튀어 나가지 않음 (최대 가속 16m/s²)
  function movePlayers(dt) {
    let moving = false;
    const ACC = 16 * dt;
    for (const p of T) {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      const v = d < 0.02 ? 0 : Math.min(p.speed, d * 2.2);
      const wx = d < 0.02 ? 0 : dx / d * v, wy = d < 0.02 ? 0 : dy / d * v;
      let ax = wx - p.vx, ay = wy - p.vy; const am = Math.hypot(ax, ay);
      const acc = p.ov && p.ov.v >= 12 ? ACC * 2 : ACC;                // 장면 준비처럼 빨리 모일 때는 더 빨리
      if (am > acc && am > 0) { ax *= acc / am; ay *= acc / am; }
      p.vx += ax; p.vy += ay;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp < 0.01) continue;
      moving = true;
      let mx = p.vx * dt, my = p.vy * dt;
      if (Math.hypot(mx, my) > d && d < 0.5) { mx = dx; my = dy; p.vx *= 0.5; p.vy *= 0.5; }   // 목표를 지나치지 않게
      p.x += mx; p.y += my;
    }
    return moving;
  }
  // 공을 공 가진 선수 발밑으로. 멀리 있으면 순간이동하지 않고 moveBall에서 따라붙음
  function toFeet(force) {
    const h = S.holder; if (!h) return;
    const fx = clamp(h.x + dirOf(h.team) * 0.9, 0.4, 104.6), fy = h.y;
    if (force || Math.hypot(fx - S.ball.x, fy - S.ball.y) < 1.2) { S.ball.x = fx; S.ball.y = fy; S.ball.z = 0; }
  }
  function moveBall(dt) {
    const f = S.ball.fl;
    if (!f) {
      if (S.pending && Math.hypot(S.pending.x - S.ball.x, S.pending.y - S.ball.y) < 1.6) { take(S.pending); }
      const h = S.holder;
      if (h) {
        const fx = clamp(h.x + dirOf(h.team) * 0.9, 0.4, 104.6), fy = h.y;
        const dx = fx - S.ball.x, dy = fy - S.ball.y, d = Math.hypot(dx, dy);
        const step = Math.min(d * (1 - Math.exp(-dt * 16)), 42 * dt + (d < 2 ? d : 0));   // 멀리 있으면 굴러서 감 (초속 42m 이하)
        if (d > 0.001) { S.ball.x += dx / d * step; S.ball.y += dy / d * step; }
        S.ball.z *= Math.exp(-dt * 10);
      }
      return;
    }
    f.u = Math.min(1, f.u + dt / f.T);
    const e = f.air ? f.u : 1 - (1 - f.u) ** 2;
    S.ball.x = f.x0 + (f.x1 - f.x0) * e; S.ball.y = f.y0 + (f.y1 - f.y0) * e;
    S.ball.z = (f.air ? f.h * 4 * f.u * (1 - f.u) : 0) + f.z0 * Math.max(0, 1 - f.u * 3);   // 떠 있던 공은 이어서 내려옴
    if (f.u >= 1) { S.ball.fl = null; S.ball.z = 0; const cb = f.done; f.done = null; cb?.(); }
  }
  function launch(x1, y1, { air = false, Tsim, h, done, shot = false } = {}) {
    const x0 = S.ball.x, y0 = S.ball.y, d = Math.hypot(x1 - x0, y1 - y0);
    const T0 = air ? 0.42 + d / 21 : 0.1 + d / 18;
    const Tmin = shot ? 0.08 : Math.max(0.08, d / (air ? 36 : 32));      // 패스·걷어 내기는 초속 32~36m보다 빠르지 않게
    S.ball.fl = { x0, y0, x1, y1, T: Math.max(Tmin, Tsim != null ? Math.min(T0, Tsim) : T0), u: 0, air, h: h ?? Math.min(6.5, d * 0.2), done, z0: S.ball.z || 0 };
    S.holder = null;
    return S.ball.fl.T;
  }
  function take(p) {
    S.holder = p; S.pending = null; S.poss = p.team;
    if (p.ov && p.ov.recv) p.ov = null;
  }

  // ── 그리기 ──
  const SX = x => (S.flipped ? 105 - x : x), SY = y => (S.flipped ? 68 - y : y);
  const put = (el, v) => { if (el._t !== v) { el._t = v; el.setAttribute("transform", v); } };
  function render() {
    for (const p of T) {
      const el = dotEls[p.id];
      if (el) put(el, `translate(${SX(p.x).toFixed(2)} ${SY(p.y).toFixed(2)})`);
    }
    const b = S.ball, x = SX(b.x), y = SY(b.y);
    put(ballEl, `translate(${x.toFixed(2)} ${(y - b.z).toFixed(2)}) scale(${(1 + b.z * 0.06).toFixed(3)})`);
    put(shadowEl, `translate(${x.toFixed(2)} ${(y + 0.7).toFixed(2)}) scale(${Math.max(0.5, 1 - b.z * 0.07).toFixed(3)})`);
    const op = Math.max(0.25, 1 - b.z * 0.1).toFixed(2);
    if (shadowEl._o !== op) { shadowEl._o = op; shadowEl.setAttribute("opacity", op); }
  }

  // ── 대본 실행 (장면 연출) ──
  function runQueue(dt) {
    if (S.cur) {
      const c = S.cur;
      if (c.until && c.until()) S.cur = null;
      else if (c.t != null && (c.t -= dt) <= 0) { S.cur = null; c.timeout?.(); }
      if (S.cur) return true;
    }
    if (S.wait > 0) { S.wait -= dt; return true; }
    const st = S.queue.shift();
    if (!st) { if (S.done) { const d = S.done; S.done = null; d(); } return false; }
    st();
    return true;
  }

  function frame(now) {
    raf = 0;
    const dtr = clamp((now - last) / 1000, 0, 0.1); last = Math.max(last, now);   // 느린 휴대폰에서도 시간은 제대로 흐르게 (첫 프레임 시각이 앞설 때는 0)
    const dt = dtr * S.scale * (S.boost || 1);
    S.clock += dtr;
    const busy = runQueue(dt);
    targets();
    const moving = movePlayers(dt);
    moveBall(dt);
    render();
    if (moving || S.ball.fl || busy || S.pending) idle = 0; else idle += dtr;
    if (!S.dead) raf = requestAnimationFrame(frame);                // 경기 중에는 늘 조금씩 움직임 (다른 앱으로 가면 멈춤)
  }
  function wake() {
    idle = 0;
    if (calm) return snap();
    if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  // 움직임 줄이기: 애니메이션 없이 바로 끝 상태로
  function snap() {
    for (let k = 0; k < 40 && (S.queue.length || S.cur || S.wait > 0); k++) {
      S.cur = null; S.wait = 0;
      if (S.ball.fl) { const f = S.ball.fl; f.u = 1; moveBall(0); }
      runQueue(0);
    }
    if (S.ball.fl) { S.ball.fl.u = 1; moveBall(0); }
    if (S.done) { const d = S.done; S.done = null; d(); }
    for (let k = 0; k < 3; k++) {
      targets();
      for (const p of T) { p.x = p.tx; p.y = p.ty; }
      if (S.pending) take(S.pending);
      toFeet(true);
    }
    render();
  }
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake(); };
  document.addEventListener("visibilitychange", onVis);

  // ── 이름 → 선수 ──
  const byName = (name, team) => name ? (T.find(p => p.name === name && p.team === team) || T.find(p => p.name === name)) : null;
  const me = () => T.find(p => p.me);
  const nearest = (team, pt, f = () => true, n = 0) => T.filter(p => p.team === team && f(p)).sort((a, b) => Math.hypot(a.x - pt[0], a.y - pt[1]) - Math.hypot(b.x - pt[0], b.y - pt[1]))[n] || null;
  const isGkPt = (x) => x >= 99 || x <= 6;

  // ── 중계 문장 한 줄 → 움직임 (ms: 이 줄이 화면에 머무는 시간) ──
  // 돌려주는 값: 이 움직임에 필요한 실제 시간(ms). 화면은 이만큼 다음 줄을 기다릴 수 있음
  function line(l, ms) {
    if (!l || !l.ball) return 0;
    const [bx, by] = l.ball;
    S.chasers = S.chasers.filter(c => c.keep);
    // 킥오프 자리 (경기 시작, 후반 시작, 골 뒤, 전·후반 종료)
    if (bx === 52.5 && by === 34) { const first = l.k === "whistle" && !l.half2 && l.poss === "us" && !S.started; kickoff(l.poss || null, first); return first ? 0 : Math.round(1700 / S.scale); }
    // 주어진 시간 안에 끝내되, 먼 패스는 최대 1.35배까지 시간을 더 씀 (공이 비현실적으로 빠르지 않게)
    const base = Math.max(0.15, ms / 1000 * S.scale * 0.82);
    const d0 = Math.hypot(bx - S.ball.x, by - S.ball.y);
    const est = d0 > 27 ? 0.4 + d0 / 23 : 0.1 + d0 / 19;
    const avail = Math.max(base, Math.min(est, base * 1.35));
    act(l, bx, by, avail);
    return Math.round(avail / 0.82 / S.scale * 1000);
  }
  function act(l, bx, by, avail) {
    const actor = l.actor ? byName(l.actor, l.poss || (l.k === "them" ? "them" : "us")) : null;
    // 세트피스 배치: 공은 그 자리로 굴러가고 키커가 공 앞에 섬 (가로채기가 아님)
    if (l.set) {
      setPiece(l.set, l, actor);
      const [sx, sy] = l.ball;
      const kicker = actor || nearest(l.poss || "us", [sx, sy], p => p.role !== "GK");
      S.holder = null; S.pending = kicker || null; S.poss = l.poss || kicker?.team || S.poss;
      launch(sx, sy, { Tsim: avail });
      if (kicker) kicker.ov = { x: sx - dirOf(kicker.team) * 1.1, y: sy, v: clamp(Math.hypot(kicker.x - sx, kicker.y - sy) / Math.max(0.3, avail), RUN, 11), recv: true };
      return wake();
    }
    // 골
    if (l.k && l.k.startsWith("goal") && (bx >= 103.5 || bx <= 1.5)) return shot(bx, by, "goal", avail);
    // 골키퍼 선방
    // 골키퍼 선방: 상대 팀 문장에서 골키퍼가 공을 잡을 때만 (우리 골키퍼의 골킥·공 돌리기는 선방이 아님)
    const speak = /^(us|me|goal-us|goal-me)/.test(l.k || "") ? "us" : /^(them|goal-them)/.test(l.k || "") ? "them" : S.poss;
    if (actor && actor.role === "GK" && isGkPt(bx) && speak !== actor.team) return shot(bx, by, "save", avail, actor);
    // 골대
    if ((bx >= 104.2 || bx <= 0.8) && (Math.abs(by - 30.4) < 0.4 || Math.abs(by - 37.6) < 0.4)) return shot(bx, by, "post", avail);
    // 코너킥 키커가 코너 플래그로
    if ((bx >= 103 || bx <= 2) && (by <= 2 || by >= 66) && actor) return corner(actor, bx, by);
    // 밖으로 (빗나간 슈팅, 걷어 내기, 터치라인)
    if (bx > 104.4 || bx < 0.6 || by < 0.8 || by > 67.2) {
      const shotLike = S.holder && (bx > 104.4 || bx < 0.6) && Math.abs(by - 34) < 20;
      if (shotLike) return shot(bx, by, "wide", avail);
      S.poss = l.poss || S.poss;
      launch(clamp(bx, -0.5, 105.5), clamp(by, -0.5, 68.5), { air: true, Tsim: avail, h: 3 });
      return wake();
    }
    // 받을 선수
    let r = actor;
    if (!r && (l.toMe || l.meHold)) r = me();
    if (!r && l.poss) r = nearest(l.poss, [bx, by], p => p.role !== "GK" || isGkPt(bx));
    if (!r) { launch(bx, by, { Tsim: avail }); return wake(); }
    move(r, bx, by, avail, l);
    wake();
  }

  // 공을 r에게: 같은 선수면 드리블, 같은 팀이면 패스, 상대면 가로채기
  function move(r, bx, by, avail, l = {}) {
    if (S.pending && S.pending !== r && Math.hypot(S.pending.x - S.ball.x, S.pending.y - S.ball.y) < 3) take(S.pending);
    const H = S.holder;
    if (H === r) return carry(r, bx, by, avail);
    S.pending = null;
    if (H && H.team !== r.team) {
      const d = Math.hypot(bx - S.ball.x, by - S.ball.y);
      if (d > 14) {                                                  // 멀리 간 공: 근처에서 먼저 뺏고, 남은 길은 몰고 감
        const ux = (bx - S.ball.x) / d, uy = (by - S.ball.y) / d;
        const qx = S.ball.x + ux * 3, qy = S.ball.y + uy * 3;
        const thief = Math.hypot(r.x - qx, r.y - qy) < 14 ? r : nearest(r.team, [qx, qy], p => p.role !== "GK");
        steal(thief, qx, qy, avail * 0.35, () => thief === r ? carry(r, bx, by, avail * 0.65) : pass(thief, r, bx, by, avail * 0.65));
        return;
      }
      return steal(r, bx, by, avail);
    }
    pass(H, r, bx, by, avail, l);
  }
  function pass(from, r, bx, by, avail, l = {}) {
    if (from && from !== S.holder) { S.holder = from; toFeet(); }
    const d = Math.hypot(bx - S.ball.x, by - S.ball.y);
    const wide = S.ball.x > 80 && (S.ball.y < 16 || S.ball.y > 52) && bx > 86 && by > 16 && by < 52;   // 측면에서 문전으로: 크로스
    const wideThem = S.ball.x < 25 && (S.ball.y < 16 || S.ball.y > 52) && bx < 19 && by > 16 && by < 52;
    const air = l.air ?? (d > 27 || wide || wideThem);
    const Tb = launch(bx, by, { air, Tsim: avail });
    const need = Math.hypot(r.x - bx, r.y - by) / Math.max(0.1, Tb);
    r.ov = { x: bx - dirOf(r.team) * 0.9, y: by, v: clamp(Math.max(RUN, need * 1.05), RUN, 12), recv: true };
    S.ball.fl.done = () => {
      if (Math.hypot(r.x - S.ball.x, r.y - S.ball.y) < 2.4) take(r);
      else { S.pending = r; S.poss = r.team; }
    };
  }
  function carry(r, bx, by, avail) {
    const d = Math.hypot(bx - r.x, by - r.y);
    if (d < 0.5) { take(r); return; }
    take(r);
    r.ov = { x: bx - dirOf(r.team) * 0.9, y: by, v: clamp(Math.max(DRIBBLE, d / Math.max(0.1, avail)), DRIBBLE, 10), recv: true, carry: true };
    S.cur = { until: () => Math.hypot(r.x - r.ov?.x, r.y - r.ov?.y) < 0.4 || !r.ov, t: avail + 0.5 };
    wake();
  }
  function steal(r, bx, by, avail, then) {
    const H = S.holder;
    S.poss = r.team;
    const tb = launch(bx, by, { Tsim: Math.min(avail, 0.5), h: 1 });
    const need = Math.hypot(r.x - bx, r.y - by) / Math.max(0.1, tb);
    r.ov = { x: bx, y: by, v: clamp(Math.max(SPRINT, need), SPRINT, 12), recv: true };
    if (H) H.ov = null;
    S.ball.fl.done = () => { S.pending = r; if (Math.hypot(r.x - S.ball.x, r.y - S.ball.y) < 2) take(r); then && S.queue.unshift(() => then()); };
  }
  function shot(bx, by, kind, avail, keeper) {
    const shooter = S.holder;
    const team = shooter ? shooter.team : (bx > 52.5 ? "us" : "them");
    const gk = keeper || T.find(p => p.role === "GK" && p.team === other(team));
    const T1 = Math.min(avail, 0.1 + Math.hypot(bx - S.ball.x, by - S.ball.y) / 28);
    if (gk) {
      const gx = team === "us" ? 103.4 : 1.6;
      const dive = kind === "save" ? by : kind === "goal" ? by + (by > 34 ? -2.6 : 2.6) : 34 + (by - 34) * 0.4;
      gk.ov = { x: gx, y: clamp(dive, 29, 39), v: 9.5 };
    }
    const air = kind === "wide" && Math.random() < 0.5;
    launch(bx, by, { air, Tsim: T1, h: 1.6, shot: true });
    S.ball.fl.done = () => {
      if (kind === "save" && gk) { gk.ov = null; take(gk); }
      else if (kind === "post") launch(bx + (bx > 52 ? -5 : 5), by + (by < 34 ? -3 : 3), { Tsim: 0.5, h: 1 });
      else { S.holder = null; }
      if (kind === "goal" || kind === "wide") setTimeout(() => { if (gk) gk.ov = null; }, 600);
    };
    wake();
  }
  // 킥오프 자리로 (전반 시작은 그 자리에 바로 섬)
  function kickoff(team, instant) {
    S.started = true;
    S.queue = []; S.cur = null; S.wait = 0; S.chasers = []; S.pending = null; S.focus = null; S.forceLine = null;
    S.holder = null; S.poss = team || "us";
    const k = team ? T.find(p => p.team === team && p.role === "ST1") : null;
    for (const p of T) {
      const f = FORM[p.role];
      let pt = p.role === "GK" ? [4, 34] : [KICKOFF_X[p.pos], 34 + (f ? f.d[1] : 0) * 21];
      if (p.team === team && p.role === "ST1") pt = [51.6, 34];
      if (p.team === team && p.role === "ST2") pt = [49.5, 27.5];
      const [x, y] = own(p.team, pt);
      if (instant) { p.x = x; p.y = y; p.ov = null; p.vx = 0; p.vy = 0; }
      else p.ov = { x, y, v: 11, keep: true };                            // 도착하면 저절로 풀림
    }
    if (instant) { S.ball.fl = null; S.ball.x = 52.5; S.ball.y = 34; S.ball.z = 0; if (k) take(k); }
    else launch(52.5, 34, { air: true, Tsim: 1.1, h: 4, done: () => { if (k) S.pending = k; } });   // 골망·경기장 밖의 공이 가운데로
    wake(); render();
  }
  // 코너킥: 키커는 깃발로, 양 팀은 박스 안으로
  function corner(taker, fx, fy) {
    const team = taker.team, gx = team === "us" ? 1 : -1, s = fy < 34 ? -1 : 1;
    S.chasers = [];
    S.holder = null; S.pending = null; S.poss = team;
    const flag = [team === "us" ? 104.2 : 0.8, s < 0 ? 0.8 : 67.2];
    launch(flag[0], flag[1], { air: true, Tsim: 0.8, h: 2.5 });          // 새 공이 코너로
    taker.ov = { x: flag[0] - gx * 0.6, y: flag[1] + s * -0.4, v: 13 };
    packBox(team, taker);
    S.queue.push(() => { taker.ov = null; take(taker); });
    S.cur = { until: () => Math.hypot(taker.x - taker.ov?.x, taker.y - taker.ov?.y) < 0.6 || !taker.ov, t: 1.6 };
    wake();
  }
  // 박스 안 몸싸움 자리 (공격 팀 team이 노리는 골문 앞)
  function packBox(team, except) {
    const skip = except instanceof Set ? except : new Set([except]);
    const gx = team === "us" ? 1 : -1, goalX = team === "us" ? 105 : 0;
    const A = [[-7, -5], [-9, 3], [-12, -1], [-5, 6], [-14, 7]], D = [[-5, -3], [-6, 2], [-8, 6], [-10, -6], [-4, 0], [-11, 2]];
    const atk = T.filter(p => p.team === team && !skip.has(p) && p.role !== "GK").sort((a, b) => (["LCB", "RCB", "ST1", "ST2", "RCM"].includes(b.role) ? 1 : 0) - (["LCB", "RCB", "ST1", "ST2", "RCM"].includes(a.role) ? 1 : 0));
    const dfn = T.filter(p => p.team === other(team) && !skip.has(p) && p.role !== "GK").sort((a, b) => Math.abs(a.x - goalX) - Math.abs(b.x - goalX));
    atk.slice(0, 5).forEach((p, i) => { p.ov = { x: goalX + gx * A[i][0], y: 34 + A[i][1], v: 12 }; });
    dfn.slice(0, 6).forEach((p, i) => { p.ov = { x: goalX + gx * D[i][0], y: 34 + D[i][1], v: 12 }; });
    const gk = T.find(p => p.role === "GK" && p.team === other(team)); if (gk) gk.ov = { x: goalX - gx * 1.5, y: 34, v: 8 };
  }
  // 세트피스: 프리킥 벽, 페널티킥 자리
  function setPiece(kind, l, actor) {
    const [bx, by] = l.ball;
    const team = l.poss || actor?.team || "us";
    const goalX = team === "us" ? 105 : 0;
    if (kind === "freekick" || kind === "fk") {
      const d = Math.hypot(goalX - bx, 34 - by), ux = (goalX - bx) / d, uy = (34 - by) / d;
      const wall = T.filter(p => p.team === other(team) && p.role !== "GK").sort((a, b) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(b.x - bx, b.y - by)).slice(0, 4);
      wall.forEach((p, i) => { p.ov = { x: bx + ux * 9.2 - uy * (i - 1.5) * 1.1, y: by + uy * 9.2 + ux * (i - 1.5) * 1.1, v: 12 }; });
      S.chasers = [];
    }
    if (kind === "penalty" || kind === "pk") {
      const spot = team === "us" ? 94 : 11;
      for (const p of T) {
        if (p.role === "GK") { p.ov = p.team !== team ? { x: team === "us" ? 104.4 : 0.6, y: 34, v: 10 } : null; continue; }
        if (p === actor) continue;
        const inBox = team === "us" ? p.x > 86.5 : p.x < 18.5;
        if (inBox || Math.hypot(p.x - spot, p.y - 34) < 10) p.ov = { x: team === "us" ? 85 : 20, y: clamp(p.y, 16, 52), v: 11 };
      }
      l.ball = [spot, 34];
      if (actor) { actor.ov = null; S.holder = null; S.pending = null; }     // 공과 키커는 이어지는 움직임에서 페널티 지점으로
    }
  }

  // ── 내 장면 연출 ──
  // spec: data/scenes.js. ctx: { ball:[x,y], poss, zone, names: { mate, opp } }. 다 준비되면 done()
  function scene(spec, ctx, done) {
    const sp = spec || {};
    const [bx, by] = ctx.ball, poss = ctx.poss || "us";
    const s = by < 34 ? -1 : 1;                                       // 공 쪽 터치라인 방향 (y가 작은 쪽이면 −1)
    const P = (dx = 0, dy = 0) => [clamp(bx + dx, 1, 104), clamp(by + dy * s, 1, 67)];
    const M = me();
    const N = ctx.names || {};
    const used = new Set();
    const take1 = p => { if (p) used.add(p); return p; };
    const near = (team, pos, pt, f = () => true) => T.filter(p => p.team === team && !used.has(p) && !p.me && p.role !== "GK" && (!pos || pos.includes(p.pos)) && f(p))
      .sort((a, b) => Math.hypot(a.x - pt[0], a.y - pt[1]) - Math.hypot(b.x - pt[0], b.y - pt[1]))[0] || null;
    // 공 쪽(또는 반대편) 측면 선수. 우리 팀 왼쪽은 y가 작은 쪽, 상대 팀은 반대
    const sideRoles = (team, far) => { const left = (s < 0) !== !!far; return team === "us" ? (left ? ["LB", "LM"] : ["RB", "RM"]) : (left ? ["RB", "RM"] : ["LB", "LM"]); };
    function who(w, pt = [bx, by]) {
      if (w === "me") return M;
      if (w === "mate") return take1(byName(N.mate, "us") && !byName(N.mate, "us").me ? byName(N.mate, "us") : near("us", ["FW", "MF"], pt));
      if (w === "opp") return take1(byName(N.opp, "them") || near("them", null, pt));
      if (w === "gk") return T.find(p => p.team === "us" && p.role === "GK");
      if (w === "ogk") return T.find(p => p.team === "them" && p.role === "GK");
      const m = /^(opp)?(far)?(fw|mf|df|fb|wing|any)$/.exec(w);
      if (!m) return null;
      const team = m[1] ? "them" : "us", far = !!m[2], kind = m[3];
      if (kind === "fb" || kind === "wing") {
        const pos = kind === "fb" ? "DF" : "MF";
        return take1(near(team, [pos], pt, p => sideRoles(team, far).includes(p.role)) || near(team, [pos], pt));
      }
      return take1(near(team, kind === "any" ? null : [kind.toUpperCase()], pt));
    }
    // 지난 장면의 대본은 지우고 새로 시작
    for (const p of T) p.ov = null;
    S.queue = []; S.cur = null; S.wait = 0; S.chasers = []; S.pending = null;
    if (sp.block) Object.assign(S.block, typeof sp.block === "string" ? { [other(poss)]: sp.block } : sp.block);
    S.forceLine = sp.line != null ? { team: other(poss), x: clamp(bx + sp.line, 2, 103) } : null;
    S.focus = [bx, by]; S.poss = poss;
    const setFrom = ["kicker", "fk", "throw", "pk", "corner", "backpass"].includes(sp.from);
    S.noPress = sp.press === 0 || (sp.press == null && setFrom);
    const Q = S.queue;
    const run = (p, pt, v = RUN) => { if (p) p.ov = { x: pt[0], y: pt[1], v }; };
    // 도착을 기다림. 시간 안에 못 오면 그 자리로 옮겨 놓음 (장면 사이에 시간이 흐른 셈)
    const arrive = (ps, tmax = 1.4) => {
      S.cur = { until: () => ps.every(p => !p || !p.ov || Math.hypot(p.x - p.ov.x, p.y - p.ov.y) < 0.6), t: tmax };   // 시간 안에 못 와도 순간이동하지 않고 계속 뛰어감
    };
    // 공을 그 자리·그 선수에게 (순간이동 없이 굴러가거나 떠서 감)
    const placeBall = (pt, holder) => {
      S.pending = null;
      if (holder) { S.ball.fl = null; take(holder); return; }
      const d = Math.hypot(pt[0] - S.ball.x, pt[1] - S.ball.y);
      if (d < 0.5) return;
      launch(pt[0], pt[1], { air: d > 16, Tsim: 0.25 + d / 45, h: Math.min(4, d * 0.1) });
    };
    const goTo = (p, pt) => { Q.push(() => { run(p, [pt[0] - dirOf(p.team) * 0.9, pt[1]], 14); arrive([p], 1.3); }); Q.push(() => { p.ov = null; }); };
    // 공을 출발점의 선수에게 먼저 모음 (가까우면 공이 굴러가고, 멀면 다음 장면으로 넘어간 셈이라 바로 놓음)
    const gather = (p, pt) => {
      Q.push(() => {
        run(p, [pt[0] - dirOf(p.team) * 0.9, pt[1]], 14); arrive([p], 0.9);
        const d = Math.hypot(S.ball.x - pt[0], S.ball.y - pt[1]);
        if (d < 30 && !S.holder) launch(pt[0], pt[1], { air: d > 20, Tsim: 0.7, h: 3 });
      });
      Q.push(() => { p.ov = null; placeBall(pt, p); S.poss = p.team; S.cur = { until: () => Math.hypot(S.ball.x - p.x, S.ball.y - p.y) < 1.5, t: 1.4 }; });
    };
    const passTo = (from, r, pt, air = false, wait = 0.15) => {
      Q.push(() => {
        if (from) { take(from); toFeet(); }
        const Tb = launch(pt[0], pt[1], { air });
        const need = Math.hypot(r.x - pt[0], r.y - pt[1]) / Math.max(0.15, Tb);
        r.ov = { x: pt[0] - dirOf(r.team) * 0.9, y: pt[1], v: clamp(Math.max(RUN, need * 1.05), RUN, 11), recv: true };
        S.ball.fl.done = () => { S.pending = r; S.poss = r.team; };
        S.cur = { until: () => S.holder === r, t: Tb + 1.6 };
      });
      if (wait) Q.push(() => { S.wait = wait; });
    };
    // 세트피스: 공은 그 자리로 굴러가고, 키커는 공 앞으로 뛰어가서 잡음 (순간이동 없음)
    const toSpot = (p, pt, tmax = 7) => {
      Q.push(() => {
        S.holder = null; S.pending = null; S.poss = p.team;
        const d = Math.hypot(pt[0] - S.ball.x, pt[1] - S.ball.y);
        if (d > 0.5) launch(pt[0], pt[1], { air: d > 18, Tsim: 0.3 + d / 40, h: Math.min(4, d * 0.1) });
        p.ov = { x: pt[0] - dirOf(p.team) * 1.1, y: pt[1], v: 14 };
        S.cur = { until: () => !S.ball.fl && Math.hypot(p.x - p.ov.x, p.y - p.ov.y) < 0.8, t: tmax };
      });
      Q.push(() => { p.ov = null; take(p); });
    };
    const carryTo = (p, pt, v = DRIBBLE) => Q.push(() => { take(p); p.ov = { x: pt[0] - dirOf(p.team) * 0.9, y: pt[1], v, recv: true }; S.cur = { until: () => !p.ov || Math.hypot(p.x - p.ov.x, p.y - p.ov.y) < 0.4, t: 3.2 }; });

    // 장면 끝에 공을 가진 선수
    let R;
    if (sp.holder === "me") R = M;
    else if (sp.holder === "mate") R = who("mate");
    else if (sp.holder === "df") R = take1(near("us", ["DF"], [bx, by]));
    else R = poss === "us" ? M : who("opp");
    if (!R) { done?.(); return; }
    used.add(R);
    const from = sp.from || (poss === "us" ? (ctx.zone === "def" && bx < 26 ? "gk" : "pass") : (ctx.zone === "att" ? "oppHold" : "oppCarry"));
    const pre = (sp.pre || []).map(([w, dx, dy]) => [who(w, P(dx, dy)), P(dx, dy)]).filter(x => x[0]);
    if (from === "through" && M && !pre.some(([p]) => p === M)) pre.push([M, P(-9, -2)]);
    const far = p => Math.hypot(p.x - bx, p.y - by);
    const selfStart = ["carry", "oppCarry", "kicker", "fk", "throw", "pk", "turn", "hold", "oppHold", "backpass"];
    const inPre = p => pre.some(([q]) => q === p) || (sp.runs || []).some(([w]) => (w === "me" && p === M));
    if (!selfStart.includes(from) && !inPre(R) && far(R) > 15) { const g = poss === "us" ? 1 : -1; pre.push([R, P(-7 * g, -2)]); }
    if (poss !== "us" && M && sp.mePress !== false && !inPre(M) && far(M) > 9) pre.push([M, [clamp(bx - (sp.meGap ?? 2.4) - 4, 6, 103), clamp(by + (34 - by) * 0.12, 2, 66)]]);
    const runs = (sp.runs || []).map(([w, dx, dy, v]) => [who(w, P(dx, dy)), P(dx, dy), v || RUN]).filter(x => x[0]);

    // 1) 장면에 맞는 대형으로 빠르게 모이고, 미리 서 있는 자리·세트피스 배치 (그사이 시간이 흐른 셈)
    Q.push(() => {
      for (const [p, pt] of pre) run(p, pt, 13);
      if (sp.pack) packBox(sp.pack === "them" ? "them" : "us", new Set([R, ...pre.map(([p]) => p)]));
      for (const [p] of pre) if (p.role === "GK") p.ov = null;
      const np = S.noPress; S.noPress = true; targets(); S.noPress = np;     // 지난 공 자리 기준의 압박은 빼고 대형만
      const fixed = new Set(T.filter(p => p.ov));
      for (const p of T) if (!fixed.has(p) && p !== S.holder) p.ov = { x: p.tx, y: p.ty, v: 13, settle: true };
      arrive(T, 0.9);
    });
    Q.push(() => { for (const p of T) if (p.ov?.settle) p.ov = null; });
    // 2) 공이 R에게 오기까지
    const src = sp.src ? P(...sp.src) : null;
    let runAt = -1;                                                    // 뛰어 들어가기 시작하는 순서 (공이 출발할 때)
    switch (from) {
      case "pass": case "through": case "long": case "back": {
        const sp0 = src || (from === "long" ? [24, clamp(by, 14, 54)] : from === "back" ? P(10, -6) : P(-15, -5));
        const giver = (sp.giver && who(sp.giver, sp0)) || near("us", null, sp0);
        if (giver) { gather(giver, sp0); runAt = Q.length; passTo(giver, R, [bx, by], from === "long" || Math.hypot(sp0[0] - bx, sp0[1] - by) > 28); }
        else Q.push(() => placeBall([bx, by], R));
        break;
      }
      case "cross": case "lowcross": {
        const cp = src || [clamp(bx + 5, 88, 101), s < 0 ? 4.5 : 63.5];
        const crosser = (sp.giver && who(sp.giver, cp)) || who("wing", cp) || near("us", null, cp);
        if (crosser) { gather(crosser, cp); runAt = Q.length; passTo(crosser, R, [bx, by], from === "cross"); }
        break;
      }
      case "save": case "loose": {
        const gk = who("ogk");
        const sp1 = from === "save" ? [101.6, clamp(by, 30, 38)] : (src || P(5, -3));
        if (from === "save" && gk) goTo(gk, [102.5, sp1[1]]);
        Q.push(() => { placeBall(sp1, null); S.cur = { until: () => !S.ball.fl, t: 1.2 }; });
        runAt = Q.length;
        Q.push(() => {
          const d = Math.hypot(bx - S.ball.x, by - S.ball.y);
          const Tb = launch(bx, by, { air: true, h: Math.min(5, 1.2 + d * 0.12) });
          R.ov = { x: bx - dirOf(R.team) * 0.9, y: by, v: clamp(Math.hypot(R.x - bx, R.y - by) / Math.max(0.2, Tb), RUN, 10), recv: true };
          S.ball.fl.done = () => { S.pending = R; S.poss = R.team; };
          S.cur = { until: () => S.holder === R, t: Tb + 1.8 };
        });
        Q.push(() => { S.wait = 0.25; });
        break;
      }
      case "carry": case "oppCarry": {
        const st = src || P(from === "carry" ? -14 : 15, from === "carry" ? 0 : -2);
        goTo(R, st);
        Q.push(() => placeBall(st, R));
        runAt = Q.length;
        carryTo(R, [bx, by], sp.v || (from === "carry" ? 7 : 7.2));
        break;
      }
      case "gk": case "oppGk": {
        const gk = who(from === "gk" ? "gk" : "ogk"), gp = from === "gk" ? [5, 34] : [100, 34];
        if (gk) { gather(gk, gp); runAt = Q.length; passTo(gk, R, [bx, by], false); }
        break;
      }
      case "turn": {                                                     // 상대 공을 내가 끊어 냄
        const o = who("opp") || near("them", null, [bx, by]);
        if (o && M) {
          goTo(o, [bx + 2.5, by]);
          Q.push(() => { placeBall([bx + 2.5, by], o); M.ov = { x: bx, y: by, v: SPRINT }; S.cur = { until: () => Math.hypot(M.x - S.ball.x, M.y - S.ball.y) < 1.6, t: 2.4 }; });
          Q.push(() => { M.ov = null; take(M); S.wait = 0.2; });
          runAt = Q.length;
        } else Q.push(() => placeBall([bx, by], R));
        break;
      }
      case "corner": {
        const taker = who(sp.giver || "wing", [104, by]) || near("us", ["MF"], [104, by]);
        const fy = s < 0 ? 0.8 : 67.2;
        if (taker) {
          toSpot(taker, [104.2, fy]);
          Q.push(() => { S.wait = 0.3; });
          runAt = Q.length;
          passTo(taker, R, [bx, by], true);
        }
        break;
      }
      case "kicker": case "fk": {                                        // 공 앞에 내가 섬
        toSpot(R, [bx, by]);
        if (from === "fk") Q.push(() => { setPiece("fk", { ball: [bx, by], poss: "us" }, R); arrive(T.filter(p => p.ov), 1.4); });
        runAt = Q.length;
        break;
      }
      case "throw": {
        const ty = s < 0 ? 0.4 : 67.6;
        toSpot(R, [bx, ty]);
        runAt = Q.length;
        break;
      }
      case "pk": {
        Q.push(() => { const l = { ball: [94, 34], poss: "us" }; setPiece("pk", l, R); });
        toSpot(R, [94, 34]);
        break;
      }
      case "oppPass": case "oppLong": {
        const sp0 = src || (from === "oppLong" ? [84, clamp(by, 18, 50)] : P(16, -7));
        const giver = (sp.giver && who(sp.giver, sp0)) || near("them", from === "oppLong" ? ["DF"] : ["MF"], sp0) || near("them", null, sp0);
        if (giver) { gather(giver, sp0); runAt = Q.length; passTo(giver, R, [bx, by], from === "oppLong" || Math.hypot(sp0[0] - bx, sp0[1] - by) > 28); }
        break;
      }
      case "oppCross": {
        const cp = src || [clamp(bx - 5, 4, 17), s < 0 ? 4.5 : 63.5];
        const crosser = (sp.giver && who(sp.giver, cp)) || who("oppwing", cp) || near("them", null, cp);
        if (crosser) { gather(crosser, cp); runAt = Q.length; passTo(crosser, R, [bx, by], true); }
        break;
      }
      case "oppCorner": case "oppThrow": {
        const corner = from === "oppCorner";
        const tp = corner ? [0.8, s < 0 ? 0.8 : 67.2] : [bx + 2, s < 0 ? 0.4 : 67.6];
        const taker = who(corner ? "oppwing" : "oppfb", tp) || near("them", null, tp);
        if (taker) {
          toSpot(taker, tp);
          Q.push(() => { S.wait = 0.3; });
          runAt = Q.length;
          passTo(taker, R, [bx, by], true);
        }
        break;
      }
      case "backpass": {                                                 // 상대 센터백의 짧은 백패스가 중간에 멈춤
        const st = src || P(-10, 0);
        goTo(R, st);
        Q.push(() => placeBall(st, R));
        runAt = Q.length;
        Q.push(() => { launch(bx, by, { Tsim: 1.3 }); S.poss = "them"; S.cur = { until: () => !S.ball.fl, t: 1.6 }; });
        break;
      }
      case "hold": case "oppHold": default:
        goTo(R, [bx, by]);
        Q.push(() => placeBall([bx, by], R));
        runAt = Q.length;
        break;
    }
    // 준비 단계(모이기)는 빠르게 돌리고, 공이 출발하면 원래 속도로
    Q.unshift(() => { S.boost = 2; });
    if (runAt >= 0) runAt++;
    Q.splice(runAt < 0 ? Q.length : runAt, 0, () => { S.boost = 1; });
    // 뛰어 들어가는 선수들: 공이 출발할 때 같이 출발
    const startRuns = () => { for (const [p, pt, v] of runs) run(p, pt, v); };
    if (runs.length) Q.splice(runAt < 0 ? Q.length : runAt, 0, startRuns);
    // 골키퍼 자리
    if (sp.gk || sp.gkAt || sp.gkNear) Q.splice(runAt < 0 ? Q.length : runAt, 0, () => {
      const g = who("ogk"); if (!g) return;
      const pt = sp.gkAt ? sp.gkAt : sp.gkNear ? [103.4, s < 0 ? 31 : 37] : P(...sp.gk);
      run(g, pt, 9);
    });
    // 압박: 공 가진 선수에게 붙는 수비 (상대 공이면 기본으로 내가 붙음)
    Q.push(() => {
      const holder = S.holder || R;
      const defTeam = other(holder.team);
      const n = typeof sp.press === "number" ? sp.press : (poss === "us" ? 1 : 0);
      const list = [];
      if (poss !== "us" && M && sp.mePress !== false && !runs.some(([p]) => p === M)) list.push({ p: M, gap: sp.meGap ?? 2.4, side: 0, v: RUN, keep: true });
      const cand = T.filter(p => p.team === defTeam && p.role !== "GK" && !p.ov && !list.some(c => c.p === p) && !(p.me && poss !== "us")).sort((a, b) => dist(a, holder) - dist(b, holder));
      const gap = sp.pressGap ?? 1.8;
      for (let i = 0; i < n && cand[i]; i++) list.push({ p: cand[i], gap: i === 0 ? gap : gap + 1.4, side: i === 0 ? 0 : (i % 2 ? 2.6 : -2.6), v: RUN, keep: true });
      S.chasers = list;
      S.wait = sp.hold ?? 0.3;
    });
    S.done = () => { S.boost = 1; done?.(); };
    wake();
  }

  return {
    line, scene, kickoff,
    setSpeed(name) { S.scale = name === "fast" ? 2.6 : 1; },
    // 후반 진영 교체: 잠깐 어두워졌다가 뒤집힌 채로 나타남 (순간이동처럼 보이지 않게)
    setFlip(v) {
      if (calm) { S.flipped = v; return render(); }
      svg.style.transition = "opacity .25s"; svg.style.opacity = "0";
      setTimeout(() => { S.flipped = v; render(); svg.style.opacity = "1"; }, 260);
    },
    setBlocks(b) { Object.assign(S.block, b); },
    clearRuns() { for (const p of T) if (!p.ov?.recv && !p.ov?.keep) p.ov = null; S.chasers = []; S.forceLine = null; S.focus = null; S.noPress = false; },
    finish() { const c = calm; snap(); return c; },
    ball() { return [S.ball.x, S.ball.y]; },
    destroy() { S.dead = true; cancelAnimationFrame(raf); raf = 0; document.removeEventListener("visibilitychange", onVis); },
    render,
    _state: S,
  };
}
