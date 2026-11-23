// 세트피스 갈래 점검: 코너킥(먼 쪽·니어·짧게·박스 바깥)·박스 앞 프리킥(보통·옆으로 밀어 줌)이 몇 번, 그 뒤 8초 안 슈팅·골
// node tools/dev/setpiece-audit.mjs [경기 수]   SEED=70000   (갈래가 없는 예전 코드에서도 돌아감: 모두 '먼 쪽/보통'으로 셈)
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve } from "../../js/engine/match.js";
const N = +process.argv[2] || 120, SEED = +(process.env.SEED || 70000);
const C = {}, inc = (k, v = 1) => { C[k] = (C[k] || 0) + v; };
let games = 0, goals = 0, lines = 0; const ex = [];
for (let k = 0; k < N; k++) {
  setSeed(SEED + k);
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: ["FW", "MF", "DF"][k % 3], foot: "R", growthType: "steady" }));
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx?.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim; games++;
  let g = 0;
  while (!m.done && g++ < 4000) {
    if (m.pending) { resolve(s, m, Math.floor(rand() * Math.max(1, (m.pending.choices || []).length))); continue; }
    for (const l of next(s, m).lines) if (/니어포스트 쪽으로 낮고|끊어 들어가는 동료에게|곧장 띄우지 않고|가까이 다가온 동료에게 짧게|박스 바깥으로 빼 준다|박스 바깥으로 간다|옆으로 살짝 밀어 준다|벽 옆으로 슈팅 각이/.test(l.t || "")) { lines++; ex.length < 6 && ex.push(`#${k} ${l.minute}' ${l.k}: ${l.t}`); }
  }
  // 재시작(코너·스로인) → 그 뒤 8초 안 같은 팀 슈팅·골
  const ev = S.ev;
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i];
    if (e.type !== "restart" || !["corner", "fk"].includes(e.kind)) continue;
    if (e.kind === "fk" && e.x < 77) continue;                                      // 슈팅을 노릴 만한 프리킥만
    const sp = ev.slice(i + 1, i + 4).find(x => x.type === "spKind");
    const kind = e.kind === "corner" ? "코너_" + (sp?.k || "far") : "프리킥_" + (sp?.k === "layoff" ? "옆으로" : "보통");
    inc(kind);
    let shot = false, goal = false;
    for (let j = i + 1; j < ev.length && ev[j].t - e.t < 8; j++) { const x = ev[j]; if (x.type === "shot" && x.team === e.team) shot = true; if (x.type === "goal" && x.team === e.team) goal = true; if (x.type === "restart") break; }
    if (shot) inc(kind + "/슈팅"); if (goal) { inc(kind + "/골"); goals++; }
  }
}
console.log(`경기 ${games}, 세트피스 갈래 해설 ${lines}줄 (경기당 ${(lines / games).toFixed(2)}), 이 재시작들에서 난 골 경기당 ${(goals / games).toFixed(3)}`);
for (const k of Object.keys(C).filter(k => !k.includes("/")).sort()) console.log(`${k.padEnd(14)} 경기당 ${(C[k] / games).toFixed(2)} | 8초 안 슈팅 ${(100 * (C[k + "/슈팅"] || 0) / C[k]).toFixed(0)}% · 골 ${(100 * (C[k + "/골"] || 0) / C[k]).toFixed(1)}%`);
for (const l of ex) console.log("  해설) " + l);
