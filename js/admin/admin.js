// 관리자 페이지: 학생 계정, 게임 스위치, 반 통계, 학생별 기록
import { ADMIN_EMAIL, studentEmail, studentPassword, signIn, signUp, refresh, getDoc, setDoc, delDoc, listDocs, newKey, authMessage, inQuiet } from "../net/fb.js";
import { ACTION_MAP, CATEGORIES } from "../../data/actions.js";

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("#app"), dlg = $("#dlg");
const SK = "gfc_admin_sess";
let sess = null, students = [], cfg = null, tab = "students", sortBy = { k: "sid", dir: 1 };

const readSess = () => { try { return JSON.parse(sessionStorage.getItem(SK) || "null"); } catch { return null; } };
const writeSess = s => { try { s ? sessionStorage.setItem(SK, JSON.stringify(s)) : sessionStorage.removeItem(SK); } catch { /* 이번만 */ } };
async function tok() {
  if (Date.now() > sess.exp) { sess = await refresh(sess); writeSess(sess); }
  return sess.idToken;
}
const friendly = e => e?.code ? authMessage(e) : e?.message || String(e);

// ── 로그인 ───────────────────────────
function renderLogin(msg = "") {
  app.innerHTML = `<div class="login">
    <img class="lg-logo" src="assets/img/logo.png" alt="고흥FC 엠블럼">
    <span class="eb">GOHEUNG FC U-15 · ADMIN</span>
    <h1 class="dp big">DREAM<br>PROJECT</h1>
    <p class="lg-sub">드림 프로젝트 관리자</p>
    <form class="card">
      <label class="fl"><span>이메일</span><input type="email" name="email" value="${esc(ADMIN_EMAIL)}" autocomplete="username"></label>
      <label class="fl"><span>비밀번호</span><input type="password" name="pw" autocomplete="current-password"></label>
      <button class="btn kit wide" type="submit">로그인</button>
      <p class="msg err">${esc(msg)}</p>
    </form>
  </div>`;
  const f = $("form", app);
  f.pw.focus();
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const b = $("button", f); b.disabled = true;
    try {
      if (f.email.value.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) throw new Error("관리자 계정이 아닙니다.");
      sess = await signIn(f.email.value.trim(), f.pw.value);
      writeSess(sess);
      await loadAll(); render();
    } catch (err) { $(".msg", app).textContent = /INVALID|EMAIL_NOT_FOUND/.test(err.code || "") ? "이메일 또는 비밀번호가 맞지 않습니다." : friendly(err); b.disabled = false; }
  });
}

async function loadAll() {
  const t = await tok();
  const [logins, docs, c] = await Promise.all([listDocs("fcg_login"), listDocs("fcg_students", t), getDoc("fcg_config/main")]);
  const byId = new Map(docs.map(d => [d.id, d]));
  students = logins.map(l => ({ sid: l.id, key: l.key, blocked: !!l.blocked, ...(byId.get(l.id) || {}) }));
  cfg = c || { open: true, signup: true, message: "", quiet: { on: false, from: "22:00", to: "07:00", message: "" } };
}

// ── 계산 ─────────────────────────────
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const sum = o => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
// 성향 지수: 실제로 고른 도전·안정 비율 − 고를 수 있었던 비율 (0이면 무작위로 고른 것과 같음)
function tendency(play) {
  const M = play?.match, b = M?.band || {};
  const n = (b.safe || 0) + (b.mid || 0) + (b.bold || 0);
  if (n < 15) return { n, kind: "none", label: "기록 부족", score: 0, b };
  const expB = M.exp?.bold ?? n * 0.28, expS = M.exp?.safe ?? n * 0.21;
  const score = ((b.bold - expB) - (b.safe - expS)) / n;
  const kind = score >= 0.12 ? "bold" : score <= -0.12 ? "safe" : "mid";
  return { n, kind, label: { bold: "도전형", safe: "안정형", mid: "균형형" }[kind], score, b };
}
const tagOf = t => `<span class="tag ${t.kind === "none" ? "" : t.kind}">${t.label}</span>`;
function ago(iso) {
  const d = (Date.now() - new Date(iso)) / 60000;
  if (!iso || !Number.isFinite(d)) return "–";
  if (d < 2) return "방금";
  if (d < 60) return `${Math.round(d)}분 전`;
  if (d < 60 * 24) return `${Math.round(d / 60)}시간 전`;
  return `${Math.round(d / 1440)}일 전`;
}
const stack = (b, label = true) => {
  const n = (b.bold || 0) + (b.mid || 0) + (b.safe || 0);
  if (!n) return `<div class="stack"></div>`;
  return `<div class="stack" title="도전 ${b.bold || 0} · 보통 ${b.mid || 0} · 안정 ${b.safe || 0}">${["bold", "mid", "safe"].map(k => `<i class="${k}" style="width:${(b[k] || 0) / n * 100}%">${label && b[k] / n >= 0.12 ? `${pct(b[k], n)}%` : ""}</i>`).join("")}</div>`;
};
const LEGEND = `<p class="legend"><span><b style="background:var(--bold)"></b>도전적</span><span><b style="background:#59627C"></b>보통</span><span><b style="background:var(--safe)"></b>안정적</span></p>`;
const bars = rows => `<div class="bars">${rows.map(([l, v, max, txt]) => `<span>${esc(l)}</span><div class="bar"><i style="width:${max ? v / max * 100 : 0}%"></i></div><span class="mute small">${txt ?? v}</span>`).join("")}</div>`;
const CAT_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));
const FAM_LABEL = { pass: "패스", dribble: "드리블·볼 키핑", shoot: "슈팅", defense: "수비", body: "몸싸움·스피드", mind: "기타(판단·집중)" };

