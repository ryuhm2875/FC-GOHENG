// 진로 화면: 진학 상담, 국가대표 발표, 엔딩, 엔딩 도감
import { ENDINGS, GRADE_INFO } from "../../data/endings.js";
import { schoolOptions, chooseSchool, decideEnding, markEnding, seenEndings, teacherLetter } from "../engine/career.js";
import { openModal } from "./modals.js";
import { bgLayer } from "./intro.js";
import { setScene } from "./fx.js";
import { esc, img, faceOf } from "./util.js";

// 학교 엠블럼 (그림 없이 이름 첫 글자로)
export function crest(name, tier) {
  const ch = name.replace(/^(서울|경기|광주|순천|보성|남해안)\s?/, "").slice(0, 1);
  return `<span class="crest t-${tier}">${esc(ch)}</span>`;
}

// ── 진학 상담 ───────────────────────
export function admissionModal(app, done) {
  const state = app.state;
  const { ovr, recommend, list } = schoolOptions(state);
  const html = `<div class="adm">
    <div class="adm-head"><span class="eyebrow">CAREER</span><h2>진학 상담</h2>
      <p class="sub">갈 수 있는 학교 중 하나를 고르세요. 한 번 정하면 바꿀 수 없습니다.${recommend ? " 감독님 추천서가 붙었습니다." : ""}</p></div>
    <div class="adm-list">${list.map(s => {
      const pct = s.need ? Math.max(4, Math.min(100, (ovr / s.need) * 100)) : 100;
      return `<button class="adm-card ${s.ok ? "" : "locked"}" data-id="${s.id}" ${s.ok ? "" : "disabled"}>
        ${crest(s.name, s.tier)}
        <span class="adm-main"><b>${esc(s.name)}</b><span class="adm-tier">${esc(s.tierLabel)}${s.offered ? ` <span class="chip kit">입학 제안</span>` : ""}</span>
          ${s.need ? `<span class="adm-bar"><i style="width:${pct}%"></i></span><span class="adm-need">${s.ok ? "가능" : "조금 더 필요"}${s.notes.length ? `, ${esc(s.notes.join(", "))}` : ""}</span>`
            : `<span class="adm-need">${esc(s.notes[0])}</span>`}
        </span>
        <span class="adm-go">${s.ok ? "선택" : "🔒"}</span></button>`;
    }).join("")}</div></div>`;
  openModal(html, (el, close) => {
    el.querySelectorAll("[data-id]:not([disabled])").forEach(b => b.addEventListener("click", () => {
      const r = chooseSchool(state, b.dataset.id);
      if (!r.ok) return;
      app.saveTo("auto");
      el.querySelector(".adm").innerHTML = `<div class="adm-done">${crest(r.school.name, r.school.tier)}
        <span class="eyebrow">DECIDED</span><h2>${esc(r.school.name)}</h2><p class="sub">${esc(r.school.tierLabel)}. 남은 겨울도 고흥FC 선수로 끝까지 뜁니다.</p>
        <button class="btn btn-kit btn-wide" data-close>확인</button></div>`;
      el.querySelector("[data-close]").addEventListener("click", close);
    }));
  }, { dismissable: false, onClose: done });
}

// ── 국가대표 발표 ───────────────────
export function nationalModal(app, done) {
  const state = app.state;
  const r = state.career.national || { selected: false };
  const p = state.player;
  const html = `<div class="nat">
    <span class="eyebrow">U-15 NATIONAL TEAM</span>
    <h2>청소년 대표팀 소집 명단 발표</h2>
    <p class="sub">협회 홈페이지에 명단이 올라왔다. 손가락이 떨린다.</p>
    <ol class="nat-list" id="natl"></ol>
    <div id="natr"></div>
  </div>`;
  openModal(html, (el, close) => {
    const names = ["김도현 (서울 한강중)", "박지후 (울산 고래중)", "이서진 (경기 은하중)", "최하준 (인천 갯벌FC U-15)", "정우진 (부산 파도중)"];
    if (r.selected) names.push(`${p.name} (고흥대서중)`);
    const ol = el.querySelector("#natl");
    let i = 0;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      if (i < names.length) {
        const li = document.createElement("li");
        li.textContent = names[i];
        if (names[i].startsWith(p.name)) li.className = "me";
        ol.appendChild(li); i++;
        setTimeout(step, reduce ? 0 : 520);
      } else {
        el.querySelector("#natr").innerHTML = `<p class="nat-res ${r.selected ? "yes" : "no"}">${r.selected
          ? "있다. 내 이름이 있다. 엄마한테 전화를 걸었는데 목소리가 안 나왔다."
          : "끝까지 내렸지만 이름은 없었다. 그래도 고흥에서 여기까지 온 것만으로도 먼 길이었다."}</p>
          <button class="btn btn-kit btn-wide" data-close>확인</button>`;
        el.querySelector("[data-close]").addEventListener("click", () => { state.pending = null; app.saveTo("auto"); close(); });
      }
    };
    setTimeout(step, 600);
  }, { dismissable: false, onClose: done });
}

