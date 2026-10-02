// 팝업: 행동 고르기, 주간 결과, 메시지, 저장, 등번호, 학년 마무리, 졸업
import { ACTIONS, CATEGORIES } from "../../data/actions.js";
import { STAT_LABEL } from "../../data/player.js";
import { actionAllowed, numberChoices, chooseNumber, POPULAR, SLOTS } from "../engine/week.js";
import { STATUS_LABEL } from "../engine/match.js";
import { ovr } from "../engine/team.js";
import { readSlot, saveTo, deleteSlot, exportCode, importCode } from "../state.js";
import { esc, fl, signed, img, faceOf, fillText } from "./util.js";
import { eventView, eventVars, chooseEvent } from "../engine/events.js";
import { reduced, countUp } from "./fx.js";
import { sfx } from "./sfx.js";

const root = () => document.getElementById("modal-root");

export function openModal(html, mount, { dismissable = true, onClose, scene = null, cls = "" } = {}) {
  const el = document.createElement("div");
  el.className = `backdrop ${scene ? "scened" : ""} ${cls}`;
  el.innerHTML = (scene ? `<div class="ev-scene" aria-hidden="true"><img src="assets/img/${scene}.webp" data-name="${scene}" alt="" onerror="__bgFallback(this)"></div>` : "")
    + `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  root().appendChild(el);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", onKey);
    // 닫힐 때 살짝 가라앉으며 사라짐 (그동안 눌리지 않게 이름을 바꿔 둠)
    if (reduced()) el.remove();
    else {
      el.inert = true; el.setAttribute("aria-hidden", "true");
      el.className = el.className.replace(/\bbackdrop\b/, "backdrop-gone");
      el.querySelector(".sheet")?.classList.replace("sheet", "sheet-gone");
      setTimeout(() => el.remove(), 230);
    }
    onClose?.();
  };
  const onKey = e => { if (e.key === "Escape" && dismissable) close(); };
  document.addEventListener("keydown", onKey);
  if (dismissable) el.addEventListener("click", e => { if (e.target === el) close(); });
  el.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
  mount?.(el, close);
  el.querySelector("button, input, textarea")?.focus({ preventScroll: true });
  return close;
}

// 브라우저 confirm() 대신 쓰는 확인 창 (일부 환경에서 confirm이 막혀 있음)
export function ask(message, okLabel = "확인") {
  return new Promise(resolve => {
    let ok = false;
    openModal(`<p style="font-size:16px;margin:4px 0 18px;white-space:pre-line">${esc(message)}</p>
      <div style="display:flex;gap:10px"><button class="btn btn-ghost" style="flex:1" data-close>취소</button>
      <button class="btn btn-kit" style="flex:1" data-ok>${esc(okLabel)}</button></div>`,
      (el, close) => el.querySelector("[data-ok]").addEventListener("click", () => { ok = true; close(); }),
      { onClose: () => resolve(ok) });
  });
}

// ── 행동 고르기 ─────────────────────
function fxLine(a) {
  const parts = Object.entries(a.gains).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k]) =>
    `<span class="up">▲ ${k === "position" ? "포지션 능력치" : STAT_LABEL[k]}</span>`);
  if (a.fatigue) parts.push(`<span class="${a.fatigue > 0 ? "down" : "up"}">피로 ${a.fatigue > 0 ? "+" : ""}${a.fatigue}</span>`);
  if (a.morale) parts.push(`<span class="up">사기 +${a.morale}</span>`);
  if (a.coach) parts.push(`<span class="up">감독 신뢰 ▲</span>`);
  if (a.academicLoss) parts.push(`<span class="down">학업 ▼</span>`);
  if (a.heal) parts.push(`<span class="up">회복 빨라짐</span>`);
  if (a.rel) parts.push(...Object.keys(a.rel).map(k => `<span class="up">${{ friend: "친구", rival: "라이벌", mentor: "선배", junior: "후배" }[k]} 관계 ▲</span>`));
  if (a.minigame) parts.push(`<span class="mute">🎮</span>`);
  return parts.join("");
}

export function actionPicker(app, slotId) {
  const state = app.state;
  let cat = ACTIONS.find(a => a.id === state.plan[slotId])?.cat || (state.player.condition.injury ? "rest" : "personal");
  const slot = SLOTS.find(s => s.id === slotId);
  const html = () => `<button class="close" data-close aria-label="닫기">×</button>
    <h2>${slot.label}</h2><p class="sub">무엇을 할까요?</p>
    <div class="tabs" role="tablist">${CATEGORIES.map(c => `<button role="tab" data-cat="${c.id}" aria-selected="${c.id === cat}">${c.label}</button>`).join("")}</div>
    <div class="acts">${ACTIONS.filter(a => a.cat === cat).map(a => {
      const ok = actionAllowed(state, a);
      if (!ok.ok && a.injured === "only") return "";
      return `<button class="act ${state.plan[slotId] === a.id ? "sel" : ""}" data-act="${a.id}" ${ok.ok ? "" : "disabled"}>
        <span class="n">${a.icon} ${a.label}${ok.ok ? "" : ` <small class="mute">(${ok.reason})</small>`}</span>
        <span class="d">${esc(fillText(a.desc, eventVars(state)))}</span><span class="fx">${fxLine(a)}</span></button>`;
    }).join("")}</div>`;
  openModal(html(), function mount(el, close) {
    el.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
      cat = b.dataset.cat; el.querySelector(".sheet").innerHTML = html(); mount(el, close);
      el.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", close));
    }));
    el.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
      state.plan[slotId] = b.dataset.act; close(); app.render();
    }));
  });
}

// ── 주간 결과 ───────────────────────
export function weekReport(app, rep, done) {
  const m = rep.match;
  const resCls = m ? { 승: "W", 무: "D", 패: "L" }[m.result] : "";
  const ups = rep.deltas.filter(d => d.d > 0);
  const downs = rep.deltas.filter(d => d.d < 0);
  const crossed = d => fl(d.to) > fl(d.from);
  const html = `<h2>${rep.title}</h2>
    <p class="sub">${rep.actions.length ? rep.actions.join(", ") : "경기 주간"}</p>
    ${m ? `<div class="scoreline">
        <span class="tm">고흥FC</span><span class="sc num">${m.gf} : ${m.ga}</span><span class="tm">${esc(m.opponent)}</span>
        <span style="grid-column:1/-1;font-size:13px"><span class="badge-res ${resCls}">${m.result}</span>
        ${m.comp}${m.round ? ` ${m.round}` : ""}. ${m.minutes > 0
          ? `${STATUS_LABEL[m.status]} ${m.minutes}분, 평점 <b>${m.rating.toFixed(1)}</b>${m.goals ? `, ⚽ ${m.goals}골` : ""}${m.assists ? `, 🅰️ ${m.assists}도움` : ""}`
          : (m.reason || STATUS_LABEL[m.status])}</span></div>` : ""}
    ${rep.minigames ? `<div class="mg-sum">🎮 ${Object.entries(rep.minigames).map(([k, v]) => `${SLOTS.find(x => x.id === k).label} <b class="mg-grade g${{ 1.5: "S", 1.25: "A", 1: "B", 0.8: "C" }[v]}">${{ 1.5: "S", 1.25: "A", 1: "B", 0.8: "C" }[v]}</b>`).join(" ")}</div>` : ""}
    ${rep.exam ? `<div class="alert gold">📝 ${rep.exam.name}${rep.exam.tier ? `: ${rep.exam.tier}` : " 끝"}</div>` : ""}
    ${rep.injury ? `<div class="alert">🩹 ${rep.injury.label}. ${rep.injury.weeks}주 정도 쉬어야 합니다.</div>` : ""}
    ${rep.recovered ? `<div class="alert gold">💪 부상에서 회복했습니다.</div>` : ""}
    ${rep.camp ? `<div class="alert gold">⛺ 합숙 훈련 주간: 훈련 효과 1.2배</div>` : ""}
    ${(rep.traits || []).map(t => `<div class="alert gold trait-new">✨ 새 특성 <b>${esc(t.label)}</b>: ${esc(t.desc)}</div>`).join("")}
    ${rep.body ? `<div class="alert gold">📏 신체 측정: 키가 ${rep.body.cm}cm 자랐습니다.</div>` : ""}
    <div class="result-list">
      ${ups.slice(0, 8).map((d, i) => `<div class="r" style="--i:${i}"><span>${d.label}</span><span class="num mute">${fl(d.from)} → <b style="color:var(--chalk)" data-from="${fl(d.from)}" data-to="${fl(d.to)}">${fl(d.to)}</b></span>
        <span class="num up pop" style="min-width:44px;text-align:right">${crossed(d) ? "▲ " : ""}${signed(d.d)}</span></div>`).join("")}
      ${downs.slice(0, 3).map(d => `<div class="r"><span>${d.label}</span><span class="num mute">${fl(d.from)} → ${fl(d.to)}</span>
        <span class="num down" style="min-width:44px;text-align:right">${signed(d.d)}</span></div>`).join("")}
      ${Math.abs(rep.coachDelta) >= 0.5 ? `<div class="r"><span>감독 신뢰</span><span></span><span class="num ${rep.coachDelta > 0 ? "up" : "down"}">${signed(rep.coachDelta)}</span></div>` : ""}
    </div>
    ${rep.mails.length ? `<p class="mute" style="font-size:13px">💬 새 메시지 ${rep.mails.length}개</p>` : ""}
    <button class="btn btn-kit btn-wide" data-close>확인</button>`;
  openModal(html, el => {
    el.querySelectorAll("[data-to]").forEach((b, i) => countUp(b, +b.dataset.from, +b.dataset.to, { delay: 180 + i * 70 }));
    if (m) sfx.play(m.result === "승" ? "good" : m.result === "패" ? "bad" : "tap");
    if ((rep.traits || []).length) setTimeout(() => sfx.play("up"), 300);
  }, { onClose: done, cls: "report" });
}

export function mailModal(m) {
  openModal(`<button class="close" data-close aria-label="닫기">×</button>
    <p class="sub">${esc(m.from)}</p><h2>${esc(m.title)}</h2>
    <p class="mail-body">${esc(m.body)}</p>
    <button class="btn btn-wide" data-close>닫기</button>`);
}

// ── 저장 ────────────────────────────
export function saveModal(app, { loadOnly = false } = {}) {
  const fmt = t => new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const html = () => {
    const rows = ["auto", 1, 2, 3].map(w => {
      const d = readSlot(w);
      const name = w === "auto" ? "자동 저장" : `슬롯 ${w}`;
      return `<div class="saveslot"><div><div class="t">${name}</div>
        <div class="s">${d ? `${esc(d.summary)} (${fmt(d.savedAt)})` : "비어 있음"}</div></div>
        <div class="b">
          ${!loadOnly && w !== "auto" && app.state ? `<button class="btn btn-sm btn-kit" data-save="${w}">저장</button>` : ""}
          ${d ? `<button class="btn btn-sm" data-load="${w}">불러오기</button>` : ""}
          ${d && w !== "auto" && !loadOnly ? `<button class="btn btn-sm btn-ghost" data-del="${w}" aria-label="${name} 지우기">지우기</button>` : ""}
        </div></div>`;
    }).join("");
    return `<button class="close" data-close aria-label="닫기">×</button>
      <h2>${loadOnly ? "불러오기" : "저장과 불러오기"}</h2>
      <p class="sub">매주 자동 저장됩니다. 저장은 이 기기의 이 브라우저에만 남습니다.</p>
      <div class="slot-list">${rows}</div>
      <h2 style="font-size:17px;margin-top:20px">다른 기기로 옮기기</h2>
      <p class="sub">저장 코드를 복사해 다른 기기에서 붙여 넣으면 이어서 할 수 있습니다.</p>
      ${app.state && !loadOnly ? `<button class="btn btn-sm" data-export>저장 코드 만들기</button>` : ""}
      <textarea class="code" placeholder="저장 코드를 여기에 붙여 넣으세요" aria-label="저장 코드"></textarea>
      <button class="btn btn-sm" data-import style="margin-top:8px">코드로 불러오기</button>
      ${app.state && !loadOnly ? `<hr style="border:0;border-top:1px solid var(--line);margin:20px 0">
        <button class="btn btn-ghost btn-wide" data-title>타이틀 화면으로</button>` : ""}`;
  };
  openModal(html(), function mount(el, close) {
    const re = () => { el.querySelector(".sheet").innerHTML = html(); mount(el, close); el.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", close)); };
    el.querySelectorAll("[data-save]").forEach(b => b.addEventListener("click", async () => {
      const w = +b.dataset.save;
      if (readSlot(w) && !(await ask(`슬롯 ${w}에 덮어쓸까요?`, "덮어쓰기"))) return;
      app.saveTo(w); app.toast(`슬롯 ${w}에 저장했습니다`); re();
    }));
    el.querySelectorAll("[data-load]").forEach(b => b.addEventListener("click", async () => {
      const w = b.dataset.load === "auto" ? "auto" : +b.dataset.load;
      if (app.state && !(await ask("지금 진행 중인 게임은 마지막 자동 저장 이후 내용이 사라집니다. 불러올까요?", "불러오기"))) return;
      app.load(readSlot(w).state); close();
    }));
    el.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
      if (!(await ask("이 저장을 지울까요? 되돌릴 수 없습니다.", "지우기"))) return;
      deleteSlot(+b.dataset.del); re();
    }));
    el.querySelector("[data-export]")?.addEventListener("click", () => {
      const ta = el.querySelector("textarea");
      ta.value = exportCode(app.state, app.summary());
      ta.select();
      navigator.clipboard?.writeText(ta.value).then(() => app.toast("저장 코드를 복사했습니다"), () => {});
    });
    el.querySelector("[data-import]").addEventListener("click", () => {
      const d = importCode(el.querySelector("textarea").value);
      if (!d) { app.toast("코드를 읽지 못했습니다. 처음부터 끝까지 빠짐없이 붙여 넣었는지 확인해 주세요."); return; }
      app.load(d.state); close();
    });
    el.querySelector("[data-title]")?.addEventListener("click", async () => {
      if (!(await ask("타이틀로 나갑니다. 지난주까지는 자동 저장되어 있습니다.", "나가기"))) return;
      close(); app.toTitle();
    });
  });
}

// ── 3학년 등번호 ────────────────────
export function numberModal(app, done) {
  const state = app.state;
  const html = (msg = "") => {
    const free = new Set(numberChoices(state));
    const tried = state.pending?.tried || [];
    return `<h2>3학년 등번호</h2>
      <p class="sub">원하는 번호를 고르세요. 노란 번호(7, 9, 10)는 동기와 경쟁합니다.</p>
      ${msg ? `<div class="alert gold" style="margin-bottom:12px">${esc(msg)}</div>` : ""}
      <div class="numgrid">${Array.from({ length: 99 }, (_, i) => i + 1).map(n =>
        `<button class="num ${POPULAR.includes(n) ? "pop" : ""}" data-n="${n}" ${free.has(n) && !tried.includes(n) ? "" : "disabled"}>${n}</button>`).join("")}</div>`;
  };
  openModal(html(), function mount(el, close) {
    el.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => {
      const r = chooseNumber(state, +b.dataset.n);
      if (r.ok) { close(); app.toast(r.msg); done?.(); }
      else { el.querySelector(".sheet").innerHTML = html(r.msg); mount(el, close); }
    }));
  }, { dismissable: false });
}

// ── 학년 마무리 ─────────────────────
export function yearModal(app, y, done) {
  const p = app.state.player;
  openModal(`<h2>중${y.grade} 시즌이 끝났습니다</h2>
    <p class="sub">이제 중${y.grade + 1}입니다.</p>
    <div style="display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center;margin-bottom:14px">
      <div style="border-radius:10px;overflow:hidden">${img(faceOf(p, y.grade + 1), p.name)}</div>
      <dl class="kv">
        <dt>종합 능력치</dt><dd class="num">${y.ovrFrom} → ${y.ovrTo} <span class="up">▲${y.ovrTo - y.ovrFrom}</span></dd>
        <dt>키</dt><dd class="num">${y.heightFrom.toFixed(1)} → ${y.heightTo.toFixed(1)}cm</dd>
        <dt>출전</dt><dd class="num">${y.matches}경기, ${y.goals}골</dd>
      </dl></div>
    <p class="mute" style="font-size:14px">새 시즌 일정과 등번호, 팀 소식은 메시지함에서 확인하세요.</p>
    <button class="btn btn-kit btn-wide" data-close>새 학년 시작</button>`, null, { onClose: done });
}

export function graduationModal(app) {
  const s = app.state, p = s.player, r = s.record;
  const avg = r.ratings.length ? (r.ratings.reduce((a, b) => a + b, 0) / r.ratings.length).toFixed(2) : "–";
  openModal(`<h2>졸업</h2>
    <p class="sub">고흥대서중학교에서의 3년이 끝났습니다.</p>
    <dl class="kv" style="margin-bottom:14px">
      <dt>최종 능력치</dt><dd class="num">${fl(ovr(p))}</dd>
      <dt>키</dt><dd class="num">${p.body.height.toFixed(1)}cm</dd>
      <dt>통산 기록</dt><dd class="num">${r.apps}경기 ${r.goals}골 ${r.assists}도움</dd>
      <dt>평균 평점</dt><dd class="num">${avg}</dd>
      <dt>학업</dt><dd class="num">${fl(p.stats.student.academic)}</dd>
      <dt>등번호</dt><dd class="num">${p.numberHistory.map(h => `${h.number}번`).join(" → ")}</dd>
    </dl>
    <div class="alert gold">진학 결정과 엔딩은 다음 업데이트에서 추가됩니다.</div>
    <button class="btn btn-kit btn-wide" data-close style="margin-top:14px">타이틀로</button>`, null, { onClose: () => app.toTitle() });
}

// ── 이벤트 ──────────────────────────
export function eventModal(app, done) {
  const state = app.state;
  const v = eventView(state);
  if (!v) { done?.(); return; }
  const vars = eventVars(state);
  const html = `<div class="ev">
      ${v.portrait ? `<div class="ev-por">${img(v.portrait, v.speaker)}</div>` : ""}
      <div class="ev-body">
        ${v.speaker ? `<div class="ev-who">${esc(v.speaker)}</div>` : `<div class="ev-who mute">이번 주 이야기</div>`}
        <p class="ev-text">${esc(fillText(v.text, vars))}</p>
      </div>
    </div>
    <div class="vn-choices" id="evc">${v.ev.choices.map((c, i) => `<button class="vn-choice" style="--i:${i}" data-i="${i}">${esc(fillText(c.label, vars))}</button>`).join("")}</div>`;
  openModal(html, (el, close) => {
    el.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => {
      const r = chooseEvent(state, +b.dataset.i);
      app.saveTo("auto");
      let score = 0;
      const chips = r.changes.map((c, i) => {
        if (c.note) { score -= 2; return `<span class="evchip down" style="--i:${i}">${esc(c.label)} ${esc(c.note)}</span>`; }
        const good = c.invert ? c.d < 0 : c.d > 0;
        score += good ? 1 : -1;
        return `<span class="evchip ${good ? "up" : "down"}" style="--i:${i}">${esc(c.label)} ${c.d > 0 ? "+" : ""}${Math.abs(c.d) < 1 ? c.d.toFixed(1) : Math.round(c.d)}</span>`;
      }).join("");
      el.querySelector("#evc").outerHTML = `<p class="ev-result">${esc(fillText(r.result, eventVars(state)))}</p>
        ${chips ? `<div class="evchips">${chips}</div>` : ""}
        <button class="btn btn-kit btn-wide" data-close style="margin-top:14px">확인</button>`;
      el.querySelector("[data-close]").addEventListener("click", close);
      el.querySelector("[data-close]").focus({ preventScroll: true });
      sfx.play(score >= 0 ? "good" : "bad");
    }));
  }, { dismissable: false, onClose: done, scene: v.ev.bg || null, cls: "event" });
}
