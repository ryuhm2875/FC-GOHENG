// 화면 연출: 뒤에 깔리는 배경 그림, 화면 들어올 때 움직임, 숫자 올라가기, 그림 미리 불러오기
export const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// 저사양 기기는 흐림 효과와 배경 움직임을 끕니다
(function liteMode() {
  const n = navigator, cores = n.hardwareConcurrency || 8, mem = n.deviceMemory || 8;
  if (cores <= 4 && mem <= 3) document.documentElement.classList.add("lite");
})();

// ── 화면 뒤 배경 (홈: 저녁 운동장, 경기: 경기장) ──
// mode: home 은은하게 / dim 더 어둡게 / match 경기 화면 / prematch 경기 직전
let curScene = null;
export function setScene(name, mode = "dim") {
  let host = document.getElementById("scene");
  if (!host) {
    host = document.createElement("div");
    host.id = "scene"; host.setAttribute("aria-hidden", "true");
    document.body.prepend(host);
  }
  host.dataset.mode = name ? mode : "none";
  if (name === curScene) return;
  curScene = name;
  const layer = document.createElement("div");
  layer.className = "scene-layer";
  if (name) {
    const im = new Image();
    im.alt = ""; im.decoding = "async";
    im.onerror = () => { if (!im.dataset.tried) { im.dataset.tried = "1"; im.src = `assets/img/${name}.png`; } else im.remove(); };
    im.src = `assets/img/${name}.webp`;
    layer.appendChild(im);
  }
  host.appendChild(layer);
  requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("on")));
  const old = [...host.children].slice(0, -1);
  setTimeout(() => old.forEach(o => o.remove()), 1100);
}

// ── 화면이 바뀔 때 새 화면이 부드럽게 올라오게 ──
export function enter(el) {
  if (!el || reduced()) return;
  el.classList.remove("enter");
  void el.offsetWidth;          // 애니메이션 다시 시작
  el.classList.add("enter");
  setTimeout(() => el.classList.remove("enter"), 900);
}

// ── 숫자가 from → to 로 올라감 ──
export function countUp(el, from, to, { ms = 700, delay = 0, digits = 0 } = {}) {
  if (reduced()) { el.textContent = to.toFixed(digits); return; }
  el.textContent = from.toFixed(digits);
  const start = performance.now() + delay;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const loop = now => {
    const t = Math.min(1, Math.max(0, (now - start) / ms));
    el.textContent = (from + (to - from) * ease(t)).toFixed(digits);
    if (t < 1) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ── 그림 미리 불러오기 (화면이 바뀔 때 그림이 늦게 뜨지 않도록) ──
const loaded = new Set();
export function preload(names) {
  const list = names.filter(n => n && !loaded.has(n));
  if (!list.length) return;
  const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
  const nextOne = () => {
    const n = list.shift();
    if (!n) return;
    loaded.add(n);
    const im = new Image();
    im.onload = im.onerror = () => idle(nextOne);
    im.src = `assets/img/${n}.webp`;
  };
  idle(nextOne);
}
export const SCENES = ["bg_home", "bg_prematch", "bg_stadium", "ev_retreat", "ev_singapore", "ev_sportsday", "ev_ski", "ev_festival", "ev_graduation", "bg_field_day",
  "ev_office", "ev_classroom", "ev_dinner", "ev_birthday", "ev_birthday_home", "ev_jjajang", "ev_welcome", "ev_schooltrip", "bg_sea", "bg_locker"];

// ── 짧은 진동 (휴대폰) ──
export function buzz(pattern) {
  try { navigator.vibrate?.(pattern); } catch { /* 지원 안 하면 무시 */ }
}
