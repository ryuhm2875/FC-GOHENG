// 훈련 미니게임 4종. 결과 등급에 따라 그 훈련의 능력치 상승량이 달라집니다.
//   S ×1.5 / A ×1.25 / B ×1.0 / C ×0.8   (건너뛰면 B)
// 능력치가 오르면 난이도 단계(LV.1~4)가 올라 더 빠르고 방해물이 많아집니다. 등급과 배율 기준은 그대로입니다.
import { openModal } from "./modals.js";

export const GRADES = { S: 1.5, A: 1.25, B: 1.0, C: 0.8 };
const STAT_FOR = { shooting: "tech.shoot", passing: "tech.pass", dribble: "tech.dribble", weight: "phys.strength", defend: "tech.defense", sprint: "phys.speed" };
const INFO = {
  shooting: { title: "슈팅 훈련", tag: "SHOOTING DRILL", how: "조준점이 골문 위를 움직입니다. 골키퍼를 피해 구석을 노려 누르세요. 다섯 번 찹니다.", btn: "슈팅" },
  passing:  { title: "패스 훈련", tag: "PASSING DRILL", how: "동료 등번호를 1부터 6까지 순서대로 빠르게 누르세요. 흰 유니폼 상대를 누르면 끊깁니다.", btn: null },
  dribble:  { title: "드리블 훈련", tag: "DRIBBLE DRILL", how: "달려드는 수비를 왼쪽·오른쪽으로 피하세요. 12초 버티면 끝입니다. 방향키나 화면을 밀어서도 움직일 수 있습니다.", btn: null },
  weight:   { title: "웨이트 트레이닝", tag: "STRENGTH", how: "줄어드는 원이 주황 테두리에 닿는 순간 누르세요. 여섯 번 들어 올립니다.", btn: "들어 올리기" },
  defend:   { title: "수비 훈련", tag: "DEFENDING", how: "공격수의 어깨가 기우는 쪽(주황 화살표)으로 ◀ ▶ 옮겨 서고, 초록 띠 안에 들어왔을 때 태클하세요. 여섯 번 막습니다.", btn: null },
  sprint:   { title: "스프린트 훈련", tag: "SPEED DRILL", how: "GO! 신호가 나오면 왼발·오른발을 번갈아 빠르게 누르세요. 같은 발을 두 번 누르면 스텝이 꼬입니다. 40m 달리기.", btn: null },
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
  defend:   ["", "", "공격수가 더 빨리 들어옵니다.", "한 번 속이고 들어오는 공격수가 있습니다.", "더 빠르고, 태클 범위가 좁습니다."],
  sprint:   ["", "", "옆 레인 선수들이 더 빠릅니다.", "옆 레인 선수들이 더 빠릅니다.", "전국 대회급 기록을 내야 합니다."],
};

// 공통 그래픽 조각
const SHIRT = (fill, stroke, num, numFill = "#fff") => `<path d="M-5 -4 L-2 -6 Q0 -4.6 2 -6 L5 -4 L6.5 -0.5 L4 0.6 L4 6 L-4 6 L-4 0.6 L-6.5 -0.5 Z" fill="${fill}" stroke="${stroke}" stroke-width=".6" stroke-linejoin="round"/>
  ${num != null ? `<text y="3.2" text-anchor="middle" class="mg-num" fill="${numFill}">${num}</text>` : ""}`;
// 입체감 있는 공: 가운데 오각형 + 가장자리 조각 + 둥근 음영 + 하이라이트 (그라데이션은 COMMON_DEFS)
const BALL = r => {
  const pent = (cx, cy, k) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; return `${(cx + Math.cos(a) * r * k).toFixed(2)},${(cy + Math.sin(a) * r * k).toFixed(2)}`; }).join(" ");
  const edge = [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + (i + 0.5) * Math.PI * 2 / 5; return `<polygon points="${pent(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, 0.32)}" fill="#1B1E26"/>`; }).join("");
  return `<g class="mg-ball"><circle r="${r}" fill="#F7F8FB"/><g clip-path="circle(${r}px at 0 0)">${edge}</g><polygon points="${pent(0, 0, 0.4)}" fill="#1B1E26"/>
    <circle r="${r}" fill="url(#mgBallShade)"/><circle r="${r}" fill="none" stroke="rgba(10,14,30,.55)" stroke-width="${(r * 0.08).toFixed(2)}"/>
    <ellipse cx="${(-r * 0.36).toFixed(2)}" cy="${(-r * 0.42).toFixed(2)}" rx="${(r * 0.3).toFixed(2)}" ry="${(r * 0.18).toFixed(2)}" fill="rgba(255,255,255,.8)" transform="rotate(-30 ${(-r * 0.36).toFixed(2)} ${(-r * 0.42).toFixed(2)})"/></g>`;
};
// 모든 장면이 같이 쓰는 그라데이션 (공 음영, 피부, 유니폼 주름)
const COMMON_DEFS = `
  <radialGradient id="mgBallShade" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="rgba(255,255,255,0)"/><stop offset=".55" stop-color="rgba(20,30,60,.06)"/><stop offset="1" stop-color="rgba(10,16,40,.55)"/></radialGradient>
  <linearGradient id="mgSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D99E76"/><stop offset=".45" stop-color="#F2C49B"/><stop offset="1" stop-color="#C98C66"/></linearGradient>
  <linearGradient id="mgShirtO" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9520F"/><stop offset=".4" stop-color="#FF7A2A"/><stop offset=".7" stop-color="#FF6B1A"/><stop offset="1" stop-color="#C94A0C"/></linearGradient>
  <linearGradient id="mgShirtW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C7CDE0"/><stop offset=".4" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#EEF1FA"/><stop offset="1" stop-color="#B9C0D6"/></linearGradient>
  <linearGradient id="mgNavy" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#141E66"/><stop offset=".5" stop-color="#2A3AA8"/><stop offset="1" stop-color="#121A5A"/></linearGradient>
  <linearGradient id="mgBlue" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1F2EA8"/><stop offset=".5" stop-color="#3B50E6"/><stop offset="1" stop-color="#1C2A99"/></linearGradient>`;
