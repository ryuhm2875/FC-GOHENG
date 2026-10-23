// 학번 로그인, 입장 확인(게임 열림·차단), 클라우드 저장, 플레이 기록
// 서버 데이터 모양
//   fcg_config/main      { open, message, quiet: { on, from, to, message } }   누구나 읽음, 관리자만 씀
//   fcg_login/{학번}      { key, blocked }                                       누구나 읽음, 관리자만 씀
//   fcg_students/{학번}   { name, created, ...관리자 칸 / play, now, lastSeen (학생이 씀) }
//   fcg_saves/{학번}      { enc, data, at, summary }                             자기 것만
import { ADMIN_EMAIL, studentEmail, studentPassword, signIn, refresh, getDoc, setDoc, authMessage, pack, unpack, inQuiet } from "./fb.js";
import { rawAuto, putRawAuto } from "../state.js";
import { setUserNS } from "../userkey.js";
import { turnInfo, label } from "../engine/calendar.js";
import { ovr } from "../engine/team.js";
import { nemesisSummary } from "../engine/nemesis.js";
import { ACTION_MAP } from "../../data/actions.js";
import { DETAIL_POS } from "../../data/player.js";
import { ENDINGS } from "../../data/endings.js";

const SESS_KEY = "gfc_session";
const CHECK_EVERY = 3 * 60 * 1000;          // 게임 중 입장 확인 간격
const SAVE_GAP = 60 * 1000;                 // 클라우드 저장 최소 간격
const MAX_EVENTS = 500;

let sess = null;            // { sid, key, admin, name, idToken, refreshToken, exp }
let play = null;            // 서버에서 받아 온 플레이 기록 (받기 전에는 null → 덮어쓰지 않음)
let now = null;             // 지금 판 요약
let dirty = false, onLock = null, timers = [], watching = false;
let lastSave = 0, saveTimer = null, saving = null, flushing = null;

const readSess = () => { try { return JSON.parse(localStorage.getItem(SESS_KEY) || "null"); } catch { return null; } };
const writeSess = s => { try { s ? localStorage.setItem(SESS_KEY, JSON.stringify(s)) : localStorage.removeItem(SESS_KEY); } catch { /* 저장 못 하면 이번만 */ } };

export const session = () => sess;
export const isStudent = () => !!sess?.sid;

async function token() {
  if (!sess) throw new Error("로그인 필요");
  if (Date.now() > sess.exp) { sess = await refresh(sess); writeSess(sess); }
  return sess.idToken;
}

// ── 로그인 ───────────────────────────
// 학번(숫자) 또는 선생님 이메일
export async function login(id, pw) {
  id = String(id || "").trim();
  pw = String(pw || "");
  if (!id || !pw) throw new Error("학번과 비밀번호를 입력해 주세요.");
  try {
    if (id.includes("@")) {
      if (id.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) throw new Error("학번으로 로그인해 주세요.");
      const a = await signIn(id, pw);
      sess = { ...a, admin: true, sid: null, name: "선생님" };
    } else {
      const lg = await getDoc(`fcg_login/${encodeURIComponent(id)}`);
      if (!lg?.key) throw new Error("등록되지 않은 학번입니다. 선생님께 확인해 주세요.");
      if (lg.blocked) throw new Error("지금은 이 학번으로 들어갈 수 없습니다. 선생님께 문의해 주세요.");
      const a = await signIn(studentEmail(id, lg.key), studentPassword(pw));
      sess = { ...a, admin: false, sid: id, key: lg.key, name: "" };
    }
  } catch (e) {
    if (e.code) throw new Error(authMessage(e));
    throw e;
  }
  writeSess(sess);
  await afterLogin();
  return sess;
}

export function logout() {
  flush().catch(() => {});
  sess = null; play = null; now = null; writeSess(null); setUserNS(null);
}

