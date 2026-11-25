// 장면 특기(★ 선택지) 점검: 정해 둔 장면을 억지로 나오게 하고, 정해 둔 선택지를 골라
//  (1) 그 선택지가 실제로 뜨는지  (2) 결과 문장이 말한 일이 경기장에서 일어나는지  (3) 결과가 고르게 갈리는지
//  (4) 해설 예시(성공·실패)를 눈으로 읽을 수 있게 출력합니다.
// node tools/dev/skill-audit.mjs [경기 수]   SHOW=예시 수(기본 2), SEED=시작 시드
// LABELS 의 장면 id → 고를 선택지 이름. 새 특기를 넣으면 여기에 더하세요.
const R = new URL("../../", import.meta.url).href;
const { setSeed, rand } = await import(R + "js/rng.js");
const { rollPlayer, newGame } = await import(R + "js/state.js");
const { beginWeek, endWeek } = await import(R + "js/engine/week.js");
const { prepareMatch, next, resolve, _dev } = await import(R + "js/engine/match.js");
const { SITUATIONS } = await import(R + "data/match.js");

const LABELS = {
  mf_counterpress: "숨이 차도 끝까지 쫓아가 압박한다",
  fb_overlap: "주고 또 뛰어 한 번 더 겹쳐 오른다",
  fw_1v1: "등지고 버티다 올라오는 동료에게 내준다",
  mf_cover: "말없이 풀백 자리로 내려가 대신 선다",
  penalty: "노트에 적어 둔 골키퍼 버릇대로 찬다",
  fw_offside: "오프사이드 라인을 세고 반 박자 늦게 출발한다",
  f4231_am_drop: "공부해 둔 대로 미드필더에게 넘기고 뒤를 지킨다",
  wx_wind_cross: "바람이 잦아드는 순간을 기다렸다 올린다",
  fw_mindgame: "고개 숙여 인사하고 돌아선다",
  df_player_down: process.env.ORIG ? "공을 밖으로 차 내 경기를 멈춘다" : "공을 밖으로 차 내고 먼저 달려가 의료진을 부른다",
  mate_yellow: "주심에게 먼저 손을 들어 사과하고 동료를 떼어 낸다",
  df_last: "손을 쓰지 않고 어깨로만 깨끗하게 막는다",
  fw_far_post: "먼 쪽 포스트로 날아들어 헤더",
  f4231_pivot: "등진 채 돌아서며 반대편 측면으로 크게 벌린다",
};
const N = +process.argv[2] || 90, SHOW = +(process.env.SHOW || 2), SEED0 = +(process.env.SEED || 93000);
const ids = Object.keys(LABELS);
const stat = Object.fromEntries(ids.map(id => [id, { seen: 0, offered: 0, out: {}, act: {}, ex: {}, pMe: 0, pOther: 0, nOther: 0 }]));
const issues = {}, samples = {};
const bad = (k, msg) => { issues[k] = (issues[k] || 0) + 1; (samples[k] ||= []).length < 4 && samples[k].push(msg); };
const DETAIL_FOR = { DF: ["cb", "fb_l", "fb_r"], MF: ["b2b", "dm", "am"], FW: ["poacher", "target", "second"] };
let trustUp = 0, trustN = 0;

