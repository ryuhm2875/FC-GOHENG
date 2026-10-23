// 화면에서 3년을 자동으로 끝까지 진행하며 오류를 찾음 (Playwright). 먼저 python3 -m http.server 8765
// node tools/dev/uiplay.mjs [포지션] [이름]   약 9분 (LIMIT=밀리초 로 제한 시간 변경). 마지막 줄이 "no errors"면 통과
import { createRequire } from "module";
const require = createRequire(process.env.PW_ROOT || "/usr/lib/node_modules/");   // 다른 컴퓨터에서는 PW_ROOT로 playwright 위치 지정
const { chromium, devices } = require("playwright");
const OUT = "/tmp/uiplay-shots/";
const pos = process.argv[2] || "MF", seedName = process.argv[3] || "김민준";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], serviceWorkers: "block" });
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message + " @" + e.stack?.split("\n")[1]));
page.on("console", m => { if (m.type() === "error" && !/TUNNEL|Failed to load/.test(m.text())) errs.push("console: " + m.text()); });
await page.addInitScript(() => localStorage.setItem("gfc_gate", "2edu84"));
await page.goto("http://localhost:8765/index.html?dev");
await page.waitForFunction(() => window.gfc);
await page.evaluate(async ([pos, nm]) => {
  const { rollPlayer } = await import("/js/state.js");
  gfc.settings.minigame = true; gfc.settings.timing = true;
  gfc.startGame(rollPlayer({ name: nm, face: "face_02", position: pos, foot: "R", growthType: "steady" }));
}, [pos, seedName]);
const ACTS = { FW: ["shoot", "dribble", "sprint"], MF: ["pass", "defend", "tactics"], DF: ["defend", "weight", "sprint"] }[pos];
let weeks = 0, matches = 0, stuck = 0, lastTurn = 0;
const t0 = Date.now();
while (Date.now() - t0 < +(process.env.LIMIT || 520000)) {
  const st = await page.evaluate(() => ({ view: gfc.view, turn: gfc.state?.calendar.turn, fin: gfc.state?.finished, modal: !!document.querySelector("#modal-root .backdrop") }));
  if (st.view === "ending") break;
  // 열린 창 처리
  const clicked = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const order = ["#modal-root [data-skip]", "#modal-root .meeting [data-k]", "#modal-root [data-ok]", "#modal-root .vn-choice[data-i]", "#modal-root [data-n]", "#modal-root [data-id]",
      "#modal-root [data-close]", "#modal-root .btn-kit"];
    for (const s of order) { const b = q(s + ":not([disabled])"); if (b) { b.click(); return s; } }   // 잠긴 버튼(진학 상담의 잠긴 학교 등)은 건너뜀
    // 경기 화면
    for (const s of ["[data-start]", ".ctl [data-skip]", "[data-done]", "[data-second]", ".mo-btn[data-c]", "[data-h]"]) { const b = q(s); if (b) { b.click(); return s; } }
    return null;
  });
  if (clicked) { if (clicked === "[data-done]") matches++; await page.waitForTimeout(120); continue; }
  if (st.view !== "match" && !st.modal) {
    if (st.turn === lastTurn) stuck++; else { stuck = 0; lastTurn = st.turn; weeks++; }
    if (stuck > 40) { errs.push("STUCK at turn " + st.turn + " view " + st.view); break; }
    await page.evaluate(acts => { const s = gfc.state; for (const k of ["wd1", "wd2", "we"]) s.plan[k] = s.plan[k] || (s.player.condition.fatigue > 60 ? "sleep" : acts[Math.floor(Math.random() * acts.length)]); gfc.render(); gfc.advance(); }, ACTS);
    await page.waitForTimeout(250);
  } else await page.waitForTimeout(100);
}
const end = await page.evaluate(() => ({ view: gfc.view, turn: gfc.state?.calendar.turn, ending: gfc.state?.career?.ending, hall: JSON.parse(localStorage.getItem("gfc_hall") || "[]").length, ach: Object.keys(JSON.parse(localStorage.getItem("gfc_ach") || "{}")).length }));
await page.screenshot({ path: OUT + `uiplay_${pos}.png` });
console.log(pos, "weeks", weeks, "matches", matches, JSON.stringify(end), "secs", Math.round((Date.now() - t0) / 1000));
console.log(errs.slice(0, 10).join("\n") || "no errors");
await browser.close();
