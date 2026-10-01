// 이벤트 엔진: 한 주가 끝나면 조건에 맞는 이벤트를 하나 골라 두고, 화면에서 선택을 받아 반영합니다.
import { EVENTS, CAPTAIN_EVENT } from "../../data/events.js";
import { STAT_LABEL } from "../../data/player.js";
import { STAFF, CAPTAINS } from "../../data/roster.js";
const _bat = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };

import { turnInfo } from "./calendar.js";
import { applyGain, expandGains } from "./growth.js";
import { adjustRel, person, captainScore, REL_ROLES } from "./relations.js";
import { mail } from "../state.js";
import { chance, weighted, clamp, rand, pick } from "../rng.js";
import { injure } from "./injury.js";

const EVENT_CHANCE = 0.32;
const PORTRAIT = { coach: "npc_coach", assistant: "npc_assistant", teacher: "npc_teacher", mom: "npc_mom", dad: "npc_dad" };
const SPEAKER = { coach: () => STAFF.coach, assistant: () => STAFF.assistant, teacher: () => STAFF.teacher, mom: () => "엄마", dad: () => "아빠" };

export const findEvent = id => (id === CAPTAIN_EVENT.id ? CAPTAIN_EVENT : EVENTS.find(e => e.id === id));

function eligible(state, ev, info) {
  if (ev.when?.grades && !ev.when.grades.includes(info.grade)) return false;
  if (ev.when?.months && !ev.when.months.includes(info.month)) return false;
  if (ev.school && info.vacation) return false;
  if (ev.needs && !person(state, ev.needs)) return false;
  if (ev.once && state.seenEvents?.includes(ev.id)) return false;
  const last = state.eventLog?.[ev.id];
  if (last != null && state.calendar.turn - last < (ev.afterLoss ? 4 : 12)) return false;
  try { if (ev.cond && !ev.cond(state)) return false; } catch { return false; }
  return true;
}

// 주 끝에 호출: 다음 주 시작 때 보여 줄 이벤트를 정해 둠
export function rollEvent(state) {
  const info = turnInfo(state);
  if (!info || state.pendingEvent) return;
  if (info.grade === 3 && info.month === 3 && info.week === 2 && !state.flags.captainVoted) {
    state.pendingEvent = { id: CAPTAIN_EVENT.id };
    return;
  }
  // 학교 행사 (그 주에 반드시)
  const day = info.school.find(d => d.event && EVENTS.some(e => e.id === d.event));
  if (day) { state.pendingEvent = { id: day.event }; return; }
  // 경기에서 졌다면 해변 모래 훈련이 먼저 찾아옴
  const beach = EVENTS.find(e => e.afterLoss);
  if (beach && eligible(state, beach, info) && chance(0.6)) { state.pendingEvent = { id: beach.id }; return; }
  if (!chance(EVENT_CHANCE)) return;
  const list = EVENTS.filter(e => !e.afterLoss && !e.fixed && eligible(state, e, info));
  if (!list.length) return;
  const ev = weighted(list.map(e => [e, (e.weight || 1) * (state.seenEvents?.includes(e.id) ? 0.35 : 1)]));
  state.pendingEvent = { id: ev.id };
}

export function eventVars(state) {
  return {
    name: state.player.name, coach: STAFF.coach, assistant: STAFF.assistant, teacher: STAFF.teacher,
    friend: person(state, "friend")?.name || "친구", rival: person(state, "rival")?.name || "동기",
    mentor: person(state, "mentor")?.name || "선배", junior: person(state, "junior")?.name || "후배",
    mom: "엄마",
  };
}

// 화면에 보여 줄 정보
export function eventView(state) {
  const pe = state.pendingEvent;
  if (!pe) return null;
  const ev = findEvent(pe.id);
  if (!ev) { state.pendingEvent = null; return null; }
  const rel = person(state, ev.who);
  return {
    ev, text: typeof ev.text === "function" ? ev.text(state) : ev.text,
    speaker: rel ? `${REL_ROLES[ev.who].label} ${rel.name}` : SPEAKER[ev.who]?.() || "",
    portrait: rel ? rel.face : PORTRAIT[ev.who] || null,
  };
}

