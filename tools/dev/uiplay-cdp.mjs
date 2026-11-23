// uiplay.mjs와 같은 3년 자동 플레이를 Playwright 없이 (크롬 + DevTools 프로토콜). Playwright가 없는 컴퓨터용
// 먼저 python3 -m http.server 8765, 크롬은 이 도구가 띄움 (CHROME=경로, 기본 google-chrome)
// node tools/dev/uiplay-cdp.mjs [포지션] [이름]   LIMIT=밀리초  PORT=9333   마지막 줄이 "no errors"면 통과
// LIVE=1: 경기를 '결과만 보기' 없이 빠르게 보면서, 국면 해설(잠그기·쫓아가기)이 뜨면 화면을 찍음 (/tmp/uiplay-cdp/)
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
const pos = process.argv[2] || "MF", nm = process.argv[3] || "김민준", PORT = +(process.env.PORT || 9333), LIVE = !!process.env.LIVE;
const OUT = "/tmp/uiplay-cdp/"; mkdirSync(OUT, { recursive: true });
const chrome = spawn(process.env.CHROME || "google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/uiplay-cdp-prof-${PORT}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list; for (let i = 0; i < 40; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (list.some(t => t.type === "page")) break; } catch { } await sleep(250); }
const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl);
let id = 0; const wait = {}, errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; }
  if (m.method === "Runtime.exceptionThrown") { const d = m.params.exceptionDetails; errs.push("pageerror: " + (d.exception?.description || d.text).split("\n").slice(0, 2).join(" ")); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") { const t = m.params.args.map(a => a.value ?? a.description).join(" "); if (!/TUNNEL|Failed to load/.test(t)) errs.push("console: " + t); }
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/favicon|Failed to load|navigator.vibrate/.test(m.params.entry.text)) errs.push("log: " + m.params.entry.text + " " + (m.params.entry.url || "")); };
await new Promise(r => ws.onopen = r);
const send = (method, params = {}) => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (fn, arg) => { const r = await send("Runtime.evaluate", { expression: `(${fn})(${JSON.stringify(arg ?? null)})`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result?.result?.value; };
const shot = async name => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(OUT + name, Buffer.from(r.result.data, "base64")); };
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });   // iPhone 13 크기
await send("Emulation.setTouchEmulationEnabled", { enabled: true });
await send("Network.enable"); await send("Network.setBypassServiceWorker", { bypass: true });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `localStorage.setItem("gfc_gate","2edu84")` });
await send("Page.navigate", { url: "http://localhost:8765/index.html?dev" });
for (let i = 0; i < 60 && !(await ev(() => !!window.gfc).catch(() => false)); i++) await sleep(250);
await ev(async ([pos, nm]) => {
  const { rollPlayer } = await import("/js/state.js");
  gfc.settings.minigame = true; gfc.settings.timing = true;
  gfc.startGame(rollPlayer({ name: nm, face: "face_02", position: pos, foot: "R", growthType: "steady" }));
}, [pos, nm]);
const ACTS = { FW: ["shoot", "dribble", "sprint"], MF: ["pass", "defend", "tactics"], DF: ["defend", "weight", "sprint"] }[pos];
let weeks = 0, matches = 0, stuck = 0, lastTurn = 0, liveShots = 0, liveMatches = 0;
const t0 = Date.now();
while (Date.now() - t0 < +(process.env.LIMIT || 520000)) {
  const st = await ev(() => ({ view: gfc.view, turn: gfc.state?.calendar.turn, modal: !!document.querySelector("#modal-root .backdrop") }));
  if (st.view === "ending") break;
  const live = LIVE && liveMatches < +(process.env.LIVE_N || 6);
  const clicked = await ev(live => {
    const q = s => document.querySelector(s);
    const order = ["#modal-root [data-skip]", "#modal-root .meeting [data-k]", "#modal-root [data-ok]", "#modal-root .vn-choice[data-i]", "#modal-root [data-n]", "#modal-root [data-id]", "#modal-root [data-close]", "#modal-root .btn-kit"];
    for (const s of order) { const b = q(s + ":not([disabled])"); if (b) { b.click(); return s; } }
    const ms = live ? ["[data-start]", "[data-done]", "[data-second]", ".mo-btn[data-c]", "[data-h]"] : ["[data-start]", ".ctl [data-skip]", "[data-done]", "[data-second]", ".mo-btn[data-c]", "[data-h]"];
    if (live) { const sp = q("[data-speed]"); if (sp && /빠르게/.test(sp.textContent)) { sp.click(); return "speed"; } }
    for (const s of ms) { const b = q(s); if (b) { b.click(); return s; } }
    return null;
  }, live);
  if (clicked === "[data-start]" && live) liveMatches++;
  if (clicked) { if (clicked === "[data-done]") matches++; await sleep(120); continue; }
  if (live && st.view === "match") {   // 국면 해설이 새로 뜨면 그 순간과 6초 뒤를 찍음
    const hit = await ev(() => { const ls = [...document.querySelectorAll(".feed *")].map(e => e.textContent); const h = ls.reverse().find(t => /박스 앞을 촘촘히|박스 앞으로 내려|물러나 잠근다|측면 수비까지|측면 수비가 공격수처럼|골을 넣은 (기세|상대가 기세)|한 골 넣은 상대가 더 거세게|앞에서부터 몰아친다|한 명씩 더 올라가|미드필더까지 박스 앞으로/.test(t)); if (!h || window.__seen?.has(h + gfc.state.calendar.turn)) return null; (window.__seen ||= new Set()).add(h + gfc.state.calendar.turn); return h; });
    if (hit) { liveShots++; await shot(`live_${pos}_${liveShots}a.png`); await sleep(6000); await shot(`live_${pos}_${liveShots}b.png`); console.log("국면 해설:", hit.slice(0, 80)); }
  }
  if (st.view !== "match" && !st.modal) {
    if (st.turn === lastTurn) stuck++; else { stuck = 0; lastTurn = st.turn; weeks++; }
    if (stuck > 40) { errs.push("STUCK at turn " + st.turn + " view " + st.view); break; }
    await ev(acts => { const s = gfc.state; for (const k of ["wd1", "wd2", "we"]) s.plan[k] = s.plan[k] || (s.player.condition.fatigue > 60 ? "sleep" : acts[Math.floor(Math.random() * acts.length)]); gfc.render(); gfc.advance(); }, ACTS);
    await sleep(250);
  } else await sleep(100);
}
const end = await ev(() => ({ view: gfc.view, turn: gfc.state?.calendar.turn, ending: gfc.state?.career?.ending }));
await shot(`uiplay_${pos}.png`);
console.log(pos, "weeks", weeks, "matches", matches, JSON.stringify(end), "secs", Math.round((Date.now() - t0) / 1000), LIVE ? `live shots ${liveShots}` : "");
console.log(errs.slice(0, 10).join("\n") || "no errors");
ws.close(); chrome.kill();
process.exit(0);
