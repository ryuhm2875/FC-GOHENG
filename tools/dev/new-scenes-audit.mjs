// 새 장면(2026-10-23 현대 축구 장면) 점검: 장면을 자주 나오게 해 두고
//  (1) 선택지가 뜰 때 경기장이 장면 문장과 맞는지  (2) 고른 결과가 경기장에서 문장대로 일어나는지
// node tools/dev/new-scenes-audit.mjs [경기 수] [포지션 FW|MF|DF|all]   SHOW=예시 수, PICK=auto|random
const R = new URL("../../", import.meta.url).href;
const { setSeed, rand } = await import(R + "js/rng.js");
const { rollPlayer, newGame } = await import(R + "js/state.js");
const { beginWeek, endWeek } = await import(R + "js/engine/week.js");
const { prepareMatch, next, resolve, autoChoice, _dev } = await import(R + "js/engine/match.js");
const { SITUATIONS } = await import(R + "data/match.js");
const { SCENES } = await import(R + "data/scenes.js");
const { DETAIL_POS } = await import(R + "data/player.js");

const N = +process.argv[2] || 60, which = process.argv[3] || "all", SHOW = +(process.env.SHOW || 4), PICK = process.env.PICK || "random";
const NEW = ["df_carry_out", "df_counter_2v2", "df_cutback_guard", "df_shield_out", "fb_inverted", "mf_scan_turn", "mf_wing_triangle", "mf_track_runner", "mf_underlap", "mf_cover_cb", "fw_dummy", "fw_box_turn", "fw_flick_on", "fw_screen"];
const issues = {}, samples = {}, seen = {}, outs = {};
const bad = (kind, msg) => { issues[kind] = (issues[kind] || 0) + 1; (samples[kind] ||= []).length < SHOW && samples[kind].push(msg); };
const hyp = Math.hypot;
const DETAIL_FOR = { DF: ["cb", "bcb", "fb_l", "fb_r"], MF: ["b2b", "dm", "am", "winger_l", "winger_r"], FW: ["poacher", "target", "second"] };
let games = 0;

