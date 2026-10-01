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
    mentor: person(state, "mentor")?.name || mates[4] || "선배", junior: person(state, "junior")?.name || mates[5] || "후배",
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

// 경기 결과 단톡방 첫머리 대화
export function afterMatchChat(state, res) {
  const v = vars(state);
  const keys = [res.result === "승" ? "win" : res.result === "패" ? "loss" : "draw"];
  if (res.goals > 0) keys.unshift("myGoal");
  else if (res.rating != null && res.rating < 6.0) keys.push("myBad");
  return fillJ(pick(AFTER_MATCH[keys[0]]), v);
}
