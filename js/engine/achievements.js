// 업적: 판이 바뀌어도 이 기기에 남는 도전 과제
// check(s, ctx): s는 게임 상태, ctx.end는 졸업(엔딩) 순간인지, ctx.hall은 지금까지 끝낸 판 기록, ctx.endings는 본 엔딩 목록
import { ovr } from "./team.js";

const seen = (s, ids) => ids.every(id => s.seenEvents?.includes(id));
const ms = s => s.record.matches;
const g1StartRatio = s => { const g1 = ms(s).filter(m => m.grade === 1 && m.official); return g1.length ? g1.filter(m => m.status === "start").length / g1.length : 1; };

export const ACHIEVEMENTS = [
  // ── 경기 ──
  { id: "first_goal", icon: "⚽", label: "첫 골", desc: "첫 골을 넣는다", check: s => s.record.goals >= 1 },
  { id: "first_start", icon: "🟧", label: "첫 선발", desc: "선발 명단에 처음 이름을 올린다", check: s => s.record.starts >= 1 },
  { id: "hat_trick", icon: "🎩", label: "해트트릭", desc: "한 경기에서 세 골", check: s => ms(s).some(m => m.goals >= 3) },
  { id: "ten_season", icon: "🔟", label: "두 자릿수 득점", desc: "한 학년에 10골", check: s => [1, 2, 3].some(g => ms(s).filter(m => m.grade === g).reduce((a, m) => a + m.goals, 0) >= 10) },
  { id: "assist_20", icon: "🎯", label: "도움왕", desc: "통산 20도움", check: s => s.record.assists >= 20 },
  { id: "mom_10", icon: "🏅", label: "단골 주인공", desc: "경기 최우수 선수 열 번", check: s => (s.record.mom || 0) >= 10 },
  { id: "rating_95", icon: "✨", label: "완벽한 경기", desc: "평점 9.5 이상", check: s => ms(s).some(m => m.rating >= 9.5) },
  { id: "wall_10", icon: "🧱", label: "철벽", desc: "수비수로 무실점 승리 10번", check: s => s.player.position === "DF" && ms(s).filter(m => m.minutes > 0 && m.ga === 0 && m.result === "승").length >= 10 },
  { id: "apps_50", icon: "👟", label: "50경기", desc: "통산 50경기 출전", check: s => s.record.apps >= 50 },
  { id: "apps_80", icon: "🥾", label: "80경기", desc: "통산 80경기 출전", check: s => s.record.apps >= 80 },
  // ── 우승과 대표 ──
  { id: "league_title", icon: "🏆", label: "주말리그 우승", desc: "주말리그 1위", check: s => s.record.titles.some(t => t.name.includes("주말리그")) },
  { id: "national_title", icon: "🏆", label: "전국 제패", desc: "전국대회 우승", check: s => !!s.flags.nationalChampion },
  { id: "jn_selected", icon: "🎽", label: "전남 대표", desc: "전남 대표로 뽑힌다", check: s => !!s.flags.jnSelected },
  { id: "jn_gold", icon: "🥇", label: "소년체전 금메달", desc: "전남 대표로 금메달", check: s => s.jnCup?.medal === "gold" },
  { id: "national_team", icon: "🇰🇷", label: "태극마크", desc: "청소년 국가대표", check: s => !!s.flags.nationalTeam },
  // ── 성장 ──
  { id: "captain", icon: "Ⓒ", label: "주장", desc: "주장 완장을 찬다", check: s => !!s.flags.captain },
  { id: "bench_captain", icon: "🪑", label: "벤치에서 주장까지", desc: "중1 선발 30% 미만에서 주장이 된다", check: s => !!s.flags.captain && g1StartRatio(s) < 0.3 },
  { id: "number_10", icon: "👕", label: "등번호 10번", desc: "10번을 단다", check: s => s.player.number === 10 || !!s.player.numberHistory?.some(h => h.number === 10) },
  { id: "ovr_80", icon: "💪", label: "에이스의 몸", desc: "종합 능력치 80", check: s => ovr(s.player) >= 80 },
  { id: "no_injury", icon: "🩹", label: "3년 무부상", desc: "한 번도 다치지 않고 졸업", check: (s, c) => c.end && !(s.record.injuryWeeks > 0) },
  { id: "scholar", icon: "📚", label: "우등생", desc: "학업 80 이상으로 졸업", check: (s, c) => c.end && s.player.stats.student.academic >= 80 },
  { id: "pro_youth", icon: "🏟️", label: "프로의 문", desc: "프로 유스팀에 입단한다", check: s => s.career?.school?.tier === "proYouth" },
  // ── 이야기 ──
  { id: "parents", icon: "🍙", label: "효자", desc: "부모님 장면 여섯 개를 모두 본다", check: s => seen(s, ["p_lunchbox", "p_dad_car", "p_mom_stands", "p_dad_injury", "p_mom_note", "p_admission"]) },
  { id: "rival_all", icon: "🔥", label: "라이벌의 끝", desc: "라이벌 이야기 다섯 장면을 모두 본다", check: s => seen(s, ["r_meet", "r_g1_end", "r_g2", "r_g3", "r_farewell"]) },
  { id: "goheung", icon: "🌅", label: "고흥 사람", desc: "고흥 이야기 네 장면을 모두 본다", check: s => seen(s, ["l_launch", "l_geogeum", "l_ssukseom", "l_sunset"]) },
  { id: "callbacks", icon: "🔁", label: "돌아온 인연", desc: "예전 선택이 돌아오는 장면 다섯 개", check: s => (s.seenEvents || []).filter(id => id.startsWith("pay_")).length >= 5 },
  { id: "blessing", icon: "🍀", label: "류봉두의 축복", desc: "담임 선생님의 축복을 받는다", check: s => Object.keys(s.flags.blessed || {}).length > 0 },
  { id: "storyteller", icon: "📖", label: "이야기꾼", desc: "한 판에서 이벤트 120종을 본다", check: s => (s.seenEvents || []).length >= 120 },
  // ── 여러 판 ──
  { id: "endings_5", icon: "🎬", label: "다섯 갈래 길", desc: "서로 다른 엔딩 다섯 개", check: (s, c) => (c.endings || []).length >= 5 },
  { id: "endings_all", icon: "👑", label: "모든 길", desc: "엔딩 열네 개를 모두 본다", check: (s, c) => (c.endings || []).length >= 14 },
  { id: "three_pos", icon: "🔄", label: "멀티 플레이어", desc: "공격수·미드필더·수비수로 각각 졸업한다", check: (s, c) => ["FW", "MF", "DF"].every(p => (c.hall || []).some(h => h.position === p)) },
];

// 아직 없는 업적 가운데 이번에 새로 달성한 것들
export function newAchievements(state, have, ctx = {}) {
  if (!state) return [];
  return ACHIEVEMENTS.filter(a => !have.has(a.id) && (() => { try { return a.check(state, ctx); } catch { return false; } })());
}