// ── 엔딩 ────────────────────────────
export function showEnding(app) {
  const state = app.state;
  setScene(null);
  const { ending, c } = decideEnding(state);
  markEnding(ending.id);
  app.saveTo("auto");
  const g = GRADE_INFO[ending.grade];
  const p = state.player;
  const recap = [
    ["진학", c.schoolName], ["최종 능력치", c.ovr], ["키", `${c.height.toFixed(1)}cm`],
    ["통산", `${c.apps}경기 ${c.goals}골 ${c.assists}도움`], ["등번호", p.numberHistory.map(h => h.number).join(" → ")],
    ["우승", c.titles.length ? c.titles.map(t => t.name).join(", ") : "없음"],
  ];
  app.view = "ending";
  app.root.innerHTML = `<div class="ending">
    <div class="ending-stage">${bgLayer(ending.img, "night", "kb on")}</div>
    <div class="cine-bar top"></div><div class="cine-bar bot"></div>
    <div class="ending-body">
      <div class="end-grade ${g.cls}">${g.label}</div>
      <span class="eyebrow">ENDING</span>
      <h1 class="end-title">${esc(ending.title)}</h1>
      <div class="end-face">${img(faceOf(p, 3), p.name)}</div>
      <p class="end-story" id="story"></p>
      <div class="end-letter" id="letter" hidden><span class="eyebrow">LETTER</span><p>${esc(teacherLetter(state))}</p></div>
      <dl class="end-recap" id="recap" hidden>${recap.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <div class="end-btns" id="eb" hidden>
        <button class="btn btn-ghost" data-gallery>엔딩 도감</button>
        <button class="btn btn-kit" data-title>타이틀로</button>
      </div>
    </div>
  </div>`;
  const story = app.root.querySelector("#story");
  const text = ending.story(c);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let n = 0;
  const finish = () => { story.textContent = text; app.root.querySelector("#letter").hidden = false; app.root.querySelector("#recap").hidden = false; app.root.querySelector("#eb").hidden = false; };
  const t = setInterval(() => { n += 2; story.textContent = text.slice(0, n); if (n >= text.length) { clearInterval(t); finish(); } }, reduce ? 1 : 32);
  app.root.querySelector(".ending").addEventListener("click", e => { if (!e.target.closest("button")) { clearInterval(t); finish(); } });
  app.root.querySelector("[data-gallery]").addEventListener("click", () => galleryModal());
  app.root.querySelector("[data-title]").addEventListener("click", () => app.toTitle());
}

export function galleryModal() {
  const seen = new Set(seenEndings());
  const order = ["L", "S", "H", "A", "B", "C", "D"];
  const list = ENDINGS.slice().sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade));
  openModal(`<button class="close" data-close aria-label="닫기">×</button>
    <span class="eyebrow">COLLECTION</span><h2>엔딩 도감 <small class="mute">${seen.size}/${ENDINGS.length}</small></h2>
    <div class="gal">${list.map(e => {
      const on = seen.has(e.id), g = GRADE_INFO[e.grade];
      return `<div class="gal-item ${on ? "on" : ""}"><span class="gal-grade ${g.cls}">${g.label}</span><b>${on ? esc(e.title) : "???"}</b></div>`;
    }).join("")}</div>
    <p class="mute" style="font-size:13px">엔딩 기록은 이 기기의 이 브라우저에 남습니다.</p>`);
}
