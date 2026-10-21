// 경기 엔진 기준값 측정: node tools/dev/baseline.mjs [판수]
// 경기 엔진을 바꾼 뒤 이 숫자들이 예전과 비슷한지(±10% 안) 확인하세요.
import { setSeed, pick } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { runWeek, slotLocked, chooseNumber, numberChoices, actionAllowed } from "../../js/engine/week.js";
import { ACTIONS } from "../../data/actions.js";
import { chooseEvent, findEvent, reqOk } from "../../js/engine/events.js";
import { schoolOptions, chooseSchool, decideEnding, detailOptions, chooseDetail } from "../../js/engine/career.js";
import { CAL, DEV } from "../../js/engine/match.js";
import { TUNE } from "../../js/engine/growth.js";
if (process.env.GAIN) TUNE.gain = +process.env.GAIN;   // 성장 배율 시험
// 경기 수치 조절값 시험: CAL="brk:0.2,c0:1.5" node tools/dev/baseline.mjs 30
if (process.env.CAL) for (const kv of process.env.CAL.split(",")) { const [k, v] = kv.split(":"); CAL[k] = +v; }

const N = +process.argv[2] || 120;
const KEY = { FW: ["shoot", "dribble", "sprint"], MF: ["pass", "tactics", "conditioning"], DF: ["defend", "weight", "tactics"] };
const all = [], ends = {};
const extra = new WeakMap();
DEV.onFinish = (m, res) => extra.set(res, { ours: m.ours, theirs: m.theirs, shots: [m.stats.us.shots, m.stats.them.shots] });
for (let i = 0; i < N; i++) {
  setSeed(5000 + i);
  const pos = ["FW", "MF", "DF"][i % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: ["early", "steady", "late", "physical", "technical"][i % 5] }));
  while (!s.finished) {
    if (s.pending?.type === "admission") chooseSchool(s, schoolOptions(s).list.find(x => x.ok).id);
    if (s.pending?.type === "national") s.pending = null;
    if (s.pending?.type === "detail" && process.env.POSMOVE) { const d = detailOptions(s), to = d.others[0].pos; chooseDetail(s, detailOptions(s, to).list[0].keys[0]); }   // POSMOVE=1: 면담에서 포지션을 바꾸는 학생
    if (s.pending?.type === "detail") { const o = detailOptions(s).list, g = o[Math.floor(i / 3) % o.length]; chooseDetail(s, g.keys[Math.floor(i / 12) % g.keys.length]); }   // 세부 포지션은 판마다 돌아가며
    if (s.pending?.type === "number") { let r, t = [10, 7, 9]; do { r = chooseNumber(s, t.shift() ?? pick(numberChoices(s))); } while (!r.ok); }
    const ok = id => ACTIONS.find(a => a.id === id && actionAllowed(s, a).ok);
    // PLAN=mix: 실제 학생처럼 포지션 훈련 반, 나머지는 학교·쉬기·관계·다른 훈련을 고루 (기본은 포지션 훈련만)
    const MIX = process.env.PLAN === "mix", anyOk = () => ACTIONS.filter(a => actionAllowed(s, a).ok).map(a => a.id);
    for (const k of ["wd1", "wd2", "we"]) if (!slotLocked(s, k)) s.plan[k] = s.player.condition.injury ? "sleep" : s.player.condition.fatigue > 65 ? "sleep" : (process.env.PLAN === "lazy" ? "sleep" : MIX && Math.random() < +(process.env.MIXP || 0.5) ? pick(anyOk()) : pick(KEY[pos].filter(ok))) || "sleep";
    runWeek(s);
    while (s.pendingEvent) { const ev = findEvent(s.pendingEvent.id); const o = ev.choices.map((c, j) => j).filter(j => reqOk(s, ev.choices[j])); chooseEvent(s, o[0]); }
  }
  for (const m of s.record.matches) all.push({ ...m, ...extra.get(m), pos });
  const de = decideEnding(s), e = de.ending.grade; ends[e] = (ends[e] || 0) + 1;
  (globalThis.__end ||= []).push({ id: de.ending.id, ovr: de.c.ovr, tier: de.c.tier, captain: de.c.captain, nt: de.c.nationalTeam, pos });
}
const avg = (arr, f) => arr.length ? arr.reduce((a, x) => a + f(x), 0) / arr.length : 0;
const played = all.filter(m => m.minutes > 0);
console.log(`판 ${N}, 경기 ${all.length}, 내가 뛴 경기 ${played.length}`);
console.log(`경기당 내 순간 ${avg(played, m => m.decisions || 0).toFixed(2)} (선발 ${avg(played.filter(m => m.status === "start"), m => m.decisions || 0).toFixed(2)})`);
console.log(`경기당 득점 ${avg(all, m => m.gf).toFixed(2)} 실점 ${avg(all, m => m.ga).toFixed(2)} | 승 ${(avg(all, m => m.result === "승") * 100).toFixed(0)}% 무 ${(avg(all, m => m.result === "무") * 100).toFixed(0)}% 패 ${(avg(all, m => m.result === "패") * 100).toFixed(0)}%`);
for (const p of ["FW", "MF", "DF"]) {
  const x = played.filter(m => m.pos === p);
  console.log(`${p}: 평점 ${avg(x, m => m.rating).toFixed(2)} | 경기당 내 골 ${avg(x, m => m.goals).toFixed(2)} 도움 ${avg(x, m => m.assists).toFixed(2)} | 최우수 ${(avg(x, m => !!m.mom) * 100).toFixed(1)}%`);
}
{ const by = {};                                          // 세부 포지션별 (정해진 뒤 경기만)
  for (const m of played) if (m.detail) (by[m.detail] ||= []).push(m);
  console.log("세부 포지션: " + Object.entries(by).map(([k, x]) => `${k} ${x.length}경기 평점 ${avg(x, m => m.rating).toFixed(2)} 골 ${avg(x, m => m.goals).toFixed(2)} 도움 ${avg(x, m => m.assists).toFixed(2)} 순간 ${avg(x, m => m.decisions || 0).toFixed(1)}`).join("\n  "));
}
console.log("엔딩 등급", JSON.stringify(ends));
{ const E = globalThis.__end || [], cnt = f => { const o = {}; for (const x of E) { const k = f(x); o[k] = (o[k] || 0) + 1; } return JSON.stringify(o); };
  console.log("엔딩", cnt(x => x.id)); console.log("진학", cnt(x => x.tier), "주장", E.filter(x => x.captain).length, "국가대표", E.filter(x => x.nt).length);
  { const o = E.map(x => x.ovr).sort((a, b) => a - b), q = f => o[Math.floor(f * (o.length - 1))]; console.log("최종 능력치 분포 10/25/50/75/90%", [0.1, 0.25, 0.5, 0.75, 0.9].map(q).join(" ")); }
  console.log("최종 능력치 평균", avg(E, x => x.ovr).toFixed(1), "포지션별", ["FW", "MF", "DF"].map(p => p + " " + avg(E.filter(x => x.pos === p), x => x.ovr).toFixed(1)).join(" ")); }
// 전력 차이별 (우리 − 상대)
const bins = {};
for (const m of all) if (m.ours != null) { const b = Math.max(-10, Math.min(15, Math.round((m.ours - m.theirs) / 5) * 5)); (bins[b] ||= []).push(m); }
if (process.env.BINS) for (const [b, a] of Object.entries(bins).sort((x, y) => x[0] - y[0]))
  console.log(`  D=${b.padStart(3)} n=${String(a.length).padStart(5)} 득점 ${avg(a, m => m.gf).toFixed(2)} 실점 ${avg(a, m => m.ga).toFixed(2)} 승 ${(avg(a, m => m.result === "승") * 100).toFixed(0)}% 무 ${(avg(a, m => m.result === "무") * 100).toFixed(0)}% 슈팅 ${avg(a, m => m.shots?.[0] ?? 0).toFixed(1)}/${avg(a, m => m.shots?.[1] ?? 0).toFixed(1)} 득점분산 ${(avg(a, m => m.gf ** 2) - avg(a, m => m.gf) ** 2).toFixed(2)} 무득점 ${(avg(a, m => m.gf === 0) * 100).toFixed(0)}% 무실점 ${(avg(a, m => m.ga === 0) * 100).toFixed(0)}%`);
