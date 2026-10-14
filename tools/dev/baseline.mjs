// 경기 엔진 기준값 측정: node tools/dev/baseline.mjs [판수]
// 경기 엔진을 바꾼 뒤 이 숫자들이 예전과 비슷한지(±10% 안) 확인하세요.
import { setSeed, pick } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { runWeek, slotLocked, chooseNumber, numberChoices, actionAllowed } from "../../js/engine/week.js";
import { ACTIONS } from "../../data/actions.js";
import { chooseEvent, findEvent, reqOk } from "../../js/engine/events.js";
import { schoolOptions, chooseSchool, decideEnding } from "../../js/engine/career.js";
import { CAL, DEV } from "../../js/engine/match.js";
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
    if (s.pending?.type === "number") { let r, t = [10, 7, 9]; do { r = chooseNumber(s, t.shift() ?? pick(numberChoices(s))); } while (!r.ok); }
    const ok = id => ACTIONS.find(a => a.id === id && actionAllowed(s, a).ok);
    for (const k of ["wd1", "wd2", "we"]) if (!slotLocked(s, k)) s.plan[k] = s.player.condition.injury ? "sleep" : s.player.condition.fatigue > 65 ? "sleep" : pick(KEY[pos].filter(ok)) || "sleep";
    runWeek(s);
    while (s.pendingEvent) { const ev = findEvent(s.pendingEvent.id); const o = ev.choices.map((c, j) => j).filter(j => reqOk(s, ev.choices[j])); chooseEvent(s, o[0]); }
  }
  for (const m of s.record.matches) all.push({ ...m, ...extra.get(m), pos });
  const e = decideEnding(s).ending.grade; ends[e] = (ends[e] || 0) + 1;
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
console.log("엔딩 등급", JSON.stringify(ends));
// 전력 차이별 (우리 − 상대)
const bins = {};
for (const m of all) if (m.ours != null) { const b = Math.max(-10, Math.min(15, Math.round((m.ours - m.theirs) / 5) * 5)); (bins[b] ||= []).push(m); }
if (process.env.BINS) for (const [b, a] of Object.entries(bins).sort((x, y) => x[0] - y[0]))
  console.log(`  D=${b.padStart(3)} n=${String(a.length).padStart(5)} 득점 ${avg(a, m => m.gf).toFixed(2)} 실점 ${avg(a, m => m.ga).toFixed(2)} 승 ${(avg(a, m => m.result === "승") * 100).toFixed(0)}% 무 ${(avg(a, m => m.result === "무") * 100).toFixed(0)}% 슈팅 ${avg(a, m => m.shots?.[0] ?? 0).toFixed(1)}/${avg(a, m => m.shots?.[1] ?? 0).toFixed(1)} 득점분산 ${(avg(a, m => m.gf ** 2) - avg(a, m => m.gf) ** 2).toFixed(2)} 무득점 ${(avg(a, m => m.gf === 0) * 100).toFixed(0)}% 무실점 ${(avg(a, m => m.ga === 0) * 100).toFixed(0)}%`);