async function afterLogin() {
  setUserNS(sess.sid);
  if (!sess.sid) return;
  const doc = await getDoc(`fcg_students/${sess.sid}`, await token()).catch(() => null);
  if (doc) { play = normPlay(doc.play); sess.name = doc.name || ""; writeSess(sess); }
  await pullSave().catch(() => false);
}

// ── 입장 확인 ─────────────────────────
// → { ok } 또는 { ok:false, kind: "login"|"closed"|"blocked"|"relogin"|"offline", message }
export async function checkAccess() {
  if (!sess) sess = readSess();
  if (!sess) return { ok: false, kind: "login" };
  let cfg, lg = null;
  try {
    [cfg, lg] = await Promise.all([getDoc("fcg_config/main"), sess.sid ? getDoc(`fcg_login/${encodeURIComponent(sess.sid)}`) : null]);
  } catch (e) {
    return { ok: false, kind: "offline", message: e.code === "NETWORK" ? "인터넷에 연결되어 있지 않습니다.\n연결한 뒤 다시 시도해 주세요." : `서버에 연결하지 못했습니다. (${e.code || e.message})` };
  }
  if (sess.admin) return { ok: true };                                         // 선생님은 언제나
  if (!lg?.key) return { ok: false, kind: "relogin", message: "등록되지 않은 학번입니다. 선생님께 확인해 주세요." };
  if (lg.key !== sess.key) return { ok: false, kind: "relogin", message: "비밀번호가 바뀌었습니다. 새 비밀번호로 다시 로그인해 주세요." };
  if (lg.blocked) return { ok: false, kind: "blocked", message: "지금은 이 학번으로 게임을 할 수 없습니다.\n선생님께 문의해 주세요." };
  if (cfg && cfg.open === false) return { ok: false, kind: "closed", message: cfg.message || "지금은 게임이 닫혀 있습니다." };
  if (cfg?.quiet?.on && inQuiet(cfg.quiet)) return { ok: false, kind: "closed", message: cfg.quiet.message || `${cfg.quiet.from}부터 ${cfg.quiet.to}까지는 게임을 할 수 없습니다.` };
  return { ok: true };
}

// 로그인이 살아 있으면 저장·기록 준비 (새로고침했을 때)
export async function resume() {
  if (!sess) sess = readSess();
  if (!sess) return false;
  setUserNS(sess.sid);
  if (sess.sid && !play) {
    try {
      const doc = await getDoc(`fcg_students/${sess.sid}`, await token());
      play = normPlay(doc?.play); sess.name = doc?.name || sess.name;
    } catch (e) {
      if (e.status === 400 || e.status === 401) { logout(); return false; }   // 로그인 만료
    }
    await pullSave().catch(() => false);
  }
  return true;
}

// 게임 중에도 가끔 확인 (닫힘·차단·비밀번호 바뀜이면 잠금)
export function watch(lock) {
  onLock = lock;
  timers.forEach(clearInterval);
  timers = [
    setInterval(async () => {
      if (document.visibilityState !== "visible" || !sess) return;
      const r = await checkAccess();
      if (!r.ok && r.kind !== "offline") { await flush().catch(() => {}); onLock?.(r); }
    }, CHECK_EVERY),
    setInterval(() => { if (play && document.visibilityState === "visible") { play.minutes++; dirty = true; } }, 60 * 1000),
  ];
  if (!watching) document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { flush().catch(() => {}); pushSave(true).catch(() => {}); } });
  watching = true;
}

// ── 클라우드 저장 ──────────────────────
async function pullSave() {
  if (!sess?.sid) return false;
  const cloud = await getDoc(`fcg_saves/${sess.sid}`, await token());
  if (!cloud?.data) return false;
  let localAt = 0;
  try { localAt = JSON.parse(rawAuto() || "null")?.savedAt || 0; } catch { /* 깨진 저장 */ }
  if ((cloud.at || 0) <= localAt + 1000) return false;
  const text = await unpack(cloud);
  JSON.parse(text);                                               // 깨진 데이터면 여기서 멈춤
  putRawAuto(text);
  return true;
}

