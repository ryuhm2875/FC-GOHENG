// 경기 화면: 전광판 → 22명이 움직이는 경기장 → 문자 중계 → 내 장면 선택지
import { next, resolve, autoChoice, autoPlay, finishMatch, STATUS_LABEL, TAG_LABEL, MY_SLOT } from "../engine/match.js";
import { STAFF } from "../../data/roster.js";
import { getPath } from "../rng.js";
import { tierLabel, TEAM_NAME } from "../engine/season.js";
import { esc, img, faceOf } from "./util.js";
import { conditionOf } from "../engine/growth.js";
import { setScene, enter, buzz } from "./fx.js";
import { sfx } from "./sfx.js";

const SPEED = { normal: 1250, fast: 420 };

// 기본 대형 (우리 팀이 오른쪽으로 공격). 상대는 좌우를 뒤집어 씀
const BASE = {
  GK: [[4, 34]],
  DF: [[18, 10], [16, 26], [16, 42], [18, 58]],
  MF: [[38, 12], [35, 27], [35, 41], [38, 56]],
  FW: [[55, 26], [55, 42]],
};
const LIMIT = { GK: [2, 10], DF: [7, 72], MF: [14, 88], FW: [24, 98] };

// 선수 22명 만들기. 점 하나하나가 명단의 실제 선수(이름·등번호)와 이어져 있음
function buildPlayers(state, m) {
  const p = state.player;
  const list = [];
  const ours = { GK: [{ name: m.gk.us, number: 1 }], DF: [], MF: [], FW: [] };
  for (const x of m.lineup) ours[x.pos].push({ ...x });
  for (const [pos, spots] of Object.entries(BASE)) {
    spots.forEach((pt, i) => {
      let who = ours[pos][i], me = false;
      const mySlot = pos === p.position && i === MY_SLOT[pos];
      if (mySlot && m.status === "start") { ours[pos].splice(i, 0, { name: p.name, number: p.number }); who = ours[pos][i]; me = true; }
      list.push({ id: `u-${pos}-${i}`, team: "us", pos, base: pt, number: who?.number ?? "", name: who?.name ?? "", me,
        subSlot: mySlot && m.status === "sub", x: pt[0], y: pt[1] });
      const oy = Math.min(64, Math.max(4, pt[1] + (pos === "GK" ? 0 : 3)));
      const opp = pos === "GK" ? { name: m.gk.them, number: 1 } : m.oppPlayers.filter(o => o.pos === pos)[i];
      list.push({ id: `t-${pos}-${i}`, team: "them", pos, base: [105 - pt[0], oy], number: opp?.number ?? "", name: opp?.name ?? "", me: false, x: 105 - pt[0], y: oy });
    });
  }
  return list;
}

// 공 위치와 소유 팀, 공을 가진 선수(actor)에 맞춰 모두의 목표 위치 계산
function layout(players, ball, poss, opt = {}) {
  const [bx, by] = ball;
  const t = (bx - 52.5) / 52.5;
  for (const pl of players) {
    const [x0, y0] = pl.base;
    if (pl.pos === "GK") {
      const near = pl.team === "us" ? Math.max(0, 22 - bx) : Math.max(0, bx - 83);
      pl.x = pl.team === "us" ? 3 + near * 0.12 : 102 - near * 0.12;
      pl.y = 34 + (by - 34) * 0.25;
      continue;
    }
    const attack = pl.team === poss;
    const dir = pl.team === "us" ? 1 : -1;
    let x = x0 + t * 20 + dir * (attack ? 7 : -3);
    let y = y0 + (by - 34) * 0.32;
    const [lo, hi] = LIMIT[pl.pos];
    x = pl.team === "us" ? Math.min(hi, Math.max(lo, x)) : Math.min(105 - lo, Math.max(105 - hi, x));
    pl.x = x; pl.y = Math.min(65, Math.max(3, y));
  }
  if (bx < 1 || bx > 104) return;                                   // 골망·라인 밖
  const named = opt.actor ? players.find(p => p.name === opt.actor) : null;
  const team = named ? named.team : poss;
  if (!team) return;
  const holder = named || (opt.holderIsMe ? players.find(p => p.me) : null)
    || players.filter(p => p.team === team && p.pos !== "GK").sort((a, b) => dist(a, ball) - dist(b, ball))[0];
  const side = team === "us" ? 1 : -1;
  if (holder) { holder.x = holder.pos === "GK" ? bx : bx - side * 1.6; holder.y = by; }
  // 수비 쪽: 가장 가까운 두 명이 붙음. 내가 막는 장면이면 내가 제일 먼저 붙음
  const meTok = players.find(p => p.me);
  const foes = players.filter(p => p.team !== team && p.pos !== "GK" && p !== holder).sort((a, b) => dist(a, ball) - dist(b, ball));
  if (opt.press && meTok && meTok.team !== team) { foes.splice(foes.indexOf(meTok), 1); foes.unshift(meTok); }
  if (foes[0]) { foes[0].x = bx + side * 3; foes[0].y = by + (foes[0].y > by ? 2 : -2); }
  if (foes[1] && dist(foes[1], ball) < 14) { foes[1].x = bx + side * 6; foes[1].y = by + (foes[1].y > by ? 6 : -6); }
}
const dist = (p, [x, y]) => Math.hypot(p.x - x, p.y - y);

