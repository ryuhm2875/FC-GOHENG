// 세부 포지션 점검: 자리마다 경기를 돌려 (1) 경기장에서 실제로 그 자리에 서는지 (2) 세부 포지션 장면이 나오는지
// (3) 장면 문장·결과 문장이 경기장과 맞는지 (왼쪽·오른쪽, 오버래핑, 등지고 받기, 수비 라인 앞) 확인
// node tools/dev/detail-audit.mjs [자리마다 경기 수] [자리 이름들]   SHOW=예시 수
const R = new URL("../../", import.meta.url).href;
const { setSeed } = await import(R + "js/rng.js");
const { rollPlayer, newGame } = await import(R + "js/state.js");
const { beginWeek, endWeek } = await import(R + "js/engine/week.js");
const { prepareMatch, next, resolve } = await import(R + "js/engine/match.js");
const { DETAIL_POS } = await import(R + "data/player.js");

const N = +process.argv[2] || 24, SHOW = +(process.env.SHOW || 4);
const KEYS = process.argv[3] ? process.argv[3].split(",") : Object.keys(DETAIL_POS);
const issues = {}, samples = {};
const bad = (kind, msg) => { issues[kind] = (issues[kind] || 0) + 1; (samples[kind] ||= []).length < SHOW && samples[kind].push(msg); };
let __r = 99; const prand = () => ((__r = (__r * 1103515245 + 12345) % 2147483648) / 2147483648);
const NEW = { wing_isolation: "winger", wing_far_post: "winger", fb_overlap: "fb", dm_screen: "dm", target_hold: "target" };
const table = [];
for (const key of KEYS) {
  const d = DETAIL_POS[key], pos = d.pos;
  let goals = 0, sx = 0, sy = 0, sn = 0, ax = 0, an = 0, dx = 0, dn = 0, games = 0, moments = 0;
  const seen = {}, out = {};
  for (let k = 0; k < N; k++) {
    const seed = 81000 + k * 7 + KEYS.indexOf(key) * 1000;
    setSeed(seed); __r = seed;
    const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: k % 2 ? "L" : "R", growthType: "steady" }));
    s.player.detailPos = key;
    const lv = 50 + (k % 4) * 7;
    for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
    s.relations.coach = 95;
    let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
    if (!ctx.fx) continue;
    const m = prepareMatch(s, ctx.info, ctx.fx);
    if (m.status !== "start") continue;
    games++;
    const S = m.sim;
    let g = 0;
    const tag = `[${key} 시드${seed}]`;
    while (!m.done && g++ < 6000) {
      const M = S.P.find(p => p.me);
      if (M && S.phase === "play") { sx += M.x; sy += M.y; sn++; if (S.poss === "us") { ax += M.x; an++; } else { dx += M.x; dn++; } }
      if (m.pending) {
        moments++;
        const pd = m.pending, id = pd.sit.id, H = S.holder;
        seen[id] = (seen[id] || 0) + 1;
        const txt = pd.text;
        // 문장이 말하는 쪽 ↔ 실제 쪽 (장면 문장)
        const side = /왼쪽/.test(txt) ? "L" : /오른쪽/.test(txt) ? "R" : null;
        if (side && !/(감독|코치)/.test(txt)) {
          const y = NEW[id] === "fb" ? H?.y : NEW[id] === "winger" ? M?.y : S.ball.y;
          if (y == null || (y < 34) !== (side === "L")) bad("문장의 왼쪽·오른쪽이 경기장과 다름", `${tag} ${m.minute}' ${id} y=${y?.toFixed(1)}: ${txt.slice(0, 50)}`);
        }
        if (NEW[id]) {
          if (NEW[id] !== (d.group || key)) bad("다른 자리 장면이 나옴", `${tag} ${id}`);
          if (id === "wing_far_post" && !(H && H.team === "us" && !H.me && (H.y < 34) !== (M.y < 34) && H.x > 82)) bad("먼 쪽 포스트 장면인데 반대편 측면 깊은 곳에 동료 공이 아님", `${tag} ${m.minute}'`);
          if (d.side && ((NEW[id] === "fb" ? H?.y : M.y) < 34) !== (d.side === "L")) bad("세부 포지션 쪽과 장면 쪽이 다름", `${tag} ${m.minute}' ${id} 나 y=${M.y.toFixed(1)}`);
          if (id === "fb_overlap" && !(H && H.team === "us" && H.pos === "MF" && !H.me && Math.abs(H.y - 34) > 14.9)) bad("오버래핑인데 측면 미드필더가 공을 갖고 있지 않음", `${tag} ${m.minute}' 공 ${H ? H.team + " " + H.pos : "없음"}`);
          if (id === "dm_screen" && !(H && H.team === "them" && S.ball.x < 44 && Math.hypot(H.x - M.x, H.y - M.y) < 14)) bad("수비 라인 앞 장면인데 상대가 우리 진영 앞에서 공을 갖지 않음", `${tag} ${m.minute}' 공(${S.ball.x.toFixed(0)},${S.ball.y.toFixed(0)}) 거리 ${H ? Math.hypot(H.x - M.x, H.y - M.y).toFixed(1) : "-"}`);
          if (id === "target_hold") { const airRecv = S.ev.filter(e => e.t > S.t - 4 && e.type === "recv" && e.me && e.air).length; if (!airRecv) bad("등지고 받은 긴 공 장면인데 공중으로 받은 게 아님", `${tag} ${m.minute}' ${pd.ctx?.cat}${pd.ctx?.longIn ? " longIn" : ""} ` + S.ev.filter(e => e.t > S.t - 7).map(e => e.type + (e.me ? "*" : "") + (e.kind ? ":" + e.kind : "") + (e.air ? "^" : "")).join(" ")); }
        }
        // 무작위로 골라 모든 선택지를 봄. 결과 대본이 끝날 때까지 지켜봄
        const ci = Math.floor(prand() * pd.list.length);
        const ev0 = S.ev.length;
        const r = resolve(s, m, ci);
        let g2 = 0; while ((S.script.length || S.scur) && !m.done && !m.pending && g2++ < 30) next(s, m);
        if (NEW[id]) {
          const ev = S.ev.slice(ev0), lab = pd.list[ci].label, o = `${id}:${r.outcome}`;
          out[o] = (out[o] || 0) + 1;
          const meRecv = ev.some(e => e.type === "recv" && e.me) || ev.some(e => e.type === "pass" && e.toMe);
          const meShot = ev.some(e => e.type === "shot" && e.me), mateShot = ev.some(e => e.type === "shot" && e.team === "us" && !e.me);
          const cross = ev.some(e => e.type === "pass" && e.me && e.kind === "cross");
          if (id === "fb_overlap" && ["assist"].includes(r.outcome) && !(meRecv && ev.some(e => e.type === "pass" && e.me))) bad("오버래핑 크로스·컷백: 내가 받아서 올리지 않음", `${tag} ${lab} → ${r.outText}`);
          if (id === "fb_overlap" && r.outcome === "decoy" && !mateShot) bad("오버래핑 미끼: 동료가 슈팅하지 않음", `${tag} ${r.outText}`);
          if (["shot"].includes(r.outcome) && !meShot) bad("내 슈팅 결과인데 내가 슈팅하지 않음", `${tag} ${id} ${lab}`);
          if (["assist", "keyPass", "killPass"].includes(r.outcome) && !mateShot) bad("도움·결정적 패스인데 동료 슈팅이 없음", `${tag} ${id} ${lab} → ${r.outText}`);
          if (/크로스/.test(lab) && r.ok && !cross) bad("크로스라는데 크로스가 아님", `${tag} ${id} ${lab}`);
          if (id === "wing_isolation" && /안으로/.test(lab) && r.ok) { const sh = ev.find(e => e.type === "shot" && e.me); if (sh && Math.abs(S.P.find(p => p.me).y - 34) > Math.abs(M.y - 34) + 1) bad("안으로 접는다는데 바깥으로 감", `${tag}`); }
        }
        continue;
      }
      next(s, m);
    }
    goals += m.my.goals;
  }
  const mx = sx / Math.max(1, sn), my = sy / Math.max(1, sn);
  if (d.side === "L" && my > 30) bad("왼쪽 자리인데 평균 y가 가운데·오른쪽", `${key} 평균 y ${my.toFixed(1)}`);
  if (d.side === "R" && my < 38) bad("오른쪽 자리인데 평균 y가 가운데·왼쪽", `${key} 평균 y ${my.toFixed(1)}`);
  const own = Object.keys(NEW).filter(x => NEW[x] === (d.group || key));
  for (const x of own) if (!seen[x]) bad("세부 포지션 장면이 한 번도 안 나옴", `${key} ${x} (${games}경기)`);
  table.push(`${key.padEnd(9)} 경기 ${String(games).padStart(3)} 골 ${(goals / Math.max(1, games)).toFixed(2)} 순간 ${(moments / Math.max(1, games)).toFixed(1)} 평균 자리 (${mx.toFixed(1)}, ${my.toFixed(1)}) 공격 x ${(ax / Math.max(1, an)).toFixed(1)} 수비 x ${(dx / Math.max(1, dn)).toFixed(1)} | ${own.map(x => `${x} ${seen[x] || 0}`).join(" ")} ${Object.entries(out).map(([a, b]) => `${a.split(":")[1]}${b}`).join(" ")}`);
}
console.log(table.join("\n"));
const ks = Object.keys(issues);
console.log(ks.length ? "\n문제:" : "\n문제 없음");
for (const k of ks) { console.log(`- ${k}: ${issues[k]}`); for (const x of samples[k]) console.log("    " + x); }
