// 중계 점검: 해설 줄 하나하나를 그 순간의 경기장 기록과 맞대 봅니다 (화면 없이).
// node tools/dev/audit.mjs [경기 수] [포지션 FW|MF|DF|all]   자세히: SHOW=10 (문제 예시 수)
// 보는 것
//  - 이름: 줄에 나온 선수가 그 무렵(줄 시각 -2초 ~ +1.5초) 공 가까이(12m) 있었는지
//  - 골: 골 문장 때 공이 골문 안에 있는지 / 선방·골대: 골문 근처인지 / 코너킥: 코너 근처에서 차는지
//  - 공백: 해설이 시뮬레이션 15초(경기 5분) 넘게 끊기는 구간 / 같은 경기 같은 문장 반복
//  - 움직임: 선수 초속 12m 초과, 공 초속 48m 초과, 경기장 밖, 두 선수가 1초 넘게 겹침
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";
import { SCENES } from "../../data/scenes.js";
import { DETAIL_POS } from "../../data/player.js";
const ZONE_BOX = { att: [[78, 94], [16, 52]], mid: [[44, 66], [8, 60]], def: [[10, 32], [8, 60]] };

const N = +process.argv[2] || 60, which = process.argv[3] || "all", SHOW = +(process.env.SHOW || 6);
const issues = {}, samples = {};
const bad = (kind, msg) => { issues[kind] = (issues[kind] || 0) + 1; (samples[kind] ||= []).length < SHOW && samples[kind].push(msg); };
let games = 0, lines = 0, gapSum = 0, gapN = 0; const sceneD = [];
const ACTION = new Set(["us", "them", "me-auto", "info", "card", "goal-us", "goal-them", "goal-me"]);

