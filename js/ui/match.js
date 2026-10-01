// 경기 화면: 전광판 → 22명이 움직이는 경기장 → 문자 중계 → 내 장면 선택지
import { next, resolve, autoChoice, autoPlay, finishMatch, STATUS_LABEL } from "../engine/match.js";
import { tierLabel, TEAM_NAME } from "../engine/season.js";
import { esc, img, faceOf } from "./util.js";
import { conditionOf } from "../engine/growth.js";

const SPEED = { normal: 1250, fast: 420 };

// 기본 대형 (우리 팀이 오른쪽으로 공격). 상대는 좌우를 뒤집어 씀
const BASE = {
  GK: [[4, 34]],
  DF: [[18, 10], [16, 26], [16, 42], [18, 58]],
  MF: [[38, 12], [35, 27], [35, 41], [38, 56]],
  FW: [[55, 26], [55, 42]],
};
const MY_SLOT = { FW: 0, MF: 1, DF: 1 };
const LIMIT = { GK: [2, 10], DF: [7, 72], MF: [14, 88], FW: [24, 98] };

// 선수 22명 만들기
function buildPlayers(state, m) {
  const p = state.player;
  const list = [];
  const ours = { GK: [{ name: m.gk.us, number: 1 }], DF: [], MF: [], FW: [] };
  for (const x of m.lineup) ours[x.pos].push(x);
  for (const [pos, spots] of Object.entries(BASE)) {
    spots.forEach((pt, i) => {
      let who = ours[pos][i];
      const me = pos === p.position && i === MY_SLOT[pos] && m.onPitch;
      if (me) { ours[pos].splice(i, 0, { name: p.name, number: p.number }); who = ours[pos][i]; }
      list.push({ id: `u-${pos}-${i}`, team: "us", pos, base: pt, number: who?.number ?? "", me, x: pt[0], y: pt[1] });
      const oy = Math.min(64, Math.max(4, pt[1] + (pos === "GK" ? 0 : 3)));
      const opp = m.oppPlayers.filter(o => o.pos === pos)[i];
      list.push({ id: `t-${pos}-${i}`, team: "them", pos, base: [105 - pt[0], oy], number: pos === "GK" ? 1 : opp?.number ?? "", me: false, x: 105 - pt[0], y: oy });
    });
  }
  return list;
}

