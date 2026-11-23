// 상대 포메이션별 대형 수치: 상대가 수비할 때/공격할 때 팀 길이·폭, 공 뒤(자기 골문 쪽) 인원, 3m 안에 겹친 짝, 수비 라인 높이, 자기 진영 깊이 내려간 공격수
// node tools/dev/form-metrics.mjs [경기 수]   FORMS=442,4231,433,352
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve } from "../../js/engine/match.js";
const N = +process.argv[2] || 8, LIST = (process.env.FORMS || "442,4231,433,352").split(",");
const ox = (t, x) => (t === "us" ? x : 105 - x);
const hyp = Math.hypot;
for (const f of LIST) {
  const A = { def: {}, att: {} }, add = (k, n, v) => { const o = (A[k][n] ||= [0, 0]); o[0] += v; o[1]++; };
  for (let k = 0; k < N; k++) {
    setSeed(61000 + k);
    const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: ["FW", "MF", "DF"][k % 3], foot: "R", growthType: "steady" }));
    let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
    if (!ctx?.fx) continue;
    const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim; S.form.them = f; m.oppForm = f;
    S.onTick = S2 => {
      if (S2.phase !== "play" || S2.stage || S2.scur || S2.script.length || !S2.holder) return;
      const kind = S2.poss === "us" ? "def" : "att";
      const T = S2.P.filter(p => p.team === "them" && p.pos !== "GK"), bx = ox("them", S2.ball.x);
      const xs = T.map(p => ox("them", p.x)), ys = T.map(p => p.y);
      add(kind, "길이", Math.max(...xs) - Math.min(...xs)); add(kind, "폭", Math.max(...ys) - Math.min(...ys));
      add(kind, "공 뒤 인원", xs.filter(x => x < bx).length);
      let ov = 0; for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) if (hyp(T[i].x - T[j].x, T[i].y - T[j].y) < 3 && !T[i].press && !T[j].press) ov++;
      add(kind, "겹친 짝(3m)", ov);
      const back = xs.slice().sort((a, b) => a - b); add(kind, "최후방 라인", (back[1] + back[2]) / 2);
      if (kind === "def") add(kind, "공격수가 자기 진영 30m 안", T.filter(p => p.pos === "FW" && !(f === "433" && p.role === "ST2") && ox("them", p.x) < 30).length);
      if (kind === "att") add(kind, "공보다 앞 인원", xs.filter(x => x > bx).length);
    };
    let g = 0;
    while (!m.done && g++ < 4000) { if (m.pending) { resolve(s, m, Math.floor(rand() * Math.max(1, (m.pending.choices || []).length))); continue; } next(s, m); }
  }
  const fmt = k => Object.entries(A[k]).map(([n, [a, c]]) => `${n} ${(a / c).toFixed(n.includes("짝") || n.includes("공격수") ? 2 : 1)}`).join(" · ");
  console.log(`■ ${f}\n  수비: ${fmt("def")}\n  공격: ${fmt("att")}`);
}
