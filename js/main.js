// 진입점: 화면 전환, 저장, 한 주 진행
import { newGame, saveTo, readSlot, summaryOf, loadSettings, saveSettings } from "./state.js";
import { playMinigame, statFor } from "./ui/minigames.js";
import { getPath } from "./rng.js";
import { turnInfo, label } from "./engine/calendar.js";
import { beginWeek, endWeek, planReady, SLOTS, slotLocked, actionAllowed, currentFixture } from "./engine/week.js";
import { prepareMatch } from "./engine/match.js";
import { welcomeMails } from "./engine/advice.js";
import { birthdayWeek } from "./engine/birthday.js";
import { initRelations } from "./engine/relations.js";
import { showMatch } from "./ui/match.js";
import { ACTION_MAP } from "../data/actions.js";
import { renderCreate } from "./ui/create.js";
import { renderIntro } from "./ui/intro.js";
import { homeView, playerView, teamView, scheduleView, inboxView } from "./ui/views.js";
import { ask, eventModal, actionPicker, weekReport, mailModal, saveModal, numberModal, yearModal, meetingModal } from "./ui/modals.js";
import { esc } from "./ui/util.js";
import { admissionModal, nationalModal, showEnding, galleryModal } from "./ui/career.js";
import { hallModal, checkAchievements } from "./ui/hall.js";
import { setScene, enter, preload, SCENES } from "./ui/fx.js";
import { sfx } from "./ui/sfx.js";
import { bgm } from "./ui/bgm.js";

// 메뉴 아이콘 (선으로 그린 SVG)
const ICONS = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  player: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/>',
  team: '<circle cx="8.5" cy="8.5" r="3.2"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M2.5 20c.8-3.8 3.4-6 6-6s5.2 2.2 6 6M14.5 14.3c3 0 5.6 1.9 6.5 5.7"/>',
  schedule: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  inbox: '<path d="M4 5h16v11H9l-5 4z"/>',
};
const soundIcon = on => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${on ? '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5"/>'}</svg>`;
const musicIcon = on => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>${on ? "" : '<path d="M3 3l18 18"/>'}</svg>`;
const icon = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const NAV = [["home", "홈"], ["player", "선수"], ["team", "팀"], ["schedule", "일정"], ["inbox", "메시지"]];