// ── 화면 틀 ───────────────────────────
function render() {
  app.innerHTML = `<header class="top">
      <div class="brand"><img src="assets/img/logo.png" alt=""><div><span class="eb">GOHEUNG FC · ADMIN</span><b class="dp">DREAM PROJECT</b></div></div>
      <nav class="tabs">${[["students", "학생"], ["stats", "반 통계"], ["switch", "게임 스위치"]].map(([k, l]) => `<button data-tab="${k}" ${tab === k ? "aria-current=page" : ""}>${l}</button>`).join("")}</nav>
      <div class="hd-right">
        <span class="state ${gameOpen() ? "on" : "off"}"><i></i>${gameOpen() ? "게임 열림" : "게임 닫힘"}</span>
        <button class="btn ghost sm" data-reload>새로고침</button>
        <button class="btn ghost sm" data-logout>로그아웃</button>
      </div>
    </header>
    <div class="wrap" id="main"></div>`;
  app.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => { tab = b.dataset.tab; render(); }));
  $("[data-reload]", app).addEventListener("click", async e => { e.target.disabled = true; try { await loadAll(); } catch (err) { alert(friendly(err)); } render(); });
  $("[data-logout]", app).addEventListener("click", () => { writeSess(null); sess = null; renderLogin(); });
  const main = $("#main", app);
  if (tab === "students") studentsTab(main);
  if (tab === "stats") statsTab(main);
  if (tab === "switch") switchTab(main);
}
const gameOpen = () => cfg?.open !== false && !(cfg?.quiet?.on && inQuiet(cfg.quiet));

