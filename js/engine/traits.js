// 경기와 생활 속에서 특성을 얻는 규칙. 얻는 순간 bonus만큼 능력치가 오릅니다.
import { TRAITS, EARNABLE } from "../../data/player.js";
import { STAFF } from "../../data/roster.js";
import { applyGain, expandGains } from "./growth.js";
import { mail } from "../state.js";

// 조건: 상태를 보고 true면 획득
const RULES = {
  champion:   s => s.record.titles.some(t => t.national),
  finisher:   s => s.record.matches.filter(m => m.goals >= 2).length >= 4,
  ace:        s => (s.record.mom || 0) >= 8,
  wall:       s => s.player.position === "DF" && s.record.matches.filter(m => m.status === "start" && m.ga === 0 && m.official).length >= 10,
  playmaker:  s => s.record.assists >= 12,
  clutch:     s => (s.record.clutchGoals || 0) >= 3,
  leadership: s => !!s.flags.captain,
  comeback:   s => !!s.flags.comebackReady,
  ironLungs:  s => (s.record.camps || 0) >= 2 && s.player.stats.phys.stamina >= 65,
  scholar:    s => (s.record.topExams || 0) >= 2,
  modelStudent: s => (s.flags.acad80Weeks || 0) >= 20,
  joker:      s => s.record.matches.filter(m => m.status === "sub").reduce((a, m) => a + (m.goals || 0) + (m.assists || 0), 0) >= 4,
  unsungHero: s => s.player.position === "MF" && s.record.matches.filter(m => (m.stops || 0) >= 3).length >= 8,
  setPiece:   s => (s.record.setPieces || 0) >= 15,
  moodMaker:  s => { const P = s.relations.people || {}; return (P.friend?.value || 0) >= 80 && (P.junior?.value || 0) >= 70; },
  // 단점을 이겨 내는 특성: 단점이 있을 때만 얻고, 얻으면 단점이 사라짐
  strongHeart: s => s.player.traits.includes("timid") && s.record.matches.filter(m => m.big && m.rating >= 7.5).length >= 3,
  diligent:   s => s.player.traits.includes("lazy") && (s.flags.personalWeeks || 0) >= 30,
};
// 얻으면 사라지는 단점
const CURES = { comeback: "glassBody", strongHeart: "timid", diligent: "lazy" };

const LINES = {
  champion:   "우승 메달을 목에 건 날부터, 큰 경기가 덜 무섭다.",
  finisher:   "골문 앞에서 서두르지 않게 됐다. 이제 골키퍼가 먼저 움직이는 게 보인다.",
  ace:        "상대 감독들이 경기 전에 내 등번호부터 확인한다.",
  wall:       "공격수들이 내 쪽으로 오기를 꺼린다.",
  playmaker:  "동료들이 내가 공을 잡으면 먼저 뛰기 시작한다.",
  clutch:     "지고 있을 때 오히려 심장이 차분해진다.",
  leadership: "완장을 차고 나서, 내 말 한마디에 다들 고개를 든다.",
  comeback:   "넘어져 봤으니 일어나는 법도 안다.",
  ironLungs:  "합숙을 두 번 버텼다. 후반 30분에도 다리가 가볍다.",
  scholar:    "운동장에서도 교실에서도 밀리지 않는다. 류봉두 선생님이 웃으셨다.",
  modelStudent: "감독님이 다른 선수들 앞에서 내 성적표 이야기를 꺼내셨다. \"공부하는 놈이 경기도 읽는다.\"",
  joker:      "벤치에서 몸을 풀 때부터 상대 수비가 나를 본다. 들어가면 뭔가 일어난다는 걸, 이제 다들 안다.",
  unsungHero: "골 장면엔 내 이름이 없다. 그래도 경기 끝나고 감독님이 제일 먼저 어깨를 두드린 건 나였다.",
  setPiece:   "공을 내려놓고 숨을 한 번 고른다. 벽이 몇 명인지는 이제 세지 않는다.",
  moodMaker:  "진 날 버스 안, 아무도 말이 없을 때 먼저 농담을 꺼냈다. 몇 명이 웃었다. 그거면 됐다.",
  strongHeart: "결승 휘슬이 울리기 전, 손이 떨리지 않았다. 언제부터였는지는 모르겠다.",
  diligent:   "알람이 울리기 전에 눈이 떠졌다. 운동장에 먼저 나와 있는 게 이제 내 쪽이다.",
};

export function traitInfo(id) {
  return TRAITS[id] ? { ...TRAITS[id], ...(EARNABLE[id] || {}) } : null;
}

// 새로 얻은 특성 목록을 돌려줌
export function checkTraits(state) {
  const p = state.player;
  const got = [];
  for (const [id, rule] of Object.entries(RULES)) {
    if (p.traits.includes(id)) continue;
    let ok = false;
    try { ok = rule(state); } catch { ok = false; }
    if (!ok) continue;
    p.traits.push(id);
    const info = traitInfo(id);
    const changes = [];
    for (const [path, v] of Object.entries(expandGains(state, info.bonus || {}))) changes.push({ path, d: applyGain(state, path, v, { raw: true }) });
    let extra = "";
    const cure = CURES[id];
    if (cure && p.traits.includes(cure)) {
      p.traits.splice(p.traits.indexOf(cure), 1);
      extra = `\n\n'${TRAITS[cure].label}' 특성이 사라졌다.`;
    }
    state.record.earned ||= [];
    state.record.earned.push({ id, turn: state.calendar.turn });
    mail(state, "system", `새 특성: ${info.label}`,
      `${LINES[id] || ""}\n\n(${info.how}) → ${info.desc}${extra}`);
    got.push({ id, label: info.label, desc: info.desc, changes });
  }
  return got;
}