// 공 위치와 소유 팀에 맞춰 모두의 목표 위치 계산
function layout(players, ball, poss, holderIsMe) {
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
  if (!poss || bx < 2 || bx > 103) return;
  // 공 가진 선수, 가장 가까운 상대가 따라붙음
  const mates = players.filter(p => p.team === poss && p.pos !== "GK");
  const holder = holderIsMe ? players.find(p => p.me) : mates.sort((a, b) => dist(a, ball) - dist(b, ball))[0];
  if (holder) { holder.x = bx - (poss === "us" ? 1.6 : -1.6); holder.y = by; }
  const foes = players.filter(p => p.team !== poss && p.pos !== "GK").sort((a, b) => dist(a, ball) - dist(b, ball));
  if (foes[0]) { foes[0].x = bx + (poss === "us" ? 3 : -3); foes[0].y = by + (foes[0].y > by ? 2 : -2); }
  if (foes[1] && dist(foes[1], ball) < 14) { foes[1].x = bx + (poss === "us" ? 6 : -6); foes[1].y = by + (foes[1].y > by ? 6 : -6); }
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
      ${p.me ? `<circle r="3.6" class="ring"/>` : ""}<circle r="2.3" class="body"/><text y="0.75">${p.number}</text></g>`).join("")}
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
  const feed = root.querySelector("#feed");
  const ctl = root.querySelector("#ctl");
  const svg = root.querySelector(".pitch");
  const flash = root.querySelector("#flash");
  const dotEls = Object.fromEntries([...svg.querySelectorAll(".dot")].map(el => [el.dataset.id, el]));
  const ballEl = svg.querySelector(".ball");

  function draw(ball, poss, ms, holderIsMe = false) {
    if (ball) layout(players, ball, poss, holderIsMe);
    const dur = `${Math.max(120, ms * 0.85)}ms`;
    for (const pl of players) {
      const el = dotEls[pl.id];
      el.style.transitionDuration = dur;
      el.style.transform = `translate(${pl.x.toFixed(2)}px,${pl.y.toFixed(2)}px)`;
    }
    if (ball) { ballEl.style.transitionDuration = dur; ballEl.style.transform = `translate(${ball[0].toFixed(2)}px,${ball[1].toFixed(2)}px)`; }
  }

  // 경기 전 선발 명단
  const byPos = pos => [...m.lineup.filter(x => x.pos === pos).map(x => `${x.number} ${x.name}`),
    ...(m.status === "start" && p.position === pos ? [`${p.number} ${p.name}`] : [])].join(", ");
  feed.innerHTML = `<li class="lineup"><span class="mn">선발</span><span>
    <b>GK</b> 1 ${esc(m.gk.us)}<br><b>DF</b> ${esc(byPos("DF"))}<br><b>MF</b> ${esc(byPos("MF"))}<br><b>FW</b> ${esc(byPos("FW"))}</span></li>`;

  const updateBoard = () => {
    root.querySelector("#sc").textContent = `${m.score[0]} : ${m.score[1]}`;
    root.querySelector("#clock").textContent = m.done ? "종료" : `${m.minute}'`;
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
    if (l.ball) draw(l.ball, l.poss, ms, !!(l.toMe || l.meHold));
    addLine(l);
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
    ${fx.school ? `<div class="alert gold">🎓 오늘 ${esc(fx.school.name)}(${tierLabel(fx.school.tier)}) ${esc(fx.school.coach)}이 관전합니다. 상대는 고등학생이라 몸싸움이 버겁습니다.</div>` : ""}
    ${fx.ko ? `<div class="alert gold">지면 탈락입니다. 비기면 승부차기.</div>` : ""}
    <div class="power"><span>우리 전력</span><div class="pw"><i style="width:${barPct(m.ours)}%"></i></div>
      <span>상대 전력</span><div class="pw them"><i style="width:${barPct(m.theirs)}%"></i></div></div>
    <div class="ctl-row"><button class="btn btn-ghost" data-skip>결과만 보기</button><button class="btn btn-kit" data-start>${m.onPitch ? "킥오프" : "경기 지켜보기"}</button></div>
  </div>`;
  ctl.querySelector("[data-start]").addEventListener("click", () => { controls(); tick(); });
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
      if (r.kind === "ht") return showHalftime();
      if (r.kind === "ft") return end();
      timer = setTimeout(tick, r.lines.length ? 120 : 0);
    });
  }

  function showMoment() {
    const pd = m.pending;
    ctl.innerHTML = `<div class="moment" role="group" aria-label="선택">
      <p class="mo-text"><span class="num">${m.minute}'</span> ${esc(pd.text)}</p>
      <div class="mo-choices">${pd.choices.map((c, i) => `<button class="mo-btn" data-c="${i}">
        <span>${c.signature ? `<b class="sigb">★ 특기</b> ` : ""}${esc(c.label)}</span><span class="lv ${c.level === "높음" ? "hi" : c.level === "보통" ? "mid" : "lo"}">${c.level}</span></button>`).join("")}</div>
      <button class="linkbtn" data-autopick>알아서 하기</button>
    </div>`;
    const pickIt = i => {
      const r = resolve(state, m, i);
      controls();
      paused = false;
      play(r.lines, () => { timer = setTimeout(tick, 200); });
    };
    ctl.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => pickIt(+b.dataset.c)));
    ctl.querySelector("[data-autopick]").addEventListener("click", () => pickIt(autoChoice(m)));
    ctl.querySelector("[data-c]").focus({ preventScroll: true });
  }

  function showHalftime() {
    ctl.innerHTML = `<div class="ctl-row"><button class="btn btn-kit btn-wide" data-second>후반 시작</button></div>`;
    ctl.querySelector("[data-second]").addEventListener("click", () => { controls(); tick(); });
  }

  function skipAll() {
    clearTimeout(timer);
    queue.forEach(addLine); queue = []; after = null;
    const before = m.feed.length;
    autoPlay(state, m);
    m.feed.slice(before).forEach(addLine);
    end();
  }

  function end() {
    clearTimeout(timer);
    const before = m.feed.length;
    const res = finishMatch(state, m);
    m.feed.slice(before).forEach(addLine);
    draw([52.5, 34], null, 600);
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
