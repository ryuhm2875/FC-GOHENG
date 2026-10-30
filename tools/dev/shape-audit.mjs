// 현대 축구다운 움직임 점검 (화면 없이): node tools/dev/shape-audit.mjs [경기 수]   PICK=auto|random  SEED=시작 시드  SHOW=예시 수
// 보는 것
//  1) 팀 모양: 수비 라인 들쭉날쭉(수비수 네 명 앞뒤 차이), 줄 사이 간격, 팀 길이, 공격 팀 폭
//  2) 공 쪽 뭉침: 공 10m 안 선수 수 (같은 팀·양 팀)
//  3) 역습: 공을 뺏긴 팀이 공보다 앞에 있는 선수 수와 돌아오는 속도·시간
//  4) 공 없는 선수가 서 있는 비율 (자리·공격/수비별)
//  5) 골키퍼 위치 (수비 때·공격 때·슈팅 맞을 때)
//  6) 세트피스를 차는 순간의 배치 (코너·프리킥·스로인·골킥·페널티·킥오프)
//  7) 득점 뒤 킥오프까지 (걸린 시간, 아직 달리는 선수, 제 진영 밖 선수, 공 이동)
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";

const N = +process.argv[2] || 30, SHOW = +(process.env.SHOW || 4), PICK = process.env.PICK || "random", SEED0 = +(process.env.SEED || 90000);
const other = t => (t === "us" ? "them" : "us");
const ox = (t, x) => (t === "us" ? x : 105 - x), oy = (t, y) => (t === "us" ? y : 68 - y);
const hyp = Math.hypot;
const issues = {}, samples = {}, nums = {};
const bad = (k, msg) => { issues[k] = (issues[k] || 0) + 1; ((samples[k] ||= []).length < SHOW) && samples[k].push(msg); };
const add = (k, v) => { (nums[k] ||= []).push(v); };
const pc = (arr, q) => { if (!arr?.length) return NaN; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]; };
const avg = a => a?.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
let _ps = SEED0; const prand = () => { _ps = (_ps * 1664525 + 1013904223) >>> 0; return _ps / 4294967296; };   // 시드마다 같은 무작위 선택
const cnt = { presser: {}, presserN: 0, games: 0, ticks: 0, defTicks: 0, attTicks: 0, still: {}, move: {} };

