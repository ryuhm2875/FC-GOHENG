// 진로 화면: 진학 상담, 국가대표 발표, 엔딩, 엔딩 도감
import { ENDINGS, GRADE_INFO } from "../../data/endings.js";
import { track, flush, pushSave } from "../net/online.js";
import { schoolOptions, chooseSchool, decideEnding, markEnding, seenEndings, teacherLetter, detailOptions, chooseDetail } from "../engine/career.js";
import { DETAIL_POS } from "../../data/player.js";
import { turnInfo } from "../engine/calendar.js";
const turnMonth = state => turnInfo(state)?.month;
import { STAFF } from "../../data/roster.js";
import { ovr } from "../engine/team.js";
import { sfx } from "./sfx.js";
import { openModal } from "./modals.js";
import { bgLayer } from "./intro.js";
import { setScene } from "./fx.js";
import { bgm } from "./bgm.js";
import { esc, img, faceOf, fillText } from "./util.js";
import { crest as teamCrest } from "./crest.js";
import { nemesisSummary } from "../engine/nemesis.js";
import { addHallCard, checkAchievements } from "./hall.js";

// 학교 엠블럼 (그림 없이 이름 첫 글자로)
export function crest(name, tier) {
  if (tier === "general") return `<span class="crest t-general">${esc(name.replace(/^(순천)\s?/, "").slice(0, 1))}</span>`;   // 일반고는 축구부 엠블럼 대신 글자
  return `<span class="crest crest-team">${teamCrest(name, { size: 46 })}</span>`;
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
        <span class="eyebrow">DECIDED</span><h2>${esc(r.school.name)}</h2><p class="sub">${esc(r.school.tierLabel)}. 졸업할 때까지 고흥FC 선수로 끝까지 뜁니다.</p>
        <button class="btn btn-kit btn-wide" data-close>확인</button></div>`;
      el.querySelector("[data-close]").addEventListener("click", close);
    }));
  }, { dismissable: false, onClose: done });
}

// ── 세부 포지션 면담 (2학년 하계대회 뒤): 정 코치 기록 → 감독님 추천 → 내가 고름 (윙어·풀백은 왼쪽·오른쪽까지) ──
export function detailModal(app, done) {
  const state = app.state, p = state.player;
  const { list, rec, sideRec, others, suggest } = detailOptions(state);
  if (!list.length) { state.pending = null; done(); return; }
  const top = list[0], second = list[1], nowOvr = ovr(p);
  const WHO = { assist: { name: STAFF.assistant, face: "npc_assistant" }, coach: { name: STAFF.coach, face: "npc_coach" } };
  const tj = (w, a, b) => fillText(`{w|${a}/${b}}`, { w });
  const recLine = !rec.games ? "아직 경기 기록이 많지 않습니다. 훈련 때 본 것으로 말씀드리겠습니다."
    : `최근 ${rec.games}경기 기록입니다. 평점 평균 ${rec.rating.toFixed(2)}, ${rec.goals}골 ${rec.assists}도움${p.position !== "FW" ? `, 상대 공격을 끊어 낸 장면이 ${rec.stops}번` : ""}입니다.`;
  const lines = [
    { t: `${state.calendar.grade === 2 && turnMonth(state) === 9 ? "하계대회가 끝나고 얼마 안 된 날." : "훈련이 끝난 저녁."} 감독실 문을 두드렸다. 감독님과 정 코치님이 나란히 앉아 계신다.` },
    { who: "assist", t: recLine },
    { who: "coach", t: `${state.calendar.grade === 2 ? "하계대회 보면서" : "요즘 경기 보면서"} 계속 생각했다. 이제 너도 네 자리를 정할 때가 됐다.` },
    { who: "coach", t: `${top.why} 그래서 나는 너를 ${tj(top.label, "으로", "로")} 쓰고 싶다.` },
    ...(second ? [{ who: "assist", t: `감독님 말씀도 맞는데, 나는 ${second.label}도 잘 어울린다고 본다. ${second.why}` }] : []),
    ...(suggest ? [{ who: "coach", t: `하나 더 있다. 능력치만 놓고 보면 너는 ${tj(suggest.label, "으로", "로")} 뛰어도 잘 맞는다. 원하면 포지션을 바꿔도 된다.` }] : []),
    { who: "coach", t: "마지막엔 네가 정해라. 정하면 그 자리에 맞게 키운다." },
  ];
  const lineHtml = l => { const w = WHO[l.who];
    return w ? `<div class="ev mt-line"><div class="ev-por">${img(w.face, w.name)}</div>
        <div class="ev-body"><div class="ev-who">${esc(w.name)}</div><p class="ev-text">"${esc(l.t)}"</p></div></div>`
      : `<p class="mt-nar">${esc(l.t)}</p>`; };
  openModal(`<div class="mt-head"><span class="chip kit">감독실 면담</span> <span class="mute">세부 포지션</span></div>
    <div id="mtl" aria-live="polite"></div><div class="mt-ctl" id="mtc"></div>`, (el, close) => {
    const box = el.querySelector("#mtl"), ctl = el.querySelector("#mtc");
    let i = 0;
    const show = () => {
      box.innerHTML = lineHtml(lines[i]); box.firstElementChild.classList.add("mt-in");
      ctl.innerHTML = `<div class="mt-row"><button class="linkbtn" data-skip>건너뛰기</button><span class="mute num">${i + 1} / ${lines.length}</span>
        <button class="btn btn-kit" data-next>${i < lines.length - 1 ? "다음 ▶" : "고르기"}</button></div>`;
      ctl.querySelector("[data-next]").addEventListener("click", () => { if (i < lines.length - 1) { i++; show(); } else pickRole(); });
      ctl.querySelector("[data-skip]").addEventListener("click", pickRole);
      ctl.querySelector("[data-next]").focus({ preventScroll: true });
    };
    const choices = (q, opts, onPick) => {
      ctl.innerHTML = `<p class="mt-q mute">${esc(q)}</p><div class="vn-choices">${opts.map((o, k) => `<button class="vn-choice dp-choice" style="--i:${k}" data-k="${k}">
        <b>${esc(o.label)}</b>${o.tag ? ` <span class="chip kit">${esc(o.tag)}</span>` : ""}${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</button>`).join("")}</div>`;
      ctl.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => onPick(opts[+b.dataset.k])));
      ctl.querySelector("[data-k]")?.focus({ preventScroll: true });
    };
    const pickRole = () => {
      box.innerHTML = lineHtml(lines.at(-1));
      const move = { label: "다른 포지션도 해 보고 싶다", tag: suggest ? "감독님 제안" : "", sub: `${others.map(o => `${o.label} 기준 종합 ${o.ovr}`).join(", ")} (지금 ${Math.round(nowOvr)})`, move: true };
      choices("어느 자리에서 뛸까?", [...list.map(o => ({ ...o, tag: o === top ? "감독님 추천" : o === second ? "코치님 추천" : "", sub: o.desc })), move],
        o => o.move ? pickPos() : o.side ? pickSide(o) : finish(o.keys[0]));
    };
    // 포지션 변경: 공격수 ↔ 미드필더 ↔ 수비수
    const pickPos = () => {
      box.innerHTML = lineHtml({ who: "assist", t: "포지션을 바꾸면 처음엔 주전 경쟁부터 다시 해야 한다. 종합 능력치도 새 포지션 기준으로 다시 계산된다. 그래도 해 보겠냐?" });
      choices("어느 포지션으로 바꿀까?", [...others.map(o => ({ label: o.label, pos: o.pos, tag: o === suggest ? "감독님 제안" : "", sub: `새 포지션 기준 종합 ${o.ovr} (지금 ${Math.round(nowOvr)}, ${o.diff >= 0 ? "+" : ""}${o.diff})` })),
        { label: "아니다, 지금 포지션에서 고르겠다", back: true }], o => o.back ? pickRole() : pickRoleIn(o.pos));
    };
    const pickRoleIn = pos => {
      const L = detailOptions(state, pos).list;
      box.innerHTML = lineHtml({ who: "coach", t: `좋다. ${L[0].label}부터 생각해 봤다. ${L[0].why}` });
      choices("새 포지션에서 어느 자리에 설까?", [...L.map((o, i) => ({ ...o, tag: i === 0 ? "감독님 추천" : "", sub: o.desc })), { label: "다시 생각해 보겠다", back: true }],
        o => o.back ? pickPos() : o.side ? pickSide(o) : finish(o.keys[0]));
    };
    const pickSide = o => {
      const footW = p.foot === "L" ? "왼발잡이" : "오른발잡이", sideW = sideRec === "L" ? "왼쪽" : "오른쪽", other = sideRec === "L" ? "오른쪽" : "왼쪽";
      box.innerHTML = lineHtml({ who: "assist", t: o.group === "winger"
        ? `${footW}니까 ${sideW}에 서면 크로스가 편하다. 반대로 ${other}에 서서 안으로 접고 들어가 차는 윙어도 많다. 어느 쪽이 좋냐?`
        : `${footW}니까 ${sideW}이 편할 거다. 터치라인 따라 올라가서 바로 올릴 수 있으니까. 그래도 네가 편한 쪽으로 골라라.` });
      const L = o.keys.find(k => DETAIL_POS[k].side === "L"), R = o.keys.find(k => DETAIL_POS[k].side === "R");
      choices("어느 쪽에 설까?", [{ key: L, label: DETAIL_POS[L].label, tag: sideRec === "L" ? "추천" : "" }, { key: R, label: DETAIL_POS[R].label, tag: sideRec === "R" ? "추천" : "" }], x => finish(x.key));
    };
    const finish = key => {
      const r = chooseDetail(state, key);
      if (!r.ok) return;
      app.saveTo("auto");
      box.innerHTML = lineHtml({ who: "coach", t: r.moved ? `좋다. 오늘부터 너는 ${tj(r.d.label, "이다", "다")}. 포지션을 바꾼 만큼 처음 몇 주는 힘들 거다. 버텨라.` : `좋다. 오늘부터 너는 ${tj(r.d.label, "이다", "다")}. 다음 경기부터 그 자리에 세운다.` });
      ctl.innerHTML = `<div class="evchips"><span class="evchip up">${esc(r.d.label)}</span></div><p class="mute dp-desc">${esc(r.d.desc)}</p>
        <button class="btn btn-kit btn-wide" data-close style="margin-top:12px">확인</button>`;
      ctl.querySelector("[data-close]").addEventListener("click", close);
      ctl.querySelector("[data-close]").focus({ preventScroll: true });
      sfx.play("good");
    };
    show();
  }, { dismissable: false, onClose: done, scene: "ev_meeting", cls: "event meeting" });
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
  bgm.play("ending");
  const { ending, c } = decideEnding(state);
  const ns = nemesisSummary(state);
  markEnding(ending.id);
  try { addHallCard(state, ending, c); } catch (e) { console.warn(e); }   // 기록실에 선수 카드
  app.saveTo("auto");
  track("ending", { state }); flush(); pushSave(true);
  const g = GRADE_INFO[ending.grade];
  const p = state.player;
  const recap = [
    ["진학", c.schoolName], ["최종 능력치", c.ovr], ["키", `${c.height.toFixed(1)}cm`],
    ["통산", `${c.apps}경기 ${c.goals}골 ${c.assists}도움`], ["등번호", p.numberHistory.map(h => h.number).join(" → ")],
    ["우승", c.titles.length ? c.titles.map(t => t.name).join(", ") : "없음"],
    ...(ns && ns.games ? [["맞수", `${ns.name} (${ns.team}) ${ns.games}전 ${ns.W}승 ${ns.D}무 ${ns.L}패`]] : []),
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
      ${ending.later ? `<div class="end-later" id="later" hidden><span class="eyebrow">5년 후</span><p>${esc(ending.later(c))}</p></div>` : ""}
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
  const finish = () => { story.textContent = text; const lt = app.root.querySelector("#later"); if (lt) lt.hidden = false; app.root.querySelector("#letter").hidden = false; app.root.querySelector("#recap").hidden = false; app.root.querySelector("#eb").hidden = false; };
  const t = setInterval(() => { n += 2; story.textContent = text.slice(0, n); if (n >= text.length) { clearInterval(t); finish(); } }, reduce ? 1 : 32);
  app.root.querySelector(".ending").addEventListener("click", e => { if (!e.target.closest("button")) { clearInterval(t); finish(); } });
  app.root.querySelector("[data-gallery]").addEventListener("click", () => galleryModal());
  app.root.querySelector("[data-title]").addEventListener("click", () => app.toTitle());
  setTimeout(() => { try { checkAchievements(app, { end: true }); } catch (e) { console.warn(e); } }, 1500);
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
