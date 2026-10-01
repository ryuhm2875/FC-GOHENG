// 훈련 미니게임 4종. 결과 등급에 따라 그 훈련의 능력치 상승량이 달라집니다.
//   S ×1.5 / A ×1.25 / B ×1.0 / C ×0.8   (건너뛰면 B)
// 해당 능력치가 높을수록 조금씩 쉬워집니다.
import { openModal } from "./modals.js";

export const GRADES = { S: 1.5, A: 1.25, B: 1.0, C: 0.8 };
const STAT_FOR = { shooting: "tech.shoot", passing: "tech.pass", dribble: "tech.dribble", weight: "phys.strength" };
const INFO = {
  shooting: { title: "슈팅 훈련", tag: "SHOOTING DRILL", how: "조준점이 골문 위를 움직입니다. 골키퍼를 피해 구석을 노려 누르세요. 다섯 번 찹니다.", btn: "슈팅" },
  passing:  { title: "패스 훈련", tag: "PASSING DRILL", how: "동료 등번호를 1부터 6까지 순서대로 빠르게 누르세요. 흰 유니폼 상대를 누르면 끊깁니다.", btn: null },
  dribble:  { title: "드리블 훈련", tag: "DRIBBLE DRILL", how: "달려드는 수비를 왼쪽·오른쪽으로 피하세요. 12초 버티면 끝입니다. 방향키나 밀기도 됩니다.", btn: null },
  weight:   { title: "웨이트 트레이닝", tag: "STRENGTH", how: "줄어드는 원이 주황 테두리에 닿는 순간 누르세요. 여섯 번 들어 올립니다.", btn: "들어 올리기" },
};
const ease = v => Math.max(0, Math.min(1, (v - 20) / 60));
export function statFor(kind) { return STAT_FOR[kind]; }

// 공통 그래픽 조각
const SHIRT = (fill, stroke, num, numFill = "#fff") => `<path d="M-5 -4 L-2 -6 Q0 -4.6 2 -6 L5 -4 L6.5 -0.5 L4 0.6 L4 6 L-4 6 L-4 0.6 L-6.5 -0.5 Z" fill="${fill}" stroke="${stroke}" stroke-width=".6" stroke-linejoin="round"/>
  ${num != null ? `<text y="3.2" text-anchor="middle" class="mg-num" fill="${numFill}">${num}</text>` : ""}`;
