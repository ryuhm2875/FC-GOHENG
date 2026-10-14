// 축구다운 움직임 측정 (화면 없이). node tools/dev/football.mjs [경기 수]
// - 묶임: 가려는 곳이 3m 넘게 남았는데 1.5초 넘게 거의 못 움직인 선수 / 3명 이상이 2.5m 안에 2초 넘게 뭉침
// - 공격 한 번(소유)마다 패스 수, 패스 길이(짧은 15m 미만·중간·긴 30m 이상), 드리블 거리, 소유 시간
// - 공 없는 선수: 거의 서 있는 비율(초속 0.5m 미만), 팀 폭·길이
// - 공 가진 선수: 서 있는 시간 비율
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";

const N = +process.argv[2] || 30, SHOW = +(process.env.SHOW || 5);
const issues = {}, samples = {};
const bad = (k, msg) => { issues[k] = (issues[k] || 0) + 1; (samples[k] ||= []).length < SHOW && samples[k].push(msg); };
const A = { ends: {}, ticks: 0, offStill: 0, offN: 0, holdStill: 0, holdN: 0, poss: [], passes: [], drib: 0, dribT: 0, width: 0, depth: 0, wn: 0, shots: 0, games: 0, playT: 0 };
for (let k = 0; k < N; k++) {
  setSeed(40000 + k);
  const pos = ["FW", "MF", "DF"][k % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx);
  const S = m.sim; A.games++;
  const st = new Map();            // 선수별 묶임 시간
  let cl = 0, cur = null, lastH = null, lastHx = 0, lastHy = 0;
  let clAll = 0;
  S.onTick = S2 => {
    // 뭉침은 장면 연출·대본 중에도 셈
    if (S2.phase === "play") {
      let worst = 0;
      for (const p of S2.P) { let c = 0; for (const q of S2.P) if (q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 2.5) c++; worst = Math.max(worst, c + 1); }
      clAll = worst >= 4 ? clAll + 0.1 : 0;
      if (Math.abs(clAll - 2) < 0.05) bad("4명 이상 뭉침 2초+ (" + (S2.stage ? "장면 연출" : S2.scur ? "대본 " + (S2.scur.name || "") : "경기 흐름") + ")", `[#${k} t${S2.t.toFixed(1)} ${Math.floor(S2.t / 3)}']`);
    }
    if (S2.phase !== "play" || S2.stage || S2.scur) { cur = null; return; }
    A.ticks++; A.playT += 0.1;
    const H = S2.holder;
    for (const p of S2.P) {
      const v = Math.hypot(p.vx, p.vy), far = Math.hypot(p.tx - p.x, p.ty - p.y);
      if (p !== H && p.pos !== "GK") { A.offN++; if (v < 0.5) A.offStill++; }
      if (far > 3 && v < 0.6) { const t = (st.get(p) || 0) + 0.1; st.set(p, t); if (Math.abs(t - 1.5) < 0.05) bad("가려는 곳이 있는데 묶여 못 움직임", `[#${k} t${S2.t.toFixed(1)} ${Math.floor(S2.t / 3)}'] ${p.name}(${p.team} ${p.pos}) 목표까지 ${far.toFixed(0)}m`); }
      else st.set(p, 0);
    }
    if (H) { A.holdN++; if (Math.hypot(H.vx, H.vy) < 0.5) A.holdStill++; }
    // 뭉침
    let worst = 0;
    for (const p of S2.P) { let c = 0; for (const q of S2.P) if (q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 2.5) c++; worst = Math.max(worst, c + 1); }

    // 팀 모양 (공격 팀)
    if (S2.poss) { const xs = S2.P.filter(p => p.team === S2.poss && p.pos !== "GK"); const ys = xs.map(p => p.y), xx = xs.map(p => p.x); A.width += Math.max(...ys) - Math.min(...ys); A.depth += Math.max(...xx) - Math.min(...xx); A.wn++; }
    // 드리블 (공 가진 선수가 움직인 거리)
    if (H && H === lastH) { const d = Math.hypot(H.x - lastHx, H.y - lastHy); A.drib += d; }
    lastH = H; if (H) { lastHx = H.x; lastHy = H.y; }
  };
  // 소유 단위로 패스 세기
  let seen = 0, possT = null, possTeam = null, nPass = 0, bTeam = null, bPass = 0;
  const closePoss = t => { if (possTeam) A.poss.push({ passes: nPass, dur: t - possT }); };
  let guard = 0;
  while (!m.done && guard++ < 4000) {
    if (m.pending) { resolve(s, m, autoChoice(m)); continue; }
    next(s, m);
    for (; seen < S.ev.length; seen++) {
      const e = S.ev[seen];
      if (e.type === "pass" && !e.silent && e.kind !== "reset") {
        const d = e.tx != null && e.fx != null ? Math.abs(e.tx - e.fx) : null;
        A.passes.push({ kind: e.kind, dx: d });
        if (e.team !== possTeam) { closePoss(e.t); possTeam = e.team; possT = e.t; nPass = 0; }
        nPass++;
      }
      if (e.type === "build") { A.builds = (A.builds || 0) + 1; bTeam = e.team; bPass = 0; }
      if (bTeam && e.type === "pass" && e.team === bTeam) bPass++;
      if (bTeam && ["intercept", "tackle", "claim", "win", "out", "shot", "offside", "foul", "header"].includes(e.type)) { (A.bp ||= []).push(bPass); if (bPass <= 1) { const kk = e.type + (e.team === bTeam ? "(우리)" : ""); (A.b0 ||= {})[kk] = (A.b0[kk] || 0) + 1; } bTeam = null; }
      if (["intercept", "tackle", "claim", "win", "out", "shot", "offside", "foul", "header"].includes(e.type)) { if (possTeam) { const key = e.type + (nPass >= 3 ? "(패스3+)" : ""); A.ends[key] = (A.ends[key] || 0) + 1; } closePoss(e.t); possTeam = null; nPass = 0; if (e.type === "shot") A.shots++; }
    }
  }
  finishMatch(s, m);
}
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + "%";
const P = A.poss.filter(p => p.dur > 0.5);
const pc = P.map(p => p.passes).sort((a, b) => a - b);
const kinds = {}; for (const p of A.passes) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
console.log(`경기 ${A.games}, 경기 진행 시간 ${(A.playT / A.games).toFixed(0)}초/경기 (시뮬레이션)`);
console.log(`소유 ${P.length} (경기당 ${(P.length / A.games).toFixed(0)}): 소유당 패스 평균 ${(pc.reduce((a, b) => a + b, 0) / pc.length).toFixed(1)}, 중앙값 ${pc[pc.length >> 1]}, 패스 0~1번 ${pct(pc.filter(x => x <= 1).length, pc.length)}, 3번 이상 ${pct(pc.filter(x => x >= 3).length, pc.length)}, 5번 이상 ${pct(pc.filter(x => x >= 5).length, pc.length)}`);
console.log(`패스 경기당 ${(A.passes.length / A.games).toFixed(0)} 종류 ${JSON.stringify(kinds)}`);
console.log(`드리블 거리 경기당 ${(A.drib / A.games).toFixed(0)}m, 공 가진 선수가 서 있는 비율 ${pct(A.holdStill, A.holdN)}, 공 없는 선수가 서 있는 비율 ${pct(A.offStill, A.offN)}`);
console.log("공격이 끝난 이유", JSON.stringify(Object.fromEntries(Object.entries(A.ends).sort((a, b) => b[1] - a[1]))), "빌드업 시작/경기", ((A.builds || 0) / A.games).toFixed(1), "빌드업에서 시작한 공격의 패스 수 분포", JSON.stringify((A.bp || []).reduce((o, n) => (o[Math.min(n, 8)] = (o[Math.min(n, 8)] || 0) + 1, o), {})), "패스 0~1번에 끝난 이유", JSON.stringify(A.b0));
console.log(`공격 팀 폭 ${(A.width / A.wn).toFixed(0)}m 길이 ${(A.depth / A.wn).toFixed(0)}m, 슈팅 경기당 ${(A.shots / A.games).toFixed(1)}`);
for (const kk of Object.keys(issues).sort((a, b) => issues[b] - issues[a])) { console.log(`\n■ ${kk}: ${issues[kk]}건 (경기당 ${(issues[kk] / A.games).toFixed(1)})`); for (const x of samples[kk]) console.log("   " + x); }