for (let k = 0; k < N; k++) {
  setSeed(91000 + k);
  const pos = which === "all" ? ["FW", "MF", "DF"][k % 3] : which;
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: k % 2 ? "L" : "R", growthType: "steady" }));
  s.player.detailPos = DETAIL_FOR[pos][k % DETAIL_FOR[pos].length];
  const lv = 48 + (k % 5) * 7;
  for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx);
  games++;
  const S = m.sim;
  const pool = NEW.map(id => SITUATIONS.find(x => x.id === id)).filter(x => x.pos.includes(pos));
  let guard = 0;
  while (!m.done && guard++ < 6000) {
    // 원하는 장면을 새 장면 중에서 고름 (나올 수 있는 것만)
    if (!m.want && !m.pending && m.momentQ?.length && m.minute >= m.momentQ[0] - 0.5) {
      const ok = pool.filter(x => _dev.canSit(s, m, x));
      if (ok.length) { const w = ok[Math.floor(rand() * ok.length)]; m.want = { sit: w, cat: _dev.sitCat(w), t0: m.minute }; }
    }
    if (!m.pending) { next(s, m); continue; }
    const pd = m.pending, sit = pd.sit, id = sit.id;
    if (!NEW.includes(id)) { resolve(s, m, PICK === "auto" ? autoChoice(m) : Math.floor(rand() * pd.choices.length)); continue; }
    seen[id] = (seen[id] || 0) + 1;
    const v = pd.vars, M = S.P.find(p => p.me), H = S.holder, sc = SCENES[id];
    const P = name => S.P.find(p => p.name === name);
    const tag = `[${s.player.detailPos} #${k} ${m.minute}' ${id}]`;
    const them = (sit.poss || "us") === "them";
    // ── 1) 선택지가 뜰 때 ──
    const opp = P(v.opp), opp2 = v.opp2 ? P(v.opp2) : null, mate = P(v.mate), wing = P(v.wing);
    if (pd.text.includes("{") ) bad("문장에 채워지지 않은 이름", `${tag} ${pd.text}`);
    if (them && (!H || H.team !== "them") && id !== "df_shield_out") bad("상대 장면인데 공을 상대가 안 가짐", `${tag} ${H ? H.team + " " + H.name : "없음"}`);
    if (!them && !sc.holder && H !== M) bad("내가 받는 장면인데 공이 나에게 없음", `${tag} ${H ? H.name : "없음"}`);
    if (sc.holder === "mate" && (!H || H.team !== "us" || H.me)) bad("동료가 공 가진 장면인데 아님", `${tag} ${H ? H.name : "없음"}`);
    if (id === "df_carry_out") { const blk = S.P.filter(p => p.team === "them" && p.pos !== "GK" && p.x > M.x - 1 && p.x < M.x + 13 && Math.abs(p.y - M.y) < 7); if (blk.length) bad("볼 운반: 앞이 비어 있지 않음", `${tag} ${blk.map(p => `${p.name} ${(p.x - M.x).toFixed(1)}m`).join(",")}`); }
    if (id === "df_counter_2v2") {
      const ours = S.P.filter(p => p.team === "us" && p.ri && p.pos !== "GK" && p.x < H.x - 1).sort((a, b) => hyp(a.x - H.x, a.y - H.y) - hyp(b.x - H.x, b.y - H.y));
      if (!ours.slice(0, 2).includes(M) || !mate || !ours.slice(0, 2).includes(mate)) bad("2 대 2: 공 가진 상대에게 가장 가까운 우리 둘이 나와 {mate}가 아님", `${tag} ${ours.slice(0, 3).map(p => `${p.name}${p.me ? "(나)" : ""} ${hyp(p.x - H.x, p.y - H.y).toFixed(0)}m`).join(", ")} / mate ${v.mate}`);
      const ahead = S.P.filter(p => p.team === "them" && p !== H && p.ri && p.pos !== "GK" && p.x < H.x + 4 && hyp(p.x - H.x, p.y - H.y) < 26);
      if (!ahead.length) bad("2 대 2: 같이 뛰는 상대가 없음", tag);
    }
    if (id === "df_cutback_guard") {
      if (H.x > 10 || Math.abs(H.y - 34) < 7) bad("컷백: 공 가진 상대가 골라인 앞이 아님", `${tag} (${H.x.toFixed(1)}, ${H.y.toFixed(1)})`);
      if (!opp2 || opp2.x > 19 || Math.abs(opp2.y - 34) > 10) bad("컷백: {opp2}가 페널티 지점 쪽이 아님", `${tag} ${opp2 ? `(${opp2.x.toFixed(1)}, ${opp2.y.toFixed(1)})` : "없음"}`);
      if (M.x > 14) bad("컷백: 내가 박스 안이 아님", `${tag} x${M.x.toFixed(1)}`);
    }
    if (id === "df_shield_out") {
      const b = S.ball, fw = opp;
      if (H) bad("공 내보내기: 누가 공을 잡고 있음", `${tag} ${H.name}`);
      if (b.x > 9) bad("공 내보내기: 공이 골라인 가까이가 아님", `${tag} x${b.x.toFixed(1)}`);
      if (hyp(M.x - b.x, M.y - b.y) > 3.2) bad("공 내보내기: 내가 공에서 멂", `${tag} ${hyp(M.x - b.x, M.y - b.y).toFixed(1)}m`);
      if (fw && hyp(fw.x - b.x, fw.y - b.y) < hyp(M.x - b.x, M.y - b.y) - 0.3) bad("공 내보내기: 상대가 나보다 공에 가까움", `${tag}`);
      if (fw && hyp(fw.x - M.x, fw.y - M.y) > 7) bad("공 내보내기: 상대가 등 뒤에 없음", `${tag} ${hyp(fw.x - M.x, fw.y - M.y).toFixed(1)}m`);
    }
    if (id === "fb_inverted" && Math.abs(M.y - 34) > 13) bad("인버티드: 내가 안쪽이 아님", `${tag} y${M.y.toFixed(1)}`);
    if (id === "mf_scan_turn") { const d = Math.min(...S.P.filter(p => p.team === "them" && p.pos !== "GK").map(p => hyp(p.x - M.x, p.y - M.y))); if (d > 4.5) bad("어깨 너머: 등 뒤 상대가 멂", `${tag} ${d.toFixed(1)}m`); if ((/\{wing|흘려/.test(pd.text + pd.choices.map(c => c.label).join()) || pd.text.includes(v.wing)) && (!wing || hyp(wing.x - M.x, wing.y - M.y) > 18)) bad("어깨 너머: {wing}이 가까이 없음", `${tag}`); }
    if (id === "mf_wing_triangle") {
      if (Math.abs(M.y - 34) < 10) bad("삼각형: 측면이 아님", `${tag} y${M.y.toFixed(1)}`);
      const near = S.P.filter(p => p.team === "us" && !p.me && p.pos !== "GK" && hyp(p.x - M.x, p.y - M.y) < 13);
      if (near.length < 2) bad("삼각형: 13m 안 동료가 둘 미만", `${tag} ${near.length}`);
      if (!near.some(p => p.pos === "DF")) bad("삼각형: 풀백이 가까이 없음", `${tag}`);
    }
    if (id === "mf_track_runner") { if (!opp2) bad("따라가기: {opp2} 없음", tag); else { if (opp2.x > M.x + 1) bad("따라가기: {opp2}가 아직 내 옆을 지나지 않음", `${tag} ${(opp2.x - M.x).toFixed(1)}m`); if (hyp(opp2.x - M.x, opp2.y - M.y) > 16) bad("따라가기: {opp2}가 너무 멂", `${tag} ${hyp(opp2.x - M.x, opp2.y - M.y).toFixed(1)}m`); } }
    if (id === "mf_underlap") { if (Math.abs(H.y - 34) < 13) bad("언더래핑: 동료가 측면이 아님", `${tag}`); if (Math.abs(M.y - 34) > Math.abs(H.y - 34) - 2) bad("언더래핑: 내가 동료 안쪽이 아님", `${tag} me${M.y.toFixed(1)} H${H.y.toFixed(1)}`); if (M.x > H.x + 2) bad("언더래핑: 내가 동료보다 앞", `${tag}`); }
    if (id === "mf_cover_cb") { if (!mate || mate.pos !== "DF" || hyp(mate.x - H.x, mate.y - H.y) > 3.5) bad("빈자리: 센터백이 붙어 있지 않음", `${tag} ${mate ? hyp(mate.x - H.x, mate.y - H.y).toFixed(1) : "-"}`); if (!opp2 || opp2.x > H.x - 3) bad("빈자리: 뒤로 빠질 {opp2}가 없음", tag); }
    if (id === "fw_dummy") { if (H.x < 92 || Math.abs(H.y - 34) < 11) bad("흘려 보내기: 동료가 측면 깊은 곳이 아님", `${tag} (${H.x.toFixed(1)}, ${H.y.toFixed(1)})`); if (M.x < 92 || Math.abs(M.y - 34) > 9) bad("흘려 보내기: 내가 니어포스트 앞이 아님", `${tag} (${M.x.toFixed(1)}, ${M.y.toFixed(1)})`); if (!wing || wing.x > M.x - 3 || hyp(wing.x - 89, wing.y - 34) > 6) bad("흘려 보내기: {wing}이 내 뒤 페널티 지점 쪽이 아님", `${tag} ${wing ? `(${wing.x.toFixed(1)}, ${wing.y.toFixed(1)})` : "없음"}`); }
    if (id === "fw_box_turn") { if (M.x < 88.5 || Math.abs(M.y - 34) > 20) bad("박스 안 터닝: 박스 안이 아님", `${tag} (${M.x.toFixed(1)}, ${M.y.toFixed(1)})`); const d = Math.min(...S.P.filter(p => p.team === "them" && p.pos !== "GK").map(p => hyp(p.x - M.x, p.y - M.y))); if (d > 2.8) bad("박스 안 터닝: 등 뒤 수비가 멂", `${tag} ${d.toFixed(1)}m`); }
    if (id === "fw_flick_on") { const d = Math.min(...S.P.filter(p => p.team === "them" && p.pos !== "GK").map(p => hyp(p.x - M.x, p.y - M.y))); if (d > 3) bad("플릭온: 같이 뜬 수비가 멂", `${tag} ${d.toFixed(1)}m`); }
    if (id === "fw_screen") { const gk = S.P.find(p => p.team === "them" && p.pos === "GK"); if (!gk || hyp(gk.x - M.x, gk.y - M.y) > 4.5) bad("골키퍼 앞: 내가 골키퍼 바로 앞이 아님", `${tag} ${gk ? hyp(gk.x - M.x, gk.y - M.y).toFixed(1) : "-"}m`); if (H.x > 89 || Math.abs(H.y - 34) > 19) bad("골키퍼 앞: 동료가 박스 밖 정면이 아님", `${tag} (${H.x.toFixed(1)}, ${H.y.toFixed(1)})`); }
    // ── 2) 결과 ──
    const ci = PICK === "auto" ? autoChoice(m) : Math.floor(rand() * pd.choices.length);
    const label = pd.choices[ci].label;
    const n0 = S.ev.length;
    const r = resolve(s, m, ci);
    const key = `${id} | ${label} | ${r.outcome}`;
    outs[key] = (outs[key] || 0) + 1;
    // 대본이 끝날 때까지 굴림
    let g2 = 0; while ((S.script.length || S.scur) && !m.done && g2++ < 400) next(s, m);
    const evs = S.ev.slice(n0);
    const has = (type, f = () => true) => evs.some(e => e.type === type && f(e));
    const t2 = `${tag} "${label}" → ${r.outcome}: ${r.outText}`;
    if ((S.timeouts || 0) && S._toSeen !== S.timeouts) { S._toSeen = S.timeouts; bad("대본 시간 초과", t2); }
    if (r.act === "shieldOut" && !has("out", e => e.kind === "goalkick" && e.team === "us")) bad("공 내보내기: 우리 골킥이 안 됨", `${t2} ${evs.filter(e => e.type === "out").map(e => e.kind + ":" + e.team).join(",")}`);
    if (r.act === "oppPassCut" && !(has("intercept", e => e.me) || S.holder?.me)) bad("패스 끊기: 내가 끊지 못함", `${t2} 공:${S.holder?.name || "없음"}`);
    if (r.act === "dummy" && !(wing && (S.holder === wing || has("pass", e => e.to === wing.name)))) bad("흘려 보내기: {wing}에게 안 감", t2);
    if (id === "fw_dummy" && r.outcome === "decoy" && !has("shotEnd", e => e.by === v.wing)) bad("흘려 보내기 미끼: {wing}이 안 때림", `${t2} ${evs.filter(e => e.type === "shotEnd").map(e => e.by).join(",")}`);
    if (id === "fw_screen") {
      if (/가린다/.test(label) && !has("shotEnd", e => e.team === "us" && !e.me)) bad("골키퍼 앞: 동료 슈팅 없음", t2);
      if (/쳐 낼/.test(label) && r.outcome === "shot" && !(has("shotEnd", e => e.save === "parry" && e.team === "us") && has("shotEnd", e => e.me))) bad("골키퍼 앞: 쳐 낸 공을 내가 못 때림", `${t2} ${evs.filter(e => e.type === "shotEnd").map(e => `${e.by}:${e.result}/${e.save}`).join(",")}`);
      if (/방향/.test(label) && !has("shotEnd", e => e.me)) bad("골키퍼 앞: 굴절 슈팅 없음", t2);
    }
    if (/\{opp2[|}]/.test(r.outTpl) && r.outcome === "danger" && !has("shotEnd", e => e.by === v.opp2) && !has("goal", e => e.by === v.opp2)) bad("{opp2}가 받아 때린다는데 다른 선수가 때림", `${t2} ${evs.filter(e => e.type === "shotEnd").map(e => e.by).join(",")}`);
    if (r.outcome === "card" && !evs.some(e => e.type === "restart" || e.type === "setup") && S.restart?.kind !== "fk" && !has("foul")) { /* 프리킥 재개는 대본 restart 단계 */ }
    if (r.act === "offside" && !(S.restart?.kind === "fk" || has("setup", e => e.kind === "fk"))) bad("오프사이드인데 프리킥이 아님", t2);
  }
}
console.log(`경기 ${games}`);
console.log("새 장면 나온 횟수:", NEW.map(id => `${id} ${seen[id] || 0}`).join(" · "));
const ks = Object.keys(issues).sort((a, b) => issues[b] - issues[a]);
if (!ks.length) console.log("문제 없음");
for (const k of ks) { console.log(`\n■ ${k}: ${issues[k]}`); for (const x of samples[k]) console.log("   ", x); }
if (process.env.OUTS) for (const [k, c] of Object.entries(outs).sort()) console.log(c, k);