// ── 학생 탭 ───────────────────────────
function studentsTab(main) {
  const rows = [...students].map(s => ({ ...s, t: tendency(s.play) }));
  const val = (s, k) => ({ sid: s.sid, name: s.name || "", status: s.blocked ? 1 : 0, when: s.now?.turn ?? -1, ovr: s.now?.ovr ?? -1, tend: s.t.score, minutes: s.play?.minutes || 0, seen: s.lastSeen || "" }[k]);
  rows.sort((a, b) => { const x = val(a, sortBy.k), y = val(b, sortBy.k); return (x > y ? 1 : x < y ? -1 : 0) * sortBy.dir; });
  const th = (k, l, cls = "") => `<th class="${cls}" data-sort="${k}">${l}${sortBy.k === k ? (sortBy.dir > 0 ? " ▲" : " ▼") : ""}</th>`;
  main.innerHTML = `<div class="card">
      <h2>학생 등록</h2>
      <div class="row">
        <input type="text" id="a-sid" placeholder="학번 (예: 20301)" style="width:140px">
        <input type="text" id="a-name" placeholder="이름" style="width:120px">
        <input type="text" id="a-pw" placeholder="비밀번호 (4자 이상)" style="width:170px">
        <button class="btn kit" id="a-add">등록</button>
        <button class="btn" id="a-bulk-open">여러 명 한꺼번에</button>
      </div>
      <div id="a-bulk" hidden style="margin-top:12px">
        <p class="note">한 줄에 한 명씩 <b>학번, 이름, 비밀번호</b> 순서로 적으세요. 엑셀에서 세 칸을 복사해 붙여 넣어도 됩니다.</p>
        <textarea id="a-lines" placeholder="20301, 김민준, 1234&#10;20302, 이서준, 5678"></textarea>
        <div class="row" style="margin-top:8px"><button class="btn kit" id="a-bulk-go">한꺼번에 등록</button></div>
      </div>
      <p class="msg" id="a-msg"></p>
    </div>
    <div class="card">
      <div class="row" style="justify-content:space-between;margin-bottom:8px"><h2 style="margin:0">학생 ${students.length}명</h2>
        <button class="btn sm" id="csv">엑셀(CSV) 내려받기</button></div>
      ${students.length ? `<div class="scroll"><table>
        <thead><tr>${th("sid", "학번")}${th("name", "이름")}${th("status", "상태")}${th("when", "진행")}${th("ovr", "종합", "num")}${th("tend", "경기 성향")}${th("minutes", "플레이", "num")}${th("seen", "마지막 접속")}<th></th></tr></thead>
        <tbody>${rows.map(s => `<tr class="${s.blocked ? "blocked" : ""}">
          <td>${esc(s.sid)}</td><td>${esc(s.name || "")}${s.self ? ` <span class="tag" title="학생이 직접 가입">가입</span>` : ""}</td>
          <td>${s.blocked ? `<span class="tag off">차단</span>` : `<span class="tag on">사용</span>`}</td>
          <td>${s.now ? `${esc(s.now.when)}${s.now.ending ? ` · <b>${esc(s.now.ending)}</b>` : ""}<br><small class="mute">${esc(s.now.pos)}${s.now.detail ? ` ${esc(s.now.detail)}` : ""} · ${s.play?.run || 1}번째 판</small>` : `<span class="mute">아직 시작 전</span>`}</td>
          <td class="num">${s.now?.ovr ?? "–"}</td>
          <td>${tagOf(s.t)}</td>
          <td class="num">${s.play?.minutes ? `${Math.floor(s.play.minutes / 60)}시간 ${s.play.minutes % 60}분` : "–"}</td>
          <td>${ago(s.lastSeen)}</td>
          <td><div class="row" style="flex-wrap:nowrap">
            <button class="btn sm" data-detail="${esc(s.sid)}">상세</button>
            <button class="btn sm" data-block="${esc(s.sid)}">${s.blocked ? "해제" : "차단"}</button>
            <button class="btn sm" data-name="${esc(s.sid)}">이름</button>
            <button class="btn sm" data-pw="${esc(s.sid)}">비밀번호</button>
            <button class="btn sm danger" data-del="${esc(s.sid)}">삭제</button></div></td>
        </tr>`).join("")}</tbody></table></div>` : `<p class="empty">등록된 학생이 없습니다. 위에서 학생을 등록하세요.</p>`}
      <p class="note" style="margin-top:10px">경기 성향은 학생이 직접 고른 경기 선택(15번 이상)으로 계산합니다. '알아서 하기'와 '결과만 보기'로 넘긴 장면은 빠집니다.</p>
    </div>`;
  const msg = $("#a-msg", main);
  const say = (t, ok = true) => { msg.textContent = t; msg.className = `msg ${ok ? "ok" : "err"}`; };
  $("#a-add", main).addEventListener("click", async e => {
    e.target.disabled = true;
    try { await addStudent($("#a-sid", main).value, $("#a-name", main).value, $("#a-pw", main).value); await loadAll(); render(); $("#a-msg").textContent = "등록했습니다."; $("#a-msg").className = "msg ok"; }
    catch (err) { say(friendly(err), false); e.target.disabled = false; }
  });
  $("#a-bulk-open", main).addEventListener("click", () => { $("#a-bulk", main).hidden = !$("#a-bulk", main).hidden; });
  $("#a-bulk-go", main).addEventListener("click", async e => {
    const lines = $("#a-lines", main).value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return say("붙여 넣은 내용이 없습니다.", false);
    e.target.disabled = true;
    const fails = [];
    let ok = 0;
    for (const [i, l] of lines.entries()) {
      const [sid, name, pw] = l.split(/\s*[,\t]\s*/);
      say(`등록 중… ${i + 1}/${lines.length}`);
      try { await addStudent(sid, name, pw); ok++; } catch (err) { fails.push(`${sid || `${i + 1}번째 줄`}: ${friendly(err)}`); }
    }
    await loadAll(); render();
    const m = $("#a-msg");
    m.textContent = `${ok}명 등록했습니다.${fails.length ? `\n등록 못 한 학생 ${fails.length}명\n${fails.join("\n")}` : ""}`;
    m.className = `msg ${fails.length ? "err" : "ok"}`;
  });
  main.querySelectorAll("[data-sort]").forEach(h => h.addEventListener("click", () => { const k = h.dataset.sort; sortBy = { k, dir: sortBy.k === k ? -sortBy.dir : 1 }; render(); }));
  main.querySelectorAll("[data-detail]").forEach(b => b.addEventListener("click", () => detail(b.dataset.detail)));
  main.querySelectorAll("[data-block]").forEach(b => b.addEventListener("click", async () => {
    const s = students.find(x => x.sid === b.dataset.block);
    b.disabled = true;
    try { await setDoc(`fcg_login/${s.sid}`, { key: s.key, blocked: !s.blocked }, await tok()); s.blocked = !s.blocked; render(); }
    catch (err) { alert(friendly(err)); b.disabled = false; }
  }));
  main.querySelectorAll("[data-name]").forEach(b => b.addEventListener("click", async () => {
    const s = students.find(x => x.sid === b.dataset.name);
    const nm = prompt(`${s.sid} 학생의 이름`, s.name || "");
    if (nm == null || !nm.trim()) return;
    try { await setDoc(`fcg_students/${s.sid}`, { name: nm.trim().slice(0, 20) }, await tok(), ["name"]); s.name = nm.trim().slice(0, 20); render(); }
    catch (err) { alert(friendly(err)); }
  }));
  main.querySelectorAll("[data-pw]").forEach(b => b.addEventListener("click", async () => {
    const s = students.find(x => x.sid === b.dataset.pw);
    const pw = prompt(`${s.sid} ${s.name || ""} 학생의 새 비밀번호 (4자 이상)\n바꾸면 그 학생은 새 비밀번호로 다시 로그인해야 합니다. 기록과 저장은 그대로 남습니다.`);
    if (pw == null) return;
    try { await changePassword(s, pw); alert("비밀번호를 바꿨습니다."); await loadAll(); render(); }
    catch (err) { alert(friendly(err)); }
  }));
  main.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
    const s = students.find(x => x.sid === b.dataset.del);
    if (!confirm(`${s.sid} ${s.name || ""} 학생을 삭제할까요?\n플레이 기록과 클라우드 저장도 함께 지워지고, 되돌릴 수 없습니다.`)) return;
    try {
      const t = await tok();
      for (const p of [`fcg_login/${s.sid}`, `fcg_students/${s.sid}`, `fcg_saves/${s.sid}`]) await delDoc(p, t).catch(e => { if (e.status !== 404) throw e; });
      await loadAll(); render();
    } catch (err) { alert(friendly(err)); }
  }));
  $("#csv", main)?.addEventListener("click", () => downloadCsv(rows));
}

