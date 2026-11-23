// 경기 국면 장면을 그림(SVG)으로: 55분 뒤 앞선 팀이 수비할 때(잠그기), 뒤진 팀이 상대 진영에서 공격할 때(쫓아가기)
// node tools/dev/phase-shots.mjs [경기 수] [출력 폴더]   SEED=70000
// 같은 시드로 예전 코드에서 돌리면 전후 비교 그림이 나옴 (국면이 없는 코드는 점수로만 고름)
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve } from "../../js/engine/match.js";
import { writeFileSync, mkdirSync } from "fs";

const N = +process.argv[2] || 12, OUT = process.argv[3] || "/tmp/phase-shots", SEED = +(process.env.SEED || 70000);
mkdirSync(OUT, { recursive: true });
const ox = (t, x) => (t === "us" ? x : 105 - x);
const shots = [];
for (let k = 0; k < N; k++) {
  setSeed(SEED + k);
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: ["FW", "MF", "DF"][k % 3], foot: "R", growthType: "steady" }));
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx?.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx), S = m.sim;
  const got = {};
  S.onTick = S2 => {
    if (S2.phase !== "play" || S2.stage || S2.scur || S2.script.length || !S2.holder) return;
    const min = Math.floor((S2.t - (S2.clockOff || 0)) * 20 / 60);
    if (min < 62) return;
    const [a, b] = m.score; if (a === b) return;
    const lead = a > b ? "us" : "them", trail = a > b ? "them" : "us";
    const bxT = ox(trail, S2.ball.x);
    if (!got.lock && S2.poss === trail && bxT > 55 && bxT < 75 && S2.t - (S2.wonAt ?? -99) > 6) got.lock = snap(S2, `lock`, lead, min, m.score);
  };
  let g = 0;
  while (!m.done && g++ < 4000) { if (m.pending) { resolve(s, m, Math.floor(rand() * Math.max(1, (m.pending.choices || []).length))); continue; } next(s, m); }
  for (const v of Object.values(got)) shots.push({ k, ...v });
}
function snap(S, kind, team, min, score) {
  return { kind, team, min, score: [...score], t: S.t, ball: [S.ball.x, S.ball.y], hold: S.P.indexOf(S.holder),
    P: S.P.map(p => ({ team: p.team, role: p.role, x: p.x, y: p.y })), gk: S.gs ? S.gs[team].k : null };
}
// 그림: 화면처럼 우리 팀이 오른쪽으로 공격
const svg = sh => {
  const W = 105, H = 68, sc = 6, X = x => (x * sc).toFixed(1), Y = y => (y * sc).toFixed(1);
  const dots = sh.P.map((p, i) => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="9" fill="${p.team === "us" ? "#FF6B1A" : "#3B82F6"}" stroke="${i === sh.hold ? "#FFC24A" : "#fff"}" stroke-width="${i === sh.hold ? 3 : 1.5}"/><text x="${X(p.x)}" y="${(p.y * sc + 3.5).toFixed(1)}" font-size="9" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">${p.role.replace(/^ST/, "S").replace(/^(L|R)CB$/, "$1C").replace(/^(L|R)CM$/, "$1m")}</text>`).join("");
  const label = `${sh.min}분 ${sh.score[0]}:${sh.score[1]} · 지키는 팀 ${sh.team === "us" ? "주황" : "파랑"}, 쫓는 팀 ${sh.team === "us" ? "파랑" : "주황"} 공격 중${sh.gk != null ? "" : " · 예전 코드"}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * sc}" height="${H * sc + 30}" viewBox="0 0 ${W * sc} ${H * sc + 30}">
<rect width="100%" height="100%" fill="#0A0E17"/><g transform="translate(0,30)"><rect width="${W * sc}" height="${H * sc}" fill="#174931"/>
<g stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"><rect x="2" y="2" width="${W * sc - 4}" height="${H * sc - 4}"/><line x1="${X(52.5)}" y1="0" x2="${X(52.5)}" y2="${Y(68)}"/><circle cx="${X(52.5)}" cy="${Y(34)}" r="${9.15 * sc}"/>
<rect x="0" y="${Y(13.85)}" width="${X(16.5)}" height="${Y(40.3)}"/><rect x="${X(88.5)}" y="${Y(13.85)}" width="${X(16.5)}" height="${Y(40.3)}"/></g>
${dots}<circle cx="${X(sh.ball[0])}" cy="${Y(sh.ball[1])}" r="4" fill="#fff" stroke="#111"/></g>
<text x="10" y="20" fill="#F2F4F8" font-size="15" font-family="sans-serif" font-weight="700">${label}</text></svg>`;
};
for (const sh of shots) writeFileSync(`${OUT}/${String(sh.k).padStart(2, "0")}_${sh.kind}.svg`, svg(sh));
console.log(shots.map(s => `#${s.k} ${s.kind} ${s.min}분 ${s.score.join(":")} ${s.team}`).join("\n"));
