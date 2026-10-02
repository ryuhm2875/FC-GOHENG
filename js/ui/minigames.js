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

export function playMinigame(kind, statValue, slotLabel) {
  return new Promise(resolve => {
    const info = INFO[kind];
    const lv = levelOf(statValue);
    // 세로로 긴 휴대폰 화면: 창을 화면 가득 띄우고 장면도 세로형으로 그림
    const tall = innerHeight / innerWidth > 1.3 && innerWidth < 700;
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
      const mg = el.querySelector(".mg");
      // 남은 높이에 맞춰 장면 크기를 정함 (가로·세로 비율은 그대로)
      const fit = () => {
        if (!tall || !area.isConnected) return;
        const svg = area.querySelector("svg"); if (!svg) return;
        const vb = svg.viewBox.baseVal, ar = vb.width / vb.height;
        // 장면을 뺀 나머지(제목·설명·상태·버튼) 높이를 직접 더해서 남는 높이를 구함
        const others = [...mg.children].filter(c => c !== area).reduce((t, c) => {
          const cs = getComputedStyle(c); return t + c.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
        }, 0);
        const availH = mg.clientHeight - others - 14;
        const availW = mg.clientWidth;
        const h = Math.max(160, Math.min(availH, availW / ar));
        area.style.width = `${Math.floor(h * ar)}px`;
      };
      addEventListener("resize", fit);
      const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => fit()) : null;
      ro?.observe(ctl);
      PREVIEW[kind](area, tall);
      requestAnimationFrame(fit);
      const prevStop = () => { removeEventListener("resize", fit); ro?.disconnect(); };
      const done = grade => {
        if (finished) return; finished = true; stop();
        const mult = GRADES[grade];
        area.insertAdjacentHTML("beforeend", `<div class="mg-result"><span class="mg-bigrade m${grade}">${grade}</span><span>훈련 효과 ×${mult}</span></div>`);
        status.textContent = "";
        ctl.innerHTML = `<button class="btn btn-kit btn-wide" data-ok>확인</button>`;
        fit(); prevStop();                                   // 확인 버튼이 생긴 만큼 장면 크기를 다시 맞춤
        ctl.querySelector("[data-ok]").addEventListener("click", () => { close(); resolve({ grade, mult }); });
        ctl.querySelector("[data-ok]").focus({ preventScroll: true });
      };
      ctl.querySelector("[data-skip]").addEventListener("click", () => { finished = true; stop(); prevStop(); close(); resolve({ grade: "B", mult: 1, skipped: true }); });
      ctl.querySelector("[data-go]").addEventListener("click", () => {
        ctl.innerHTML = info.btn ? `<button class="btn btn-kit btn-wide mg-act" data-act>${info.btn}</button>` : "";
        stop = GAMES[kind](area, status, ctl, ease(statValue), done, lv, tall) || (() => {});
        requestAnimationFrame(fit);
      });
    }, { dismissable: false, cls: tall ? "mg-modal mg-tall" : "mg-modal" });
  });
}

// 시작 전 미리보기 화면
const PREVIEW = {
  shooting: (area, tall) => { area.innerHTML = shootScene(tall); },
  passing: (area, tall) => {
    const demo = [{ x: 40, y: 30 }, { x: 74, y: 22 }, { x: 116, y: 34 }, { x: 54, y: 66 }, { x: 96, y: 70 }, { x: 132, y: 62 }, { x: 80, y: 74 }];
    area.innerHTML = passScene(demo, 6, tall).replace(/<\/svg>/, `<text x="${tall ? 48 : 80}" y="${tall ? 84 : 54}" class="mg-cap mgp-cap">준비되면 시작</text></svg>`);
  },
  dribble: (area, tall) => { area.innerHTML = `<div class="mgd-wrap">${dribbleScene(tall)}</div>`; },
  weight: (area, tall) => { area.innerHTML = weightScene(tall); wtDraw(area.querySelector("svg"), 1); },
};

