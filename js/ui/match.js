// 경기 화면: 전광판 → 22명이 움직이는 경기장 → 문자 중계 → 내 장면 선택지
import { next, resolve, autoChoice, autoPlay, finishMatch, applyHalftime, STATUS_LABEL, TAG_LABEL, MY_SLOT } from "../engine/match.js";
import { STAFF } from "../../data/roster.js";
import { getPath } from "../rng.js";
import { tierLabel, TEAM_NAME } from "../engine/season.js";
import { esc, img, faceOf, fillText } from "./util.js";
import { conditionOf } from "../engine/growth.js";
import { setScene, enter, buzz } from "./fx.js";
import { sfx } from "./sfx.js";
import { bgm } from "./bgm.js";

const SPEED = { normal: 1250, fast: 420 };
const HALF_MIN = 35;                                  // 후반부터는 양 팀이 진영을 바꿔 공격 방향이 반대가 됨

// 상대 팀 유니폼 색. 데이터에 없으면 팀 이름으로 정해진 색을 씀
const KIT_POOL = [["#F3F5FB", "#1F2C8F"], ["#1E88E5", "#FFFFFF"], ["#C62828", "#FFFFFF"], ["#2E7D32", "#FFFFFF"], ["#6A1B9A", "#FFFFFF"], ["#FDD835", "#1A237E"], ["#212121", "#29B6F6"], ["#00897B", "#FFFFFF"]];
function kitOf(opp) {
  let fill = opp.color, stroke = opp.color2;
  if (!fill) { let h = 0; for (const ch of String(opp.name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; [fill, stroke] = KIT_POOL[h % KIT_POOL.length]; }
  const n = parseInt(fill.slice(1), 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  // 상대 골키퍼 색: 유니폼과 확실히 다르게 (밝은 유니폼이면 검정, 어두운 유니폼이면 형광)
  const gk = lum > 0.5 ? "#212121" : "#C6FF00";
  return { fill, stroke: stroke || "#FFFFFF", text: lum > 0.55 ? "#14181F" : "#FFFFFF", gk, gkText: lum > 0.5 ? "#FFFFFF" : "#14181F" };
}

// 기본 대형 (우리 팀이 오른쪽으로 공격). 상대는 좌우를 뒤집어 씀
const BASE = {
  GK: [[4, 34]],
  DF: [[18, 10], [16, 26], [16, 42], [18, 58]],
  MF: [[38, 12], [35, 27], [35, 41], [38, 56]],
  FW: [[55, 26], [55, 42]],
};
const LIMIT = { GK: [2, 10], DF: [7, 72], MF: [14, 88], FW: [24, 98] };

// 선수 22명 만들기. 점 하나하나가 명단의 실제 선수(이름·등번호)와 이어져 있음
function buildPlayers(state, m) {
  const p = state.player;
  const list = [];
  const ours = { GK: [{ name: m.gk.us, number: 1 }], DF: [], MF: [], FW: [] };
  for (const x of m.lineup) ours[x.pos].push({ ...x });
  for (const [pos, spots] of Object.entries(BASE)) {
    spots.forEach((pt, i) => {
      let who = ours[pos][i], me = false;
      const mySlot = pos === p.position && i === MY_SLOT[pos];
      if (mySlot && m.status === "start") { ours[pos].splice(i, 0, { name: p.name, number: p.number }); who = ours[pos][i]; me = true; }
      list.push({ id: `u-${pos}-${i}`, team: "us", pos, base: pt, number: who?.number ?? "", name: who?.name ?? "", me,
        subSlot: mySlot && m.status === "sub", x: pt[0], y: pt[1] });
      const oy = Math.min(64, Math.max(4, pt[1] + (pos === "GK" ? 0 : 3)));
      const opp = pos === "GK" ? { name: m.gk.them, number: 1 } : m.oppPlayers.filter(o => o.pos === pos)[i];
      list.push({ id: `t-${pos}-${i}`, team: "them", pos, base: [105 - pt[0], oy], number: opp?.number ?? "", name: opp?.name ?? "", me: false, x: 105 - pt[0], y: oy });
    });
  }
  return list;
}

// 공 위치와 소유 팀, 공을 가진 선수(actor)에 맞춰 모두의 목표 위치 계산
function layout(players, ball, poss, opt = {}) {
  const [bx, by] = ball;
  const t = (bx - 52.5) / 52.5;
  for (const pl of players) {
    const [x0, y0] = pl.base;
    if (pl.pos === "GK") {
      const near = pl.team === "us" ? Math.max(0, 22 - bx) : Math.max(0, bx - 83);
      pl.x = pl.team === "us" ? 3 + near * 0.12 : 102 - near * 0.12;
      pl.y = 34 + (by - 34) * 0.25;
      continue;
    }
    const attack = pl.team === poss;
    const dir = pl.team === "us" ? 1 : -1;
    let x = x0 + t * 20 + dir * (attack ? 7 : -3);
    let y = y0 + (by - 34) * 0.32;
    const [lo, hi] = LIMIT[pl.pos];
    x = pl.team === "us" ? Math.min(hi, Math.max(lo, x)) : Math.min(105 - lo, Math.max(105 - hi, x));
    pl.x = x; pl.y = Math.min(65, Math.max(3, y));
  }
  if (bx < 1 || bx > 104) return [];                                // 골망·라인 밖
  const named = opt.actor ? players.find(p => p.name === opt.actor) : null;
  const team = named ? named.team : poss;
  if (!team) return [];
  const holder = named || (opt.holderIsMe ? players.find(p => p.me) : null)
    || players.filter(p => p.team === team && p.pos !== "GK").sort((a, b) => dist(a, ball) - dist(b, ball))[0];
  const side = team === "us" ? 1 : -1;
  if (holder) { holder.x = holder.pos === "GK" ? bx : bx - side * 1.6; holder.y = by; }
  // 수비 쪽: 가장 가까운 두 명이 붙음. 내가 막는 장면이면 내가 제일 먼저 붙음
  const meTok = players.find(p => p.me);
  const foes = players.filter(p => p.team !== team && p.pos !== "GK" && p !== holder).sort((a, b) => dist(a, ball) - dist(b, ball));
  if (opt.press && meTok && meTok.team !== team) { foes.splice(foes.indexOf(meTok), 1); foes.unshift(meTok); }
  if (foes[0]) { foes[0].x = bx + side * 3; foes[0].y = by + (foes[0].y > by ? 2 : -2); }
  if (foes[1] && dist(foes[1], ball) < 14) { foes[1].x = bx + side * 6; foes[1].y = by + (foes[1].y > by ? 6 : -6); }
  // 수비가 골라인·터치라인 밖으로 밀려나지 않게. 코너킥·스로인 키커만 라인 바로 바깥에 설 수 있음
  for (const p of players) {
    const m = p === holder ? 0 : 1.5;
    p.x = Math.min(105 - m, Math.max(m, p.x)); p.y = Math.min(68 - m, Math.max(m, p.y));
  }
  return [holder, foes[0], foes[1]].filter(Boolean);
}

// 겹친 점 떼어 놓기 + 공과 상관없는 선수들의 작은 움직임 (화면 연출만. 엔진 판정과 무관)
function spread(players, fixed) {
  const lock = new Set(fixed);
  for (const pl of players) {
    if (lock.has(pl) || pl.pos === "GK") continue;
    pl.x += (Math.random() - 0.5) * 1.6; pl.y += (Math.random() - 0.5) * 1.6;
  }
  const MIN = 3.6;
  for (let it = 0; it < 3; it++) {
    for (let i = 0; i < players.length; i++) for (let j = i + 1; j < players.length; j++) {
      const a = players[i], b = players[j];
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= MIN) continue;
      if (d < 0.01) { dx = 0; dy = 1; d = 1; }
      const push = (MIN - d) / 2, ux = dx / d, uy = dy / d;
      const fa = lock.has(a) || a.pos === "GK", fb = lock.has(b) || b.pos === "GK";
      if (fa && fb) continue;
      const ka = fa ? 0 : fb ? 2 : 1, kb = fb ? 0 : fa ? 2 : 1;
      a.x -= ux * push * ka; a.y -= uy * push * ka; b.x += ux * push * kb; b.y += uy * push * kb;
    }
  }
  for (const pl of players) {
    if (lock.has(pl)) continue;
    pl.x = Math.min(103.5, Math.max(1.5, pl.x)); pl.y = Math.min(66.5, Math.max(1.5, pl.y));
  }
}
const dist = (p, [x, y]) => Math.hypot(p.x - x, p.y - y);

function pitchSvg(players, kit) {
  return `<svg class="pitch" viewBox="0 0 105 68" role="img" aria-label="경기장" style="--opp:${kit.fill};--opp2:${kit.stroke};--oppText:${kit.text};--oppGk:${kit.gk};--oppGkText:${kit.gkText}">
    <rect x="0" y="0" width="105" height="68" class="turf"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${i * 15}" y="0" width="7.5" height="68" class="stripe"/>`).join("")}
    <g class="lines"><rect x="1" y="1" width="103" height="66"/><line x1="52.5" y1="1" x2="52.5" y2="67"/>
      <circle cx="52.5" cy="34" r="9.15"/><rect x="1" y="13.85" width="16.5" height="40.3"/><rect x="87.5" y="13.85" width="16.5" height="40.3"/>
      <rect x="1" y="24.85" width="5.5" height="18.3"/><rect x="98.5" y="24.85" width="5.5" height="18.3"/>
      <rect x="-1" y="30.3" width="2" height="7.4" class="goal"/><rect x="104" y="30.3" width="2" height="7.4" class="goal"/></g>
    <g class="netfx"></g>
    <ellipse class="bshadow" rx="1.25" ry=".55" style="transform:translate(52.5px,34.7px)"/>
    ${players.map(p => `<g class="dot ${p.team} ${p.pos === "GK" ? "gk" : ""} ${p.me ? "me" : ""}" data-id="${p.id}" style="transform:translate(${p.x}px,${p.y}px)">
      <circle r="4" class="ring"/><circle r="2.3" class="body"/><text y="0.75" class="no">${p.number}</text><text y="-4.3" class="tag">나</text></g>`).join("")}
    <g class="ball" style="transform:translate(52.5px,34px)"><circle r="1.2"/></g>
  </svg>`;
}

const LINE_CLASS = { info: "", us: "us", them: "them", "goal-us": "goal", "goal-me": "goal mine", "goal-them": "goal against",
  me: "me", "me-auto": "me auto", "me-good": "me good", "me-bad": "me bad", whistle: "whistle", coach: "coach", stat: "stat", card: "card" };
const ICON = { "goal-us": "⚽ ", "goal-me": "⚽ ", "goal-them": "", card: "🟨 ", whistle: "", stat: "📊 " };

export function showMatch(app, m, onDone) {
  const state = app.state;
  const p = state.player;
  const fx = m.fx;
  let speed = "normal", timer = null, paused = false, queue = [], after = null;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const players = buildPlayers(state, m);
  layout(players, [52.5, 34], null);

  app.root.innerHTML = `<div class="match-screen">
    <header class="board">
      <div class="comp">${esc(fx.compLabel)}${fx.round ? ` ${esc(fx.round)}` : ""}</div>
      <div class="teams">
        <span class="tm home">${fx.jn ? `<i class="kit-dot jn-dot"></i>${esc(fx.usName)}` : `<img src="assets/img/logo.png" alt="">${TEAM_NAME}`}</span>
        <span class="sc num" id="sc">0 : 0</span>
        <span class="tm away"><i class="kit-dot" style="background:${kitOf(fx.opponent).fill};border-color:${kitOf(fx.opponent).stroke}"></i>${esc(fx.opponent.name)}</span>
      </div>
      <div class="clock num" id="clock">경기 전</div>
    </header>
    <div class="match-body">
      <div class="pitch-wrap sky-${m.sky || "day"} wx-${m.weather || "clear"}" id="pitch">${pitchSvg(players, kitOf(fx.opponent))}${m.weather && m.weather !== "clear" ? `<div class="wx-layer" aria-hidden="true"></div>` : ""}<div class="goal-flash" id="flash" hidden>GOAL</div><div class="atk-dir" id="atk">공격 방향 ▶</div></div>
      <ol class="feed" id="feed" aria-live="polite"></ol>
    </div>
    <footer class="ctl" id="ctl"></footer>
  </div>`;

  const root = app.root;
  setScene("bg_prematch", "prematch");                 // 경기 직전: 조명 켜진 운동장
  bgm.play("match");
  enter(root.querySelector(".match-screen"));
  const feed = root.querySelector("#feed");
  const ctl = root.querySelector("#ctl");
  const svg = root.querySelector(".pitch");
  const flash = root.querySelector("#flash");
  const dotEls = Object.fromEntries([...svg.querySelectorAll(".dot")].map(el => [el.dataset.id, el]));
  const ballEl = svg.querySelector(".ball"), shadowEl = svg.querySelector(".bshadow"), netFx = svg.querySelector(".netfx");
  // 세로 화면: 전광판·선택지 높이를 빼고 남은 만큼만 경기장을 키움 (중계 줄은 최소 64px 남김)
  const pitchWrap = root.querySelector("#pitch"), boardEl = root.querySelector(".board");
  const narrow = () => innerWidth < 900 && !(matchMedia("(orientation: landscape) and (max-height: 620px)").matches);
  const fitPitch = () => {
    if (!pitchWrap.isConnected) return;
    if (!narrow()) { pitchWrap.style.maxWidth = ""; return; }
    const avail = innerHeight - boardEl.offsetHeight - ctl.offsetHeight - 16 - 8 - 64;
    pitchWrap.style.maxWidth = `${Math.max(180, Math.floor(avail * 105 / 68))}px`;
  };
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(fitPitch) : null;
  ro?.observe(ctl); ro?.observe(boardEl);
  addEventListener("resize", fitPitch);
  fitPitch();
  const raiseMe = () => { const t = players.find(x => x.me); if (t) svg.insertBefore(dotEls[t.id], ballEl); };   // 내 점은 맨 위에
  raiseMe();

  // 화면에 그릴 때만 좌표를 돌림: 후반에는 우리 팀이 왼쪽으로 공격 (엔진 좌표는 그대로)
  let flipped = false, lastBall = [52.5, 34];
  const SX = x => (flipped ? 105 - x : x), SY = y => (flipped ? 68 - y : y);
  // 공: 짧은 패스는 땅으로 굴러가고, 먼 거리는 포물선으로 떠서 날아감 (그림자는 땅에 남음)
  let bCur = [52.5, 34], bRaf = 0;
  function moveBall(tx, ty, ms) {
    cancelAnimationFrame(bRaf);
    const [fx0, fy0] = bCur, d = Math.hypot(tx - fx0, ty - fy0);
    const put = (x, y, z) => {
      ballEl.style.transform = `translate(${x.toFixed(2)}px,${(y - z).toFixed(2)}px) scale(${(1 + z * 0.06).toFixed(3)})`;
      shadowEl.style.transform = `translate(${x.toFixed(2)}px,${(y + 0.7).toFixed(2)}px) scale(${Math.max(0.5, 1 - z * 0.07).toFixed(3)})`;
      shadowEl.style.opacity = Math.max(0.25, 1 - z * 0.1).toFixed(2);
    };
    if (calm || d < 0.3) { bCur = [tx, ty]; return put(tx, ty, 0); }
    const air = d > 17, h = air ? Math.min(7, d * 0.15) : 0, T = Math.max(140, Math.min(ms * 0.85, air ? 300 + d * 9 : 200 + d * 12)), t0 = performance.now();
    const stepB = now => {
      const u = Math.min(1, (now - t0) / T);
      const e = air ? (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2) : 1 - (1 - u) ** 3;
      const x = fx0 + (tx - fx0) * e, y = fy0 + (ty - fy0) * e;
      bCur = [x, y];
      put(x, y, h * 4 * u * (1 - u));
      if (u < 1) bRaf = requestAnimationFrame(stepB);
    };
    bRaf = requestAnimationFrame(stepB);
  }
  function draw(ball, poss, ms, opt = {}) {
    if (ball) { const fixed = layout(players, ball, poss, opt); if (!calm) spread(players, fixed); lastBall = ball; }
    const dur = `${Math.max(120, ms * 0.85)}ms`;
    for (const pl of players) {
      const el = dotEls[pl.id];
      el.style.transitionDuration = dur;
      el.style.transform = `translate(${SX(pl.x).toFixed(2)}px,${SY(pl.y).toFixed(2)}px)`;
    }
    const b = ball || lastBall;
    moveBall(SX(b[0]), SY(b[1]), ms);
  }
  // 골 장면: 골문 쪽으로 화면이 살짝 다가가고, 골망이 출렁임
  function goalCam(k) {
    if (calm) return;
    const right = SX(lastBall[0]) > 52.5, gx = right ? 104.2 : 0.8;
    netFx.innerHTML = [0, 1, 2].map(i => `<path class="net-wave" style="animation-delay:${i * 0.12}s" d="M${gx} 30.3 Q${(gx + (right ? 2.4 : -2.4)).toFixed(1)} 34 ${gx} 37.7"/>`).join("")
      + `<circle class="net-burst" cx="${gx}" cy="34" r="2"/>`;
    svg.classList.remove("cam-l", "cam-r"); void svg.getBoundingClientRect();
    svg.classList.add(right ? "cam-r" : "cam-l");
    clearTimeout(svg._cam);
    svg._cam = setTimeout(() => { svg.classList.remove("cam-l", "cam-r"); netFx.innerHTML = ""; }, 1500);
  }
  function setHalf(second) {
    if (second === flipped) return;
    flipped = second;
    const a = root.querySelector("#atk");
    a.textContent = flipped ? "◀ 공격 방향" : "공격 방향 ▶";
    a.classList.remove("swap"); void a.offsetWidth; a.classList.add("swap");
    draw(null, null, 1400);
  }

  // 경기 전 선발 명단: 경기장 위 점과 같은 순서·번호
  const byPos = pos => players.filter(x => x.team === "us" && x.pos === pos).map(x => `${x.me ? "<b class='me-n'>" : ""}${x.number} ${esc(x.name)}${x.me ? "</b>" : ""}`).join(", ");
  feed.innerHTML = `<li class="lineup"><span class="mn">선발</span><span>
    <b>GK</b> ${byPos("GK")}<br><b>DF</b> ${byPos("DF")}<br><b>MF</b> ${byPos("MF")}<br><b>FW</b> ${byPos("FW")}
    </span></li>`;

  // 교체 투입 / 부상 교체 때 점의 주인 바꾸기
  function swapToken(tok, who, me) {
    tok.name = who.name; tok.number = who.number; tok.me = me;
    const el = dotEls[tok.id];
    el.classList.toggle("me", me);
    el.querySelector(".no").textContent = who.number;
    if (me) raiseMe();
  }

  // 전광판은 중계 문장이 골 장면에 도착했을 때 바뀜 (엔진은 한 번의 공격을 미리 다 계산해 둠)
  let shown = [0, 0], shownMin = null, lastScore = "0 : 0";
  const updateBoard = () => {
    const sc = root.querySelector("#sc"), now = `${shown[0]} : ${shown[1]}`;
    sc.textContent = now;
    if (now !== lastScore) { lastScore = now; sc.classList.remove("bump"); void sc.offsetWidth; sc.classList.add("bump"); }
    root.querySelector("#clock").textContent = m.done ? "종료" : `${shownMin ?? m.minute}'`;
  };
  function addLine(l) {
    if (l.silent || !l.t) return;
    const li = document.createElement("li");
    li.className = LINE_CLASS[l.k] || "";
    li.innerHTML = `<span class="mn num">${l.minute}'</span><span>${ICON[l.k] || ""}${esc(l.t)}</span>`;
    feed.appendChild(li);
    feed.scrollTop = feed.scrollHeight;
  }
  function goalFlash(k) {
    flash.textContent = k === "goal-them" ? "실점" : "GOAL";
    flash.className = `goal-flash ${k === "goal-them" ? "against" : ""}`;
    flash.hidden = false;
    clearTimeout(flash._t);
    flash._t = setTimeout(() => { flash.hidden = true; }, 1300);
    goalCam(k);
    const scr = root.querySelector(".match-screen");
    scr.classList.remove("shake"); void scr.offsetWidth; scr.classList.add(k === "goal-them" ? "shake-soft" : "shake");
    setTimeout(() => scr.classList.remove("shake", "shake-soft"), 700);
    if (k === "goal-them") { sfx.play("concede"); buzz(40); }
    else { sfx.play("goal"); buzz(k === "goal-me" ? [70, 50, 70, 50, 160] : [60, 40, 120]); }
  }

  // 교체 투입 연출: 대기심의 번호판 + "경기에 투입됩니다"
  function subBoard(outNo) {
    const wrap = root.querySelector("#pitch");
    wrap.querySelector(".sub-board")?.remove();
    wrap.insertAdjacentHTML("beforeend", `<div class="sub-board" role="status">
      <div class="sb-panel">
        <div class="sb-head">SUBSTITUTION</div>
        <div class="sb-nums"><span class="sb-out"><i>OUT</i><b class="num">${esc(String(outNo || "–"))}</b></span><span class="sb-in"><i>IN</i><b class="num">${p.number}</b></span></div>
      </div>
      <div class="sb-msg"><span class="sb-name">${esc(p.name)}</span> 경기에 투입됩니다</div>
    </div>`);
    sfx.play("kickoff"); setTimeout(() => sfx.play("up"), 450);
    buzz([40, 60, 120]);
    const scr = root.querySelector(".match-screen");
    scr.classList.add("subbing");
    setTimeout(() => { wrap.querySelector(".sub-board")?.classList.add("out"); scr.classList.remove("subbing"); }, 2300);
    setTimeout(() => wrap.querySelector(".sub-board")?.remove(), 2800);
  }

  // 줄을 하나씩 보여 주며 선수들을 움직임
  function play(lines, then) {
    queue = lines.slice();
    after = then;
    step();
  }
  function step() {
    clearTimeout(timer);
    if (paused) return;
    const l = queue.shift();
    if (!l) { const f = after; after = null; f?.(); return; }
    const ms = SPEED[speed] * (l.fast ? 0.62 : 1);
    if (l.subIn) { const tok = players.find(x => x.team === "us" && x.name === l.outName) || players.find(x => x.subSlot); if (tok) swapToken(tok, { name: p.name, number: p.number }, true); subBoard(l.outNo); }
    if (l.injuredOff) { const tok = players.find(x => x.me); if (tok) swapToken(tok, l.injuredOff, false); }
    if (l.ball) draw(l.ball, l.poss, ms, { actor: l.actor, press: l.press, holderIsMe: !!(l.toMe || l.meHold) && !l.actor });
    addLine(l);
    if (l.score) shown = l.score.slice();
    if (l.minute != null) shownMin = l.minute;
    if (l.half2 || (l.minute != null && l.minute > HALF_MIN)) setHalf(true);   // 후반 킥오프 문장부터 진영 교체
    if (l.k?.startsWith("goal")) goalFlash(l.k);
    updateBoard();
    timer = setTimeout(step, l.subIn ? Math.max(2600, ms) : l.silent ? ms * 0.7 : (l.k?.startsWith("goal") ? ms * 1.4 : ms));
  }

  // ── 경기 전 ──
  const statusLine = m.onPitch
    ? (m.status === "sub" ? STATUS_LABEL.bench : STATUS_LABEL[m.status])   // 교체 투입은 미리 알려 주지 않음
    : `${STATUS_LABEL[m.status]}${m.reason ? `: ${m.reason}` : ""}`;
  const barPct = v => Math.round(Math.max(5, Math.min(95, 50 + (v - 50) * 3)));
  ctl.innerHTML = `<div class="prematch">
    <div class="pm-me">
      <div class="pm-face">${img(faceOf(p, state.calendar.grade), p.name)}</div>
      <div><div class="pm-name">${p.number}. ${esc(p.name)} <span class="pos-tag ${p.position}">${p.position}</span></div>
        <div class="pm-status ${m.status === "start" ? "" : "off"}">${statusLine}</div></div>
    </div>
    ${(() => { const c = conditionOf(p); const mp = Math.round(c.match * 100);
      const role = m.status !== "start" ? "" : m.star >= 1 ? "에이스. 상대가 집중 견제합니다" : m.star >= 0.4 ? "핵심 선수" : "팀의 일원";
      const wx = { rain: "☔ 비, 미끄러운 잔디", hot: "☀️ 무더위", cold: "❄️ 매서운 추위", wind: "🌬️ 강한 바닷바람" }[m.weather];
      const sk = { night: "🌙 조명 경기", dusk: "🌇 해 질 녘" }[m.sky];
      return `<div class="pm-tags"><span class="cond ${c.cls}">컨디션 ${c.label}</span><span class="mute">선택 성공률 ${mp > 0 ? "+" : ""}${mp}%p</span>
        ${wx ? `<span class="chip wx">${wx}</span>` : ""}${sk ? `<span class="chip wx">${sk}</span>` : ""}
        ${role ? `<span class="chip ${m.star >= 1 ? "kit" : ""}">영향력: ${role}</span>` : ""}</div>`; })()}
    ${m.talk ? `<div class="talk">
      <div class="talk-face">${img(m.talk.who === "coach" ? "npc_coach" : "npc_assistant", "")}</div>
      <div><div class="talk-who">${esc(m.talk.who === "coach" ? STAFF.coach : STAFF.assistant)}</div>
        <p>"${esc(m.talk.text)}"</p>
        ${m.talk.tag ? `<span class="chip kit">지시: ${TAG_LABEL[m.talk.tag]}</span> <span class="mute" style="font-size:12px">같은 종류를 고르면 성공률 +4%p</span>` : ""}</div></div>` : ""}
    ${fx.school ? `<div class="alert gold">🎓 오늘 ${esc(fx.school.name)}(${tierLabel(fx.school.tier)}) ${esc(fx.school.coach)}님이 직접 보러 오셨습니다. 상대는 고등학생이라 몸싸움이 버겁습니다.</div>` : ""}
    ${m.oppAce ? `<div class="alert">👀 주목할 상대: ${m.oppAce.pos} ${m.oppAce.number}번 ${esc(m.oppAce.name)} (${m.oppAce.grade}학년${m.oppAce.trait ? `, ${esc(m.oppAce.trait)}` : ""})</div>`
      : m.oppAceAbsent ? `<div class="alert">${esc(fillText("상대 에이스 {a|이/가} 오늘은 나오지 않습니다.", { a: m.oppAceAbsent }))}</div>` : ""}
    ${fx.jn ? `<div class="alert gold">🎽 전남 대표로 나선 전국소년체전 ${esc(fx.round)}. 도내 여러 학교에서 뽑힌 선수들과 함께 뜁니다. 감독은 김 감독님이 맡으셨습니다.</div>` : ""}
    ${fx.ko ? `<div class="alert gold">지면 탈락입니다. 비기면 승부차기.</div>` : ""}
    ${fx.elementary ? `<div class="alert gold">🧒 오늘은 초등학교 팀과의 연습경기. 이겨야 본전, 지면 한동안 놀림감이다.</div>` : ""}
    <div class="power"><span>우리 전력</span><div class="pw"><i style="width:${barPct(m.ours)}%"></i></div>
      <span>상대 전력</span><div class="pw them"><i style="width:${barPct(m.theirs)}%"></i></div></div>
    <div class="ctl-row"><button class="btn btn-ghost" data-skip>결과만 보기</button><button class="btn btn-kit" data-start>${m.status === "start" ? "킥오프" : "경기 지켜보기"}</button></div>
  </div>`;
  ctl.querySelector("[data-start]").addEventListener("click", () => { setScene("bg_stadium", "match"); sfx.play("kickoff"); controls(); tick(); });
  ctl.querySelector("[data-skip]").addEventListener("click", skipAll);

  function controls() {
    ctl.innerHTML = `<div class="ctl-row">
      <button class="btn btn-ghost" data-pause>일시정지</button>
      <button class="btn btn-ghost" data-speed>${speed === "fast" ? "보통 속도" : "빠르게"}</button>
      <button class="btn" data-skip>결과만 보기</button></div>`;
    ctl.querySelector("[data-pause]").addEventListener("click", e => {
      paused = !paused; e.target.textContent = paused ? "계속" : "일시정지";
      if (!paused) (queue.length || after ? step() : tick()); else clearTimeout(timer);
    });
    ctl.querySelector("[data-speed]").addEventListener("click", e => {
      speed = speed === "normal" ? "fast" : "normal"; e.target.textContent = speed === "fast" ? "보통 속도" : "빠르게";
    });
    ctl.querySelector("[data-skip]").addEventListener("click", skipAll);
  }

  function tick() {
    clearTimeout(timer);
    if (paused) return;
    const r = next(state, m);
    play(r.lines, () => {
      if (r.kind === "moment") return showMoment();
      if (r.kind === "ht") { sfx.play("half"); return showHalftime(); }
      if (r.kind === "ft") { sfx.play("full"); return end(); }
      timer = setTimeout(tick, r.lines.length ? 120 : 0);
    });
  }

  function showMoment() {
    const pd = m.pending;
    ctl.innerHTML = `<div class="moment" role="group" aria-label="선택">
      <p class="mo-text"><span class="num">${m.minute}'</span> ${esc(pd.text)}</p>
      <div class="mo-choices">${pd.choices.map((c, i) => `<button class="mo-btn" data-c="${i}">
        <span>${c.signature ? `<b class="sigb">★ 특기</b> ` : ""}${esc(c.label)}${c.follow ? ` <b class="follow">지시</b>` : ""}${c.timing ? ` <b class="tmark" title="타이밍 버튼">⏱</b>` : ""}</span><span class="lv ${c.level === "높음" ? "hi" : c.level === "보통" ? "mid" : "lo"}">${c.level}</span></button>`).join("")}</div>
      <button class="linkbtn" data-autopick>알아서 하기</button>
    </div>`;
    ctl.classList.add("ask");
    buzz(60);
    const pickIt = (i, timing = null) => {
      if (!m.pending || m.done) return;                 // 그 사이 '결과만 보기'를 눌렀으면 무시
      ctl.classList.remove("ask");
      const r = resolve(state, m, i, timing);
      controls();
      paused = false;
      play(r.lines, () => { timer = setTimeout(tick, 200); });
    };
    const choose = i => {
      const kind = pd.choices[i].timing;
      if (!kind || app.settings.timing === false) return pickIt(i);
      timingGame(kind, i, res => pickIt(i, res));
    };
    ctl.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => choose(+b.dataset.c)));
    ctl.querySelector("[data-autopick]").addEventListener("click", () => pickIt(autoChoice(m)));
    ctl.querySelector("[data-c]").focus({ preventScroll: true });
  }

  // 결정적 장면: 움직이는 바늘을 초록 칸에 맞춰 누르기
  function timingGame(T, i, done) {
    const sv = getPath(p.stats, T.stat);
    const width = 16 + sv * 0.12;                       // 초록 칸 너비(%)
    const center = 30 + Math.random() * 40;
    const lo = center - width / 2, hi = center + width / 2, plo = center - width / 6, phi = center + width / 6;
    const period = 1300 - Math.min(400, sv * 3);         // 바늘 왕복 시간(ms)
    ctl.innerHTML = `<div class="timing">
      <p class="tm-title"><b>${T.label} 타이밍!</b> 바늘이 초록 칸에 올 때 누르세요</p>
      <div class="tbar"><i class="zone" style="left:${lo}%;width:${width}%"></i><i class="perfect" style="left:${plo}%;width:${phi - plo}%"></i><b class="needle" id="needle"></b></div>
      <button class="btn btn-kit btn-wide tm-btn" data-hit>${T.btn}</button></div>`;
    const needle = ctl.querySelector("#needle");
    const t0 = performance.now();
    let raf, fin = false, pos = 0;
    const loop = now => {
      const ph = ((now - t0) % period) / period;
      pos = ph < 0.5 ? ph * 200 : (1 - ph) * 200;
      needle.style.left = `${pos}%`;
      if (now - t0 > period * 3.2) return hit(true);
      raf = requestAnimationFrame(loop);
    };
    const hit = (timeout = false) => {
      if (fin) return; fin = true;
      cancelAnimationFrame(raf); document.removeEventListener("keydown", key);
      const res = timeout ? "miss" : pos >= plo && pos <= phi ? "perfect" : pos >= lo && pos <= hi ? "good" : "miss";
      sfx.play(res === "miss" ? "bad" : "good");
      ctl.querySelector(".timing").insertAdjacentHTML("beforeend", `<p class="tm-res ${res}">${{ perfect: "완벽한 타이밍! 성공률 크게 상승", good: "좋은 타이밍! 성공률 상승", miss: timeout ? "머뭇거렸다…" : "타이밍이 어긋났다…" }[res]}</p>`);
      setTimeout(() => done(res), 650);
    };
    const key = e => { if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); hit(); } };
    document.addEventListener("keydown", key);
    ctl.querySelector("[data-hit]").addEventListener("pointerdown", e => { e.preventDefault(); hit(); });
    raf = requestAnimationFrame(loop);
  }

  function showHalftime() {
    const t = m.htTalk;
    const startBtn = (extra = "") => {
      let left = 8;
      ctl.innerHTML = `${extra}<div class="ctl-row"><button class="btn btn-kit btn-wide" data-second>${m.subbedOff ? "후반 지켜보기" : "후반 시작"} <span class="mute" id="htc">(${left})</span></button></div>`;
      const go = () => { clearInterval(iv); root.querySelector(".ht-scene")?.remove(); controls(); tick(); };
      const iv = setInterval(() => { left--; const c = ctl.querySelector("#htc"); if (c) c.textContent = `(${left})`; if (left <= 0) go(); }, 1000);
      ctl.querySelector("[data-second]").addEventListener("click", go);
    };
    if (!t) return startBtn();
    // 라커룸: 감독님이 나를 따로 불러서 하는 말과 내 대답 (경기장 자리에 라커룸 그림)
    root.querySelector("#pitch").insertAdjacentHTML("beforeend", `<div class="ht-scene" aria-hidden="true"><img src="assets/img/ev_halftime.webp" data-name="ev_halftime" alt="" onerror="__bgFallback(this)"></div>`);
    const face = `<div class="talk-face">${img("npc_coach", "")}</div>`;
    ctl.innerHTML = `<div class="ht-talk ${t.mood}">
      <div class="ht-tag">${{ praise: "하프타임 · 칭찬", scold: "하프타임 · 쓴소리", calm: "하프타임 · 주문", off: "하프타임 · 교체" }[t.mood]}</div>
      <div class="talk">${face}<div><div class="talk-who">${esc(STAFF.coach)}</div><p>"${esc(t.text)}"</p></div></div>
      <div class="mo-choices">${t.choices.map((c, i) => `<button class="mo-btn" data-h="${i}"><span>${esc(c.label)}</span></button>`).join("")}</div>
    </div>`;
    ctl.classList.add("ask");
    buzz(40);
    ctl.querySelectorAll("[data-h]").forEach(b => b.addEventListener("click", () => {
      const r = applyHalftime(state, m, +b.dataset.h);
      ctl.classList.remove("ask");
      sfx.play(t.mood === "scold" || t.mood === "off" ? "half" : "good");
      const buff = m.htBuff ? `<span class="chip kit">후반 ${m.htBuff.tag ? `${TAG_LABEL[m.htBuff.tag]} 선택` : "모든 선택"} 성공률 +${Math.round(m.htBuff.bonus * 1000) / 10}%p</span>` : "";
      startBtn(`<div class="talk">${face}<div><div class="talk-who">${esc(STAFF.coach)}</div><p>"${esc(r?.reply || "")}"</p>${buff}</div></div>`);
    }));
    ctl.querySelector("[data-h]")?.focus({ preventScroll: true });
  }

  function skipAll() {
    clearTimeout(timer);
    root.querySelector(".ht-scene")?.remove();
    setScene("bg_stadium", "match");
    ctl.classList.remove("ask");
    queue.forEach(addLine); queue = []; after = null;
    const before = m.feed.length;
    autoPlay(state, m);
    m.feed.slice(before).forEach(addLine);
    shown = m.score.slice();
    end();
  }

  function end() {
    clearTimeout(timer);
    const before = m.feed.length;
    const res = finishMatch(state, m);
    m.feed.slice(before).forEach(addLine);
    draw([52.5, 34], null, 600);
    shown = m.score.slice();
    updateBoard();
    const resCls = { 승: "W", 무: "D", 패: "L" }[res.result];
    const goals = m.goalsLog.map(g => `<li class="${g.team}">${g.minute}' ${esc(g.name)}${g.assist ? ` <span class="mute">(도움 ${esc(g.assist)})</span>` : ""}</li>`).join("");
    ctl.innerHTML = `<div class="postmatch">
      <div class="pm-head"><span class="badge-res ${resCls}">${res.result}</span>
        <span class="num">${fx.usName ? esc(fx.usName) : TEAM_NAME} ${res.gf} : ${res.ga} ${esc(res.opponent)}</span>
        ${res.shootout ? `<span class="mute">(승부차기 ${res.shootout.us}:${res.shootout.them})</span>` : ""}</div>
      ${goals ? `<ul class="pm-goals">${goals}</ul>` : ""}
      ${res.minutes > 0 ? `<div class="pm-rating">
          <div class="rt num ${res.rating >= 7.5 ? "hi" : res.rating >= 6.5 ? "mid" : "lo"}">${res.rating.toFixed(1)}</div>
          <div><div>${STATUS_LABEL[res.status]} ${res.minutes}분${res.goals ? `, ${res.goals}골` : ""}${res.assists ? `, ${res.assists}도움` : ""}</div>
          <div class="mute" style="font-size:13px">선택 ${m.my.decisions}번 중 ${m.my.successes}번 성공${res.mom ? ` <span class="chip kit">경기 최우수 선수</span>` : ""}${res.subbedOff ? ` <span class="chip">하프타임 교체</span>` : ""}</div></div>
        </div>` : `<p class="mute">${esc(res.reason || STATUS_LABEL[res.status])}</p>`}
      ${m.mom ? `<p class="pm-mom">🏅 경기 최우수 선수: ${m.mom.team === "them" ? `${esc(res.opponent)} ` : ""}<b>${esc(m.mom.name)}</b></p>` : ""}
      ${m.teamRatings?.length ? `<details class="pm-team"><summary>우리 팀 평점 보기</summary><ul>${m.teamRatings.map(t => `<li class="${t.me ? "me" : ""}">
        <span class="pos-tag ${t.pos === "GK" ? "" : t.pos}">${t.pos}</span><span class="num">${t.number}</span><span class="nm">${esc(t.name)}${t.name === m.mom?.name && m.mom.team === "us" ? " ★" : ""}</span>
        <b class="rt num ${t.r >= 7.5 ? "hi" : t.r >= 6.5 ? "mid" : "lo"}">${t.r.toFixed(1)}</b></li>`).join("")}</ul></details>` : ""}
      ${res.notes.length ? `<ul class="pm-notes">${res.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
      <p class="mute" style="font-size:13px;margin:0">감독님 면담과 경기 기록은 메시지함에 왔습니다.</p>
      <button class="btn btn-kit btn-wide" data-done>${fx.jn && state.jnCup?.alive && !p.condition.injury ? `다음 경기로 (${["1회전", "준결승", "결승"][state.jnCup.stage]})` : "이번 주 마무리"}</button>
    </div>`;
    ctl.querySelector("[data-done]").addEventListener("click", () => { ro?.disconnect(); removeEventListener("resize", fitPitch); cancelAnimationFrame(bRaf); onDone(res); });
    ctl.querySelector("[data-done]").focus({ preventScroll: true });
  }
}
