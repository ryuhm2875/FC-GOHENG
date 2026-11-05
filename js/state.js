// 게임 상태 만들기와 저장/불러오기
import { GROWTH_TYPES, GROWTH_ALIAS, growthTypeOf, BLOOM, POSITIONS, STAT_GROUPS, TRAITS } from "../data/player.js";
import { ROSTER, STAFF } from "../data/roster.js";
import { normal, range, clamp, chance, pick } from "./rng.js";
import { weightFor } from "./engine/growth.js";
import { randomFreeNumber } from "./engine/team.js";
import { initRelations } from "./engine/relations.js";
import { ukey } from "./userkey.js";

export const SAVE_VERSION = 3;
const KEY = { slot: n => ukey(`gfc_slot_${n}`), get auto() { return ukey("gfc_auto"); }, settings: "gfc_settings" };

export function rollPlayer({ name, face, position, foot, growthType, bloom = null }) {
  if (!GROWTH_TYPES[growthType]) { if (growthType === "late" && bloom == null) bloom = true; growthType = GROWTH_ALIAS[growthType] || "rookie"; }   // 예전 유형 이름 (점검 도구)
  const type = growthTypeOf(growthType);
  if (bloom == null) bloom = chance(BLOOM.chance);          // 숨은 재능 '늦게 피는 꽃' (처음엔 아무도 모름)
  const bias = POSITIONS[position].bias;
  const stats = {};
  for (const g of STAT_GROUPS) {
    stats[g.id] = {};
    for (const [k] of g.stats) {
      const path = `${g.id}.${k}`;
      let v;
      if (g.id === "tech" || g.id === "phys") {
        v = normal(31, 3.5) + (type.adj[g.id] || 0) + (type.adj[path] || 0) + (bias[path] || 0) + (bloom ? -2 : 0);
      } else if (g.id === "mental") v = normal(44, 6) + (type.adj[path] || 0);
      else if (k === "academic") v = normal(58, 9);
      else v = normal(60, 7);
      stats[g.id][k] = clamp(v, 12, 70);
    }
  }
  if (foot === "L") stats.tech.cross += 2;

  // 키: 입학 150cm대 초반, 다 크면 평균 178cm (중3 9월 측정 때 평균 175cm 안팎, 180cm 넘는 친구도 꽤 있음)
  const startHeight = Math.round((normal(152, 4) + type.startHeight + (bloom ? BLOOM.startHeight : 0)) * 10) / 10;
  let finalHeight = normal(178, 5) + type.heightBonus + (bloom ? BLOOM.heightBonus : 0);
  finalHeight = Math.max(finalHeight, startHeight + 16);

  const good = Object.keys(TRAITS).filter(k => TRAITS[k].good && !TRAITS[k].earned && !TRAITS[k].hidden);   // 경기로 얻는 특성은 처음부터 주지 않음
  const bad = Object.keys(TRAITS).filter(k => !TRAITS[k].good && !TRAITS[k].earned);
  const traits = [];
  if (chance(0.75)) traits.push(pick(good));
  if (chance(0.55)) traits.push(pick(bad));
  if (!traits.length) traits.push(pick(good));

  const potential = Math.round(range(...type.potential)) + (bloom ? BLOOM.potential : 0);
  const est = potential + normal(0, 4);
  const stars = clamp(Math.round(((est - 55) / 7) * 2) / 2, 1, 5);

  const weight = weightFor(startHeight, 1, stats.phys.strength);
  return {
    name, face, position, foot, growthType, bloom, potential, traits, number: 0,
    coachStars: stars,
    stats,
    body: { height: startHeight, weight, startHeight, finalHeight: Math.round(finalHeight * 10) / 10,
            history: [{ label: "중1 입학", height: startHeight, weight }] },
    condition: { fatigue: 10, morale: 60, injury: null },
  };
}

export function newGame(player) {
  const state = {
    meta: { version: SAVE_VERSION, createdAt: Date.now(), savedAt: null },
    calendar: { turn: 1, grade: 1, semester: 1 },
    player: structuredClone(player),
    relations: { coach: 50, teacher: 50 },
    team: { roster: ROSTER.map((r, i) => ({ ...r, id: `m${i}`, ovrNow: r.ovr })) },
    record: { apps: 0, starts: 0, goals: 0, assists: 0, mom: 0, ratings: [], matches: [], leagues: [], tournaments: [], titles: [] },
    flags: { academicLevel: 0, wasBenchInG1: false, captain: false, wore10: false, nationalChampion: false },
    league: null, tour: null, scouting: {}, rolls: {}, career: {},
    yearStart: null,
    inbox: [],
    plan: { wd1: null, wd2: null, we: null },
    pending: null,
    finished: false,
  };
  if (!state.player.number) state.player.number = randomFreeNumber(state, 30, 99);
  state.relations.people = null;
  initRelations(state);
  state.yearStart = snapshotStats(state);
  state.player.numberHistory = [{ grade: 1, number: state.player.number }];

  return state;
}