function applyFx(state, fx, changes) {
  if (!fx) return;
  const p = state.player;
  for (const [path, v] of Object.entries(expandGains(state, fx.s || {}))) {
    const d = applyGain(state, path, v, { raw: true });
    changes.push({ label: STAT_LABEL[path] || path, d });
  }
  if (fx.fatigue) { const b = p.condition.fatigue; p.condition.fatigue = clamp(b + fx.fatigue, 0, 100); changes.push({ label: "피로", d: p.condition.fatigue - b, invert: true }); }
  if (fx.morale) { const b = p.condition.morale; p.condition.morale = clamp(b + fx.morale, 0, 100); changes.push({ label: "사기", d: p.condition.morale - b }); }
  if (fx.coach) { const b = state.relations.coach; state.relations.coach = clamp(b + fx.coach, 0, 100); changes.push({ label: "감독 신뢰", d: state.relations.coach - b }); }
  if (fx.teacher) {
    const b = state.relations.teacher ?? 50;
    state.relations.teacher = clamp(b + fx.teacher, 0, 100);
    changes.push({ label: "류봉두 선생님", d: state.relations.teacher - b });
  }
  if (fx.camp) state.record.camps = (state.record.camps || 0) + 1;
  for (const [k, v] of Object.entries(fx.rel || {})) {
    const d = adjustRel(state, k, v);
    if (d) changes.push({ label: `${REL_ROLES[k].label} ${person(state, k).name}`, d });
  }
}

// 선택 반영. 돌려주는 값: 결과 문장과 바뀐 수치
export function chooseEvent(state, idx) {
  const pe = state.pendingEvent;
  const ev = findEvent(pe.id);
  const c = ev.choices[idx];
  const changes = [];
  let result;
  if (ev.id === CAPTAIN_EVENT.id) result = captainVote(state, c.run, changes);
  else {
    applyFx(state, c.fx, changes);
    applyFx(state, c.fxAfter, changes);
    result = typeof c.result === "function" ? c.result(state) : c.result;
    // 다칠 수 있는 선택 (스키캠프 상급 코스 등)
    if (c.hurt && !state.player.condition.injury && chance(c.hurt.p)) {
      const r = injure(state, c.hurt.type, c.hurt.cause);
      changes.push({ label: r.label, d: -r.weeks, invert: false, note: `${r.weeks}주` });
      result = c.hurt.result;
      state.lastEventInjury = r;
    }
  }
  state.seenEvents ||= [];
  if (!state.seenEvents.includes(ev.id)) state.seenEvents.push(ev.id);
  state.eventLog ||= {};
  state.eventLog[ev.id] = state.calendar.turn;
  state.pendingEvent = null;
  return { result, changes: changes.filter(x => Math.abs(x.d) >= 0.05) };
}

function captainVote(state, run, changes) {
  const p = state.player;
  state.flags.captainVoted = true;
  const score = captainScore(state) + (rand() * 8 - 4);
  const need = run ? 66 : 76;
  const win = score >= need;
  if (win) {
    state.flags.captain = true;
    p.condition.morale = clamp(p.condition.morale + 12, 0, 100);
    state.relations.coach = clamp(state.relations.coach + 5, 0, 100);
    changes.push({ label: "사기", d: 12 }, { label: "감독 신뢰", d: 5 });
    mail(state, "coach", "주장 완장",
      `올해 주장은 ${p.name}${/[가-힣]/.test(p.name.at(-1)) && (p.name.at(-1).charCodeAt(0) - 0xAC00) % 28 ? "이다" : "다"}.\n\n주장은 제일 잘하는 선수가 아니라, 제일 먼저 나오고 제일 늦게 들어가는 선수다. 힘들 때 고개 숙이지 마라. 다들 너를 본다.`);
    return run ? "동기들이 하나둘 손을 들었다. 만장일치. 감독님이 주황색 완장을 건넸다." : "다른 친구를 추천했는데, 동기들이 오히려 네 이름을 불렀다. 감독님이 완장을 건넸다.";
  }
  p.condition.morale = clamp(p.condition.morale - (run ? 6 : 0), 0, 100);
  if (run) changes.push({ label: "사기", d: -6 });
  const cap = CAPTAINS?.[3] && CAPTAINS[3] !== p.name ? CAPTAINS[3] : null;
  if (cap) mail(state, "group", "올해 주장", `${STAFF.coach}: 올해 주장은 ${cap}${_bat(cap) ? "이다" : "다"}.\n\n주장 ${cap}: 마지막 해다. 후회 없이 하자. 다 같이.`);
  return run ? `손을 들었지만 표가 모자랐다. 완장은 ${cap || "다른 친구"}에게 갔다. 감독님 신뢰, 팀워크, 동료들과의 관계가 조금씩 더 필요했다.`
    : `${cap ? `추천한 ${cap}${_bat(cap) ? "이" : "가"}` : "추천한 친구가"} 주장이 됐다. 박수를 쳐 줬다.`;
}