for (let k = 0; k < N; k++) {
  const seed = SEED0 + k; setSeed(seed);
  const pos = ["FW", "MF", "DF"][k % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx);
  const S = m.sim; cnt.games++;
  const tag = t => `[#${k} ${pos} ${Math.floor(t * 20 / 60)}분]`;
  const bh = []; let snapDead = null, goalFlag = false, lastWon = null, trackers = [], prevShot = null, gkBad = 0;
  const stillT = new Map();

  S.onTick = S2 => {
    const free = S2.phase === "play" && !S2.stage && !S2.scur && !S2.script.length;
    // ── 세트피스 직전 배치 저장 ──
    if (S2.phase === "dead" && S2.restart && S2.restart.celebrate != null) goalFlag = true;
    if (S2.phase === "dead" && S2.restart) snapDead = { R: S2.restart, goalKick: goalFlag && S2.restart.kind === "kickoff", kind: S2.restart.kind, team: S2.restart.team, t: S2.t, ball: [S2.ball.x, S2.ball.y, S2.ball.z], pos: S2.P.map(p => [p.x, p.y, hyp(p.vx, p.vy)]), spot: S2.restart.spot, taker: S2.restart.taker };
    else if (S2.phase === "play" && snapDead) { evalRestart(S2, snapDead, tag); snapDead = null; goalFlag = false; }
    bh.push([S2.ball.x, S2.ball.y]); if (bh.length > 31) bh.shift();
    if (!free) return;
    cnt.ticks++;
    const H = S2.holder, B = S2.ball;
    // ── 팀 모양 ──
    for (const team of ["us", "them"]) {
      const att = S2.poss === team;
      const out = S2.P.filter(p => p.team === team && p.pos !== "GK");
      const xs = out.map(p => ox(team, p.x)), ys = out.map(p => p.y);
      const df = out.filter(p => p.pos === "DF"), mf = out.filter(p => p.pos === "MF"), fw = out.filter(p => p.pos === "FW");
      const dx = df.map(p => ox(team, p.x)), mean = a => a.reduce((x, y) => x + y, 0) / a.length;
      const key = att ? "공격" : "수비";
      att ? cnt.attTicks++ : cnt.defTicks++;
      const len = Math.max(...xs) - Math.min(...xs), wid = Math.max(...ys) - Math.min(...ys);
      const dS = Math.max(...dx) - Math.min(...dx), gDM = mean(mf.map(p => ox(team, p.x))) - mean(dx), gMF = mean(fw.map(p => ox(team, p.x))) - mean(mf.map(p => ox(team, p.x)));
      const settled = !att && S2.t - (S2.wonAt ?? -99) > 5;   // 공을 뺏긴 지 5초 지나 자리를 잡았어야 할 때
      const kk = att ? "공격" : settled ? "수비(5초뒤)" : "수비(전환중)";
      if (!att) { const bd = ox(team, B.x), bin = bd < 30 ? "공깊이<30" : bd < 60 ? "공깊이30~60" : bd < 80 ? "공깊이60~80" : "공깊이80+"; const fwm = mean(fw.map(p => ox(team, p.x))), mfm = mean(mf.map(p => ox(team, p.x))); add("수비_팀길이@" + bin, len); add("수비_중원-공격수 간격@" + bin, fwm - mfm); add("수비_수비라인x@" + bin, mean(dx)); }
      add(kk + "_길이", len); add(kk + "_폭", wid); add(kk + "_수비라인차", dS); add(kk + "_수비↔중원", gDM); add(kk + "_중원↔공격", gMF);
      if (settled) {
        if (dS > 14) bad("수비 라인 들쭉날쭉(5초 뒤에도 수비수 앞뒤 차 14m↑)", `${tag(S2.t)} ${team} 라인차 ${dS.toFixed(0)}m, 수비 x ${dx.map(v => v.toFixed(0)).join("/")}, 공 x ${ox(team, B.x).toFixed(0)}`);
        if (gDM > 26) bad("수비 때 수비↔중원 간격 26m↑", `${tag(S2.t)} ${team} 간격 ${gDM.toFixed(0)}m`);
        if (gMF > 30) bad("수비 때 중원↔공격 간격 30m↑", `${tag(S2.t)} ${team} 간격 ${gMF.toFixed(0)}m`);
        if (len > 52) bad("수비 때 팀 길이 52m↑", `${tag(S2.t)} ${team} 길이 ${len.toFixed(0)}m`);
      } else {
        if (wid < 30 && ox(team, B.x) > 40) bad("공격 때 폭 30m 미만(공이 상대 진영)", `${tag(S2.t)} ${team} 폭 ${wid.toFixed(0)}m 공 x ${ox(team, B.x).toFixed(0)}`);
      }
    }
    // ── 공이 안정된 구간의 수비 라인 (공이 3초 동안 12m 넘게 안 움직였고, 소유한 지 8초 넘음) ──
    if (H && S2.t - (S2.wonAt ?? -99) > 8 && bh.length > 28 && Math.abs(B.x - bh[0][0]) < 12 && Math.abs(B.y - bh[0][1]) < 20) {
      const dt = H.team === "us" ? "them" : "us";
      const D = S2.P.filter(p => p.team === dt && p.pos === "DF"), cb = D.filter(p => p.role.includes("CB")), fb = D.filter(p => !p.role.includes("CB"));
      const m = a => a.reduce((x, p) => x + ox(dt, p.x), 0) / a.length;
      const dS = Math.max(...D.map(p => ox(dt, p.x))) - Math.min(...D.map(p => ox(dt, p.x))), fbcb = m(fb) - m(cb);
      add("수비(안정구간)_라인차", dS); add("수비(안정구간)_풀백-센터백", fbcb);
      if (dS > 12) bad("수비 라인 들쭉날쭉(공이 안정된 구간에서 12m↑)", `${tag(S2.t)} ${dt} 라인차 ${dS.toFixed(0)}m 수비 x ${D.map(p => p.role + ox(dt, p.x).toFixed(0)).join(" ")} 공 x(수비 기준) ${ox(dt, B.x).toFixed(0)}`);
      // 압박하는 선수 역할
      for (const p of S2.P) if (p.team === dt && p.press) { cnt.presser[p.role] = (cnt.presser[p.role] || 0) + 1; cnt.presserN++; if (p.pos === "DF" && p.role.includes("CB") && ox(dt, B.x) > 45) bad("센터백이 공 압박(공이 수비 기준 x45↑ = 우리 박스에서 먼 곳)", `${tag(S2.t)} ${p.role} 공 x(수비 기준) ${ox(dt, B.x).toFixed(0)}`); }
    }
    // ── 공 가진 선수 주변 몰림 ──
    if (H) {
      let nd = 0, nt = 0; for (const p of S2.P) { if (p === H || p.pos === "GK") continue; const d = hyp(p.x - H.x, p.y - H.y); if (p.team !== H.team && d < 6) nd++; if (p.team === H.team && d < 8) nt++; }
      add("공가진선수_6m안_수비", nd); add("공가진선수_8m안_동료", nt);
      if (nd >= 4) bad("공 가진 선수 6m 안에 수비 4명↑", `${tag(S2.t)} ${nd}명 공 x ${ox(H.team, H.x).toFixed(0)}`);
      if (nt >= 5) bad("공 가진 선수 8m 안에 동료 5명↑ (뭉침)", `${tag(S2.t)} ${nt}명 공 x ${ox(H.team, H.x).toFixed(0)}`);
    }
    // ── 공 쪽 뭉침 ──
    let n10 = 0, nUs = 0, nThem = 0;
    for (const p of S2.P) if (p.pos !== "GK" && hyp(p.x - B.x, p.y - B.y) < 10) { n10++; p.team === "us" ? nUs++ : nThem++; }
    add("공10m안_선수", n10);
    if (n10 >= 8) bad("공 10m 안에 선수 8명↑", `${tag(S2.t)} ${n10}명 (우리 ${nUs} 상대 ${nThem}) 공 (${B.x.toFixed(0)}, ${B.y.toFixed(0)})`);
    // ── 공 없는 선수 서 있는 비율 ──
    for (const p of S2.P) {
      if (p === H || p.pos === "GK") continue;
      const att = S2.poss === p.team, key = (p.pos === "DF" ? p.role : p.pos === "MF" ? p.role : p.role) + (att ? "_공격" : "_수비");
      cnt.move[key] = (cnt.move[key] || 0) + 1;
      if (hyp(p.vx, p.vy) < 0.5) cnt.still[key] = (cnt.still[key] || 0) + 1;
    }
    // ── 골키퍼 ──
    for (const gk of S2.GK) {
      if (gk.ov || gk === H) continue;
      const team = gk.team, att = S2.poss === team, gx = ox(team, gk.x), bx = ox(team, B.x), by = oy(team, B.y), gy = oy(team, gk.y);
      add(att ? "GK공격_x" : "GK수비_x", gx);
      if (!att && bx < 30) {
        const yExp = 34 + (by - 34) * 0.35;
        if (Math.abs(gy - yExp) > 9) bad("골키퍼가 공-골문 선에서 9m↑ 벗어남(공이 우리 박스 근처)", `${tag(S2.t)} ${team} GK y ${gy.toFixed(0)} 기대 ${yExp.toFixed(0)} 공 (${bx.toFixed(0)}, ${by.toFixed(0)})`);
      }
      if (!att && gx > 18 && bx < 45) bad("상대 공격 중 골키퍼가 골문에서 18m↑ 나와 있음", `${tag(S2.t)} ${team} GK x ${gx.toFixed(0)} 공 x ${bx.toFixed(0)}`);
      if (att && gx > 24) bad("공격 중 골키퍼가 24m↑ 올라가 있음", `${tag(S2.t)} ${team} GK x ${gx.toFixed(0)} 공 x ${bx.toFixed(0)}`);
    }
    if (S2.shot && S2.shot !== prevShot) {
      const sh = S2.shot, team = sh.team, gk = sh.gk;
      if (gk) { const gx = ox(other(team), gk.x); if (gx > 13 && sh.kind !== "chip" && sh.result !== "block") bad("슈팅 때 골키퍼가 골문에서 13m↑ (칩슛 아님)", `${tag(S2.t)} ${sh.kind}/${sh.result} GK x ${gx.toFixed(0)}`); add("슈팅때_GKx", gx); }
    }
    prevShot = S2.shot;
    // ── 공을 뺏긴 팀의 복귀 ──
    if (S2.wonAt !== lastWon) {
      lastWon = S2.wonAt;
      if (S2.wonBy) {
        const winner = S2.wonBy.team, loser = other(winner), bxL = ox(loser, B.x);
        const ahead = S2.P.filter(p => p.team === loser && p.pos !== "GK" && ox(loser, p.x) > bxL + 3);
        if (ahead.length >= 3) trackers.push({ t0: S2.t, loser, winner, ids: ahead.map(p => p.id), n0: ahead.length, vs: [], bx0: bxL, rec: null, by: S2.wonBy.name, H: S2.wonBy });
      }
    }
    for (const tr of trackers) {
      const dt = S2.t - tr.t0;
      const grp = S2.P.filter(p => tr.ids.includes(p.id));
      for (const p of grp) tr.vs.push(hyp(p.vx, p.vy));
      const bxL = ox(tr.loser, B.x);
      const still = grp.filter(p => ox(tr.loser, p.x) > bxL + 3).length;
      if (tr.rec == null && still === 0) tr.rec = dt;
      if (dt >= 4) {
        tr.done = true;
        add("역습_앞선선수_처음", tr.n0); add("역습_4초뒤도_공보다앞", still); add("역습_복귀평균속도", avg(tr.vs));
        if (tr.rec != null) add("역습_전원복귀_초", tr.rec);
        if (still >= 3 && S2.holder && S2.holder.team === tr.winner) bad("역습: 4초 뒤에도 공보다 앞에 3명↑ 남음", `${tag(S2.t)} ${tr.loser} 처음 ${tr.n0}명 → ${still}명, 평균 속도 ${avg(tr.vs).toFixed(1)}m/s, 공 x(상대 기준) ${bxL.toFixed(0)}`);
        if (avg(tr.vs) < 5.4 && tr.n0 >= 4) bad("역습: 앞에 있던 4명↑이 평균 5.4m/s 미만(걸어서 복귀)", `${tag(S2.t)} ${tr.loser} 평균 ${avg(tr.vs).toFixed(1)}m/s`);
      }
    }
    trackers = trackers.filter(t => !t.done);
  };

  let guard = 0;
  while (!m.done && guard++ < 4000) {
    if (m.pending) { resolve(s, m, PICK === "auto" ? autoChoice(m) : Math.floor(prand() * m.pending.list.length)); continue; }
    next(s, m);
  }
  finishMatch(s, m);
}

