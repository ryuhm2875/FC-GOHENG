// 경기 국면(잠그기·쫓아가기) 점검: 55분 뒤 앞선 팀·뒤진 팀·동점 팀의 모양과 경기 양상
// node tools/dev/phase-audit.mjs [경기 수]   SEED=70000  PICK=random|auto  SHOW=3
// 국면 기능이 없는 예전 코드에서도 똑같이 돌아감 (점수로만 나눔) → 전후 비교용
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";

const N = +process.argv[2] || 60, SEED = +(process.env.SEED || 70000), PICK = process.env.PICK || "random", SHOW = +(process.env.SHOW || 3);
const ox = (t, x) => (t === "us" ? x : 105 - x), oy = (t, y) => (t === "us" ? y : 68 - y);
const C = {}, inc = (k, v = 1) => { C[k] = (C[k] || 0) + v; };
const ex = {}, note = (k, s) => { ((ex[k] ||= []).length < SHOW) && ex[k].push(s); };
let games = 0, goals = 0, lateGoals = 0, lines = { lockOn: 0, chaseOn: 0 }, lineEx = [];

for (let k = 0; k < N; k++) {
  setSeed(SEED + k);
  const pos = ["FW", "MF", "DF"][k % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  const lv = 45 + (k % 5) * 8;
  for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx?.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx); games++;
  const S = m.sim;
  const cat = team => { const [a, b] = m.score, d = team === "us" ? a - b : b - a; return d > 0 ? "앞섬" : d < 0 ? "뒤짐" : "동점"; };
  let lenRun = {};
  S.onTick = S2 => {
    if (S2.phase !== "play" || S2.stage || S2.scur || S2.script.length) return;
    const min = Math.floor((S2.t - (S2.clockOff || 0)) * 20 / 60);
    const late = min >= 55 ? "55분↑" : min >= 35 && min < 50 ? "후반초" : null;
    if (!late) return;
    for (const team of ["us", "them"]) {
      const c = `${late}/${cat(team)}`, att = S2.poss === team && !!S2.holder;
      const out = S2.P.filter(p => p.team === team && p.pos !== "GK"), xs = out.map(p => ox(team, p.x));
      const len = Math.max(...xs) - Math.min(...xs), bx = ox(team, S2.ball.x);
      inc(`${c}/틱`); inc(`${c}/${att ? "공격" : "수비"}틱`);
      if (S2.gs?.[team].cur) inc(`${c}/국면k합`, S2.gs[team].k);
      if (att) {
        const behind = out.filter(p => ox(team, p.x) < bx - 2).length;
        inc(`${c}/공격_공뒤인원합`, behind);
        if (bx > 52.5 && behind < 3) { inc(`${c}/공격_뒤에3미만(상대진영)`); note(`${c} 뒤에 3명 미만`, `#${k} ${min}분 ${team} 공 x${bx.toFixed(0)} 뒤 ${behind}명`); }
        if (bx > 52.5) inc(`${c}/공격_상대진영틱`);
        if (bx > 40) { const ys = out.map(p => p.y); inc(`${c}/공격_40↑틱`); if (Math.max(...ys) - Math.min(...ys) < 30) inc(`${c}/공격_폭30↓`); }
        const fbMax = Math.max(...out.filter(p => p.pos === "DF").map(p => ox(team, p.x)));
        inc(`${c}/공격_가장높은수비수합`, fbMax);
      } else {
        const own = out.filter(p => ox(team, p.x) < 38).length;
        inc(`${c}/수비_38m안인원합`, own);
      }
      if (len > 45) { inc(`${c}/길이45↑`); lenRun[team] = (lenRun[team] || 0) + 1; if (lenRun[team] === 30) note(`${c} 길이 45m↑ 3초 넘게`, `#${k} ${min}분 ${team} ${len.toFixed(0)}m ${att ? "공격" : "수비"}`); }
      else lenRun[team] = 0;
      inc(`${c}/길이합`, len);
    }
  };
  let guard = 0;
  while (!m.done && guard++ < 4000) {
    if (m.pending) { const ch = m.pending.choices || []; resolve(s, m, PICK === "auto" ? autoChoice(m) : Math.floor(rand() * Math.max(1, ch.length))); continue; }
    const r = next(s, m);
    for (const l of r.lines) { const t = l.t || ""; const kk = /물러나 잠근다|박스 앞으로 내려|박스 앞을 촘촘히/.test(t) ? "lockOn" : /앞으로 올려 보낸다|공격수처럼 올라와|공격에 가담한다|측면 수비까지 앞으로/.test(t) ? "chaseOn" : /골을 넣은 (기세|상대가 기세)|한 골 넣은 상대가 더 거세게|앞에서부터 몰아친다/.test(t) ? "surgeOn" : /한 명씩 더 올라가|미드필더까지 박스 앞으로/.test(t) ? "openOn" : null;
      if (kk) { lines[kk] = (lines[kk] || 0) + 1; lineEx.length < SHOW * 3 && lineEx.push(`#${k} ${l.minute}' ${l.k}: ${t}`); } }
  }
  finishMatch(s, m);
  // 사건: 슈팅(자리)·크로스·긴 패스·골 (팀별 그때 점수 상태는 사건 시각 기준으로 다시 계산)
  const sc = [0, 0];
  for (const e of S.ev) {
    if (e.type === "goal") { goals++; if (e.minute >= 55) lateGoals++; }
    const late = e.minute >= 55 ? "55분↑" : e.minute >= 35 && e.minute < 50 ? "후반초" : null;
    const team = e.team;
    if (late && team && ["shot", "pass"].includes(e.type)) {
      const d = team === "us" ? sc[0] - sc[1] : sc[1] - sc[0], c = `${late}/${d > 0 ? "앞섬" : d < 0 ? "뒤짐" : "동점"}`;
      if (e.type === "shot" && e.kind !== "pk" && e.kind !== "fk") { inc(`${c}/슈팅`); const gd = Math.hypot(105 - e.x, 34 - e.y); if (gd >= 20) inc(`${c}/중거리(20m↑)`); else if (gd < 12) inc(`${c}/문전(12m↓)`); }
      if (e.type === "pass" && !e.silent) { inc(`${c}/패스`); if (e.kind === "cross") inc(`${c}/크로스`); if (e.kind === "long") inc(`${c}/긴패스`); if (e.kind === "through") inc(`${c}/스루`); }
    }
    if (e.type === "goal") { if (e.team === "us") sc[0]++; else sc[1]++; }
  }
}
const f = (a, b, d = 1) => (C[b] ? (C[a] || 0) / C[b] : NaN).toFixed(d);
console.log(`경기 ${games}, 경기당 골 ${(goals / games).toFixed(2)} (55분 뒤 ${(lateGoals / games).toFixed(2)}), 국면 해설 잠그기 ${lines.lockOn} 쫓아가기 ${lines.chaseOn} 몰아치기 ${lines.surgeOn || 0} 난타전 ${lines.openOn || 0}`);
for (const late of ["후반초", "55분↑"]) for (const c of ["앞섬", "뒤짐", "동점"]) {
  const p = `${late}/${c}`; if (!C[`${p}/틱`]) continue;
  console.log(`${p.padEnd(9)} | 틱 ${C[`${p}/틱`]} | 공격 때 공 뒤 평균 ${f(`${p}/공격_공뒤인원합`, `${p}/공격틱`)}명, 상대 진영에서 뒤 3명 미만 ${(100 * (C[`${p}/공격_뒤에3미만(상대진영)`] || 0) / (C[`${p}/공격_상대진영틱`] || 1)).toFixed(1)}%, 가장 높은 수비수 ${f(`${p}/공격_가장높은수비수합`, `${p}/공격틱`)}m`
    + ` | 수비 때 38m 안 ${f(`${p}/수비_38m안인원합`, `${p}/수비틱`)}명 | 공격 폭 30m↓ ${(100 * (C[`${p}/공격_폭30↓`] || 0) / (C[`${p}/공격_40↑틱`] || 1)).toFixed(1)}% | 국면 켜짐 ${(100 * (C[`${p}/국면k합`] || 0) / C[`${p}/틱`]).toFixed(0)}% | 팀 길이 평균 ${f(`${p}/길이합`, `${p}/틱`)}m, 45m↑ ${(100 * (C[`${p}/길이45↑`] || 0) / C[`${p}/틱`]).toFixed(1)}%`);
  console.log(`${"".padEnd(9)} | 경기당 슈팅 ${((C[`${p}/슈팅`] || 0) / games).toFixed(2)} (중거리 ${((C[`${p}/중거리(20m↑)`] || 0) / games).toFixed(2)}, 문전 ${((C[`${p}/문전(12m↓)`] || 0) / games).toFixed(2)}) | 패스 ${((C[`${p}/패스`] || 0) / games).toFixed(1)} 중 크로스 ${((C[`${p}/크로스`] || 0) / games).toFixed(2)}·긴 패스 ${((C[`${p}/긴패스`] || 0) / games).toFixed(2)}·스루 ${((C[`${p}/스루`] || 0) / games).toFixed(2)}`);
}
for (const [k, v] of Object.entries(ex)) console.log(`  예) ${k}: ${v.join(" | ")}`);
for (const l of lineEx) console.log("  해설) " + l);