for (let k = 0; k < N; k++) {
  setSeed(SEED0 + k);
  const pos = ["FW", "MF", "DF"][k % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: k % 2 ? "L" : "R", growthType: "steady" }));
  s.player.detailPos = DETAIL_FOR[pos][Math.floor(k / 3) % 3];
  for (const g of ["tech", "phys", "mental", "student"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = (+process.env.LV || 72) + Math.floor(rand() * (+process.env.SPAN || 10));   // LV=70 SPAN=3: 조건을 막 넘은 선수
  s.relations.coach = 60;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx);
  if (k % 4 === 0 || process.env.WIND) m.weather = "wind";
  if (k % 4 === 1) { m.oppForm = "4231"; m.sim.form.them = "4231"; }
  const S = m.sim;
  if (k % 4 === 2) { const mt = S.P.find(p => p.team === "us" && !p.me && p.pos !== "GK"); if (mt) m.cardsUs = [...(m.cardsUs || []), mt.name]; }   // 경고 받은 동료가 있는 경기 (mate_yellow)
  const pool = ids.map(id => SITUATIONS.find(x => x.id === id)).filter(x => x && x.pos.includes(pos));
  let guard = 0;
  while (!m.done && guard++ < 8000) {
    if (!m.want && !m.pending && m.momentQ?.length && m.minute >= m.momentQ[0] - 0.5) {
      const ok = pool.filter(x => _dev.canSit(s, m, x));
      if (ok.length) { const w = ok[Math.floor(rand() * ok.length)]; m.want = { sit: w, cat: _dev.sitCat(w), t0: m.minute }; }
    }
    if (!m.pending) { next(s, m); continue; }
    const pd = m.pending, id = pd.sit.id;
    const ci = LABELS[id] ? pd.choices.findIndex(c => pd.list[pd.choices.indexOf(c)].label === LABELS[id]) : -1;
    if (!LABELS[id] || pd.so) { resolve(s, m, Math.floor(rand() * pd.choices.length)); continue; }
    const st = stat[id]; st.seen++;
    if (ci < 0) { bad("선택지가 안 뜸", `[${pos} ${id}] 능력치가 되는데도 '${LABELS[id]}'이 없음: ${pd.list.map(c => c.label).join(" / ")}`); resolve(s, m, 0); continue; }
    st.offered++;
    st.pMe += pd.choices[ci].p; pd.choices.forEach((c, j) => { if (j !== ci && !c.signature) { st.pOther += c.p; st.nOther++; } });   // 성공 확률: 이 특기 vs 같은 장면의 보통 선택지
    const sceneText = pd.text, n0 = S.ev.length, f0 = m.feed.length, coach0 = s.relations.coach;
    const r = resolve(s, m, ci);
    let g2 = 0; while ((S.script.length || S.scur) && !m.done && g2++ < 400) next(s, m);
    const evs = S.ev.slice(n0), feed = m.feed.slice(f0).map(l => l.t).filter(Boolean);
    const has = (type, f = () => true) => evs.some(e => e.type === type && f(e));
    const me = s.player.name;
    st.out[r.outcome] = (st.out[r.outcome] || 0) + 1;
    st.act[r.act || "-"] = (st.act[r.act || "-"] || 0) + 1;
    const tag = `[${pos} #${k} ${m.minute}' ${id} → ${r.outcome}/${r.act || "-"}]`;
    if (feed.some(t => /\{|\}/.test(t)) || /\{|\}/.test(r.outText || "")) bad("채워지지 않은 자리 표시", `${tag} ${feed.find(t => /\{/.test(t)) || r.outText}`);
    if ((S.timeouts || 0) && S._toSeen !== S.timeouts) { S._toSeen = S.timeouts; bad("대본 시간 초과", tag); }
    const shots = evs.filter(e => e.type === "shotEnd");
    if (["shot", "chip", "longShot", "head", "tapIn", "pk"].includes(r.outcome) && !shots.some(e => e.me || e.by === me) && !has("goal", e => e.by === me))
      bad("슈팅 결과인데 내가 안 때림", `${tag} ${shots.map(e => e.by).join(",") || "슈팅 없음"}`);
    if (["assist", "keyPass", "killPass"].includes(r.outcome) && !has("pass", e => e.from === me || e.fromMe || e.me)) bad("패스 결과인데 내가 패스 안 함", `${tag} ${evs.filter(e => e.type === "pass").map(e => `${e.from}→${e.to}`).join(",")}`);
    if (r.outcome === "offside" && !(S.restart?.kind === "fk" || has("setup", e => e.kind === "fk") || has("restart", e => e.kind === "fk"))) bad("오프사이드인데 프리킥 재개 아님", tag);
    if (r.outcome === "win" && (pd.sit.poss || "us") === "them" && S.holder && S.holder.team === "them" && !has("out") && !evs.some(e => ["clear", "steal", "win", "tackle", "header"].includes(e.type) && e.team === "us"))
      bad("수비 성공인데 공이 그대로 상대에게", `${tag} 공:${S.holder.name}`);
    if (r.outcome === "danger" && !shots.some(e => e.team === "them") && !(S.holder && S.holder.team === "them") && !has("goal", e => e.team === "them"))
      bad("위기 허용인데 상대가 공을 못 가짐", `${tag} 공:${S.holder?.name || "없음"}`);
    if (/돌려준다/.test(r.outTpl || "") && r.act !== "outReturn") bad("돌려준다는데 공을 밖으로 안 참", tag);
    const c = pd.list[ci];
    if (c.trust) { trustN++; if (s.relations.coach > coach0 + 0.5) trustUp++; }
    const kx = r.outcome;
    (st.ex[kx] ||= []).length < SHOW && st.ex[kx].push(`  · ${sceneText}\n    ▶ ${LABELS[id]}\n    ${feed.slice(0, 4).join("\n    ")}`);
  }
}

for (const id of ids) {
  const st = stat[id];
  console.log(`\n■ ${id} — 나온 ${st.seen}, 선택지 뜸 ${st.offered} | 성공 확률 ${st.offered ? (st.pMe / st.offered * 100).toFixed(0) : "-"}% (보통 선택지 ${st.nOther ? (st.pOther / st.nOther * 100).toFixed(0) : "-"}%) | 결과 ${JSON.stringify(st.out)} | 연출 ${JSON.stringify(st.act)}`);
  for (const [k, xs] of Object.entries(st.ex)) { console.log(` [${k}]`); for (const x of xs) console.log(x); }
}
console.log(`\n감독 신뢰 오른 비율 (trust 선택 성공 포함 전체): ${trustUp}/${trustN}`);
const ks = Object.keys(issues);
console.log(ks.length ? "\n문제:" : "\n문제 없음");
for (const k of ks) { console.log(`■ ${k}: ${issues[k]}`); for (const x of samples[k]) console.log("   ", x); }