const app = {
  root: document.getElementById("app"),
  state: null,
  view: "title",
  sub: { ptab: "stats", sgrade: null, ttab: "rel" },
  draft: null,
  settings: loadSettings(),

  go(view) { this.view = view; this._enter = true; this.render(); this._enter = false; window.scrollTo(0, 0); },
  toTitle() { this.state = null; this.go("title"); },

  startGame(player) {
    this.state = newGame(player);
    welcomeMails(this.state);
    birthdayWeek(this.state, turnInfo(this.state));      // 입단 첫 주가 생일 주간인 경우
    this.saveTo("auto");
    this.go("home");
    this.toast(`${player.name}, 등번호 ${this.state.player.number}번으로 입단했습니다`);
  },
  load(state) {
    if (!state.relations.people) initRelations(state);     // 이전 저장 파일 보정
    this.state = state;
    this.sub = { ptab: "stats", sgrade: null, ttab: "rel" };
    this.go("home");
    this.toast("불러왔습니다");
    if (state.finished) { showEnding(this); return; }
    if (state.pending) this.pendingFlow(() => this.render());
    else if (state.pendingEvent) this.eventChain(() => this.render());
  },
  // 남은 이벤트를 차례로 보여 줌 (같은 주 두 번째 이야기까지)
  eventChain(done) {
    const s = this.state;
    if (!s?.pendingEvent) { done(); return; }
    eventModal(this, () => { this.saveTo("auto"); this.render(); this.eventChain(done); });
  },
  summary() { return summaryOf(this.state, turnInfo(this.state)); },
  saveTo(where) { return saveTo(where, this.state, this.summary()); },

  toggleMusic() {
    this.settings.music = !this.settings.music; saveSettings(this.settings);
    bgm.set(this.settings.music);
    this.toast(this.settings.music ? "배경음악을 켰습니다" : "배경음악을 껐습니다");
    document.querySelectorAll("[data-music]").forEach(b => { b.innerHTML = musicIcon(this.settings.music); b.setAttribute("aria-pressed", this.settings.music); });
  },

  toggleSound() {
    this.settings.sound = !this.settings.sound; saveSettings(this.settings);
    sfx.set(this.settings.sound);
    if (this.settings.sound) sfx.play("good");
    this.toast(this.settings.sound ? "효과음을 켰습니다" : "효과음을 껐습니다");
    document.querySelectorAll("[data-sound]").forEach(b => { b.innerHTML = soundIcon(this.settings.sound); b.setAttribute("aria-pressed", this.settings.sound); });
  },

  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(this._t); this._t = setTimeout(() => t.classList.remove("show"), 2600);
  },

  render() {
    if (["title", "intro", "create"].includes(this.view)) setScene(null);
    if (this.view !== "match" && this.view !== "ending") bgm.play("home");
    if (this.view === "title") return renderTitle(this);
    if (this.view === "intro") return renderIntro(this, () => this.go("create"));
    if (this.view === "create") return renderCreate(this);
    if (this.view === "match" || this.view === "ending") return;   // 경기·엔딩 화면이 직접 그립니다
    renderShell(this);
  },

  advance() {
    const s = this.state;
    if (s.pending) { this.pendingFlow(() => this.render()); return; }
    if (!planReady(s)) { this.toast("이번 주 빈 칸을 먼저 채워 주세요"); return; }
    s.lastPlan = { ...s.plan };
    this.runMinigames().then(() => this.startWeek());
  },

  // 등번호 선택, 진학 상담, 대표 발표처럼 꼭 거쳐야 하는 창
  pendingFlow(done) {
    const t = this.state.pending?.type;
    if (t === "number") numberModal(this, done);
    else if (t === "admission") admissionModal(this, done);
    else if (t === "national") nationalModal(this, done);
    else done();
  },

  // 미니게임이 있는 훈련을 차례로 진행하고 칸별 배율을 남김
  async runMinigames() {
    const s = this.state;
    s.planMult = null;
    if (!this.settings.minigame) return;
    const mult = {};
    for (const slot of SLOTS) {
      if (slotLocked(s, slot.id)) continue;
      const a = ACTION_MAP[s.plan[slot.id]];
      if (!a?.minigame || !actionAllowed(s, a).ok) continue;
      const r = await playMinigame(a.minigame, getPath(s.player.stats, statFor(a.minigame)), `${slot.label}, ${a.label}`);
      mult[slot.id] = r.mult;
    }
    s.planMult = Object.keys(mult).length ? mult : null;
  },

  startWeek() {
    const s = this.state;
    const ctx = beginWeek(s);
    // 전남 대표 소년체전은 이기면 같은 주에 다음 경기로 바로 이어짐
    const play = fx => {
      const m = prepareMatch(s, ctx.info, fx);
      this.view = "match";
      window.scrollTo(0, 0);
      showMatch(this, m, result => {
        const nx = fx.jn && result?.result === "승" ? currentFixture(s) : null;
        if (nx?.jn) return play(nx);
        this.view = "home"; this.finishWeek(ctx, result);
      });
    };
    if (ctx.fx) meetingModal(this, ctx.fx, () => play(ctx.fx));   // 경기 전 미팅 장면 → 경기
    else this.finishWeek(ctx, null);
  },

  finishWeek(ctx, result) {
    const s = this.state;
    const rep = endWeek(s, ctx, result);
    this.saveTo("auto");
    try { checkAchievements(this); } catch (e) { console.warn(e); }   // 업적 (이 기기에 남음)
    this.render();
    window.scrollTo(0, 0);
    weekReport(this, rep, () => {
      const chain = [];
      if (rep.yearEnd) chain.push(next => yearModal(this, rep.yearEnd, next));
      if (s.pending) chain.push(next => this.pendingFlow(next));
      if (s.pendingEvent) chain.push(next => this.eventChain(next));   // 한 주에 이야기가 두 개일 수도 있음
      if (rep.graduation) chain.push(() => showEnding(this));
      const run = () => { const f = chain.shift(); if (f) f(() => { this.saveTo("auto"); this.render(); run(); }); };
      this.render();
      run();
    });
  },

  repeatPlan() {
    const s = this.state;
    for (const slot of SLOTS) {
      if (slotLocked(s, slot.id)) continue;
      const id = s.lastPlan?.[slot.id];
      if (id && actionAllowed(s, ACTION_MAP[id]).ok) s.plan[slot.id] = id;
    }
    this.render();
  },
};