// ── 세트피스 평가 ──
function evalRestart(S2, sn, tag) {
  const R = sn.R, kind = sn.kind, team = sn.team, opp = other(team);
  const P = S2.P, pos = sn.pos;
  const bx = sn.ball[0], by = sn.ball[1];
  const outfield = (i, t) => P[i].team === t && P[i].pos !== "GK";
  const idx = P.map((_, i) => i);
  if (kind === "kickoff") {
    const goal = sn.goalKick ? [...S2.ev].reverse().find(e => e.type === "goal" && e.t <= sn.t) : null;
    const dt = goal ? sn.t - goal.t : null;
    if (dt != null) add("득점→킥오프_초", dt);
    let wrong = 0, fast = 0, circle = 0, far = 0;
    for (const i of idx) {
      const p = P[i]; if (p.pos === "GK") continue;
      const x = ox(p.team, pos[i][0]);
      if (x > 52.9) wrong++;
      if (pos[i][2] > 3) fast++;
      if (p.team === opp && hyp(pos[i][0] - 52.5, pos[i][1] - 34) < 9.1) circle++;
      if (p.team === team && x < 20) far++;
    }
    if (dt != null) { add("득점뒤킥오프_제진영밖", wrong); add("득점뒤킥오프_아직달리는선수", fast); add("득점뒤킥오프_상대가센터서클안", circle); add("득점뒤킥오프_공높이z", sn.ball[2]); }
    if (dt != null) {
      if (wrong > 0) bad("킥오프 순간 제 진영 밖 선수", `${tag(sn.t)} ${wrong}명`);
      if (fast >= 3) bad("킥오프 순간 3명↑이 아직 달리는 중(초속 3m↑)", `${tag(sn.t)} ${fast}명`);
      if (circle > 0) bad("킥오프 때 수비 팀 선수가 센터서클(9.15m) 안", `${tag(sn.t)} ${circle}명`);
    }
    return;
  }
  const spot = sn.spot || [bx, by];
  const near915 = idx.filter(i => P[i].team === opp && P[i].pos !== "GK" && hyp(pos[i][0] - spot[0], pos[i][1] - spot[1]) < (kind === "fk" ? 8 : 9));
  if (kind === "corner" || kind === "fk") {
    add(kind + "_9m안_상대", near915.length);
    const fkNear = kind === "fk" && ox(team, spot[0]) > 70;
    if (near915.length > 0 && (kind === "corner" || fkNear)) bad(`${kind === "corner" ? "코너킥" : "프리킥(상대 진영 70m↑)"}: 상대 선수가 공 8~9m 안`, `${tag(sn.t)} ${near915.length}명 ${near915.map(i => P[i].name + (hyp(pos[i][0] - spot[0], pos[i][1] - spot[1])).toFixed(1)).join(",")}`);
  }
  if (kind === "corner") {
    const inBox = (i, t) => outfield(i, t) && ox(t, pos[i][0]) > 88.5 && Math.abs(oy(t, pos[i][1]) - 34) < 20;
    const a = idx.filter(i => inBox(i, team)).length, d = idx.filter(i => outfield(i, opp) && ox(team, pos[i][0]) > 88.5 && Math.abs(oy(team, pos[i][1]) - 34) < 20).length;
    add("코너_박스안_공격", a); add("코너_박스안_수비", d);
    if (a < 3) bad("코너킥: 박스 안 공격 선수 3명 미만", `${tag(sn.t)} ${a}명`);
    if (d < 4) bad("코너킥: 박스 안 수비 선수 4명 미만", `${tag(sn.t)} ${d}명`);
    const gk = P.findIndex(p => p.team === opp && p.pos === "GK"), gx = ox(opp, pos[gk][0]);
    if (gx > 8) bad("코너킥: 수비 골키퍼가 골문에서 8m↑", `${tag(sn.t)} GK x ${gx.toFixed(0)}`);
    const farAtk = idx.filter(i => outfield(i, team) && P[i] !== sn.taker && ox(team, pos[i][0]) < 50).length;
    add("코너_하프라인뒤_공격팀", farAtk);
    const farDef = idx.filter(i => outfield(i, opp) && ox(opp, pos[i][0]) > 45).length;
    if (farDef >= 3) bad("코너킥: 수비 팀 선수 3명↑이 상대 진영(하프라인 넘어)에 남음", `${tag(sn.t)} ${farDef}명`);
  }
  if (kind === "fk") {
    const fx = ox(team, spot[0]);
    if (fx > 70) {
      const goalX = team === "us" ? 105 : 0, dd = hyp(goalX - spot[0], 34 - spot[1]), ux = (goalX - spot[0]) / dd, uy = (34 - spot[1]) / dd;
      const wall = idx.filter(i => outfield(i, opp) && hyp(pos[i][0] - (spot[0] + ux * 9.2), pos[i][1] - (spot[1] + uy * 9.2)) < 3.2);
      add("프리킥_벽_인원", wall.length);
      if (dd < 32 && wall.length < 3) bad("가까운 프리킥인데 벽 3명 미만", `${tag(sn.t)} 거리 ${dd.toFixed(0)}m 벽 ${wall.length}명`);
    }
  }
  if (kind === "goalkick") {
    const inPen = idx.filter(i => outfield(i, opp) && ox(team, pos[i][0]) < 16.6 && Math.abs(oy(team, pos[i][1]) - 34) < 20.2);
    add("골킥_상대_박스안", inPen.length);
    if (inPen.length) bad("골킥: 상대 선수가 우리 페널티 박스 안", `${tag(sn.t)} ${inPen.length}명`);
    const out = idx.filter(i => outfield(i, team) && ox(team, pos[i][0]) > 52.5).length, back = idx.filter(i => outfield(i, team) && ox(team, pos[i][0]) < 25).length;
    add("골킥_우리_상대진영", out); add("골킥_우리_25m안", back);
    const hi = idx.filter(i => outfield(i, opp) && ox(opp, pos[i][0]) > 60).length;
    add("골킥_상대_자기진영밖(하이프레스)", hi);
  }
  if (kind === "throw") {
    const tk = sn.taker ? P.indexOf(sn.taker) : -1;
    const opn = tk >= 0 ? idx.filter(i => outfield(i, team) && i !== tk && hyp(pos[i][0] - pos[tk][0], pos[i][1] - pos[tk][1]) < 22).length : 0;
    add("스로인_가까운_동료(22m)", opn);
    if (opn < 2) bad("스로인: 받을 동료가 22m 안에 2명 미만", `${tag(sn.t)} ${opn}명`);
    const oppNear = tk >= 0 ? idx.filter(i => outfield(i, opp) && hyp(pos[i][0] - spot[0], pos[i][1] - spot[1]) < 3).length : 0;
    add("스로인_상대_3m안", oppNear);
  }
  if (kind === "pk") {
    const intr = idx.filter(i => P[i].pos !== "GK" && P[i] !== sn.taker && (hyp(pos[i][0] - spot[0], pos[i][1] - spot[1]) < 9.1 || (ox(team, pos[i][0]) > 88.5 && Math.abs(oy(team, pos[i][1]) - 34) < 20.2)));
    add("페널티킥_박스안_또는_9m안", intr.length);
    if (intr.length) bad("페널티킥: 차는 선수·골키퍼 말고 박스/9.15m 안에 선수", `${tag(sn.t)} ${intr.length}명 ${intr.slice(0, 4).map(i => P[i].name).join(",")}`);
  }
}

