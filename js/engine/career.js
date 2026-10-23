// 진로: 진학 상담(중3 10월), 국가대표 선발(중3 12월), 엔딩 판정(졸업)
import { HIGH_SCHOOLS, HS_TIERS } from "../../data/world.js";
import { ENDINGS } from "../../data/endings.js";
import { DETAIL_POS, POSITIONS } from "../../data/player.js";
import { STAFF } from "../../data/roster.js";
import { mail, mailFrom } from "../state.js";
import { ovr } from "./team.js";
import { person } from "./relations.js";
import { clamp, getPath } from "../rng.js";
import { ukey } from "../userkey.js";

export const MILESTONES = {
  guide:     { grade: 3, month: 9,  week: 1 },
  admission: { grade: 3, month: 10, week: 4 },
  national:  { grade: 3, month: 12, week: 2 },
  detail:    { grade: 2, month: 9,  week: 1 },     // 세부 포지션 면담 (2학년 하계대회가 끝난 뒤). 그 뒤에 불러온 저장도 다음 주에 면담
};
const at = (info, m) => info && info.grade === m.grade && info.month === m.month && info.week === m.week;

const TIER_NEED = { proYouth: 82, national: 74, regional: 63, footballHS: 48 };
const BEST_RANK = { "우승": 6, "준우승": 5, "결승": 5, "4강": 4, "8강": 3, "16강": 2, "토너먼트 진출": 1, "조별리그 탈락": 0, "조별리그": 0 };

