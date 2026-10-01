// 관계: 친구, 라이벌, 멘토 선배, 후배
// 게임을 시작할 때 data/roster.js 명단에서 자동으로 정해집니다.
import { ROSTER } from "../../data/roster.js";
import { mailFrom, mail } from "../state.js";
import { mateGrade, ovr } from "./team.js";
import { pick, clamp, chance } from "../rng.js";
import { applyGain, hasTrait } from "./growth.js";

export const REL_ROLES = {
  friend: { label: "단짝 친구", icon: "🤝", desc: "사기가 떨어질 때 붙잡아 줍니다. 관계가 70을 넘으면 사기가 35 밑으로 잘 안 내려갑니다." },
  rival:  { label: "라이벌",   icon: "🔥", desc: "같은 자리를 노리는 동기. 능력치 차이가 5 이내면 서로 자극이 되어 훈련 효율이 5% 오릅니다." },
  mentor: { label: "멘토 선배", icon: "🧭", desc: "관계가 70을 넘으면 매주 집중력·팀워크가 조금씩 오르고, 감독님 신뢰도 따라 오릅니다." },
  junior: { label: "챙기는 후배", icon: "🌱", desc: "중2부터 생깁니다. 관계가 높으면 팀워크가 오르고, 중3 주장 선거에 유리합니다." },
};

const pool = (state, cohort) => state.team.roster.filter(m => m.cohort === cohort);
const pack = (m, value) => m ? { id: m.id, name: m.name, face: m.face, position: m.position, cohort: m.cohort, value } : null;

export function initRelations(state) {
  const p = state.player;
  const mates = pool(state, "동기");
  const same = mates.filter(m => m.position === p.position);
  const rival = (same.length ? same : mates).slice().sort((a, b) => b.ovrNow - a.ovrNow)[0];
  const friendPool = mates.filter(m => m.id !== rival?.id);
  const friend = friendPool.length ? pick(friendPool) : null;
  const seniors = [...pool(state, "2학년선배"), ...pool(state, "3학년선배")];
  const mentor = seniors.find(m => m.position === p.position && m.cohort === "2학년선배") || seniors.find(m => m.position === p.position) || seniors[0];
  state.relations.people = {
    friend: pack(friend, 55),
    rival: pack(rival, 40),
    mentor: pack(mentor, 35),
    junior: null,
  };
}

export const person = (state, key) => state.relations.people?.[key] || null;
export const nameOf = (state, key) => person(state, key)?.name || "";

export function adjustRel(state, key, n) {
  const r = person(state, key);
  if (!r) return 0;
  const before = r.value;
  r.value = clamp(r.value + n, 0, 100);
  return r.value - before;
}

// 매주 관계 효과
export function weeklyRelations(state) {
  const p = state.player;
  const P = state.relations.people || {};
  const fx = { trainMult: 1 };
  if (P.friend) {
    P.friend.value = clamp(P.friend.value - 0.4, 0, 100);
    if (P.friend.value >= 70) { p.condition.morale = Math.max(p.condition.morale, 35); p.condition.morale = clamp(p.condition.morale + 1.2, 0, 100); }
    if (P.friend.value <= 25) p.condition.morale = clamp(p.condition.morale - 1, 0, 100);
  }
  if (P.mentor) {
    P.mentor.value = clamp(P.mentor.value - 0.4, 0, 100);
    if (P.mentor.value >= 70) {
      applyGain(state, "mental.focus", 0.15, { raw: true });
      applyGain(state, "mental.teamwork", 0.15, { raw: true });
      state.relations.coach = clamp(state.relations.coach + 0.1, 0, 100);
    }
  }
  if (P.junior) {
    P.junior.value = clamp(P.junior.value - 0.3, 0, 100);
    if (P.junior.value >= 60) applyGain(state, "mental.teamwork", 0.12 * (hasTrait(p, "leadership") ? 1.5 : 1), { raw: true });
  }
  if (P.rival) {
    const mate = state.team.roster.find(m => m.id === P.rival.id);
    if (mate && Math.abs(mate.ovrNow - ovr(p)) <= 5) {
      fx.trainMult = 1.05;
      P.rival.value = clamp(P.rival.value + 0.5, 0, 100);
      applyGain(state, "mental.competitive", 0.15, { raw: true });
    }
  }
  return fx;
}

export function rivalGap(state) {
  const r = person(state, "rival");
  const mate = r && state.team.roster.find(m => m.id === r.id);
  return mate ? Math.round(ovr(state.player) - mate.ovrNow) : null;
}

// 학년이 바뀔 때: 선배 졸업, 후배 생김
export function relationsNewYear(state) {
  const g = state.calendar.grade;
  const P = state.relations.people;
  if (!P) return;
  const p = state.player;
  if (P.mentor && mateGrade(P.mentor, g) > 3) {
    const old = P.mentor.name;
    const next = state.team.roster.filter(m => { const mg = mateGrade(m, g); return mg > g && mg <= 3; })
      .sort((a, b) => (b.position === p.position) - (a.position === p.position))[0];
    P.mentor = pack(next, 30);
    mailFrom(state, old, "friend", "졸업하면서 한마디",
      `${p.name}, 형 이제 고등학생이다. 같이 훈련한 거 재밌었다.\n\n${next ? `이제 ${next.name}한테 많이 물어봐. 걔도 좋은 형이다.` : "이제 네가 선배다. 후배들 잘 챙겨라."}\n\n고등학교 가서 경기 있으면 보러 와라.`);
  }
  if (!P.junior && g >= 2) {
    const juniors = state.team.roster.filter(m => mateGrade(m, g) === 1 && m.cohort !== "동기");
    const j = juniors.find(m => m.position === p.position) || juniors[0];
    if (j) {
      P.junior = pack(j, 40);
      mail(state, "assist", "후배 하나 맡아라",
        `이번에 들어온 ${j.name}, ${j.position === p.position ? "너랑 같은 포지션이다" : "너희 동네 사는 애다"}. 훈련 끝나고 이것저것 알려 줘라.\n\n후배를 챙기면 팀워크가 늘고, 감독님도 다 보고 계신다.`);
    }
  }
}

// 중3 3월: 주장 선거
export function captainScore(state) {
  const p = state.player;
  const P = state.relations.people || {};
  const rels = ["friend", "mentor", "junior"].map(k => P[k]?.value).filter(v => v != null);
  const relAvg = rels.length ? rels.reduce((a, b) => a + b, 0) / rels.length : 40;
  let s = state.relations.coach * 0.35 + p.stats.mental.teamwork * 0.25 + p.stats.student.attitude * 0.2 + relAvg * 0.2;
  if (hasTrait(p, "leadership")) s += 8;
  return s;
}