// 자동 저장을 서버에도 (1분에 한 번까지. force면 바로)
export async function pushSave(force = false) {
  if (!sess?.sid) return;
  const wait = SAVE_GAP - (Date.now() - lastSave);
  if (!force && wait > 0) { clearTimeout(saveTimer); saveTimer = setTimeout(() => pushSave(true), wait); return; }
  clearTimeout(saveTimer);
  const text = rawAuto();
  if (!text) return;
  if (saving) return saving;
  lastSave = Date.now();
  saving = (async () => {
    let at = 0, summary = "";
    try { const j = JSON.parse(text); at = j.savedAt || 0; summary = j.summary || ""; } catch { return; }
    const packed = await pack(text);
    await setDoc(`fcg_saves/${sess.sid}`, { ...packed, at, summary }, await token());
  })().catch(e => console.warn("클라우드 저장 실패", e)).finally(() => { saving = null; });
  return saving;
}

// ── 플레이 기록 ────────────────────────
const band = () => ({ safe: 0, mid: 0, bold: 0 });
function normPlay(p) {
  p = p || {};
  const m = p.match || {};
  return {
    runs: p.runs || 0, run: p.run || 0, minutes: p.minutes || 0,
    match: {
      games: m.games || 0, n: m.n || 0, auto: m.auto || 0,
      band: { ...band(), ...m.band }, ok: { ...band(), ...m.ok }, exp: { bold: 0, safe: 0, ...m.exp },
      sc: { behind: { ...band(), ...m.sc?.behind }, level: { ...band(), ...m.sc?.level }, ahead: { ...band(), ...m.sc?.ahead } },
      fam: { pass: 0, dribble: 0, shoot: 0, defense: 0, body: 0, mind: 0, ...m.fam },
      timing: { perfect: 0, good: 0, miss: 0, ...m.timing },
      goals: m.goals || 0, assists: m.assists || 0, ratingSum: m.ratingSum || 0, rated: m.rated || 0, wins: m.wins || 0, draws: m.draws || 0, losses: m.losses || 0,
    },
    plan: { weeks: p.plan?.weeks || 0, act: { ...p.plan?.act }, cat: { personal: 0, team: 0, school: 0, rest: 0, ...p.plan?.cat },
      exam: { weeks: p.plan?.exam?.weeks || 0, cat: { personal: 0, team: 0, school: 0, rest: 0, ...p.plan?.exam?.cat } } },
    events: Array.isArray(p.events) ? p.events : [],
    endings: Array.isArray(p.endings) ? p.endings : [],
  };
}
// 선택지 난이도 → 안정적(-4 이하) / 보통 / 도전적(5 이상)
export const bandOf = diff => diff <= -4 ? "safe" : diff >= 5 ? "bold" : "mid";
const FAM = { "tech.pass": "pass", "tech.cross": "pass", "mental.teamwork": "pass", "tech.dribble": "dribble", "tech.firstTouch": "dribble", "phys.agility": "dribble",
  "tech.shoot": "shoot", "tech.defense": "defense", "phys.speed": "body", "phys.strength": "body", "phys.jump": "body", "phys.stamina": "body" };
const famOf = stat => FAM[stat] || "mind";
const runOf = state => state?.meta?.run || play?.run || 0;

function snapshot(state) {
  const p = state.player, info = turnInfo(state), r = state.record;
  const rt = (r.ratings || []).filter(x => typeof x === "number");
  const ns = nemesisSummary(state);
  const end = state.finished ? ENDINGS.find(e => e.id === state.career?.ending) : null;
  return {
    run: runOf(state), name: p.name, pos: p.position, detail: DETAIL_POS[p.detailPos]?.label || "", number: p.number || 0,
    ovr: Math.round(ovr(p)), when: info ? label(info) : "졸업", grade: state.calendar.grade, turn: state.calendar.turn,
    captain: !!state.flags?.captain, apps: r.apps || 0, goals: r.goals || 0, assists: r.assists || 0, mom: r.mom || 0,
    rating: rt.length ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length * 100) / 100 : 0,
    school: state.career?.school?.name || "", ending: end ? `${end.grade} ${end.title}` : "", finished: !!state.finished,
    nemesis: ns ? `${ns.name} (${ns.team}) ${ns.W}승 ${ns.D}무 ${ns.L}패` : "",
    morale: Math.round(p.condition?.morale || 0), coach: Math.round(state.relations?.coach || 0),
  };
}

