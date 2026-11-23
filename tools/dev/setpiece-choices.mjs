// 세트피스 갈래 선택지(뒤로 깔아 줌·벽 옆·상대 짧은 코너·짧게 받기·박스 바깥)를 일부러 골라 경기장과 맞대 봄
// node tools/dev/setpiece-choices.mjs [경기 수]   POS=DF  S0=82000   (해당 장면 비중 ×80, 우리 코너킥·프리킥 키커를 나로)
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { SITUATIONS } from "../../data/match.js";
import { prepareMatch, next, resolve } from "../../js/engine/match.js";
const NEW = /뒤로 깔아 준다|벽 옆 동료에게|짧게 주는 걸 보고|코너 쪽으로 나가 짧게|박스 바깥에서 빼 주는/;
for (const s of SITUATIONS) if (["mf_corner", "freekick", "df_corner_choice", "df_corner_attack", "df_corner"].includes(s.id)) s.weight *= 80;
const res = {}; const ex = [];
const N = +(process.argv[2] || 300);
for (let k = 0; k < N; k++) { setSeed(+(process.env.S0 || 82000) + k);
  const pos = process.env.POS || ["FW", "MF", "DF"][k % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" })); s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim; const T = [];
  S.onTick = S2 => { const R = S2.restart; if (R && !R.ready && R.team === "us" && ["corner", "fk"].includes(R.kind) && pos !== "DF") { const me = S2.P.find(p => p.me); if (me) R.taker = me; }
    T.push({ t: S2.t, x: S2.ball.x, y: S2.ball.y, z: S2.ball.z, fl: S2.ball.fl ? (S2.ball.fl.air ? "A" : "G") : "", h: S2.holder ? (S2.holder.me ? "나" : S2.holder.team + ":" + S2.holder.role) : "", shot: !!S2.shot }); };
  let g = 0;
  while (!m.done && g++ < 4000) {
    if (m.pending) { const ch = m.pending.choices || []; const idx = ch.map((c, j) => NEW.test(c.label) ? j : -1).filter(j => j >= 0); const i = idx.length ? idx[(globalThis.__rot = (globalThis.__rot || 0) + 1) % idx.length] : -1;
      if (i < 0) { resolve(s, m, Math.floor(rand() * Math.max(1, ch.length))); continue; }
      const lab = ch[i].label, t0 = S.t, sid = m.pending.sit?.id; const r = resolve(s, m, i); const lines = [...r.lines];
      while (!m.done && S.t - t0 < 9) lines.push(...next(s, m).lines);
      const W = T.filter(f => f.t >= t0 && f.t <= t0 + 9);
      // 공 이동 구간
      const legs = []; let cur = null;
      for (const f of W) { if (f.fl && !cur) cur = { t: f.t, x0: f.x, y0: f.y, k: f.fl }; if (!f.fl && cur) { legs.push({ ...cur, x1: f.x, y1: f.y, d: Math.hypot(f.x - cur.x0, f.y - cur.y0), to: f.h, shot: W.some(q => q.t >= cur.t && q.t <= f.t && q.shot) }); cur = null; } }
      const txt = lines.filter(l => /^me|goal/.test(l.k || "")).map(l => l.t).join(" / ");
      const win = !/한 발 늦었다|걷어 냈|막혔|끊어 냈|골대 위로/.test(txt);
      const first = legs[0];
      let ok = false, why = "";
      if (/뒤로 깔아/.test(lab)) { ok = first && first.k === "G" && first.x1 > 84 && first.x1 < 96 && first.d > 8; why = "첫 패스 땅볼, 코너에서 박스 안 뒤쪽(84~96)"; }
      if (/벽 옆/.test(lab)) { ok = first && first.k === "G" && first.d <= 10; why = "첫 패스 땅볼 10m 안"; }
      if (/짧게 주는 걸 보고/.test(lab)) { ok = first && first.k === "G" && first.d <= 12 && first.x0 < 2; why = "상대 코너에서 땅볼 12m 안"; }
      if (/코너 쪽으로 나가/.test(lab)) { ok = first && first.k === "G" && first.d <= 12 && first.to === "나"; why = "코너에서 나에게 땅볼 12m 안"; }
      if (/박스 바깥에서 빼/.test(lab)) { ok = first && first.k === "G" && first.x1 > 80 && first.x1 < 90 && first.to === "나" && legs.some(l => l.shot); why = "코너에서 박스 바깥(80~90)의 나에게 땅볼, 그 뒤 슈팅"; }
      if (ok && win && /올렸다|크로스/.test(txt)) ok = legs.slice(1).some(l => l.k === "A"), why += " + 크로스(띄운 공)";
      if (ok && /때린다|발이 그대로 공을 때린다|침착하게 차 넣/.test(txt)) ok = legs.some(l => l.shot), why += " + 슈팅";
      const key = sid + " | " + lab; const R0 = res[key] ||= { n: 0, bad: 0 }; R0.n++; if (!ok) { R0.bad++; if (ex.length < 12) ex.push(`[${pos} #${k}] ${lab}: ${txt.slice(0, 90)}\n     기대: ${why}\n     구간: ${legs.slice(0, 4).map(l => `${l.k} (${l.x0.toFixed(0)},${l.y0.toFixed(0)})→(${l.x1.toFixed(0)},${l.y1.toFixed(0)}) ${l.d.toFixed(0)}m ${l.to}${l.shot ? " 슈팅" : ""}`).join(" | ")}`); }
      continue; }
    next(s, m); } }
console.log(res); console.log(ex.join("\n"));
