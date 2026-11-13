// 훈련 미니게임 화면 찍기: node tools/dev/mg-shot.mjs passing,weight [가로 세로]  (SLOT="평일 2"·"주말"로 시간대, ACT=1이면 몇 번 눌러 본 뒤 한 장 더). /tmp/shots/에 저장, 로컬 서버 8765 필요
import { createRequire } from "module";
const require = createRequire(process.env.PW_ROOT || "/usr/lib/node_modules/");
const { chromium } = require("playwright");
const kinds = process.argv[2].split(","), W = +(process.argv[3] || 900), H = +(process.argv[4] || 620);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: "block" })).newPage(); const errs = [];
page.on("pageerror", e => errs.push(e.message));
await page.addInitScript(() => localStorage.setItem("gfc_gate", "2edu84"));
await page.goto("http://localhost:8765/index.html?dev"); await page.waitForFunction(() => window.gfc);
for (const k of kinds) {
  await page.evaluate(async ([kind, slot]) => { const { playMinigame } = await import("/js/ui/minigames.js"); window.__mg = playMinigame(kind, 55, slot); }, [k, process.env.SLOT || "평일 1"]);
  await page.waitForTimeout(700);
  for (const b of await page.$$("#modal-root button")) { const t = (await b.textContent()).trim(); if (/시작|도전|GO|훈련/.test(t)) { await b.click(); break; } }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/tmp/shots/mg_${k}_${W}.png` });
  if (process.env.ACT === "1" && k === "passing") { for (const n of [1, 2, 3]) { const el = await page.$(`[data-n="${n}"]`); if (el) { await el.dispatchEvent("pointerdown"); await page.waitForTimeout(260); } } await page.screenshot({ path: `/tmp/shots/mg_${k}_${W}_b.png` }); }
  if (process.env.ACT === "1" && k === "weight") { for (let i = 0; i < 6; i++) { await page.mouse.down(); await page.waitForTimeout(500); await page.mouse.up(); await page.waitForTimeout(300); } await page.screenshot({ path: `/tmp/shots/mg_${k}_${W}_b.png` }); }
  await page.evaluate(() => { document.querySelector("#modal-root").innerHTML = ""; });
}
console.log(errs.slice(0, 3).join("\n") || "no errors");
await browser.close();
