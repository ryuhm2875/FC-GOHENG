// 경기 화면 움직임 측정 (Playwright). 먼저 저장소 폴더에서 python3 -m http.server 8765 를 켜 두세요.
// node tools/dev/probe.mjs [포지션 FW|MF|DF] [초] [주소]   환경변수 THROTTLE=6 (느린 휴대폰), FAST=1 (빠르게)
// 출력: 공이 혼자 멈춰 있는 시간, 선수 순간이동(초속 40m 초과), 공 순간이동(초속 90m 초과), 0.6초 넘게 다 멈춘 구간
import { createRequire } from "module";
const require = createRequire(process.env.PW_ROOT || "/usr/lib/node_modules/");   // 다른 컴퓨터에서는 PW_ROOT로 playwright 위치 지정
const { chromium, devices } = require("playwright");
const pos = process.argv[2] || "MF", secs = +(process.argv[3] || 60), base = process.argv[4] || "http://localhost:8765";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], serviceWorkers: "block" });
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (/NANDBG/.test(m.text())) errs.push(m.text().replace(/\n/g, " ")); });
await page.addInitScript(() => { localStorage.setItem("gfc_gate", "2edu84"); window.__plog = []; });
await page.goto(base + "/index.html");
await page.waitForFunction(() => window.gfc);
await page.evaluate(async (pos) => { const { rollPlayer } = await import("/js/state.js");
  gfc.settings.minigame = false; gfc.settings.timing = false;
  gfc.startGame(rollPlayer({ name: "김민준", face: "face_02", position: pos, foot: "R", growthType: "steady" })); }, pos);
