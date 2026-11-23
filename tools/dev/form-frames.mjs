// 상대 포메이션 연속 그림: 상대(파랑)가 수비하는 한 장면을 1초 간격 여섯 장 + 공격하는 장면 여섯 장
// node tools/dev/form-frames.mjs [출력 폴더]   FORMS=352  SEED=60000  K=0(몇 번째 경기)
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve } from "../../js/engine/match.js";
import { FORMS } from "../../js/engine/sim.js";
import { writeFileSync, mkdirSync } from "fs";
const OUT = process.argv[2] || "/tmp/form-frames", SEED = +(process.env.SEED || 60000), K = +(process.env.K || 0);
const LIST = (process.env.FORMS || "442,4231,433,352").split(",");
mkdirSync(OUT, { recursive: true });
const NAME = {
  "442": { LB: "LB", LCB: "CB", RCB: "CB", RB: "RB", LM: "LM", LCM: "CM", RCM: "CM", RM: "RM", ST1: "ST", ST2: "ST" },
  "4231": { LB: "LB", LCB: "CB", RCB: "CB", RB: "RB", LM: "LW", LCM: "DM", RCM: "DM", RM: "RW", ST1: "ST", ST2: "AM" },
  "433": { LB: "LB", LCB: "CB", RCB: "CB", RB: "RB", LM: "LW", LCM: "DM", RCM: "CM", RM: "RW", ST1: "ST", ST2: "CM" },
  "352": { LB: "CB", LCB: "CB", RCB: "DM", RB: "CB", LM: "WB", LCM: "CM", RCM: "CM", RM: "WB", ST1: "ST", ST2: "ST" },
};
const snap = (S, f, kind, i) => ({ f, kind, i, t: S.t, ball: [S.ball.x, S.ball.y], P: S.P.map(p => ({ team: p.team, role: p.role, x: p.x, y: p.y, hold: p === S.holder, press: p.press })) });
const svg = sh => {
  const sc = 4, X = x => (x * sc).toFixed(1), Y = y => (y * sc).toFixed(1), N = NAME[sh.f];
  const dots = sh.P.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="6.5" fill="${p.team === "us" ? "#FF6B1A" : "#3B82F6"}" stroke="${p.hold ? "#FFC24A" : p.press ? "#ff3b3b" : "#fff"}" stroke-width="${p.hold || p.press ? 2.5 : 1}"/>`
    + (p.team === "them" && p.role !== "GK" ? `<text x="${X(p.x)}" y="${(p.y * sc - 9).toFixed(1)}" fill="#fff" font-size="9" font-family="sans-serif" font-weight="700" text-anchor="middle">${N[p.role]}</text>` : "")).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${105 * sc}" height="${68 * sc + 22}" viewBox="0 0 ${105 * sc} ${68 * sc + 22}">
<rect width="100%" height="100%" fill="#0A0E17"/><g transform="translate(0,22)"><rect width="${105 * sc}" height="${68 * sc}" fill="#174931"/>
<g stroke="rgba(255,255,255,.35)" stroke-width="1.5" fill="none"><rect x="1" y="1" width="${105 * sc - 2}" height="${68 * sc - 2}"/><line x1="${X(52.5)}" y1="0" x2="${X(52.5)}" y2="${Y(68)}"/><circle cx="${X(52.5)}" cy="${Y(34)}" r="${9.15 * sc}"/>
<rect x="0" y="${Y(13.85)}" width="${X(16.5)}" height="${Y(40.3)}"/><rect x="${X(88.5)}" y="${Y(13.85)}" width="${X(16.5)}" height="${Y(40.3)}"/></g>
${dots}<circle cx="${X(sh.ball[0])}" cy="${Y(sh.ball[1])}" r="3.5" fill="#fff" stroke="#111"/></g>
<text x="6" y="15" fill="#F2F4F8" font-size="12" font-family="sans-serif" font-weight="700">${FORMS[sh.f].label} ${sh.kind === "def" ? "상대 수비" : "상대 공격"} ${sh.i + 1}/6 (${(sh.t * 20 / 60).toFixed(1)}분)</text></svg>`;
};
for (const f of LIST) {
  setSeed(SEED + K);
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: "MF", foot: "R", growthType: "steady" }));
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim; S.form.them = f; m.oppForm = f;
  const seq = { def: [], att: [] }; let cur = null, next0 = 0;
  S.onTick = S2 => {
    if (S2.t < 60) return;
    if (cur) { if (S2.phase !== "play" || S2.poss !== cur.poss) { if (seq[cur.kind].length < 6) seq[cur.kind] = []; cur = null; return; }
      if (S2.t >= next0) { seq[cur.kind].push(snap(S2, f, cur.kind, seq[cur.kind].length)); next0 = S2.t + 1; if (seq[cur.kind].length >= 6) cur = null; } return; }
    if (S2.phase !== "play" || S2.stage || S2.scur || S2.script.length || !S2.holder) return;
    const bx = S2.ball.x;
    if (seq.def.length < 6 && S2.poss === "us" && bx > 30 && bx < 55 && S2.t - (S2.wonAt ?? -99) > 2) { cur = { kind: "def", poss: "us" }; next0 = S2.t; }
    else if (seq.att.length < 6 && S2.poss === "them" && bx > 50 && bx < 75 && S2.t - (S2.wonAt ?? -99) > 2) { cur = { kind: "att", poss: "them" }; next0 = S2.t; }
  };
  let g = 0;
  while (!m.done && g++ < 4000 && !(seq.def.length >= 6 && seq.att.length >= 6)) { if (m.pending) { resolve(s, m, Math.floor(rand() * Math.max(1, (m.pending.choices || []).length))); continue; } next(s, m); }
  for (const k of ["def", "att"]) seq[k].forEach(sh => writeFileSync(`${OUT}/${f}_${k}_${sh.i}.svg`, svg(sh)));
  console.log(f, seq.def.length, seq.att.length);
}
