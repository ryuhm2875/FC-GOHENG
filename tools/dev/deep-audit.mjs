// 장면 문장·결과 문장과 바둑판 맞대기 (기존 도구가 안 보는 곳): 결과 줄 속 이름, 장면이 말하는 상황(코너킥 뒤·역습·박스 안·마지막 수비수…), 득점자 기록, 통계, 순간이동
// node tools/dev/deep-audit.mjs [경기 수] [포지션]   PICK=auto|random(기본, 시드마다 같은 선택)  SEED=시작 시드  SHOW=예시 수
const R = new URL("../../", import.meta.url).href;
const { setSeed } = await import(R + "js/rng.js");
const { rollPlayer, newGame } = await import(R + "js/state.js");
const { beginWeek, endWeek } = await import(R + "js/engine/week.js");
const { prepareMatch, next, resolve, autoChoice, finishMatch } = await import(R + "js/engine/match.js");
const { SCENES } = await import(R + "data/scenes.js");

let __r = 12345; const prand = () => ((__r = (__r * 1103515245 + 12345) % 2147483648) / 2147483648);
const N = +process.argv[2] || 60, which = process.argv[3] || "all", SHOW = +(process.env.SHOW || 6);
const PICK = process.env.PICK || "random", SEED0 = +(process.env.SEED || 70000);
const issues = {}, samples = {}, denom = {};
const bad = (kind, msg) => { issues[kind] = (issues[kind] || 0) + 1; (samples[kind] ||= []).length < SHOW && samples[kind].push(msg); };
const cnt = k => { denom[k] = (denom[k] || 0) + 1; };
const hyp = Math.hypot;
let games = 0, moments = 0;
const sceneRule = {};   // id -> rule -> [n, fail]
const rule = (id, name, ok, msg) => { const r = ((sceneRule[name] ||= {})[id] ||= [0, 0]); r[0]++; if (!ok) { r[1]++; bad("장면 문장↔경기장: " + name, msg); } };

