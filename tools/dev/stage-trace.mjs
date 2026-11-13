// 차 주는 연출(callIn)·측면 파고드는 연출(byline)이 자연스러운지: 연출 시간, 선수·공 최고 속도(순간이동이면 크게 나옴), 0.5초 간격 위치 기록
// node tools/dev/stage-trace.mjs 60 FW   (SHOW=보여 줄 장면 수, ONLY=장면 id들)
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";
const POS = process.argv[3] || "FW"; const st = {}; let shown = 0; const SHOW = +(process.env.SHOW || 2);
for (let k = 0; k < +process.argv[2]; k++) {
  setSeed(60000 + k * 7 + 2);
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: POS, foot: "R", growthType: "rookie" }));
  for (const gg of ["tech","phys","mental"]) for (const q in s.player.stats[gg]) s.player.stats[gg][q] = 45 + (k % 5) * 8;
  for (let mi = 0; mi < 4; mi++) { s.relations.coach = 95;
    let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
    if (!ctx?.fx) break; s.relations.coach = 95;
    const m = prepareMatch(s, ctx.info, ctx.fx); let g = 0, cur = null, prev = null;
    while (!m.done && g++ < 4000) {
      if (m.sim && !m.sim.onTick) m.sim.onTick = S => {
        const sg = m.staging, c = sg?.ctx;
        if (sg && (c.callIn || c.byline)) {
          const key = c.callIn || "byline";
          if (cur?.sg !== sg) { cur = { sg, key, id: sg.sit.id, t0: S.t, maxV: 0, maxB: 0, log: [] }; prev = null; }
          const M = S.P.find(p => p.me), b = S.ball;
          if (prev) { const dt = S.t - prev.t; if (dt > 0) { for (const p of S.P) { const q = prev.P.get(p); if (q) cur.maxV = Math.max(cur.maxV, Math.hypot(p.x - q[0], p.y - q[1]) / dt); } cur.maxB = Math.max(cur.maxB, Math.hypot(b.x - prev.b[0], b.y - prev.b[1]) / dt); } }
          prev = { t: S.t, P: new Map(S.P.map(p => [p, [p.x, p.y]])), b: [b.x, b.y] };
          if (!cur.log.length || S.t - cur.lt >= 0.5) { cur.lt = S.t; cur.log.push(`t+${(S.t - cur.t0).toFixed(1)} 공(${b.x.toFixed(0)},${b.y.toFixed(0)}) 나(${M.x.toFixed(0)},${M.y.toFixed(0)}) 찬 선수(${(c.crosser || c.holder).x.toFixed(0)},${(c.crosser || c.holder).y.toFixed(0)})`); }
          cur.dur = S.t - cur.t0;
        } else if (cur) { const a = st[cur.id] ||= { n: 0, dur: 0, maxDur: 0, maxV: 0, maxB: 0 }; a.n++; a.dur += cur.dur; a.maxDur = Math.max(a.maxDur, cur.dur); a.maxV = Math.max(a.maxV, cur.maxV); a.maxB = Math.max(a.maxB, cur.maxB);
          if (shown < SHOW && (!process.env.ONLY || process.env.ONLY.includes(cur.id))) { shown++; console.log("—", cur.id, "\n  " + cur.log.join("\n  ")); } cur = null; }
      };
      if (m.pending) { resolve(s, m, autoChoice(m)); continue; } next(s, m);
    }
    finishMatch(s, m); endWeek(s, ctx, null);
  }
}
for (const [id, a] of Object.entries(st)) console.log(id, `${a.n}번 | 연출 평균 ${(a.dur / a.n).toFixed(1)}초 최대 ${a.maxDur.toFixed(1)}초 | 선수 최고 속도 ${a.maxV.toFixed(1)}m/s | 공 최고 속도 ${a.maxB.toFixed(0)}m/s`);