const SID_OK = /^[0-9A-Za-z-]{1,20}$/;
async function addStudent(sid, name, pw) {
  sid = String(sid || "").trim(); name = String(name || "").trim(); pw = String(pw || "").trim();
  if (!SID_OK.test(sid)) throw new Error("학번은 숫자·영문으로 20자 이내로 적어 주세요.");
  if (!name) throw new Error("이름을 적어 주세요.");
  if (pw.length < 4) throw new Error("비밀번호는 4자 이상이어야 합니다.");
  if (await getDoc(`fcg_login/${sid}`)) throw new Error("이미 등록된 학번입니다.");
  const key = newKey();
  await signUp(studentEmail(sid, key), studentPassword(pw));
  const t = await tok();
  await setDoc(`fcg_students/${sid}`, { name, created: new Date() }, t);
  await setDoc(`fcg_login/${sid}`, { key, blocked: false }, t);
}
// 무료 요금제에서는 남의 비밀번호를 직접 바꿀 수 없어서, 새 열쇠로 계정을 새로 만들고 학번이 그 계정을 가리키게 바꿉니다
async function changePassword(s, pw) {
  pw = String(pw || "").trim();
  if (pw.length < 4) throw new Error("비밀번호는 4자 이상이어야 합니다.");
  const key = newKey();
  await signUp(studentEmail(s.sid, key), studentPassword(pw));
  await setDoc(`fcg_login/${s.sid}`, { key, blocked: s.blocked }, await tok());
}