for (let k = 0; k < N; k++) {
  const seed = SEED0 + k;
  setSeed(seed); __r = 1 + Math.abs(seed | 0);
  const pos = which === "all" ? ["FW", "MF", "DF"][k % 3] : which;
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  const lv = 45 + (k % 5) * 8;
  for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx);
  m.record = true; games++;
  const S = m.sim, frames = [], L = [];
  const tagG = `[${pos} 시드${seed}]`;
  let guard = 0;
  const momentLog = [];
  while (!m.done && guard++ < 5000) {
    if (m.pending) {
      moments++;
      const pd = m.pending, sit = pd.sit, sc = SCENES[sit.id] || {}, cat = pd.ctx?.cat || "";
      const M = S.P.find(p => p.me), H = S.holder, b = S.ball;
      const tag = `${tagG} ${m.minute}' ${sit.id}(${cat})`;
      const recent = sec => S.ev.filter(e => e.t >= S.t - sec);
      const poss = sit.poss || "us";
      const txt = pd.text;
      const ourGoalX = 0, oppGoalX = 105;
      const opp = S.P.filter(p => p.team === "them" && p.pos !== "GK"), ours = S.P.filter(p => p.team === "us" && p.pos !== "GK");
      const oppGK = S.P.find(p => p.team === "them" && p.pos === "GK"), ourGK = S.P.find(p => p.team === "us" && p.pos === "GK");
      const bx = b.x, by = b.y;
      const snap = `공(${bx.toFixed(0)},${by.toFixed(0)}) 나(${M?.x.toFixed(0)},${M?.y.toFixed(0)}) 공가짐 ${H ? (H.me ? "나" : H.team + " " + H.pos + " " + H.name) : "없음"}`;
      // ── 장면 문장이 말하는 상황 vs 경기장 ──
      if (/코너킥/.test(txt) && !/코너킥을/.test(txt)) {
        const ok = cat.includes("corner") || recent(15).some(e => e.type === "out" && e.kind === "corner") || recent(15).some(e => e.type === "restart" && e.kind === "corner");
        rule(sit.id, "코너킥이라는데 코너킥이 없었음", ok, `${tag} ${snap}: ${txt.slice(0, 40)}`);
      }
      if (/골킥/.test(txt)) rule(sit.id, "골킥이라는데 골킥이 없었음", recent(15).some(e => (e.type === "restart" || e.type === "out") && e.kind === "goalkick"), `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/(?<!떨)쳐 냈|쳐 낸 공|골대를 맞고/.test(txt)) rule(sit.id, "선방·골대 뒤 공이라는데 직전 슈팅이 없었음", recent(8).some(e => e.type === "shotEnd" && ["save", "post", "block"].includes(e.result)), `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/의 슈팅을/.test(txt)) { const sh = recent(8).filter(e => e.type === "shotEnd" && e.team === "us"); rule(sit.id, "'{mate}의 슈팅' 이름이 실제 슈팅한 선수와 다름", sh.some(e => txt.includes(e.by)), `${tag} 실제 ${sh.map(e => e.by).join(",") || "슈팅 없음"}: ${txt.slice(0, 40)}`); }
      if (/걷어 낸 공|걷혀 나온|길게 걷어 낸/.test(txt)) rule(sit.id, "걷어 낸 공이라는데 걷어 내기가 없었음", recent(8).some(e => ["clear", "header"].includes(e.type) || (e.type === "shotEnd" && e.result === "block")), `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/롱킥/.test(txt)) rule(sit.id, "골키퍼 롱킥이라는데 아님", recent(8).some(e => e.type === "pass" && (e.kind === "long" || e.kind === "air") && /GK|골키퍼/.test(String(e.from)) ) || recent(8).some(e => e.type === "restart" && e.kind === "goalkick") || recent(8).some(e => e.type === "pass" && e.from === m.gk.them), `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/역습/.test(txt)) rule(sit.id, "역습이라는데 공 주인이 최근에 안 바뀜", recent(12).some(e => ["win", "tackle", "intercept", "claim", "header"].includes(e.type)) || recent(12).some(e => e.type === "steal"), `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/스로인/.test(txt) && !/스로인을 얻/.test(txt)) rule(sit.id, "스로인이라는데 스로인 상황 아님", cat.includes("throw") || !!S.restart && S.restart.kind === "throw", `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/반칙을 얻었|프리킥을 얻었/.test(txt)) rule(sit.id, "반칙·프리킥이라는데 반칙 없음", cat.includes("fk") || recent(8).some(e => e.type === "foul"), `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/페널티 지점|페널티킥/.test(txt)) rule(sit.id, "페널티라는데 페널티 상황 아님", cat === "set:pk" || recent(8).some(e => e.type === "foul" && e.pen), `${tag} ${snap}: ${txt.slice(0, 40)}`);
      if (/크로스가 올라온다|공을 띄운다|크로스가 수비 머리|크로스를 깔아|컷백\. 공이|땅볼 크로스|롱패스가 수비 뒤로|대각선 패스가 내 쪽/.test(txt)) {
        const into = recent(5).filter(e => e.type === "pass" && (e.toMe || (poss === "them")));
        const air = into.some(e => ["cross", "air", "long", "through"].includes(e.kind)) || cat === "air" || cat === "defair";
        rule(sit.id, "크로스·롱패스가 온다는데 실제로는 땅볼 짧은 패스·드리블", air, `${tag} ${snap} 들어온 패스 ${into.map(e => e.kind + ":" + e.from).join(",") || "없음"}: ${txt.slice(0, 40)}`);
      }
      if (/스루패스가 들어온다|찔러 준 공이/.test(txt)) { const into = recent(5).filter(e => e.type === "pass" && e.toMe); rule(sit.id, "스루패스라는데 아님", into.some(e => e.kind === "through" || e.kind === "air" || e.kind === "long"), `${tag} ${snap} ${into.map(e => e.kind).join(",") || "패스 없음"}: ${txt.slice(0, 40)}`); }
      // 골키퍼가 나와 있다
      if (/골키퍼가 박스 밖|박스 밖까지 뛰쳐나|한참 앞에 나와/.test(txt)) rule(sit.id, "골키퍼가 박스 밖으로 나왔다는데 박스 안", oppGK && oppGK.x < 88.5, `${tag} 상대 골키퍼 x${oppGK?.x.toFixed(0)} 공 x${bx.toFixed(0)}: ${txt.slice(0, 40)}`);
      if (/골키퍼가 각을 좁히며 달려 나온다|골키퍼 .{0,6}과 단둘이|골키퍼만 남았다/.test(txt)) {
        const hx = (H || M).x, hy = (H || M).y;
        const between = opp.filter(p => p.x > hx && Math.abs(p.y - hy) < (p.x - hx) * 0.6 + 4 && p.x < 105);
        rule(sit.id, "골키퍼와 1 대 1이라는데 사이에 수비가 있음", between.length === 0, `${tag} 사이 수비 ${between.length}명 ${snap}: ${txt.slice(0, 40)}`);
      }
      if (/상대 열 명이 전부 자기 진영/.test(txt)) { const n = opp.filter(p => p.x < 52.5).length; rule(sit.id, "상대 열 명이 자기 진영이라는데 우리 진영에 상대가 있음", n === 0, `${tag} 우리 진영 상대 ${n}명: ${txt.slice(0, 30)}`); }
      if (/두 줄로 내려앉/.test(txt)) { const n = opp.filter(p => p.x > 75).length; rule(sit.id, "박스 앞에 내려앉았다는데 상대가 안 내려옴", n >= 7, `${tag} 상대 x75 너머 ${n}명: ${txt.slice(0, 30)}`); }
      if (/수비수 한 명과 1 대 1|앞에는 수비수 한 명뿐|막는 수비는 한 명뿐|수비수 한 명이 뒷걸음/.test(txt)) {
        const hx = (H || M).x, hy = (H || M).y;
        const ahead = opp.filter(p => p.x > hx - 1 && p.x < hx + 25 && Math.abs(p.y - hy) < 14);
        rule(sit.id, "수비 한 명뿐이라는데 앞에 여럿", ahead.length <= 2, `${tag} 앞 25m 상대 ${ahead.length}명 ${snap}: ${txt.slice(0, 40)}`);
      }
      if (/우리 셋, 상대 수비 둘/.test(txt)) {
        const hx = (H || M).x;
        const oa = opp.filter(p => p.x > hx - 2).length, ua = ours.filter(p => p.x > hx - 8).length;
        rule(sit.id, "3 대 2라는데 숫자가 다름", oa <= 3 && ua >= 3, `${tag} 공보다 앞 상대 ${oa}명, 우리 ${ua}명: ${txt.slice(0, 30)}`);
      }
      if (/마지막 수비수/.test(txt)) { const behind = ours.filter(p => !p.me && p.x < M.x - 1).length; rule(sit.id, "마지막 수비수라는데 내 뒤에 동료가 있음", behind === 0, `${tag} 내 뒤 동료 ${behind}명 나 x${M.x.toFixed(0)}: ${txt.slice(0, 30)}`); }
      if (/막을 사람은 나 하나/.test(txt)) { const behind = ours.filter(p => !p.me && p.x < bx).length; rule(sit.id, "막을 사람이 나 하나라는데 동료가 더 있음", behind <= 1, `${tag} 공보다 뒤 동료 ${behind}명: ${txt.slice(0, 30)}`); }
      if (/상대 둘이 달려오는데/.test(txt)) { const run = opp.filter(p => hyp(p.x - bx, p.y - by) < 18).length; rule(sit.id, "상대 둘이 달려온다는데 공 근처 상대가 한 명", run >= 2, `${tag} 공 18m 안 상대 ${run}명: ${txt.slice(0, 30)}`); }
      // 자리 말
      const side = Math.abs(by - 34);
      if (/측면에서 공을|터치라인 근처|터치라인에 붙|터치라인을 따라|측면 끝|엔드라인|측면을 타고|빈 측면|코너 플래그|측면을 파고/.test(txt)) rule(sit.id, "측면이라는데 공이 가운데", side > 16, `${tag} 공 y${by.toFixed(0)} (가운데에서 ${side.toFixed(0)}m): ${txt.slice(0, 40)}`);
      const atkX = poss === "us" ? bx : bx;
      if (!cat.includes(":") && /박스 안|문전|골문 앞|골라인 앞|박스 안으로 떨어/.test(txt) && !/박스 안으로 들어온다|박스 쪽으로|박스로 들어온다|박스 한가운데로|박스 안으로 파고/.test(txt)) {
        const inOpp = bx > 88.5 && side < 20.2, inOur = bx < 16.5 && side < 20.2;
        rule(sit.id, "박스 안이라는데 공이 박스 밖", inOpp || inOur, `${tag} 공(${bx.toFixed(0)},${by.toFixed(0)}): ${txt.slice(0, 40)}`);
      }
      if (/박스 앞|박스 바로 앞|아크 서클|박스 모서리|박스 바깥/.test(txt)) { const d = poss === "us" || /우리 골/.test(txt) === false ? 105 - bx : bx; const dd = Math.min(105 - bx, bx); rule(sit.id, "박스 앞이라는데 공이 멂", dd < 32, `${tag} 골라인에서 ${dd.toFixed(0)}m 공(${bx.toFixed(0)},${by.toFixed(0)}): ${txt.slice(0, 40)}`); }
      if (/하프라인/.test(txt)) rule(sit.id, "하프라인이라는데 공이 멂", Math.abs(bx - 52.5) < 15, `${tag} 공 x${bx.toFixed(0)}: ${txt.slice(0, 40)}`);
      if (/우리 진영 깊숙한|우리 진영에서 공을 끊/.test(txt)) rule(sit.id, "우리 진영이라는데 공이 상대 진영", bx < 52.5, `${tag} 공 x${bx.toFixed(0)}: ${txt.slice(0, 40)}`);
      if (/상대 진영에서/.test(txt)) rule(sit.id, "상대 진영이라는데 공이 우리 진영", bx > 52.5, `${tag} 공 x${bx.toFixed(0)}: ${txt.slice(0, 40)}`);
      if (/우리 골문을 보고|몸은 우리 골문 쪽/.test(txt)) { const p = opp.reduce((a, o) => Math.min(a, hyp(o.x - M.x, o.y - M.y)), 99); rule(sit.id, "등 뒤에서 상대가 달려든다는데 상대가 멂", p < 6, `${tag} 가장 가까운 상대 ${p.toFixed(0)}m: ${txt.slice(0, 30)}`); }
      if (/골키퍼가 공을 건넸다/.test(txt)) rule(sit.id, "골키퍼가 줬다는데 골키퍼가 안 줌", recent(6).some(e => e.type === "pass" && e.from === m.gk.us) || recent(6).some(e => e.type === "pass" && e.from === m.gk.us), `${tag} 공을 준 선수 ${recent(6).filter(e => e.type === "pass").map(e => e.from).join(",")}: ${txt.slice(0, 30)}`);
      if (/경고 한 장이 있는/.test(txt)) rule(sit.id, "경고 받은 동료라는데 이 경기 우리 팀 경고가 없음", S.ev.some(e => e.type === "foul" && e.card && e.team === "us" && txt.includes(e.by)), `${tag} 우리 경고 ${m.stats.us.cards}: ${txt.slice(0, 40)}`);
      if (/새로 들어와/.test(txt)) rule(sit.id, "새로 들어온 상대라는데 상대 교체가 없음", false, `${tag} ${txt.slice(0, 40)}`);
      if (/우리 골키퍼 .{0,6}도 뛰어나온다/.test(txt)) rule(sit.id, "우리 골키퍼가 나온다는데 골문에 서 있음", ourGK && ourGK.x > 4, `${tag} 우리 골키퍼 x${ourGK?.x.toFixed(1)}: ${txt.slice(0, 30)}`);
      // 장면 문장 속 이름이 공과 얼마나 먼지 (상대 이름: 공 가진 상대/나를 막는 상대)
      for (const [role, nm] of [["opp", pd.vars.opp], ["mate", pd.vars.mate]]) {
        if (!nm || !txt.includes(nm)) continue;
        const P = S.P.find(p => p.name === nm); if (!P) { bad("장면 이름이 경기장에 없는 선수", `${tag} ${role} ${nm}`); continue; }
        const d = hyp(P.x - bx, P.y - by);
        cnt("장면 이름 " + role);
        if (d > (role === "opp" ? 12 : 30)) bad(`장면 문장의 ${role === "opp" ? "상대" : "동료"} 이름이 공과 멂 (${role === "opp" ? 12 : 30}m)`, `${tag} ${nm} ${d.toFixed(0)}m: ${txt.slice(0, 44)}`);
      }
      // ── 선택 ──
      const pick = PICK === "auto" ? autoChoice(m) : Math.floor(prand() * pd.list.length);
      const ev0 = S.ev.length, feed0 = m.feed.length, vars = { ...pd.vars };
      const score0 = [...m.score];
      const r = resolve(s, m, pick);
      L.push(...r.lines);
      const outText = r.outText;
      let g2 = 0;
      while ((S.script.length || S.scur) && !m.done && !m.pending && g2++ < 30) { const x = next(s, m); if (x.cut) frames.push(null); frames.push(...x.frames); L.push(...x.lines); }
      const evs = S.ev.slice(ev0);
      const newLines = m.feed.slice(feed0);
      momentLog.push({ tag, sit: sit.id, r, vars, evs, newLines, score0, score1: [...m.score], label: pd.list[pick].label });
      // 결과 문장 속 이름이 실제로 움직인 선수인지
      const firstMyPass = evs.find(e => e.type === "pass" && e.from === m.me);
      const myPassTo = firstMyPass?.to;
      if (vars.mate && outText.includes(vars.mate) && /에게|패스|내줬|연결|찔러|벌렸|떨궜|밀어 줬|넘겼|건넸/.test(outText) && !/거치지 않고/.test(outText) && poss === "us" && !/돌려준다|돌아서지 못하고|컷백이|건넸다\. "네가|양보/.test(outText)) {
        cnt("결과 문장 동료에게 패스");
        const ok = myPassTo === vars.mate || evs.some(e => e.type === "pass" && e.from === m.me && e.to === vars.mate);
        if (!ok) bad("결과 문장의 '{mate}에게 패스'인데 경기장에서는 다른 선수에게 감", `${tag} ${r.outcome}/${r.act ?? "-"} 문장 ${vars.mate}, 실제 ${myPassTo ?? "내 패스 없음"}: ${outText.slice(0, 40)}`);
      }
      if (/거치지 않고/.test(outText)) { const recv = evs.filter(e => e.type === "pass" && e.from === m.me).map(e => e.to); bad("'{mate}를 거치지 않고' 문장인데 그 {mate}에게 패스함 (검사 대상)", `${tag} 문장 ${vars.mate}, 실제 받은 ${recv.join(",")}: ${outText.slice(0, 40)}`); if (recv.includes(vars.mate)) bad("'{mate}를 거치지 않고' 문장인데 실제로 그 {mate}에게 줌", `${tag} ${recv.join(",")} ${outText.slice(0, 40)}`); }
      if (/원터치로 돌려준다|주고, 달리고, 다시 받았다|던지고 바로 돌려받았다|짧게 주고 다시 받았다/.test(outText)) {
        cnt("원투 결과");
        const out1 = evs.find(e => e.type === "pass" && e.from === m.me), back = out1 && evs.find(e => e.type === "pass" && e.to === m.me && e.t > out1.t);
        if (!out1 || !back) bad("원투(주고 돌려받기) 문장인데 경기장에서는 패스를 주고받지 않음", `${tag} ${r.outcome} 패스 ${evs.filter(e => e.type === "pass").map(e => e.from + "→" + e.to).join(" ") || "없음"}: ${outText.slice(0, 40)}`);
      }
      if (vars.opp && outText.includes(vars.opp) && /가로챈|끊었|빼앗|걷어 냈|빼냈|읽고/.test(outText) && poss === "us") {
        cnt("결과 문장 상대가 빼앗음");
        const who = evs.find(e => ["intercept", "steal", "tackle", "clear", "header"].includes(e.type) && e.team === "them");
        if (who && who.by !== vars.opp) bad("결과 문장의 '{opp}가 빼앗음'인데 다른 상대가 빼앗음", `${tag} 문장 ${vars.opp}, 실제 ${who.by}: ${outText.slice(0, 40)}`);
      }
      // 골: 문장 이름 vs 경기장 슈팅한 선수, 점수 vs 경기장 골
      const gl = evs.filter(e => e.type === "goal");
      const dScore = [m.score[0] - score0[0], m.score[1] - score0[1]];
      cnt("장면 결과");
      if (dScore[0] + dScore[1] !== gl.length) bad("점수는 올랐는데 경기장에서 골이 안 들어감 (또는 반대)", `${tag} 점수 +${dScore.join("/+")}, 경기장 골 ${gl.length}: ${outText.slice(0, 40)}`);
      for (const g of gl) {
        const goalLine = newLines.find(l => l.k?.startsWith("goal"));
        if (goalLine && !goalLine.t.includes(g.by)) {
          const named = [...S.P].filter(p => p.pos !== "GK" && goalLine.t.includes(p.name)).map(p => p.name);
          if (named.length) bad("골 문장의 이름과 경기장에서 골 넣은 선수가 다름", `${tag} 문장 [${named.join(",")}], 경기장 ${g.by}(${g.team}): ${goalLine.t.slice(0, 40)}`);
        }
        const log = m.goalsLog[m.goalsLog.length - 1];
        if (log && log.name !== g.by && !(log.me && g.me)) bad("기록(득점자)과 경기장 득점자가 다름", `${tag} 기록 ${log.name}, 경기장 ${g.by}: ${outText.slice(0, 30)}`);
      }
      // 슈팅 결과 문장(선방)과 경기장: 잡았다/쳐 냈다/코너킥
      const se = evs.find(e => e.type === "shotEnd" && e.forced);
      if (se && se.result === "save") {
        const after = S.ev.slice(S.ev.indexOf(se) + 1, S.ev.indexOf(se) + 4);
        const corner = after.some(e => e.type === "out" && e.kind === "corner");
        const resLine = newLines.filter(l => l.ts != null && l.ts <= se.t + 0.6 && l.ts >= se.t - 3 && !l.fast && !/^▶/.test(l.t)).map(l => l.t).join(" ");
        cnt("선택 슈팅 선방");
        if (/품|안았|잡아 낸|잡는다|잡았|안긴/.test(resLine) && corner) bad("결과 문장은 '골키퍼가 잡았다'인데 경기장은 쳐 내서 코너킥", `${tag}: ${resLine.slice(0, 60)}`);
        if (/코너킥/.test(resLine) && !corner) bad("결과 문장은 코너킥인데 경기장은 코너킥 아님", `${tag}: ${resLine.slice(0, 60)}`);
      }
      continue;
    }
    const x = next(s, m);
    if (x.cut) frames.push(null);
    frames.push(...x.frames); L.push(...x.lines);
  }
  finishMatch(s, m);
  // ── 경기 전체: 점수와 경기장 골 수, 코너킥 수, 슈팅 수 ──
  const goalsPitch = { us: 0, them: 0 }, corners = { us: 0, them: 0 }, shots = { us: 0, them: 0 };
  for (const e of S.ev) {
    if (e.type === "goal") goalsPitch[e.team]++;
    if (e.type === "out" && e.kind === "corner") corners[e.team]++;
    if (e.type === "shot") shots[e.team]++;
  }
  cnt("경기");
  if (goalsPitch.us !== m.score[0] || goalsPitch.them !== m.score[1]) bad("최종 점수와 경기장에서 들어간 골 수가 다름", `${tagG} 점수 ${m.score.join(":")}, 경기장 골 ${goalsPitch.us}:${goalsPitch.them}`);
  if (corners.us !== m.stats.us.corners || corners.them !== m.stats.them.corners) bad("통계 코너킥 수와 경기장 코너킥 수가 다름", `${tagG} 통계 ${m.stats.us.corners}:${m.stats.them.corners}, 경기장 ${corners.us}:${corners.them}`);
  if (Math.abs(shots.us - m.stats.us.shots) > 0 || Math.abs(shots.them - m.stats.them.shots) > 0) bad("통계 슈팅 수와 경기장 슈팅 수가 다름", `${tagG} 통계 ${m.stats.us.shots}:${m.stats.them.shots}, 경기장 ${shots.us}:${shots.them}`);
  // ── 줄 점검: 모든 종류의 줄(내 장면 결과 포함)의 이름 ──
  const F = frames.filter(Boolean), P = S.P;
  const at = t => { let lo = 0, hi = F.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (F[mid][0] < t) lo = mid + 1; else hi = mid; } return lo; };
  const names = P.map(p => p.name);
  for (const l of m.feed) {
    if (!l.t || l.ts == null || l.amb || ["stat", "coach", "whistle"].includes(l.k)) continue;
    if (!["me-good", "me-bad", "goal-us", "goal-them", "goal-me", "us", "them", "me-auto", "info"].includes(l.k)) continue;
    if (/오프사이드|교체|경고|옐로카드|격차|동점|역전|선제골|가리키며|붙어 다닌다|양보|건넸다|신호를|손짓|불러 모|주의를|카드|고맙다/.test(l.t)) continue;
    const i0 = at(l.ts - (/수비 뒤로|의 패스가 정확|방향 전환|반대편/.test(l.t) ? 4.5 : 2.5)), i1 = at(l.ts + 1.5);
    for (let pi = 0; pi < P.length; pi++) {
      const nm = names[pi]; if (!nm || nm.length < 2 || !l.t.includes(nm) || P[pi].pos === "GK") continue;
      let dmin = 1e9; for (let i = i0; i <= i1; i++) { const f = F[i]; dmin = Math.min(dmin, hyp(f[4 + pi * 2] - f[1], f[5 + pi * 2] - f[2])); }
      cnt("이름 줄 " + l.k);
      if (dmin > 12) bad(`이름 나온 선수가 공과 멂 (줄 종류 ${l.k})`, `${tagG} ${l.minute}' ${nm} ${dmin.toFixed(0)}m: ${l.t.slice(0, 46)}`);
    }
  }
  // ── 공·선수 순간이동 (dt 상관없이 한 프레임에 움직인 거리) ──
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], c = frames[i]; if (!a || !c) continue;
    const dt = c[0] - a[0]; if (dt <= 0) continue;
    const bj = hyp(c[1] - a[1], c[2] - a[2]);
    if (bj > 5.5 && bj / dt > 45) bad("공 순간이동 (한 틱에 5.5m 넘게)", `${tagG} t${c[0].toFixed(1)} ${Math.floor(c[0] / 3)}' ${bj.toFixed(1)}m (${a[1].toFixed(0)},${a[2].toFixed(0)})→(${c[1].toFixed(0)},${c[2].toFixed(0)})`);
    for (let pi = 0; pi < P.length; pi++) { const pj = hyp(c[4 + pi * 2] - a[4 + pi * 2], c[5 + pi * 2] - a[5 + pi * 2]); if (pj > 2.5) bad("선수 순간이동 (한 틱에 2.5m 넘게)", `${tagG} t${c[0].toFixed(1)} ${names[pi]} ${pj.toFixed(1)}m`); }
  }
}
console.log(`경기 ${games}, 내 장면 ${moments} (선택: ${PICK})`);
console.log("분모", JSON.stringify(denom));
const keys = Object.keys(issues).sort((a, b) => issues[b] - issues[a]);
for (const kk of keys) { console.log(`\n■ ${kk}: ${issues[kk]}건`); for (const x of samples[kk]) console.log("   " + x); }
console.log("\n── 장면별 문장 규칙 실패율 ──");
for (const [name, ids] of Object.entries(sceneRule)) for (const [id, [n, f]] of Object.entries(ids)) if (f) console.log(`${name} | ${id}: ${f}/${n} (${(f / n * 100).toFixed(0)}%)`);