function renderTitle(app) {
  const auto = readSlot("auto");
  const cont = auto && !auto.state.finished;
  app.root.innerHTML = `<main class="fc-title" id="ft">
    <div class="ft-bg"><img src="assets/img/title.webp" data-name="title" alt="" onerror="__bgFallback(this)"><span class="ft-streak s1"></span><span class="ft-streak s2"></span><span class="ft-streak s3"></span></div>
    <div class="ft-brand">
      <img class="ft-logo" src="assets/img/logo.png" alt="고흥FC 엠블럼">
      <div class="ft-words"><span class="ft-kicker">GOHEUNG FC U-15</span><h1 class="ft-name">DREAM<br>PROJECT</h1><p class="ft-ko">고흥FC 드림 프로젝트</p></div>
    </div>
    <button class="ft-press" id="press">화면을 눌러 시작</button>
    <nav class="ft-menu" id="menu" hidden>
      ${cont ? `<button class="ft-tile main" data-continue><span class="ft-t">이어하기</span><span class="ft-s">${esc(auto.summary)}</span></button>` : ""}
      <button class="ft-tile ${cont ? "" : "main"}" data-new><span class="ft-t">새 커리어</span><span class="ft-s">중학교 1학년, 입단 첫날부터</span></button>
      <button class="ft-tile" data-loadmenu><span class="ft-t">불러오기</span><span class="ft-s">저장 슬롯, 저장 코드</span></button>
      <button class="ft-tile" data-gallery><span class="ft-t">엔딩 도감</span><span class="ft-s">지금까지 본 엔딩</span></button>
      <button class="ft-tile" data-hall><span class="ft-t">기록실</span><span class="ft-s">졸업생 카드와 업적</span></button>
    </nav>
    <p class="ft-foot">made by 류봉두</p>
    <button class="snd-btn ft-snd" data-sound aria-label="효과음" aria-pressed="${app.settings.sound}">${soundIcon(app.settings.sound)}</button>
    <button class="snd-btn ft-mus" data-music aria-label="배경음악" aria-pressed="${!!app.settings.music}">${musicIcon(app.settings.music)}</button>
  </main>`;
  const r = app.root;
  const open = () => { r.querySelector("#press").hidden = true; const m = r.querySelector("#menu"); m.hidden = false; m.querySelector("button").focus({ preventScroll: true }); document.removeEventListener("keydown", key); };
  const key = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  document.addEventListener("keydown", key);
  r.querySelector("#press").addEventListener("click", open);
  r.querySelector("#ft").addEventListener("click", e => { if (!e.target.closest("button")) open(); });
  r.querySelector("[data-continue]")?.addEventListener("click", () => app.load(auto.state));
  r.querySelector("[data-new]").addEventListener("click", async () => {
    if (cont && !(await ask("새로 시작하면 자동 저장이 덮어씌워집니다.\n슬롯에 저장해 둔 게임은 그대로 남습니다.", "새로 시작"))) return;
    app.draft = null; app.go("intro");
  });
  r.querySelector("[data-loadmenu]").addEventListener("click", () => saveModal(app, { loadOnly: true }));
  r.querySelector("[data-gallery]").addEventListener("click", () => galleryModal());
  r.querySelector("[data-hall]").addEventListener("click", () => hallModal());
  r.querySelector("[data-sound]").addEventListener("click", e => { e.stopPropagation(); app.toggleSound(); });
  r.querySelector("[data-music]").addEventListener("click", e => { e.stopPropagation(); app.toggleMusic(); });
}

