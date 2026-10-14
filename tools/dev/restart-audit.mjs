// 재개·선방 점검: 공이 라인 안에 있는데 스로인·코너킥 선언, 멀리 있는 수비의 반칙, 선방 문장(잡음/쳐 냄)과 골키퍼 동작, 코너킥 원인 문장, 중거리 거리
// node tools/dev/restart-audit.mjs [경기 수]   PICK=auto|random
const R = new URL("../../", import.meta.url).href;
const { setSeed } = await import(R + "js/rng.js");
const { rollPlayer, newGame } = await import(R + "js/state.js");
const { beginWeek, endWeek } = await import(R + "js/engine/week.js");
const { prepareMatch, next, resolve, autoChoice, finishMatch } = await import(R + "js/engine/match.js");
const { RESULT, SIM_LINES, AMBIENT, LINES } = await import(R + "data/match.js");
let __r = 12345; const prand = () => ((__r = (__r * 1103515245 + 12345) % 2147483648) / 2147483648);
const N = +process.argv[2] || 100, SHOW = +(process.env.SHOW || 5), PICK = process.env.PICK || "random", SEED0 = +(process.env.SEED || 50000);
const issues = {}, samples = {}, den = {};
const bad = (k, msg) => { issues[k] = (issues[k] || 0) + 1; (samples[k] ||= []).length < SHOW && samples[k].push(msg); };
const cnt = k => den[k] = (den[k] || 0) + 1;
const hyp = Math.hypot;
const CATCH = /잡아 낸|잡는다|품|안았|안긴|정면/, PARRY = /쳐 냈|쳐 낸|쳐냈/;
let games = 0;
const longD = [];
for (let k = 0; k < N; k++) {
  const seed = SEED0 + k; setSeed(seed); __r = 1 + Math.abs(seed | 0);
  const pos = ["FW", "MF", "DF"][k % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  const lv = 45 + (k % 5) * 8;
  for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx); games++;
  const S = m.sim, tag = `[${pos} 시드${seed}]`;
  let seen = 0;
  const ballAt = [];       // 사건 번호 → 그 틱의 공·선수 자리
  S.onTick = S2 => {
    for (; seen < S2.ev.length; seen++) {
      const e = S2.ev[seen];
      ballAt[seen] = { bx: S2.ball.x, by: S2.ball.y, fl: !!S2.ball.fl, scur: !!S2.scur, stage: !!S2.stage, P: S2.P.map(p => ({ name: p.name, team: p.team, x: p.x, y: p.y, pos: p.pos })) };
      const b = ballAt[seen];
      if (e.type === "out" && e.kind !== "goalkick") {
        cnt("out " + e.kind);
        const inside = b.bx > 0.6 && b.bx < 104.4 && b.by > 0.6 && b.by < 67.4;
        const prev = S2.ev[seen - 1], fromShot = prev && prev.t === e.t && prev.type === "shotEnd";
        const lineD = e.kind === "corner" ? Math.min(b.bx, 105 - b.bx) : Math.min(b.by, 68 - b.by);
        if (inside && !e.shot) bad(`공이 라인 안에 있는데 ${e.kind === "corner" ? "코너킥" : "스로인"} 선언 (${fromShot ? "슈팅 " + prev.result + " 직후" : "슈팅과 무관"}${lineD > 5 ? ", 라인에서 5m+" : ""})`, `${tag} ${e.minute}' ${e.team} 공(${b.bx.toFixed(0)},${b.by.toFixed(0)}) 라인까지 ${lineD.toFixed(0)}m`);
      }
      if (e.type === "foul") {
        cnt("foul");
        const d = b.P.find(p => p.name === e.by && p.team === e.team), v = b.P.find(p => p.name === e.victim);
        if (d && v) { const dd = hyp(d.x - v.x, d.y - v.y); if (dd > 4) bad("반칙한 수비가 반칙당한 선수와 멂 (4m+)", `${tag} ${e.minute}' ${e.by}→${e.victim} ${dd.toFixed(0)}m ${e.pen ? "페널티킥" : ""}`); }
        else if (!d) bad("반칙한 선수가 경기장에 없음", `${tag} ${e.by}`);
      }
      if (e.type === "shotEnd" && e.result === "save") e._after = S2.holder?.pos === "GK" ? "catch" : S2.restart?.kind === "corner" ? "corner" : S2.ball.fl ? "parry" : "other";
      if (e.type === "out" && e.kind === "corner") { const prev = S2.ev[seen - 1]; e._cause = prev && prev.t === e.t && prev.type === "shotEnd" ? "shot-" + prev.result : (S2.last?.pos === "GK" ? "gk" : "touch"); }
      if (e.type === "shot" && e.kind === "long" && !e.forced) longD.push(hyp(105 - e.x, 34 - e.y));
    }
  };
  let guard = 0;
  while (!m.done && guard++ < 5000) {
    if (m.pending) { const pd = m.pending; resolve(s, m, PICK === "auto" ? autoChoice(m) : Math.floor(prand() * pd.list.length)); continue; }
    next(s, m);
  }
  finishMatch(s, m);
  // 줄과 사건 맞대기
  const F = m.feed, E = S.ev;
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    if (e.type === "out" && e.kind === "corner") {
      const l = F.find(x => x.ts != null && Math.abs(x.ts - e.t) < 0.05 && /코너킥/.test(x.t) && !/대 /.test(x.t));
      cnt("코너킥 원인 " + e._cause);
      if (l) {
        if (/골키퍼가 손끝으로 쳐 냈다/.test(l.t) && (e.cause || e._cause) !== "save" && e._cause !== "shot-save") bad("코너킥 문장 '골키퍼가 쳐 냈다'인데 실제 원인은 다름", `${tag} ${e.minute}' 원인 ${e._cause}: ${l.t}`);
        if (/수비 몸에 맞고|우리 수비 발에 맞고/.test(l.t) && e._cause === "shot-save") bad("코너킥 문장 '수비 몸에 맞고'인데 실제는 골키퍼 선방", `${tag} ${e.minute}': ${l.t}`);
        if (/급하게 걷어 낸|골라인 밖으로 걷어 냈/.test(l.t) && e._cause.startsWith("shot")) bad("코너킥 문장 '걷어 냈다'인데 실제는 슈팅 뒤", `${tag} ${e.minute}' ${e._cause}: ${l.t}`);
      }
    }
    if (e.type === "shotEnd" && e.result === "save") {
      // 이 선방 직후 경기장: 골키퍼가 잡음(claim 없이 give) / 코너킥 / 쳐 냄
      const nx = E.slice(i + 1, i + 3);
      const corner = nx.some(x => x.type === "out" && x.kind === "corner" && x.t - e.t < 0.05);
      // 잡았는지: 다음 틱의 공 가진 선수가 골키퍼인지는 기록이 없으므로, 다음 사건이 parry 날아감인지로 판단 → 이후 첫 'recv/claim/win' 주체
      const keeper = e.gk;
      const lines = F.filter(l => l.ts != null && l.ts >= e.t - 0.05 && l.ts <= e.t + 0.35 && l.t && !/^▶/.test(l.t) && !['stat','coach','whistle'].includes(l.k) && !/코너킥/.test(l.t));
      const txt = lines.map(l => l.t).join(" ");
      const firstOwner = E.slice(i + 1).find(x => ["win", "recv", "claim", "intercept", "tackle", "steal", "restart", "out"].includes(x.type));
      const caught = !corner && firstOwner && ((firstOwner.type === "win" && firstOwner.by === keeper && firstOwner.t - e.t < 0.15) || (firstOwner.t - e.t < 0.15 && firstOwner.by === keeper));
      cnt("선방 " + (e.forced ? "선택" : "흐름"));
      // give()는 사건을 남기지 않으므로 다음 틱 holder를 알 수 없음 → 'parry'는 corner도 아니고 0.15초 안 사건도 없음으로 근사
      const parried = !corner && !(firstOwner && firstOwner.t - e.t < 0.15);
      const after = e._after; cnt("선방 결과 " + after);
      if (CATCH.test(txt) && !PARRY.test(txt) && after !== "catch") bad(`선방 문장은 '잡았다·정면'인데 경기장은 골키퍼가 쳐 냄 (${after}, ${e.forced ? "선택" : "흐름"})`, `${tag} ${e.minute}': ${txt.slice(0, 60)}`);
      if (PARRY.test(txt) && after === "catch") bad(`선방 문장은 '쳐 냈다'인데 경기장은 골키퍼가 잡음 (${e.forced ? "선택" : "흐름"})`, `${tag} ${e.minute}': ${txt.slice(0, 60)}`);
      if (txt) cnt("선방 문장 있음 " + (e.forced ? "선택" : "흐름"));
      if (false && CATCH.test(txt) && corner) bad(`선방 문장은 '잡았다·정면'인데 경기장은 쳐 내 코너킥 (${e.forced ? "선택" : "흐름"})`, `${tag} ${e.minute}': ${txt.slice(0, 50)}`);
      if (PARRY.test(txt) && !corner && S.__dummy) {}
    }
  }
}
console.log(`경기 ${games}`); console.log("분모", JSON.stringify(den));
longD.sort((a, b) => a - b);
if (longD.length) console.log(`흐름 중 중거리(long) 슈팅 ${longD.length}개 거리: 최소 ${longD[0].toFixed(0)} 중앙 ${longD[longD.length >> 1].toFixed(0)} 30m 미만 ${(longD.filter(d => d < 30).length / longD.length * 100).toFixed(0)}%`);
for (const kk of Object.keys(issues).sort((a, b) => issues[b] - issues[a])) { console.log(`\n■ ${kk}: ${issues[kk]}건`); for (const x of samples[kk]) console.log("   " + x); }
