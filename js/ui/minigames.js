// 훈련 미니게임 4종. 결과 등급에 따라 그 훈련의 능력치 상승량이 달라집니다.
//   S ×1.5 / A ×1.25 / B ×1.0 / C ×0.8   (건너뛰면 B)
// 능력치가 오르면 난이도 단계(LV.1~4)가 올라 더 빠르고 방해물이 많아집니다. 등급과 배율 기준은 그대로입니다.
import { openModal } from "./modals.js";

export const GRADES = { S: 1.5, A: 1.25, B: 1.0, C: 0.8 };
const STAT_FOR = { shooting: "tech.shoot", passing: "tech.pass", dribble: "tech.dribble", weight: "phys.strength" };
const INFO = {
  shooting: { title: "슈팅 훈련", tag: "SHOOTING DRILL", how: "조준점이 골문 위를 움직입니다. 골키퍼를 피해 구석을 노려 누르세요. 다섯 번 찹니다.", btn: "슈팅" },
  passing:  { title: "패스 훈련", tag: "PASSING DRILL", how: "동료 등번호를 1부터 6까지 순서대로 빠르게 누르세요. 흰 유니폼 상대를 누르면 끊깁니다.", btn: null },
  dribble:  { title: "드리블 훈련", tag: "DRIBBLE DRILL", how: "달려드는 수비를 왼쪽·오른쪽으로 피하세요. 12초 버티면 끝입니다. 방향키나 화면을 밀어서도 움직일 수 있습니다.", btn: null },
  weight:   { title: "웨이트 트레이닝", tag: "STRENGTH", how: "줄어드는 원이 주황 테두리에 닿는 순간 누르세요. 여섯 번 들어 올립니다.", btn: "들어 올리기" },
};
const ease = v => Math.max(0, Math.min(1, (v - 20) / 60));
export function statFor(kind) { return STAT_FOR[kind]; }

// 난이도 단계: 그 훈련의 능력치 45 / 60 / 75 에서 한 단계씩
export const levelOf = v => v >= 75 ? 4 : v >= 60 ? 3 : v >= 45 ? 2 : 1;
const LV_NAME = ["", "기본", "중급", "상급", "프로"];
const LV_NOTE = {
  shooting: ["", "", "조준점이 더 빨라졌습니다.", "골키퍼가 좌우로 움직입니다.", "골키퍼가 조준점을 따라붙습니다."],
  passing:  ["", "", "상대가 한 명 늘고 시간이 줄었습니다.", "상대 선수들이 패스 길로 움직입니다.", "상대가 더 많고, 시간이 더 짧습니다."],
  dribble:  ["", "", "수비가 더 빨리 달려옵니다.", "두 명이 한꺼번에 막아섭니다.", "더 빠르고, 더 자주 두 명이 막습니다."],
  weight:   ["", "", "원이 더 빨리 줄어듭니다.", "원이 줄어드는 속도가 매번 바뀝니다.", "판정 범위가 좁아졌습니다."],
};

// 공통 그래픽 조각
const SHIRT = (fill, stroke, num, numFill = "#fff") => `<path d="M-5 -4 L-2 -6 Q0 -4.6 2 -6 L5 -4 L6.5 -0.5 L4 0.6 L4 6 L-4 6 L-4 0.6 L-6.5 -0.5 Z" fill="${fill}" stroke="${stroke}" stroke-width=".6" stroke-linejoin="round"/>
  ${num != null ? `<text y="3.2" text-anchor="middle" class="mg-num" fill="${numFill}">${num}</text>` : ""}`;