for (let i = 0; i < 300; i++) {
  if (await page.evaluate(() => gfc.view) === "match") break;
  const c = await page.evaluate(() => { for (const s of ["#modal-root [data-skip]", "#modal-root .meeting [data-k]", "#modal-root [data-ok]", "#modal-root .vn-choice[data-i]", "#modal-root [data-n]", "#modal-root [data-id]", "#modal-root [data-close]", "#modal-root .btn-kit"]) { const b = document.querySelector(s); if (b && !b.disabled) { b.click(); return 1; } } return 0; });
  if (c) { await page.waitForTimeout(120); continue; }
  await page.evaluate(() => { const s = gfc.state; for (const g of ["tech","phys","mental"]) for (const k in s.player.stats[g]) s.player.stats[g][k] = 80; for (const k of ["wd1","wd2","we"]) s.plan[k] = s.plan[k] || "tactics"; s.relations.coach = 90; gfc.render(); gfc.advance(); });
  await page.waitForTimeout(200);
}
// 매 프레임 위치 기록
await page.evaluate(() => {
  const rd = el => { const t = el.getAttribute("transform") || el.style.transform || ""; const m = /translate\(([-\d.]+)(?:px)?[,\s]+([-\d.]+)(?:px)?\)/.exec(t); return m ? [+m[1], +m[2]] : null; };
  window.__rec = []; let prev = null, t0 = performance.now();
  const f = now => {
    const dots = [...document.querySelectorAll(".pitch .dot")].map(rd), ball = document.querySelector(".pitch .ball");
    const b = ball ? rd(ball) : null;
    const choice = !!document.querySelector(".mo-btn");
    if (prev && b && prev.b) {
      let maxd = 0, moving = 0;
      dots.forEach((d, i) => { if (d && prev.dots[i]) { const dd = Math.hypot(d[0] - prev.dots[i][0], d[1] - prev.dots[i][1]); maxd = Math.max(maxd, dd); if (dd > 0.02) moving++; } });
      const nd = Math.min(...dots.filter(Boolean).map(d => Math.hypot(d[0] - b[0], d[1] - b[1])));
      window.__rec.push({ nd, b, me: dots[[...document.querySelectorAll('.pitch .dot')].findIndex(e => e.classList.contains('me'))], t: now - t0, dt: now - prev.t, maxd, moving, bd: Math.hypot(b[0] - prev.b[0], b[1] - prev.b[1]), choice, clock: document.querySelector("#clock")?.textContent, ps: window.__ps ? `q${window.__ps.queue.length} cur${window.__ps.cur ? 1 : 0} w${window.__ps.wait.toFixed(2)} b${window.__ps.boost} fl${window.__ps.ball.fl ? 1 : 0} h${window.__ps.holder?.id} pend${window.__ps.pending?.id} ${window.__ps.pending ? `p(${window.__ps.pending.x.toFixed(1)},${window.__ps.pending.y.toFixed(1)}) ov${JSON.stringify(window.__ps.pending.ov)} v${Math.hypot(window.__ps.pending.vx, window.__ps.pending.vy).toFixed(2)} t(${window.__ps.pending.tx.toFixed(1)},${window.__ps.pending.ty.toFixed(1)}) ball(${window.__ps.ball.x.toFixed(1)},${window.__ps.ball.y.toFixed(1)})` : ''}` : '', ln: (document.querySelector('#feed')?.lastElementChild?.textContent || '').slice(0, 40), ctl: (document.querySelector('#ctl')?.className || '') + ' ' + (document.querySelector('#ctl')?.firstElementChild?.className || '') });
    }
    prev = { t: now, dots, b };
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
});
await page.evaluate(() => { window.__plog = []; window.__p0 = performance.now(); });
if (process.env.THROTTLE) { const cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THROTTLE }); }
await page.click("[data-start]");
if (process.env.FAST) { await page.waitForTimeout(800); await page.click("[data-speed]").catch(() => {}); }
const T0 = Date.now();
while (Date.now() - T0 < secs * 1000) {
  await page.waitForTimeout(500);
  const mo = await page.$(".mo-btn[data-c]"); if (mo) { await page.waitForTimeout(1200); await mo.click().catch(() => {}); }
  const ht = await page.$("[data-h], [data-second]"); if (ht) await ht.click().catch(() => {});
  if (await page.$("[data-done]")) break;
}
const rec = await page.evaluate(() => window.__rec);
const plog = await page.evaluate(() => window.__plog.map(e => ({ ...e, t: Math.round(e.t - window.__p0) })));
(await import('fs')).writeFileSync('/tmp/probe-plog.json', JSON.stringify(plog));
(await import('fs')).writeFileSync('/tmp/probe-rec.json', JSON.stringify(rec.filter((r, i) => i % 2 === 0).map(r => ({ t: Math.round(r.t), b: r.b, me: r.me, c: r.clock, ch: r.choice, lines: r.lines }))));
// 분석
const play = rec.filter(r => !r.choice && r.clock !== "경기 전");
const SC = process.env.FAST ? 2.6 : 1;
const tele = play.filter(r => r.maxd / (r.dt / 1000) > 40 * SC && r.maxd > 1), btele = play.filter(r => r.bd / (r.dt / 1000) > 90 * SC && r.bd > 1.5);
let still = [], run = 0;
let c0 = null;
for (const r of play) { if (r.moving === 0 && r.bd < 0.01) { if (!run) c0 = r.clock + "@" + Math.round(r.t / 1000) + "[" + r.ps + "|" + r.ln + "]"; run += r.dt; } else { if (run > 600) still.push(c0 + ":" + Math.round(run)); run = 0; } }
const longFrames = play.filter(r => r.dt > 50).length;
let lonely = 0, lonelySpans = [], lr = 0;
for (const r of play) { const slow = r.bd / (r.dt / 1000) < 3, inPlay = r.b && r.b[0] > 1 && r.b[0] < 104 && r.b[1] > 1 && r.b[1] < 67; if (slow && inPlay && r.nd > 3) { lonely += r.dt; lr += r.dt; } else { if (lr > 500) lonelySpans.push(Math.round(lr) + "@" + r.clock + ":" + r.ln.slice(0, 18)); lr = 0; } }
console.log("공 혼자 멈춰 있는 시간(가까운 선수 3m 밖)", (lonely / 1000).toFixed(1), "s / 경기 화면", (play.reduce((a, r) => a + r.dt, 0) / 1000).toFixed(0), "s, 0.5초 넘는 구간", lonelySpans.length, lonelySpans.slice(0, 10).join(","));
console.log("frames", play.length, "player teleports(>40m/s)", tele.length, "ball jumps(>90m/s)", btele.length, "frozen spans>0.6s", still.length, "total frozen s", (still.reduce((a, b) => a + +b.split(':')[1], 0) / 1000).toFixed(1), "\n", still.slice(0, 14).join("\n"), "\n", "long frames", longFrames, errs);
console.log("teleport samples", tele.slice(0, 8).map(r => `${r.clock} d${r.maxd.toFixed(1)} dt${Math.round(r.dt)}`).join(" | "));
console.log("ball jump samples", btele.slice(0, 8).map(r => `${r.clock} d${r.bd.toFixed(1)} dt${Math.round(r.dt)} ${r.ln}`).join(" | "));
await browser.close();
