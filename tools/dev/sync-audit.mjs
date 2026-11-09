// 해설·움직임 일치 점검: 문장이 말한 동작의 종류·방향·받는 사람이 실제 공 움직임과 같은지 (화면 없이).
// node tools/dev/sync-audit.mjs [경기 수] [FW|MF|DF|all]    SHOW=4 (종류별 예시 수), SEED=30000, ONLY=gk,switch (종류만), PICK=auto|random(기본)
// 방법: 0.1초마다 공·보유자를 기록해 '공의 이동(leg: 누가 어디서 → 누가 어디로)'과 '몰고 간 구간(carry)'을 만들고,
//       해설 줄(흐름·결과)과 내가 고른 선택지 글자를 그 시각 앞뒤의 leg·carry와 맞대 봄. 조건을 만족하는 이동이 하나라도 있으면 일치.
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";

const N = +process.argv[2] || 60, which = process.argv[3] || "all", SHOW = +(process.env.SHOW || 4), SEED = +(process.env.SEED || 30000);
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null, PICK = process.env.PICK || "random";
const stat = {}, add = (id, ok, msg) => { const s = stat[id] ||= { n: 0, bad: 0, ex: [] }; s.n++; if (!ok) { s.bad++; if (s.ex.length < SHOW) s.ex.push(msg); } };
const side = y => Math.abs(y - 34);                                // 가운데에서 옆으로 몇 m (터치라인 = 34)
// 판정 규칙. re: 문장, not: 이 말이 있으면 건너뜀, win: [앞, 뒤] 초, test(ctx) → [일치?, 잰 값 설명]
// leg 필드: dx 앞으로(그 팀 공격 방향 +), dy 옆 이동 절대값, d 거리, air, from/to(선수), x0,y0,x1,y1(그 팀 기준 x: 0 자기 골 ~ 105 상대 골), lineX(패스 순간 상대 최종 수비 x), turnover, shot, out
const fm = v => v.toFixed(0);
const legStr = l => l ? `앞 ${fm(l.dx)}m·옆 ${fm(l.dy)}m${l.air ? "·띄움" : ""} ${l.from.role}→${l.to ? l.to.role + (l.turnover ? "(상대)" : "") : l.out ? "라인 밖" : "?"}` : "이동 없음";
const best = (legs, score) => legs.length ? legs.reduce((a, b) => score(b) > score(a) ? b : a) : null;
const any = (legs, f, score = l => l.d) => { const hit = legs.find(f); return [!!hit, legStr(hit || best(legs, score))]; };
const RULES = [
  { id: "gk", name: "골키퍼에게", re: /골키퍼(에게|까지|한테)\s*(다시 |백패스|돌|내|넘|주|굴|공을 돌)|골키퍼에게 백패스|키퍼에게 (돌|내)/, not: /손짓|끌어낸 뒤|제친/, win: [3, 6],
    test: c => any(c.legsAny, l => l.to && !l.turnover && l.to.pos === "GK"),
    failTest: c => any(c.legsAny, l => l.team === "us" && l.dx <= -4, l => -l.dx) },   // 실패: 뒤로 준 공이 보였는지
  { id: "switch", name: "반대편 전환", re: /반대편|반대쪽|방향 전환|전환 패스|크게 전환|대각선으로 (길게|크게)/, not: /반대편(이|은|에는|에서|도) |반대편 (포스트|골대|구석|사이드라인에 서)|전환(이|을|은) (늦|빠르|느)|공수 전환|역습 전환|텅 비|비어|노리|보인다|손짓|외친|가리킨/, win: [5, 6],
    test: c => any(c.legs, l => l.dy >= 20 && (l.y0 - 34) * (l.y1 - 34) < 0 && l.dy >= l.dx * 0.7, l => l.dy),
    failTest: c => any(c.legsAny, l => l.team === "us" && l.dy >= 12 && l.dy >= l.dx * 0.5 && (l.air || l.dy >= 18), l => l.dy) },   // 실패: 옆으로 크게 보낸 공이 끊기거나 나감
  { id: "wide", name: "측면으로 벌림", re: /측면으로 (공을 )?(벌|넓게|열어|내준|내줬|빼|돌)|넓게 벌|좌우로 벌/, not: /손짓|외친|벌려 서|벌려 선/, win: [4, 5],
    test: c => any(c.legs, l => l.dy >= 9 && side(l.y1) >= 13 && l.dy >= l.dx * 0.7, l => l.dy) },
  { id: "through", name: "스루패스·뒷공간", re: /스루패스|스루 패스|뒷공간(으로|에|을 향|을 노린 (패스|공))|수비 뒤(로|쪽으로) (찔|넣|보|떨|넘)|침투 패스|찔러 (준|줬|넣)/, not: /막|차단|읽|노리는 눈|손짓/, win: [4, 5],
    test: c => any(c.legs, l => l.dx >= 8 && l.x1 >= l.lineX - 6, l => l.dx) },
  { id: "cross", name: "크로스", re: /크로스(를|가|!|\.| 올| 한)/, not: /크로스를 (막|차단|기다|노리|준비|올리려|못)|크로스가 (올라오면|올라올|막)|손짓|크로스를 올리기 전|크로스 길/, win: [4, 4],
    test: c => any(c.legsAny, l => side(l.y0) >= 13 && l.x0 >= 62 && l.x1 >= 82 && side(l.y1) <= 22, l => l.x0) },
  { id: "cutback", name: "컷백", re: /컷백/, not: /컷백 (길|자리|을 막|을 기다|을 노)|컷백을 (막|기다|노|읽)|컷백이 (올|막)|손짓/, win: [4, 4],
    test: c => any(c.legsAny, l => l.x0 >= 84 && side(l.y0) >= 7 && l.dx <= 3 && side(l.y1) < side(l.y0), l => l.x0) },
  { id: "long", name: "길게·롱볼", re: /길게 (차|찬|넘|올|내|때|뿌|연결|찔)|롱볼|롱패스|롱 패스|긴 패스/, not: /길게 (끌|잡|가져|걸)|손짓|노리|막/, win: [4, 5],
    test: c => any(c.legsAny, l => l.d >= 24) },
  { id: "back", name: "백패스·뒤로 돌림", re: /백패스|뒤로 (돌|내|빼|물)|다시 뒤로/, not: /골키퍼|백패스를 (노|끊|가로|읽|기다)|백패스가 (짧|약|느)|손짓|뒤로 물러|뒤로 빠지|뒤로 돌아/, win: [3, 5],
    test: c => any(c.legsAny, l => l.dx <= -3 && !l.turnover, l => -l.dx) },
  { id: "press", name: "압박", re: /압박(한다|했다|을 건다|을 걸었다|에 들어|이 들어온다|이 거세|이 강|해 온다|해 들어|하며|해서)|달라붙|에워싼|둘러싼/, not: /압박을 (풀|벗|피|끌|넘|따돌)|압박(이 느슨|이 없|하라|해라|하자|이 풀)|손짓|외친|소리친/, win: [3, 3],
    test: c => { const v = c.minPress; return [v.n8 >= 2 || v.d1 <= 4, `8m 안 ${v.n8}명·가장 가까운 선수 ${v.d1.toFixed(0)}m`]; } },
  { id: "counter", name: "역습", re: /역습(이다|!|으로 (나|이|전)|에 나|을 (전개|시작|편)|,)|빠른 역습|역습 기회/, not: /역습을 (막|끊|차단|지연|조심|대비|노리는 팀)|역습에 (대비|당|약)|역습 (길|위험)/, win: [9, 6],
    test: c => [c.possAge <= 10 && c.adv5 >= 15, `공 주인 바뀐 지 ${fm(c.possAge)}초·5초 전진 ${fm(c.adv5)}m`] },
  { id: "steal", name: "태클·끊음·가로챔", re: /태클(이 (정확|깨끗|들어갔)|로 (공을|끊|뺏)|!| 성공)|가로챘|가로챈다|끊어 냈|끊어 낸다|끊어냈|빼앗았|뺏어 냈|뺏어 낸다|인터셉트(!|\.| 성공)/, not: /못|실패|늦었|빗나|당했|하려|노린|시도했지만/, win: [3.5, 2.5],
    test: c => [c.changes > 0, `공 주인 바뀜 ${c.changes}번`] },
  { id: "clear", name: "걷어 냄", re: /걷어 (냈|낸다|낸 공)|걷어냈|걷어낸다/, not: /못|걷어 내려|걷어 내지|걷어 낸 공이 (짧|약)/, win: [3.5, 3],
    test: c => any(c.legsAny, l => l.x0 <= 50 && (l.d >= 12 || l.out || l.turnover)) },
  { id: "head", name: "헤더", re: /헤더|헤딩|머리로|머리에 맞|머리를 갖다/, not: /머리 위로|머리를 (넘|감싸|쥐|숙)|헤딩 경합에서 (졌|밀)|못|헤더를 (막|준비)|손짓/, win: [3.5, 2.5],
    test: c => [c.maxZ >= 1.2, `공 높이 최고 ${c.maxZ.toFixed(1)}m`] },
  { id: "longshot", name: "중거리 슛", re: /중거리 (슛|슈팅)|먼 거리(에서)? (슛|슈팅)|멀리서 (때|찬|슛)/, not: /노리|조심|막아라|손짓|줄 건가|올까/, win: [4, 3],
    test: c => { const s = best(c.shots, l => l.gd); return [!!s && s.gd >= 17, s ? `골문에서 ${fm(s.gd)}m` : "슛 없음"]; } },
  { id: "inbox", name: "박스 안·문전 슛", re: /(박스 안|문전|골문 앞)에서 (슛|슈팅|때|찬|마무리|밀어|발을)/, not: /노리|조심|손짓/, win: [4, 3],
    test: c => { const s = best(c.shots, l => -l.gd); return [!!s && s.gd <= 19, s ? `골문에서 ${fm(s.gd)}m` : "슛 없음"]; } },
  { id: "dribble", name: "드리블·돌파", re: /제쳤|제친다|제치고|돌파(했|한다|에 성공|!)|드리블로 (전진|밀|치|파)|치고 (나간|나갔|달|올라)|몰고 (나간|나갔|올라|들어|전진)/, not: /못|막혔|걸렸|뺏겼|하려|골키퍼까지 제친다/, win: [4, 4],
    test: c => { const k = best(c.carries, x => x.adv); return [!!k && (k.adv >= 6 || k.len >= 9), k ? `몰고 간 거리 ${fm(k.len)}m(앞 ${fm(k.adv)}m)` : "몰고 간 구간 없음"]; },
    failTest: c => { const k = best(c.carries, x => x.len); return [!!k && k.len >= 3.5, k ? `몰고 간 거리 ${fm(k.len)}m` : "몰고 간 구간 없음"]; } },
  { id: "cb", name: "센터백에게", re: /센터백(에게| .{1,6}에게)/, not: /손짓|상대 센터백에게 (걸|막|붙)|묶|붙/, win: [3, 5],
    test: c => any(c.legsAny, l => l.to && !l.turnover && /CB/.test(l.to.role)),
    failTest: c => any(c.legsAny, l => l.team === "us" && l.dy >= 4 && l.dx <= 6, l => l.dy) },
  { id: "fb", name: "측면 수비에게", re: /(측면 수비|풀백)(에게| .{1,6}에게)/, not: /손짓|걸|막혔|묶/, win: [3, 5],
    test: c => any(c.legsAny, l => l.to && !l.turnover && /^(LB|RB)$/.test(l.to.role)) },
];
const SKIP_K = /coach|talk|amb|pre|ht|sys|sub|whistle/;
let games = 0, lineN = 0, pickN = 0;