function pitchSvg(players) {
  return `<svg class="pitch" viewBox="0 0 105 68" role="img" aria-label="경기장">
    <rect x="0" y="0" width="105" height="68" class="turf"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${i * 15}" y="0" width="7.5" height="68" class="stripe"/>`).join("")}
    <g class="lines"><rect x="1" y="1" width="103" height="66"/><line x1="52.5" y1="1" x2="52.5" y2="67"/>
      <circle cx="52.5" cy="34" r="9.15"/><rect x="1" y="13.85" width="16.5" height="40.3"/><rect x="87.5" y="13.85" width="16.5" height="40.3"/>
      <rect x="1" y="24.85" width="5.5" height="18.3"/><rect x="98.5" y="24.85" width="5.5" height="18.3"/>
      <rect x="-1" y="30.3" width="2" height="7.4" class="goal"/><rect x="104" y="30.3" width="2" height="7.4" class="goal"/></g>
    ${players.map(p => `<g class="dot ${p.team} ${p.pos === "GK" ? "gk" : ""} ${p.me ? "me" : ""}" data-id="${p.id}" style="transform:translate(${p.x}px,${p.y}px)">
      <circle r="4" class="ring"/><circle r="2.3" class="body"/><text y="0.75" class="no">${p.number}</text><text y="-4.3" class="tag">나</text></g>`).join("")}
    <g class="ball" style="transform:translate(52.5px,34px)"><circle r="1.2"/></g>
  </svg>`;
}

const LINE_CLASS = { info: "", us: "us", them: "them", "goal-us": "goal", "goal-me": "goal mine", "goal-them": "goal against",
  me: "me", "me-auto": "me auto", "me-good": "me good", "me-bad": "me bad", whistle: "whistle", coach: "coach", stat: "stat", card: "card" };
const ICON = { "goal-us": "⚽ ", "goal-me": "⚽ ", "goal-them": "", card: "🟨 ", whistle: "", stat: "📊 " };

export function showMatch(app, m, onDone) {
  const state = app.state;
  const p = state.player;
  const fx = m.fx;
  let speed = "normal", timer = null, paused = false, queue = [], after = null;
  const players = buildPlayers(state, m);
  layout(players, [52.5, 34], null);

  app.root.innerHTML = `<div class="match-screen">
    <header class="board">
      <div class="comp">${esc(fx.compLabel)}${fx.round ? ` ${esc(fx.round)}` : ""}</div>
      <div class="teams">
        <span class="tm home"><img src="assets/img/logo.png" alt="">${TEAM_NAME}</span>
        <span class="sc num" id="sc">0 : 0</span>
        <span class="tm away">${esc(fx.opponent.name)}</span>
      </div>
      <div class="clock num" id="clock">경기 전</div>
    </header>
    <div class="match-body">
      <div class="pitch-wrap" id="pitch">${pitchSvg(players)}<div class="goal-flash" id="flash" hidden>GOAL</div></div>
      <ol class="feed" id="feed" aria-live="polite"></ol>
    </div>
    <footer class="ctl" id="ctl"></footer>
  </div>`;

  const root = app.root;
  setScene("bg_prematch", "prematch");                 // 경기 직전: 조명 켜진 운동장
  enter(root.querySelector(".match-screen"));
  const feed = root.querySelector("#feed");
  const ctl = root.querySelector("#ctl");
  const svg = root.querySelector(".pitch");
  const flash = root.querySelector("#flash");
  const dotEls = Object.fromEntries([...svg.querySelectorAll(".dot")].map(el => [el.dataset.id, el]));
  const ballEl = svg.querySelector(".ball");
  const raiseMe = () => { const t = players.find(x => x.me); if (t) svg.insertBefore(dotEls[t.id], ballEl); };   // 내 점은 맨 위에
  raiseMe();

  function draw(ball, poss, ms, opt = {}) {
    if (ball) layout(players, ball, poss, opt);
    const dur = `${Math.max(120, ms * 0.85)}ms`;
    for (const pl of players) {
      const el = dotEls[pl.id];
      el.style.transitionDuration = dur;
      el.style.transform = `translate(${pl.x.toFixed(2)}px,${pl.y.toFixed(2)}px)`;
    }
    if (ball) { ballEl.style.transitionDuration = dur; ballEl.style.transform = `translate(${ball[0].toFixed(2)}px,${ball[1].toFixed(2)}px)`; }
  }

  // 경기 전 선발 명단: 경기장 위 점과 같은 순서·번호
  const byPos = pos => players.filter(x => x.team === "us" && x.pos === pos).map(x => `${x.me ? "<b class='me-n'>" : ""}${x.number} ${esc(x.name)}${x.me ? "</b>" : ""}`).join(", ");
  feed.innerHTML = `<li class="lineup"><span class="mn">선발</span><span>
    <b>GK</b> ${byPos("GK")}<br><b>DF</b> ${byPos("DF")}<br><b>MF</b> ${byPos("MF")}<br><b>FW</b> ${byPos("FW")}
    ${m.status === "sub" ? `<br><b>교체</b> ${p.number} ${esc(p.name)} (후반 투입 예정)` : ""}</span></li>`;

  // 교체 투입 / 부상 교체 때 점의 주인 바꾸기
  function swapToken(tok, who, me) {
    tok.name = who.name; tok.number = who.number; tok.me = me;
    const el = dotEls[tok.id];
    el.classList.toggle("me", me);
    el.querySelector(".no").textContent = who.number;
    if (me) raiseMe();
  }

  // 전광판은 중계 문장이 골 장면에 도착했을 때 바뀜 (엔진은 한 번의 공격을 미리 다 계산해 둠)
  let shown = [0, 0], shownMin = null, lastScore = "0 : 0";
  const updateBoard = () => {
    const sc = root.querySelector("#sc"), now = `${shown[0]} : ${shown[1]}`;
    sc.textContent = now;
    if (now !== lastScore) { lastScore = now; sc.classList.remove("bump"); void sc.offsetWidth; sc.classList.add("bump"); }
    root.querySelector("#clock").textContent = m.done ? "종료" : `${shownMin ?? m.minute}'`;
  };
  function addLine(l) {
    if (l.silent || !l.t) return;
    const li = document.createElement("li");
    li.className = LINE_CLASS[l.k] || "";
    li.innerHTML = `<span class="mn num">${l.minute}'</span><span>${ICON[l.k] || ""}${esc(l.t)}</span>`;
    feed.appendChild(li);
    feed.scrollTop = feed.scrollHeight;
  }
  function goalFlash(k) {
    flash.textContent = k === "goal-them" ? "실점" : "GOAL";
    flash.className = `goal-flash ${k === "goal-them" ? "against" : ""}`;
    flash.hidden = false;
    clearTimeout(flash._t);
    flash._t = setTimeout(() => { flash.hidden = true; }, 1300);
    const scr = root.querySelector(".match-screen");
    scr.classList.remove("shake"); void scr.offsetWidth; scr.classList.add(k === "goal-them" ? "shake-soft" : "shake");
    setTimeout(() => scr.classList.remove("shake", "shake-soft"), 700);
    if (k === "goal-them") { sfx.play("concede"); buzz(40); }
    else { sfx.play("goal"); buzz(k === "goal-me" ? [70, 50, 70, 50, 160] : [60, 40, 120]); }
  }

  // 줄을 하나씩 보여 주며 선수들을 움직임
  function play(lines, then) {
    queue = lines.slice();
    after = then;
    step();
  }
  function step() {
    clearTimeout(timer);
    if (paused) return;
    const l = queue.shift();
    if (!l) { const f = after; after = null; f?.(); return; }
    const ms = SPEED[speed] * (l.fast ? 0.62 : 1);
    if (l.subIn) { const tok = players.find(x => x.subSlot); if (tok) swapToken(tok, { name: p.name, number: p.number }, true); }
    if (l.injuredOff) { const tok = players.find(x => x.me); if (tok) swapToken(tok, l.injuredOff, false); }
    if (l.ball) draw(l.ball, l.poss, ms, { actor: l.actor, press: l.press, holderIsMe: !!(l.toMe || l.meHold) && !l.actor });
    addLine(l);
    if (l.score) shown = l.score.slice();
    if (l.minute != null) shownMin = l.minute;
    if (l.k?.startsWith("goal")) goalFlash(l.k);
    updateBoard();
    timer = setTimeout(step, l.silent ? ms * 0.7 : (l.k?.startsWith("goal") ? ms * 1.4 : ms));
  }

  // ── 경기 전 ──
  const statusLine = m.onPitch
    ? `${STATUS_LABEL[m.status]}${m.status === "sub" ? ` (후반 ${m.minIn}분쯤 투입 예정)` : ""}`
    : `${STATUS_LABEL[m.status]}${m.reason ? `: ${m.reason}` : ""}`;
  const barPct = v => Math.round(Math.max(5, Math.min(95, 50 + (v - 50) * 3)));
  ctl.innerHTML = `<div class="prematch">
    <div class="pm-me">
      <div class="pm-face">${img(faceOf(p, state.calendar.grade), p.name)}</div>
      <div><div class="pm-name">${p.number}. ${esc(p.name)} <span class="pos-tag ${p.position}">${p.position}</span></div>
        <div class="pm-status ${m.onPitch ? "" : "off"}">${statusLine}</div></div>
    </div>
    ${(() => { const c = conditionOf(p); const mp = Math.round(c.match * 100);
      const role = m.star >= 1 ? "에이스. 상대가 집중 견제합니다" : m.star >= 0.4 ? "핵심 선수" : m.onPitch ? "팀의 일원" : "";
      return `<div class="pm-tags"><span class="cond ${c.cls}">컨디션 ${c.label}</span><span class="mute">선택 성공률 ${mp > 0 ? "+" : ""}${mp}%p</span>
        ${role ? `<span class="chip ${m.star >= 1 ? "kit" : ""}">영향력: ${role}</span>` : ""}</div>`; })()}
    ${m.talk ? `<div class="talk">
      <div class="talk-face">${img(m.talk.who === "coach" ? "npc_coach" : "npc_assistant", "")}</div>
      <div><div class="talk-who">${esc(m.talk.who === "coach" ? STAFF.coach : STAFF.assistant)}</div>
        <p>"${esc(m.talk.text)}"</p>
        ${m.talk.tag ? `<span class="chip kit">지시: ${TAG_LABEL[m.talk.tag]}</span> <span class="mute" style="font-size:12px">같은 종류를 고르면 성공률 +4%p</span>` : ""}</div></div>` : ""}
    ${fx.school ? `<div class="alert gold">🎓 오늘 ${esc(fx.school.name)}(${tierLabel(fx.school.tier)}) ${esc(fx.school.coach)}이 관전합니다. 상대는 고등학생이라 몸싸움이 버겁습니다.</div>` : ""}
    ${fx.ko ? `<div class="alert gold">지면 탈락입니다. 비기면 승부차기.</div>` : ""}
    <div class="power"><span>우리 전력</span><div class="pw"><i style="width:${barPct(m.ours)}%"></i></div>
      <span>상대 전력</span><div class="pw them"><i style="width:${barPct(m.theirs)}%"></i></div></div>
    <div class="ctl-row"><button class="btn btn-ghost" data-skip>결과만 보기</button><button class="btn btn-kit" data-start>${m.onPitch ? "킥오프" : "경기 지켜보기"}</button></div>
  </div>`;
  ctl.querySelector("[data-start]").addEventListener("click", () => { setScene("bg_stadium", "match"); sfx.play("kickoff"); controls(); tick(); });
  ctl.querySelector("[data-skip]").addEventListener("click", skipAll);

  function controls() {
    ctl.innerHTML = `<div class="ctl-row">
      <button class="btn btn-ghost" data-pause>일시정지</button>
      <button class="btn btn-ghost" data-speed>${speed === "fast" ? "보통 속도" : "빠르게"}</button>
      <button class="btn" data-skip>결과만 보기</button></div>`;
    ctl.querySelector("[data-pause]").addEventListener("click", e => {
      paused = !paused; e.target.textContent = paused ? "계속" : "일시정지";
      if (!paused) (queue.length || after ? step() : tick()); else clearTimeout(timer);
    });
    ctl.querySelector("[data-speed]").addEventListener("click", e => {
      speed = speed === "normal" ? "fast" : "normal"; e.target.textContent = speed === "fast" ? "보통 속도" : "빠르게";
    });
    ctl.querySelector("[data-skip]").addEventListener("click", skipAll);
  }

  function tick() {
    clearTimeout(timer);
    if (paused) return;
    const r = next(state, m);
    play(r.lines, () => {
      if (r.kind === "moment") return showMoment();
      if (r.kind === "ht") { sfx.play("half"); return showHalftime(); }
      if (r.kind === "ft") { sfx.play("full"); return end(); }
      timer = setTimeout(tick, r.lines.length ? 120 : 0);
    });
  }

  function showMoment() {
    const pd = m.pending;
    ctl.innerHTML = `<div class="moment" role="group" aria-label="선택">
      <p class="mo-text"><span class="num">${m.minute}'</span> ${esc(pd.text)}</p>
      <div class="mo-choices">${pd.choices.map((c, i) => `<button class="mo-btn" data-c="${i}">
        <span>${c.signature ? `<b class="sigb">★ 특기</b> ` : ""}${esc(c.label)}${c.follow ? ` <b class="follow">지시</b>` : ""}${c.timing ? ` <b class="tmark" title="타이밍 버튼">⏱</b>` : ""}</span><span class="lv ${c.level === "높음" ? "hi" : c.level === "보통" ? "mid" : "lo"}">${c.level}</span></button>`).join("")}</div>
      <button class="linkbtn" data-autopick>알아서 하기</button>
    </div>`;
    ctl.classList.add("ask");
    buzz(60);
    const pickIt = (i, timing = null) => {
      if (!m.pending || m.done) return;                 // 그 사이 '결과만 보기'를 눌렀으면 무시
      ctl.classList.remove("ask");
      const r = resolve(state, m, i, timing);
      controls();
      paused = false;
      play(r.lines, () => { timer = setTimeout(tick, 200); });
    };
    const choose = i => {
      const kind = pd.choices[i].timing;
      if (!kind || app.settings.timing === false) return pickIt(i);
      timingGame(kind, i, res => pickIt(i, res));
    };
    ctl.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => choose(+b.dataset.c)));
    ctl.querySelector("[data-autopick]").addEventListener("click", () => pickIt(autoChoice(m)));
    ctl.querySelector("[data-c]").focus({ preventScroll: true });
  }

  // 결정적 장면: 움직이는 바늘을 초록 칸에 맞춰 누르기
  function timingGame(T, i, done) {
    const sv = getPath(p.stats, T.stat);
    const width = 16 + sv * 0.12;                       // 초록 칸 너비(%)
    const center = 30 + Math.random() * 40;
    const lo = center - width / 2, hi = center + width / 2, plo = center - width / 6, phi = center + width / 6;
    const period = 1300 - Math.min(400, sv * 3);         // 바늘 왕복 시간(ms)
    ctl.innerHTML = `<div class="timing">
      <p class="tm-title"><b>${T.label} 타이밍!</b> 바늘이 초록 칸에 올 때 누르세요</p>
      <div class="tbar"><i class="zone" style="left:${lo}%;width:${width}%"></i><i class="perfect" style="left:${plo}%;width:${phi - plo}%"></i><b class="needle" id="needle"></b></div>
      <button class="btn btn-kit btn-wide tm-btn" data-hit>${T.btn}</button></div>`;
    const needle = ctl.querySelector("#needle");
    const t0 = performance.now();
    let raf, fin = false, pos = 0;
    const loop = now => {
      const ph = ((now - t0) % period) / period;
      pos = ph < 0.5 ? ph * 200 : (1 - ph) * 200;
      needle.style.left = `${pos}%`;
      if (now - t0 > period * 3.2) return hit(true);
      raf = requestAnimationFrame(loop);
    };
    const hit = (timeout = false) => {
      if (fin) return; fin = true;
      cancelAnimationFrame(raf); document.removeEventListener("keydown", key);
      const res = timeout ? "miss" : pos >= plo && pos <= phi ? "perfect" : pos >= lo && pos <= hi ? "good" : "miss";
      sfx.play(res === "miss" ? "bad" : "good");
      ctl.querySelector(".timing").insertAdjacentHTML("beforeend", `<p class="tm-res ${res}">${{ perfect: "완벽한 타이밍! 성공률 크게 상승", good: "좋은 타이밍! 성공률 상승", miss: timeout ? "머뭇거렸다…" : "타이밍이 어긋났다…" }[res]}</p>`);
      setTimeout(() => done(res), 650);
    };
    const key = e => { if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); hit(); } };
    document.addEventListener("keydown", key);
    ctl.querySelector("[data-hit]").addEventListener("pointerdown", e => { e.preventDefault(); hit(); });
    raf = requestAnimationFrame(loop);
  }

  function showHalftime() {
    let left = 8;
    ctl.innerHTML = `<div class="ctl-row"><button class="btn btn-kit btn-wide" data-second>후반 시작 <span class="mute" id="htc">(${left})</span></button></div>`;
    const go = () => { clearInterval(iv); controls(); tick(); };
    const iv = setInterval(() => { left--; const c = ctl.querySelector("#htc"); if (c) c.textContent = `(${left})`; if (left <= 0) go(); }, 1000);
    ctl.querySelector("[data-second]").addEventListener("click", go);
  }

  function skipAll() {
    clearTimeout(timer);
    setScene("bg_stadium", "match");
    ctl.classList.remove("ask");
    queue.forEach(addLine); queue = []; after = null;
    const before = m.feed.length;
    autoPlay(state, m);
    m.feed.slice(before).forEach(addLine);
    shown = m.score.slice();
    end();
  }

  function end() {
    clearTimeout(timer);
    const before = m.feed.length;
    const res = finishMatch(state, m);
    m.feed.slice(before).forEach(addLine);
    draw([52.5, 34], null, 600);
    shown = m.score.slice();
    updateBoard();
    const resCls = { 승: "W", 무: "D", 패: "L" }[res.result];
    const goals = m.goalsLog.map(g => `<li class="${g.team}">${g.minute}' ${esc(g.name)}${g.assist ? ` <span class="mute">(도움 ${esc(g.assist)})</span>` : ""}</li>`).join("");
    ctl.innerHTML = `<div class="postmatch">
      <div class="pm-head"><span class="badge-res ${resCls}">${res.result}</span>
        <span class="num">${TEAM_NAME} ${res.gf} : ${res.ga} ${esc(res.opponent)}</span>
        ${res.shootout ? `<span class="mute">(승부차기 ${res.shootout.us}:${res.shootout.them})</span>` : ""}</div>
      ${goals ? `<ul class="pm-goals">${goals}</ul>` : ""}
      ${res.minutes > 0 ? `<div class="pm-rating">
          <div class="rt num ${res.rating >= 7.5 ? "hi" : res.rating >= 6.5 ? "mid" : "lo"}">${res.rating.toFixed(1)}</div>
          <div><div>${STATUS_LABEL[res.status]} ${res.minutes}분${res.goals ? `, ${res.goals}골` : ""}${res.assists ? `, ${res.assists}도움` : ""}</div>
          <div class="mute" style="font-size:13px">선택 ${m.my.decisions}번 중 ${m.my.successes}번 성공${res.mom ? ` <span class="chip kit">경기 최우수 선수</span>` : ""}</div></div>
        </div>` : `<p class="mute">${esc(res.reason || STATUS_LABEL[res.status])}</p>`}
      ${res.notes.length ? `<ul class="pm-notes">${res.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
      <p class="mute" style="font-size:13px;margin:0">감독님 면담과 경기 기록은 메시지함에 왔습니다.</p>
      <button class="btn btn-kit btn-wide" data-done>이번 주 마무리</button>
    </div>`;
    ctl.querySelector("[data-done]").addEventListener("click", () => onDone(res));
    ctl.querySelector("[data-done]").focus({ preventScroll: true });
  }
}
