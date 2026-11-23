// 상대 포메이션별 경기장 그림: 상대(파랑)가 수비할 때 / 공격할 때 한 장씩
// node tools/dev/form-shots.mjs [출력 폴더]   FORMS=442,4231,433,352  SEED=60000
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve } from "../../js/engine/match.js";
import { FORMS } from "../../js/engine/sim.js";
import { writeFileSync, mkdirSync } from "fs";
const OUT = process.argv[2] || "/tmp/form-shots", SEED = +(process.env.SEED || 60000);
const LIST = (process.env.FORMS || "442,4231,433,352").split(",");
mkdirSync(OUT, { recursive: true });
const ox = (t, x) => (t === "us" ? x : 105 - x);
// 포메이션마다 역할이 실제로 맡는 자리 (그림 글자)
const NAME = {
  "442": { LB: "LB", LCB: "CB", RCB: "CB", RB: "RB", LM: "LM", LCM: "CM", RCM: "CM", RM: "RM", ST1: "ST", ST2: "ST" },
  "4231": { LB: "LB", LCB: "CB", RCB: "CB", RB: "RB", LM: "LW", LCM: "DM", RCM: "DM", RM: "RW", ST1: "ST", ST2: "AM" },
  "433": { LB: "LB", LCB: "CB", RCB: "CB", RB: "RB", LM: "LW", LCM: "DM", RCM: "CM", RM: "RW", ST1: "ST", ST2: "CM" },
  "352": { LB: "CB", LCB: "CB", RCB: "DM", RB: "CB", LM: "WB", LCM: "CM", RCM: "CM", RM: "WB", ST1: "ST", ST2: "ST" },
};
const snap = (S, kind, f, min) => ({ kind, f, min, ball: [S.ball.x, S.ball.y], P: S.P.map(p => ({ team: p.team, role: p.role, x: p.x, y: p.y, hold: p === S.holder })) });
const shots = [];
// AVG=1: 경기 몇 판 동안 상대 역할별 평균 자리 (수비할 때 / 공격할 때 따로) — 한 순간 그림보다 대형이 잘 보임
if (process.env.AVG) {
  for (const f of LIST) {
    const acc = { def: {}, att: {} }, ball = { def: [0, 0, 0], att: [0, 0, 0] };
    for (let k = 0; k < 4; k++) {
      setSeed(SEED + k);
      const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: ["FW", "MF", "DF"][k % 3], foot: "R", growthType: "steady" }));
      let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
      if (!ctx?.fx) continue;
      const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim; S.form.them = f;
      S.onTick = S2 => {
        if (S2.phase !== "play" || S2.stage || S2.scur || S2.script.length || !S2.holder) return;
        const kind = S2.poss === "us" ? "def" : "att", bx = S2.ball.x;
        if (bx < 30 || bx > 75) return;       // 가운데 지역에 공이 있을 때만. 압박하러 뛰쳐나간 선수·공 가진 선수는 빼고 (대형만 보려고)
        for (const p of S2.P) if (p.team === "them" && !p.press && !p.ov && p !== S2.holder) { const a = (acc[kind][p.role] ||= [0, 0, 0]); a[0] += p.x; a[1] += p.y; a[2]++; }
        const b = ball[kind]; b[0] += bx; b[1] += S2.ball.y; b[2]++;
      };
      let g = 0;
      while (!m.done && g++ < 4000) { if (m.pending) { resolve(s, m, Math.floor(rand() * Math.max(1, (m.pending.choices || []).length))); continue; } next(s, m); }
    }
    for (const kind of ["def", "att"]) shots.push({ kind, f, min: "평균", ball: [ball[kind][0] / ball[kind][2], ball[kind][1] / ball[kind][2]],
      P: Object.entries(acc[kind]).map(([role, a]) => ({ team: "them", role, x: a[0] / a[2], y: a[1] / a[2] })) });
  }
}
for (const f of process.env.AVG ? [] : LIST) {
  const got = {};
  for (let k = 0; k < 12 && !(got.def && got.att); k++) {
    setSeed(SEED + k);
    const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: ["FW", "MF", "DF"][k % 3], foot: "R", growthType: "steady" }));
    s.relations.coach = 95;
    let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
    if (!ctx?.fx) continue;
    const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim; S.form.them = f;
    S.onTick = S2 => {
      if (S2.phase !== "play" || S2.stage || S2.scur || S2.script.length || !S2.holder || S2.t - (S2.wonAt ?? -99) < 7) return;
      const min = Math.floor(S2.t * 20 / 60); if (min < 8) return;
      const bx = S2.ball.x;   // 우리 기준 (우리가 오른쪽으로 공격)
      if (!got.def && S2.poss === "us" && bx > 45 && bx < 70) got.def = snap(S2, "def", f, min);
      if (!got.att && S2.poss === "them" && bx > 38 && bx < 62) got.att = snap(S2, "att", f, min);
    };
    let g = 0;
    while (!m.done && g++ < 4000 && !(got.def && got.att)) { if (m.pending) { resolve(s, m, Math.floor(rand() * Math.max(1, (m.pending.choices || []).length))); continue; } next(s, m); }
  }
  for (const v of Object.values(got)) shots.push(v);
}
const svg = sh => {
  const sc = 5, X = x => (x * sc).toFixed(1), Y = y => (y * sc).toFixed(1), N = NAME[sh.f];
  const dots = sh.P.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="8" fill="${p.team === "us" ? "#FF6B1A" : "#3B82F6"}" stroke="${p.hold ? "#FFC24A" : "#fff"}" stroke-width="${p.hold ? 3 : 1.2}" opacity="${p.team === "us" ? 0.55 : 1}"/>`
    + (p.team === "them" && p.role !== "GK" ? `<text x="${X(p.x)}" y="${(p.y * sc - 11).toFixed(1)}" fill="#fff" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">${N[p.role]}</text>` : "")).join("");
  const label = `상대 ${FORMS[sh.f].label} · ${sh.kind === "def" ? "상대(파랑)가 수비할 때" : "상대(파랑)가 공격할 때"} · ${sh.min === "평균" ? "평균 자리" : sh.min + "분"}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${105 * sc}" height="${68 * sc + 28}" viewBox="0 0 ${105 * sc} ${68 * sc + 28}">
<rect width="100%" height="100%" fill="#0A0E17"/><g transform="translate(0,28)"><rect width="${105 * sc}" height="${68 * sc}" fill="#174931"/>
<g stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"><rect x="2" y="2" width="${105 * sc - 4}" height="${68 * sc - 4}"/><line x1="${X(52.5)}" y1="0" x2="${X(52.5)}" y2="${Y(68)}"/><circle cx="${X(52.5)}" cy="${Y(34)}" r="${9.15 * sc}"/>
<rect x="0" y="${Y(13.85)}" width="${X(16.5)}" height="${Y(40.3)}"/><rect x="${X(88.5)}" y="${Y(13.85)}" width="${X(16.5)}" height="${Y(40.3)}"/></g>
${dots}<circle cx="${X(sh.ball[0])}" cy="${Y(sh.ball[1])}" r="4" fill="#fff" stroke="#111"/></g>
<text x="8" y="19" fill="#F2F4F8" font-size="14" font-family="sans-serif" font-weight="700">${label}</text></svg>`;
};
for (const sh of shots) writeFileSync(`${OUT}/${sh.f}_${sh.kind}.svg`, svg(sh));
console.log(shots.map(s => `${s.f} ${s.kind} ${s.min}분`).join("\n"));