const has = w => { const c = String(w).charCodeAt(String(w).length - 1); if (/[0-9]/.test(String(w).at(-1))) return "013678".includes(String(w).at(-1)); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
const j = (w, a, b) => w + (has(w) ? a : b);

// 주가 넘어갈 때 호출: 진로 관련 일정 처리
export function careerMilestones(state, info) {
  const p = state.player;
  if (at(info, MILESTONES.guide)) {
    mail(state, "coach", "진학 이야기 좀 하자",
      `이제 슬슬 고등학교 생각을 해야 할 때다.\n\n10월 말에 진학 상담을 한다. 그때까지 보여 주는 게 전부라고 생각해라. 고등학교 감독님들은 경기만 보지 않는다. 훈련 태도, 성적표, 다 물어보신다.\n\n${outlook(state)}`);
  }
  if (at(info, MILESTONES.admission)) {
    state.pending = { type: "admission" };
    mail(state, "coach", "진학 상담", "상담실로 와라. 네가 갈 수 있는 학교들 정리해 뒀다. 마지막엔 네가 정하는 거다.");
  }
  if (at(info, MILESTONES.national)) {
    const r = nationalSelection(state);
    state.flags.nationalTeam = r.selected;
    state.career.national = r;
    state.pending = { type: "national" };
  }
}

// 세부 포지션 면담: 2학년 하계대회가 끝난 뒤 (그 주에 다른 이야기가 있으면 다음 주로). 예전 저장도 이 시기가 지났으면 다음 주에
export function detailMeeting(state, info) {
  const p = state.player;
  if (state.pending || state.pendingEvent || p.detailPos || !info) return;
  if (!(info.grade > 2 || (info.grade === 2 && (info.month >= 9 || info.month <= 2)))) return;
  state.pending = { type: "detail" };
  mail(state, "coach", "감독실로 와라", `${info.grade === 2 && info.month === 9 ? "하계대회 끝났으니 " : ""}이야기 좀 하자. 겁먹을 일은 아니다. 네가 앞으로 어디서 뛸지 정하려고 부르는 거다.`);
}

// ── 세부 포지션 (2학년 하계대회 뒤 면담) ──
// 포지션마다 고를 수 있는 자리. 윙어·풀백은 왼쪽·오른쪽을 한 번 더 고름
export const DETAIL_GROUPS = {
  FW: [["poacher"], ["target"], ["second"]],
  MF: [["winger_l", "winger_r"], ["am"], ["b2b"], ["dm"]],
  DF: [["cb"], ["bcb"], ["fb_l", "fb_r"]],
};
const GROUP_LABEL = { winger: "윙어", fb: "풀백" };
// 최근 경기 기록이 어울리는 자리 (골이 많으면 포처·타깃형, 도움이 많으면 패스하는 자리, 막아 낸 게 많으면 수비 쪽)
const REC_FIT = { poacher: "goals", target: "goals", second: "assists", winger: "assists", am: "assists", b2b: "involved", dm: "stops", cb: "stops", bcb: "assists", fb: "assists" };
export function detailOptions(state, pos = state.player.position) {
  const p = state.player;
  const recent = state.record.matches.filter(x => x.minutes > 0).slice(-12);          // 최근 12경기
  const n = Math.max(1, recent.length), sum = k => recent.reduce((a, x) => a + (x[k] || 0), 0);
  const rec = { games: recent.length, goals: sum("goals"), assists: sum("assists"), stops: sum("stops"), involved: sum("involved"),
    rating: recent.length ? Math.round(recent.reduce((a, x) => a + (x.rating || 6), 0) / recent.length * 100) / 100 : null };
  const per = { goals: rec.goals / n, assists: rec.assists / n, stops: rec.stops / n, involved: rec.involved / n };
  const scale = { goals: 12, assists: 14, stops: 2.5, involved: 1.2 };
  const list = (DETAIL_GROUPS[pos] || []).map(keys => {
    const d = DETAIL_POS[keys[0]], g = d.group || keys[0];
    const fit = Object.entries(d.fit).reduce((a, [k, w]) => a + getPath(p.stats, k) * w, 0);
    const bonus = Math.min(4, per[REC_FIT[g]] * scale[REC_FIT[g]]);
    return { keys, group: g, label: GROUP_LABEL[g] || d.label, desc: d.desc, why: d.why,
      score: Math.round((fit + bonus) * 10) / 10, side: keys.length > 1 };
  }).sort((a, b) => b.score - a.score);
  const sideRec = p.foot === "L" ? "L" : "R";                 // 왼발잡이는 왼쪽, 오른발잡이는 오른쪽에서 크로스 올리기 편함
  // 다른 큰 포지션: 그 포지션 기준 종합 능력치 (지금보다 2 넘게 높으면 감독님이 먼저 권함)
  const now = ovr(p);
  const others = ["FW", "MF", "DF"].filter(x => x !== pos).map(x => ({ pos: x, label: POSITIONS[x].label, ovr: Math.round(ovr(p, x)), diff: Math.round(ovr(p, x) - now) })).sort((a, b) => b.ovr - a.ovr);
  return { list, rec, sideRec, others, suggest: others[0].diff >= 2 ? others[0] : null };
}
export function chooseDetail(state, key) {
  const d = DETAIL_POS[key], p = state.player;
  if (!d) return { ok: false };
  const moved = d.pos !== p.position ? { from: p.position, to: d.pos } : null;   // 포지션 변경 (공격수 ↔ 미드필더 ↔ 수비수)
  if (moved) {
    p.position = d.pos;
    (state.flags.posChanges ||= []).push({ turn: state.calendar.turn, ...moved });
    mail(state, "assist", "포지션 바꾼 첫 주", `${POSITIONS[moved.from].label}에서 ${POSITIONS[moved.to].label}로 옮겼으니, 한동안은 주전 경쟁부터 다시다.\n\n훈련은 새 포지션 기준으로 잡아라. 몸이 기억하는 습관은 금방 안 빠진다. 서두르지 말고.`);
  }
  p.detailPos = key;
  state.pending = null;
  mail(state, "coach", `오늘부터 ${d.label}`, `오늘부터 너는 ${j(d.label, "이다", "다")}. 경기장에서 서는 자리도, 해야 할 일도 조금씩 달라진다.\n\n자리가 정해졌다고 다른 걸 놓으면 안 된다. 그 자리에서 제일 잘하는 선수가 돼라.`);
  return { ok: true, d, moved };
}
export const detailLabel = p => (p?.detailPos && DETAIL_POS[p.detailPos]?.pos === p.position ? DETAIL_POS[p.detailPos].label : null);

// 감독님이 돌려서 말하는 진학 전망
function outlook(state) {
  const o = ovr(state.player);
  if (o >= 75) return "솔직히 말하면, 너를 궁금해하는 곳이 꽤 있다. 들뜨지만 마라.";
  if (o >= 67) return "좋은 학교 문 앞까지는 왔다. 마지막 한 걸음은 남은 경기에서 만들어라.";
  if (o >= 57) return "지역에서 이름 있는 학교들은 충분히 노려 볼 만하다. 다만 방심하면 순식간이다.";
  return "지금은 선택지가 많지 않다. 그래도 아직 시간이 있다. 남은 두 달을 버리지 마라.";
}

export function bestTournament(state) {
  return state.record.tournaments.reduce((b, t) => Math.max(b, BEST_RANK[t.best] ?? 0), 0);
}

// 학교별 진학 가능 여부
export function schoolOptions(state) {
  const p = state.player, o = ovr(p);
  const recommend = state.relations.coach >= 70 && p.stats.student.attitude >= 60;
  const best = bestTournament(state);
  const list = HIGH_SCHOOLS.map(s => {
    const sc = state.scouting[s.id];
    let need = TIER_NEED[s.tier];
    const notes = [];
    if (recommend) { need -= 3; notes.push("감독님 추천서 −3"); }
    if (p.stats.student.academic >= 80) { need -= 2; notes.push("학업 우수 추천 가산 −2"); }
    if (state.flags.jnSelected) { need -= 2; notes.push("전남 대표 경력 −2"); }
    if (state.marks?.book_read && (state.relations.teacher ?? 50) >= 60) { need -= 1; notes.push("담임 선생님 추천서 −1"); }
    if (state.goals?.done?.award) { need -= 1; notes.push("우수선수상 −1"); }
    if (p.stats.student.attitude < 40) { need += 3; notes.push("생활태도 부족 +3"); }
    if (p.stats.student.academic < 30) { need += 2; notes.push("학업 부족 +2"); }
    if (sc?.interest) { const d = Math.min(5, Math.floor(sc.interest / 15)); if (d) { need -= d; notes.push(`관심도 −${d}`); } }
    if ((s.tier === "national" || s.tier === "proYouth") && best >= 3) { need -= 2; notes.push("전국대회 8강 이상 −2"); }
    const base = TIER_NEED[s.tier], cap = { proYouth: 6, national: 8 }[s.tier];       // 상위 학교는 가산을 다 모아도 이만큼까지만 낮아짐 (실력이 모자란데 서류로만 가지 않게)
    if (cap != null && base - need > cap) { need = base - cap; notes.push(`가산 최대 −${cap}`); }
    const offered = !!sc?.offered;
    return { ...s, tierLabel: HS_TIERS[s.tier].label, need, ok: offered || o >= need, offered, notes, interest: sc?.interest || 0 };
  });
  list.push({ id: "general", name: "순천 일반고 (일반 진학)", tier: "general", tierLabel: "일반고",
    need: null, ok: true, notes: [p.stats.student.academic >= 70 ? "성적이 좋아 원하는 학교를 고를 수 있음" : "축구부 없이 공부로 진학"] });
  return { ovr: o, recommend, list };
}

export function chooseSchool(state, id) {
  const opts = schoolOptions(state).list;
  const s = opts.find(x => x.id === id && x.ok);
  if (!s) return { ok: false };
  state.career.school = { id: s.id, name: s.name, tier: s.tier, tierLabel: s.tierLabel };
  state.pending = null;
  if (s.tier !== "general") {
    mailFrom(state, s.coach || "고등학교", "scout", `${s.name} 합격`,
      `${state.player.name}, 반갑다. 내년 봄부터 같이 운동한다.\n\n중학교에서 했던 대로만 해라. 졸업할 때까지 몸 관리 잘하고.`);
  }
  mail(state, "coach", "결정했구나",
    s.tier === "general"
      ? "축구를 그만두는 게 아니라, 다른 길로 가는 거다. 3년 동안 고생 많았다. 운동장은 언제든 열려 있다."
      : `${j(s.name, "이면", "면")} 좋은 선택이다. 거기서도 지금처럼만 해라. 졸업할 때까지는 아직 고흥FC 선수다. 끝까지 뛰어라.`);
  return { ok: true, school: s };
}

// U-15 국가대표 선발 평가
export function nationalSelection(state) {
  const p = state.player, o = ovr(p);
  const g3 = state.record.matches.filter(m => m.grade === 3 && m.rating != null);
  const avg = g3.length ? g3.reduce((a, m) => a + m.rating, 0) / g3.length : 6;
  const best = bestTournament(state);
  const mental = (p.stats.mental.focus + p.stats.mental.competitive + p.stats.mental.teamwork + p.stats.mental.confidence) / 4;
  const score = o * 0.6 + (avg - 6.5) * 8 + best * 1.2 + (mental - 50) * 0.15 + (g3.filter(m => m.mom).length) * 0.4;
  return { score: Math.round(score * 10) / 10, selected: score >= 60 && o >= 77, ovr: Math.round(o), avg: Math.round(avg * 100) / 100, best };
}

// 3년 요약 (엔딩 판정과 문장에 씀)
export function summarize(state) {
  const p = state.player, r = state.record;
  const g3 = r.matches.filter(m => m.grade === 3 && m.official);
  const g3Played = g3.filter(m => m.rating != null);
  const school = state.career.school || { name: "고등학교", tier: "none" };
  return {
    name: p.name, nameEun: j(p.name, "은", "는"), nameEul: j(p.name, "을", "를"), nameIrane: j(p.name, "이라는", "라는"),
    schoolName: school.name, schoolEun: j(school.name, "은", "는"), tier: school.tier,
    ovr: Math.round(ovr(p)), apps: r.apps, goals: r.goals, assists: r.assists,
    g3StartRatio: g3.length ? g3.filter(m => m.status === "start").length / g3.length : 0,
    g3Rating: g3Played.length ? g3Played.reduce((a, m) => a + m.rating, 0) / g3Played.length : 6,
    g3LeagueTitle: r.leagues.some(l => l.grade === 3 && l.rank === 1),
    captain: !!state.flags.captain, wore10: !!state.flags.wore10, nationalChampion: !!state.flags.nationalChampion,
    nationalTeam: !!state.flags.nationalTeam, wasBenchInG1: !!state.flags.wasBenchInG1,
    academic: p.stats.student.academic, attitude: p.stats.student.attitude,
    injuryWeeks: r.injuryWeeks || 0, suspended: r.matches.filter(m => m.reason?.includes("학업")).length,
    teacherName: STAFF.teacher, friendName: person(state, "friend")?.name, juniorName: person(state, "junior")?.name, rivalName: person(state, "rival")?.name,
    height: p.body.height, titles: r.titles, teacher: state.relations.teacher ?? 50,
    earned: (r.earned || []).length,
  };
}

export function decideEnding(state) {
  const c = summarize(state);
  const e = ENDINGS.find(x => { try { return x.cond(c); } catch { return false; } });
  state.career.ending = e.id;
  return { ending: e, c };
}

// 졸업식 날 담임 선생님 편지 (관계에 따라 다름)
export function teacherLetter(state) {
  const t = state.relations.teacher ?? 50, n = state.player.name;
  const sign = `— ${STAFF.teacher.replace(/\s*선생님$/, "")}`;
  if (t >= 70) return `${n}에게.\n\n3년 동안 운동장에서 제일 먼저 뛰고, 교실에서도 끝까지 버티던 너를 기억한다. 넘어지는 날도 있었지. 그래도 너는 매번 일어났다.\n\n고등학교에 가서도 그 모습 그대로면 된다. 그리고 나중에, 어른이 되어서 꼭 선생님을 찾아와라. 어떻게 컸는지 직접 보고 싶다.\n\n${sign}`;
  if (t >= 45) return `${n}에게.\n\n축구화 끈 묶는 손이 3년 사이에 많이 커졌더라. 운동장에서 보낸 시간만큼 교실에서 보낸 시간도 너를 만들었다는 걸, 언젠가는 알게 될 거다.\n\n어디서 뛰든 응원한다. 시간이 지나 생각나면 꼭 한번 선생님을 찾아와라.\n\n${sign}`;
  return `${n}에게.\n\n솔직히 말하면, 교실에서는 너와 이야기할 기회가 많지 않았다. 그게 내내 마음에 걸렸다. 그래도 운동장에서 뛰는 너를 창문으로 자주 봤다.\n\n다음 3년은 공도 사람도 조금 더 가까이 두고 지내라. 그렇게 될 거라고 믿는다. 그리고 언제든 좋으니 꼭 선생님을 찾아와라. 그때는 못다 한 이야기를 길게 하자.\n\n${sign}`;
}

// 엔딩 도감 (이 기기에 저장)
const KEY = "gfc_endings";
export function seenEndings() { try { return JSON.parse(localStorage.getItem(ukey(KEY)) || "[]"); } catch { return []; } }
export function markEnding(id) {
  try { const s = new Set(seenEndings()); s.add(id); localStorage.setItem(ukey(KEY), JSON.stringify([...s])); } catch {}
}
