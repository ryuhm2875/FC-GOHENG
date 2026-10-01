// 화면 공용 도구
import { STAT_GROUPS } from "../../data/player.js";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 그림이 아직 없으면 실루엣으로 대신합니다 (.png → .webp → 실루엣 순서로 시도)
const SILHOUETTE = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1C2759"/>` +
  `<circle cx="50" cy="40" r="17" fill="#3A4785"/><path d="M14 100c2-22 17-33 36-33s34 11 36 33z" fill="#F26B1D"/>` +
  `<path d="M38 68l12 9 12-9" fill="none" stroke="#1F2C8F" stroke-width="4"/></svg>`);

window.__imgFallback = el => {
  if (!el.dataset.tried) { el.dataset.tried = "1"; el.src = `assets/img/${el.dataset.name}.webp`; }
  else { el.onerror = null; el.src = SILHOUETTE; }
};

export const img = (name, alt = "") =>
  `<img src="assets/img/${name}.png" data-name="${esc(name)}" alt="${esc(alt)}" loading="lazy" onerror="__imgFallback(this)">`;

export const faceOf = (player, grade) => `${player.face}_g${Math.min(3, Math.max(1, grade))}`;

export const fl = v => Math.floor(v);

export function stars(n) {
  const pct = Math.round((n / 5) * 100);
  return `<span class="starbar" style="--p:${pct}%" aria-label="코치 평가 별 ${n}개"></span>`;
}

export function gauge(label, value, { invert = false, max = 100 } = {}) {
  const v = Math.round(value);
  const good = invert ? 100 - v : v;
  const cls = good >= 55 ? "" : good >= 30 ? "warn" : "bad";
  return `<div class="gauge"><span>${label}</span>
    <div class="track"><div class="fill ${cls}" style="width:${Math.min(100, (v / max) * 100)}%"></div></div>
    <span class="v num">${v}</span></div>`;
}

export function statLevel(v) { return v >= 70 ? "hi" : v >= 50 ? "mid" : v >= 15 ? "" : "lo"; }

export function signed(d, digits = 1) {
  const s = d.toFixed(digits);
  return d > 0 ? `+${s}` : s;
}

export const groupsOf = () => STAT_GROUPS;

export const AVATAR = { coach: "📣", school: "🏫", family: "🏠", group: "💬", medical: "🩺", system: "🔔", scout: "🎓" };

// 문장 채우기: {name} → 값, {name|이/가} → 받침에 맞는 조사
function batchim(word) {
  const c = String(word).charCodeAt(String(word).length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 !== 0;
  return false;
}
export function fillText(tpl, vars) {
  return tpl.replace(/\{(\w+)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => {
    const v = vars[k] ?? "";
    return a ? v + (batchim(v) ? a : b) : v;
  });
}