// ── 슈팅 ────────────────────────────
// 야간 경기장, 원근감 있는 골문, 움직이는 골키퍼. 좌표: 가로 160 × 세로 96
const GX0 = 30, GX1 = 130, GTOP = 20, GLINE = 62;   // 골대 안쪽 왼쪽·오른쪽, 크로스바, 골라인
// tall: 세로 휴대폰에서는 좌우를 조금 잘라 내고 위(관중석 위층)와 아래(잔디)를 늘려 크게 보여 줌
function shootScene(tall = false) {
  const rowsY = tall ? [-28, -21.8, -15.6, -9.4, 14, 20.2, 26.4] : [14, 20.2, 26.4];
  const crowd = rowsY.map((y, row) => Array.from({ length: 44 }, (_, i) => {
    const x = i * 3.7 + (row % 2) * 1.8 + 1, c = ["#2A3470", "#3A4580", "#FF6B1A", "#F4F6FF", "#1F2A66", "#FFB23F"][(i * 7 + row * 3) % 6];
    return `<circle cx="${x}" cy="${y}" r="1.35" fill="${c}" opacity="${0.35 + ((i * 13 + row) % 5) * 0.1}"/><rect x="${x - 1.5}" y="${y + 1.2}" width="3" height="2.6" rx="1" fill="${c}" opacity=".35"/>`;
  }).join("")).join("");
  const stripes = [[40, 45], [45, 51], [51, 58], [58, 66], [66, 76], [76, 88], [88, 96], ...(tall ? [[96, 106], [106, 120]] : [])]
    .map(([y0, y1], i) => `<rect x="0" y="${y0}" width="160" height="${y1 - y0}" fill="${i % 2 ? "#1A7A43" : "#1E8A4C"}"/>`).join("");
  return `<svg viewBox="${tall ? "20 -40 120 160" : "0 0 160 96"}" class="mg-svg mg-shoot">
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
    <rect y="${tall ? -40 : 0}" width="160" height="${tall ? 160 : 96}" fill="url(#shSky)"/>
    ${tall ? `<path d="M0 -32 H160 V-4 H0 Z" fill="#0A1030"/><rect x="0" y="-4" width="160" height="2" fill="#FF6B1A" opacity=".7"/>` : ""}
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
    <rect y="${tall ? -40 : 0}" width="160" height="${tall ? 160 : 96}" fill="url(#shVig)" pointer-events="none"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(5)}</span><span id="pts" class="num">0점</span></div>`;
}
function shooting(area, status, ctl, e, done, lv = 1, tall = false) {
  area.innerHTML = shootScene(tall);
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
// 야간 경기장을 위에서 본 화면. 판정은 누른 순간에 끝나고, 공은 그 뒤를 따라 실제로 굴러가거나 떠서 날아감
// 좌표: 가로 160 × 세로 96
function passPitch() {
  const stripes = Array.from({ length: 10 }, (_, i) => `<rect x="${i * 16}" y="0" width="16" height="96" fill="${i % 2 ? "#1B7F45" : "#1F8E4E"}"/>`).join("");
  return `<defs>
      <radialGradient id="psFlood" cx=".5" cy=".42" r=".72"><stop offset="0" stop-color="rgba(255,250,225,.18)"/><stop offset="1" stop-color="rgba(255,250,225,0)"/></radialGradient>
      <radialGradient id="psVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.55)"/></radialGradient>
      <filter id="psSoft"><feGaussianBlur stdDeviation=".7"/></filter>
    </defs>
    ${stripes}
    <rect width="160" height="96" fill="url(#psFlood)"/>
    <g fill="none" stroke="rgba(255,255,255,.62)" stroke-width=".55">
      <rect x="3" y="3" width="154" height="90"/><path d="M80 3 V93"/><circle cx="80" cy="48" r="13"/>
      <rect x="3" y="26" width="20" height="44"/><rect x="137" y="26" width="20" height="44"/>
      <rect x="3" y="37" width="7" height="22"/><rect x="150" y="37" width="7" height="22"/>
      <path d="M23 41 A8 8 0 0 1 23 55"/><path d="M137 41 A8 8 0 0 0 137 55"/>
      <path d="M3 6 A3 3 0 0 0 6 3 M154 3 A3 3 0 0 0 157 6 M3 90 A3 3 0 0 1 6 93 M154 93 A3 3 0 0 1 157 90"/>
    </g>
    <circle cx="80" cy="48" r=".9" fill="rgba(255,255,255,.7)"/>
    <g fill="rgba(255,255,255,.85)"><rect x=".4" y="43" width="2.4" height="10" rx=".4"/><rect x="157.2" y="43" width="2.4" height="10" rx=".4"/></g>
    <g fill="#FF6B1A"><path d="M3 3 v-3 l2.4 1 z"/><path d="M157 3 v-3 l-2.4 1 z"/></g>`;
}
// 위에서 살짝 비스듬히 본 선수 (발밑 그림자, 반바지, 유니폼, 머리)
function passPlayer(us, num) {
  const fill = us ? "#FF6B1A" : "#F4F6FF", edge = us ? "#FFD7B8" : "#2D3FD1", txt = us ? "#fff" : "#1F2C8F", shorts = us ? "#1F2C8F" : "#2D3FD1";
  return `<ellipse cx=".4" cy="9.6" rx="5.6" ry="1.7" fill="rgba(0,0,0,.38)" filter="url(#psSoft)"/>
    <g class="mgp-body">
      <rect x="-3.7" y="5.2" width="3.1" height="3.6" rx=".9" fill="${shorts}"/><rect x=".6" y="5.2" width="3.1" height="3.6" rx=".9" fill="${shorts}"/>
      ${SHIRT(fill, edge, num, txt)}
      <circle cy="-8.4" r="2.6" fill="#E8B88C"/>
      <path d="M-2.7 -9 Q-2.4 -11.6 0 -11.4 Q2.5 -11.6 2.7 -9 Q1.3 -10.2 0 -10.1 Q-1.3 -10.2 -2.7 -9 Z" fill="#1B1B1F"/>
    </g>`;
}
// tall: 세로 휴대폰에서는 경기장을 세워서 그림 (좌표는 그대로, 그룹째 90도 돌리고 선수만 다시 바로 세움)
function passScene(spots, nMates, tall = false) {
  const up = tall ? `<g transform="rotate(-90)">` : "<g>";
  return `<svg viewBox="${tall ? "0 0 96 160" : "0 0 160 96"}" class="mg-svg mgp">${tall ? `<g transform="translate(96,0) rotate(90)">` : "<g>"}${passPitch()}
    <g id="lines"></g><g id="fx"></g>
    ${spots.map((s, i) => [s, i]).sort((a, b) => (a[1] < nMates) - (b[1] < nMates)).map(([s, i]) => i < nMates
      ? `<g class="mgp-mate" data-n="${i + 1}" transform="translate(${s.x.toFixed(1)},${s.y.toFixed(1)})"><circle r="11" fill="transparent"/>${up}${passPlayer(true, i + 1)}
          <g class="mgp-check" transform="translate(0,-15)"><circle r="2.6" fill="#18C964"/><path d="M-1.2 0 L-.3 .9 L1.3 -.9" stroke="#fff" stroke-width=".7" fill="none"/></g></g></g>`
      : `<g class="mgp-foe" data-foe data-i="${i}" transform="translate(${s.x.toFixed(1)},${s.y.toFixed(1)})"><circle r="10" fill="transparent"/>${up}${passPlayer(false, null)}</g></g>`).join("")}
    <g id="pshadow" transform="translate(80,49.4)"><ellipse rx="2" ry=".8" fill="rgba(0,0,0,.45)" filter="url(#psSoft)"/></g>
    <g id="pball" transform="translate(80,48)"><g id="pspin">${BALL(1.8)}</g></g></g>
    <rect width="${tall ? 96 : 160}" height="${tall ? 160 : 96}" fill="url(#psVig)" pointer-events="none"/>
  </svg>`;
}
function passing(area, status, ctl, e, done, lv = 1, tall = false) {
  const limit = (6 + e * 3) * [1, 1, 0.92, 0.86, 0.8][lv];   // 단계가 오를수록 시간이 줄어듦
  const foesN = [0, 2, 3, 4, 5][lv];                          // 상대 수
  const spots = [];
  let sep = lv >= 4 ? 21 : 24, tries = 0;
  const far = (x, y) => spots.every(s => Math.hypot(s.x - x, s.y - y) > sep);
  while (spots.length < 6 + foesN) {
    const x = 14 + Math.random() * 132, y = 17 + Math.random() * 62;
    if (far(x, y) && Math.hypot(x - 80, y - 48) > 9) spots.push({ x, y });
    if (++tries % 400 === 0) sep *= 0.92;                     // 자리가 안 나오면 간격을 조금씩 줄임 (무한 반복 방지)
  }
  area.innerHTML = passScene(spots, 6, tall) + `<div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="nx" class="num">다음 1</span></div>`;
  const lines = area.querySelector("#lines"), fx = area.querySelector("#fx"), pball = area.querySelector("#pball"), pspin = area.querySelector("#pspin"),
    pshadow = area.querySelector("#pshadow"), tbar = area.querySelector("#tbar"), nx = area.querySelector("#nx");
  let nextN = 1, mistakes = 0, start = performance.now(), timer, last = { x: 80, y: 48 }, ended = false;
  const foeEls = [...area.querySelectorAll("[data-foe]")];
  // 공: 누를 때마다 목표를 줄 세우고, 앞 패스가 도착하면 다음으로 출발
  const ball = { x: 80, y: 48.5, from: null, to: null, t0: 0, dur: 0, peak: 0, spin: 0, queue: [] };
  const kick = now => {
    const tgt = ball.queue.shift(); if (!tgt) return;
    const d = Math.hypot(tgt.x - ball.x, tgt.y - ball.y);
    ball.from = { x: ball.x, y: ball.y }; ball.to = tgt; ball.t0 = now;
    ball.dur = Math.max(160, Math.min(420, d / 0.2));          // 멀수록 오래 날아감
    ball.peak = d > 48 ? d * 0.11 : d * 0.025;                 // 먼 패스는 띄워서, 짧은 패스는 땅볼로
  };
  const moveBall = now => {
    if (!ball.to && ball.queue.length) kick(now);
    let h = 0;
    if (ball.to) {
      const u = Math.min(1, (now - ball.t0) / ball.dur);
      const lofted = ball.peak > 3;
      const k = lofted ? u : 1 - (1 - u) * (1 - u);              // 땅볼은 마찰로 점점 느려짐
      const px = ball.x;
      ball.x = ball.from.x + (ball.to.x - ball.from.x) * k; ball.y = ball.from.y + (ball.to.y - ball.from.y) * k;
      h = ball.peak * 4 * u * (1 - u);
      ball.spin += (ball.x - px) * 22;
      if (u >= 1) {
        fx.insertAdjacentHTML("beforeend", `<circle class="mgp-ring" cx="${ball.to.x.toFixed(1)}" cy="${ball.to.y.toFixed(1)}" r="6"/>`);
        const r = fx.lastElementChild; setTimeout(() => r.remove(), 520);
        ball.to = null; kick(now);
      }
    }
    // 화면에서 "위"는 세운 경기장에서는 x 쪽이라, 공이 뜨는 방향과 그림자 방향도 바꿔 줌
    const [lx, ly] = tall ? [ball.x - h, ball.y] : [ball.x, ball.y - h];
    const [sx2, sy2] = tall ? [ball.x + 1.3, ball.y] : [ball.x, ball.y + 1.3];
    pball.setAttribute("transform", `translate(${lx.toFixed(2)},${ly.toFixed(2)}) scale(${(1 + h * 0.05).toFixed(3)})`);
    pspin.setAttribute("transform", `rotate(${(ball.spin % 360).toFixed(1)})`);
    pshadow.setAttribute("transform", `translate(${sx2.toFixed(2)},${sy2.toFixed(2)}) scale(${Math.max(0.5, 1 - h * 0.05).toFixed(3)})${tall ? " rotate(90)" : ""}`);
  };
  const tick = now => {
    if (lv >= 3) foeEls.forEach((g, k) => {          // LV.3부터 상대가 패스 길로 움직임
      const s0 = spots[+g.dataset.i], t = (now - start) / 1000;
      g.setAttribute("transform", `translate(${(s0.x + Math.sin(t * 1.7 + k) * 11).toFixed(2)},${(s0.y + Math.cos(t * 1.3 + k * 2) * 8).toFixed(2)})`);
    });
    moveBall(now);
    if (ended) { timer = requestAnimationFrame(tick); return; }
    const left = limit - (now - start) / 1000;
    tbar.style.width = `${Math.max(0, left / limit) * 100}%`;
    tbar.className = left < limit * 0.3 ? "low" : "";
    status.textContent = mistakes ? `실수 ${mistakes}` : "";
    if (left <= 0) return finish();
    timer = requestAnimationFrame(tick);
  };
  const finish = () => {
    if (ended) return; ended = true;
    const used = (performance.now() - start) / 1000, made = nextN - 1;
    done(made === 6 && mistakes === 0 && used < limit * 0.65 ? "S" : made === 6 && mistakes <= 1 ? "A" : made >= 4 ? "B" : "C");
  };
  const flash = (g, label, x, y) => {
    g.classList.remove("bad"); void g.getBBox(); g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 280);
    if (label) {
      const [tx, ty] = tall ? [x - 14, y] : [x, y - 14];
      fx.insertAdjacentHTML("beforeend", `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)})${tall ? " rotate(-90)" : ""}"><text class="mgp-pop" x="0" y="0">${label}</text></g>`);
      const t = fx.lastElementChild; setTimeout(() => t.remove(), 720);
    }
  };
  area.querySelectorAll("[data-n]").forEach(g => g.addEventListener("pointerdown", () => {
    if (ended) return;
    const s = spots[+g.dataset.n - 1];
    if (+g.dataset.n === nextN) {
      g.classList.add("ok");
      [...lines.children].forEach(l => l.classList.add("old"));
      lines.insertAdjacentHTML("beforeend", `<line x1="${last.x.toFixed(1)}" y1="${last.y.toFixed(1)}" x2="${s.x.toFixed(1)}" y2="${s.y.toFixed(1)}" class="mgp-trail"/>`);
      ball.queue.push(tall ? { x: s.x + 8.6, y: s.y - 3.4 } : { x: s.x + 3.4, y: s.y + 8.6 });   // 받는 선수의 발밑
      last = s; nextN++; nx.textContent = nextN <= 6 ? `다음 ${nextN}` : "완료";
      if (nextN > 6) finish();
    } else if (!g.classList.contains("ok")) { mistakes++; flash(g, "", 0, 0); }
  }));
  foeEls.forEach(g => g.addEventListener("pointerdown", () => {
    if (ended) return;
    mistakes += 2;
    const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute("transform"));
    flash(g, "끊겼다!", +m[1], +m[2]);
  }));
  timer = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(timer);
}

