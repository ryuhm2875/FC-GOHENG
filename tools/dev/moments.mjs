// 내 장면(SITUATIONS)이 실제 경기에서 얼마나 자주, 어디서 나오는지 셉니다 (화면 없이).
// node tools/dev/moments.mjs [포지션 FW|MF|DF|all] [경기 수]
// 경기장 시뮬레이션은 공이나 상황이 실제로 나에게 왔을 때 그 자리에 맞는 장면을 고르므로,
// 한 번도 안 나오는 장면이 있으면 data/scenes.js의 at·from이나 엔진의 장면 고르기를 손봐야 합니다.
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";
import { SITUATIONS } from "../../data/match.js";

const which = process.argv[2] || "all", N = +process.argv[3] || 60;
for (const pos of which === "all" ? ["FW", "MF", "DF"] : [which]) {
  const seen = {}, cats = {};
  let total = 0, matches = 0;
  for (let k = 0; k < N; k++) {
    setSeed(9000 + k);
    const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
    const lv = 45 + (k % 5) * 8;                       // 능력치가 다른 선수로 (특기 장면도 나오게)
    for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
    s.relations.coach = 95;
    let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
    if (!ctx.fx) continue;
    const m = prepareMatch(s, ctx.info, ctx.fx);
    if (m.status !== "start") continue;
    matches++;
    let guard = 0;
    while (!m.done && guard++ < 4000) {
      if (m.pending) {
        const id = m.pending.sit.id, b = m.pending.ball;
        const r = (seen[id] ||= { n: 0, x: 0 }); r.n++; r.x += b[0]; total++;
        cats[m.pending.ctx.cat] = (cats[m.pending.ctx.cat] || 0) + 1;
        resolve(s, m, autoChoice(m));
      } else next(s, m);
    }
    finishMatch(s, m);
  }
  const pool = SITUATIONS.filter(x => x.pos.includes(pos));
  const never = pool.filter(x => !seen[x.id]).map(x => x.id + (x.requires ? "*" : "") + (x.wx ? "(날씨)" : ""));
  console.log(`\n== ${pos}: 선발 ${matches}경기, 장면 ${total}번 (경기당 ${(total / Math.max(1, matches)).toFixed(2)})`);
  console.log("상황 종류", JSON.stringify(cats));
  console.log(Object.entries(seen).sort((a, b) => b[1].n - a[1].n).map(([id, r]) => `${id} ${r.n} (x${Math.round(r.x / r.n)})`).join(", "));
  console.log(`한 번도 안 나온 장면 ${never.length}/${pool.length}: ${never.join(", ") || "없음"}  (*능력치 조건, (날씨) 날씨 조건)`);
}