const BALL = r => `<g class="mg-ball"><circle r="${r}" fill="#fff" stroke="#111" stroke-width="${r * 0.12}"/><path d="M0 ${-r * 0.42} L${r * 0.4} ${-r * 0.12} L${r * 0.25} ${r * 0.36} L${-r * 0.25} ${r * 0.36} L${-r * 0.4} ${-r * 0.12} Z" fill="#111"/></g>`;
const DEFS = `<defs>
  <linearGradient id="mgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081A"/><stop offset="1" stop-color="#18245E"/></linearGradient>
  <linearGradient id="mgTurf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F8A4C"/><stop offset="1" stop-color="#14663A"/></linearGradient>
  <pattern id="mgNet" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H3 M0 0 V3" stroke="rgba(255,255,255,.35)" stroke-width=".35"/></pattern>
  <pattern id="mgCrowd" width="4" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1.2" r=".7" fill="rgba(255,255,255,.18)"/><circle cx="3" cy="2.2" r=".6" fill="rgba(255,140,60,.22)"/></pattern>
  <radialGradient id="mgLight" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="rgba(255,255,255,.28)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
  <filter id="mgGlow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

export function playMinigame(kind, statValue, slotLabel) {
  return new Promise(resolve => {
    const info = INFO[kind];
    const lv = levelOf(statValue);
    let finished = false, stop = () => {};
    const html = `<div class="mg">
      <div class="mg-head"><span class="eyebrow">${info.tag}</span><h2>${info.title}</h2><span class="mg-lv lv${lv}">LV.${lv} ${LV_NAME[lv]}</span><span class="mute">${slotLabel}</span></div>
      <p class="sub">${info.how}${LV_NOTE[kind][lv] ? ` <b class="mg-lvnote">${LV_NOTE[kind][lv]}</b>` : ""}</p>
      <div class="mg-area k-${kind}" id="mga"></div>
      <div class="mg-status" id="mgs" aria-live="polite"></div>
      <div class="ctl-row" id="mgc"><button class="btn btn-ghost" data-skip>건너뛰기 (B등급)</button><button class="btn btn-kit" data-go>시작</button></div>
    </div>`;
    openModal(html, (el, close) => {
      const area = el.querySelector("#mga"), status = el.querySelector("#mgs"), ctl = el.querySelector("#mgc");
      PREVIEW[kind](area);
      const done = grade => {
        if (finished) return; finished = true; stop();
        const mult = GRADES[grade];
        area.insertAdjacentHTML("beforeend", `<div class="mg-result"><span class="mg-bigrade m${grade}">${grade}</span><span>훈련 효과 ×${mult}</span></div>`);
        status.textContent = "";
        ctl.innerHTML = `<button class="btn btn-kit btn-wide" data-ok>확인</button>`;
        ctl.querySelector("[data-ok]").addEventListener("click", () => { close(); resolve({ grade, mult }); });
        ctl.querySelector("[data-ok]").focus({ preventScroll: true });
      };
      ctl.querySelector("[data-skip]").addEventListener("click", () => { finished = true; stop(); close(); resolve({ grade: "B", mult: 1, skipped: true }); });
      ctl.querySelector("[data-go]").addEventListener("click", () => {
        ctl.innerHTML = info.btn ? `<button class="btn btn-kit btn-wide mg-act" data-act>${info.btn}</button>` : "";
        stop = GAMES[kind](area, status, ctl, ease(statValue), done, lv) || (() => {});
      });
    }, { dismissable: false });
  });
}

// 시작 전 미리보기 화면
const PREVIEW = {
  shooting: area => { area.innerHTML = shootScene(); },
  passing: area => { area.innerHTML = `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}${pitch()}<text x="50" y="33" class="mg-cap">준비되면 시작</text></svg>`; },
  dribble: area => { area.innerHTML = `<div class="mg-lanes"><div class="mg-turfscroll"></div><div class="mg-me"><svg viewBox="-8 -8 16 16">${SHIRT("#FF6B1A", "#fff", null)}</svg></div></div>`; },
  weight: area => { area.innerHTML = weightScene(); },
};

// ── 슈팅 ────────────────────────────
// 야간 경기장, 원근감 있는 골문, 움직이는 골키퍼. 좌표: 가로 160 × 세로 96
const GX0 = 30, GX1 = 130, GTOP = 20, GLINE = 62;   // 골대 안쪽 왼쪽·오른쪽, 크로스바, 골라인
function shootScene() {
  const crowd = Array.from({ length: 3 }, (_, row) => Array.from({ length: 44 }, (_, i) => {
    const x = i * 3.7 + (row % 2) * 1.8 + 1, y = 14 + row * 6.2, c = ["#2A3470", "#3A4580", "#FF6B1A", "#F4F6FF", "#1F2A66", "#FFB23F"][(i * 7 + row * 3) % 6];
    return `<circle cx="${x}" cy="${y}" r="1.35" fill="${c}" opacity="${0.35 + ((i * 13 + row) % 5) * 0.1}"/><rect x="${x - 1.5}" y="${y + 1.2}" width="3" height="2.6" rx="1" fill="${c}" opacity=".35"/>`;
  }).join("")).join("");
  const stripes = [[40, 45], [45, 51], [51, 58], [58, 66], [66, 76], [76, 88], [88, 96]]
    .map(([y0, y1], i) => `<rect x="0" y="${y0}" width="160" height="${y1 - y0}" fill="${i % 2 ? "#1A7A43" : "#1E8A4C"}"/>`).join("");
  return `<svg viewBox="0 0 160 96" class="mg-svg mg-shoot">
    <defs>
      <linearGradient id="shSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050F"/><stop offset=".6" stop-color="#101A48"/><stop offset="1" stop-color="#1A2766"/></linearGradient>
      <radialGradient id="shFlood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6DA"/><stop offset=".25" stop-color="rgba(255,240,200,.55)"/><stop offset="1" stop-color="rgba(255,240,200,0)"/></radialGradient>
      <linearGradient id="shBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,244,210,.16)"/><stop offset="1" stop-color="rgba(255,244,210,0)"/></linearGradient>
      <linearGradient id="shPost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9D1DE"/><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#AEB8CC"/></linearGradient>
      <pattern id="shNet" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><path d="M0 0 L3.2 3.2 M3.2 0 L0 3.2" stroke="rgba(255,255,255,.28)" stroke-width=".28"/></pattern>
      <radialGradient id="shVig" cx=".5" cy=".55" r=".75"><stop offset=".6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.55)"/></radialGradient>
      <filter id="shGlow"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shSoft"><feGaussianBlur stdDeviation=".6"/></filter>
    </defs>
    <rect width="160" height="96" fill="url(#shSky)"/>
    <!-- 조명탑 -->
    <path d="M14 4 L-10 60 L46 60 Z" fill="url(#shBeam)"/><path d="M146 4 L114 60 L170 60 Z" fill="url(#shBeam)"/>
    <circle cx="14" cy="5" r="11" fill="url(#shFlood)"/><circle cx="146" cy="5" r="11" fill="url(#shFlood)"/>
    <g fill="#FFF8E6"><rect x="9" y="2.5" width="10" height="4" rx=".8"/><rect x="141" y="2.5" width="10" height="4" rx=".8"/></g>
    <!-- 관중석 -->
    <path d="M0 11 H160 V34 H0 Z" fill="#0B1236"/>
    <g>${crowd}</g>
    <path d="M0 11 H160" stroke="rgba(255,255,255,.08)"/>
    <g fill="#FF6B1A" opacity=".85"><path d="M22 12 l5 1.6 -5 1.6 z"/><path d="M71 12 l5 1.6 -5 1.6 z"/><path d="M118 12 l5 1.6 -5 1.6 z"/></g>
    <!-- 광고판 -->
    <rect x="0" y="34" width="160" height="6" fill="#0A0F2A"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 20 + 1}" y="35" width="18" height="4" rx=".6" fill="${i % 2 ? "#18245E" : "#1F2C8F"}"/><rect x="${i * 20 + 3}" y="36.6" width="${6 + (i % 3) * 3}" height=".9" fill="${i % 3 ? "#FFB23F" : "#FF6B1A"}" opacity=".8"/>`).join("")}
    <!-- 잔디 -->
    ${stripes}
    <g fill="none" stroke="rgba(255,255,255,.75)" stroke-width=".55">
      <path d="M0 ${GLINE} H160"/>
      <path d="M20 ${GLINE} L12 72 H148 L140 ${GLINE}"/>
      <path d="M2 ${GLINE} L-14 92"/><path d="M158 ${GLINE} L174 92"/>
    </g>
    <ellipse cx="80" cy="84" rx="1.2" ry=".5" fill="#fff" opacity=".8"/>
    <!-- 골문: 뒷그물, 옆그물, 지붕 그물 -->
    <g id="shNetG">
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} H${GX0 + 6} Z" fill="url(#shNet)"/>
      <path d="M${GX0} ${GTOP} L${GX0 + 6} ${GTOP + 7} V${GLINE - 6} L${GX0} ${GLINE} Z" fill="url(#shNet)" opacity=".8"/>
      <path d="M${GX1} ${GTOP} L${GX1 - 6} ${GTOP + 7} V${GLINE - 6} L${GX1} ${GLINE} Z" fill="url(#shNet)" opacity=".8"/>
      <path d="M${GX0} ${GTOP} H${GX1} L${GX1 - 6} ${GTOP + 7} H${GX0 + 6} Z" fill="url(#shNet)" opacity=".7"/>
      <path d="M${GX0 + 6} ${GLINE - 6} H${GX1 - 6} L${GX1} ${GLINE} H${GX0} Z" fill="rgba(0,0,0,.18)"/>
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} M${GX0 + 6} ${GTOP + 7} V${GLINE - 6}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".5"/>
    </g>
    <!-- 골대 -->
    <path d="M${GX0} ${GLINE + .6} V${GTOP} H${GX1} V${GLINE + .6}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3.2" transform="translate(.8,.8)"/>
    <path d="M${GX0} ${GLINE + .6} V${GTOP} H${GX1} V${GLINE + .6}" fill="none" stroke="url(#shPost)" stroke-width="2.6" stroke-linejoin="round"/>
    <!-- 골키퍼 -->
    <g transform="translate(0,${GLINE})"><g id="gk" class="mg-gkmove" style="transform:translateX(80px)"><g class="mg-keeper">
      <ellipse cx="0" cy=".6" rx="9" ry="1.6" fill="rgba(0,0,0,.35)" filter="url(#shSoft)"/>
      <path d="M-4.4 -11 L-5 -.6 H-2 L-1 -9 Z" fill="#14181F"/><path d="M4.4 -11 L5 -.6 H2 L1 -9 Z" fill="#14181F"/>
      <rect x="-5.2" y="-4.2" width="3.4" height="3.6" rx=".6" fill="#C6F432"/><rect x="1.8" y="-4.2" width="3.4" height="3.6" rx=".6" fill="#C6F432"/>
      <rect x="-5.6" y="-1" width="4" height="1.4" rx=".6" fill="#0D0F14"/><rect x="1.6" y="-1" width="4" height="1.4" rx=".6" fill="#0D0F14"/>
      <path d="M-5 -12 H5 L4.6 -9.6 H-4.6 Z" fill="#14181F"/>
      <path d="M-6 -24 Q0 -26 6 -24 L5.6 -11.6 H-5.6 Z" fill="#C6F432" stroke="#8FB31E" stroke-width=".4"/>
      <path d="M-6 -24 L-14 -27 L-15 -24.6 L-6.4 -20.4 Z" fill="#C6F432" stroke="#8FB31E" stroke-width=".4"/>
      <path d="M6 -24 L14 -27 L15 -24.6 L6.4 -20.4 Z" fill="#C6F432" stroke="#8FB31E" stroke-width=".4"/>
      <circle cx="-15.6" cy="-26.6" r="2.3" fill="#F4F6FF" stroke="#FF6B1A" stroke-width=".7"/><circle cx="15.6" cy="-26.6" r="2.3" fill="#F4F6FF" stroke="#FF6B1A" stroke-width=".7"/>
      <text y="-15.4" text-anchor="middle" font-size="5.2" font-weight="800" fill="#14181F" font-family="Barlow Condensed, sans-serif">1</text>
      <rect x="-1.4" y="-26.6" width="2.8" height="2.4" fill="#E2B48A"/>
      <circle cy="-29.6" r="3.6" fill="#F2C49B"/><path d="M-3.7 -30.4 Q-3.4 -34.4 0 -34 Q3.6 -34.4 3.7 -30.4 Q2 -32 0 -31.8 Q-2 -32 -3.7 -30.4 Z" fill="#1B1B1F"/>
    </g></g></g>
    <!-- 남은 공 자국 -->
    <g id="balls"></g>
    <!-- 조준점 -->
    <g id="aim" transform="translate(80,40)" filter="url(#shGlow)">
      <circle r="4.6" fill="rgba(255,201,60,.12)" stroke="#FFC93C" stroke-width=".7"/>
      <circle r="1" fill="#FFC93C"/>
      <path d="M-7.4 0 H-5.4 M5.4 0 H7.4 M0 -7.4 V-5.4 M0 5.4 V7.4" stroke="#FFC93C" stroke-width=".8" stroke-linecap="round"/>
      <circle r="6.4" fill="none" stroke="rgba(255,201,60,.45)" stroke-width=".35" stroke-dasharray="2 2.2" class="mg-aimspin"/>
    </g>
    <!-- 공 -->
    <ellipse id="sshadow" cx="80" cy="88.2" rx="3.4" ry="1" fill="rgba(0,0,0,.4)" filter="url(#shSoft)"/>
    <g transform="translate(80,85.6)"><g id="sball">${BALL(2.9)}</g></g>
    <text id="shMsg" x="80" y="52" text-anchor="middle" class="mg-shmsg"></text>
    <rect width="160" height="96" fill="url(#shVig)" pointer-events="none"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(5)}</span><span id="pts" class="num">0점</span></div>`;
}
function shooting(area, status, ctl, e, done, lv = 1) {
  area.innerHTML = shootScene();
  const aim = area.querySelector("#aim"), gk = area.querySelector("#gk"), keeper = gk.querySelector(".mg-keeper"), ball = area.querySelector("#sball"),
    shadow = area.querySelector("#sshadow"), net = area.querySelector("#shNetG"), msg = area.querySelector("#shMsg"),
    dots = area.querySelectorAll("#dots i"), pts = area.querySelector("#pts");
  const period = (1500 - e * 650) * [1, 1, 0.86, 0.76, 0.68][lv];   // 단계가 오를수록 조준점이 빨라짐
  const gkW = (26 - e * 8) * 1.32;                                    // 골키퍼가 막는 폭 (가로 160 기준)
  const MID = (GX0 + GX1) / 2, HALF = (GX1 - GX0) / 2 - 4;
  let shot = 0, score = 0, x = MID, y = 40, t0 = performance.now(), raf, lock = false, gkC = MID, gkBase = MID, gkPh = Math.random() * 6;
  const setGk = (c, smooth) => { gkC = c; gk.style.transition = smooth ? "" : "none"; gk.style.transform = `translateX(${c}px)`; };
  const placeGk = () => { gkBase = MID - 28 + Math.random() * 56; setGk(gkBase, true); };
  gk.style.transform = `translateX(${MID}px)`;
  placeGk();
  const loop = now => {
    const t = (now - t0) / period;
    if (!lock) {                                  // 찬 뒤에는 조준점이 그 자리에 멈춤
      x = MID + Math.sin(t * Math.PI * 2) * HALF; y = (GTOP + GLINE) / 2 + 1 + Math.sin(t * Math.PI * 3.1) * 15;
      aim.setAttribute("transform", `translate(${x.toFixed(2)},${y.toFixed(2)})`);
    }
    if (!lock && lv >= 3) {
      let c = gkBase + Math.sin(now / (lv >= 4 ? 520 : 700) + gkPh) * (lv >= 4 ? 14 : 18);   // LV.3 좌우로 움직임
      if (lv >= 4) c += (x - c) * 0.22;                                                      // LV.4 조준점 쪽으로 따라붙음
      setGk(Math.max(GX0 + 8, Math.min(GX1 - 8, c)), false);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const fire = () => {
    if (lock) return; lock = true;
    const saved = Math.abs(x - gkC) <= gkW / 2 && y > GTOP + 4;
    const corner = x < GX0 + 24 || x > GX1 - 24;
    const p = saved ? 0 : corner ? 2 : 1;
    score += p;
    // 공이 날아가며 작아지고, 골키퍼가 몸을 날림
    ball.style.transition = "transform .36s cubic-bezier(.15,.7,.3,1)";
    ball.style.transform = `translate(${x - 80}px, ${y - 85.6}px) scale(.55) rotate(540deg)`;
    shadow.style.transition = "transform .36s cubic-bezier(.15,.7,.3,1), opacity .36s";
    shadow.style.transform = `translate(${(x - 80) * 0.9}px, ${GLINE - 88}px) scale(.5)`; shadow.style.opacity = ".4";
    // 막을 때는 공 쪽으로 정확히, 먹힐 때는 한 박자 늦게 짧게 몸을 날림
    const dx = Math.max(-26, Math.min(26, (x - gkC) * (saved ? 1 : 0.45)));
    const high = Math.max(0, Math.min(1, (GLINE - y - 10) / 26));          // 높은 공일수록 위로 뜀
    const rot = Math.max(-75, Math.min(75, dx * (2 + high * 1.5)));
    keeper.style.transform = `translate(${dx * 0.7}px, ${-high * 8}px) rotate(${rot}deg)`;
    const d = dots[shot]; d.className = saved ? "miss" : corner ? "top" : "hit";
    shot++;
    pts.textContent = `${score}점`;
    status.innerHTML = `<b class="${saved ? "down" : "up"}">${saved ? "막혔다!" : corner ? "구석! +2" : "골! +1"}</b>`;
    setTimeout(() => {
      msg.textContent = saved ? "SAVE" : "GOAL";
      msg.setAttribute("class", `mg-shmsg show ${saved ? "save" : "goal"}`);
      if (!saved) { net.classList.remove("ripple"); void net.getBoundingClientRect(); net.classList.add("ripple"); }
    }, 300);
    setTimeout(() => {
      area.querySelector("#balls").insertAdjacentHTML("beforeend", `<g transform="translate(${x},${y}) scale(.42)" opacity="${saved ? .35 : .7}">${BALL(2.9)}</g>`);
      ball.style.transition = "none"; ball.style.transform = "";
      shadow.style.transition = "none"; shadow.style.transform = ""; shadow.style.opacity = "";
      keeper.style.transform = "";
      msg.setAttribute("class", "mg-shmsg");
      if (shot >= 5) return done(score >= 8 ? "S" : score >= 6 ? "A" : score >= 4 ? "B" : "C");
      placeGk(); lock = false;
    }, 900);
  };
  ctl.querySelector("[data-act]").addEventListener("click", fire);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); fire(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 패스 ────────────────────────────
function pitch() {
  return `<rect width="100" height="60" fill="url(#mgTurf)"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 16.7}" width="8.35" height="60" fill="rgba(255,255,255,.035)"/>`).join("")}
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".4"><rect x="2" y="2" width="96" height="56"/><path d="M50 2 V58"/><circle cx="50" cy="30" r="8"/><rect x="2" y="17" width="12" height="26"/><rect x="86" y="17" width="12" height="26"/></g>`;
}
function passing(area, status, ctl, e, done, lv = 1) {
  const limit = (6 + e * 3) * [1, 1, 0.92, 0.86, 0.8][lv];   // 단계가 오를수록 시간이 줄어듦
  const foesN = [0, 2, 3, 4, 5][lv];                          // 상대 수
  const spots = [];
  const far = (x, y) => spots.every(s => Math.hypot(s.x - x, s.y - y) > (lv >= 4 ? 13 : 15));
  while (spots.length < 6 + foesN) { const x = 9 + Math.random() * 82, y = 10 + Math.random() * 40; if (far(x, y)) spots.push({ x, y }); }
  area.innerHTML = `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}${pitch()}
    <g id="lines"></g>
    ${spots.map((s, i) => [s, i]).sort((a, b) => (a[1] < 6) - (b[1] < 6)).map(([s, i]) => i < 6
      ? `<g class="mg-mate" data-n="${i + 1}" transform="translate(${s.x},${s.y}) scale(1.15)"><circle r="7.5" fill="transparent"/>${SHIRT("#FF6B1A", "#fff", i + 1)}</g>`
      : `<g class="mg-foe" data-foe data-i="${i}" transform="translate(${s.x},${s.y}) scale(1.1)"><circle r="7" fill="transparent"/>${SHIRT("#F4F6FF", "#2D3FD1", null)}</g>`).join("")}
    <g id="pball" transform="translate(50,30)">${BALL(1.6)}</g>
  </svg>
  <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="nx" class="num">다음 1</span></div>`;
  const lines = area.querySelector("#lines"), pball = area.querySelector("#pball"), tbar = area.querySelector("#tbar"), nx = area.querySelector("#nx");
  let nextN = 1, mistakes = 0, start = performance.now(), timer, last = { x: 50, y: 30 };
  const foeEls = [...area.querySelectorAll("[data-foe]")];
  const tick = () => {
    if (lv >= 3) foeEls.forEach((g, k) => {          // LV.3부터 상대가 패스 길로 움직임
      const s0 = spots[+g.dataset.i], t = (performance.now() - start) / 1000;
      g.setAttribute("transform", `translate(${(s0.x + Math.sin(t * 1.7 + k) * 7).toFixed(2)},${(s0.y + Math.cos(t * 1.3 + k * 2) * 5).toFixed(2)}) scale(1.1)`);
    });
    const left = limit - (performance.now() - start) / 1000;
    tbar.style.width = `${Math.max(0, left / limit) * 100}%`;
    tbar.className = left < limit * 0.3 ? "low" : "";
    status.textContent = mistakes ? `실수 ${mistakes}` : "";
    if (left <= 0) return finish();
    timer = requestAnimationFrame(tick);
  };
  const finish = () => {
    cancelAnimationFrame(timer);
    const used = (performance.now() - start) / 1000, made = nextN - 1;
    done(made === 6 && mistakes === 0 && used < limit * 0.65 ? "S" : made === 6 && mistakes <= 1 ? "A" : made >= 4 ? "B" : "C");
  };
  area.querySelectorAll("[data-n]").forEach(g => g.addEventListener("pointerdown", () => {
    const s = spots[+g.dataset.n - 1];
    if (+g.dataset.n === nextN) {
      g.classList.add("ok");
      lines.insertAdjacentHTML("beforeend", `<line x1="${last.x}" y1="${last.y}" x2="${s.x}" y2="${s.y}" class="mg-pass"/>`);
      pball.setAttribute("transform", `translate(${s.x + 3},${s.y + 5})`);
      last = s; nextN++; nx.textContent = nextN <= 6 ? `다음 ${nextN}` : "완료";
      if (nextN > 6) finish();
    } else if (!g.classList.contains("ok")) { mistakes++; g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 260); }
  }));
  area.querySelectorAll("[data-foe]").forEach(g => g.addEventListener("pointerdown", () => { mistakes += 2; g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 260); }));
  timer = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(timer);
}

// ── 드리블 ──────────────────────────
function dribble(area, status, ctl, e, done, lv = 1) {
  const DURATION = 12000;
  const speed = (34 - e * 10) * [1, 1, 1.18, 1.3, 1.42][lv];   // 단계가 오를수록 수비가 빨라짐
  const gapMs = (820 - e * 220) * [1, 1, 0.9, 0.95, 0.88][lv];
  const pairP = [0, 0, 0, 0.3, 0.45][lv];                       // LV.3부터 두 명이 한꺼번에 막음
  area.innerHTML = `<div class="mg-lanes" id="lanes"><div class="mg-turfscroll"></div>
      <div class="mg-me" id="me"><svg viewBox="-8 -8 16 16">${SHIRT("#FF6B1A", "#fff", null)}</svg><svg class="mg-dball" viewBox="-3 -3 6 6">${BALL(2.4)}</svg></div></div>
    <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="hits" class="num">부딪힘 0</span></div>`;
  ctl.innerHTML = `<button class="btn mg-dir" data-l>◀ 왼쪽</button><button class="btn mg-dir" data-r>오른쪽 ▶</button>`;
  const lanes = area.querySelector("#lanes"), me = area.querySelector("#me"), tbar = area.querySelector("#tbar"), hitsEl = area.querySelector("#hits");
  let lane = 1, hits = 0, foes = [], start = performance.now(), last = start, spawnAt = start + 400, raf;
  const setLane = n => { lane = Math.max(0, Math.min(2, n)); me.style.left = `${lane * 33.33 + 16.66}%`; };
  setLane(1);
  ctl.querySelector("[data-l]").addEventListener("pointerdown", () => setLane(lane - 1));
  ctl.querySelector("[data-r]").addEventListener("pointerdown", () => setLane(lane + 1));
  const key = ev => { if (ev.key === "ArrowLeft") setLane(lane - 1); if (ev.key === "ArrowRight") setLane(lane + 1); };
  document.addEventListener("keydown", key);
  let sx = null;
  lanes.addEventListener("pointerdown", ev => { sx = ev.clientX; });
  lanes.addEventListener("pointerup", ev => { if (sx != null && Math.abs(ev.clientX - sx) > 30) setLane(lane + (ev.clientX > sx ? 1 : -1)); sx = null; });
  const loop = now => {
    const dt = (now - last) / 1000; last = now;
    if (now >= spawnAt) {
      const first = Math.floor(Math.random() * 3);
      const ls = Math.random() < pairP ? [first, (first + 1 + Math.floor(Math.random() * 2)) % 3] : [first];
      for (const l of ls) {
        const el = document.createElement("div"); el.className = "mg-foe-d";
        el.innerHTML = ls.length === 1 && Math.random() < 0.25 ? `<svg viewBox="-6 -6 12 12"><path d="M0 -5 L4 5 H-4 Z" fill="#FF8A1F" stroke="#fff" stroke-width=".6"/><rect x="-3" y="1" width="6" height="1.2" fill="#fff"/></svg>`
          : `<svg viewBox="-8 -8 16 16">${SHIRT("#F4F6FF", "#2D3FD1", null)}</svg>`;
        el.style.left = `${l * 33.33 + 16.66}%`; lanes.appendChild(el);
        foes.push({ el, l, y: -10, hit: false });
      }
      spawnAt = now + gapMs * (ls.length > 1 ? 1.25 : 1) * (0.7 + Math.random() * 0.6);
    }
    for (const f of foes) {
      f.y += speed * dt * 3;
      f.el.style.top = `${f.y}%`;
      if (!f.hit && f.y > 74 && f.y < 92 && f.l === lane) { f.hit = true; hits++; f.el.classList.add("hit"); lanes.classList.add("shake"); setTimeout(() => lanes.classList.remove("shake"), 200); hitsEl.textContent = `부딪힘 ${hits}`; }
    }
    foes = foes.filter(f => { if (f.y > 110) { f.el.remove(); return false; } return true; });
    const left = (DURATION - (now - start)) / 1000;
    tbar.style.width = `${Math.max(0, left / 12) * 100}%`;
    if (left <= 0) return done(hits === 0 ? "S" : hits === 1 ? "A" : hits <= 3 ? "B" : "C");
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 웨이트 ──────────────────────────
function weightScene() {
  return `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}
    <rect width="100" height="60" fill="#121A44"/>
    <rect width="100" height="60" fill="url(#mgLight)"/>
    <rect y="48" width="100" height="12" fill="#0A0F2A"/><path d="M0 48 H100" stroke="rgba(255,255,255,.12)"/>
    <g transform="translate(50,30)"><g id="bar" class="mg-bar">
      <rect x="-34" y="-.9" width="68" height="1.8" rx=".9" fill="#C9D1DE"/>
      <rect x="-31" y="-8" width="4" height="16" rx="1" fill="#1B1F2E" stroke="#3B4466"/><rect x="-27" y="-6" width="3" height="12" rx="1" fill="#FF6B1A"/>
      <rect x="27" y="-8" width="4" height="16" rx="1" fill="#1B1F2E" stroke="#3B4466"/><rect x="24" y="-6" width="3" height="12" rx="1" fill="#FF6B1A"/>
    </g></g>
    <circle cx="50" cy="30" r="10" class="mg-target"/>
    <circle id="ring" cx="50" cy="30" r="26" class="mg-ring"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(6)}</span><span id="pts" class="num">0점</span></div>`;
}
function weight(area, status, ctl, e, done, lv = 1) {
  area.innerHTML = weightScene();
  const ring = area.querySelector("#ring"), bar = area.querySelector("#bar"), dots = area.querySelectorAll("#dots i"), ptsEl = area.querySelector("#pts");
  const baseDur = (1300 + e * 300) * [1, 1, 0.85, 0.8, 0.72][lv];   // 단계가 오를수록 원이 빨리 줄어듦
  const tol = (1.6 + e * 1.4) * (lv >= 4 ? 0.8 : 1);                // LV.4 판정 범위 좁아짐
  let dur = baseDur;
  const nextDur = () => { dur = lv >= 3 ? baseDur * (0.75 + Math.random() * 0.5) : baseDur; };   // LV.3부터 속도가 매번 바뀜
  let rep = 0, score = 0, t0 = performance.now(), raf, lock = false;
  const loop = now => {
    const k = ((now - t0) % dur) / dur;
    ring.setAttribute("r", (26 - k * 22).toFixed(2));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const lift = () => {
    if (lock) return; lock = true;
    const r = +ring.getAttribute("r"), err = Math.abs(r - 10);
    const pts = err <= tol ? 2 : err <= tol * 2.2 ? 1 : 0;
    score += pts;
    dots[rep].className = pts === 2 ? "top" : pts === 1 ? "hit" : "miss";
    rep++;
    ptsEl.textContent = `${score}점`;
    status.innerHTML = `<b class="${pts ? "up" : "down"}">${pts === 2 ? "완벽!" : pts === 1 ? "좋아" : "자세가 무너졌다"}</b>`;
    ring.classList.add(pts === 2 ? "perfect" : pts === 1 ? "good" : "miss");
    bar.classList.add(pts ? "up" : "shake");
    setTimeout(() => {
      ring.classList.remove("perfect", "good", "miss"); bar.classList.remove("up", "shake");
      if (rep >= 6) return done(score >= 10 ? "S" : score >= 7 ? "A" : score >= 4 ? "B" : "C");
      t0 = performance.now(); nextDur(); lock = false;
    }, 480);
  };
  ctl.querySelector("[data-act]").addEventListener("click", lift);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); lift(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

const GAMES = { shooting, passing, dribble, weight };