// ── 드리블 ──────────────────────────
// 내 등 뒤에서 본 원근 화면. 수비는 멀리 지평선에서 달려와 점점 커짐
// 판정은 예전과 같음: 수비 위치(fy) 74~92 구간에서 같은 줄이면 부딪힘
// tall: 세로 휴대폰용 화면 (좌우를 조금 잘라 내고 위아래를 늘림. 판정 규칙은 같음)
let DRB, DR_ME_Y, DR_VB, DR_TALL = false;
const drY = fy => DRB.HOR + (DRB.BOT - DRB.HOR) * Math.pow(Math.max(0, (fy + 10) / 110), 1.55);
function drSetup(tall) {
  DR_TALL = !!tall;
  DRB = tall ? { VPY: 16, HOR: 46, BOT: 178, ME: 83 } : { VPY: 6, HOR: 25, BOT: 96, ME: 83 };
  DR_ME_Y = drY(DRB.ME);
  DR_VB = tall ? "16 0 128 178" : "0 0 160 96";
}
drSetup(false);
const drS = y => (y - DRB.VPY) / (DR_ME_Y - DRB.VPY);            // 원근 배율 (내 자리 = 1)
const drX = (lanePos, y) => 80 + (lanePos - 1) * 40 * drS(y);
function drRunner(front, legId) {
  // front: 앞에서 본 수비수 / 아니면 뒤에서 본 나. 발 위치가 원점
  const shirt = front ? SHIRT("#F4F6FF", "#2D3FD1", null) : SHIRT("#FF6B1A", "#FFD7B8", null);
  const shorts = front ? "#2D3FD1" : "#1F2C8F", sock = front ? "#F4F6FF" : "#FF6B1A";
  return `<ellipse cx="0" cy="0" rx="6" ry="1.6" fill="rgba(0,0,0,.4)"/>
    <g ${legId ? `id="${legId}"` : ""} class="mgd-legs">
      <g class="mgd-legL"><rect x="-3.2" y="-8" width="2.4" height="8" rx="1" fill="#E8B88C"/><rect x="-3.3" y="-4" width="2.6" height="3.4" fill="${sock}"/><ellipse cx="-2" cy="-.4" rx="2" ry="1" fill="#111"/></g>
      <g class="mgd-legR"><rect x=".8" y="-8" width="2.4" height="8" rx="1" fill="#E8B88C"/><rect x=".7" y="-4" width="2.6" height="3.4" fill="${sock}"/><ellipse cx="2" cy="-.4" rx="2" ry="1" fill="#111"/></g>
    </g>
    <rect x="-4" y="-11" width="8" height="4" rx="1" fill="${shorts}"/>
    <g transform="translate(0,-16.5) scale(1.05)">${shirt}</g>
    <circle cy="-25" r="3.2" fill="#E8B88C"/>
    ${front ? `<path d="M-3.3 -25.6 Q-3 -29 0 -28.8 Q3.1 -29 3.3 -25.6 Q1.6 -27.2 0 -27 Q-1.6 -27.2 -3.3 -25.6 Z" fill="#1B1B1F"/>`
            : `<path d="M-3.3 -24.4 Q-3.4 -29 0 -28.8 Q3.4 -29 3.3 -24.4 Q1.6 -23.6 0 -23.8 Q-1.6 -23.6 -3.3 -24.4 Z" fill="#1B1B1F"/>`}`;
}
function drCone() {
  return `<ellipse cx="0" cy="0" rx="4.6" ry="1.3" fill="rgba(0,0,0,.4)"/><path d="M-4.4 0 H4.4 L3.6 -1.2 H-3.6 Z" fill="#E2560C"/>
    <path d="M-3 -1.2 L0 -11 L3 -1.2 Z" fill="#FF7A1F"/><path d="M-2 -4.4 H2 L1.5 -6.4 H-1.5 Z" fill="#fff"/>`;
}
function dribbleScene(tall = false) {
  drSetup(tall);
  const rows = tall ? Math.floor((DRB.HOR - 18) / 4.2) : 2, L1 = tall ? 26 : 10, L2 = tall ? 134 : 150;
  const crowd = Array.from({ length: rows }, (_, row) => Array.from({ length: 46 }, (_, i) => {
    const x = i * 3.55 + (row % 2) * 1.7, y = 12.6 + row * 4.2, c = ["#2A3470", "#3A4580", "#FF6B1A", "#F4F6FF", "#1F2A66", "#FFB23F"][(i * 5 + row * 2) % 6];
    return `<circle cx="${x.toFixed(1)}" cy="${y}" r="1.1" fill="${c}" opacity="${0.3 + ((i * 11 + row) % 5) * 0.09}"/>`;
  }).join("")).join("");
  const edge = (o, y) => drX(o, y).toFixed(2);
  return `<svg viewBox="${DR_VB}" class="mg-svg mgd">
    <defs>
      <linearGradient id="drSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050F"/><stop offset="1" stop-color="#16225E"/></linearGradient>
      <radialGradient id="drFlood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6DA"/><stop offset=".3" stop-color="rgba(255,240,200,.5)"/><stop offset="1" stop-color="rgba(255,240,200,0)"/></radialGradient>
      <linearGradient id="drFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(5,8,26,.75)"/><stop offset=".3" stop-color="rgba(5,8,26,0)"/></linearGradient>
      <radialGradient id="drVig" cx=".5" cy=".6" r=".8"><stop offset=".6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.5)"/></radialGradient>
    </defs>
    <rect width="160" height="${DRB.BOT}" fill="url(#drSky)"/>
    <path d="M0 10 H160 V${DRB.HOR} H0 Z" fill="#0B1236"/>${crowd}
    <rect x="0" y="${DRB.HOR - 4}" width="160" height="4" fill="#0A0F2A"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 20 + 1}" y="${DRB.HOR - 3.4}" width="18" height="2.8" rx=".5" fill="${i % 2 ? "#18245E" : "#1F2C8F"}"/>`).join("")}
    <circle cx="${L1}" cy="5" r="10" fill="url(#drFlood)"/><circle cx="${L2}" cy="5" r="10" fill="url(#drFlood)"/>
    <g fill="#FFF8E6"><rect x="${L1 - 4.5}" y="3" width="9" height="3.4" rx=".7"/><rect x="${L2 - 4.5}" y="3" width="9" height="3.4" rx=".7"/></g>
    <rect x="0" y="${DRB.HOR}" width="160" height="${DRB.BOT - DRB.HOR}" fill="#176F3D"/>
    <g id="drStripes"></g>
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".5">
      <path d="M${edge(-0.5, DRB.HOR)} ${DRB.HOR} L${edge(-0.5, DRB.BOT)} ${DRB.BOT}"/><path d="M${edge(0.5, DRB.HOR)} ${DRB.HOR} L${edge(0.5, DRB.BOT)} ${DRB.BOT}" stroke-dasharray="2 2"/>
      <path d="M${edge(1.5, DRB.HOR)} ${DRB.HOR} L${edge(1.5, DRB.BOT)} ${DRB.BOT}" stroke-dasharray="2 2"/><path d="M${edge(2.5, DRB.HOR)} ${DRB.HOR} L${edge(2.5, DRB.BOT)} ${DRB.BOT}"/>
    </g>
    <g transform="translate(80,${DRB.HOR})"><path d="M-6 0 V-4.4 H6 V0" fill="none" stroke="#fff" stroke-width=".7"/><rect x="-6" y="-4.4" width="12" height="4.4" fill="rgba(255,255,255,.12)"/></g>
    <rect x="0" y="${DRB.HOR}" width="160" height="30" fill="url(#drFade)"/>
    <g id="drBack"></g>
    <g id="drMe" transform="translate(80,${DR_ME_Y.toFixed(2)})"><g id="drLean">
      <g id="drBall" transform="translate(5,-1.2)"><ellipse id="drBallSh" cx="0" cy="1.4" rx="2" ry=".7" fill="rgba(0,0,0,.45)"/><g id="drBallB">${BALL(1.8)}</g></g>
      <g class="mgd-me">${drRunner(false, "drLegs")}</g>
    </g></g>
    <g id="drFront"></g>
    <g id="drFx"></g>
    <rect width="160" height="${DRB.BOT}" fill="url(#drVig)" pointer-events="none"/>
  </svg>`;
}
function dribble(area, status, ctl, e, done, lv = 1, tall = false) {
  const DURATION = 12000;
  const speed = (34 - e * 10) * [1, 1, 1.18, 1.3, 1.42][lv];   // 단계가 오를수록 수비가 빨라짐
  const gapMs = (820 - e * 220) * [1, 1, 0.9, 0.95, 0.88][lv];
  const pairP = [0, 0, 0, 0.3, 0.45][lv];                       // LV.3부터 두 명이 한꺼번에 막음
  area.innerHTML = `<div class="mgd-wrap" id="lanes">${dribbleScene(tall)}</div>
    <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="hits" class="num">부딪힘 0</span></div>`;
  ctl.innerHTML = `<button class="btn mg-dir" data-l>◀ 왼쪽</button><button class="btn mg-dir" data-r>오른쪽 ▶</button>`;
  const lanes = area.querySelector("#lanes"), tbar = area.querySelector("#tbar"), hitsEl = area.querySelector("#hits");
  const stripesG = area.querySelector("#drStripes"), backG = area.querySelector("#drBack"), frontG = area.querySelector("#drFront"), fxG = area.querySelector("#drFx");
  const meG = area.querySelector("#drMe"), leanG = area.querySelector("#drLean"), legs = area.querySelector("#drLegs"),
    legL = legs.querySelector(".mgd-legL"), legR = legs.querySelector(".mgd-legR"), ballG = area.querySelector("#drBall"), ballB = area.querySelector("#drBallB"), ballSh = area.querySelector("#drBallSh");
  // 잔디 줄무늬 (수비가 다가오는 속도와 같이 흘러감)
  const N = 9;
  stripesG.innerHTML = Array.from({ length: N }, (_, i) => `<polygon fill="${i % 2 ? "rgba(255,255,255,.055)" : "rgba(0,0,0,.05)"}"/>`).join("");
  const polys = [...stripesG.children];
  let lane = 1, px = 80, hits = 0, foes = [], start = performance.now(), last = start, spawnAt = start + 400, raf, run = 0, stumble = 0;
  const setLane = n => { lane = Math.max(0, Math.min(2, n)); };
  ctl.querySelector("[data-l]").addEventListener("pointerdown", () => setLane(lane - 1));
  ctl.querySelector("[data-r]").addEventListener("pointerdown", () => setLane(lane + 1));
  const key = ev => { if (ev.key === "ArrowLeft") setLane(lane - 1); if (ev.key === "ArrowRight") setLane(lane + 1); };
  document.addEventListener("keydown", key);
  // 밀기 또는 화면 왼쪽·오른쪽 누르기
  let sx = null;
  lanes.addEventListener("pointerdown", ev => { sx = ev.clientX; });
  lanes.addEventListener("pointerup", ev => {
    if (sx == null) return;
    const dx = ev.clientX - sx, r = lanes.getBoundingClientRect();
    if (Math.abs(dx) > 30) setLane(lane + (dx > 0 ? 1 : -1));
    else setLane(lane + (ev.clientX - r.left > r.width / 2 ? 1 : -1));
    sx = null;
  });
  const dust = (x, y, s) => {
    fxG.insertAdjacentHTML("beforeend", `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})">${Array.from({ length: 7 }, (_, i) =>
      `<circle class="mgd-dust" r="${(0.9 + (i % 3) * 0.5).toFixed(1)}" style="--dx:${(Math.cos(i * 0.9) * 8).toFixed(1)}px;--dy:${(-2 - (i % 4) * 2).toFixed(1)}px"/>`).join("")}</g>`);
    const g = fxG.lastElementChild; setTimeout(() => g.remove(), 650);
  };
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const flow = speed * 3;                                        // 수비가 다가오는 속도 (fy 단위/초)
    // 잔디 줄무늬
    const phase = ((now - start) / 1000 * flow / 120) % 1;
    polys.forEach((pg, i) => {
      const a = ((i + phase) / N) * 120 - 10, b = ((i + 1 + phase) / N) * 120 - 10;
      const ya = drY(a), yb = Math.min(DRB.BOT, drY(b));
      if (ya >= DRB.BOT) { pg.setAttribute("points", ""); return; }
      pg.setAttribute("points", `${drX(-1, ya).toFixed(1)},${ya.toFixed(1)} ${drX(3, ya).toFixed(1)},${ya.toFixed(1)} ${drX(3, yb).toFixed(1)},${yb.toFixed(1)} ${drX(-1, yb).toFixed(1)},${yb.toFixed(1)}`);
    });
    // 수비 등장 (예전과 같은 규칙)
    if (now >= spawnAt) {
      const first = Math.floor(Math.random() * 3);
      const ls = Math.random() < pairP ? [first, (first + 1 + Math.floor(Math.random() * 2)) % 3] : [first];
      for (const l of ls) {
        const cone = ls.length === 1 && Math.random() < 0.25;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "mgd-foe");
        g.innerHTML = `<g class="mgd-foeB">${cone ? drCone() : drRunner(true)}</g>`;
        backG.insertBefore(g, backG.firstChild);                   // 새로 온 수비는 멀리 있으니 뒤에 그림
        foes.push({ el: g, body: g.firstChild, l, y: -10, hit: false, cone, ph: Math.random() * 6, front: false });
      }
      spawnAt = now + gapMs * (ls.length > 1 ? 1.25 : 1) * (0.7 + Math.random() * 0.6);
    }
    for (const f of foes) {
      f.y += flow * dt;
      const y = drY(f.y), s = drS(y);
      if (!f.front && f.y > DRB.ME) { f.front = true; frontG.insertBefore(f.el, frontG.firstChild); }   // 나를 지나치면 내 앞쪽(화면 가까이)에 그림
      f.el.setAttribute("transform", `translate(${drX(f.l, y).toFixed(2)},${y.toFixed(2)}) scale(${(s * 1.05).toFixed(3)})`);
      if (!f.cone && !f.hit) {
        const sw = Math.sin(now / 70 + f.ph) * 26;
        const lg = f.body.querySelector(".mgd-legs");
        if (lg) { lg.children[0].setAttribute("transform", `rotate(${sw.toFixed(1)} -2 -8)`); lg.children[1].setAttribute("transform", `rotate(${(-sw).toFixed(1)} 2 -8)`); }
      }
      if (!f.hit && f.y > 74 && f.y < 92 && f.l === lane) {
        f.hit = true; hits++; stumble = 1;
        f.el.classList.add("hit");
        if (!f.cone) f.body.setAttribute("transform", `translate(${f.l > lane ? -4 : 4},2) rotate(${f.l >= 1 ? -62 : 62})`);   // 태클
        lanes.classList.remove("shake"); void lanes.offsetWidth; lanes.classList.add("shake");
        dust(px, DR_ME_Y, 1);
        hitsEl.textContent = `부딪힘 ${hits}`;
      }
    }
    foes = foes.filter(f => { if (f.y > 110) { f.el.remove(); return false; } return true; });
    // 나: 줄 이동은 판정상 즉시, 화면에서는 부드럽게 미끄러짐
    const tx = drX(lane, DR_ME_Y);
    const vx = (tx - px);
    px += vx * (1 - Math.exp(-dt * 20));
    run += dt * 15;
    stumble = Math.max(0, stumble - dt * 2.4);
    const sw = Math.sin(run) * 30;
    legL.setAttribute("transform", `rotate(${sw.toFixed(1)} -2 -8)`); legR.setAttribute("transform", `rotate(${(-sw).toFixed(1)} 2 -8)`);
    const bob = Math.abs(Math.sin(run)) * 0.9;
    meG.setAttribute("transform", `translate(${px.toFixed(2)},${(DR_ME_Y - bob).toFixed(2)})`);
    leanG.setAttribute("transform", `rotate(${Math.max(-14, Math.min(14, vx * 0.5 + Math.sin(now / 40) * stumble * 10)).toFixed(1)})`);
    // 공: 발끝에서 톡톡 치고 나감
    const touch = Math.abs(Math.sin(run * 0.5));
    ballG.setAttribute("transform", `translate(${(4.5 + Math.sin(run * 0.5) * 1.2).toFixed(2)},${(-1.4 - touch * 2.2).toFixed(2)})`);
    ballB.setAttribute("transform", `rotate(${(run * 60 % 360).toFixed(0)})`);
    ballSh.setAttribute("cy", (1.4 + touch * 2.2).toFixed(2));
    const left = (DURATION - (now - start)) / 1000;
    tbar.style.width = `${Math.max(0, left / 12) * 100}%`;
    if (left <= 0) return done(hits === 0 ? "S" : hits === 1 ? "A" : hits <= 3 ? "B" : "C");
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 웨이트 ──────────────────────────
// 야간 체력실, 옆에서 본 스쿼트. 원이 줄어드는 판정 규칙(반지름 26→4, 목표 10)은 예전과 같고, 화면에는 0.8배로 그림
let WT = { CX: 129, CY: 44, K: 0.8 };
// tall: 세로 휴대폰에서는 타이밍 원을 선수 아래 바닥 쪽에 둠
const wtSetup = tall => { WT = tall ? { CX: 71, CY: 118, K: 0.8, VB: "20 0 102 150", H: 150, BX: 26, DX: 34 } : { CX: 129, CY: 44, K: 0.8, VB: "0 0 160 96", H: 96, BX: 8, DX: 14 }; };
const lerp = (a, b, t) => a + (b - a) * t;
function wtPose(q) {
  // q: 0 = 가장 깊이 앉은 자세, 1 = 다 일어선 자세
  const A = [70, 77];
  const K = [lerp(80, 71, q), lerp(67, 64, q)];
  const H = [lerp(66, 70, q), lerp(64, 51, q)];
  const S = [lerp(75, 71, q), lerp(51, 36.5, q)];
  const head = [S[0] + lerp(4.2, 2.4, q), S[1] - lerp(4.2, 5.4, q)];
  const bar = [S[0] - 3.4, S[1] - 0.4];              // 바는 목 뒤 등 위에 얹힘
  const E = [S[0] - 6.2, S[1] + 4.6];
  const hand = [bar[0] - 1.6, bar[1] + 0.4];
  return { A, K, H, S, head, bar, E, hand, toe: [76.5, 78] };
}
function weightScene(tall = false) {
  wtSetup(tall);
  const bricks = Array.from({ length: 9 }, (_, r) => Array.from({ length: 12 }, (_, c) =>
    `<rect x="${c * 14 + (r % 2) * 7 - 7}" y="${r * 7 + 2}" width="13.2" height="6.2" rx=".6" fill="rgba(255,255,255,${(0.025 + ((r * 7 + c * 3) % 5) * 0.006).toFixed(3)})"/>`).join("")).join("");
  const p = wtPose(1);
  return `<svg viewBox="${WT.VB}" class="mg-svg mgw">
    <defs>
      <linearGradient id="wtWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1030"/><stop offset="1" stop-color="#1A2350"/></linearGradient>
      <radialGradient id="wtSpot" cx=".44" cy="0" r=".9"><stop offset="0" stop-color="rgba(255,236,200,.32)"/><stop offset=".5" stop-color="rgba(255,236,200,.08)"/><stop offset="1" stop-color="rgba(255,236,200,0)"/></radialGradient>
      <linearGradient id="wtSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5C6680"/><stop offset=".5" stop-color="#C9D1DE"/><stop offset="1" stop-color="#5C6680"/></linearGradient>
      <radialGradient id="wtPlate" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3A3F52"/><stop offset="1" stop-color="#14161F"/></radialGradient>
      <radialGradient id="wtVig" cx=".45" cy=".5" r=".8"><stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.55)"/></radialGradient>
      <filter id="wtSoft"><feGaussianBlur stdDeviation=".8"/></filter>
      <filter id="wtGlow"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="160" height="${WT.H}" fill="url(#wtWall)"/>${bricks}
    <rect x="0" y="9" width="160" height="5" fill="#FF6B1A" opacity=".85"/><rect x="0" y="14" width="160" height="1.2" fill="#1F2C8F"/>
    <text x="${WT.BX}" y="12.9" class="mgw-banner">GOHEUNG FC · STRENGTH</text>
    <!-- 바닥 매트 -->
    <rect x="0" y="78" width="160" height="${WT.H - 78}" fill="#101320"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 20} 78 L${i * 20 - 6} ${WT.H}" stroke="rgba(255,255,255,.06)" stroke-width=".5"/>`).join("")}
    <path d="M0 78 H160" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>
    <!-- 덤벨 거치대와 초크통 -->
    <g transform="translate(${WT.DX},70)"><rect x="-10" y="0" width="22" height="8" rx="1" fill="#1D2236"/>${[-6, 0, 6].map(x => `<g transform="translate(${x + 1},-1)"><rect x="-3" y="-.8" width="6" height="1.6" fill="#8A93AA"/><rect x="-3.6" y="-2.2" width="1.8" height="4.4" rx=".5" fill="#2B3047"/><rect x="1.8" y="-2.2" width="1.8" height="4.4" rx=".5" fill="#2B3047"/></g>`).join("")}</g>
    <g transform="translate(100,78)"><path d="M-4 0 L-3 -6 H3 L4 0 Z" fill="#3A4060"/><ellipse cy="-6" rx="3.2" ry=".9" fill="#E9ECF5"/></g>
    <!-- 스쿼트 랙 -->
    <rect width="160" height="96" fill="url(#wtSpot)"/>
    <g fill="url(#wtSteel)"><rect x="54" y="20" width="2.6" height="58" rx=".6"/><rect x="86" y="20" width="2.6" height="58" rx=".6"/></g>
    <rect x="54" y="20" width="34.6" height="2" rx=".6" fill="#5C6680"/>
    <rect x="52" y="58" width="39" height="1.6" rx=".6" fill="#8A93AA" opacity=".8"/>
    <ellipse cx="72" cy="78.4" rx="13" ry="1.6" fill="rgba(0,0,0,.5)" filter="url(#wtSoft)"/>
    <!-- 선수 -->
    <g id="wtBody" stroke-linecap="round" stroke-linejoin="round">
      <line id="wtShin" stroke="#E8B88C" stroke-width="4.2"/>
      <line id="wtSock" stroke="#FF6B1A" stroke-width="4.4"/>
      <path id="wtShoe" fill="#111"/>
      <line id="wtThigh" stroke="#1F2C8F" stroke-width="6"/>
      <line id="wtTorso" stroke="#FF6B1A" stroke-width="7.4"/>
      <line id="wtUpper" stroke="#E8B88C" stroke-width="3.1"/>
      <line id="wtFore" stroke="#E8B88C" stroke-width="2.8"/>
      <circle id="wtHead" r="3.6" fill="#E8B88C"/>
      <path id="wtHair" fill="#1B1B1F"/>
    </g>
    <!-- 바벨 (옆에서 보면 원판이 정면으로 보임) -->
    <g id="wtBar" transform="translate(${p.bar[0]},${p.bar[1]})"><g id="wtPlates">
      <circle r="6.6" fill="url(#wtPlate)" stroke="#FF6B1A" stroke-width="1.2"/>
      <circle r="4.6" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".4"/>
      <path d="M-4.2 -1.8 A4.6 4.6 0 0 1 -1.2 -4.4" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".55" stroke-linecap="round"/>
      <circle r="1.6" fill="url(#wtSteel)"/><circle r=".6" fill="#14161F"/>
    </g></g>
    <g id="wtFx"></g>
    <!-- 타이밍 원 -->
    <g transform="translate(${WT.CX},${WT.CY})">
      <circle r="${(26 * WT.K).toFixed(1)}" fill="rgba(5,8,26,.55)" stroke="rgba(255,255,255,.08)"/>
      <circle r="${(10 * WT.K).toFixed(1)}" class="mg-target" fill="rgba(255,107,26,.12)"/>
      <circle id="ring" r="${(26 * WT.K).toFixed(1)}" class="mg-ring"/>
      <text id="wtRep" y="-24.5" text-anchor="middle" class="mgw-rep">REP 1 / 6</text>
    </g>
    <text id="wtMsg" x="${WT.CX}" y="${WT.CY + 3}" text-anchor="middle" class="mg-shmsg mgw-msg"></text>
    <rect width="160" height="${WT.H}" fill="url(#wtVig)" pointer-events="none"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(6)}</span><span id="pts" class="num">0점</span></div>`;
}
function wtDraw(root, q, tilt = 0) {
  const p = wtPose(q), $ = id => root.querySelector(id), L = (el, a, b) => { el.setAttribute("x1", a[0].toFixed(2)); el.setAttribute("y1", a[1].toFixed(2)); el.setAttribute("x2", b[0].toFixed(2)); el.setAttribute("y2", b[1].toFixed(2)); };
  L($("#wtShin"), p.K, p.A);
  L($("#wtSock"), [lerp(p.K[0], p.A[0], 0.74), lerp(p.K[1], p.A[1], 0.74)], [p.A[0], p.A[1] - 0.6]);
  $("#wtShoe").setAttribute("d", `M${p.A[0] - 2.4} ${p.A[1] + 1.4} L${p.A[0] - 1.8} ${p.A[1] - 1.4} H${p.A[0] + 2.4} L${p.toe[0]} ${p.toe[1] - 0.6} V${p.toe[1] + 0.4} H${p.A[0] - 2.4} Z`);
  L($("#wtThigh"), p.H, p.K);
  L($("#wtTorso"), p.S, p.H);
  L($("#wtUpper"), p.S, p.E);
  L($("#wtFore"), p.E, p.hand);
  const h = $("#wtHead"); h.setAttribute("cx", p.head[0].toFixed(2)); h.setAttribute("cy", p.head[1].toFixed(2));
  const [hx, hy] = p.head;
  $("#wtHair").setAttribute("d", `M${hx - 3.7} ${hy - 0.2} Q${hx - 3.6} ${hy - 4.4} ${hx} ${hy - 4} Q${hx + 3.4} ${hy - 4.2} ${hx + 3.6} ${hy - 1.4} Q${hx + 1} ${hy - 2.6} ${hx - 1.6} ${hy - 1.6} Q${hx - 2.8} ${hy - 1} ${hx - 3.7} ${hy - 0.2} Z`);
  $("#wtBar").setAttribute("transform", `translate(${p.bar[0].toFixed(2)},${p.bar[1].toFixed(2)})`);
  $("#wtPlates").setAttribute("transform", `rotate(${tilt.toFixed(1)})`);
  return p;
}
function weight(area, status, ctl, e, done, lv = 1, tall = false) {
  area.innerHTML = weightScene(tall);
  const svg = area.querySelector("svg"), ring = area.querySelector("#ring"), dots = area.querySelectorAll("#dots i"), ptsEl = area.querySelector("#pts"),
    repEl = area.querySelector("#wtRep"), msg = area.querySelector("#wtMsg"), fx = area.querySelector("#wtFx"), body = area.querySelector("#wtBody");
  const baseDur = (1300 + e * 300) * [1, 1, 0.85, 0.8, 0.72][lv];   // 단계가 오를수록 원이 빨리 줄어듦
  const tol = (1.6 + e * 1.4) * (lv >= 4 ? 0.8 : 1);                // LV.4 판정 범위 좁아짐
  let dur = baseDur;
  const nextDur = () => { dur = lv >= 3 ? baseDur * (0.75 + Math.random() * 0.5) : baseDur; };   // LV.3부터 속도가 매번 바뀜
  let rep = 0, score = 0, t0 = performance.now(), raf, lock = false, rLogic = 26;
  // 자세: q를 목표로 부드럽게 따라감 (스프링). 들어 올릴 때는 결과에 따라 빠르기·흔들림이 다름
  let q = 1, qv = 0, qTarget = 1, stiff = 60, tilt = 0, tiltV = 0, shakeUntil = 0, lift = null;
  const loop = now => {
    const dt = Math.min(0.05, (now - (loop.last || now)) / 1000); loop.last = now;
    if (!lock) {
      const k = ((now - t0) % dur) / dur;
      rLogic = 26 - k * 22;
      ring.setAttribute("r", (rLogic * WT.K).toFixed(2));
      qTarget = 1 - 0.85 * Math.min(1, k * 1.15);                  // 원이 줄어드는 동안 천천히 앉음
      stiff = 70;
    } else if (lift) {
      const u = (now - lift.t) / 1000;
      if (lift.pts === 0) qTarget = u < 0.16 ? 0.42 : 0.12;          // 버티다 다시 주저앉음
      else qTarget = 1;
      stiff = lift.pts === 2 ? 420 : lift.pts === 1 ? 160 : 120;
    }
    // 감쇠 스프링 (완벽할수록 단단하게, 살짝 넘쳤다가 자리 잡음)
    const damp = 2 * Math.sqrt(stiff) * (lift?.pts === 2 ? 0.55 : 0.9);
    qv += (stiff * (qTarget - q) - damp * qv) * dt; q += qv * dt;
    q = Math.max(0, Math.min(1.04, q));
    tiltV += (-90 * tilt - 9 * tiltV) * dt; tilt += tiltV * dt;
    const shake = now < shakeUntil ? Math.sin(now / 22) * 0.8 : 0;
    body.setAttribute("transform", `translate(${shake.toFixed(2)},0)`);
    wtDraw(svg, Math.min(1, q), tilt + shake * 2);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const chalk = p => {
    fx.insertAdjacentHTML("beforeend", `<g transform="translate(${p.hand[0].toFixed(1)},${p.hand[1].toFixed(1)})">${Array.from({ length: 8 }, (_, i) =>
      `<circle class="mgw-chalk" r="${(0.8 + (i % 3) * 0.5).toFixed(1)}" style="--dx:${(Math.cos(i * 0.8) * 9).toFixed(1)}px;--dy:${(Math.sin(i * 0.8) * 6 - 4).toFixed(1)}px"/>`).join("")}</g>`);
    const g = fx.lastElementChild; setTimeout(() => g.remove(), 700);
  };
  const press = () => {
    if (lock) return; lock = true;
    const err = Math.abs(rLogic - 10);
    const pts = err <= tol ? 2 : err <= tol * 2.2 ? 1 : 0;
    score += pts;
    dots[rep].className = pts === 2 ? "top" : pts === 1 ? "hit" : "miss";
    rep++;
    ptsEl.textContent = `${score}점`;
    status.innerHTML = `<b class="${pts ? "up" : "down"}">${pts === 2 ? "완벽!" : pts === 1 ? "좋아" : "자세가 무너졌다"}</b>`;
    ring.classList.add(pts === 2 ? "perfect" : pts === 1 ? "good" : "miss");
    lift = { pts, t: performance.now() };
    if (pts) { tiltV = pts === 2 ? 70 : 30; chalk(wtPose(q)); } else shakeUntil = performance.now() + 380;
    msg.textContent = pts === 2 ? "PERFECT" : pts === 1 ? "GOOD" : "MISS";
    msg.setAttribute("class", `mg-shmsg mgw-msg show ${pts ? "goal" : "save"}`);
    setTimeout(() => {
      ring.classList.remove("perfect", "good", "miss"); msg.setAttribute("class", "mg-shmsg mgw-msg");
      if (rep >= 6) return done(score >= 10 ? "S" : score >= 7 ? "A" : score >= 4 ? "B" : "C");
      repEl.textContent = `REP ${rep + 1} / 6`;
      lift = null; t0 = performance.now(); nextDur(); lock = false;
    }, 480);
  };
  ctl.querySelector("[data-act]").addEventListener("click", press);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); press(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

const GAMES = { shooting, passing, dribble, weight };
