// 엔딩 분포 점검: node tools/dev/ending-audit.mjs [판수] [시작 시드] [진학 방식 best|mixed]
// 판마다 플레이 방식(골고루·훈련만·쉬면서·영리하게·축구만·공부도 챙김)을 돌려 가며 3년을 자동으로 치르고,
// 실제로 나온 엔딩, 조건이 맞았던 엔딩, 주장 선거 점수를 모아 /tmp/ending-audit-<시드>.json 으로 남깁니다.
import { setSeed, pick, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { runWeek, slotLocked, chooseNumber, numberChoices, actionAllowed } from "../../js/engine/week.js";
import { ACTIONS } from "../../data/actions.js";
import { chooseEvent, findEvent, reqOk } from "../../js/engine/events.js";
import { schoolOptions, chooseSchool, decideEnding, summarize } from "../../js/engine/career.js";
import { ENDINGS } from "../../data/endings.js";
import { GROWTH_TYPES } from "../../data/player.js";
import { writeFileSync } from "fs";

const N = +process.argv[2] || 50, SEED = +process.argv[3] || 7000, SCHOOL = process.argv[4] || "mixed";
const POLICIES = ["balanced", "grind", "rest40", "smart", "football", "student"];
const types = Object.keys(GROWTH_TYPES);
const ORDER = ["proYouth", "national", "regional", "footballHS", "general"];
const out = [];

for (let i = 0; i < N; i++) {
  setSeed(SEED + i);
  const policy = POLICIES[i % POLICIES.length];
  const pos = pick(["FW", "MF", "DF"]);
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: types[i % types.length] }));
  while (!s.finished) {
    if (s.pending?.type === "admission") {
      const ok = schoolOptions(s).list.filter(x => x.ok).sort((a, b) => ORDER.indexOf(a.tier) - ORDER.indexOf(b.tier));
      let c = ok[0];
      if (SCHOOL === "mixed") {         // 학생들은 늘 가장 좋은 학교만 고르지는 않음
        const r = rand(), fhs = ok.find(x => x.tier === "footballHS"), gen = ok.find(x => x.tier === "general");
        if (r < 0.15 && fhs) c = fhs; else if (r < 0.25) c = gen; else if (r < 0.35 && ok[1] && ok[1].tier !== "general") c = ok[1];
      }
      chooseSchool(s, c.id);
    }
    if (s.pending?.type === "national") s.pending = null;
    if (s.pending?.type === "number") { let r; const tries = [10, 7, 9]; do { r = chooseNumber(s, tries.shift() ?? pick(numberChoices(s))); } while (!r.ok); }
    const p = s.player;
    const allowed = ACTIONS.filter(a => actionAllowed(s, a).ok).map(a => a.id);
    const has = id => allowed.includes(id);
    const key = { FW: ["shoot", "dribble", "sprint", "weight"], MF: ["pass", "dribble", "conditioning", "tactics"], DF: ["defend", "weight", "sprint", "tactics"] }[p.position];
    const choose = () => {
      if (p.condition.injury) return has("rehab") ? "rehab" : "study";
      const ac = p.stats.student.academic;
      if (policy === "grind" || policy === "rest40") {
        if (ac < 45) return "study";
        if (policy === "rest40" && p.condition.fatigue > 40) return pick(["sleep", "family"]);
        return rand() < 0.8 ? pick(key) : "scrimmage";
      }
      if (p.condition.fatigue > 65) return pick(["sleep", "family"]);
      if (policy === "smart") {
        if (ac < 55) return pick(["study", "assessment"]);
        const r = rand(); if (r < 0.7) return pick(key); if (r < 0.85) return "scrimmage"; return pick(["study", "reading"]);
      }
      if (policy === "student") {      // 공부도 꾸준히 챙기는 학생 (한 주에 한두 칸은 공부·독서·수행평가)
        const r = rand(); if (r < 0.45) return pick(["study", "reading", "assessment", "study"]); return rand() < 0.8 ? pick(key) : "scrimmage";
      }
      if (policy === "football") return pick(["shoot", "pass", "dribble", "defend", "sprint", "weight", "tactics", "scrimmage", "conditioning"]);
      if (ac < 50 && rand() < 0.5) return "study";
      const r = rand();
      if (r < 0.55) return pick(["shoot", "pass", "dribble", "defend", "sprint", "weight"]);
      if (r < 0.8) return pick(["tactics", "scrimmage", "conditioning"]);
      return pick(["study", "assessment", "reading", "schoolEvent"]);
    };
    for (const k of ["wd1", "wd2", "we"]) if (!slotLocked(s, k)) { const a = choose(); s.plan[k] = has(a) ? a : "sleep"; }
    runWeek(s);
    while (s.pendingEvent) {
      const ev = findEvent(s.pendingEvent.id);
      const open = ev.choices.map((c, j) => j).filter(j => reqOk(s, ev.choices[j]));
      chooseEvent(s, open[Math.floor(rand() * open.length)]);
    }
  }
  const end = decideEnding(s).ending, c = summarize(s);
  out.push({ seed: SEED + i, policy, pos, ending: end.id, title: end.title,
    ok: ENDINGS.filter(x => { try { return x.cond(c); } catch { return false; } }).map(x => x.id),
    tier: c.tier, ovr: c.ovr, start3: +c.g3StartRatio.toFixed(2), rating3: +c.g3Rating.toFixed(2), apps: c.apps, subApps: c.subApps, subGoals: c.subGoals,
    captain: c.captain, capScore: s.flags.captainScore ?? null, acad: c.academic, att: c.attitude, inj: c.injuryWeeks, susp: c.suspended,
    bench1: c.wasBenchInG1, skipped: c.skippedHigher });
}
writeFileSync(`/tmp/ending-audit-${SEED}.json`, JSON.stringify(out));

const cnt = {}; for (const r of out) cnt[r.title] = (cnt[r.title] || 0) + 1;
console.log(`n=${N} seed=${SEED} school=${SCHOOL}`);
console.log("엔딩:", Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "));
console.log(`엔딩 종류 ${Object.keys(cnt).length}/${ENDINGS.length}`);
const cs = out.map(r => r.capScore).filter(v => v != null).sort((a, b) => a - b);
if (cs.length) console.log(`주장 점수: 10% ${cs[Math.floor(cs.length * .1)]}  50% ${cs[Math.floor(cs.length * .5)]}  90% ${cs[Math.floor(cs.length * .9)]}  주장 ${out.filter(r => r.captain).length}명`);