for (let k = 0; k < N; k++) {
  setSeed(SEED + k);
  const pos = which === "all" ? ["FW", "MF", "DF"][k % 3] : which;
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "steady" }));
  const lv = 45 + (k % 5) * 8;
  for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
  s.relations.coach = 95;
  let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
  if (!ctx.fx) continue;
  const m = prepareMatch(s, ctx.info, ctx.fx); m.record = true; games++;
  const S = m.sim, P = S.P, T = [];                    // T: 틱 기록
  let curFl = null, flId = 0;
  S.onTick = S2 => {
    const b = S2.ball, H = S2.holder;
    if (b.fl && b.fl !== curFl) { curFl = b.fl; flId++; } else if (!b.fl) curFl = null;
    T.push({ t: S2.t, x: b.x, y: b.y, z: b.z || 0, h: H ? P.indexOf(H) : -1, fl: b.fl ? flId : 0, air: !!(b.fl && b.fl.air), shot: !!S2.shot, last: S2.last ? P.indexOf(S2.last) : -1, play: S2.phase === "play",
      plan: b.fl ? [b.fl.x0, b.fl.y0, b.fl.x1, b.fl.y1] : null, px: P.map(p => p.x), py: P.map(p => p.y) });
  };
  const L = [], picks = [];
  let guard = 0;
  while (!m.done && guard++ < 4000) {
    if (m.pending) {
      const ch = m.pending.choices || m.pending.sit?.choices || [];
      const ci = PICK === "auto" ? autoChoice(m) : Math.floor(rand() * Math.max(1, ch.length));
      const lab = ch[ci]?.label || ch[ci]?.t || "";
      const t0 = S.t, r = resolve(s, m, ci);
      picks.push({ t: lab, ts: t0, minute: m.minute, k: "pick", res: r.lines.map(x => x.t).filter(Boolean).join(" / ").slice(0, 70) });
      L.push(...r.lines); continue;
    }
    const r = next(s, m); L.push(...r.lines);
  }
  finishMatch(s, m);
  // ── 공의 이동(leg)·몰고 간 구간(carry)·공 주인 바뀜 ──
  const teamOf = i => P[i].team, fx = (team, x) => team === "us" ? x : 105 - x;
  const legs = [], carries = [], changes = [];
  const lineX = (team, i) => { const opp = team === "us" ? "them" : "us"; let mx = 0; P.forEach((p, pi) => { if (p.team === opp && p.pos !== "GK") mx = Math.max(mx, 105 - fx(opp, T[i].px[pi])); }); return mx; };   // 상대 최종 수비(골키퍼 제외) x, 공격 팀 기준
  // 공의 주인: 보유자, 없으면 굴러가지 않는 공에서 2.2m 안 가장 가까운 선수 (대본 장면에서는 보유자 없이 공이 선수를 따라감)
  const own = T.map(f => { if (f.h >= 0) return f.h; if (f.fl || !f.play) return -1; let bi = -1, bd = 2.2; for (let pi = 0; pi < P.length; pi++) { const d = Math.hypot(f.px[pi] - f.x, f.py[pi] - f.y); if (d < bd) { bd = d; bi = pi; } } return bi; });
  // 비행(leg): 같은 fl 번호가 이어지는 구간
  for (let i = 0; i < T.length; i++) {
    const id = T[i].fl; if (!id || (i && T[i - 1].fl === id)) continue;
    let j = i; while (j + 1 < T.length && T[j + 1].fl === id) j++;
    const fromI = T[i].last >= 0 ? T[i].last : (i ? own[i - 1] : -1); if (fromI < 0) continue;
    const from = P[fromI], tm = from.team, pl = T[i].plan, e = T[j];
    let to = null, out = false, z = 0, air = false, shot = false;
    for (let q = i; q <= j; q++) { z = Math.max(z, T[q].z); air ||= T[q].air; shot ||= T[q].shot; }
    for (let q = j + 1; q < T.length && T[q].t <= e.t + 1.5; q++) { if (T[q].fl && T[q].fl !== id) break; if (own[q] >= 0) { to = P[own[q]]; break; } if (!T[q].play) { out = true; break; } }
    const x0 = fx(tm, pl[0]), x1 = fx(tm, e.x);
    legs.push({ t0: T[i].t, t1: e.t, from, to, out: out && !to, team: tm, turnover: !!to && to.team !== tm, x0, y0: pl[1], x1, y1: e.y, dx: x1 - x0, dy: Math.abs(e.y - pl[1]), d: Math.hypot(pl[2] - pl[0], pl[3] - pl[1]), air, shot, maxZ: z, lineX: lineX(tm, i), gd: Math.hypot(105 - x0, pl[1] - 34) });
  }
  // 몰고 간 구간(carry)과 공 주인이 다른 팀으로 바뀐 시각
  { let st = -1, lastOwn = -1;
    const close = i => { if (st >= 0) { const o = own[st], tm = teamOf(o); let len = 0; for (let q = st + 1; q <= i; q++) len += Math.hypot(T[q].x - T[q - 1].x, T[q].y - T[q - 1].y); carries.push({ t0: T[st].t, t1: T[i].t, by: P[o], team: tm, adv: fx(tm, T[i].x) - fx(tm, T[st].x), len }); st = -1; } };
    for (let i = 0; i < T.length; i++) {
      const o = own[i];
      if (o >= 0) { if (lastOwn >= 0 && teamOf(o) !== teamOf(lastOwn)) changes.push(T[i].t); if (st < 0 || own[st] !== o) { close(i - 1); st = i; } lastOwn = o; }
      else if (st >= 0 && (T[i].fl || !T[i].play)) close(i - 1);
      if (!T[i].play && T[i].fl === 0) lastOwn = -1;
    }
    close(T.length - 1); }
  const at = t => { let lo = 0, hi = T.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (T[mid].t < t) lo = mid + 1; else hi = mid; } return lo; };
  const judge = (l, src) => {
    for (const R of RULES) {
      if (ONLY && !ONLY.has(R.id)) continue;
      if (!R.re.test(l.t) || (R.not && R.not.test(l.t))) continue;
      const them = src === "line" && /^(them|goal-them)/.test(l.k), team = them ? "them" : "us";
      const [w0, w1] = src === "pick" ? [0.5, R.win[1] + 4] : R.win, a = l.ts - w0, b = l.ts + w1;
      const inWin = legs.filter(g => g.t0 >= a - 0.05 && g.t0 <= b);
      const c = { legsAny: inWin, legs: inWin.filter(g => g.team === team), shots: inWin.filter(g => g.shot), carries: carries.filter(x => x.t1 >= a && x.t0 <= b), changes: changes.filter(t => t >= a && t <= b).length, maxZ: 0, minPress: { n8: 0, d1: 99 }, possAge: 99, adv5: 0 };
      if (/상대|{opp}/.test(l.t) || src === "pick") c.legs = inWin;                 // 문장이 상대 동작을 말할 수 있음 → 어느 팀이든 조건에 맞는 이동이 있으면 일치
      const i0 = at(a), i1 = at(b);
      for (let i = i0; i <= i1; i++) {
        const f = T[i]; c.maxZ = Math.max(c.maxZ, f.z);
        if (f.h >= 0 && f.play) { const ht = teamOf(f.h); let n8 = 0, d1 = 99; P.forEach((p, pi) => { if (p.team !== ht) { const d = Math.hypot(f.px[pi] - f.x, f.py[pi] - f.y); if (d <= 8) n8++; d1 = Math.min(d1, d); } });
          if (n8 > c.minPress.n8 || (n8 === c.minPress.n8 && d1 < c.minPress.d1)) c.minPress = { n8, d1 }; }
      }
      const ic = at(l.ts); let lastCh = -99; for (const t of changes) if (t <= l.ts + 2) lastCh = t;
      c.possAge = l.ts - lastCh;
      { const j0 = at(Math.max(lastCh, l.ts - 4)), j1 = at(Math.max(lastCh, l.ts - 4) + 5); const hh = T[Math.min(T.length - 1, at(l.ts))].h; const tm = hh >= 0 ? teamOf(hh) : team; c.adv5 = Math.abs(T[j1].x - T[j0].x) * 1; }
      const [ok, why] = (src === "pick" && l.fail && R.failTest ? R.failTest : R.test)(c);
      add(R.id + (src === "pick" ? (l.fail ? ":선택지(실패 결과)" : ":선택지") : ""), ok, `[${pos} #${SEED + k} ${l.minute}' ${l.k}] "${l.t.slice(0, 58)}" → ${why}${src === "pick" && l.res ? `  (결과: ${l.res})` : ""}`);
    }
  };
  for (const l of L) { if (l.silent || !l.t || l.ts == null || l.amb || SKIP_K.test(l.k || "") || l.k === "moment" || l.k === "me" || l.t.startsWith("▶")) continue;   /* moment·me = 내 장면의 상황 설명(deep-audit이 봄) */ lineN++; judge(l, "line"); }
  for (const p of picks) { if (!p.t) continue; pickN++;
    const after = L.filter(l => l.ts != null && l.ts >= p.ts && l.ts <= p.ts + 6 && /^me-(bad|good|auto)/.test(l.k || ""));
    p.fail = after.some(l => l.k === "me-bad"); p.res = after.map(l => l.t).join(" / ").slice(0, 60);
    judge(p, "pick");
    if (process.env.DBG && p.t.includes(process.env.DBG)) { console.log("DBG", pos, SEED + k, p.minute, p.t, "ts", p.ts.toFixed(1)); for (const c of carries) if (c.t1 >= p.ts - 1 && c.t0 <= p.ts + 14) console.log("  carry", c.t0.toFixed(1), c.t1.toFixed(1), c.by.role, c.team, "adv", c.adv.toFixed(0), "len", c.len.toFixed(0)); for (const g of legs) if (g.t0 >= p.ts - 1 && g.t0 <= p.ts + 14) console.log("  leg", g.t0.toFixed(1), g.t1.toFixed(1), legStr(g), g.shot ? "슛" : ""); for (const l of L) if (l.ts >= p.ts - 1 && l.ts <= p.ts + 14) console.log("  line", l.ts.toFixed(1), l.k, l.t.slice(0, 50)); } }
}
console.log(`\n해설·움직임 일치 점검: ${games}경기, 해설 ${lineN}줄, 고른 선택지 ${pickN}개 (PICK=${PICK}, SEED=${SEED})\n`);
let totN = 0, totBad = 0;
for (const src of ["", ":선택지", ":선택지(실패 결과)"]) {
  console.log(src === "" ? "── 해설 문장 vs 움직임 ──" : src === ":선택지" ? "── 내가 고른 선택지 글자 vs 그 뒤 움직임 (성공·보통 결과) ──" : "── 고른 선택이 실패했을 때: 시도한 동작이 보였는지 ──");
  for (const R of RULES) { const s = stat[R.id + src]; if (!s) continue; totN += s.n; totBad += s.bad;
    console.log(`${(R.name + "          ").slice(0, 11)} ${String(s.n).padStart(5)}개  불일치 ${String(s.bad).padStart(4)} (${(s.bad / s.n * 100).toFixed(1)}%)`); for (const e of s.ex) console.log("    " + e); }
  console.log("");
}
console.log(`합계 ${totN}개 중 불일치 ${totBad} (${(totBad / Math.max(1, totN) * 100).toFixed(1)}%)`);
