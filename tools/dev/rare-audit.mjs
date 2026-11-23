// 3년 커리어를 끝까지 돌려서 장면마다 몇 번 나왔는지 (한 번도 / 아주 드물게 나온 장면 찾기)
// node tools/dev/rare-audit.mjs [판수]   SEED=7000  RARE=0.004(이 비율 밑이면 드묾)
import { setSeed, pick } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { runWeek, slotLocked, chooseNumber, numberChoices, actionAllowed } from "../../js/engine/week.js";
import { ACTIONS } from "../../data/actions.js";
import { chooseEvent, findEvent, reqOk } from "../../js/engine/events.js";
import { schoolOptions, chooseSchool, detailOptions, chooseDetail } from "../../js/engine/career.js";
import { DEV } from "../../js/engine/match.js";
import { SITUATIONS } from "../../data/match.js";

const N = +process.argv[2] || 60, SEED = +(process.env.SEED || 7000), RARE = +(process.env.RARE || 0.004);
const KEY = { FW: ["shoot", "dribble", "sprint"], MF: ["pass", "tactics", "conditioning"], DF: ["defend", "weight", "tactics"] };
const cnt = { FW: {}, MF: {}, DF: {} }, tot = { FW: 0, MF: 0, DF: 0 }, games = { FW: 0, MF: 0, DF: 0 }, wx = {};
let pos = "FW";
DEV.onFinish = m => {
  if (!m.onPitch && !m.my?.decisions) return;
  games[pos]++; wx[m.weather || "clear"] = (wx[m.weather || "clear"] || 0) + 1;
  for (const [id, n] of Object.entries(m.seen || {})) { cnt[pos][id] = (cnt[pos][id] || 0) + n; tot[pos] += n; }
};
for (let i = 0; i < N; i++) {
  setSeed(SEED + i);
  pos = ["FW", "MF", "DF"][i % 3];
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: ["rookie", "ace", "jokgu", "club"][i % 4] }));
  while (!s.finished) {
    if (s.pending?.type === "admission") chooseSchool(s, schoolOptions(s).list.find(x => x.ok).id);
    if (s.pending?.type === "national") s.pending = null;
    if (s.pending?.type === "detail") { const o = detailOptions(s).list, g = o[Math.floor(i / 3) % o.length]; chooseDetail(s, g.keys[Math.floor(i / 12) % g.keys.length]); }
    if (s.pending?.type === "number") { let r, t = [10, 7, 9]; do { r = chooseNumber(s, t.shift() ?? pick(numberChoices(s))); } while (!r.ok); }
    const ok = id => ACTIONS.find(a => a.id === id && actionAllowed(s, a).ok);
    for (const k of ["wd1", "wd2", "we"]) if (!slotLocked(s, k)) s.plan[k] = s.player.condition.injury || s.player.condition.fatigue > 65 ? "sleep" : (KEY[pos].find(ok) || "sleep");
    runWeek(s);
    while (s.pendingEvent) { const ev = findEvent(s.pendingEvent.id); const o = ev.choices.map((c, j) => j).filter(j => reqOk(s, ev.choices[j])); chooseEvent(s, o[0]); }
  }
}
console.log("날씨", JSON.stringify(wx));
const all = new Set();
for (const p of ["FW", "MF", "DF"]) {
  const pool = SITUATIONS.filter(x => x.pos.includes(p) && !x.chainOnly), T = tot[p];
  const never = pool.filter(x => !cnt[p][x.id]).map(x => x.id);
  const rare = pool.filter(x => cnt[p][x.id] && cnt[p][x.id] / T < RARE).map(x => `${x.id}(${cnt[p][x.id]})`);
  for (const x of pool) if (!cnt[p][x.id] || cnt[p][x.id] / T < RARE) all.add(x.id);
  console.log(`\n■ ${p}: ${games[p]}경기, 장면 ${T}번 (경기당 ${(T / Math.max(1, games[p])).toFixed(1)}) | 나온 장면 ${pool.length - never.length}/${pool.length}`);
  console.log(`  한 번도: ${never.join(" ") || "없음"}`);
  console.log(`  드묾(${RARE * 100}% 밑): ${rare.join(" ") || "없음"}`);
}
// 어느 포지션에서도 거의 못 보는 장면 (그 장면을 쓸 수 있는 모든 포지션에서 드묾)
const both = [...all].filter(id => SITUATIONS.find(x => x.id === id).pos.every(p => !cnt[p][id] || cnt[p][id] / tot[p] < RARE));
console.log(`\n어느 포지션에서도 드문 장면 ${both.length}개: ${both.join(" ")}`);
// IDS=a,b: 그 장면들이 포지션별로 몇 번 나왔는지
if (process.env.IDS) for (const p of ["FW", "MF", "DF"]) console.log(p, (process.env.IDS === "all" ? Object.keys(cnt[p]).sort() : process.env.IDS.split(",")).map(id => `${id} ${cnt[p][id] || 0}`).join(", "));