function renderShell(app) {
  const s = app.state;
  const info = turnInfo(s);
  const unread = s.inbox.filter(m => !m.read).length;
  let main = "";
  if (app.view === "home") main = homeView(s, { minigame: app.settings.minigame });
  if (app.view === "player") main = playerView(s, app.sub.ptab);
  if (app.view === "team") main = teamView(s, app.sub.ttab);
  if (app.view === "schedule") main = scheduleView(s, app.sub.sgrade || s.calendar.grade);
  if (app.view === "inbox") main = inboxView(s);

  setScene("bg_home", app.view === "home" ? "home" : "dim");
  const when = info ? label(info) : "졸업";
  const flip = app._when && app._when !== when;
  app._when = when;
  app.root.innerHTML = `<div class="shell">
    <header class="topbar">
      <img class="tb-logo" src="assets/img/logo.png" alt="">
      <div class="tb-when ${flip ? "flip" : ""}"><div class="when">${when}</div><div class="phase">${info ? info.phaseLabel : ""}</div></div>
      <nav class="tabs-top" aria-label="메뉴">${NAV.map(([k, l]) => `<button data-nav="${k}" ${app.view === k ? `aria-current="page"` : ""}>${l}${k === "inbox" && unread ? `<span class="badge num">${unread}</span>` : ""}</button>`).join("")}</nav>
      <span class="spacer"></span>
      <button class="snd-btn" data-music aria-label="배경음악" aria-pressed="${!!app.settings.music}">${musicIcon(app.settings.music)}</button>
      <button class="snd-btn" data-sound aria-label="효과음" aria-pressed="${app.settings.sound}">${soundIcon(app.settings.sound)}</button>
      <button class="btn btn-sm btn-ghost" data-savemenu>저장</button>
    </header>
    <nav class="nav" aria-label="메뉴">${NAV.map(([k, l]) =>
      `<button data-nav="${k}" ${app.view === k ? `aria-current="page"` : ""}>${icon(k)}<span>${l}</span>${k === "inbox" && unread ? `<span class="dot" aria-label="안 읽은 메시지 ${unread}개"></span>` : ""}</button>`).join("")}</nav>
    <main class="main">${main}</main>
  </div>`;

  const r = app.root;
  if (app._enter) enter(r.querySelector(".main"));
  if (!app._pre) { app._pre = true; preload(SCENES); }
  r.querySelector("[data-sound]").addEventListener("click", () => app.toggleSound());
  r.querySelector("[data-music]").addEventListener("click", () => app.toggleMusic());
  r.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => app.go(b.dataset.nav)));
  r.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => app.go(b.dataset.go)));
  r.querySelector("[data-savemenu]").addEventListener("click", () => saveModal(app));
  r.querySelectorAll("[data-slot]").forEach(b => b.addEventListener("click", () => actionPicker(app, b.dataset.slot)));
  r.querySelector("[data-advance]")?.addEventListener("click", () => app.advance());
  r.querySelector("[data-repeat]")?.addEventListener("click", () => app.repeatPlan());
  r.querySelector("[data-mgtoggle]")?.addEventListener("click", () => {
    app.settings.minigame = !app.settings.minigame; saveSettings(app.settings);
    app.toast(app.settings.minigame ? "훈련할 때 미니게임을 합니다" : "미니게임 없이 B등급으로 진행합니다"); app.render();
  });
  r.querySelectorAll("[data-ptab]").forEach(b => b.addEventListener("click", () => { app.sub.ptab = b.dataset.ptab; app.render(); }));
  r.querySelectorAll("[data-ttab]").forEach(b => b.addEventListener("click", () => { app.sub.ttab = b.dataset.ttab; app.render(); }));
  r.querySelectorAll("[data-sgrade]").forEach(b => b.addEventListener("click", () => { app.sub.sgrade = +b.dataset.sgrade; app.render(); }));
  r.querySelector("[data-readall]")?.addEventListener("click", () => { s.inbox.forEach(m => m.read = true); app.render(); });
  r.querySelectorAll("[data-mail]").forEach(b => b.addEventListener("click", () => {
    const m = s.inbox.find(x => x.id === b.dataset.mail);
    if (!m) return;
    m.read = true; mailModal(m, { list: s.inbox, onRead: () => app.render() }); app.render();
  }));
  if (app.view === "schedule") r.querySelector(".week.now")?.scrollIntoView({ block: "center" });
}

