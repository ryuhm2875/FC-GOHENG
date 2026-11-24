// 엔딩 화면 점검: 먼저 python3 -m http.server 8765, 그다음 node tools/dev/ending-shots.mjs
// 엔딩마다 조건에 맞는 졸업 상태를 꾸며 gfc.load()로 엔딩 화면을 띄우고, 나온 엔딩·그림·오류를 확인한 뒤 /tmp/ending-shots/ 에 390px 화면을 남깁니다.
import { createRequire } from "module";
const require = createRequire(process.env.PW_ROOT || "/usr/lib/node_modules/");
const { chromium, devices } = require("playwright");
import { mkdirSync } from "fs";
const OUT = "/tmp/ending-shots/"; mkdirSync(OUT, { recursive: true });

// 엔딩 id → 상태 꾸미기 (s: 새 게임 상태)
const CASES = {
  fhsGrow: { school: ["hs_chabat", "보성 차밭고", "footballHS"], g3: { n: 20, start: 0.7 } },
  fhsChoice: { school: ["hs_chabat", "보성 차밭고", "footballHS", "national"], g3: { n: 20, start: 0.7 } },
  fhsLate: { school: ["hs_chabat", "보성 차밭고", "footballHS"], g3: { n: 20, start: 0.8 }, bench1: true },
  bench: { school: ["hs_chabat", "보성 차밭고", "footballHS"], g3: { n: 20, start: 0.1, goals: 1 }, extraSubs: 40 },
  benchFew: { expect: "bench", school: ["general", "순천 일반고 (일반 진학)", "general"], g3: { n: 20, start: 0.1 }, extraSubs: 40 },
  model: { school: ["general", "순천 일반고 (일반 진학)", "general"], g3: { n: 20, start: 0.7 }, acad: 80, att: 80 },
  ordinary: { school: ["general", "순천 일반고 (일반 진학)", "general"], g3: { n: 20, start: 0.7 }, acad: 50 },
  study: { school: ["general", "순천 일반고 (일반 진학)", "general"], g3: { n: 20, start: 0.7 }, acad: 72 },
  comeback: { school: ["x", "전국 강호고", "national"], g3: { n: 20, start: 0.95, rating: 8.0 }, bench1: true, ovr: true },
  regionalBest: { school: ["x", "지역 강호고", "regional"], g3: { n: 20, start: 0.9, rating: 7.6 } },
  injury: { school: ["hs_chabat", "보성 차밭고", "footballHS"], g3: { n: 20, start: 0.7, rating: 6.9 }, inj: 12 },
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], serviceWorkers: "block" });
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !/TUNNEL|Failed to load|404/.test(m.text())) errs.push("console: " + m.text()); });
await page.goto("http://localhost:8765/index.html?dev");
await page.waitForFunction(() => window.gfc);
await page.evaluate(() => document.querySelector("#intro-splash")?.remove());   // 시작 영상이 화면을 가리지 않게
let bad = 0;
for (const [id, cs] of Object.entries(CASES)) {
  const r = await page.evaluate(async cs => {
    const { rollPlayer, newGame } = await import("/js/state.js");
    const s = newGame(rollPlayer({ name: "김민준", face: "face_02", position: "MF", foot: "R", growthType: "steady" }));
    const [sid, name, tier, skipped] = cs.school;
    s.career.school = { id: sid, name, tier, tierLabel: tier, ...(skipped ? { skipped } : {}) };
    const n = cs.g3.n;
    for (let i = 0; i < n; i++) {
      const start = i < Math.round(n * cs.g3.start);
      s.record.matches.push({ grade: 3, official: true, status: start ? "start" : "sub", minutes: start ? 70 : 20, rating: cs.g3.rating ?? 7.0, goals: !start && i % 5 === 0 ? (cs.g3.goals ?? 1) : 0 });
    }
    for (let i = 0; i < (cs.extraSubs || 0); i++) s.record.matches.push({ grade: 2, official: true, status: "sub", minutes: 15, rating: 6.6, goals: 0 });
    s.record.apps = s.record.matches.length;
    if (cs.bench1) s.flags.wasBenchInG1 = true;
    if (cs.acad != null) s.player.stats.student.academic = cs.acad;
    if (cs.att != null) s.player.stats.student.attitude = cs.att;
    if (cs.inj) s.record.injuryWeeks = cs.inj;
    if (cs.ovr) for (const g of Object.values(s.player.stats)) for (const k of Object.keys(g)) if (typeof g[k] === "number" && k !== "academic") g[k] = Math.max(g[k], 80);
    if (cs.acad == null && tier === "general") s.player.stats.student.academic = 50;
    s.finished = true;
    gfc.load(s);
    await new Promise(r => setTimeout(r, 2500));
    document.querySelector("#intro-splash")?.remove();
    const img = document.querySelector(".ending .cine-bg img");
    return { ending: gfc.state.career.ending, img: img ? img.getAttribute("src") : null, ok: img ? img.naturalWidth > 0 : false, text: document.querySelector(".ending")?.innerText.slice(0, 400) };
  }, cs);
  const want = cs.expect || id;
  const pass = r.ending === want && r.ok && !/undefined|NaN|\(일반 진학\)/.test(r.text || "");
  if (!pass) bad++;
  console.log(`${pass ? "OK " : "BAD"} ${id.padEnd(13)} → ${r.ending}  그림 ${r.img}${r.ok ? "" : " (안 보임)"}`);
  await page.screenshot({ path: `${OUT}${id}.png` });
  await page.evaluate(() => { document.querySelector("#modal-root").innerHTML = ""; });
}
console.log(errs.length ? errs.join("\n") : "no errors", bad ? `\n${bad}개 확인 필요` : "");
await browser.close();
