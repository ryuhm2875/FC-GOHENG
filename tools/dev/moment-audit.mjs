// 내 장면 점검: 장면 문장 → 선택 → 결과 문장 → 경기장 대본이 서로 맞는지 하나씩 따라갑니다 (화면 없이).
// node tools/dev/moment-audit.mjs [경기 수] [포지션 FW|MF|DF|all]   SHOW=8 (예시 수)
// 보는 것
//  - 선택지가 뜰 때 공 가진 선수: 장면이 "내가 공을 가졌다"면 나, 동료 장면이면 그 동료, 상대 장면이면 상대
//  - 대본 단계가 제시간에 안 끝남(시간 초과) / 공이 3m 넘게 떨어진 선수에게 붙음(미끄러짐)
//  - 슈팅 결과: 결과 문장(골·선방·빗나감·골대·막힘)과 경기장 슈팅 결과가 같은지, 누가 찼는지
//  - 결과 뒤 공 소유: 공을 지켰다/빼앗았다(우리 공) · 빼앗겼다(상대 공)가 맞는지
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";
import { SCENES } from "../../data/scenes.js";

const N = +process.argv[2] || 60, which = process.argv[3] || "all", SHOW = +(process.env.SHOW || 8);
const RANDOM = !!process.env.RANDOM_PICK;           // 자동 선택 대신 무작위 선택 (모든 선택지를 고루 보기)
const issues = {}, samples = {};
const bad = (kind, msg) => { issues[kind] = (issues[kind] || 0) + 1; (samples[kind] ||= []).length < SHOW && samples[kind].push(msg); };
let games = 0, moments = 0; const acts = {}, outDelay = [];
const SHOT_OUT = new Set(["shot", "chip", "head", "tapIn", "longShot", "acro", "pk"]);

