// 팀 성향이 실제 경기 화면에서 보이는지 찍어 봄 (Playwright). 먼저 python3 -m http.server 8765 (저장소 폴더)
// node tools/dev/style-shots.mjs "목포 유달중" [포지션]   → /tmp/style-shots/ 에 그림과 중계 줄
// 처음 만나는 리그 경기의 상대 이름을 바꿔 그 팀 성향으로 경기를 치름 (화면 확인용, 저장 파일과 상관없음)
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(process.env.PW_ROOT || "/usr/lib/node_modules/");
const { chromium } = require("playwright");
const team = process.argv[2] || "목포 유달중", pos = process.argv[3] || "MF";
const OUT = "/tmp/style-shots/"; fs.mkdirSync(OUT, { recursive: true });
const tag = team.replace(/\s/g, "");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" });
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message));
await page.addInitScript(() => localStorage.setItem("gfc_gate", "2edu84"));
await page.goto("http://localhost:8765/index.html?dev");
await page.waitForFunction(() => window.gfc);
await page.evaluate(async ([pos]) => {
  const { rollPlayer } = await import("/js/state.js");
  gfc.settings.minigame = false;
  gfc.startGame(rollPlayer({ name: "김민준", face: "face_02", position: pos, foot: "R", growthType: "steady" }));
}, [pos]);
const WANT = [["첫줄", /오늘 상대/], ["라인", /하프라인 (가까이|근처까지)/], ["되찾기", /잃자마자|되찾으러/], ["내려앉음", /내려앉아 기다|촘촘히 내려/], ["역습", /앞으로 길게 찬다|한 번에 넘기는/]];
const shot = {}, seen = [];
let inMatch = false, renamed = false, t0 = Date.now();
while (Date.now() - t0 < 420000) {
  const st = await page.evaluate(() => ({ view: gfc.view, modal: !!document.querySelector("#modal-root .backdrop"), meeting: !!document.querySelector("#modal-root .meeting") }));
  if (st.meeting && !renamed) {           // 경기 전 미팅: 이번 상대(리그 팀 객체)의 이름을 바꿈
    renamed = await page.evaluate(team => { const lg = gfc.state.league; if (!lg) return false; for (const t of lg.teams) if (t.id !== "us") t.name = team; return true; }, team);
  }
  if (st.view === "match") {
    inMatch = true;
    const feed = await page.evaluate(() => [...document.querySelectorAll(".feed > *")].map(e => e.textContent.trim()));
    for (const t of feed) if (!seen.includes(t)) {
      seen.push(t);
      for (const [k, re] of WANT) if (re.test(t) && !shot[k] && (k === "첫줄" || !/오늘 상대/.test(t))) { shot[k] = t; await page.waitForTimeout(k === "첫줄" ? 2500 : 600); await page.screenshot({ path: `${OUT}${tag}_${k}.png` }); }
    }
    const clicked = await page.evaluate(() => { for (const s of ["[data-start]", ".mo-btn[data-c]", "[data-h]", "[data-second]", "[data-done]"]) { const b = document.querySelector(s); if (b) { b.click(); return s; } } return null; });
    if (clicked === "[data-done]") break;
    await page.waitForTimeout(150);
    continue;
  }
  if (inMatch) break;
  const clicked = await page.evaluate(() => {
    for (const s of ["#modal-root [data-skip]", "#modal-root .meeting [data-k]", "#modal-root [data-ok]", "#modal-root .vn-choice[data-i]", "#modal-root [data-n]", "#modal-root [data-id]", "#modal-root [data-close]", "#modal-root .btn-kit"]) {
      const b = document.querySelector(s + ":not([disabled])"); if (b) { b.click(); return s; } }
    return null;
  });
  if (clicked) { await page.waitForTimeout(150); continue; }
  if (!st.modal) await page.evaluate(() => { const s = gfc.state; for (const k of ["wd1", "wd2", "we"]) s.plan[k] = s.plan[k] || "pass"; gfc.render(); gfc.advance(); });
  await page.waitForTimeout(250);
}
fs.writeFileSync(`${OUT}${tag}_feed.txt`, seen.join("\n"));
console.log(team, JSON.stringify(shot, null, 1));
console.log(errs.slice(0, 5).join("\n") || "no errors");
await browser.close();
