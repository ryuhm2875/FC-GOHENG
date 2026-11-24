// 특성 획득 점검: node tools/dev/trait-audit.mjs [판수] [시작 시드]
// ending-audit 과 같은 방식으로 3년을 자동으로 치르고, 처음 특성과 얻은 특성(몇 주차)을 셉니다.
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
  s.player.startTraits = s.player.traits.slice();
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
      if (process.env.SOCIAL && rand() < 0.25) { const o = ["hangout", "careJunior"].filter(has); if (o.length) return pick(o); }   // SOCIAL=1: 친구·후배도 챙기는 학생
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
  out.push({ seed: SEED + i, policy, pos, start: s.player.startTraits, now: s.player.traits.slice(), earned: (s.record.earned || []).map(e => [e.id, e.turn]),
    personalWeeks: s.flags.personalWeeks || 0, setPieces: s.record.setPieces || 0,
    sub: s.record.matches.filter(m => m.status === "sub").reduce((a, m) => a + m.goals + m.assists, 0),
    stop3: s.record.matches.filter(m => (m.stops || 0) >= 3).length, big75: s.record.matches.filter(m => m.big && m.rating >= 7.5).length,
    friend: s.relations.people?.friend?.value | 0, junior: s.relations.people?.junior?.value | 0 });
}
writeFileSync(`/tmp/trait-audit-${SEED}.json`, JSON.stringify(out));

const NEW = ["joker", "unsungHero", "setPiece", "moodMaker", "strongHeart", "diligent"];
console.log(`n=${N} seed=${SEED}`);
for (const id of NEW) {
  const got = out.filter(r => r.earned.some(e => e[0] === id));
  const turns = got.map(r => r.earned.find(e => e[0] === id)[1]).sort((a, b) => a - b);
  const base = id === "unsungHero" ? out.filter(r => r.pos === "MF") : id === "strongHeart" ? out.filter(r => r.start.includes("timid")) : id === "diligent" ? out.filter(r => r.start.includes("lazy")) : out;
  console.log(`${id}: ${got.length}/${base.length}명  얻은 주(중앙) ${turns[Math.floor(turns.length / 2)] ?? "-"}`);
}
const avg = k => (out.reduce((a, r) => a + r[k], 0) / out.length).toFixed(1);
console.log(`평균: 교체 공격포인트 ${avg("sub")}, 차단3+ 경기 ${avg("stop3")}, 세트피스 성공 ${avg("setPieces")}, 큰경기 7.5+ ${avg("big75")}, 친구 ${avg("friend")}, 후배 ${avg("junior")}, 개인훈련 주 ${avg("personalWeeks")}`);
const mf = out.filter(r => r.pos === "MF"); console.log(`MF 차단3+ 경기: ${mf.map(r => r.stop3).join(",")}`);