for (let k = 0; k < N; k++) {
  setSeed(30000 + k);
  const pos = which === "all" ? ["FW", "MF", "DF"][k % 3] : which;
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  const lv = 45 + (k % 5) * 8;
  for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx);
  games++;
  const S = m.sim;
  let guard = 0, lastOut = null;
  while (!m.done && guard++ < 4000) {
    if (!m.pending) { next(s, m); continue; }
    moments++;
    const pd = m.pending, sit = pd.sit, sc = SCENES[sit.id] || {};
    const poss = sit.poss || "us", cat = pd.ctx?.cat || "";
    const tag = `[${pos} #${k} ${m.minute}' ${sit.id} ${cat}]`;
    // 1) 선택지가 뜰 때 공 가진 선수
    const H = S.holder, me = S.P.find(p => p.me);
    if (!cat.includes(":")) {
      const want = poss === "them" ? "them" : (sc.holder === "mate" || sc.holder === "df") ? "mate" : "me";
      const got = !H ? "없음" : H.me ? "me" : H.team === "us" ? "mate" : "them";
      if (want !== got) bad("선택할 때 공 가진 선수가 장면과 다름", `${tag} 장면은 ${want}, 실제 ${got}${H ? `(${H.name})` : ""}: ${pd.text.slice(0, 36)}`);
      if (want === "them" && H && me && Math.hypot(H.x - me.x, H.y - me.y) > 18) bad("상대 장면인데 내가 상대와 멂", `${tag} ${Math.hypot(H.x - me.x, H.y - me.y).toFixed(0)}m: ${pd.text.slice(0, 36)}`);
    }
    // 1-2) 장면 문장이 말하는 압박·빈 공간이 경기장과 맞는지 (공 가진 선수 기준)
    if (!cat.includes(":") && H) {
      const opp = S.P.filter(p => p.team !== H.team && p.pos !== "GK");
      const ds = opp.map(p => Math.hypot(p.x - H.x, p.y - H.y)).sort((a, b) => a - b);
      const nPress = typeof sc.press === "number" ? sc.press : poss === "us" ? 1 : 0;
      const txt = pd.text;
      if (poss === "us" && nPress >= 1 && /압박|붙|달려든|밀어붙|막아|둘이|셋이|몸을 붙/.test(txt) && ds[0] > (sc.pressGap ?? 1.8) + 3.5) bad("압박 장면인데 상대가 멂", `${tag} 가장 가까운 상대 ${ds[0].toFixed(1)}m: ${txt.slice(0, 36)}`);
      if (sc.mark2) {   // 두 번째 상대는 센터백 짝을 막음
        const pair = S.P.filter(q => q.team === H.team && q !== H && q.pos === "DF" && !q.me).sort((a, b) => Math.hypot(a.x - H.x, a.y - H.y) - Math.hypot(b.x - H.x, b.y - H.y))[0];
        const dp = pair ? Math.min(...opp.map(p => Math.hypot(p.x - pair.x, p.y - pair.y))) : 0;
        if (dp > 5) bad("센터백 짝을 막는 상대가 없음", `${tag} ${dp.toFixed(1)}m: ${txt.slice(0, 36)}`);
      } else if (poss === "us" && /둘이|두 명|둘 사이|셋이|세 명/.test(txt) && /달려든|붙|막아|좁혀/.test(txt) && ds[1] > 8) bad("두 명 압박 장면인데 한 명뿐", `${tag} 두 번째 상대 ${ds[1].toFixed(1)}m: ${txt.slice(0, 36)}`);
      if (poss === "us" && /텅 비었|아무도 없|앞에 아무도|아무도 막지/.test(txt) && !/반대편|측면이 텅/.test(txt)) {
        const g = 1, ahead = opp.filter(p => (p.x - H.x) * g > 0 && (p.x - H.x) * g < 12 && Math.abs(p.y - H.y) < 6);
        if (ahead.length) bad("빈 공간 장면인데 앞에 상대가 있음", `${tag} 앞 12m 안 상대 ${ahead.length}명: ${txt.slice(0, 36)}`);
      }
    }
    // 1-3) 앞 장면의 결과 문장이 이 장면 설명보다 먼저 나왔는지
    if (lastOut && lastOut.ts != null && lastOut.ts > S.t + 0.05) bad("앞 장면 결과보다 다음 장면이 먼저", `${tag} 앞 결과 ${lastOut.t.slice(0, 24)}`);
    // 2) 선택하고 대본 따라가기
    const pick = RANDOM ? Math.floor(Math.random() * pd.list.length) : autoChoice(m);
    const c = pd.list[pick];
    S.trace = []; S.traceEnd = false;
    const ev0 = S.ev.length, tSel = S.t;
    const r = resolve(s, m, pick);
    const outText = r.outText || "";
    const feed0 = m.feed.length;
    let g2 = 0;
    while ((S.script.length || S.scur) && !m.done && !m.pending && g2++ < 20) next(s, m);
    const trace = S.trace;
    for (const e of S.trace) {
      if (e.k === "timeout") bad("대본 단계 시간 초과", `${tag} ${r.outcome} 단계 ${e.step}: ${outText.slice(0, 30)}`);
      if (e.k === "glide") bad("공이 멀리서 선수에게 붙음", `${tag} ${r.outcome} ${e.p} ${e.d.toFixed(0)}m (단계 ${e.scur}): ${outText.slice(0, 30)}`);
    }
    S.trace = null;
    // 3) 슈팅 결과: 결과 줄의 종류(골 줄)와 경기장 슈팅 결과
    const evs = S.ev.slice(ev0);
    const shots = evs.filter(e => e.type === "shot" && e.forced);
    const ends = evs.filter(e => e.type === "shotEnd" && e.forced);
    const endT = (trace.find(e => e.k === "end")?.t ?? S.t) + 0.6;
    const newLines = m.feed.slice(feed0).filter(l => l.ts == null || l.ts <= endT);   // 대본이 끝난 뒤 경기 흐름의 줄은 빼고
    const goalLine = newLines.some(l => l.k?.startsWith("goal"));
    if (shots.length > 1) bad("슈팅이 두 번 나옴", `${tag} ${r.outcome}`);
    for (const e of shots) {
      const end = ends.find(x => x.t >= e.t);
      if (!end) { bad("슈팅 결과가 경기장에서 안 끝남", `${tag} ${r.outcome}`); continue; }
      if (e.x < 66 && e.kind !== "fk" && e.kind !== "long" && e.kind !== "pk") bad("먼 거리 슈팅", `${tag} ${r.outcome} ${e.by} x${e.x.toFixed(0)}`);
      if (goalLine !== (end.result === "goal")) bad("골 문장과 경기장 결과가 다름", `${tag} 경기장 ${end.result}, 골 줄 ${goalLine}: ${newLines.map(l => l.t).join(" / ").slice(0, 80)}`);
    }
    if (!shots.length && goalLine) bad("골 문장인데 경기장에서 슈팅이 없음", `${tag} ${r.outcome}`);
    // 4) 결과 뒤 공 소유 (대본이 끝난 순간)
    const end = trace.find(e => e.k === "end");
    const EXP = { hold: "us", passNear: "us", passWide: "us", passBack: "us", passGK: "us", throwUs: "us", steal: poss === "us" ? "them" : "us", cut: "them", gkLoss: "them",
      outLoss: "them", outThem: "them", gkUs: "us", outThrowUs: "us", outGoalUs: "us", foulThem: "us", foulUs: "them", oppToGK: "them", oppForward: "them", oppSide: "them", oppBack: "them", beat: "them", toOurGK: "us", oppOutThrowUs: "us",
      offside: poss === "us" ? "them" : "us" };
    const exp = r.act ? EXP[r.act] : null;
    if (end && exp && !shots.length && end.team && end.team !== exp) bad("결과 문장과 공 소유가 다름", `${tag} ${r.outcome}/${r.act} 기대 ${exp}, 실제 ${end.team}${end.restart ? "(" + end.restart + ")" : ""}: ${r.outText.slice(0, 40)}`);
    if (!end && (S.script.length || S.scur)) bad("대본이 안 끝남", `${tag} ${r.outcome}`);
    acts[r.act || r.outcome] = (acts[r.act || r.outcome] || 0) + 1;
    // 결과 문장이 나온 시각: 선택 뒤 몇 초 (시뮬레이션)
    const ol = newLines.find(l => l.t === r.outText);
    lastOut = ol || null;
    if (ol && ol.ts != null) { const dt = ol.ts - tSel; outDelay.push(dt); if (dt > 6) bad("결과 문장이 늦게 나옴", `${tag} ${dt.toFixed(1)}초: ${r.outText.slice(0, 30)}`); }
    else bad("결과 문장이 안 나옴", `${tag} ${r.outcome}`);
  }
  finishMatch(s, m);
}
outDelay.sort((a, b) => a - b);
console.log(`경기 ${games}, 내 장면 ${moments} (경기당 ${(moments / games).toFixed(1)}), 결과 문장까지 걸린 시간 중앙값 ${outDelay[outDelay.length >> 1]?.toFixed(1)}초, 90% ${outDelay[Math.floor(outDelay.length * 0.9)]?.toFixed(1)}초`);
console.log("동작", JSON.stringify(acts));
const keys = Object.keys(issues).sort((a, b) => issues[b] - issues[a]);
if (!keys.length) console.log("문제 없음");
for (const kk of keys) { console.log(`\n■ ${kk}: ${issues[kk]}건 (장면 100개당 ${(issues[kk] / moments * 100).toFixed(1)})`); for (const x of samples[kk]) console.log("   " + x); }
