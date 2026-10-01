// 시네마틱 도입부: 레터박스, 천천히 다가가는 배경, 한 줄씩 떠오르는 자막
import { INTRO } from "../../data/story.js";
import { esc } from "./util.js";

const AUTO_MS = 4300;

// 배경 그림: .webp → .png → 없으면 색 그라데이션만
window.__bgFallback = el => {
  if (!el.dataset.tried) { el.dataset.tried = "1"; el.src = `assets/img/${el.dataset.name}.png`; }
  else el.remove();
};
export const bgLayer = (name, tone, extra = "") =>
  `<div class="cine-bg tone-${tone} ${extra}">${name ? `<img src="assets/img/${name}.webp" data-name="${name}" alt="" onerror="__bgFallback(this)">` : ""}</div>`;

export function renderIntro(app, onDone) {
  let i = -1, timer = null, finished = false;
  app.root.innerHTML = `<div class="cine" id="cine">
      <div class="cine-stage" id="stage"></div>
      <div class="cine-bar top"></div><div class="cine-bar bot"></div>
      <div class="cine-text" id="ctext" aria-live="polite"></div>
      <button class="cine-skip" id="skip">건너뛰기</button>
    </div>`;
  const root = app.root.querySelector("#cine");
  const stage = root.querySelector("#stage");
  const text = root.querySelector("#ctext");

  const done = () => { if (finished) return; finished = true; clearTimeout(timer); onDone(); };

  function show(n) {
    clearTimeout(timer);
    i = n;
    if (i >= INTRO.length) return titleCard();
    const cut = INTRO[i];
    const layer = document.createElement("div");
    layer.innerHTML = bgLayer(cut.bg, cut.tone, "kb");
    const el = layer.firstElementChild;
    stage.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    [...stage.children].slice(0, -2).forEach(c => c.remove());
    text.innerHTML = `<h1 class="cine-big">${esc(cut.big).replace(/\n/g, "<br>")}</h1><p class="cine-small">${esc(cut.small)}</p>`;
    timer = setTimeout(() => show(i + 1), AUTO_MS);
  }

  function titleCard() {
    const layer = document.createElement("div");
    layer.innerHTML = bgLayer(null, "black");
    const el = layer.firstElementChild;
    stage.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    text.classList.add("center");
    text.innerHTML = `<img class="cine-logo" src="assets/img/logo.png" alt="고흥FC 엠블럼">
      <h1 class="cine-title">고흥FC</h1><p class="cine-title-sub">드림 프로젝트</p>
      <button class="btn btn-kit cine-go" id="go">축구부실로 가기</button>`;
    root.querySelector("#skip").remove();
    text.querySelector("#go").addEventListener("click", e => { e.stopPropagation(); done(); });
    text.querySelector("#go").focus({ preventScroll: true });
  }

  root.addEventListener("click", e => {
    if (e.target.closest("#skip")) { done(); return; }
    if (i < INTRO.length) show(i + 1);
  });
  show(0);
}
