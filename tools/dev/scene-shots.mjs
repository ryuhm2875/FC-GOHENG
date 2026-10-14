// 내 장면 116개를 하나씩 경기장에 연출해 /tmp/scene-shots/ 에 그림으로 저장 (장면 연출 확인용)
// python3 -m http.server 8765 (저장소 폴더) 를 켠 뒤: node tools/dev/scene-shots.mjs [장면id,장면id]
import { createRequire } from "module";
const require = createRequire("/usr/lib/node_modules/");
const { chromium } = require("playwright");
const D = "/tmp/scene-shots/"; (await import("fs")).mkdirSync(D, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 400 } }); const errs = [];
page.on("pageerror", e => errs.push(e.message + " " + (e.stack || "").split("\n")[1]));
await page.goto("http://localhost:8765/tools/dev/scene-test.html");
await page.waitForFunction(() => window.ready);
const ids = process.argv[2] ? process.argv[2].split(",") : await page.evaluate(() => ids);
const slow = [];
for (const id of ids) {
  const t0 = Date.now();
  await Promise.race([page.evaluate(id => runScene(id), id), new Promise(r => setTimeout(r, 12000))]);
  const dt = Date.now() - t0; if (dt > 6000) slow.push(`${id}:${dt}`);
  await page.locator(".match-screen").screenshot({ path: D + id + ".png" });
}
console.log("errors", errs.slice(0, 5), "slow", slow.join(" "));
await browser.close();