for (let k = 0; k < N; k++) {
  setSeed(20000 + k);
  const pos = which === "all" ? ["FW", "MF", "DF"][k % 3] : which;
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  if (process.env.DETAIL) { const ks = Object.keys(DETAIL_POS).filter(x => DETAIL_POS[x].pos === pos && (process.env.DETAIL === "all" || process.env.DETAIL.split(",").includes(x))); if (ks.length) s.player.detailPos = ks[k % ks.length]; }   // DETAIL=all 또는 DETAIL=winger_l,fb_r: 세부 포지션을 정해 두고 시험
  const lv = 45 + (k % 5) * 8;
  for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx);
  m.record = true; games++;
  const S = m.sim, frames = [], L = [];
  // 틱마다: 공 가진 선수와 공 거리, 골키퍼 위치, 아무도 안 쫓는 공, 공 갖고 멈춰 선 선수
  const run = { far: 0, loose: 0, still: 0, stillP: null, stillX: 0, stillY: 0 };
  S.onTick = S2 => {
    const t = `[${pos} #${k} t${S2.t.toFixed(1)} ${Math.min(70, Math.floor(S2.t / 3))}']`;
    const H = S2.holder, b = S2.ball;
    if (S2.phase === "play" && H && !b.fl) {
      const d = Math.hypot(H.x - b.x, H.y - b.y);
      run.far = d > 2 ? run.far + 0.1 : 0;
      if (Math.abs(run.far - 0.6) < 0.05) bad("공 가진 선수와 공이 떨어져 있음", `${t} ${H.name} ${d.toFixed(1)}m`);
      if (run.stillP === H && Math.hypot(H.x - run.stillX, H.y - run.stillY) < 0.4 && !S2.stage && !S2.scur) { run.still += 0.1; if (Math.abs(run.still - 3) < 0.05) bad("공을 갖고 3초 넘게 멈춰 섬", `${t} ${H.name} (${H.pos})`); }
      else { run.still = 0; run.stillP = H; run.stillX = H.x; run.stillY = H.y; }
    } else { run.far = 0; run.still = 0; run.stillP = null; }
    if (S2.phase === "play" && !H && !b.fl && b.x > 1 && b.x < 104 && b.y > 1 && b.y < 67) {
      let dn = 99; for (const p of S2.P) dn = Math.min(dn, Math.hypot(p.x - b.x, p.y - b.y));
      run.loose = dn > 3 ? run.loose + 0.1 : 0;
      if (Math.abs(run.loose - 2) < 0.05) bad("흘러 있는 공을 2초 넘게 아무도 못 잡음", `${t} 공 (${b.x.toFixed(0)},${b.y.toFixed(0)}) 가장 가까운 선수 ${dn.toFixed(0)}m`);
    } else run.loose = 0;
    if (S2.phase === "play") for (const p of S2.P) if (p.pos === "GK" && H !== p) {
      const gx = p.team === "us" ? p.x : 105 - p.x;
      if (gx > 30) bad("골키퍼가 너무 멀리 나감", `${t} ${p.name} 골문에서 ${gx.toFixed(0)}m`);
    }
  };
  let guard = 0;
  while (!m.done && guard++ < 4000) {
    if (m.pending) {
      // 내 장면: 장면 문장이 말하는 자리와 실제 공 자리
      const sit = m.pending.sit, cat = m.pending.ctx?.cat || "";
      if (!cat.includes(":")) {
        const box = sit.spot || SCENES[sit.id]?.at || ZONE_BOX[sit.zone] || ZONE_BOX.mid, [bx, by] = m.pending.ball;
        const dx = Math.max(0, box[0][0] - bx, bx - box[0][1]);
        const dy = Math.min(Math.max(0, box[1][0] - by, by - box[1][1]), Math.max(0, box[1][0] - (68 - by), (68 - by) - box[1][1]));
        const d = Math.hypot(dx, dy); sceneD.push(d);
        if (d > 15) bad("내 장면 자리와 공 자리가 멂", `[${pos} #${k} ${m.minute}'] ${sit.id} (공 ${bx.toFixed(0)},${by.toFixed(0)} / 장면 x${box[0].join("~")}) ${d.toFixed(0)}m: ${m.pending.text.slice(0, 40)}`);
      }
      const r = resolve(s, m, autoChoice(m)); L.push(...r.lines); continue;
    }
    const r = next(s, m);
    if (r.cut) frames.push(null);                      // 후반 시작: 이어지지 않음
    frames.push(...r.frames); L.push(...r.lines);
  }
  finishMatch(s, m);
  const P = S.P, names = P.map(p => p.name);
  const F = frames.filter(Boolean);
  const at = t => { let lo = 0, hi = F.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (F[mid][0] < t) lo = mid + 1; else hi = mid; } return lo; };
  const tag = (l) => `[${pos} #${k} ${l.minute}'] ${l.t}`;
  // ── 줄 점검 ──
  const seen = new Map();
  let lastT = null, prevL = null, prevC = false;
  for (const l of L) {
    if (l.silent || !l.t) continue;
    lines++;
    if (l.ts == null) { bad("시각 없는 줄", tag(l)); continue; }
    // 반복 (분위기·상황 설명 제외 일반 사건 줄)
    if (ACTION.has(l.k) && !/^(골!|들어갔다)/.test(l.t)) { const c = (seen.get(l.t) || 0) + 1; seen.set(l.t, c); if (c === 3) bad("같은 문장 세 번 이상", tag(l)); }
    // 공백
    if (lastT != null && l.ts - lastT > 15 && !l.half2 && !l.htWhistle) bad("해설 15초 넘게 끊김", `${tag(l)}  (앞 줄과 ${(l.ts - lastT).toFixed(0)}초)`);
    if (lastT != null) { gapSum += l.ts - lastT; gapN++; }
    lastT = l.ts;
    for (const w of ["코너킥", "프리킥", "오프사이드", "스로인", "골킥"]) if (prevL && prevL.t.includes(w) && l.t.includes(w) && l.ts - prevL.ts < 3 && !prevL.k.startsWith("me") && !l.k.startsWith("me") && !/!/.test(l.t) && !/!/.test(prevL.t.slice(-1))) bad("연달아 같은 말", `${tag(prevL)} / ${l.t}`);
    prevC = prevL?.t.includes("코너킥");
    prevL = l;
    if (!ACTION.has(l.k) || !F.length) continue;
    // 긴 공(방향 전환·라인 밖으로 나간 패스·크로스)은 찬 사람을 공이 도착한 뒤에 말하므로 조금 더 앞까지 봄
    const i0 = at(l.ts - (/방향 전환|반대편|라인 아웃|터치라인|골라인|수비 뒤로|의 패스가 정확/.test(l.t) ? 4.5 : 2)), i1 = at(l.ts + (/주고받|원투/.test(l.t) ? 3 : 1.5));   // 원투는 되돌려 받는 공이 도착할 때까지
    // 이름 근처
    for (let pi = 0; pi < P.length; pi++) {
      const nm = names[pi]; if (!nm || nm.length < 2 || !l.t.includes(nm)) continue;
      if (P[pi].pos === "GK" || l.amb) continue;                                  // 골키퍼 이름은 선방·골킥 문장, 분위기 문장은 공과 상관없음                                  // 골키퍼 이름은 선방·골킥 문장
      if (/오프사이드|교체|경고|옐로카드|따라붙|격차|동점|역전|선제골|가리키며|붙어 다닌다/.test(l.t)) continue;
      let dmin = 1e9;
      for (let i = i0; i <= i1; i++) { const f = F[i]; dmin = Math.min(dmin, Math.hypot(f[4 + pi * 2] - f[1], f[5 + pi * 2] - f[2])); }
      if (dmin > 12) bad("이름이 나온 선수가 공과 멂", `${tag(l)}  (${nm} ${dmin.toFixed(0)}m)`);
    }
    const f = F[Math.min(F.length - 1, at(l.ts))];
    const bx = f[1], by = f[2];
    const nearGoal = (team, d) => (team === "us" ? 105 - bx : bx) < d && Math.abs(by - 34) < 14;
    if (l.k.startsWith("goal")) {
      const team = l.k === "goal-them" ? "them" : "us";
      // 골 문장 앞뒤 1초 안에 공이 골라인을 넘어 골문 안에 있어야 함
      let ok = false;
      for (let i = at(l.ts - 1); i <= at(l.ts + 1); i++) { const g = F[i]; const gx = team === "us" ? g[1] >= 104 : g[1] <= 1; if (gx && Math.abs(g[2] - 34) < 4.2) ok = true; }
      if (!ok) bad("골 문장인데 공이 골문 밖", `${tag(l)}  (공 ${bx.toFixed(0)},${by.toFixed(0)})`);
    }
    if (!l.k.startsWith("goal") && /선방|막아 낸다|쳐 낸다|막혔다|골대를 맞|크로스바|골대 옆|벗어난다/.test(l.t) && !/코너|걷어|크로스를|뛰어나와|품에/.test(l.t)) {
      const team = l.k === "them" ? "them" : "us";
      const atkTeam = /우리 골키퍼|휴|철렁|살았다/.test(l.t) ? "them" : team;
      if (!nearGoal(atkTeam, 30)) bad("슈팅 결과 문장인데 공이 골문과 멂", `${tag(l)}  (공 ${bx.toFixed(0)},${by.toFixed(0)})`);
    }
    if (/내려놓|신호를 보낸|깃발 앞/.test(l.t) && l.k !== "me" && prevC) {
      let ok = false;
      for (let i = at(l.ts - 0.5); i <= at(l.ts + 4); i++) { const g = F[i]; if ((g[1] < 3 || g[1] > 102) && (g[2] < 4 || g[2] > 64)) ok = true; }
      if (!ok) bad("코너킥 문장인데 공이 코너에 안 감", tag(l));
    }
    if (/슈팅|때린다|감아 찬다|헤더|머리를 갖다/.test(l.t) && !/막|선방|걷어|빗나|벗어|넘어|맞고|태클|읽고/.test(l.t) && l.k !== "info" && !l.k.startsWith("goal")) {
      const team = l.k === "them" ? "them" : "us";
      if ((team === "us" ? bx : 105 - bx) < 60) bad("슈팅 문장인데 공이 공격 진영 밖", `${tag(l)}  (공 x${bx.toFixed(0)})`);
    }
  }
  // ── 움직임 점검 ──
  let overlap = new Map();
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    if (!a || !b) continue;
    const dt = b[0] - a[0]; if (dt <= 0 || dt > 0.25) continue;
    for (let pi = 0; pi < P.length; pi++) {
      const v = Math.hypot(b[4 + pi * 2] - a[4 + pi * 2], b[5 + pi * 2] - a[5 + pi * 2]) / dt;
      if (v > 12) bad("선수 너무 빠름", `[${pos} #${k} t${b[0].toFixed(1)}] ${names[pi]} ${v.toFixed(1)}m/s`);
      const x = b[4 + pi * 2], y = b[5 + pi * 2];
      if (x < -3 || x > 108 || y < -3 || y > 71) bad("선수 경기장 밖", `[${pos} #${k} t${b[0].toFixed(1)}] ${names[pi]} (${x.toFixed(0)},${y.toFixed(0)})`);
    }
    const bv = Math.hypot(b[1] - a[1], b[2] - a[2]) / dt;
    if (bv > 48) bad("공 너무 빠름", `[${pos} #${k} t${b[0].toFixed(1)}] ${bv.toFixed(0)}m/s`);
    if (i % 5 === 0) for (let p = 0; p < P.length; p++) for (let q = p + 1; q < P.length; q++) {
      const key = p * 64 + q, d = Math.hypot(b[4 + p * 2] - b[4 + q * 2], b[5 + p * 2] - b[5 + q * 2]);
      if (d < 0.7) { const c = (overlap.get(key) || 0) + 1; overlap.set(key, c); if (c === 3) bad("두 선수가 1초 넘게 겹침", `[${pos} #${k} t${b[0].toFixed(1)}] ${names[p]}·${names[q]}`); }
      else overlap.delete(key);
    }
  }
}
sceneD.sort((a, b) => a - b);
console.log(`내 장면 ${sceneD.length}개: 장면 자리와 공 거리 0m ${(sceneD.filter(d => d === 0).length / sceneD.length * 100).toFixed(0)}%, 5m 안 ${(sceneD.filter(d => d <= 5).length / sceneD.length * 100).toFixed(0)}%, 10m 안 ${(sceneD.filter(d => d <= 10).length / sceneD.length * 100).toFixed(0)}%`);
console.log(`경기 ${games}, 해설 줄 ${lines} (경기당 ${(lines / games).toFixed(0)}), 줄 사이 평균 ${(gapSum / gapN).toFixed(1)}초(시뮬레이션)`);
const keys = Object.keys(issues).sort((a, b) => issues[b] - issues[a]);
if (!keys.length) console.log("문제 없음");
for (const kk of keys) { console.log(`\n■ ${kk}: ${issues[kk]}건 (경기당 ${(issues[kk] / games).toFixed(2)})`); for (const x of samples[kk]) console.log("   " + x); }
