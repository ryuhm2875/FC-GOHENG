// 기록실: 끝낸 판의 선수 카드와 업적 (이 기기·브라우저에 남음)
import { GRADE_INFO } from "../../data/endings.js";
import { ACHIEVEMENTS, newAchievements } from "../engine/achievements.js";
import { seenEndings } from "../engine/career.js";
import { openModal } from "./modals.js";
import { esc, img, faceOf } from "./util.js";
import { sfx } from "./sfx.js";

const HALL = "gfc_hall", ACH = "gfc_ach";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장이 안 되면 이번 화면에서만 */ } };
export const readHall = () => read(HALL, []);
export const readAch = () => read(ACH, {});

// 엔딩을 본 판을 카드로 남김 (같은 판은 한 번만)
export function addHallCard(state, ending, c) {
  state.runId ||= `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const hall = readHall();
  if (hall.some(h => h.id === state.runId)) return;
  const p = state.player, r = state.record;
  const rated = r.ratings.filter(x => x != null);
  hall.unshift({
    id: state.runId, at: new Date().toISOString().slice(0, 10),
    name: p.name, position: p.position, face: faceOf(p, 3), numbers: p.numberHistory?.map(h => h.number) || [p.number],
    ending: ending.id, endingTitle: ending.title, grade: ending.grade,
    apps: r.apps, goals: r.goals, assists: r.assists, rating: rated.length ? Math.round(rated.reduce((a, b) => a + b, 0) / rated.length * 100) / 100 : null,
    school: c.schoolName, captain: !!state.flags.captain, medal: state.jnCup?.medal || null, nt: !!state.flags.nationalTeam,
    titles: r.titles.length, ovr: c.ovr,
  });
  write(HALL, hall.slice(0, 60));
}

// 새로 달성한 업적을 저장하고 알림. 돌려주는 값: 새 업적 목록
export function checkAchievements(app, { end = false } = {}) {
  const have = readAch();
  const got = newAchievements(app.state, new Set(Object.keys(have)), { end, hall: readHall(), endings: seenEndings() });
  if (!got.length) return [];
  const day = new Date().toISOString().slice(0, 10);
  for (const a of got) have[a.id] = day;
  write(ACH, have);
  app.toast(got.length === 1 ? `${got[0].icon} 업적 달성: ${got[0].label}` : `🏆 업적 ${got.length}개 달성: ${got.map(a => a.label).join(", ")}`);
  sfx.play("up");
  return got;
}

const MEDAL = { gold: "🥇 소년체전 금", silver: "🥈 소년체전 은", bronze: "🥉 소년체전 동", first: null };

export function hallModal() {
  const hall = readHall(), have = readAch();
  let tab = "hall";
  const cards = () => hall.length ? `<div class="hall-list">${hall.map(h => {
    const g = GRADE_INFO[h.grade] || {};
    const tags = [h.captain ? "Ⓒ 주장" : null, MEDAL[h.medal], h.nt ? "🇰🇷 국가대표" : null, h.titles ? `🏆 우승 ${h.titles}` : null].filter(Boolean);
    return `<article class="hall-card">
      <div class="hc-face">${img(h.face, h.name)}</div>
      <div class="hc-body">
        <div class="hc-top"><b>${esc(h.name)}</b><span class="pos-tag ${h.position}">${h.position}</span><span class="mute">${esc(h.numbers.join(" → "))}번</span></div>
        <div class="hc-end"><span class="gal-grade ${g.cls || ""}">${esc(g.label || h.grade)}</span>${esc(h.endingTitle)}</div>
        <div class="hc-stats num">${h.apps}경기 ${h.goals}골 ${h.assists}도움${h.rating ? ` · 평점 ${h.rating.toFixed(2)}` : ""} · 능력치 ${h.ovr}</div>
        <div class="hc-school mute">진학: ${esc(h.school)} · ${esc(h.at)}</div>
        ${tags.length ? `<div class="hc-tags">${tags.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
      </div></article>`;
  }).join("")}</div>` : `<p class="mute hall-empty">아직 졸업한 선수가 없습니다. 3년을 마치면 이곳에 선수 카드가 남습니다.</p>`;
  const achs = () => {
    const n = ACHIEVEMENTS.filter(a => have[a.id]).length;
    return `<p class="mute ach-count">달성 <b class="num">${n}</b> / ${ACHIEVEMENTS.length}</p>
      <div class="ach-grid">${ACHIEVEMENTS.map(a => `<div class="ach ${have[a.id] ? "on" : ""}">
        <span class="ach-ic" aria-hidden="true">${have[a.id] ? a.icon : "🔒"}</span>
        <span class="ach-tx"><b>${esc(a.label)}</b><small>${esc(a.desc)}</small></span></div>`).join("")}</div>`;
  };
  const body = () => `<button class="close" data-close aria-label="닫기">×</button>
    <span class="eyebrow">HALL OF FAME</span><h2>기록실</h2>
    <div class="tabs" role="tablist">
      <button role="tab" data-tab="hall" aria-selected="${tab === "hall"}">졸업생 ${hall.length}</button>
      <button role="tab" data-tab="ach" aria-selected="${tab === "ach"}">업적</button>
    </div>
    <div class="hall-pane">${tab === "hall" ? cards() : achs()}</div>
    <p class="mute" style="font-size:12px;margin:10px 0 0">기록과 업적은 이 기기의 이 브라우저에 남습니다.</p>`;
  openModal(body(), (el, close) => {
    const wire = () => {
      el.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
        tab = b.dataset.tab; el.querySelector(".sheet").innerHTML = body(); wire();
        el.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", close));
      }));
    };
    wire();
  }, { cls: "hall-modal" });
}
