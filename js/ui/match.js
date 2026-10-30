// 경기 화면: 전광판 → 22명이 움직이는 경기장 → 문자 중계 → 내 장면 선택지
import { next, resolve, autoChoice, autoPlay, finishMatch, applyHalftime, STATUS_LABEL, TAG_LABEL } from "../engine/match.js";
import { track } from "../net/online.js";
import { frameNow } from "../engine/sim.js";
import { STAFF } from "../../data/roster.js";
import { getPath } from "../rng.js";
import { tierLabel, TEAM_NAME } from "../engine/season.js";
import { crest } from "./crest.js";
import { esc, img, faceOf, fillText } from "./util.js";
import { conditionOf } from "../engine/growth.js";
import { setScene, enter, buzz } from "./fx.js";
import { sfx } from "./sfx.js";
import { bgm } from "./bgm.js";
import { createPitch } from "./pitch.js";

const TS_EPS = 0.01;                               // 중계 줄 시각과 경기장 시각 비교 여유 (초)

const GAP = { normal: 600, fast: 260 };              // 중계 줄 사이 최소 간격(ms). 경기장은 그동안 계속 움직임
const HALF_MIN = 35;                                  // 후반부터는 양 팀이 진영을 바꿔 공격 방향이 반대가 됨

// 상대 팀 유니폼 색. 데이터에 없으면 팀 이름으로 정해진 색을 씀
const KIT_POOL = [["#F3F5FB", "#1F2C8F"], ["#1E88E5", "#FFFFFF"], ["#C62828", "#FFFFFF"], ["#2E7D32", "#FFFFFF"], ["#6A1B9A", "#FFFFFF"], ["#FDD835", "#1A237E"], ["#212121", "#29B6F6"], ["#00897B", "#FFFFFF"]];
function kitOf(opp) {
  let fill = opp.color, stroke = opp.color2;
  if (!fill) { let h = 0; for (const ch of String(opp.name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; [fill, stroke] = KIT_POOL[h % KIT_POOL.length]; }
  const n = parseInt(fill.slice(1), 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  // 상대 골키퍼 색: 유니폼과 확실히 다르게 (밝은 유니폼이면 검정, 어두운 유니폼이면 형광)
  const gk = lum > 0.5 ? "#212121" : "#C6FF00";
  return { fill, stroke: stroke || "#FFFFFF", text: lum > 0.55 ? "#14181F" : "#FFFFFF", gk, gkText: lum > 0.5 ? "#FFFFFF" : "#14181F" };
}

// 경기장 위 선수 22명: 엔진이 정한 명단(m.players)과 시뮬레이션의 처음 자리를 그대로 씀
function buildPlayers(m) {
  return m.players.map((p, i) => ({ id: p.id, team: p.team, pos: p.pos, name: p.name, number: p.number, me: p.me, subSlot: p.subSlot,
    x: m.sim.P[i].x, y: m.sim.P[i].y }));
}

function pitchSvg(players, kit) {
  return `<svg class="pitch" viewBox="0 0 105 68" role="img" aria-label="경기장" style="--opp:${kit.fill};--opp2:${kit.stroke};--oppText:${kit.text};--oppGk:${kit.gk};--oppGkText:${kit.gkText}">
    <rect x="0" y="0" width="105" height="68" class="turf"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${i * 15}" y="0" width="7.5" height="68" class="stripe"/>`).join("")}
    <g class="lines"><rect x="1" y="1" width="103" height="66"/><line x1="52.5" y1="1" x2="52.5" y2="67"/>
      <circle cx="52.5" cy="34" r="9.15"/><rect x="1" y="13.85" width="16.5" height="40.3"/><rect x="87.5" y="13.85" width="16.5" height="40.3"/>
      <rect x="1" y="24.85" width="5.5" height="18.3"/><rect x="98.5" y="24.85" width="5.5" height="18.3"/>
      <rect x="-1" y="30.3" width="2" height="7.4" class="goal"/><rect x="104" y="30.3" width="2" height="7.4" class="goal"/></g>
    <g class="netfx"></g>
    <ellipse class="bshadow" rx="1.25" ry=".55" style="transform:translate(52.5px,34.7px)"/>
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
  let speed = "normal", paused = false, pend = [], after = null, waiting = false, lastShown = 0, holdUntil = 0, finished = false;
  let soOn = false;                                      // 승부차기 중 (건너뛰기 없음)
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const players = buildPlayers(m);

  app.root.innerHTML = `<div class="match-screen">
    <header class="board">
      <div class="comp">${esc(fx.compLabel)}${fx.round ? ` ${esc(fx.round)}` : ""}</div>
      <div class="teams">
        <span class="tm home">${fx.jn ? `<i class="kit-dot jn-dot"></i>${esc(fx.usName)}` : `<img src="assets/img/logo.png" alt="">${TEAM_NAME}`}</span>
        <span class="sc num" id="sc">0 : 0</span>
        <span class="tm away">${crest(fx.opponent.name, { size: 26, cls: "bcrest" })}${esc(fx.opponent.name)}</span>
      </div>
      <div class="clock num" id="clock">경기 전</div>
    </header>
    <div class="match-body">
      <div class="pitch-wrap sky-${m.sky || "day"} wx-${m.weather || "clear"}" id="pitch">${pitchSvg(players, kitOf(fx.opponent))}${m.weather && m.weather !== "clear" ? `<div class="wx-layer" aria-hidden="true"></div>` : ""}<div class="goal-flash" id="flash" hidden>GOAL</div><div class="atk-dir" id="atk">공격 방향 ▶</div></div>
      <ol class="feed" id="feed" aria-live="polite"></ol>
    </div>
    <footer class="ctl" id="ctl"></footer>
  </div>`;

  const root = app.root;
  setScene("bg_prematch", "prematch");                 // 경기 직전: 조명 켜진 운동장
  bgm.play("match");
  enter(root.querySelector(".match-screen"));
  const feed = root.querySelector("#feed");
  const ctl = root.querySelector("#ctl");
  const svg = root.querySelector(".pitch");
  const flash = root.querySelector("#flash");
  const dotEls = Object.fromEntries([...svg.querySelectorAll(".dot")].map(el => [el.dataset.id, el]));
  const ballEl = svg.querySelector(".ball"), shadowEl = svg.querySelector(".bshadow"), netFx = svg.querySelector(".netfx");
  // 세로 화면: 전광판·선택지 높이를 빼고 남은 만큼만 경기장을 키움 (중계 줄은 최소 64px 남김)
  const pitchWrap = root.querySelector("#pitch"), boardEl = root.querySelector(".board");
  const narrow = () => innerWidth < 900 && !(matchMedia("(orientation: landscape) and (max-height: 620px)").matches);
  const fitPitch = () => {
    if (!pitchWrap.isConnected) return;
    if (!narrow()) { pitchWrap.style.maxWidth = ""; return; }
    const avail = innerHeight - boardEl.offsetHeight - ctl.offsetHeight - 16 - 8 - 64;
    pitchWrap.style.maxWidth = `${Math.max(180, Math.floor(avail * 105 / 68))}px`;
  };
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(fitPitch) : null;
  ro?.observe(ctl); ro?.observe(boardEl);
  addEventListener("resize", fitPitch);
  fitPitch();
  const raiseMe = () => { const t = players.find(x => x.me); if (t) svg.insertBefore(dotEls[t.id], ballEl); };   // 내 점은 맨 위에
  raiseMe();

  // 경기장 (js/ui/pitch.js): 엔진의 경기장 시뮬레이션이 기록한 움직임을 그대로 재생
  // 후반에는 그릴 때만 좌우를 뒤집음 (엔진 좌표는 그대로)
  let flipped = false;
  const SX = x => (flipped ? 105 - x : x);
  const pitch = createPitch({ svg, players, dotEls, ballEl, shadowEl, calm });
  m.record = true;
  pitch.load([frameNow(m.sim)]);
  // 골 장면: 골문 쪽으로 화면이 살짝 다가가고, 골망이 출렁임
  function goalCam(k) {
    if (calm) return;
    const right = SX(pitch.ball()[0]) > 52.5, gx = right ? 104.2 : 0.8;
    netFx.innerHTML = [0, 1, 2].map(i => `<path class="net-wave" style="animation-delay:${i * 0.12}s" d="M${gx} 30.3 Q${(gx + (right ? 2.4 : -2.4)).toFixed(1)} 34 ${gx} 37.7"/>`).join("")
      + `<circle class="net-burst" cx="${gx}" cy="34" r="2"/>`;
    svg.classList.remove("cam-l", "cam-r"); void svg.getBoundingClientRect();
    svg.classList.add(right ? "cam-r" : "cam-l");
    clearTimeout(svg._cam);
    svg._cam = setTimeout(() => { svg.classList.remove("cam-l", "cam-r"); netFx.innerHTML = ""; }, 1500);
  }
  function setHalf(second) {
    if (second === flipped) return;
    flipped = second;
    const a = root.querySelector("#atk");
    a.textContent = flipped ? "◀ 공격 방향" : "공격 방향 ▶";
    a.classList.remove("swap"); void a.offsetWidth; a.classList.add("swap");
    pitch.setFlip(flipped);
  }

  // 경기 전 선발 명단: 경기장 위 점과 같은 순서·번호
  const byPos = pos => players.filter(x => x.team === "us" && x.pos === pos).map(x => `${x.me ? "<b class='me-n'>" : ""}${x.number} ${esc(x.name)}${x.me ? "</b>" : ""}`).join(", ");
  feed.innerHTML = `<li class="lineup"><span class="mn">선발</span><span>
    <b>GK</b> ${byPos("GK")}<br><b>DF</b> ${byPos("DF")}<br><b>MF</b> ${byPos("MF")}<br><b>FW</b> ${byPos("FW")}
    </span></li>`;

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
    root.querySelector("#clock").textContent = m.done ? "종료" : soOn ? "승부차기" : `${shownMin ?? m.minute}'`;
  };
  // 승부차기: 경기장 위 ○✕ 기록판 (중계 줄이 그 킥에 도착할 때 바뀜)
  function soBoard(so) {
    const wrap = root.querySelector("#pitch");
    let el = wrap.querySelector(".so-board");
    if (!el) { wrap.insertAdjacentHTML("beforeend", `<div class="so-board" role="status" aria-label="승부차기 기록"></div>`); el = wrap.querySelector(".so-board"); }
    const n = Math.max(5, so.us.length, so.them.length);
    const row = (name, arr) => `<div class="so-row"><span class="so-name">${esc(name)}</span>${Array.from({ length: n }, (_, i) => `<i class="${arr[i] === true ? "ok" : arr[i] === false ? "no" : ""}">${arr[i] === true ? "○" : arr[i] === false ? "✕" : ""}</i>`).join("")}<b class="num">${arr.filter(Boolean).length}</b></div>`;
    el.innerHTML = row(fx.usName || TEAM_NAME, so.us) + row(fx.opponent.name, so.them);
  }
  // 해설 칸 크기가 바뀔 때(선택 창, 타이밍, 하프타임) 맨 아래를 보고 있었으면 계속 맨 아래로
  let stick = true;
  feed.addEventListener("scroll", () => { stick = feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 6; }, { passive: true });
  if (typeof ResizeObserver === "function") new ResizeObserver(() => { if (stick) feed.scrollTop = feed.scrollHeight; }).observe(feed);
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
    goalCam(k);
    const scr = root.querySelector(".match-screen");
    scr.classList.remove("shake"); void scr.offsetWidth; scr.classList.add(k === "goal-them" ? "shake-soft" : "shake");
    setTimeout(() => scr.classList.remove("shake", "shake-soft"), 700);
    if (k === "goal-them") { sfx.play("concede"); buzz(40); }
    else { sfx.play("goal"); buzz(k === "goal-me" ? [70, 50, 70, 50, 160] : [60, 40, 120]); }
  }

  // 교체 투입 연출: 대기심의 번호판 + "경기에 투입됩니다"
  function subBoard(outNo) {
    const wrap = root.querySelector("#pitch");
    wrap.querySelector(".sub-board")?.remove();
    wrap.insertAdjacentHTML("beforeend", `<div class="sub-board" role="status">
      <div class="sb-panel">
        <div class="sb-head">SUBSTITUTION</div>
        <div class="sb-nums"><span class="sb-out"><i>OUT</i><b class="num">${esc(String(outNo || "–"))}</b></span><span class="sb-in"><i>IN</i><b class="num">${p.number}</b></span></div>
      </div>
      <div class="sb-msg"><span class="sb-name">${esc(p.name)}</span> 경기에 투입됩니다</div>
    </div>`);
    sfx.play("kickoff"); setTimeout(() => sfx.play("up"), 450);
    buzz([40, 60, 120]);
    const scr = root.querySelector(".match-screen");
    scr.classList.add("subbing");
    setTimeout(() => { wrap.querySelector(".sub-board")?.classList.add("out"); scr.classList.remove("subbing"); }, 2300);
    setTimeout(() => wrap.querySelector(".sub-board")?.remove(), 2800);
  }

  // 중계 줄 하나를 화면에 (골, 교체 같은 연출 포함)
  function showLine(l) {
    if (l.subIn) {
      const tok = players.find(x => x.team === "us" && x.name === l.outName) || players.find(x => x.subSlot);
      if (tok) swapToken(tok, { name: p.name, number: p.number }, true);
      subBoard(l.outNo);
      holdUntil = performance.now() + 2400;              // 번호판을 보는 동안 경기장도 잠깐 멈춤
      pitch.pause(true);
    }
    if (l.injuredOff) { const tok = players.find(x => x.me); if (tok) swapToken(tok, l.injuredOff, false); }
    addLine(l);
    if (l.score) shown = l.score.slice();
    if (l.minute != null) shownMin = l.minute;
    if (l.half2 || (l.minute != null && l.minute > HALF_MIN)) setHalf(true);   // 후반 킥오프 문장부터 진영 교체
    if (l.k?.startsWith("goal")) goalFlash(l.k);
    if (l.soStart) { soOn = true; controls(); }        // 승부차기는 건너뛸 수 없음 (결과만 보기 숨김)
    if (l.so) soBoard(l.so);
    if (l.soEnd) {
      flash.textContent = l.soEnd === "us" ? "승리!" : "탈락";
      flash.className = `goal-flash ${l.soEnd === "us" ? "" : "against"}`; flash.hidden = false;
      clearTimeout(flash._t); flash._t = setTimeout(() => { flash.hidden = true; }, 1800);
      if (l.soEnd === "us") { sfx.play("goal"); buzz([60, 40, 120]); } else { sfx.play("concede"); buzz(40); }
    }
    updateBoard();
  }
  // 경기장 시계에 맞춰 중계 줄을 내보내고, 기록이 끝나면 다음을 이어 감
  pitch.onTime((clock, atEnd) => {
    if (paused || finished) return;
    const now = performance.now();
    if (holdUntil && now < holdUntil) return;
    if (holdUntil) { holdUntil = 0; pitch.pause(false); }
    const gap = calm ? GAP[speed] * 1.3 : GAP[speed];
    // 경기장 기록의 시각은 32비트 소수라 조금 작게 저장됨 (예: 111.1 → 111.0999985). 기록 간격(0.1초)보다 훨씬 작은 여유를 둬서 줄이 멈춰 있지 않게
    if (pend.length && (pend[0].ts ?? 0) <= clock + TS_EPS && now - lastShown >= gap) { showLine(pend.shift()); lastShown = now; }
    pitch.setSlow(pend.length > 3 && (pend[2].ts ?? 0) <= clock + TS_EPS ? 0.6 : 1);    // 읽을 줄이 많이 밀리면 경기장을 잠깐 천천히
    if (atEnd && !pend.length && !waiting && after) {
      const k = after; after = null;
      if (k === "line") return tick();
      if (k === "moment") return showMoment();
      if (k === "ht") { sfx.play("half"); return showHalftime(); }
      if (k === "ft") { sfx.play("full"); return end(); }
    }
  });
  // 엔진에서 다음 장면을 받아 경기장 기록과 중계 줄을 이어 붙임
  function tick() {
    if (paused || finished) return;
    waiting = true;
    const r = next(state, m);
    waiting = false;
    pitch.load(r.frames, r.cut);
    pend.push(...r.lines);
    after = r.kind;
  }

  // ── 경기 전 ──
  const statusLine = m.onPitch
    ? (m.status === "sub" ? STATUS_LABEL.bench : STATUS_LABEL[m.status])   // 교체 투입은 미리 알려 주지 않음
    : `${STATUS_LABEL[m.status]}${m.reason ? `: ${m.reason}` : ""}`;
  const barPct = v => Math.round(Math.max(5, Math.min(95, 50 + (v - 50) * 3)));
  ctl.innerHTML = `<div class="prematch">
    <div class="pm-me">
      <div class="pm-face">${img(faceOf(p, state.calendar.grade), p.name)}</div>
      <div><div class="pm-name">${p.number}. ${esc(p.name)} <span class="pos-tag ${p.position}">${p.position}</span></div>
        <div class="pm-status ${m.status === "start" ? "" : "off"}">${statusLine}</div></div>
    </div>
    ${(() => { const c = conditionOf(p); const mp = Math.round(c.match * 100);
      const role = m.status !== "start" ? "" : m.star >= 1 ? "에이스. 상대가 집중 견제합니다" : m.star >= 0.4 ? "핵심 선수" : "팀의 일원";
      const wx = { rain: "☔ 비, 미끄러운 잔디", hot: "☀️ 무더위", cold: "❄️ 매서운 추위", wind: "🌬️ 강한 바닷바람" }[m.weather];
      const sk = { night: "🌙 조명 경기", dusk: "🌇 해 질 녘" }[m.sky];
      return `<div class="pm-tags"><span class="cond ${c.cls}">컨디션 ${c.label}</span><span class="mute">선택 성공률 ${mp > 0 ? "+" : ""}${mp}%p</span>
        ${wx ? `<span class="chip wx">${wx}</span>` : ""}${sk ? `<span class="chip wx">${sk}</span>` : ""}
        ${role ? `<span class="chip ${m.star >= 1 ? "kit" : ""}">영향력: ${role}</span>` : ""}</div>`; })()}
    ${m.talk ? `<div class="talk">
      <div class="talk-face">${img(m.talk.who === "coach" ? "npc_coach" : "npc_assistant", "")}</div>
      <div><div class="talk-who">${esc(m.talk.who === "coach" ? STAFF.coach : STAFF.assistant)}</div>
        <p>"${esc(m.talk.text)}"</p>
        ${m.talk.tag ? `<span class="chip kit">지시: ${TAG_LABEL[m.talk.tag]}</span> <span class="mute" style="font-size:12px">같은 종류를 고르면 성공률 +4%p</span>` : ""}</div></div>` : ""}
    ${fx.school ? `<div class="alert gold">🎓 오늘 ${esc(fx.school.name)}(${tierLabel(fx.school.tier)}) ${esc(fx.school.coach)}님이 직접 보러 오셨습니다. 상대는 고등학생이라 몸싸움이 버겁습니다.</div>` : ""}
    ${m.oppAce ? `<div class="alert">👀 주목할 상대: ${m.oppAce.pos} ${m.oppAce.number}번 ${esc(m.oppAce.name)} (${m.oppAce.grade}학년${m.oppAce.trait ? `, ${esc(m.oppAce.trait)}` : ""})</div>`
      : m.oppAceAbsent ? `<div class="alert">${esc(fillText("상대 에이스 {a|이/가} 오늘은 나오지 않습니다.", { a: m.oppAceAbsent }))}</div>` : ""}
    ${fx.jn ? `<div class="alert gold">🎽 전남 대표로 나선 전국소년체전 ${esc(fx.round)}. 도내 여러 학교에서 뽑힌 선수들과 함께 뜁니다. 감독은 김 감독님이 맡으셨습니다.</div>` : ""}
    ${fx.ko ? `<div class="alert gold">지면 탈락입니다. 비기면 승부차기.</div>` : ""}
    ${fx.elementary ? `<div class="alert gold">🧒 오늘은 초등학교 팀과의 연습경기. 이겨야 본전, 지면 한동안 놀림감이다.</div>` : ""}
    <div class="power"><span>우리 전력</span><div class="pw"><i style="width:${barPct(m.ours)}%"></i></div>
      <span>상대 전력</span><div class="pw them"><i style="width:${barPct(m.theirs)}%"></i></div></div>
    <div class="ctl-row"><button class="btn btn-ghost" data-skip>결과만 보기</button><button class="btn btn-kit" data-start>${m.status === "start" ? "킥오프" : "경기 지켜보기"}</button></div>
  </div>`;
  ctl.querySelector("[data-start]").addEventListener("click", () => { setScene("bg_stadium", "match"); sfx.play("kickoff"); controls(); tick(); });
  ctl.querySelector("[data-skip]").addEventListener("click", skipAll);

  function controls() {
    ctl.innerHTML = `<div class="ctl-row">
      <button class="btn btn-ghost" data-pause>일시정지</button>
      <button class="btn btn-ghost" data-speed>${speed === "fast" ? "보통 속도" : "빠르게"}</button>
      ${soOn ? "" : `<button class="btn" data-skip>결과만 보기</button>`}</div>`;
    ctl.querySelector("[data-pause]").addEventListener("click", e => {
      paused = !paused; e.target.textContent = paused ? "계속" : "일시정지";
      pitch.pause(paused);
      if (!paused && !after && !pend.length && pitch.clock() >= pitch.end() - 1e-6) tick();
    });
    ctl.querySelector("[data-speed]").addEventListener("click", e => {
      speed = speed === "normal" ? "fast" : "normal"; e.target.textContent = speed === "fast" ? "보통 속도" : "빠르게";
      pitch.setSpeed(speed);
    });
    ctl.querySelector("[data-skip]")?.addEventListener("click", skipAll);
  }

  function showMoment() {
    const pd = m.pending;
    shownMin = m.minute; updateBoard();
    ctl.innerHTML = `<div class="moment" role="group" aria-label="선택">
      <p class="mo-text"><span class="num">${pd.so ? "PK" : `${m.minute}'`}</span> ${esc(pd.text)}</p>
      <div class="mo-choices">${pd.choices.map((c, i) => `<button class="mo-btn" data-c="${i}">
        <span>${c.signature ? `<b class="sigb">★ 특기</b> ` : ""}${esc(c.label)}${c.follow ? ` <b class="follow">지시</b>` : ""}${c.timing ? ` <b class="tmark" title="타이밍 버튼">⏱</b>` : ""}</span><span class="lv ${c.level === "높음" ? "hi" : c.level === "보통" ? "mid" : "lo"}">${c.level}</span></button>`).join("")}</div>
      <button class="linkbtn" data-autopick>알아서 하기</button>
    </div>`;
    ctl.classList.add("ask");
    feed.scrollTop = feed.scrollHeight;               // 선택 창이 커지면 해설 칸이 줄어드니 최신 줄이 보이게
    buzz(60);
    const pickIt = (i, timing = null) => {
      if (!m.pending || m.done) return;                 // 그 사이 '결과만 보기'를 눌렀으면 무시
      ctl.classList.remove("ask");
      const r = resolve(state, m, i, timing);
      controls();
      feed.scrollTop = feed.scrollHeight;
      paused = false; pitch.pause(false);
      pend.push(...r.lines);
      tick();                                          // 선택 결과가 경기장에서 이어짐
    };
    const choose = i => {
      const kind = pd.choices[i].timing;
      if (!kind || app.settings.timing === false) return pickIt(i);
      timingGame(kind, i, res => pickIt(i, res));
    };
    ctl.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => choose(+b.dataset.c)));
    ctl.querySelector("[data-autopick]").addEventListener("click", () => { m.autoNext = true; pickIt(autoChoice(m)); });
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
    const t = m.htTalk;
    const startBtn = (extra = "") => {
      let left = 8;
      ctl.innerHTML = `${extra}<div class="ctl-row"><button class="btn btn-kit btn-wide" data-second>${m.subbedOff ? "후반 지켜보기" : "후반 시작"} <span class="mute" id="htc">(${left})</span></button></div>`;
      const go = () => { clearInterval(iv); root.querySelector(".ht-scene")?.remove(); controls(); paused = false; pitch.pause(false); tick(); };
      const iv = setInterval(() => { left--; const c = ctl.querySelector("#htc"); if (c) c.textContent = `(${left})`; if (left <= 0) go(); }, 1000);
      ctl.querySelector("[data-second]").addEventListener("click", go);
    };
    if (!t) return startBtn();
    // 라커룸: 감독님이 나를 따로 불러서 하는 말과 내 대답 (경기장 자리에 라커룸 그림)
    root.querySelector("#pitch").insertAdjacentHTML("beforeend", `<div class="ht-scene" aria-hidden="true"><img src="assets/img/ev_halftime.webp" data-name="ev_halftime" alt="" onerror="__bgFallback(this)"></div>`);
    const face = `<div class="talk-face">${img("npc_coach", "")}</div>`;
    ctl.innerHTML = `<div class="ht-talk ${t.mood}">
      <div class="ht-tag">${{ praise: "하프타임 · 칭찬", scold: "하프타임 · 쓴소리", calm: "하프타임 · 주문", off: "하프타임 · 교체" }[t.mood]}</div>
      <div class="talk">${face}<div><div class="talk-who">${esc(STAFF.coach)}</div><p>"${esc(t.text)}"</p></div></div>
      <div class="mo-choices">${t.choices.map((c, i) => `<button class="mo-btn" data-h="${i}"><span>${esc(c.label)}</span></button>`).join("")}</div>
    </div>`;
    ctl.classList.add("ask");
    buzz(40);
    ctl.querySelectorAll("[data-h]").forEach(b => b.addEventListener("click", () => {
      const r = applyHalftime(state, m, +b.dataset.h);
      ctl.classList.remove("ask");
      sfx.play(t.mood === "scold" || t.mood === "off" ? "half" : "good");
      const buff = m.htBuff ? `<span class="chip kit">후반 ${m.htBuff.tag ? `${TAG_LABEL[m.htBuff.tag]} 선택` : "모든 선택"} 성공률 +${Math.round(m.htBuff.bonus * 1000) / 10}%p</span>` : "";
      startBtn(`<div class="talk">${face}<div><div class="talk-who">${esc(STAFF.coach)}</div><p>"${esc(r?.reply || "")}"</p>${buff}</div></div>`);
    }));
    ctl.querySelector("[data-h]")?.focus({ preventScroll: true });
  }

  function skipAll() {
    finished = true; after = null;
    root.querySelector(".ht-scene")?.remove();
    setScene("bg_stadium", "match");
    ctl.classList.remove("ask");
    pend.forEach(addLine); pend = [];
    m.record = false;
    const before = m.feed.length;
    autoPlay(state, m, { untilShootout: true });
    const L2 = m.feed.slice(before);
    shown = m.score.slice();
    if (m.so && !m.done) {                              // 승부차기는 건너뛰지 않음: 그 앞까지만 넘기고 경기장에서 이어 봄
      const i = L2.findIndex(l => l.soStart);
      L2.slice(0, Math.max(0, i)).forEach(addLine);
      m.record = true; finished = false; paused = false;
      pitch.jump(frameNow(m.sim)); pitch.pause(false);
      pend.push(...L2.slice(Math.max(0, i)));
      controls(); updateBoard();
      after = "line";
      return;
    }
    L2.forEach(addLine);
    pitch.jump(frameNow(m.sim));
    end();
  }

  function end() {
    finished = true;
    const before = m.feed.length;
    const res = finishMatch(state, m);
    track("match", { state, m, res });
    m.feed.slice(before).forEach(addLine);
    shown = m.score.slice();
    updateBoard();
    const resCls = { 승: "W", 무: "D", 패: "L" }[res.result];
    const goals = m.goalsLog.map(g => `<li class="${g.team}">${g.minute}' ${esc(g.name)}${g.assist ? ` <span class="mute">(도움 ${esc(g.assist)})</span>` : ""}</li>`).join("");
    ctl.innerHTML = `<div class="postmatch">
      <div class="pm-head"><span class="badge-res ${resCls}">${res.result}</span>
        <span class="num">${fx.usName ? esc(fx.usName) : TEAM_NAME} ${res.gf} : ${res.ga} ${esc(res.opponent)}</span>
        ${res.shootout ? `<span class="mute">(승부차기 ${res.shootout.us}:${res.shootout.them})</span>` : ""}</div>
      ${goals ? `<ul class="pm-goals">${goals}</ul>` : ""}
      ${res.minutes > 0 ? `<div class="pm-rating">
          <div class="rt num ${res.rating >= 7.5 ? "hi" : res.rating >= 6.5 ? "mid" : "lo"}">${res.rating.toFixed(1)}</div>
          <div><div>${STATUS_LABEL[res.status]} ${res.minutes}분${res.goals ? `, ${res.goals}골` : ""}${res.assists ? `, ${res.assists}도움` : ""}</div>
          <div class="mute" style="font-size:13px">선택 ${m.my.decisions}번 중 ${m.my.successes}번 성공${res.mom ? ` <span class="chip kit">경기 최우수 선수</span>` : ""}${res.subbedOff ? ` <span class="chip">하프타임 교체</span>` : ""}</div></div>
        </div>` : `<p class="mute">${esc(res.reason || STATUS_LABEL[res.status])}</p>`}
      ${m.mom ? `<p class="pm-mom">🏅 경기 최우수 선수: ${m.mom.team === "them" ? `${esc(res.opponent)} ` : ""}<b>${esc(m.mom.name)}</b></p>` : ""}
      ${m.teamRatings?.length ? `<details class="pm-team"><summary>우리 팀 평점 보기</summary><ul>${m.teamRatings.map(t => `<li class="${t.me ? "me" : ""}">
        <span class="pos-tag ${t.pos === "GK" ? "" : t.pos}">${t.pos}</span><span class="num">${t.number}</span><span class="nm">${esc(t.name)}${t.name === m.mom?.name && m.mom.team === "us" ? " ★" : ""}</span>
        <b class="rt num ${t.r >= 7.5 ? "hi" : t.r >= 6.5 ? "mid" : "lo"}">${t.r.toFixed(1)}</b></li>`).join("")}</ul></details>` : ""}
      ${res.notes.length ? `<ul class="pm-notes">${res.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
      <p class="mute" style="font-size:13px;margin:0">감독님 면담과 경기 기록은 메시지함에 왔습니다.</p>
      <button class="btn btn-kit btn-wide" data-done>${fx.jn && state.jnCup?.alive && !p.condition.injury ? `다음 경기로 (${["1회전", "준결승", "결승"][state.jnCup.stage]})` : "이번 주 마무리"}</button>
    </div>`;
    ctl.querySelector("[data-done]").addEventListener("click", () => { ro?.disconnect(); removeEventListener("resize", fitPitch); pitch.destroy(); onDone(res); });
    ctl.querySelector("[data-done]").focus({ preventScroll: true });
  }
}
