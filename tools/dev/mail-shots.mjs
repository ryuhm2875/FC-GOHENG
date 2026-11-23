// 메일함 화면을 찍음 (홈 메시지 칸, 메일 칸, 단톡방 칸). 먼저 python3 -m http.server 8765
// node tools/dev/mail-shots.mjs  → /tmp/mailshots/
import { spawn } from "child_process"; import { writeFileSync, mkdirSync } from "fs";
const OUT = "/tmp/mailshots/"; mkdirSync(OUT, { recursive: true });
const PORT = 9395; const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/mail-prof-${Date.now()}`, "about:blank"], { stdio: "ignore" });
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

// 22주를 엔진으로 돌려 메일을 쌓음 (이벤트는 첫 선택지)
await ev(`(async () => { const { rollPlayer } = await import("/js/state.js"); const W = await import("/js/engine/week.js"); const E = await import("/js/engine/events.js");
  gfc.startGame(rollPlayer({ name: "김민준", face: "face_02", position: "MF", foot: "R", growthType: "rookie" })); gfc.state.flags.tutDone = true; document.querySelector(".tut-layer")?.remove(); document.querySelector(".tut-welcome")?.closest(".modal,.overlay,.tut-wrap")?.remove();
  const s = gfc.state; for (let i = 0; i < 22; i++) { for (const k of ["wd1", "wd2", "we"]) s.plan[k] = "pass"; W.runWeek(s); while (s.pendingEvent) { const e = E.findEvent(s.pendingEvent.id); E.chooseEvent(s, e.choices.findIndex(c => E.reqOk(s, c))); } if (s.pending?.type === "number") s.pending = null; }
  s.inbox.slice(0, 6).forEach(m => m.read = false); gfc.go("home"); return s.inbox.length; })()`).then(n => console.log("메일", n));
await sleep(1500);
for (let k = 0; k < 10 && await click("#skip"); k++) await sleep(800);   // 시작 영상 건너뛰기
await ev(`document.querySelectorAll("#intro-splash, .cine, .modal, .tut-layer, .tut-welcome, #modal-root > *").forEach(x => x.remove()); document.body.className = document.body.className.replace(/\\b(modal-open|blur\\w*)\\b/g, ""); gfc.go("home")`); await sleep(800);
await ev(`document.querySelectorAll(".modal, .tut-layer, .tut-welcome").forEach(x => x.remove()); document.querySelector(".mailbox")?.scrollIntoView({ block: "start" })`); await sleep(500); console.log("view", await ev("gfc.view"), await ev("[...document.body.children].map(e => e.tagName + \".\" + e.className + \"#\" + e.id).join(\" \")")); await shot("1_home");
await ev(`gfc.sub.itab = "mail"; gfc.go("inbox")`); await sleep(700); await shot("2_mail");
await click('.tabs2 [data-itab="group"]'); await sleep(700); await shot("3_group");
console.log("errors:", errs.length ? errs.slice(0, 5) : "none");
ws.close(); chrome.kill(); process.exit(0);