// 관중석: 점 대신 머리·어깨 실루엣, 드문드문 켜지는 카메라 플래시
function crowdRows(rowsY, cols, dx, seed = 1) {
  const pal = ["#232C63", "#2E3874", "#3A4583", "#C9561A", "#D9DDF0", "#1B2358", "#B8862F"];
  let out = "", fl = "";
  rowsY.forEach((y, row) => {
    for (let i = 0; i < cols; i++) {
      const x = i * dx + (row % 2) * dx / 2 + 1, k = (i * 7 + row * 3 + seed) % 7, c = pal[k];
      const op = (0.45 + ((i * 13 + row * 5) % 6) * 0.09).toFixed(2), sz = 1 + ((i * 3 + row) % 3) * 0.08;
      out += `<g transform="translate(${x.toFixed(1)},${y}) scale(${sz.toFixed(2)})" opacity="${op}"><path d="M-1.7 3.4 Q-1.7 1.3 0 1.2 Q1.7 1.3 1.7 3.4 Z" fill="${c}"/><circle cy="0" r="1.05" fill="${k === 4 ? "#8E94B0" : "#C49A7A"}" opacity=".85"/></g>`;
      if ((i * 31 + row * 17 + seed) % 23 === 0) fl += `<circle class="mg-bulb" cx="${x.toFixed(1)}" cy="${y}" r="1.1" style="animation-delay:${(((i * 37 + row * 11) % 50) / 10).toFixed(1)}s"/>`;
    }
  });
  return out + `<g fill="#fff">${fl}</g>`;
}
// 조명탑: 램프 여러 개 + 번짐 + 가로 빛줄기
const floodBank = (cx, cy, w = 12) => `<g transform="translate(${cx},${cy})">
    <rect x="${-w / 2 - 0.8}" y="-2.6" width="${w + 1.6}" height="5.2" rx=".8" fill="#141A36" stroke="#3A4466" stroke-width=".3"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${(-w / 2 + (i % 4) * w / 4 + 0.35).toFixed(2)}" y="${i < 4 ? -2 : 0.2}" width="${(w / 4 - 0.7).toFixed(2)}" height="1.8" rx=".3" fill="#FFFDF4"/>`).join("")}
    <ellipse rx="${w * 1.9}" ry="${w * 1.2}" fill="url(#mgBloom)" opacity=".9"/>
    <rect x="${-w * 2.6}" y="-.3" width="${w * 5.2}" height=".6" fill="url(#mgFlare)"/>
    <rect x="-.3" y="${-w * 1.1}" width=".6" height="${w * 2.2}" fill="url(#mgFlare)" opacity=".5" transform="rotate(90) rotate(-90)"/>
  </g>`;
const STADIUM_DEFS = `
  <radialGradient id="mgBloom" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,246,218,.9)"/><stop offset=".28" stop-color="rgba(255,236,190,.35)"/><stop offset="1" stop-color="rgba(255,236,190,0)"/></radialGradient>
  <linearGradient id="mgFlare" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(255,240,210,0)"/><stop offset=".5" stop-color="rgba(255,245,225,.95)"/><stop offset="1" stop-color="rgba(255,240,210,0)"/></linearGradient>
  <linearGradient id="mgHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(120,140,220,0)"/><stop offset="1" stop-color="rgba(150,170,240,.22)"/></linearGradient>
  <linearGradient id="mgBoard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3BB8"/><stop offset="1" stop-color="#16206E"/></linearGradient>`;
// 광고판: LED 느낌 + 글씨
const boards = (y, h, x0 = 0, x1 = 160) => {
  const words = ["GOHEUNG FC", "DREAM", "고흥대서중", "U-15"];
  let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" fill="#070B22"/>`;
  for (let x = x0, i = 0; x < x1; x += 22, i++) s += `<rect x="${x + 0.6}" y="${y + 0.6}" width="20.8" height="${h - 1.2}" rx=".5" fill="${i % 2 ? "url(#mgBoard)" : "#0F1640"}"/>
    <text x="${x + 11}" y="${y + h / 2 + 0.95}" text-anchor="middle" class="mg-boardtxt" fill="${i % 2 ? "#FFFFFF" : "#FF8A3D"}">${words[i % 4]}</text>`;
  return s + `<rect x="${x0}" y="${y}" width="${x1 - x0}" height=".35" fill="rgba(255,255,255,.25)"/>`;
};
// 터지는 조각 (골·완벽 등)
function burst(parent, x, y, { n = 14, colors = ["#FF6B1A", "#FFC93C", "#FFFFFF", "#3B50E6"], spread = 16, size = 1.1, cls = "mg-spark" } = {}) {
  parent.insertAdjacentHTML("beforeend", `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, d = spread * (0.55 + Math.random() * 0.6);
    return `<rect class="${cls}" x="${-size / 2}" y="${-size / 4}" width="${size}" height="${size / 2}" fill="${colors[i % colors.length]}" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d - spread * 0.3).toFixed(1)}px;--r:${Math.round(Math.random() * 720 - 360)}deg"/>`;
  }).join("")}</g>`);
  const g = parent.lastElementChild; setTimeout(() => g.remove(), 900);
}
// 필름 질감 (한 번만 만들어 CSS 변수로)
function ensureGrain() {
  if (document.documentElement.style.getPropertyValue("--mg-grain")) return;
  try {
    const c = document.createElement("canvas"); c.width = c.height = 96;
    const x = c.getContext("2d"), d = x.createImageData(96, 96);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    document.documentElement.style.setProperty("--mg-grain", `url(${c.toDataURL()})`);
  } catch { /* 캔버스가 없으면 질감 없이 */ }
}

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
    ensureGrain();
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
  defend: (area, tall) => { area.innerHTML = `<div class="mgd-wrap">${defendScene(tall)}</div>`; },
  sprint: (area, tall) => { area.innerHTML = sprintScene(tall); area.querySelectorAll("#spMeb, #spR1b, #spR2b").forEach((g, i) => spDraw(g, 0.6 + i)); },
};

// ── 슈팅 ────────────────────────────
// 야간 경기장, 원근감 있는 골문, 움직이는 골키퍼. 좌표: 가로 160 × 세로 96
const GX0 = 30, GX1 = 130, GTOP = 20, GLINE = 62;   // 골대 안쪽 왼쪽·오른쪽, 크로스바, 골라인
// tall: 세로 휴대폰에서는 좌우를 조금 잘라 내고 위(관중석 위층)와 아래(잔디)를 늘려 크게 보여 줌
function shootScene(tall = false) {
  const rowsY = tall ? [-27, -21.4, -15.8, -10.2, 13.6, 19.2, 24.8, 30.2] : [13.6, 19.2, 24.8, 30.2];
  const crowd = crowdRows(rowsY, 46, 3.6, 3);
  const Y0 = tall ? -40 : 0, H = tall ? 160 : 96, YB = tall ? 120 : 96;
  // 잔디: 가로 줄무늬 + 소실점으로 모이는 세로 줄무늬(체크 무늬) + 골문 앞 빛 웅덩이
  const stripes = [[40, 45], [45, 51], [51, 58], [58, 66], [66, 76], [76, 88], [88, 96], ...(tall ? [[96, 106], [106, 120]] : [])]
    .map(([y0, y1], i) => `<rect x="0" y="${y0}" width="160" height="${y1 - y0}" fill="${i % 2 ? "#187A41" : "#1D8A4A"}"/>`).join("");
  const VP = [80, -30];
  const fan = Array.from({ length: 14 }, (_, i) => {
    const a = -150 + i * 32, b = a + 16, y = YB;
    const xa = VP[0] + (a - VP[0]) * 1, xb = VP[0] + (b - VP[0]) * 1;
    const t = (40 - VP[1]) / (y - VP[1]);
    return `<polygon points="${(VP[0] + (xa - VP[0]) * t).toFixed(1)},40 ${(VP[0] + (xb - VP[0]) * t).toFixed(1)},40 ${xb.toFixed(1)},${y} ${xa.toFixed(1)},${y}" fill="rgba(0,0,0,.06)"/>`;
  }).join("");
  return `<svg viewBox="${tall ? "20 -40 120 160" : "0 0 160 96"}" class="mg-svg mg-shoot">
    <defs>${COMMON_DEFS}${STADIUM_DEFS}
      <linearGradient id="shSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030A"/><stop offset=".55" stop-color="#0B1238"/><stop offset="1" stop-color="#18235E"/></linearGradient>
      <linearGradient id="shBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,244,210,.18)"/><stop offset="1" stop-color="rgba(255,244,210,0)"/></linearGradient>
      <linearGradient id="shPost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA4B8"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E6EAF2"/><stop offset="1" stop-color="#8994AA"/></linearGradient>
      <linearGradient id="shBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#DCE1EB"/><stop offset="1" stop-color="#8994AA"/></linearGradient>
      <pattern id="shNet" width="2.6" height="2.6" patternUnits="userSpaceOnUse"><path d="M0 0 L2.6 2.6 M2.6 0 L0 2.6" stroke="rgba(255,255,255,.34)" stroke-width=".22"/></pattern>
      <linearGradient id="shNetDepth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(4,8,24,.55)"/><stop offset="1" stop-color="rgba(4,8,24,.15)"/></linearGradient>
      <radialGradient id="shPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,252,225,.24)"/><stop offset="1" stop-color="rgba(255,252,225,0)"/></radialGradient>
      <radialGradient id="shVig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.6)"/></radialGradient>
      <linearGradient id="shKit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#93B81F"/><stop offset=".4" stop-color="#D3FA45"/><stop offset=".7" stop-color="#C6F432"/><stop offset="1" stop-color="#86A81A"/></linearGradient>
      <linearGradient id="shTrail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgba(255,255,255,0)"/><stop offset="1" stop-color="rgba(255,236,170,.9)"/></linearGradient>
      <filter id="shGlow"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shSoft"><feGaussianBlur stdDeviation=".6"/></filter>
    </defs>
    <rect y="${Y0}" width="160" height="${H}" fill="url(#shSky)"/>
    ${tall ? `<path d="M0 -36 H160 V-4 H0 Z" fill="#0A1030"/><rect x="0" y="-4" width="160" height="1.6" fill="#FF6B1A" opacity=".75"/>` : ""}
    <!-- 지붕과 조명탑 -->
    <path d="M-10 ${tall ? -40 : 0} H170 V${tall ? -36 : 3.2} Q80 ${tall ? -33 : 6} -10 ${tall ? -36 : 3.2} Z" fill="#05081A"/>
    <path d="M14 4 L-14 62 L50 62 Z" fill="url(#shBeam)"/><path d="M146 4 L110 62 L174 62 Z" fill="url(#shBeam)"/>
    ${floodBank(14, 5)}${floodBank(146, 5)}
    <!-- 관중석 -->
    <path d="M0 10 H160 V34 H0 Z" fill="#0A1134"/>
    <g>${crowd}</g>
    <rect x="0" y="22" width="160" height="12" fill="url(#mgHaze)"/>
    <g fill="#FF6B1A" opacity=".85"><path d="M22 11 l5 1.6 -5 1.6 z"/><path d="M71 11 l5 1.6 -5 1.6 z"/><path d="M118 11 l5 1.6 -5 1.6 z"/></g>
    ${boards(34, 6)}
    <!-- 잔디 -->
    ${stripes}${fan}
    <ellipse cx="80" cy="66" rx="70" ry="16" fill="url(#shPool)"/>
    <g fill="none" stroke="rgba(255,255,255,.78)" stroke-width=".55">
      <path d="M0 ${GLINE} H160"/>
      <path d="M20 ${GLINE} L12 72 H148 L140 ${GLINE}"/>
      <path d="M2 ${GLINE} L-14 92"/><path d="M158 ${GLINE} L174 92"/>
      <path d="M58 72 Q80 78 102 72" opacity=".7"/>
    </g>
    <ellipse cx="80" cy="84" rx="1.2" ry=".5" fill="#fff" opacity=".8"/>
    <!-- 골대 그림자 -->
    <path d="M${GX0 + 1.2} ${GLINE} L${GX0 + 9} ${GLINE + 6} L${GX0 + 10.6} ${GLINE + 6} L${GX0 + 2.6} ${GLINE} Z M${GX1 - 1} ${GLINE} L${GX1 + 7} ${GLINE + 6} L${GX1 + 8.6} ${GLINE + 6} L${GX1 + 0.4} ${GLINE} Z" fill="rgba(0,0,0,.25)"/>
    <!-- 골문: 뒷그물(깊이 음영), 옆그물, 지붕 그물 -->
    <g id="shNetG">
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} H${GX0 + 6} Z" fill="url(#shNetDepth)"/>
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} H${GX0 + 6} Z" fill="url(#shNet)"/>
      <path d="M${GX0} ${GTOP} L${GX0 + 6} ${GTOP + 7} V${GLINE - 6} L${GX0} ${GLINE} Z" fill="url(#shNet)" opacity=".85"/>
      <path d="M${GX1} ${GTOP} L${GX1 - 6} ${GTOP + 7} V${GLINE - 6} L${GX1} ${GLINE} Z" fill="url(#shNet)" opacity=".85"/>
      <path d="M${GX0} ${GTOP} H${GX1} L${GX1 - 6} ${GTOP + 7} H${GX0 + 6} Z" fill="url(#shNet)" opacity=".75"/>
      <path d="M${GX0 + 6} ${GLINE - 6} H${GX1 - 6} L${GX1} ${GLINE} H${GX0} Z" fill="rgba(0,0,0,.22)"/>
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} M${GX0 + 6} ${GTOP + 7} V${GLINE - 6}" fill="none" stroke="rgba(255,255,255,.4)" stroke-width=".45"/>
    </g>
    <!-- 골대 (둥근 기둥 음영) -->
    <path d="M${GX0} ${GLINE + .6} V${GTOP} H${GX1} V${GLINE + .6}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3.2" transform="translate(.8,.8)"/>
    <rect x="${GX0 - 1.3}" y="${GTOP - 1.3}" width="2.6" height="${GLINE - GTOP + 1.9}" fill="url(#shPost)"/>
    <rect x="${GX1 - 1.3}" y="${GTOP - 1.3}" width="2.6" height="${GLINE - GTOP + 1.9}" fill="url(#shPost)"/>
    <rect x="${GX0 - 1.3}" y="${GTOP - 1.3}" width="${GX1 - GX0 + 2.6}" height="2.6" fill="url(#shBar)"/>
    <!-- 골키퍼 -->
    <g transform="translate(0,${GLINE})"><g id="gk" class="mg-gkmove" style="transform:translateX(80px)"><g class="mg-keeper"><g class="mg-gkidle">
      <ellipse cx="0" cy=".6" rx="9" ry="1.6" fill="rgba(0,0,0,.4)" filter="url(#shSoft)"/>
      <path d="M-4.6 -11.4 L-5.4 -4.2 L-2.2 -4.2 L-1.2 -9.6 Z" fill="#1A1F2A"/><path d="M4.6 -11.4 L5.4 -4.2 L2.2 -4.2 L1.2 -9.6 Z" fill="#1A1F2A"/>
      <path d="M-5.4 -4.4 H-2.1 L-2.3 -.9 H-5.2 Z" fill="url(#shKit)"/><path d="M2.1 -4.4 H5.4 L5.2 -.9 H2.3 Z" fill="url(#shKit)"/>
      <path d="M-6.2 -1.2 Q-6.2 .4 -4.4 .4 H-1.8 L-2 -1.2 Z" fill="#0D0F14"/><path d="M6.2 -1.2 Q6.2 .4 4.4 .4 H1.8 L2 -1.2 Z" fill="#0D0F14"/>
      <path d="M-5.3 -12.6 H5.3 L4.8 -9.4 Q0 -8.4 -4.8 -9.4 Z" fill="#141821"/>
      <path d="M-6.2 -24.2 Q0 -26.4 6.2 -24.2 L5.7 -11.8 Q0 -10.8 -5.7 -11.8 Z" fill="url(#shKit)" stroke="#7C9A16" stroke-width=".35"/>
      <path d="M-6 -21 L6 -21 M-5.8 -18.4 L5.8 -18.4" stroke="rgba(20,40,0,.18)" stroke-width=".6"/>
      <path d="M-6.1 -24.2 L-14 -27.4 L-15.2 -24.8 L-6.5 -20.2 Z" fill="url(#shKit)" stroke="#7C9A16" stroke-width=".35"/>
      <path d="M6.1 -24.2 L14 -27.4 L15.2 -24.8 L6.5 -20.2 Z" fill="url(#shKit)" stroke="#7C9A16" stroke-width=".35"/>
      <path d="M-13.4 -27.6 L-14.6 -24.8" stroke="#141821" stroke-width=".9"/><path d="M13.4 -27.6 L14.6 -24.8" stroke="#141821" stroke-width=".9"/>
      <g><circle cx="-15.8" cy="-26.8" r="2.6" fill="#F4F6FF" stroke="#FF6B1A" stroke-width=".8"/><path d="M-17.6 -28.2 Q-15.8 -30.2 -14 -28.2" stroke="#FF6B1A" stroke-width=".6" fill="none"/></g>
      <g><circle cx="15.8" cy="-26.8" r="2.6" fill="#F4F6FF" stroke="#FF6B1A" stroke-width=".8"/><path d="M14 -28.2 Q15.8 -30.2 17.6 -28.2" stroke="#FF6B1A" stroke-width=".6" fill="none"/></g>
      <text y="-15.2" text-anchor="middle" font-size="5.4" font-weight="800" fill="#141821" font-family="Barlow Condensed, sans-serif">1</text>
      <rect x="-1.5" y="-26.8" width="3" height="2.6" fill="#D9A47E"/>
      <circle cy="-29.8" r="3.7" fill="url(#mgSkin)"/>
      <path d="M-3.8 -30.4 Q-3.6 -34.6 0 -34.2 Q3.8 -34.6 3.8 -30.4 Q2.2 -32.2 0 -32 Q-2.2 -32.2 -3.8 -30.4 Z" fill="#17171C"/>
      <path d="M-2 -30.6 h1.2 M.8 -30.6 h1.2" stroke="#2A1E18" stroke-width=".45" stroke-linecap="round"/>
      <circle cx="-1.3" cy="-29.4" r=".45" fill="#17171C"/><circle cx="1.3" cy="-29.4" r=".45" fill="#17171C"/>
      <path d="M-1 -27.6 Q0 -27.2 1 -27.6" stroke="#8A4A38" stroke-width=".4" fill="none" stroke-linecap="round"/>
    </g></g></g></g>
    <!-- 남은 공 자국 -->
    <g id="balls"></g>
    <g id="shTrailG"></g>
    <!-- 조준점 -->
    <g id="aim" transform="translate(80,40)" filter="url(#shGlow)">
      <circle r="4.6" fill="rgba(255,201,60,.12)" stroke="#FFC93C" stroke-width=".7"/>
      <circle r="1" fill="#FFC93C"/>
      <path d="M-7.4 0 H-5.4 M5.4 0 H7.4 M0 -7.4 V-5.4 M0 5.4 V7.4" stroke="#FFC93C" stroke-width=".8" stroke-linecap="round"/>
      <circle r="6.4" fill="none" stroke="rgba(255,201,60,.45)" stroke-width=".35" stroke-dasharray="2 2.2" class="mg-aimspin"/>
    </g>
    <!-- 공 -->
    <ellipse id="sshadow" cx="80" cy="88.2" rx="3.4" ry="1" fill="rgba(0,0,0,.45)" filter="url(#shSoft)"/>
    <g transform="translate(80,85.6)"><g id="sball">${BALL(2.9)}</g></g>
    <g id="shFx"></g>
    <text id="shMsg" x="80" y="52" text-anchor="middle" class="mg-shmsg"></text>
    <rect y="${Y0}" width="160" height="${H}" fill="url(#shVig)" pointer-events="none"/>
    <rect id="shFlash" y="${Y0}" width="160" height="${H}" fill="#FFF6D8" opacity="0" pointer-events="none"/>
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
  let shot = 0, score = 0, x = MID, y = 40, t0 = performance.now(), raf, anim, lock = false, gkC = MID, gkBase = MID, gkPh = Math.random() * 6;
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
    // 공은 휘어지는 궤적(2차 베지어)을 따라 날아가며 작아지고, 그림자는 땅 위를 따라감.
    // 막히면 골키퍼 손에 맞고 바깥으로 튕겨 떨어지고, 들어가면 그물에 걸려 골라인 안쪽에 떨어짐
    const cx0 = 80 + (x - 80) * 0.35, cy0 = 84 - (84 - y) * 0.15 - 18;
    const put = (bx, by, sc, rot, gy, so) => {
      ball.style.transition = "none"; shadow.style.transition = "none";
      ball.style.transform = `translate(${(bx - 80).toFixed(2)}px, ${(by - 85.6).toFixed(2)}px) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(0)}deg)`;
      shadow.style.transform = `translate(${((bx - 80) * 0.95).toFixed(2)}px, ${(gy - 88).toFixed(2)}px) scale(${(sc * 0.95).toFixed(3)})`; shadow.style.opacity = so.toFixed(2);
    };
    const tween = (ms, f, then) => {
      const st = performance.now();
      const step = now => { const u = Math.min(1, (now - st) / ms); f(u); if (u < 1) anim = requestAnimationFrame(step); else then?.(); };
      anim = requestAnimationFrame(step);
    };
    const sideOut = x < gkC ? -1 : 1;
    tween(330, u => {
      const k = 1 - (1 - u) * (1 - u), a = 1 - k;
      const bx = a * a * 80 + 2 * a * k * cx0 + k * k * x, by = a * a * 85.6 + 2 * a * k * cy0 + k * k * y;
      put(bx, by, 1 - 0.45 * k, 540 * k, 88 + (GLINE - 88) * k, 1 - 0.6 * k);
    }, () => {
      if (saved) tween(470, u => {                       // 손에 맞고 바깥·아래로 튕김 (포물선)
        const bx = x + sideOut * 20 * u, by = y - 10 * Math.sin(u * Math.PI) + (GLINE + 5 - y) * u * u;
        put(bx, by, 0.55 + 0.08 * u, 540 + 400 * u * sideOut, GLINE + 5 * u, 0.4);
      });
      else tween(480, u => {                             // 그물에 걸려 멈췄다가 떨어지며 한 번 튐
        const fall = u < 0.7 ? (u / 0.7) ** 2 : 1 - 0.12 * Math.sin((u - 0.7) / 0.3 * Math.PI);
        const bx = x + (MID - x) * 0.06 * u, by = y + 2 + (GLINE - 3 - y - 2) * fall;
        put(bx, by, 0.55 - 0.05 * u, 540 + 120 * u, GLINE - 3, 0.4);
      });
    });
    // 막을 때는 공 쪽으로 정확히, 먹힐 때는 한 박자 늦게 짧게 몸을 날림
    const dx = Math.max(-26, Math.min(26, (x - gkC) * (saved ? 1 : 0.45)));
    const high = Math.max(0, Math.min(1, (GLINE - y - 10) / 26));          // 높은 공일수록 위로 뜀
    const rot = Math.max(-75, Math.min(75, dx * (2 + high * 1.5)));
    keeper.style.transform = `translate(${dx * 0.7}px, ${-high * 8}px) rotate(${rot}deg)`;
    const d = dots[shot]; d.className = saved ? "miss" : corner ? "top" : "hit";
    shot++;
    pts.textContent = `${score}점`;
    status.innerHTML = `<b class="${saved ? "down" : "up"}">${saved ? "막혔다!" : corner ? "구석! +2" : "골! +1"}</b>`;
    // 공 궤적
    const trailG = area.querySelector("#shTrailG"), fxG = area.querySelector("#shFx");
    const cx = 80 + (x - 80) * 0.35, cy = 84 - (84 - y) * 0.15 - 18;
    trailG.insertAdjacentHTML("beforeend", `<path class="mg-trail" d="M80 84 Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}" stroke="rgba(255,236,170,.75)" stroke-width="1.6"/><path class="mg-trail" d="M80 84 Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}" stroke="rgba(255,255,255,.9)" stroke-width=".5"/>`);
    setTimeout(() => { trailG.innerHTML = ""; }, 600);
    setTimeout(() => {
      if (saved) burst(fxG, x, y, { n: 10, colors: ["#FFFFFF", "#C6F432", "#DDE3FF"], spread: 9, size: .9 });
      else {
        burst(fxG, x, y, { n: corner ? 22 : 16, spread: corner ? 22 : 16 });
        const fl = area.querySelector("#shFlash"); fl.classList.remove("mg-flash"); void fl.getBoundingClientRect(); fl.classList.add("mg-flash");
        area.classList.remove("mg-shake"); void area.offsetWidth; area.classList.add("mg-shake");
      }
    }, 330);
    setTimeout(() => {
      msg.textContent = saved ? "SAVE" : "GOAL";
      msg.setAttribute("class", `mg-shmsg show ${saved ? "save" : "goal"}`);
      if (!saved) { net.classList.remove("ripple"); void net.getBoundingClientRect(); net.classList.add("ripple"); }
    }, 300);
    setTimeout(() => {
      area.querySelector("#balls").insertAdjacentHTML("beforeend", `<g transform="translate(${x},${y}) scale(.42)" opacity="${saved ? .35 : .7}">${BALL(2.9)}</g>`);
      cancelAnimationFrame(anim);
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
  return () => { cancelAnimationFrame(raf); cancelAnimationFrame(anim); document.removeEventListener("keydown", key); };
}

// ── 패스 ────────────────────────────
// 야간 경기장을 위에서 본 화면. 판정은 누른 순간에 끝나고, 공은 그 뒤를 따라 실제로 굴러가거나 떠서 날아감
// 좌표: 가로 160 × 세로 96
function passPitch() {
  // 잔디: 세로 줄무늬 + 가로 줄무늬를 겹친 체크 무늬, 네 귀퉁이 조명탑의 빛 웅덩이
  const stripes = Array.from({ length: 10 }, (_, i) => `<rect x="${i * 16}" y="0" width="16" height="96" fill="${i % 2 ? "#1A7C44" : "#1F8C4D"}"/>`).join("");
  const cross = Array.from({ length: 6 }, (_, i) => i % 2 ? `<rect x="0" y="${i * 16}" width="160" height="16" fill="rgba(255,255,255,.035)"/>` : "").join("");
  return `<defs>${COMMON_DEFS}
      <radialGradient id="psPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,248,215,.2)"/><stop offset="1" stop-color="rgba(255,248,215,0)"/></radialGradient>
      <radialGradient id="psFlood" cx=".5" cy=".46" r=".7"><stop offset="0" stop-color="rgba(255,250,225,.14)"/><stop offset="1" stop-color="rgba(255,250,225,0)"/></radialGradient>
      <radialGradient id="psVig" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(2,6,20,.62)"/></radialGradient>
      <pattern id="psNet" width="1.4" height="1.4" patternUnits="userSpaceOnUse"><path d="M0 0 L1.4 1.4 M1.4 0 L0 1.4" stroke="rgba(255,255,255,.5)" stroke-width=".18"/></pattern>
      <filter id="psSoft"><feGaussianBlur stdDeviation=".7"/></filter>
    </defs>
    ${stripes}${cross}
    <rect width="160" height="96" fill="url(#psFlood)"/>
    <ellipse cx="6" cy="6" rx="62" ry="44" fill="url(#psPool)"/><ellipse cx="154" cy="6" rx="62" ry="44" fill="url(#psPool)"/>
    <ellipse cx="6" cy="90" rx="62" ry="44" fill="url(#psPool)"/><ellipse cx="154" cy="90" rx="62" ry="44" fill="url(#psPool)"/>
    <g fill="none" stroke="rgba(255,255,255,.7)" stroke-width=".55">
      <rect x="3" y="3" width="154" height="90"/><path d="M80 3 V93"/><circle cx="80" cy="48" r="13"/>
      <rect x="3" y="26" width="20" height="44"/><rect x="137" y="26" width="20" height="44"/>
      <rect x="3" y="37" width="7" height="22"/><rect x="150" y="37" width="7" height="22"/>
      <path d="M23 41 A8 8 0 0 1 23 55"/><path d="M137 41 A8 8 0 0 0 137 55"/>
      <path d="M3 6 A3 3 0 0 0 6 3 M154 3 A3 3 0 0 0 157 6 M3 90 A3 3 0 0 1 6 93 M154 93 A3 3 0 0 1 157 90"/>
    </g>
    <circle cx="80" cy="48" r=".9" fill="rgba(255,255,255,.75)"/><circle cx="16" cy="48" r=".6" fill="rgba(255,255,255,.7)"/><circle cx="144" cy="48" r=".6" fill="rgba(255,255,255,.7)"/>
    <g><rect x="-1.6" y="43" width="4.4" height="10" fill="url(#psNet)"/><rect x="157.2" y="43" width="4.4" height="10" fill="url(#psNet)"/>
      <path d="M2.8 43 V53 M157.2 43 V53" stroke="#fff" stroke-width=".9"/></g>
    <g fill="#FF6B1A"><path d="M3 3 v-3 l2.4 1 z"/><path d="M157 3 v-3 l-2.4 1 z"/><path d="M3 93 v3 l2.4 -1 z"/><path d="M157 93 v3 l-2.4 -1 z"/></g>`;
}
// 위에서 살짝 비스듬히 본 선수 (네 조명탑이 만드는 겹그림자, 음영 있는 유니폼, 머리 하이라이트)
function passPlayer(us, num) {
  const fill = us ? "url(#mgShirtO)" : "url(#mgShirtW)", edge = us ? "#FFD7B8" : "#2D3FD1", txt = us ? "#fff" : "#1F2C8F", shorts = us ? "url(#mgNavy)" : "url(#mgBlue)";
  return `<ellipse cx="2.2" cy="9.2" rx="5.4" ry="1.5" fill="rgba(0,0,0,.22)" filter="url(#psSoft)" transform="rotate(14 2.2 9.2)"/>
    <ellipse cx="-1.6" cy="9.6" rx="5.4" ry="1.5" fill="rgba(0,0,0,.22)" filter="url(#psSoft)" transform="rotate(-14 -1.6 9.6)"/>
    <ellipse cx=".3" cy="9.7" rx="4.2" ry="1.3" fill="rgba(0,0,0,.35)"/>
    <g class="mgp-body">
      <rect x="-3" y="7.6" width="2.2" height="2" rx=".6" fill="#111"/><rect x=".8" y="7.6" width="2.2" height="2" rx=".6" fill="#111"/>
      <rect x="-3.7" y="5.2" width="3.1" height="3.6" rx=".9" fill="${shorts}"/><rect x=".6" y="5.2" width="3.1" height="3.6" rx=".9" fill="${shorts}"/>
      ${SHIRT(fill, edge, num, txt)}
      <path d="M-2 -6 Q0 -4.9 2 -6" fill="none" stroke="${us ? "#1F2C8F" : "#2D3FD1"}" stroke-width=".7"/>
      <circle cy="-8.4" r="2.6" fill="url(#mgSkin)"/>
      <path d="M-2.7 -9 Q-2.4 -11.6 0 -11.4 Q2.5 -11.6 2.7 -9 Q1.3 -10.2 0 -10.1 Q-1.3 -10.2 -2.7 -9 Z" fill="#17171C"/>
      <path d="M-1.4 -10.8 Q0 -11.3 1.2 -10.9" stroke="rgba(255,255,255,.25)" stroke-width=".4" fill="none"/>
      <circle cx="-.9" cy="-8" r=".32" fill="#1B1B1F"/><circle cx=".9" cy="-8" r=".32" fill="#1B1B1F"/>
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
      lines.insertAdjacentHTML("beforeend", `<line x1="${last.x.toFixed(1)}" y1="${last.y.toFixed(1)}" x2="${s.x.toFixed(1)}" y2="${s.y.toFixed(1)}" class="mgp-glow"/><line x1="${last.x.toFixed(1)}" y1="${last.y.toFixed(1)}" x2="${s.x.toFixed(1)}" y2="${s.y.toFixed(1)}" class="mgp-trail"/>`);
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
    burst(fx, +m[1], +m[2], { n: 10, colors: ["#FF3B4E", "#FFFFFF"], spread: 10, size: .9 });
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
  const shirt = front ? SHIRT("url(#mgShirtW)", "#2D3FD1", null) : SHIRT("url(#mgShirtO)", "#FFD7B8", null);
  const shorts = front ? "url(#mgBlue)" : "url(#mgNavy)", sock = front ? "#F4F6FF" : "#FF6B1A", sleeve = front ? "#E9ECF6" : "#F06318";
  const arm = side => `<g class="mgd-arm${side}"><rect x="${side === "L" ? -6.6 : 4.6}" y="-20.6" width="2" height="5.6" rx=".9" fill="${sleeve}"/><rect x="${side === "L" ? -6.4 : 4.8}" y="-15.6" width="1.7" height="4.6" rx=".8" fill="url(#mgSkin)"/></g>`;
  return `<ellipse cx="0" cy="0" rx="6" ry="1.6" fill="rgba(0,0,0,.4)"/>
    <g class="mgd-arms">${arm("L")}${arm("R")}</g>
    <g ${legId ? `id="${legId}"` : ""} class="mgd-legs">
      <g class="mgd-legL"><rect x="-3.2" y="-8" width="2.4" height="8" rx="1" fill="#E8B88C"/><rect x="-3.3" y="-4" width="2.6" height="3.4" fill="${sock}"/><ellipse cx="-2" cy="-.4" rx="2" ry="1" fill="#111"/></g>
      <g class="mgd-legR"><rect x=".8" y="-8" width="2.4" height="8" rx="1" fill="#E8B88C"/><rect x=".7" y="-4" width="2.6" height="3.4" fill="${sock}"/><ellipse cx="2" cy="-.4" rx="2" ry="1" fill="#111"/></g>
    </g>
    <rect x="-4" y="-11" width="8" height="4" rx="1" fill="${shorts}"/>
    <g transform="translate(0,-16.5) scale(1.05)">${shirt}</g>
    <circle cy="-25" r="3.2" fill="url(#mgSkin)"/>
    ${front ? `<path d="M-3.3 -25.6 Q-3 -29 0 -28.8 Q3.1 -29 3.3 -25.6 Q1.6 -27.2 0 -27 Q-1.6 -27.2 -3.3 -25.6 Z" fill="#1B1B1F"/>
      <path d="M-2 -25.3 h1.2 M.8 -25.3 h1.2" stroke="#2A1E18" stroke-width=".45" stroke-linecap="round"/>
      <circle cx="-1.3" cy="-24.3" r=".42" fill="#1B1B1F"/><circle cx="1.3" cy="-24.3" r=".42" fill="#1B1B1F"/>
      <path d="M-1 -22.6 Q0 -22.2 1 -22.6" stroke="#8A4A38" stroke-width=".4" fill="none" stroke-linecap="round"/>
      <ellipse cx="-3.2" cy="-24.8" rx=".5" ry=".8" fill="#D99E76"/><ellipse cx="3.2" cy="-24.8" rx=".5" ry=".8" fill="#D99E76"/>`
            : `<path d="M-3.3 -24.4 Q-3.4 -29 0 -28.8 Q3.4 -29 3.3 -24.4 Q1.6 -23.6 0 -23.8 Q-1.6 -23.6 -3.3 -24.4 Z" fill="#1B1B1F"/>`}`;
}
function drCone() {
  return `<ellipse cx="0" cy="0" rx="4.6" ry="1.3" fill="rgba(0,0,0,.4)"/><path d="M-4.4 0 H4.4 L3.6 -1.2 H-3.6 Z" fill="#E2560C"/>
    <path d="M-3 -1.2 L0 -11 L3 -1.2 Z" fill="#FF7A1F"/><path d="M-2 -4.4 H2 L1.5 -6.4 H-1.5 Z" fill="#fff"/>`;
}
function dribbleScene(tall = false) {
  drSetup(tall);
  const rows = tall ? Math.floor((DRB.HOR - 18) / 4.2) : 2, L1 = tall ? 26 : 10, L2 = tall ? 134 : 150;
  const crowd = crowdRows(Array.from({ length: rows }, (_, row) => 11.6 + row * 4.2), 46, 3.55, 5);
  const edge = (o, y) => drX(o, y).toFixed(2);
  return `<svg viewBox="${DR_VB}" class="mg-svg mgd">
    <defs>${COMMON_DEFS}${STADIUM_DEFS}
      <linearGradient id="drGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F4F2B"/><stop offset=".35" stop-color="#16703D"/><stop offset="1" stop-color="#1D8B4B"/></linearGradient>
      <radialGradient id="drPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,250,220,.2)"/><stop offset="1" stop-color="rgba(255,250,220,0)"/></radialGradient>
      <linearGradient id="drSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030A"/><stop offset="1" stop-color="#16225E"/></linearGradient>
      <radialGradient id="drFlood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6DA"/><stop offset=".3" stop-color="rgba(255,240,200,.5)"/><stop offset="1" stop-color="rgba(255,240,200,0)"/></radialGradient>
      <linearGradient id="drFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(5,8,26,.75)"/><stop offset=".3" stop-color="rgba(5,8,26,0)"/></linearGradient>
      <radialGradient id="drVig" cx=".5" cy=".6" r=".8"><stop offset=".6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.5)"/></radialGradient>
    </defs>
    <rect width="160" height="${DRB.BOT}" fill="url(#drSky)"/>
    <path d="M0 9 H160 V${DRB.HOR} H0 Z" fill="#0A1134"/>${crowd}
    <rect x="0" y="${DRB.HOR - 10}" width="160" height="6" fill="url(#mgHaze)"/>
    ${boards(DRB.HOR - 4, 4)}
    ${floodBank(L1, 4.5, 10)}${floodBank(L2, 4.5, 10)}
    <rect x="0" y="${DRB.HOR}" width="160" height="${DRB.BOT - DRB.HOR}" fill="url(#drGrass)"/>
    <ellipse cx="80" cy="${DR_ME_Y.toFixed(1)}" rx="70" ry="${((DRB.BOT - DRB.HOR) * 0.45).toFixed(1)}" fill="url(#drPool)"/>
    <g id="drStripes"></g><g id="drSpeed"></g>
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
  const speedG = area.querySelector("#drSpeed");
  const SL = [-1.55, -1.25, -0.95, 2.95, 3.25, 3.55];
  speedG.innerHTML = SL.map(() => `<line class="mg-speed"/>`).join("");
  const slines = [...speedG.children];
  const armsMe = area.querySelector("#drMe .mgd-arms");
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
    // 양옆 속도선
    slines.forEach((ln, i) => {
      const a = ((i * 0.37 + phase * 2.2) % 1) * 120 - 10, ya = drY(a), yb = Math.min(DRB.BOT, drY(a + 7));
      if (ya >= DRB.BOT) { ln.setAttribute("x1", 0); ln.setAttribute("x2", 0); ln.setAttribute("y1", 0); ln.setAttribute("y2", 0); return; }
      ln.setAttribute("x1", drX(SL[i], ya).toFixed(1)); ln.setAttribute("y1", ya.toFixed(1)); ln.setAttribute("x2", drX(SL[i], yb).toFixed(1)); ln.setAttribute("y2", yb.toFixed(1));
      ln.setAttribute("stroke-width", (0.25 + drS(yb) * 0.5).toFixed(2));
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
        const am = f.body.querySelector(".mgd-arms");
        if (am) { am.children[0].setAttribute("transform", `rotate(${(-sw * 0.9).toFixed(1)} -5.6 -20)`); am.children[1].setAttribute("transform", `rotate(${(sw * 0.9).toFixed(1)} 5.6 -20)`); }
      }
      if (!f.hit && f.y > 74 && f.y < 92 && f.l === lane) {
        f.hit = true; hits++; stumble = 1;
        f.el.classList.add("hit");
        if (!f.cone) f.body.setAttribute("transform", `translate(${f.l > lane ? -4 : 4},2) rotate(${f.l >= 1 ? -62 : 62})`);   // 태클
        lanes.classList.remove("shake"); void lanes.offsetWidth; lanes.classList.add("shake");
        dust(px, DR_ME_Y, 1.4);
        burst(fxG, px, DR_ME_Y - 8, { n: 9, colors: ["#FFFFFF", "#FF3B4E", "#DDE3FF"], spread: 10, size: 1 });
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
    if (armsMe) { armsMe.children[0].setAttribute("transform", `rotate(${(-sw * 0.9).toFixed(1)} -5.6 -20)`); armsMe.children[1].setAttribute("transform", `rotate(${(sw * 0.9).toFixed(1)} 5.6 -20)`); }
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
const wtSetup = tall => { WT = tall ? { CX: 71, CY: 118, K: 0.8, VB: "20 0 102 150", H: 150, BX: 26, DX: 34, Z: 1.14 } : { CX: 129, CY: 44, K: 0.8, VB: "0 0 160 96", H: 96, BX: 8, DX: 14, Z: 1.14 }; };
const wtZ = pt => [72 + (pt[0] - 72) * WT.Z, 78 + (pt[1] - 78) * WT.Z];      // 선수 그룹 좌표 → 화면 좌표
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
      <linearGradient id="wtMirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3466"/><stop offset=".5" stop-color="#1A2250"/><stop offset="1" stop-color="#121838"/></linearGradient>
      <linearGradient id="wtCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,240,205,.2)"/><stop offset="1" stop-color="rgba(255,240,205,.02)"/></linearGradient>
      <linearGradient id="wtFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1E30"/><stop offset="1" stop-color="#0B0D16"/></linearGradient>
      <linearGradient id="wtShirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C94A0C"/><stop offset=".45" stop-color="#FF7A2A"/><stop offset="1" stop-color="#E35A12"/></linearGradient>
      <linearGradient id="wtShorts" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#121A5A"/><stop offset=".5" stop-color="#2A3AA8"/><stop offset="1" stop-color="#141E66"/></linearGradient>
      ${COMMON_DEFS}
      <filter id="wtGlow"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="160" height="${WT.H}" fill="url(#wtWall)"/>${bricks}
    <rect x="0" y="9" width="160" height="5" fill="#FF6B1A" opacity=".85"/><rect x="0" y="14" width="160" height="1.2" fill="#1F2C8F"/>
    <text x="${WT.BX}" y="12.9" class="mgw-banner">GOHEUNG FC · STRENGTH</text>
    <!-- 거울과 벽 소품 -->
    <rect x="96" y="22" width="${tall ? 22 : 58}" height="40" rx="1" fill="url(#wtMirror)" stroke="#2B3355" stroke-width=".8"/>
    <path d="M100 24 L106 24 L98 60 L96 60 Z M110 24 L113 24 L105 60 L102 60 Z" fill="rgba(255,255,255,.05)"/>
    <g transform="translate(${tall ? 34 : 24},28)"><rect x="-9" y="-6" width="18" height="12" rx="1" fill="#1A2048" stroke="#FF6B1A" stroke-width=".5"/>
      <text y="-1" text-anchor="middle" class="mgw-poster">땀은</text><text y="3.4" text-anchor="middle" class="mgw-poster">배신하지 않는다</text></g>
    <g transform="translate(${tall ? 40 : 34},52)">${[0, 1, 2].map(i => `<rect x="${-7 + i * 5}" y="-1" width="1" height="8" fill="#5C6680"/><circle cx="${-6.5 + i * 5}" cy="${2 + (i % 2)}" r="${3.4 - i * 0.6}" fill="url(#wtPlate)" stroke="#2B3047" stroke-width=".4"/>`).join("")}</g>
    <!-- 천장 조명 -->
    <g transform="translate(72,15.2)"><rect x="-9" y="0" width="18" height="1.6" rx=".5" fill="#2B3047"/><rect x="-8" y="1.4" width="16" height=".9" fill="#FFF8E2"/></g>
    <path d="M64 17 L80 17 L104 78 L40 78 Z" fill="url(#wtCone)"/>
    <!-- 바닥 매트 -->
    <rect x="0" y="78" width="160" height="${WT.H - 78}" fill="url(#wtFloor)"/>
    <rect x="0" y="78" width="160" height="2.4" fill="rgba(255,255,255,.035)"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 20} 78 L${i * 20 - 6} ${WT.H}" stroke="rgba(255,255,255,.06)" stroke-width=".5"/>`).join("")}
    <path d="M0 78 H160" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>
    <!-- 덤벨 거치대와 초크통 -->
    <g transform="translate(${WT.DX},70)"><rect x="-10" y="0" width="22" height="8" rx="1" fill="#1D2236"/>${[-6, 0, 6].map(x => `<g transform="translate(${x + 1},-1)"><rect x="-3" y="-.8" width="6" height="1.6" fill="#8A93AA"/><rect x="-3.6" y="-2.2" width="1.8" height="4.4" rx=".5" fill="#2B3047"/><rect x="1.8" y="-2.2" width="1.8" height="4.4" rx=".5" fill="#2B3047"/></g>`).join("")}</g>
    <g transform="translate(100,78)"><path d="M-4 0 L-3 -6 H3 L4 0 Z" fill="#3A4060"/><ellipse cy="-6" rx="3.2" ry=".9" fill="#E9ECF5"/></g>
    <!-- 스쿼트 랙 -->
    <rect width="160" height="96" fill="url(#wtSpot)"/>
    <g transform="translate(72,78) scale(${WT.Z}) translate(-72,-78)">
    <g fill="url(#wtSteel)"><rect x="54" y="26" width="2.6" height="52" rx=".6"/><rect x="86" y="26" width="2.6" height="52" rx=".6"/></g>
    <rect x="54" y="26" width="34.6" height="2" rx=".6" fill="#5C6680"/>
    <rect x="52" y="58" width="39" height="1.6" rx=".6" fill="#8A93AA" opacity=".8"/>
    <ellipse cx="72" cy="78.4" rx="13" ry="1.6" fill="rgba(0,0,0,.5)" filter="url(#wtSoft)"/>
    <!-- 선수 -->
    <g id="wtBody" stroke-linejoin="round">
      <path id="wtShin" fill="url(#mgSkin)" stroke="#B9805C" stroke-width=".25"/>
      <path id="wtSock" fill="#FF6B1A"/>
      <path id="wtShoe" fill="#111"/>
      <path id="wtShoeHi" fill="none" stroke="#FF6B1A" stroke-width=".5"/>
      <path id="wtThigh" fill="url(#wtShorts)" stroke="#0E1446" stroke-width=".3"/>
      <path id="wtTorso" fill="url(#wtShirt)" stroke="#B4430B" stroke-width=".3"/>
      <path id="wtUpper" fill="#F06318"/>
      <path id="wtFore" fill="url(#mgSkin)"/>
      <circle id="wtHead" r="3.6" fill="url(#mgSkin)"/>
      <path id="wtHair" fill="#17171C"/>
      <circle id="wtEar" r=".8" fill="#D99E76"/>
      <path id="wtBand" fill="none" stroke="#FFFFFF" stroke-width=".9"/>
    </g>
    <!-- 바벨 (옆에서 보면 원판이 정면으로 보임) -->
    <g id="wtBar" transform="translate(${p.bar[0]},${p.bar[1]})"><g id="wtPlates">
      <circle cx="1" cy=".4" r="5.6" fill="#0B0C12"/>
      <circle r="5.6" fill="url(#wtPlate)" stroke="#FF6B1A" stroke-width="1.1"/>
      <text y="3.1" text-anchor="middle" class="mgw-kg">20KG</text>
      <circle r="3.9" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".4"/>
      <path d="M-3.6 -1.5 A3.9 3.9 0 0 1 -1 -3.7" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".5" stroke-linecap="round"/>
      <circle r="1.6" fill="url(#wtSteel)"/><circle r=".6" fill="#14161F"/>
    </g></g>
    </g>
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
// a에서 b로 가는 팔다리: 시작 굵기 wa, 끝 굵기 wb, 가운데가 bulge만큼 불룩한 근육 모양
function limb(a, b, wa, wb, bulge = 0.6) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], wm = (wa + wb) / 2 + bulge;
  const P = (pt, w, sgn) => `${(pt[0] + nx * w / 2 * sgn).toFixed(2)} ${(pt[1] + ny * w / 2 * sgn).toFixed(2)}`;
  return `M${P(a, wa, 1)} Q${P(m, wm * 1.08, 1)} ${P(b, wb, 1)} L${P(b, wb, -1)} Q${P(m, wm * 1.08, -1)} ${P(a, wa, -1)} Z`;
}
function wtDraw(root, q, tilt = 0) {
  const p = wtPose(q), $ = id => root.querySelector(id);
  $("#wtShin").setAttribute("d", limb(p.K, p.A, 4.4, 2.8, 1.1));
  const sk = [lerp(p.K[0], p.A[0], 0.7), lerp(p.K[1], p.A[1], 0.7)];
  $("#wtSock").setAttribute("d", limb(sk, [p.A[0], p.A[1] - 0.4], 3.5, 3, 0));
  $("#wtShoe").setAttribute("d", `M${p.A[0] - 2.6} ${p.A[1] + 1.4} Q${p.A[0] - 2.4} ${p.A[1] - 1.6} ${p.A[0]} ${p.A[1] - 1.5} H${p.A[0] + 2.4} Q${p.toe[0] + 0.6} ${p.toe[1] - 0.8} ${p.toe[0] + 0.4} ${p.toe[1] + 0.4} L${p.toe[0] + 0.4} ${p.toe[1] + 0.9} H${p.A[0] - 2.6} Z`);
  $("#wtShoeHi").setAttribute("d", `M${p.A[0] - 1.6} ${p.A[1] + 0.2} L${p.toe[0] - 0.6} ${p.toe[1] - 0.1}`);
  $("#wtThigh").setAttribute("d", limb(p.H, p.K, 6.6, 4.8, 1.2));
  // 몸통: 등은 곧게, 가슴은 둥글게
  const tdx = p.H[0] - p.S[0], tdy = p.H[1] - p.S[1], tl = Math.hypot(tdx, tdy), nx = -tdy / tl, ny = tdx / tl;
  const pt = (o, w) => [o[0] + nx * w, o[1] + ny * w];
  const s1 = pt(p.S, -3.9), s2 = pt(p.S, 4.2), h1 = pt(p.H, -3.6), h2 = pt(p.H, 3.4), mid = [(p.S[0] + p.H[0]) / 2, (p.S[1] + p.H[1]) / 2], chest = pt(mid, 5.4);
  $("#wtTorso").setAttribute("d", `M${s1[0].toFixed(2)} ${s1[1].toFixed(2)} Q${pt(p.S, 0)[0].toFixed(2)} ${(pt(p.S, 0)[1] - 1.4).toFixed(2)} ${s2[0].toFixed(2)} ${s2[1].toFixed(2)} Q${chest[0].toFixed(2)} ${chest[1].toFixed(2)} ${h2[0].toFixed(2)} ${h2[1].toFixed(2)} L${h1[0].toFixed(2)} ${h1[1].toFixed(2)} Z`);
  $("#wtUpper").setAttribute("d", limb(p.S, p.E, 3.6, 2.8, 0.8));
  $("#wtFore").setAttribute("d", limb(p.E, p.hand, 2.6, 2, 0.5));
  const h = $("#wtHead"); h.setAttribute("cx", p.head[0].toFixed(2)); h.setAttribute("cy", p.head[1].toFixed(2));
  const [hx, hy] = p.head;
  $("#wtHair").setAttribute("d", `M${hx - 3.7} ${hy - 0.2} Q${hx - 3.6} ${hy - 4.4} ${hx} ${hy - 4} Q${hx + 3.4} ${hy - 4.2} ${hx + 3.6} ${hy - 1.4} Q${hx + 1} ${hy - 2.6} ${hx - 1.6} ${hy - 1.6} Q${hx - 2.8} ${hy - 1} ${hx - 3.7} ${hy - 0.2} Z`);
  const ear = $("#wtEar"); ear.setAttribute("cx", (hx - 0.6).toFixed(2)); ear.setAttribute("cy", (hy + 0.2).toFixed(2));
  $("#wtBand").setAttribute("d", `M${hx - 3.6} ${hy - 1.2} Q${hx} ${hy - 2.8} ${hx + 3.5} ${hy - 1.9}`);
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
    const hz = wtZ(p.hand);
    fx.insertAdjacentHTML("beforeend", `<g transform="translate(${hz[0].toFixed(1)},${hz[1].toFixed(1)})">${Array.from({ length: 8 }, (_, i) =>
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
    if (pts === 2) {
      const pb = wtZ(wtPose(1).bar);
      fx.insertAdjacentHTML("beforeend", `<circle class="mg-shock" cx="${WT.CX}" cy="${WT.CY}" r="${(10 * WT.K).toFixed(1)}"/><circle class="mg-shock" cx="${pb[0].toFixed(1)}" cy="${pb[1].toFixed(1)}" r="7"/>`);
      burst(fx, pb[0], pb[1] - 4, { n: 14, spread: 14 });
      const sh = [...fx.querySelectorAll(".mg-shock")]; setTimeout(() => sh.forEach(x => x.remove()), 650);
    }
    if (pts >= 1) {
      const hd = wtZ(wtPose(q).head);
      fx.insertAdjacentHTML("beforeend", `<g transform="translate(${hd[0].toFixed(1)},${(hd[1] + 1).toFixed(1)})">${[0, 1, 2].map(i => `<path class="mg-sweat" d="M0 -1 Q.8 .2 0 .8 Q-.8 .2 0 -1 Z" style="--dx:${(i - 1) * 3 + 2}px;animation-delay:${i * 60}ms"/>`).join("")}</g>`);
      const sw = fx.lastElementChild; setTimeout(() => sw.remove(), 900);
    }
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


// ── 수비 ────────────────────────────
// 드리블 훈련과 같은 원근 화면을 반대로 씀: 공을 가진 공격수가 멀리서 나를 향해 달려옴.
// 어깨가 한쪽으로 기울면(주황 화살표) 그쪽 길로 옮겨 서고, 초록 띠 안에 들어왔을 때 태클.
// 같은 길 + 가운데(진한 띠) 2점 / 같은 길 + 띠 안 1점 / 다른 길·너무 이르거나 늦음 0점. 여섯 번.
const DF_C = 76;                                                  // 태클 판정 기준 깊이 (fy)
function dfBand(y0, y1, cls) {
  const a = drY(y0), b = drY(y1);
  return `<polygon class="${cls}" points="${drX(-0.5, a).toFixed(1)},${a.toFixed(1)} ${drX(2.5, a).toFixed(1)},${a.toFixed(1)} ${drX(2.5, b).toFixed(1)},${b.toFixed(1)} ${drX(-0.5, b).toFixed(1)},${b.toFixed(1)}"/>`;
}
function defendScene(tall = false, good = 11, perfect = 4) {
  const svg = dribbleScene(tall);
  const zone = `<g id="dfZone">${dfBand(DF_C - good, DF_C + good, "df-good")}${dfBand(DF_C - perfect, DF_C + perfect, "df-perfect")}</g>`;
  return svg.replace('<g id="drBack"></g>', `${zone}<g id="drBack"></g>`)
    .replace(/<g id="drBall"[\s\S]*?<\/g><\/g>/, "");             // 내 공은 없음 (공은 공격수가 가짐)
}
function defend(area, status, ctl, e, done, lv = 1, tall = false) {
  const N = 6;
  const speed = (31 - e * 9) * [1, 1, 1.12, 1.22, 1.32][lv];     // 공격수가 다가오는 속도 (fy/초)
  const good = (9 + e * 4) * (lv >= 4 ? 0.85 : 1), perfect = (3 + e * 1.8) * (lv >= 4 ? 0.85 : 1);
  const fakeP = [0, 0, 0, 0.35, 0.5][lv];                         // LV.3부터 한 번 속이고 들어옴
  area.innerHTML = `<div class="mgd-wrap" id="lanes">${defendScene(tall, good, perfect)}</div>
    <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(N)}</span><span id="pts" class="num">0점</span></div>`;
  ctl.innerHTML = `<button class="btn mg-dir" data-l aria-label="왼쪽으로">◀</button><button class="btn btn-kit mg-act mg-tackle" data-t>태클!</button><button class="btn mg-dir" data-r aria-label="오른쪽으로">▶</button>`;
  const lanes = area.querySelector("#lanes"), dots = area.querySelectorAll("#dots i"), ptsEl = area.querySelector("#pts");
  const stripesG = area.querySelector("#drStripes"), backG = area.querySelector("#drBack"), frontG = area.querySelector("#drFront"), fxG = area.querySelector("#drFx");
  const meG = area.querySelector("#drMe"), leanG = area.querySelector("#drLean"), legs = area.querySelector("#drLegs"), armsMe = area.querySelector("#drMe .mgd-arms");
  const legL = legs.querySelector(".mgd-legL"), legR = legs.querySelector(".mgd-legR");
  // 서 있는 수비라 잔디는 멈춰 있음
  const NS = 9;
  stripesG.innerHTML = Array.from({ length: NS }, (_, i) => {
    const a = (i / NS) * 120 - 10, b = ((i + 1) / NS) * 120 - 10, ya = drY(a), yb = Math.min(DRB.BOT, drY(b));
    return ya >= DRB.BOT ? "" : `<polygon fill="${i % 2 ? "rgba(255,255,255,.055)" : "rgba(0,0,0,.05)"}" points="${drX(-1, ya).toFixed(1)},${ya.toFixed(1)} ${drX(3, ya).toFixed(1)},${ya.toFixed(1)} ${drX(3, yb).toFixed(1)},${yb.toFixed(1)} ${drX(-1, yb).toFixed(1)},${yb.toFixed(1)}"/>`;
  }).join("");
  const msg = document.createElementNS("http://www.w3.org/2000/svg", "text");
  msg.setAttribute("class", "mg-shmsg"); msg.setAttribute("x", "80"); msg.setAttribute("y", (DRB.HOR + 22).toFixed(1)); msg.setAttribute("text-anchor", "middle");
  fxG.parentNode.appendChild(msg);
  let myLane = 1, px = 80, n = 0, score = 0, atk = null, raf, last = performance.now(), run = 0, tackle = null, wait = 0, shuffle = 0;
  const setLane = k => { const v = Math.max(0, Math.min(2, k)); if (v !== myLane) shuffle = 1; myLane = v; };
  const spawn = () => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "mgd-foe df-atk");
    g.innerHTML = `<g class="mgd-foeB">${drRunner(true)}<g class="df-ball" transform="translate(4.2,-1.4)"><ellipse cy="1.4" rx="2" ry=".7" fill="rgba(0,0,0,.45)"/><g class="df-ballB">${BALL(1.8)}</g></g></g>`;
    backG.appendChild(g);
    const feintAt = 30 + Math.random() * 16;
    atk = { el: g, body: g.firstChild, ball: g.querySelector(".df-ball"), ballB: g.querySelector(".df-ballB"), y: -8, lane: 1, vis: 1,
      dir: Math.random() < 0.5 ? -1 : 1, feintAt, fakeAt: Math.random() < fakeP ? feintAt - 15 : null, feinted: false, faked: false, lean: 0, leanT: 0,
      ph: Math.random() * 6, front: false, done: false, out: false };
  };
  const cue = (dir, y, s) => {
    const x = drX(atk.vis, y);
    fxG.insertAdjacentHTML("beforeend", `<g class="df-cue" transform="translate(${(x + dir * 9 * s).toFixed(1)},${(y - 30 * s).toFixed(1)}) scale(${(s * 1.2).toFixed(2)})"><path d="M${-dir * 2} -3 L${dir * 2} 0 L${-dir * 2} 3" /><path d="M${-dir * 5} -3 L${-dir * 1} 0 L${-dir * 5} 3" opacity=".55"/></g>`);
    const c = fxG.lastElementChild; setTimeout(() => c.remove(), 520);
  };
  const say = (t, cls) => { msg.textContent = t; msg.setAttribute("class", `mg-shmsg show ${cls}`); setTimeout(() => msg.setAttribute("class", "mg-shmsg"), 650); };
  const resolve = (pts, text, how) => {
    if (!atk || atk.done) return;
    atk.done = true; score += pts;
    dots[n].className = pts === 2 ? "top" : pts === 1 ? "hit" : "miss";
    n++; ptsEl.textContent = `${score}점`;
    status.innerHTML = `<b class="${pts ? "up" : "down"}">${text}</b>`;
    const y = drY(atk.y);
    if (pts) {
      atk.out = true;                                               // 공을 빼앗음: 공이 내 쪽으로 튀어 옴
      atk.body.setAttribute("transform", `translate(${myLane > atk.lane ? -3 : 3},2) rotate(${atk.dir * 38})`);
      atk.ball.style.transition = "transform .35s cubic-bezier(.2,.8,.3,1)";
      atk.ball.setAttribute("transform", `translate(${(px - drX(atk.vis, y)) / drS(y) * 0.6},${((DR_ME_Y - y) / drS(y)) * 0.55})`);
      burst(fxG, drX(atk.vis, y), y - 4, { n: pts === 2 ? 16 : 10, spread: pts === 2 ? 16 : 11 });
      if (pts === 2) { lanes.classList.remove("shake"); void lanes.offsetWidth; lanes.classList.add("shake"); }
      say(pts === 2 ? "PERFECT" : "WIN", "goal");
    } else {
      say(how === "early" ? "TOO EARLY" : "BEATEN", "save");
      burst(fxG, px, DR_ME_Y - 6, { n: 8, colors: ["#FFFFFF", "#FF3B4E"], spread: 9, size: .9 });
    }
    wait = performance.now() + 950;
  };
  const press = () => {
    if (!atk || atk.done || tackle) return;
    tackle = { t: performance.now(), dir: Math.sign(drX(atk.vis, drY(atk.y)) - px) || 0 };
    if (atk.y < DF_C - good - 8) return resolve(0, "너무 일찍 들어갔다!", "early");
    const diff = Math.abs(atk.y - DF_C), same = myLane === atk.lane;
    if (!same) return resolve(0, "방향을 읽히지 못했다…", "side");
    resolve(diff <= perfect ? 2 : diff <= good ? 1 : 0, diff <= perfect ? "완벽한 태클!" : diff <= good ? "공을 빼냈다" : atk.y < DF_C ? "조금 일렀다…" : "한 발 늦었다…", "time");
  };
  ctl.querySelector("[data-l]").addEventListener("pointerdown", () => setLane(myLane - 1));
  ctl.querySelector("[data-r]").addEventListener("pointerdown", () => setLane(myLane + 1));
  ctl.querySelector("[data-t]").addEventListener("pointerdown", e2 => { e2.preventDefault(); press(); });
  const key = ev => {
    if (ev.key === "ArrowLeft") setLane(myLane - 1);
    else if (ev.key === "ArrowRight") setLane(myLane + 1);
    else if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); press(); }
  };
  document.addEventListener("keydown", key);
  spawn();
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (atk) {
      if (!atk.out) atk.y += speed * dt * (atk.done ? 1.15 : 1);
      // 속임 동작 → 진짜 방향 전환
      if (atk.fakeAt != null && !atk.faked && atk.y >= atk.fakeAt) { atk.faked = true; atk.lean = -atk.dir; atk.leanT = now; cue(-atk.dir, drY(atk.y), drS(drY(atk.y))); }
      if (!atk.feinted && atk.y >= atk.feintAt) { atk.feinted = true; atk.lane = 1 + atk.dir; atk.lean = atk.dir; atk.leanT = now; cue(atk.dir, drY(atk.y), drS(drY(atk.y))); }
      atk.vis += (atk.lane - atk.vis) * (1 - Math.exp(-dt * 8));
      const y = drY(atk.y), s = drS(y);
      if (!atk.front && atk.y > DRB.ME) { atk.front = true; frontG.appendChild(atk.el); }
      atk.el.setAttribute("transform", `translate(${drX(atk.vis, y).toFixed(2)},${y.toFixed(2)}) scale(${(s * 1.05).toFixed(3)})`);
      if (!atk.done) {
        const lean = now - atk.leanT < 380 ? atk.lean * 16 * Math.sin((now - atk.leanT) / 380 * Math.PI) : 0;
        atk.body.setAttribute("transform", `rotate(${lean.toFixed(1)})`);
        const sw = Math.sin(now / 75 + atk.ph) * 26, lg = atk.body.querySelector(".mgd-legs"), am = atk.body.querySelector(".mgd-arms");
        if (lg) { lg.children[0].setAttribute("transform", `rotate(${sw.toFixed(1)} -2 -8)`); lg.children[1].setAttribute("transform", `rotate(${(-sw).toFixed(1)} 2 -8)`); }
        if (am) { am.children[0].setAttribute("transform", `rotate(${(-sw * 0.9).toFixed(1)} -5.6 -20)`); am.children[1].setAttribute("transform", `rotate(${(sw * 0.9).toFixed(1)} 5.6 -20)`); }
        const tch = Math.abs(Math.sin(now / 150 + atk.ph));
        atk.ball.setAttribute("transform", `translate(${(4.2 + Math.sin(now / 150) * 1).toFixed(2)},${(-1.4 - tch * 1.6).toFixed(2)})`);
        atk.ballB.setAttribute("transform", `rotate(${(now / 3 % 360).toFixed(0)})`);
      }
      if (!atk.done && atk.y > DF_C + good + 5) resolve(0, "뚫렸다! 태클 타이밍을 놓쳤다", "late");
      if (atk.done && now > wait) {
        atk.el.remove(); atk = null; tackle = null;
        if (n >= N) { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); return done(score >= 10 ? "S" : score >= 7 ? "A" : score >= 4 ? "B" : "C"); }
        spawn(); status.textContent = "";
      }
    }
    // 나: 옆걸음(사이드 스텝), 태클하면 몸을 던짐
    const tx = drX(myLane, DR_ME_Y), vx = tx - px;
    px += vx * (1 - Math.exp(-dt * 16));
    shuffle = Math.max(0, shuffle - dt * 3);
    run += dt * (6 + shuffle * 14);
    const sw = Math.sin(run) * (8 + shuffle * 18);
    legL.setAttribute("transform", `rotate(${sw.toFixed(1)} -2 -8)`); legR.setAttribute("transform", `rotate(${(-sw).toFixed(1)} 2 -8)`);
    if (armsMe) { armsMe.children[0].setAttribute("transform", `rotate(${(-40 - sw * 0.4).toFixed(1)} -5.6 -20)`); armsMe.children[1].setAttribute("transform", `rotate(${(40 + sw * 0.4).toFixed(1)} 5.6 -20)`); }
    let lean = Math.max(-12, Math.min(12, vx * 0.4)), dy = Math.abs(Math.sin(run)) * 0.5, dx = 0;
    if (tackle) {
      const u = Math.min(1, (now - tackle.t) / 260);
      lean = (tackle.dir || 1) * 55 * Math.sin(u * Math.PI / 2); dy = -4 * u; dx = (tackle.dir || 0) * 4 * u;
    }
    meG.setAttribute("transform", `translate(${(px + dx).toFixed(2)},${(DR_ME_Y + dy - 0.5).toFixed(2)})`);
    leanG.setAttribute("transform", `rotate(${lean.toFixed(1)})`);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 스프린트 ─────────────────────────
// 야간 육상 트랙을 옆에서 본 40m 달리기. 왼발·오른발 버튼을 번갈아 눌러 달림 (같은 발을 두 번 누르면 스텝이 꼬여 느려짐).
// 옆 레인 두 명(흰 유니폼)은 정해진 기록으로 달림. 내 기록이 기준 시간 T 대비 0.93배 이하 S / 1.0배 A / 1.15배 B / 그보다 느리면 C.
const SP_M = 40, SP_PX = 6;                                       // 거리(m), 1m = 6
const SP_LANES = [{ y: 67, k: 0.56 }, { y: 80.5, k: 0.62 }, { y: 94, k: 0.68 }];   // 위(먼 레인)부터. 나는 가운데
function spPose(ph) {
  const dir = a => [Math.sin(a * Math.PI / 180), Math.cos(a * Math.PI / 180)];
  const add = (p, v, l) => [p[0] + v[0] * l, p[1] + v[1] * l];
  const bob = -Math.abs(Math.sin(ph)) * 1.1;
  const H = [0, -13.2 + bob], S = [2.6, -23 + bob], head = [4.9, -26.4 + bob];
  const leg = p => {
    const th = 40 * Math.sin(p), kb = 18 + 62 * (0.5 + 0.5 * Math.sin(p + 1.9));
    const K = add(H, dir(th), 7.2), F = add(K, dir(th - kb), 7);
    return { K, F, toe: add(F, dir(th - kb + 90), 2.6) };
  };
  const arm = p => {
    const ua = -34 * Math.sin(p), E = add(S, dir(ua), 5.4), Hd = add(E, dir(ua + 82), 4.6);
    return { E, Hd };
  };
  return { H, S, head, legA: leg(ph), legB: leg(ph + Math.PI), armA: arm(ph + Math.PI), armB: arm(ph) };
}
function spRunnerSVG(id, us) {
  const shirt = us ? "url(#mgShirtO)" : "url(#mgShirtW)", shorts = us ? "url(#mgNavy)" : "url(#mgBlue)", sock = us ? "#FF6B1A" : "#F4F6FF";
  return `<g id="${id}">
    <ellipse class="sp-sh" cx="1" cy=".6" rx="7" ry="1.4" fill="rgba(0,0,0,.42)"/>
    <path class="sp-armB" fill="${us ? "#C9520F" : "#AEB5CC"}"/><path class="sp-foreB" fill="#C98C66"/>
    <path class="sp-thighB" fill="${us ? "#1A2470" : "#2638B8"}"/><path class="sp-shinB" fill="#C98C66"/><path class="sp-sockB" fill="${sock}" opacity=".85"/><path class="sp-shoeB" fill="#0E0F14"/>
    <path class="sp-torso" fill="${shirt}" stroke="${us ? "#B4430B" : "#8E97B5"}" stroke-width=".3"/>
    <path class="sp-shorts" fill="${shorts}"/>
    <path class="sp-thighA" fill="${shorts}"/><path class="sp-shinA" fill="url(#mgSkin)"/><path class="sp-sockA" fill="${sock}"/><path class="sp-shoeA" fill="#111"/>
    <path class="sp-armA" fill="${us ? "#F06318" : "#E9ECF6"}"/><path class="sp-foreA" fill="url(#mgSkin)"/>
    <circle class="sp-head" r="3.3" fill="url(#mgSkin)"/><path class="sp-hair" fill="#17171C"/>
    ${us ? `<text class="sp-tag" text-anchor="middle">나</text>` : ""}
  </g>`;
}
function spDraw(g, ph) {
  const p = spPose(ph), q = s => g.querySelector(s);
  const legD = (L, pre) => {
    q(`.sp-thigh${pre}`).setAttribute("d", limb(p.H, L.K, 4.4, 3.4, 0.9));
    q(`.sp-shin${pre}`).setAttribute("d", limb(L.K, L.F, 3.2, 2.1, 0.8));
    const sk = [L.K[0] + (L.F[0] - L.K[0]) * 0.62, L.K[1] + (L.F[1] - L.K[1]) * 0.62];
    q(`.sp-sock${pre}`).setAttribute("d", limb(sk, L.F, 2.6, 2.2, 0));
    q(`.sp-shoe${pre}`).setAttribute("d", limb([L.F[0] - 0.6, L.F[1]], L.toe, 2.4, 1.6, 0.2));
  };
  legD(p.legB, "B"); legD(p.legA, "A");
  q(".sp-armB").setAttribute("d", limb(p.S, p.armB.E, 2.6, 2.1, 0.5)); q(".sp-foreB").setAttribute("d", limb(p.armB.E, p.armB.Hd, 2, 1.6, 0.3));
  q(".sp-armA").setAttribute("d", limb(p.S, p.armA.E, 2.8, 2.2, 0.6)); q(".sp-foreA").setAttribute("d", limb(p.armA.E, p.armA.Hd, 2.1, 1.7, 0.3));
  q(".sp-torso").setAttribute("d", limb(p.S, p.H, 6.2, 5.2, 0.8));
  q(".sp-shorts").setAttribute("d", limb([p.H[0] + 0.3, p.H[1] - 1.4], [p.H[0] + 0.3, p.H[1] + 1.8], 5.6, 5.2, 0.2));
  const h = q(".sp-head"); h.setAttribute("cx", p.head[0].toFixed(2)); h.setAttribute("cy", p.head[1].toFixed(2));
  const [hx, hy] = p.head;
  q(".sp-hair").setAttribute("d", `M${hx - 3.4} ${hy - 0.6} Q${hx - 3.2} ${hy - 4} ${hx + 0.2} ${hy - 3.8} Q${hx + 3.2} ${hy - 3.6} ${hx + 3.1} ${hy - 1.2} Q${hx + 0.6} ${hy - 2.4} ${hx - 1.4} ${hy - 1.6} Q${hx - 2.6} ${hy - 0.4} ${hx - 3.4} ${hy - 0.6} Z`);
  const tag = q(".sp-tag"); if (tag) { tag.setAttribute("x", hx.toFixed(1)); tag.setAttribute("y", (hy - 5.6).toFixed(1)); }
}
function sprintScene(tall = false) {
  const top = tall ? -24 : 0;
  const crowd = crowdRows(tall ? Array.from({ length: 7 }, (_, i) => -1 + i * 5.4) : [15, 20.4, 25.8, 31.2], 46, 3.6, 7);
  let marks = "";
  for (let m = 0; m <= SP_M + 10; m += 5) {
    const x = m * SP_PX;
    marks += `<g transform="translate(${x},0)"><path d="M0 56 L-4 96" stroke="rgba(255,255,255,${m % 10 ? .25 : .5})" stroke-width="${m % 10 ? .4 : .7}"/>
      ${m % 10 === 0 && m <= SP_M ? `<text x="-1.5" y="54.6" text-anchor="middle" class="sp-mark">${m}m</text>` : ""}</g>`;
  }
  const fx = SP_M * SP_PX;
  const checker = Array.from({ length: 10 }, (_, i) => `<path d="M${fx - i * 0.4 + (i % 2) * 0} ${56 + i * 4} l1.6 0 l-.4 4 l-1.6 0 z" fill="${i % 2 ? "#fff" : "#111"}"/><path d="M${fx + 1.6 - i * 0.4} ${56 + i * 4} l1.6 0 l-.4 4 l-1.6 0 z" fill="${i % 2 ? "#111" : "#fff"}"/>`).join("");
  return `<svg viewBox="${tall ? "16 -24 128 120" : "0 0 160 96"}" class="mg-svg mgs">
    <defs>${COMMON_DEFS}${STADIUM_DEFS}
      <linearGradient id="spSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030A"/><stop offset="1" stop-color="#18235E"/></linearGradient>
      <linearGradient id="spTrack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E3420"/><stop offset=".4" stop-color="#B4452A"/><stop offset="1" stop-color="#C9532F"/></linearGradient>
      <radialGradient id="spPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,248,215,.22)"/><stop offset="1" stop-color="rgba(255,248,215,0)"/></radialGradient>
      <radialGradient id="spVig" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.55)"/></radialGradient>
      <pattern id="spGrain" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx=".7" cy=".9" r=".18" fill="rgba(0,0,0,.18)"/><circle cx="2.2" cy="2.1" r=".15" fill="rgba(255,255,255,.07)"/></pattern>
    </defs>
    <rect y="${top}" width="160" height="${96 - top}" fill="url(#spSky)"/>
    <path d="M-10 ${top} H170 V${top + 4} Q80 ${top + 7} -10 ${top + 4} Z" fill="#05081A"/>
    ${floodBank(tall ? 34 : 24, top + 6, 11)}${floodBank(tall ? 126 : 136, top + 6, 11)}
    <path d="M0 ${tall ? -6 : 11} H160 V36 H0 Z" fill="#0A1134"/>${crowd}
    <rect x="0" y="26" width="160" height="10" fill="url(#mgHaze)"/>
    ${boards(36, 6)}
    <rect x="0" y="42" width="160" height="14" fill="#187A41"/><rect x="0" y="42" width="160" height="14" fill="url(#spPool)"/>
    <rect x="0" y="55" width="160" height="41" fill="url(#spTrack)"/><rect x="0" y="55" width="160" height="41" fill="url(#spGrain)"/>
    <g stroke="rgba(255,255,255,.75)" stroke-width=".5"><path d="M0 56 H160"/><path d="M0 69.5 H160"/><path d="M0 83 H160"/><path d="M0 95.6 H160"/></g>
    <ellipse cx="60" cy="78" rx="80" ry="22" fill="url(#spPool)"/>
    <g id="spWorld">${marks}${checker}
      <g id="spTape"><path d="M${fx + 1.5} 57 Q${fx + 2.5} 76 ${fx + 1.5} 95" stroke="#FFC93C" stroke-width=".7" fill="none"/></g>
    </g>
    <g id="spSpeed"></g>
    <g transform="translate(0,${SP_LANES[0].y}) scale(${SP_LANES[0].k})"><g id="spR1">${spRunnerSVG("spR1b", false)}</g></g>
    <g transform="translate(0,${SP_LANES[1].y}) scale(${SP_LANES[1].k})"><g id="spMe">${spRunnerSVG("spMeb", true)}</g></g>
    <g transform="translate(0,${SP_LANES[2].y}) scale(${SP_LANES[2].k})"><g id="spR2">${spRunnerSVG("spR2b", false)}</g></g>
    <g id="spFx"></g>
    <text id="spCount" x="80" y="${tall ? 24 : 40}" text-anchor="middle" class="sp-count"></text>
    <rect y="${top}" width="160" height="${96 - top}" fill="url(#spVig)" pointer-events="none"/>
  </svg>
  <div class="mg-hud"><span class="mg-timer sp-speed"><i id="spBar"></i></span><span id="spTime" class="num">0.00초</span></div>`;
}
function sprint(area, status, ctl, e, done, lv = 1, tall = false) {
  const T = (6.5 - e * 0.9) * [1, 1, 0.97, 0.94, 0.91][lv];    // 기준 기록(초)
  const vmax = 9.6 + e * 1.6, IMP = 2.05, DRAG = 1.9;
  area.innerHTML = sprintScene(tall);
  ctl.innerHTML = `<button class="btn mg-dir sp-foot" data-f="L">왼발</button><button class="btn mg-dir sp-foot" data-f="R">오른발</button>`;
  const world = area.querySelector("#spWorld"), tape = area.querySelector("#spTape"), fxG = area.querySelector("#spFx"), speedG = area.querySelector("#spSpeed");
  const me = area.querySelector("#spMe"), meB = area.querySelector("#spMeb"), r1 = area.querySelector("#spR1"), r1B = area.querySelector("#spR1b"), r2 = area.querySelector("#spR2"), r2B = area.querySelector("#spR2b");
  const count = area.querySelector("#spCount"), bar = area.querySelector("#spBar"), timeEl = area.querySelector("#spTime");
  speedG.innerHTML = Array.from({ length: 7 }, () => `<line class="mg-speed"/>`).join("");
  const slines = [...speedG.children];
  // 옆 레인 선수: 정해진 기록으로 가속하며 달림 (위치 = v·(t − τ(1 − e^(−t/τ))))
  const TAU = 0.62;
  const vFor = tf => SP_M / (tf - TAU * (1 - Math.exp(-tf / TAU)));
  const rivals = [{ g: r1, b: r1B, tf: T * 0.93, k: SP_LANES[0].k }, { g: r2, b: r2B, tf: T * 1.0, k: SP_LANES[2].k }].map(r => ({ ...r, v: vFor(r.tf) }));
  const rPos = (r, t) => Math.min(SP_M + 6, r.v * (t - TAU * (1 - Math.exp(-t / TAU))));
  let phase = "count", t0 = performance.now(), goT = 0, pos = 0, v = 0, lastFoot = null, raf, last = t0, finishT = null, stumble = 0, ended = false;
  const ph = () => pos * 2.05;
  const tap = f => {
    if (phase !== "run" || finishT != null) return;
    if (f === lastFoot) {
      v *= 0.55; stumble = 1;
      status.innerHTML = `<b class="down">스텝이 꼬였다!</b>`;
      fxG.insertAdjacentHTML("beforeend", `<g transform="translate(${(pos * SP_PX - Math.max(0, pos * SP_PX - (tall ? 56 : 52)) + (tall ? 22 : 8)).toFixed(1)},${SP_LANES[1].y})">${Array.from({ length: 6 }, (_, i) => `<circle class="mgd-dust" r="${(0.8 + (i % 3) * 0.4).toFixed(1)}" style="--dx:${(-4 - i * 1.6).toFixed(1)}px;--dy:${(-1 - (i % 3)).toFixed(1)}px"/>`).join("")}</g>`);
      const d = fxG.lastElementChild; setTimeout(() => d.remove(), 650);
    } else { v = Math.min(vmax, v + IMP); if (status.textContent) status.textContent = ""; }
    lastFoot = f;
    const b = ctl.querySelector(`[data-f="${f}"]`); b?.classList.remove("hit"); void b?.offsetWidth; b?.classList.add("hit");
  };
  ctl.querySelectorAll("[data-f]").forEach(b => b.addEventListener("pointerdown", ev => { ev.preventDefault(); tap(b.dataset.f); }));
  const key = ev => {
    if (ev.repeat) return;
    if (["ArrowLeft", "a", "A", "z", "Z"].includes(ev.key)) { ev.preventDefault(); tap("L"); }
    if (["ArrowRight", "d", "D", "x", "X", "/"].includes(ev.key)) { ev.preventDefault(); tap("R"); }
  };
  document.addEventListener("keydown", key);
  const finish = () => {
    if (ended) return; ended = true;
    const t = finishT ?? (performance.now() - goT) / 1000;
    const rank = 1 + rivals.filter(r => r.tf < t).length;
    status.innerHTML = `<b class="${rank === 1 ? "up" : ""}">${finishT != null ? `${t.toFixed(2)}초 · ${rank}위` : "시간 초과"}</b>`;
    setTimeout(() => done(finishT == null ? "C" : t <= T * 0.93 ? "S" : t <= T ? "A" : t <= T * 1.15 ? "B" : "C"), 900);
  };
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (phase === "count") {
      const k = (now - t0) / 1000;
      const txt = k < 0.6 ? "READY" : k < 1.2 ? "SET" : "GO!";
      if (count.textContent !== txt) { count.textContent = txt; count.setAttribute("class", `sp-count show ${txt === "GO!" ? "go" : ""}`); }
      if (k >= 1.2) { phase = "run"; goT = now; setTimeout(() => count.setAttribute("class", "sp-count"), 500); }
    }
    const t = goT ? (now - goT) / 1000 : 0;
    if (phase === "run") {
      v = Math.max(0, v - v * DRAG * dt);
      if (finishT == null) {
        pos += v * dt;
        if (pos >= SP_M) {
          finishT = t - (pos - SP_M) / Math.max(0.1, v);
          tape.setAttribute("class", "broken");
          burst(fxG, tall ? 78 : 60, SP_LANES[1].y - 10, { n: 16, spread: 16 });
          setTimeout(finish, 700);
        }
      } else pos += v * dt * 0.6;
      if (t > T * 1.7 && finishT == null) { phase = "over"; finish(); }
      timeEl.textContent = `${(finishT ?? t).toFixed(2)}초`;
    }
    stumble = Math.max(0, stumble - dt * 2.5);
    const cam = Math.max(0, pos * SP_PX - (tall ? 56 : 52)) - (tall ? 22 : 8);
    world.setAttribute("transform", `translate(${(-cam).toFixed(2)},0)`);
    me.setAttribute("transform", `translate(${((pos * SP_PX - cam) / SP_LANES[1].k).toFixed(2)},0) rotate(${(stumble * -12).toFixed(1)})`);
    spDraw(meB, ph());
    rivals.forEach(r => {
      const p = goT ? rPos(r, t) : 0;
      r.g.setAttribute("transform", `translate(${((p * SP_PX - cam) / r.k).toFixed(2)},0)`);
      spDraw(r.b, p * 2.05);
    });
    const sp = v / vmax;
    bar.style.width = `${Math.round(sp * 100)}%`;
    bar.className = sp > 0.8 ? "hot" : "";
    slines.forEach((ln, i) => {
      const y = 50 + i * 6.5, len = 6 + sp * 22, x = 160 - ((now / (3 + i) + i * 37) % 200);
      ln.setAttribute("x1", x.toFixed(1)); ln.setAttribute("x2", (x + len).toFixed(1)); ln.setAttribute("y1", y); ln.setAttribute("y2", y);
      ln.setAttribute("stroke-width", (sp * 0.6).toFixed(2)); ln.style.opacity = (sp * 0.8).toFixed(2);
    });
    if (!ended) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { ended = true; cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

const GAMES = { shooting, passing, dribble, weight, defend, sprint };