// ── 출력 ──
const f1 = v => Number.isFinite(v) ? v.toFixed(1) : "-";
console.log(`경기 ${cnt.games}판, 자유 흐름 틱 ${cnt.ticks} (공격 ${cnt.attTicks} 수비 ${cnt.defTicks}, 팀 단위)`);
console.log("\n[모양·수치] 평균 / 중앙값 / 90% / 99%");
for (const k of Object.keys(nums).sort()) { const a = nums[k]; console.log(`  ${k.padEnd(28)} n=${String(a.length).padStart(6)}  ${f1(avg(a))} / ${f1(pc(a, 0.5))} / ${f1(pc(a, 0.9))} / ${f1(pc(a, 0.99))}`); }
console.log("\n[공 없는 선수 서 있는 비율(초속 0.5m 미만)]");
console.log("  " + Object.keys(cnt.move).sort().map(k => `${k} ${(100 * (cnt.still[k] || 0) / cnt.move[k]).toFixed(0)}%`).join("  "));
console.log("\n[압박하는 선수 역할 비율(안정 구간)]\n  " + Object.entries(cnt.presser).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${(100 * n / Math.max(1, cnt.presserN)).toFixed(0)}%`).join("  "));
console.log("\n[문제] 건수 (예시)");
for (const [k, v] of Object.entries(issues).sort((a, b) => b[1] - a[1])) { console.log(`  ${String(v).padStart(5)}  ${k}`); for (const x of samples[k]) console.log("          " + x); }
if (!Object.keys(issues).length) console.log("  없음");