// ── 전체 화면 버튼 (모든 화면 오른쪽 위) ──
(function fullscreenButton() {
  const d = document, el = d.documentElement;
  const can = !!(el.requestFullscreen || el.webkitRequestFullscreen);
  const isFs = () => !!(d.fullscreenElement || d.webkitFullscreenElement);
  const standalone = matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches || navigator.standalone;
  if (standalone) return;                                       // 홈 화면 앱으로 열었으면 이미 전체 화면
  const b = d.createElement("button");
  b.className = "fs-btn"; b.type = "button"; b.setAttribute("aria-label", "전체 화면");
  const ICON_ON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`;
  const ICON_OFF = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>`;
  const paint = () => { b.innerHTML = isFs() ? ICON_OFF : ICON_ON; b.title = isFs() ? "전체 화면 끄기" : "전체 화면"; };
  paint();
  b.addEventListener("click", async () => {
    try {
      if (isFs()) await (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else if (can) await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: "hide" });
      else app.toast("아이폰은 사파리 공유 버튼 → '홈 화면에 추가'로 열면 전체 화면이 됩니다");
    } catch { app.toast("이 브라우저에서는 전체 화면을 쓸 수 없습니다"); }
  });
  d.addEventListener("fullscreenchange", paint); d.addEventListener("webkitfullscreenchange", paint);
  d.body.appendChild(b);
})();

sfx.set(app.settings.sound);
bgm.set(app.settings.music);

// ── 개발 단계 입장 코드 ──
// 코드 원문 대신 계산값만 적어 둠. 한 번 맞히면 이 기기·브라우저에서는 다시 묻지 않음.
// 정식 공개 때는 GATE를 null로 바꾸면 바로 열림.
const GATE = "2edu84", GATE_KEY = "gfc_gate";
const gateHash = s => { let x = 5381; for (const c of s.trim().normalize("NFC")) x = ((x * 33) ^ c.codePointAt(0)) >>> 0; return x.toString(36); };
const gateOpen = () => { try { return !GATE || localStorage.getItem(GATE_KEY) === GATE; } catch { return false; } };
function showGate() {
  const root = document.getElementById("app");
  root.innerHTML = `<div class="gate">
    <img class="gate-logo" src="assets/img/logo.png" alt="">
    <span class="eyebrow">GOHEUNG FC · DREAM PROJECT</span>
    <h1>개발 중인 게임입니다</h1>
    <p class="mute">입장 코드를 입력해 주세요.</p>
    <form class="gate-form" autocomplete="off">
      <input class="gate-input" type="text" autocapitalize="off" spellcheck="false" aria-label="입장 코드" placeholder="입장 코드">
      <button class="btn btn-kit btn-wide" type="submit">들어가기</button>
    </form>
    <p class="gate-msg" role="status" aria-live="polite"></p>
  </div>`;
  const form = root.querySelector(".gate-form"), input = root.querySelector(".gate-input"), msg = root.querySelector(".gate-msg");
  input.focus();
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (gateHash(input.value) === GATE) {
      try { localStorage.setItem(GATE_KEY, GATE); } catch { /* 저장이 안 되면 이번만 통과 */ }
      app.render();
    } else {
      msg.textContent = "코드가 맞지 않습니다.";
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      input.select();
    }
  });
}
if (gateOpen()) app.render(); else showGate();
window.gfc = app; // 개발 확인용