// 게임 쪽에서 부르는 곳: track("newGame"|"plan"|"match"|"event"|"ending"|"week", 자료)
export function track(kind, d) {
  if (!play || !sess?.sid) return;
  try {
    const st = d.state;
    if (kind === "newGame") { play.runs++; play.run = play.runs; st.meta.run = play.run; }
    if (kind === "plan") {
      const info = turnInfo(st);
      play.plan.weeks++;
      if (info?.exam) play.plan.exam.weeks++;
      for (const id of Object.values(d.plan || {})) {
        const a = ACTION_MAP[id];
        if (!a) continue;
        play.plan.act[id] = (play.plan.act[id] || 0) + 1;
        play.plan.cat[a.cat] = (play.plan.cat[a.cat] || 0) + 1;
        if (info?.exam) play.plan.exam.cat[a.cat] = (play.plan.exam.cat[a.cat] || 0) + 1;
      }
    }
    if (kind === "match") {
      const M = play.match, m = d.m, res = d.res || {};
      for (const x of m.my?.log || []) {
        M.n++;
        if (x.auto) { M.auto++; continue; }                           // '알아서 하기'·'결과만 보기'는 성향에서 뺌
        const b = bandOf(x.diff ?? 0);
        M.band[b]++; if (x.ok) M.ok[b]++;
        if (x.no) { M.exp.bold += x.nb / x.no; M.exp.safe += x.ns / x.no; }   // 고를 수 있었던 선택지 비율 (성향 지수의 기준)
        M.sc[x.sc > 0 ? "ahead" : x.sc < 0 ? "behind" : "level"][b]++;
        M.fam[famOf(x.stat)]++;
      }
      for (const t of m.my?.timing || []) if (t in M.timing) M.timing[t]++;
      if (res.minutes > 0) {
        M.games++; M.goals += res.goals || 0; M.assists += res.assists || 0;
        if (typeof res.rating === "number") { M.ratingSum += res.rating; M.rated++; }
        if (res.result === "승") M.wins++; else if (res.result === "무") M.draws++; else if (res.result === "패") M.losses++;
      }
    }
    if (kind === "event") {
      const info = turnInfo(st);
      play.events.push({ r: runOf(st), w: info ? label(info) : "", at: new Date().toISOString(), id: d.id, t: String(d.text || "").slice(0, 70), c: String(d.label || "").slice(0, 60) });
      if (play.events.length > MAX_EVENTS) play.events.splice(0, play.events.length - MAX_EVENTS);
    }
    if (kind === "ending") {
      const e = ENDINGS.find(x => x.id === st.career?.ending);
      if (e && !play.endings.some(x => x.r === runOf(st) && x.id === e.id)) play.endings.push({ r: runOf(st), id: e.id, title: `${e.grade} ${e.title}`, at: new Date().toISOString() });
    }
    now = snapshot(st);
    dirty = true;
  } catch (e) { console.warn("기록 실패", e); }
}

// 서버로 보내기 (한 주가 끝날 때, 화면을 떠날 때)
export async function flush() {
  if (!play || !sess?.sid || !dirty) return;
  if (flushing) return flushing;
  dirty = false;
  flushing = (async () => {
    try {
      const data = now ? { play, now, lastSeen: new Date() } : { play, lastSeen: new Date() };
      await setDoc(`fcg_students/${sess.sid}`, data, await token(), Object.keys(data));
    } catch (e) { dirty = true; console.warn("기록 전송 실패", e); }
  })().finally(() => { flushing = null; });
  return flushing;
}
