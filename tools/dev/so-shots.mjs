// 승부차기 화면 시험 (Playwright): 토너먼트 무승부 경기를 띄워 '결과만 보기'를 누르면 승부차기 직전에 멈추는지, 건너뛰기 버튼이 없는지,
// 내 차례 선택지·○✕ 기록판·끝 화면이 나오는지 /tmp/so-shots/ 에 그림으로 남김. 먼저 python3 -m http.server 8765
// node tools/dev/so-shots.mjs [FW|MF|DF]
import { createRequire } from "module";
const require = createRequire(process.env.PW_ROOT || "/usr/lib/node_modules/");
const { chromium, devices } = require("playwright");
const D = "/tmp/so-shots/"; (await import("fs")).mkdirSync(D, { recursive: true });
const pos = process.argv[2] || "FW";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], serviceWorkers: "block" });
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", e => errs.push(e.message + " " + (e.stack || "").split("\n")[1]));
page.on("console", m => { if (m.type() === "error" && !/Failed to load/.test(m.text())) errs.push("console: " + m.text()); });
await page.goto(`http://localhost:8765/tools/dev/so-test.html?pos=${pos}`);
await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
console.log("seed", await page.evaluate(() => window.soSeed));
await page.click("[data-start]");
await page.waitForTimeout(1500);
await page.click("[data-skip]");
await page.waitForTimeout(2500);
const skipBtn = await page.locator("[data-skip]").count();
console.log("승부차기 중 결과만 보기 버튼 수:", skipBtn, "| 시계:", await page.locator("#clock").textContent());
await page.screenshot({ path: D + "1_start.png" });
await page.click("[data-speed]").catch(() => {});
let picked = false;
for (let i = 0; i < 240; i++) {
  if (await page.locator(".postmatch").count()) break;
  if (!picked && await page.locator(".mo-btn").count()) {
    await page.screenshot({ path: D + "2_my_kick.png" });
    console.log("내 차례:", (await page.locator(".mo-text").textContent()).slice(0, 120));
    await page.locator(".mo-btn").first().click(); picked = true;
    await page.waitForTimeout(2600); await page.screenshot({ path: D + "3_after_kick.png" });
  }
  await page.waitForTimeout(500);
}
await page.waitForTimeout(800);
await page.screenshot({ path: D + "4_end.png" });
const feed = await page.locator("#feed li").allTextContents();
console.log(feed.slice(-6).join("\n"));
console.log("결과:", await page.locator(".pm-head").textContent().catch(() => "(없음)"));
console.log("errors", errs.slice(0, 5));
await browser.close();
