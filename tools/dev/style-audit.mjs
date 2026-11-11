// 팀 성향이 경기장에 보이는지: 상대 성향별로 상대 수비 라인 높이·폭·자기 진영 인원·압박·역습 패스, 해설 횟수
// node tools/dev/style-audit.mjs [경기 수]   SEED=40000
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";
import { styleOf } from "../../js/engine/advice.js";
const N = +process.argv[2] || 60, SEED = +(process.env.SEED || 40000);
const G = {};
const ox = (t, x) => (t === "us" ? x : 105 - x);
for (let k = 0; k < N; k++) {
  setSeed(SEED + k);
  const pos = ["FW", "MF", "DF"][k % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "rookie" }));
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim;
  const key = styleOf(ctx.fx.opponent.name).key || "?";
  const g = G[key] ||= { games: 0, f: 0, line: 0, lineMid: 0, nMid: 0, wid: 0, own: 0, ev: {}, lines: {}, len: 0, aw: [0, 0], an: [0, 0], an30: 0, gf: 0, ga: 0, first: 0 };
  g.games++;
  S.onTick = S2 => {
    if (S2.phase === "play" && S2.poss === "them" && S2.holder && ox("them", S2.ball.x) > 40 && Math.round(S2.t * 10) % 5 === 0) {   // 상대가 우리 진영에서 공격할 때 폭
      const ys = S2.P.filter(p => p.team === "them" && p.ri).map(p => p.y), w = Math.max(...ys) - Math.min(...ys), fresh = S2.t - (S2.wonAt ?? -99) < 4;
      g.aw[fresh ? 0 : 1] += w; g.an[fresh ? 0 : 1]++; if (w < 30) g.an30++;
    }
    if (S2.phase !== "play" || S2.poss !== "us" || !S2.holder || Math.round(S2.t * 10) % 5) return;   // 상대가 수비할 때, 0.5초마다
    const D = S2.P.filter(p => p.team === "them" && p.pos === "DF"), F = S2.P.filter(p => p.team === "them" && p.ri);
    const lx = D.reduce((a, p) => a + ox("them", p.x), 0) / D.length, ys = F.map(p => p.y), xs = F.map(p => ox("them", p.x));
    const bx = ox("them", S2.ball.x);
    g.f++; g.line += lx; g.wid += Math.max(...ys) - Math.min(...ys); g.own += F.filter(p => ox("them", p.x) < 52.5).length; g.len += Math.max(...xs) - Math.min(...xs);
    if (bx > 50 && bx < 70) { g.lineMid += lx; g.nMid++; }
  };
  const L = []; let guard = 0;
  while (!m.done && guard++ < 4000) {
    if (m.pending) { L.push(...resolve(s, m, autoChoice(m)).lines); continue; }
    L.push(...next(s, m).lines);
  }
  for (const e of S.ev) if (e.type === "step" && e.first && e.team === "them" && e.play === "counter") g.ev.counterPlay = (g.ev.counterPlay || 0) + 1;
  for (const e of S.ev) if (["lineHigh", "sitDeep", "gegen", "counterGo"].includes(e.type)) g.ev[e.type + ":" + e.team] = (g.ev[e.type + ":" + e.team] || 0) + 1;
  for (const l of L) { if (/^오늘 상대/.test(l.t || "")) g.first++; for (const [id, re] of [["라인올림", /하프라인 (가까이|근처까지)/], ["되찾기", /잃자마자|되찾으러|다시 뺏으러/], ["내려앉음", /내려앉아 기다|촘촘히 내려/], ["역습패스", /앞으로 길게 찬다|한 번에 넘기는|길게 넘긴다/]]) if (re.test(l.t || "")) g.lines[id] = (g.lines[id] || 0) + 1; }
  g.gf += m.score[0]; g.ga += m.score[1];
  finishMatch(s, m);
}
const r = v => v.toFixed(1);
for (const [k, g] of Object.entries(G).sort((a, b) => b[1].games - a[1].games))
  console.log(`${k.padEnd(8)} ${String(g.games).padStart(3)}경기 | 상대 라인 ${r(g.line / g.f)}m (공이 그 팀 50~70m: ${r(g.lineMid / Math.max(1, g.nMid))}m) 폭 ${r(g.wid / g.f)}m 길이 ${r(g.len / g.f)}m 자기 진영 ${r(g.own / g.f)}명 | 공격 폭 뺏은 직후 ${r(g.aw[0] / Math.max(1, g.an[0]))}m·그 뒤 ${r(g.aw[1] / Math.max(1, g.an[1]))}m 30m 미만 ${r(100 * g.an30 / Math.max(1, g.an[0] + g.an[1]))}% | 득실 ${r(g.gf / g.games)}:${r(g.ga / g.games)} | 첫 줄 ${g.first} | 사건 ${JSON.stringify(g.ev)} 해설 ${JSON.stringify(g.lines)}`);
