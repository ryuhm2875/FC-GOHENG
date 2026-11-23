// 튜토리얼(환영 → 청백전 → 홈 안내)을 화면으로 끝까지 눌러 보며 찍음. 먼저 python3 -m http.server 8765
// node tools/dev/tutorial-shots.mjs   POS=FW|MF|DF   → /tmp/tut/ (마지막 줄 errors: none 이면 통과, 청백전 뒤 실제 상태가 그대로인지도 찍음)
import { spawn } from "child_process"; import { writeFileSync, mkdirSync } from "fs";
const OUT = "/tmp/tut/"; mkdirSync(OUT, { recursive: true });
const PORT = 9391; const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/tut-prof-${Date.now()}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list; for (let i = 0; i < 40; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (list.some(t => t.type === "page")) break; } catch {} await sleep(250); }
const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl); let id = 0; const wait = {}; const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; }
  if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push(m.params.args.map(a => a.value ?? a.description).join(" ")); };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
const shot = async n => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(OUT + n + ".png", Buffer.from(r.result.data, "base64")); };
const click = sel => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) { b.click(); return true; } return false; })()`);
const waitFor = async (sel, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(`!!document.querySelector(${JSON.stringify(sel)})`)) return true; await sleep(200); } return false; };
await send("Runtime.enable"); await send("Page.enable"); await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `localStorage.setItem("gfc_gate","2edu84")` });
await send("Page.navigate", { url: "http://localhost:8765/index.html?dev" }); await sleep(4000);

await ev(`(async () => { const { rollPlayer } = await import("/js/state.js"); gfc.settings.timing = true; gfc.startGame(rollPlayer({ name: "김민준", face: "face_02", position: "${process.env.POS || "MF"}", foot: "R", growthType: "steady" })); })()`);
console.log("welcome", await waitFor(".tut-welcome")); await sleep(600); await shot("1_welcome");
await click(".tut-welcome [data-ok]"); console.log("kick", await waitFor(".tut-bub [data-ok]")); await sleep(800); await shot("2_kick");
await click(".tut-layer [data-ok]"); await sleep(300); await click("[data-start]");
console.log("pick", await waitFor(".moment .mo-choices", 120000)); await sleep(900); await shot("3_pick");
// 타이밍 표시가 있는 선택지를 고름 (없으면 첫 번째)
await ev(`(() => { const bs = [...document.querySelectorAll(".mo-btn")]; (bs.find(b => b.querySelector(".tmark")) || bs[0]).click(); })()`);
if (await waitFor(".timing", 3000)) { await sleep(700); await shot("4_timing"); await click("[data-hit]"); }
for (let k = 0; k < 300 && !(await ev(`!!document.querySelector(".postmatch .pm-me")`)); k++) { await click(".ctl [data-skip]") || await click("[data-autopick]") || await click("[data-hit]") || await click("#modal-root [data-ok]") || await click("#modal-root .btn-kit"); await sleep(400); }
console.log("end", await waitFor(".postmatch .pm-me", 60000)); await sleep(1200); await shot("5_end");
const before = await ev(`JSON.stringify({ games: gfc.state.record?.games ?? null, apps: (gfc.state.record?.ratings || []).length, coach: gfc.state.relations.coach, tut: gfc.state.flags.tutDone || false })`);
await click(".tut-layer [data-ok]"); await sleep(300); await click("[data-done]");
for (let k = 1; k <= 3; k++) { await waitFor(".tut-layer [data-ok]"); await sleep(700); await shot("6_home" + k); await click(".tut-layer [data-ok]"); await sleep(400); }
await sleep(500);
console.log("state after practice:", before, "tutDone", await ev(`gfc.state.flags.tutDone`), "view", await ev(`gfc.view`));
await ev(`(async () => { gfc.state.flags.tutDone = false; gfc.go("home"); const t = await import("/js/ui/tutorial.js"); t.startTutorial(gfc); })()`);
await sleep(1200); await shot("7_welcome2"); await click(".tut-welcome [data-ok]"); await waitFor(".tut-layer [data-ok]"); await sleep(1500); await shot("8_kick2");
console.log("errors:", errs.length ? errs.slice(0, 5) : "none");
ws.close(); chrome.kill(); process.exit(0);