function downloadCsv(rows) {
  const head = ["학번", "이름", "상태", "판", "진행", "포지션", "세부 포지션", "종합", "출전", "골", "도움", "평균 평점", "주장", "진학", "엔딩", "맞수", "경기 성향", "도전 선택", "보통 선택", "안정 선택", "직접 고른 선택", "넘긴 선택", "개인훈련", "단체훈련", "학교생활", "휴식", "이벤트 수", "플레이(분)", "마지막 접속"];
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map(s => {
    const n = s.now || {}, M = s.play?.match || {}, b = M.band || {}, c = s.play?.plan?.cat || {};
    return [s.sid, s.name, s.blocked ? "차단" : "사용", s.play?.run || "", n.when, n.pos, n.detail, n.ovr, n.apps, n.goals, n.assists, n.rating, n.captain ? "주장" : "", n.school, n.ending, n.nemesis,
      s.t.label, b.bold || 0, b.mid || 0, b.safe || 0, (b.bold || 0) + (b.mid || 0) + (b.safe || 0), M.auto || 0, c.personal || 0, c.team || 0, c.school || 0, c.rest || 0,
      s.play?.events?.length || 0, s.play?.minutes || 0, s.lastSeen ? new Date(s.lastSeen).toLocaleString("ko-KR") : ""].map(q).join(",");
  });
  const blob = new Blob(["﻿" + [head.map(q).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `드림프로젝트_학생기록_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ── 학생 상세 ─────────────────────────
function detail(sid) {
  const s = students.find(x => x.sid === sid);
  const P = s.play || {}, M = P.match || {}, n = s.now || {}, t = tendency(P);
  const b = M.band || {}, okr = k => b[k] ? `${pct(M.ok?.[k] || 0, b[k])}%` : "–";
  const fam = M.fam || {}, famMax = Math.max(1, ...Object.values(fam));
  const cat = P.plan?.cat || {}, catN = sum(cat), ex = P.plan?.exam?.cat || {}, exN = sum(ex);
  const acts = Object.entries(P.plan?.act || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const tm = M.timing || {}, tmN = sum(tm);
  const evs = [...(P.events || [])].reverse();
  dlg.innerHTML = `<div class="dhead"><h2>${esc(s.sid)} ${esc(s.name || "")}</h2>${tagOf(t)}<button class="btn sm" data-close>닫기</button></div>
  <div class="dbody">
    ${s.now ? `<div class="kpis">
      <div class="kpi"><b>${esc(n.when)}</b><span>${P.run || 1}번째 판 진행</span></div>
      <div class="kpi"><b>${n.ovr}</b><span>종합 · ${esc(n.pos)} ${esc(n.detail || "")} ${n.number ? `${n.number}번` : ""}</span></div>
      <div class="kpi"><b>${n.apps}경기</b><span>${n.goals}골 ${n.assists}도움 · 평점 ${n.rating ? n.rating.toFixed(2) : "–"}</span></div>
      <div class="kpi"><b>${P.minutes ? `${Math.floor(P.minutes / 60)}:${String(P.minutes % 60).padStart(2, "0")}` : "–"}</b><span>플레이 시간 · 마지막 ${ago(s.lastSeen)}</span></div>
    </div>
    <p class="small mute" style="margin:10px 0 0">${[n.captain ? "주장" : "", n.school ? `진학: ${esc(n.school)}` : "", n.ending ? `엔딩: ${esc(n.ending)}` : "", n.nemesis ? `맞수: ${esc(n.nemesis)}` : "", `사기 ${n.morale} · 감독 신뢰 ${n.coach}`].filter(Boolean).join(" · ")}</p>
    ${(P.endings || []).length ? `<p class="small" style="margin:6px 0 0">본 엔딩: ${P.endings.map(e => `${e.r}판 ${esc(e.title)}`).join(", ")}</p>` : ""}` : `<p class="empty">아직 게임을 시작하지 않았습니다.</p>`}

    <div class="grid" style="margin-top:14px">
      <div class="card"><h2>경기 중 선택</h2>
        ${t.n ? `${stack(b)}${LEGEND}
        <p class="small" style="margin:10px 0 0">직접 고른 선택 ${t.n}번 · 넘긴 선택 ${M.auto || 0}번 · 성향 지수 <b>${(t.score * 100).toFixed(0)}</b> <span class="mute">(0이 보통, +는 도전, −는 안정)</span></p>
        <h3>성공률</h3>${bars([["도전적", M.ok?.bold || 0, b.bold || 0, okr("bold")], ["보통", M.ok?.mid || 0, b.mid || 0, okr("mid")], ["안정적", M.ok?.safe || 0, b.safe || 0, okr("safe")]])}
        <h3>점수 상황에 따라</h3>
        <div class="bars" style="grid-template-columns:max-content 1fr">${[["지고 있을 때", "behind"], ["비기고 있을 때", "level"], ["이기고 있을 때", "ahead"]].map(([l, k]) => `<span>${l}</span>${stack(M.sc?.[k] || {})}`).join("")}</div>`
        : `<p class="empty">경기 기록이 없습니다.</p>`}
      </div>
      <div class="card"><h2>즐겨 쓰는 플레이</h2>
        ${sum(fam) ? bars(Object.entries(FAM_LABEL).map(([k, l]) => [l, fam[k] || 0, famMax, `${pct(fam[k] || 0, sum(fam))}%`])) : `<p class="empty">기록이 없습니다.</p>`}
        ${tmN ? `<h3>타이밍 버튼</h3>${bars([["완벽", tm.perfect || 0, tmN, `${tm.perfect || 0}번`], ["좋음", tm.good || 0, tmN, `${tm.good || 0}번`], ["놓침", tm.miss || 0, tmN, `${tm.miss || 0}번`]])}` : ""}
        <h3>경기 결과 (뛴 경기)</h3><p class="small" style="margin:0">${M.games || 0}경기 ${M.wins || 0}승 ${M.draws || 0}무 ${M.losses || 0}패 · ${M.goals || 0}골 ${M.assists || 0}도움${M.rated ? ` · 평균 평점 ${(M.ratingSum / M.rated).toFixed(2)}` : ""}</p>
      </div>
      <div class="card"><h2>한 주 계획</h2>
        ${catN ? bars(CATEGORIES.map(c => [c.label, cat[c.id] || 0, catN, `${pct(cat[c.id] || 0, catN)}%`])) : `<p class="empty">기록이 없습니다.</p>`}
        ${exN ? `<h3>시험 주간 (${P.plan.exam.weeks}주)</h3>${bars(CATEGORIES.map(c => [c.label, ex[c.id] || 0, exN, `${pct(ex[c.id] || 0, exN)}%`]))}` : ""}
        ${acts.length ? `<h3>많이 고른 활동</h3>${bars(acts.map(([id, v]) => [ACTION_MAP[id]?.label || id, v, acts[0][1], `${v}번`]))}` : ""}
      </div>
    </div>
    <div class="card"><h2>이벤트 선택 (${evs.length}개, 최근 순)</h2>
      ${evs.length ? `<div class="evlist">${evs.map(e => `<div class="ev"><small>${e.r}번째 판 · ${esc(e.w)}</small><q>${esc(e.t)}${e.t?.length >= 70 ? "…" : ""}</q><br>→ <span class="pick">${esc(e.c)}</span></div>`).join("")}</div>` : `<p class="empty">이벤트 기록이 없습니다.</p>`}
    </div>
  </div>`;
  $("[data-close]", dlg).addEventListener("click", () => dlg.close());
  dlg.showModal();
  dlg.scrollTop = 0;
}

// ── 반 통계 ───────────────────────────
function statsTab(main) {
  const list = students.filter(s => s.play);
  if (!list.length) { main.innerHTML = `<div class="card"><p class="empty">아직 플레이 기록이 없습니다.</p></div>`; return; }
  const ts = list.map(s => ({ s, t: tendency(s.play) }));
  const kinds = { bold: 0, mid: 0, safe: 0, none: 0 };
  ts.forEach(x => kinds[x.t.kind]++);
  const day = 86400000, nowT = Date.now();
  const active = d => list.filter(s => s.lastSeen && nowT - new Date(s.lastSeen) < d).length;
  const all = { bold: 0, mid: 0, safe: 0 }, okAll = { bold: 0, mid: 0, safe: 0 }, sc = { behind: { bold: 0, mid: 0, safe: 0 }, level: { bold: 0, mid: 0, safe: 0 }, ahead: { bold: 0, mid: 0, safe: 0 } };
  const cat = {}, fam = {};
  for (const s of list) {
    const M = s.play.match || {};
    for (const k of ["bold", "mid", "safe"]) { all[k] += M.band?.[k] || 0; okAll[k] += M.ok?.[k] || 0; for (const z of ["behind", "level", "ahead"]) sc[z][k] += M.sc?.[z]?.[k] || 0; }
    for (const [k, v] of Object.entries(s.play.plan?.cat || {})) cat[k] = (cat[k] || 0) + v;
    for (const [k, v] of Object.entries(M.fam || {})) fam[k] = (fam[k] || 0) + v;
  }
  // 성향별 결과 비교
  const groups = ["bold", "mid", "safe"].map(k => {
    const g = ts.filter(x => x.t.kind === k).map(x => x.s);
    const r = g.map(s => s.play.match).filter(M => M?.rated);
    const ends = g.flatMap(s => (s.play.endings || []).map(e => e.title.split(" ")[0]));
    return { k, label: { bold: "도전형", mid: "균형형", safe: "안정형" }[k], n: g.length,
      rating: r.length ? (r.reduce((a, M) => a + M.ratingSum / M.rated, 0) / r.length).toFixed(2) : "–",
      ovr: g.filter(s => s.now).length ? Math.round(g.filter(s => s.now).reduce((a, s) => a + s.now.ovr, 0) / g.filter(s => s.now).length) : "–",
      ends: ends.length ? Object.entries(ends.reduce((o, e) => (o[e] = (o[e] || 0) + 1, o), {})).sort().map(([e, c]) => `${e} ${c}`).join(" · ") : "–" };
  });
  // 이벤트별 선택 분포
  const evMap = new Map();
  for (const s of list) for (const e of s.play.events || []) {
    if (!evMap.has(e.id)) evMap.set(e.id, { id: e.id, t: e.t, total: 0, picks: {}, who: {} });
    const x = evMap.get(e.id);
    x.total++; x.picks[e.c] = (x.picks[e.c] || 0) + 1;
    (x.who[e.c] ||= new Set()).add(s.name || s.sid);
  }
  const evs = [...evMap.values()].sort((a, b) => b.total - a.total);
  const catN = sum(cat), famN = sum(fam);
  main.innerHTML = `<div class="card"><h2>한눈에</h2><div class="kpis">
      <div class="kpi"><b>${students.length}명</b><span>등록 학생</span></div>
      <div class="kpi"><b>${list.length}명</b><span>게임을 시작한 학생</span></div>
      <div class="kpi"><b>${active(day)}명</b><span>오늘(24시간) 접속</span></div>
      <div class="kpi"><b>${active(7 * day)}명</b><span>최근 7일 접속</span></div>
      <div class="kpi"><b>${list.reduce((a, s) => a + (s.play.endings || []).length, 0)}번</b><span>엔딩까지 간 횟수</span></div>
    </div></div>
    <div class="grid">
      <div class="card"><h2>경기 성향 분포</h2>
        ${bars([["도전형", kinds.bold, list.length, `${kinds.bold}명`], ["균형형", kinds.mid, list.length, `${kinds.mid}명`], ["안정형", kinds.safe, list.length, `${kinds.safe}명`], ["기록 부족", kinds.none, list.length, `${kinds.none}명`]])}
        <h3>반 전체 선택</h3>${stack(all)}${LEGEND}
        <h3>성공률</h3>${bars([["도전적", okAll.bold, all.bold, all.bold ? `${pct(okAll.bold, all.bold)}%` : "–"], ["보통", okAll.mid, all.mid, all.mid ? `${pct(okAll.mid, all.mid)}%` : "–"], ["안정적", okAll.safe, all.safe, all.safe ? `${pct(okAll.safe, all.safe)}%` : "–"]])}
        <h3>점수 상황에 따라</h3>
        <div class="bars" style="grid-template-columns:max-content 1fr">${[["지고 있을 때", "behind"], ["비기고 있을 때", "level"], ["이기고 있을 때", "ahead"]].map(([l, k]) => `<span>${l}</span>${stack(sc[k])}`).join("")}</div>
      </div>
      <div class="card"><h2>성향별 결과</h2>
        <table><thead><tr><th>성향</th><th class="num">학생</th><th class="num">평균 평점</th><th class="num">평균 종합</th><th>엔딩 등급</th></tr></thead>
        <tbody>${groups.map(g => `<tr><td>${tagOf({ kind: g.k, label: g.label })}</td><td class="num">${g.n}</td><td class="num">${g.rating}</td><td class="num">${g.ovr}</td><td class="small">${esc(g.ends)}</td></tr>`).join("")}</tbody></table>
        <h3>한 주 계획 (반 전체)</h3>
        ${catN ? bars(CATEGORIES.map(c => [c.label, cat[c.id] || 0, catN, `${pct(cat[c.id] || 0, catN)}%`])) : `<p class="mute small">기록이 없습니다.</p>`}
        <h3>즐겨 쓰는 플레이 (반 전체)</h3>
        ${famN ? bars(Object.entries(FAM_LABEL).map(([k, l]) => [l, fam[k] || 0, famN, `${pct(fam[k] || 0, famN)}%`])) : `<p class="mute small">기록이 없습니다.</p>`}
      </div>
    </div>
    <div class="card"><h2>이벤트별 선택 (${evs.length}개)</h2>
      <p class="note">같은 이야기에서 학생들이 무엇을 골랐는지입니다. 막대에 마우스를 올리면 고른 학생이 보입니다.</p>
      ${evs.map(x => `<div class="evstat"><p><q class="mute">${esc(x.t)}${x.t?.length >= 70 ? "…" : ""}</q> <span class="mute small">· ${x.total}번</span></p>
        ${bars(Object.entries(x.picks).sort((a, b) => b[1] - a[1]).map(([c, v]) => [c, v, x.total, `${pct(v, x.total)}% (${v})`]))}</div>`).join("") || `<p class="empty">기록이 없습니다.</p>`}
    </div>`;
  // 막대 위에 고른 학생 이름
  main.querySelectorAll(".evstat").forEach((el, i) => {
    const x = evs[i];
    const picks = Object.entries(x.picks).sort((a, b) => b[1] - a[1]);
    el.querySelectorAll(".bar").forEach((b, j) => { b.title = [...(x.who[picks[j][0]] || [])].join(", "); });
  });
}

// ── 게임 스위치 ────────────────────────
function switchTab(main) {
  const q = cfg.quiet || {};
  main.innerHTML = `<div class="card"><h2>게임 열고 닫기</h2>
      <div class="switch">
        <label><input type="radio" name="open" value="1" ${cfg.open !== false ? "checked" : ""}><span>열림</span></label>
        <label><input type="radio" name="open" value="0" ${cfg.open === false ? "checked" : ""}><span>닫힘</span></label>
      </div>
      <div class="formgrid" style="margin-top:12px">
        <span>닫혔을 때 안내</span><input type="text" id="s-msg" value="${esc(cfg.message || "")}" placeholder="지금은 게임이 닫혀 있습니다.">
      </div>
      <p class="note">닫으면 학생 화면은 3분 안에 안내 화면으로 바뀝니다. 진행은 자동 저장되어 있어 다시 열면 이어서 할 수 있습니다. 선생님 계정은 닫혀 있어도 들어갈 수 있습니다.</p>
    </div>
    <div class="card"><h2>학생 가입</h2>
      <label class="row"><input type="checkbox" id="su-on" ${cfg.signup !== false ? "checked" : ""}> <span>학생이 로그인 화면에서 직접 가입할 수 있게</span></label>
      <p class="note">끄면 가입 버튼이 사라지고, 이미 가입한 학생과 선생님이 등록한 학생만 들어올 수 있습니다. 직접 가입한 학생도 '학생' 탭에서 이름 고치기·차단·비밀번호·삭제를 할 수 있습니다.</p>
    </div>
    <div class="card"><h2>시간 제한</h2>
      <label class="row"><input type="checkbox" id="q-on" ${q.on ? "checked" : ""}> <span>정해진 시간에는 자동으로 닫기</span></label>
      <div class="formgrid" style="margin-top:12px">
        <span>닫히는 시간</span><div class="row"><input type="time" id="q-from" value="${esc(q.from || "22:00")}"> 부터 <input type="time" id="q-to" value="${esc(q.to || "07:00")}"> 까지</div>
        <span>안내 문구</span><input type="text" id="q-msg" value="${esc(q.message || "")}" placeholder="밤에는 쉬자! 내일 아침에 다시 만나요.">
      </div>
      <p class="note">한국 시간 기준, 매일 적용됩니다. 학생 기기의 시계를 기준으로 확인합니다.</p>
    </div>
    <div class="row"><button class="btn kit" id="s-save">저장</button><span class="msg" id="s-res"></span></div>`;
  $("#s-save", main).addEventListener("click", async e => {
    e.target.disabled = true;
    const next = {
      open: $("input[name=open]:checked", main).value === "1",
      signup: $("#su-on", main).checked,
      message: $("#s-msg", main).value.trim(),
      quiet: { on: $("#q-on", main).checked, from: $("#q-from", main).value || "22:00", to: $("#q-to", main).value || "07:00", message: $("#q-msg", main).value.trim() },
    };
    try { await setDoc("fcg_config/main", next, await tok()); cfg = next; render(); const r = $("#s-res"); r.textContent = "저장했습니다."; r.className = "msg ok"; }
    catch (err) { const r = $("#s-res", main); r.textContent = friendly(err); r.className = "msg err"; e.target.disabled = false; }
  });
}

// ── 시작 ─────────────────────────────
(async () => {
  sess = readSess();
  if (!sess) return renderLogin();
  try { await loadAll(); render(); }
  catch (e) { writeSess(null); renderLogin(e.status === 401 || e.status === 400 ? "다시 로그인해 주세요." : friendly(e)); }
})();
