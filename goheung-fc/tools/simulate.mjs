// 자동 플레이 시뮬레이션: node tools/simulate.mjs [판수]
// 브라우저 저장소가 없어도 돌아가도록 엔진만 사용합니다.
import { setSeed, pick, rand } from "../js/rng.js";
import { rollPlayer, newGame } from "../js/state.js";
import { runWeek, slotLocked, chooseNumber, numberChoices, actionAllowed } from "../js/engine/week.js";
import { ACTIONS } from "../data/actions.js";
import { chooseEvent, findEvent } from "../js/engine/events.js";
import { schoolOptions, chooseSchool, decideEnding } from "../js/engine/career.js";
import { ovr } from "../js/engine/team.js";
import { GROWTH_TYPES } from "../data/player.js";

const N = +process.argv[2] || 300;
const policy = process.argv[3] || "balanced";
const types = Object.keys(GROWTH_TYPES);
const res = [];
for (let i = 0; i < N; i++) {
  setSeed(1000 + i);
  const pos = pick(["FW", "MF", "DF"]);
  const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: types[i % types.length] }));
  const start = ovr(s.player);
  let injWeeks = 0;
  while (!s.finished) {
    if (s.pending?.type === "admission") { const order = ["proYouth", "national", "regional", "footballHS", "general"]; const ok = schoolOptions(s).list.filter(x => x.ok).sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier)); chooseSchool(s, (s.player.stats.student.academic >= 70 && ok[0].tier === "footballHS") ? "general" : ok[0].id); }
    if (s.pending?.type === "national") s.pending = null;
    if (s.pending?.type === "number") { let r; let tries = [10, 7, 9]; do { r = chooseNumber(s, tries.shift() ?? pick(numberChoices(s))); } while (!r.ok); }
    const p = s.player;
    const allowed = ACTIONS.filter(a => actionAllowed(s, a).ok);
    const by = id => allowed.find(a => a.id === id);
    const choose = () => {
      if (p.condition.injury) { injWeeks++; return by("rehab") ? "rehab" : "study"; }
      if (policy === "grind" || policy === "rest40") {
        const key = { FW: ["shoot","dribble","sprint","weight"], MF: ["pass","dribble","conditioning","tactics"], DF: ["defend","weight","sprint","tactics"] }[p.position];
        if (p.stats.student.academic < 45) return "study";
        if (policy === "rest40" && p.condition.fatigue > 40) return pick(["sleep", "family"]);
        return rand() < 0.8 ? pick(key) : "scrimmage";
      }
      if (p.condition.fatigue > 65) return pick(["sleep", "family"]);
      const ac = p.stats.student.academic;
      if (policy === "smart") {
        const key = { FW: ["shoot","dribble","sprint","weight"], MF: ["pass","dribble","conditioning","tactics"], DF: ["defend","weight","sprint","tactics"] }[p.position];
        if (ac < 55) return pick(["study","assessment"]);
        const r = rand(); if (r < 0.7) return pick(key); if (r < 0.85) return "scrimmage"; return pick(["study","reading"]);
      }
      if (policy === "football") return pick(["shoot", "pass", "dribble", "defend", "sprint", "weight", "tactics", "scrimmage", "conditioning"]);
      if (ac < 50 && rand() < 0.5) return "study";
      const r = rand();
      if (r < 0.55) return pick(["shoot", "pass", "dribble", "defend", "sprint", "weight"]);
      if (r < 0.8) return pick(["tactics", "scrimmage", "conditioning"]);
      return pick(["study", "assessment", "reading", "schoolEvent"]);
    };
    for (const k of ["wd1", "wd2", "we"]) if (!slotLocked(s, k)) s.plan[k] = choose();
    runWeek(s);
    if (s.pendingEvent) { const ev = findEvent(s.pendingEvent.id); chooseEvent(s, Math.floor(rand() * ev.choices.length)); }
  }
  const p = s.player;
  const end = decideEnding(s).ending;
  const ratings = s.record.ratings;
  res.push({ type: p.growthType, pos: p.position, start, end: ovr(p), pot: p.potential, h: p.body.height,
    ac: p.stats.student.academic, coach: s.relations.coach, apps: s.record.apps, starts: s.record.starts, goals: s.record.goals,
    avg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0, injWeeks, lv: s.flags.academicLevel,
    titles: s.record.titles.length, natl: s.record.titles.filter(t => t.national).length,
    lg1: s.record.leagues.filter(l => l.rank === 1).length, lgAvg: s.record.leagues.reduce((a, l) => a + l.rank, 0) / s.record.leagues.length,
    hsMax: Math.max(0, ...Object.values(s.scouting).map(x => x.interest)), offers: Object.values(s.scouting).filter(x => x.offered).length,
    tourBest: s.record.tournaments.map(t => t.best), earned: (s.record.earned || []).map(e => e.id), injN: s.record.injuries || 0, ending: end.title, school: s.career.school?.tier });
}
const avg = (k, arr = res) => (arr.reduce((a, r) => a + r[k], 0) / arr.length).toFixed(1);
console.log(`policy=${policy} n=${N}`);
console.log("type        start  end   pot   height acad coach apps starts goals rating injWk");
for (const t of types) {
  const a = res.filter(r => r.type === t);
  console.log(t.padEnd(11), ...["start","end","pot","h","ac","coach","apps","starts","goals","avg","injWeeks"].map(k => avg(k, a).padStart(5)));
}
console.log("titles/run", avg("titles"), " national titles/run", avg("natl"), " league avg rank", avg("lgAvg"), " hs max interest", avg("hsMax"), " offers", avg("offers"));
const bests = {}; res.flatMap(r => r.tourBest).forEach(b => bests[b] = (bests[b] || 0) + 1); console.log("tournament results:", bests);
for (const pos of ["FW","MF","DF"]) { const a = res.filter(r => r.pos === pos); console.log(pos, "goals/app", (a.reduce((x,r)=>x+r.goals,0)/a.reduce((x,r)=>x+r.apps,0)).toFixed(2), "rating", avg("avg", a)); }
const ec = {}; res.forEach(r => ec[r.ending] = (ec[r.ending] || 0) + 1); console.log("엔딩:", Object.entries(ec).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N * 100).toFixed(1)}%`).join(", "));
const sc = {}; res.forEach(r => sc[r.school] = (sc[r.school] || 0) + 1); console.log("진학:", JSON.stringify(sc));
const tc = {}; res.forEach(r => r.earned.forEach(id => tc[id] = (tc[id] || 0) + 1));
console.log("획득 특성(%):", Object.entries(tc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N * 100).toFixed(0)}`).join(", "), " 평균 개수", (res.reduce((a, r) => a + r.earned.length, 0) / N).toFixed(2), " 부상 횟수", avg("injN"));
const ends = res.map(r => r.end).sort((a, b) => a - b);
console.log("end OVR pct  10:", ends[Math.floor(N*.1)].toFixed(1), " 50:", ends[Math.floor(N*.5)].toFixed(1), " 90:", ends[Math.floor(N*.9)].toFixed(1), " max:", ends[N-1].toFixed(1));