export function snapshotStats(state) {
  return { stats: structuredClone(state.player.stats), height: state.player.body.height };
}

const SENDERS = {
  coach:   () => ({ from: STAFF.coach, kind: "coach" }),
  assist:  () => ({ from: STAFF.assistant, kind: "coach" }),
  teacher: () => ({ from: STAFF.teacher, kind: "school" }),
  mom:     () => ({ from: "엄마", kind: "family" }),
  dad:     () => ({ from: "아빠", kind: "family" }),
  group:   () => ({ from: "고흥FC 단톡방", kind: "group" }),
  medical: () => ({ from: "의무 기록", kind: "medical" }),
  system:  () => ({ from: "알림", kind: "system" }),
};

export function mail(state, who, title, body) {
  return pushMail(state, SENDERS[who](), title, body);
}
export function mailFrom(state, from, kind, title, body) {
  return pushMail(state, { from, kind }, title, body);
}
function pushMail(state, s, title, body) {
  state.meta.mailSeq = (state.meta.mailSeq || 0) + 1;
  const item = { id: `m${state.meta.mailSeq}`, turn: state.calendar.turn, ...s, title, body, read: false };
  state.inbox.unshift(item);
  if (state.inbox.length > 120) state.inbox.length = 120;
  return item;
}

// ── 저장 ──────────────────────────────────────────
function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
function safeDel(k) { try { localStorage.removeItem(k); } catch {} }

export function summaryOf(state, info) {
  const p = state.player;
  return `${p.name} ${p.position} ${p.number}번, ${info ? `중${info.grade} ${info.month}월 ${info.week}주차` : "졸업"}`;
}

function pack(state, summary) {
  state.meta.savedAt = Date.now();
  return JSON.stringify({ version: SAVE_VERSION, savedAt: state.meta.savedAt, summary, state });
}

export function saveTo(where, state, summary) {
  return safeSet(where === "auto" ? KEY.auto : KEY.slot(where), pack(state, summary));
}

export function readSlot(where) {
  const raw = safeGet(where === "auto" ? KEY.auto : KEY.slot(where));
  if (!raw) return null;
  try { return migrate(JSON.parse(raw)); } catch { return null; }
}

// 클라우드 저장용: 자동 저장 원문 그대로 읽고 쓰기
export function rawAuto() { return safeGet(KEY.auto); }
export function putRawAuto(text) { return safeSet(KEY.auto, text); }

export function deleteSlot(where) { safeDel(where === "auto" ? KEY.auto : KEY.slot(where)); }

// 바뀐 선수 이름: 진행 중인 저장 파일의 명단·관계에도 새 이름을 씁니다 (지난 메일 본문은 그대로)
const RENAMED = { "김태완": "김채완", "박성연": "김타균", "김태현": "김대헌", "김하유": "김윤하" };
function renameMates(o, depth = 0) {
  if (!o || typeof o !== "object" || depth > 6) return;
  if (Array.isArray(o)) { for (const x of o) renameMates(x, depth + 1); return; }
  if (typeof o.name === "string" && RENAMED[o.name] && (o.cohort || o.id)) o.name = RENAMED[o.name];
  for (const k in o) if (k !== "inbox" && k !== "mail" && k !== "log") renameMates(o[k], depth + 1);
}

// 옛 저장 파일을 새 형식으로 고치는 곳 (버전이 오를 때 여기에 추가)
function migrate(data) {
  if (!data?.state) return null;
  // 1단계 저장(일정 40턴)은 일정이 바뀌어 이어갈 수 없습니다
  if (data.version !== SAVE_VERSION) return null;
  renameMates(data.state);
  const p = data.state.player;                               // 예전 성장 유형 → 출신 (대기만성형은 '늦게 피는 꽃'이 이미 드러난 클럽 출신)
  if (p && !GROWTH_TYPES[p.growthType]) {
    if (p.growthType === "late") { p.bloom = true; if (!p.traits.includes("lateBloom")) p.traits.push("lateBloom"); }
    p.growthType = GROWTH_ALIAS[p.growthType] || "rookie";
  }
  return data;
}

export function exportCode(state, summary) {
  const json = pack(state, summary);
  return btoa(unescape(encodeURIComponent(json)));
}
export function importCode(code) {
  try { return migrate(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); }
  catch { return null; }
}

export function loadSettings() {
  try { return { minigame: true, ...JSON.parse(safeGet(KEY.settings) || "{}") }; }
  catch { return { minigame: true }; }
}
export function saveSettings(s) { safeSet(KEY.settings, JSON.stringify(s)); }
