// 일상 메시지와 경기 뒤 단톡방 대화
import { LIFE, AFTER_MATCH } from "../../data/messages.js";
import { STAFF } from "../../data/roster.js";
import { mail, mailFrom } from "../state.js";
import { person } from "./relations.js";
import { activeRoster } from "./team.js";
import { pick, shuffle } from "../rng.js";

const bat = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
const fillJ = (t, v) => t.replace(/\{(\w+)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => { const x = v[k] ?? ""; return a ? x + (bat(x) ? a : b) : x; });

function vars(state) {
  const mates = shuffle(activeRoster(state).map(m => m.name));
  return {
    name: state.player.name, coach: STAFF.coach, assistant: STAFF.assistant, teacher: STAFF.teacher,
    friend: person(state, "friend")?.name || mates[2] || "친구", rival: person(state, "rival")?.name || mates[3] || "동기",
    mentor: person(state, "mentor")?.name || STAFF.assistant,
    junior: person(state, "junior")?.name || mates[5] || "후배",   // 멘토 선배가 없으면 코치님이 그 말을 함
    mate: mates[0] || "동료", mate2: mates[1] || "동료",
  };
}
const REL = ["friend", "rival", "mentor", "junior"];

// 한 주 끝에 가끔: 조건 맞는 일상 메시지 하나
export function lifeMail(state, info) {
  state.lifeLog ||= {};
  const list = LIFE.filter(x => {
    if (x.when?.months && !x.when.months.includes(info.month)) return false;
    if (x.when?.grades && !x.when.grades.includes(info.grade)) return false;
    if (x.from === "teacher" && info.vacation) return false;          // 방학에는 담임 선생님 학교 이야기 없음
    if (x.school && info.vacation) return false;                      // 숙제·급식·수업 이야기도 학기 중에만
    if (REL.includes(x.from) && !person(state, x.from)) return false;
    const last = state.lifeLog[x.id];
    if (last != null && state.calendar.turn - last < 30) return false;
    try { if (x.cond && !x.cond(state)) return false; } catch { return false; }
    return true;
  });
  if (!list.length) return false;
  const x = pick(list);
  const v = vars(state);
  const body = fillJ(x.body, v), title = fillJ(x.title, v);
  if (REL.includes(x.from)) mailFrom(state, person(state, x.from).name, "friend", title, body);
  else if (x.from === "news") mailFrom(state, "고흥 소식", "news", title, body);
  else mail(state, x.from, title, body);
  state.lifeLog[x.id] = state.calendar.turn;
  return true;
}

// 대회 진행 상황에 맞는 단톡방 주제 (없으면 null)
function stageKey(state, res, fx) {
  if (!fx) return null;
  const won = res.result === "승" || (res.shootout && res.shootout.win);
  if (fx.comp === "summer" || fx.comp === "winter") {
    const t = state.tour;
    if (fx.ko) {
      if (fx.round === "결승") return won ? "champion" : "runnerUp";
      if (!won) return res.shootout ? "koOutPk" : "koOut";
      return fx.round === "4강" ? "toFinal" : "koWin";
    }
    if (t && t.groupPlayed === 3) return t.stage === "ko" ? "advance" : "groupOut";
    return won ? "groupWin" : res.result === "무" ? "groupDraw" : "groupLoss";
  }
  if (fx.elementary) return won ? "elemWin" : res.result === "무" ? "elemDraw" : "elemLoss";
  if (fx.comp === "hs") return res.minutes > 0 ? pick(["hsMe", "hs"]) : "hs";
  if (fx.comp === "league" && state.league?.finished && state.league.finalRank === 1 && state.league.key?.startsWith(`${res.grade}-`)) return "leagueTitle";
  return null;
}

// 경기 결과 단톡방 첫머리 대화
// 다른 모듈에서 단톡방 문장을 만들 때 ({name}, {friend}, {mate} … 채우기)
export const chatText = (state, t) => fillJ(t, vars(state));

export function afterMatchChat(state, res, fx = null, lastOfAll = false) {
  const v = vars(state);
  const parts = [];
  const stage = stageKey(state, res, fx);
  if (stage && AFTER_MATCH[stage]) parts.push(fillJ(pick(AFTER_MATCH[stage]), v));
  else parts.push(fillJ(pick(AFTER_MATCH[res.result === "승" ? "win" : res.result === "패" ? "loss" : "draw"]), v));
  // 내 활약 이야기는 뒤에 덧붙임
  if (res.goals >= 3) parts.push(fillJ(pick(AFTER_MATCH.myHat), v));
  else if (res.goals > 0) parts.push(fillJ(pick(AFTER_MATCH.myGoal), v));
  else if (res.rating != null && res.rating < 6.0) parts.push(fillJ(pick(AFTER_MATCH.myBad), v));
  if (res.injury) parts.push(fillJ("{friend}: {name} 괜찮냐?? 많이 아프냐\n\n{assistant}: 병원 다녀왔다. 다들 너무 걱정 마라", v));
  if (lastOfAll) parts.push(fillJ("{junior}: 형 마지막 경기 수고하셨어요 ㅠㅠ\n\n{friend}: 3년 끝… 이상하다 진짜", v));
  return parts.join("\n\n");
}
