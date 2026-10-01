// 게임 상태 만들기와 저장/불러오기
import { GROWTH_TYPES, POSITIONS, STAT_GROUPS, TRAITS } from "../data/player.js";
import { ROSTER, STAFF } from "../data/roster.js";
import { normal, range, clamp, chance, pick } from "./rng.js";
import { weightFor } from "./engine/growth.js";
import { randomFreeNumber } from "./engine/team.js";
import { initRelations } from "./engine/relations.js";

export const SAVE_VERSION = 3;
const KEY = { slot: n => `gfc_slot_${n}`, auto: "gfc_auto", settings: "gfc_settings", seen: "gfc_endings" };

export function rollPlayer({ name, face, position, foot, growthType }) {
  const type = GROWTH_TYPES[growthType];
  const bias = POSITIONS[position].bias;
  const stats = {};
  for (const g of STAT_GROUPS) {
    stats[g.id] = {};
    for (const [k] of g.stats) {
      const path = `${g.id}.${k}`;
      let v;
      if (g.id === "tech" || g.id === "phys") {
        v = normal(31, 3.5) + type.startBonus + (bias[path] || 0);
        if (g.id === "tech") v += (type.techMult - 1) * 12;
        if (g.id === "phys") v += (type.physMult - 1) * 12;
      } else if (g.id === "mental") v = normal(44, 6);
      else if (k === "academic") v = normal(58, 9);
      else v = normal(60, 7);
      stats[g.id][k] = clamp(v, 12, 70);
    }
  }
  if (foot === "L") stats.tech.cross += 2;

  const startHeight = Math.round((normal(151.5, 3.5) + type.startHeight) * 10) / 10;
  let finalHeight = normal(174, 4.5) + type.heightBonus;
  finalHeight = Math.max(finalHeight, startHeight + 15);

  const good = Object.keys(TRAITS).filter(k => TRAITS[k].good && !TRAITS[k].earned);   // 경기로 얻는 특성은 처음부터 주지 않음
  const bad = Object.keys(TRAITS).filter(k => !TRAITS[k].good && !TRAITS[k].earned);
  const traits = [];
  if (chance(0.75)) traits.push(pick(good));
  if (chance(0.55)) traits.push(pick(bad));
  if (!traits.length) traits.push(pick(good));

  const potential = Math.round(range(...type.potential));
  const est = potential + normal(0, 4);
  const stars = clamp(Math.round(((est - 55) / 7) * 2) / 2, 1, 5);

  const weight = weightFor(startHeight, 1, stats.phys.strength);
  return {
    name, face, position, foot, growthType, potential, traits, number: 0,
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

export function deleteSlot(where) { safeDel(where === "auto" ? KEY.auto : KEY.slot(where)); }

// 옛 저장 파일을 새 형식으로 고치는 곳 (버전이 오를 때 여기에 추가)
function migrate(data) {
  if (!data?.state) return null;
  // 1단계 저장(일정 40턴)은 일정이 바뀌어 이어갈 수 없습니다
  if (data.version !== SAVE_VERSION) return null;
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