const BALL = r => `<g class="mg-ball"><circle r="${r}" fill="#fff" stroke="#111" stroke-width="${r * 0.12}"/><path d="M0 ${-r * 0.42} L${r * 0.4} ${-r * 0.12} L${r * 0.25} ${r * 0.36} L${-r * 0.25} ${r * 0.36} L${-r * 0.4} ${-r * 0.12} Z" fill="#111"/></g>`;
const DEFS = `<defs>
  <linearGradient id="mgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081A"/><stop offset="1" stop-color="#18245E"/></linearGradient>
  <linearGradient id="mgTurf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F8A4C"/><stop offset="1" stop-color="#14663A"/></linearGradient>
  <pattern id="mgNet" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H3 M0 0 V3" stroke="rgba(255,255,255,.35)" stroke-width=".35"/></pattern>
  <pattern id="mgCrowd" width="4" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1.2" r=".7" fill="rgba(255,255,255,.18)"/><circle cx="3" cy="2.2" r=".6" fill="rgba(255,140,60,.22)"/></pattern>
  <radialGradient id="mgLight" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="rgba(255,255,255,.28)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
  <filter id="mgGlow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

export function playMinigame(kind, statValue, slotLabel) {
  return new Promise(resolve => {
    const info = INFO[kind];
    let finished = false, stop = () => {};
    const html = `<div class="mg">
      <div class="mg-head"><span class="eyebrow">${info.tag}</span><h2>${info.title}</h2><span class="mute">${slotLabel}</span></div>
      <p class="sub">${info.how}</p>
      <div class="mg-area k-${kind}" id="mga"></div>
      <div class="mg-status" id="mgs" aria-live="polite"></div>
      <div class="ctl-row" id="mgc"><button class="btn btn-ghost" data-skip>건너뛰기 (B등급)</button><button class="btn btn-kit" data-go>시작</button></div>
    </div>`;
    openModal(html, (el, close) => {
      const area = el.querySelector("#mga"), status = el.querySelector("#mgs"), ctl = el.querySelector("#mgc");
      PREVIEW[kind](area);
      const done = grade => {
        if (finished) return; finished = true; stop();
        const mult = GRADES[grade];
        area.insertAdjacentHTML("beforeend", `<div class="mg-result"><span class="mg-bigrade m${grade}">${grade}</span><span>훈련 효과 ×${mult}</span></div>`);
        status.textContent = "";
        ctl.innerHTML = `<button class="btn btn-kit btn-wide" data-ok>확인</button>`;
        ctl.querySelector("[data-ok]").addEventListener("click", () => { close(); resolve({ grade, mult }); });
        ctl.querySelector("[data-ok]").focus({ preventScroll: true });
      };
      ctl.querySelector("[data-skip]").addEventListener("click", () => { finished = true; stop(); close(); resolve({ grade: "B", mult: 1, skipped: true }); });
      ctl.querySelector("[data-go]").addEventListener("click", () => {
        ctl.innerHTML = info.btn ? `<button class="btn btn-kit btn-wide mg-act" data-act>${info.btn}</button>` : "";
        stop = GAMES[kind](area, status, ctl, ease(statValue), done) || (() => {});
      });
    }, { dismissable: false });
  });
}

// 시작 전 미리보기 화면
const PREVIEW = {
  shooting: area => { area.innerHTML = shootScene(); },
  passing: area => { area.innerHTML = `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}${pitch()}<text x="50" y="33" class="mg-cap">준비되면 시작</text></svg>`; },
  dribble: area => { area.innerHTML = `<div class="mg-lanes"><div class="mg-turfscroll"></div><div class="mg-me"><svg viewBox="-8 -8 16 16">${SHIRT("#FF6B1A", "#fff", null)}</svg></div></div>`; },
  weight: area => { area.innerHTML = weightScene(); },
};

// ── 슈팅 ────────────────────────────
function shootScene() {
  return `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}
    <rect width="100" height="60" fill="url(#mgSky)"/>
    <rect y="0" width="100" height="16" fill="url(#mgCrowd)"/>
    <rect width="100" height="60" fill="url(#mgLight)"/>
    <rect y="40" width="100" height="20" fill="url(#mgTurf)"/>
    <path d="M0 40 H100" stroke="rgba(255,255,255,.5)" stroke-width=".4"/>
    <rect x="12" y="14" width="76" height="27" fill="url(#mgNet)"/>
    <path d="M12 41 V14 H88 V41" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
    <g transform="translate(0,40)"><g id="gk" class="mg-gkmove"><g class="mg-keeper">
      <rect x="-5" y="-15" width="10" height="11" rx="2" fill="#2D3FD1" stroke="#fff" stroke-width=".4"/>
      <rect x="-9.5" y="-14" width="5" height="2.4" rx="1.2" fill="#2D3FD1"/><rect x="4.5" y="-14" width="5" height="2.4" rx="1.2" fill="#2D3FD1"/>
      <circle cx="-10" cy="-12.8" r="1.6" fill="#FFC93C"/><circle cx="10" cy="-12.8" r="1.6" fill="#FFC93C"/>
      <circle cy="-18" r="3" fill="#F2C49B"/><rect x="-4" y="-4" width="3" height="4" fill="#111"/><rect x="1" y="-4" width="3" height="4" fill="#111"/></g></g></g>
    <g id="aim" transform="translate(50,26)" filter="url(#mgGlow)"><circle r="3.2" fill="none" stroke="#FFC93C" stroke-width=".7"/><path d="M-5 0 H-2 M2 0 H5 M0 -5 V-2 M0 2 V5" stroke="#FFC93C" stroke-width=".7"/></g>
    <g transform="translate(50,54)"><g id="sball">${BALL(2.2)}</g></g>
    <g id="balls"></g>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(5)}</span><span id="pts" class="num">0점</span></div>`;
}
function shooting(area, status, ctl, e, done) {
  area.innerHTML = shootScene();
  const aim = area.querySelector("#aim"), gk = area.querySelector("#gk"), ball = area.querySelector("#sball"), dots = area.querySelectorAll("#dots i"), pts = area.querySelector("#pts");
  const period = 1500 - e * 650;
  const gkW = 26 - e * 8;
  let shot = 0, score = 0, x = 50, y = 26, t0 = performance.now(), raf, lock = false, gkC = 50;
  const placeGk = () => { gkC = 30 + Math.random() * 40; gk.style.transform = `translateX(${gkC}px)`; };
  placeGk();
  const loop = now => {
    const t = (now - t0) / period;
    x = 50 + Math.sin(t * Math.PI * 2) * 34; y = 27 + Math.sin(t * Math.PI * 3.1) * 8;
    aim.setAttribute("transform", `translate(${x},${y})`);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const fire = () => {
    if (lock) return; lock = true;
    const saved = Math.abs(x - gkC) <= gkW / 2;
    const corner = x < 26 || x > 74;
    const p = saved ? 0 : corner ? 2 : 1;
    score += p;
    // 공이 날아가고 골키퍼가 몸을 날림
    ball.style.transition = "transform .32s cubic-bezier(.2,.7,.3,1)";
    ball.style.transform = `translate(${x - 50}px, ${y - 54}px) scale(.7)`;
    const dive = Math.max(-14, Math.min(14, (x - gkC) * 0.8));
    gk.querySelector(".mg-keeper").style.transform = `translateX(${dive}px) rotate(${dive * 3}deg)`;
    const d = dots[shot]; d.className = saved ? "miss" : corner ? "top" : "hit";
    shot++;
    pts.textContent = `${score}점`;
    status.innerHTML = `<b class="${saved ? "down" : "up"}">${saved ? "막혔다!" : corner ? "구석! +2" : "골! +1"}</b>`;
    setTimeout(() => {
      area.querySelector("#balls").insertAdjacentHTML("beforeend", `<g transform="translate(${x},${y}) scale(.55)" opacity=".75">${BALL(2.2)}</g>`);
      ball.style.transition = "none"; ball.style.transform = "";
      gk.querySelector(".mg-keeper").style.transform = "";
      if (shot >= 5) return done(score >= 8 ? "S" : score >= 6 ? "A" : score >= 4 ? "B" : "C");
      placeGk(); lock = false;
    }, 650);
  };
  ctl.querySelector("[data-act]").addEventListener("click", fire);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); fire(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 패스 ────────────────────────────
function pitch() {
  return `<rect width="100" height="60" fill="url(#mgTurf)"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 16.7}" width="8.35" height="60" fill="rgba(255,255,255,.035)"/>`).join("")}
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".4"><rect x="2" y="2" width="96" height="56"/><path d="M50 2 V58"/><circle cx="50" cy="30" r="8"/><rect x="2" y="17" width="12" height="26"/><rect x="86" y="17" width="12" height="26"/></g>`;
}
function passing(area, status, ctl, e, done) {
  const limit = 6 + e * 3;
  const spots = [];
  const far = (x, y) => spots.every(s => Math.hypot(s.x - x, s.y - y) > 15);
  while (spots.length < 8) { const x = 9 + Math.random() * 82, y = 10 + Math.random() * 40; if (far(x, y)) spots.push({ x, y }); }
  area.innerHTML = `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}${pitch()}
    <g id="lines"></g>
    ${spots.map((s, i) => i < 6
      ? `<g class="mg-mate" data-n="${i + 1}" transform="translate(${s.x},${s.y}) scale(1.15)"><circle r="7.5" fill="transparent"/>${SHIRT("#FF6B1A", "#fff", i + 1)}</g>`
      : `<g class="mg-foe" data-foe transform="translate(${s.x},${s.y}) scale(1.1)"><circle r="7" fill="transparent"/>${SHIRT("#F4F6FF", "#2D3FD1", null)}</g>`).join("")}
    <g id="pball" transform="translate(50,30)">${BALL(1.6)}</g>
  </svg>
  <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="nx" class="num">다음 1</span></div>`;
  const lines = area.querySelector("#lines"), pball = area.querySelector("#pball"), tbar = area.querySelector("#tbar"), nx = area.querySelector("#nx");
  let nextN = 1, mistakes = 0, start = performance.now(), timer, last = { x: 50, y: 30 };
  const tick = () => {
    const left = limit - (performance.now() - start) / 1000;
    tbar.style.width = `${Math.max(0, left / limit) * 100}%`;
    tbar.className = left < limit * 0.3 ? "low" : "";
    status.textContent = mistakes ? `실수 ${mistakes}` : "";
    if (left <= 0) return finish();
    timer = requestAnimationFrame(tick);
  };
  const finish = () => {
    cancelAnimationFrame(timer);
    const used = (performance.now() - start) / 1000, made = nextN - 1;
    done(made === 6 && mistakes === 0 && used < limit * 0.65 ? "S" : made === 6 && mistakes <= 1 ? "A" : made >= 4 ? "B" : "C");
  };
  area.querySelectorAll("[data-n]").forEach(g => g.addEventListener("pointerdown", () => {
    const s = spots[+g.dataset.n - 1];
    if (+g.dataset.n === nextN) {
      g.classList.add("ok");
      lines.insertAdjacentHTML("beforeend", `<line x1="${last.x}" y1="${last.y}" x2="${s.x}" y2="${s.y}" class="mg-pass"/>`);
      pball.setAttribute("transform", `translate(${s.x + 3},${s.y + 5})`);
      last = s; nextN++; nx.textContent = nextN <= 6 ? `다음 ${nextN}` : "완료";
      if (nextN > 6) finish();
    } else if (!g.classList.contains("ok")) { mistakes++; g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 260); }
  }));
  area.querySelectorAll("[data-foe]").forEach(g => g.addEventListener("pointerdown", () => { mistakes += 2; g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 260); }));
  timer = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(timer);
}

// ── 드리블 ──────────────────────────
function dribble(area, status, ctl, e, done) {
  const DURATION = 12000;
  const speed = 34 - e * 10;
  const gapMs = 820 - e * 220;
  area.innerHTML = `<div class="mg-lanes" id="lanes"><div class="mg-turfscroll"></div>
      <div class="mg-me" id="me"><svg viewBox="-8 -8 16 16">${SHIRT("#FF6B1A", "#fff", null)}</svg><svg class="mg-dball" viewBox="-3 -3 6 6">${BALL(2.4)}</svg></div></div>
    <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="hits" class="num">부딪힘 0</span></div>`;
  ctl.innerHTML = `<button class="btn mg-dir" data-l>◀ 왼쪽</button><button class="btn mg-dir" data-r>오른쪽 ▶</button>`;
  const lanes = area.querySelector("#lanes"), me = area.querySelector("#me"), tbar = area.querySelector("#tbar"), hitsEl = area.querySelector("#hits");
  let lane = 1, hits = 0, foes = [], start = performance.now(), last = start, spawnAt = start + 400, raf;
  const setLane = n => { lane = Math.max(0, Math.min(2, n)); me.style.left = `${lane * 33.33 + 16.66}%`; };
  setLane(1);
  ctl.querySelector("[data-l]").addEventListener("pointerdown", () => setLane(lane - 1));
  ctl.querySelector("[data-r]").addEventListener("pointerdown", () => setLane(lane + 1));
  const key = ev => { if (ev.key === "ArrowLeft") setLane(lane - 1); if (ev.key === "ArrowRight") setLane(lane + 1); };
  document.addEventListener("keydown", key);
  let sx = null;
  lanes.addEventListener("pointerdown", ev => { sx = ev.clientX; });
  lanes.addEventListener("pointerup", ev => { if (sx != null && Math.abs(ev.clientX - sx) > 30) setLane(lane + (ev.clientX > sx ? 1 : -1)); sx = null; });
  const loop = now => {
    const dt = (now - last) / 1000; last = now;
    if (now >= spawnAt) {
      const l = Math.floor(Math.random() * 3);
      const el = document.createElement("div"); el.className = "mg-foe-d";
      el.innerHTML = Math.random() < 0.25 ? `<svg viewBox="-6 -6 12 12"><path d="M0 -5 L4 5 H-4 Z" fill="#FF8A1F" stroke="#fff" stroke-width=".6"/><rect x="-3" y="1" width="6" height="1.2" fill="#fff"/></svg>`
        : `<svg viewBox="-8 -8 16 16">${SHIRT("#F4F6FF", "#2D3FD1", null)}</svg>`;
      el.style.left = `${l * 33.33 + 16.66}%`; lanes.appendChild(el);
      foes.push({ el, l, y: -10, hit: false });
      spawnAt = now + gapMs * (0.7 + Math.random() * 0.6);
    }
    for (const f of foes) {
      f.y += speed * dt * 3;
      f.el.style.top = `${f.y}%`;
      if (!f.hit && f.y > 74 && f.y < 92 && f.l === lane) { f.hit = true; hits++; f.el.classList.add("hit"); lanes.classList.add("shake"); setTimeout(() => lanes.classList.remove("shake"), 200); hitsEl.textContent = `부딪힘 ${hits}`; }
    }
    foes = foes.filter(f => { if (f.y > 110) { f.el.remove(); return false; } return true; });
    const left = (DURATION - (now - start)) / 1000;
    tbar.style.width = `${Math.max(0, left / 12) * 100}%`;
    if (left <= 0) return done(hits === 0 ? "S" : hits === 1 ? "A" : hits <= 3 ? "B" : "C");
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 웨이트 ──────────────────────────
function weightScene() {
  return `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}
    <rect width="100" height="60" fill="#121A44"/>
    <rect width="100" height="60" fill="url(#mgLight)"/>
    <rect y="48" width="100" height="12" fill="#0A0F2A"/><path d="M0 48 H100" stroke="rgba(255,255,255,.12)"/>
    <g transform="translate(50,30)"><g id="bar" class="mg-bar">
      <rect x="-34" y="-.9" width="68" height="1.8" rx=".9" fill="#C9D1DE"/>
      <rect x="-31" y="-8" width="4" height="16" rx="1" fill="#1B1F2E" stroke="#3B4466"/><rect x="-27" y="-6" width="3" height="12" rx="1" fill="#FF6B1A"/>
      <rect x="27" y="-8" width="4" height="16" rx="1" fill="#1B1F2E" stroke="#3B4466"/><rect x="24" y="-6" width="3" height="12" rx="1" fill="#FF6B1A"/>
    </g></g>
    <circle cx="50" cy="30" r="10" class="mg-target"/>
    <circle id="ring" cx="50" cy="30" r="26" class="mg-ring"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(6)}</span><span id="pts" class="num">0점</span></div>`;
}
function weight(area, status, ctl, e, done) {
  area.innerHTML = weightScene();
  const ring = area.querySelector("#ring"), bar = area.querySelector("#bar"), dots = area.querySelectorAll("#dots i"), ptsEl = area.querySelector("#pts");
  const dur = 1300 + e * 300;
  const tol = 1.6 + e * 1.4;
  let rep = 0, score = 0, t0 = performance.now(), raf, lock = false;
  const loop = now => {
    const k = ((now - t0) % dur) / dur;
    ring.setAttribute("r", (26 - k * 22).toFixed(2));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const lift = () => {
    if (lock) return; lock = true;
    const r = +ring.getAttribute("r"), err = Math.abs(r - 10);
    const pts = err <= tol ? 2 : err <= tol * 2.2 ? 1 : 0;
    score += pts;
    dots[rep].className = pts === 2 ? "top" : pts === 1 ? "hit" : "miss";
    rep++;
    ptsEl.textContent = `${score}점`;
    status.innerHTML = `<b class="${pts ? "up" : "down"}">${pts === 2 ? "완벽!" : pts === 1 ? "좋아" : "자세가 무너졌다"}</b>`;
    ring.classList.add(pts === 2 ? "perfect" : pts === 1 ? "good" : "miss");
    bar.classList.add(pts ? "up" : "shake");
    setTimeout(() => {
      ring.classList.remove("perfect", "good", "miss"); bar.classList.remove("up", "shake");
      if (rep >= 6) return done(score >= 10 ? "S" : score >= 7 ? "A" : score >= 4 ? "B" : "C");
      t0 = performance.now(); lock = false;
    }, 480);
  };
  ctl.querySelector("[data-act]").addEventListener("click", lift);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); lift(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

const GAMES = { shooting, passing, dribble, weight };
