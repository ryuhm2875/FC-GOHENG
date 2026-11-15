// 랭킹: 엔딩을 본 선수 한 명(한 판)마다 기록 한 장. 게임과 관리자 페이지가 함께 씀 (다른 모듈을 부르지 않음)
// 부문을 더하거나 빼려면 RANK_TABS 만 고치면 됩니다. key 는 서버 기록 칸 이름이라 한 번 정하면 바꾸지 마세요.
//   unit: 숫자 뒤에 붙는 말, dec: 소수 자리, min: 이 경기 수 이상 뛴 선수만 (평균 부문)

export const RANK_TABS = [
  { id: "fw", label: "공격수", icon: "⚽", cats: [
    { key: "goals", label: "득점왕", desc: "3년 총 골", unit: "골" },
    { key: "clutch", label: "극장골", desc: "경기 막판 결승골·동점골 수", unit: "골" },
  ] },
  { id: "mf", label: "미드필더", icon: "🎯", cats: [
    { key: "assists", label: "도움왕", desc: "3년 총 도움", unit: "도움" },
    { key: "engine", label: "엔진", desc: "경기당 공에 관여한 횟수 평균 (10경기 이상)", unit: "회", dec: 1 },
    { key: "both", label: "공수 겸장", desc: "도움 + 가로채기·태클 성공", unit: "회" },
  ] },
  { id: "df", label: "수비수", icon: "🛡️", cats: [
    { key: "wall", label: "통곡의 벽", desc: "가로채기·태클 성공 횟수", unit: "회" },
    { key: "clean", label: "클린시트", desc: "60분 이상 뛴 무실점 경기 수", unit: "경기" },
  ] },
  { id: "all", label: "누구나", icon: "⭐", cats: [
    { key: "rating", label: "평점왕", desc: "평균 평점 (10경기 이상)", unit: "", dec: 2 },
    { key: "mom", label: "MOM", desc: "경기 최우수 선수 횟수", unit: "회" },
    { key: "minutes", label: "철인", desc: "3년 총 출전 시간", unit: "분" },
  ] },
  { id: "school", label: "학교생활", icon: "📚", cats: [
    { key: "exam", label: "평균 시험 점수", desc: "정기고사 평균", unit: "점", dec: 1 },
    { key: "top", label: "상위권", desc: "시험 85점 이상 받은 횟수", unit: "회" },
    { key: "academic", label: "학업", desc: "졸업할 때 학업 능력치", unit: "" },
    { key: "attitude", label: "생활태도", desc: "졸업할 때 생활태도 점수", unit: "" },
    { key: "teacher", label: "담임 선생님", desc: "담임 선생님과의 관계 점수", unit: "" },
  ] },
  { id: "etc", label: "기타", icon: "😂", cats: [
    { key: "injury", label: "최다 부상", desc: "다쳐서 쉰 주 수", unit: "주" },
    { key: "bench", label: "최다 벤치", desc: "명단에 들고 못 뛴 경기 수", unit: "경기" },
    { key: "susp", label: "성적 결장", desc: "성적 때문에 출전 정지된 경기 수", unit: "경기" },
  ] },
];
export const RANK_CATS = RANK_TABS.flatMap(t => t.cats.map(c => ({ ...c, tab: t.id })));
export const catOf = key => RANK_CATS.find(c => c.key === key);

const MIN_GAMES = 10;
const avg = (a, d) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10 ** d) / 10 ** d : null;

// 한 판의 부문별 값 (해당 없으면 null → 그 부문 순위에서 빠짐)
export function rankStats(state) {
  const r = state.record || {}, p = state.player || {}, st = p.stats?.student || {};
  const ms = r.matches || [];
  const played = ms.filter(m => (m.minutes || 0) > 0);
  const stops = played.reduce((a, m) => a + (m.stops || 0), 0);
  const ratings = (r.ratings || []).filter(x => typeof x === "number");
  const inv = played.filter(m => typeof m.involved === "number").map(m => m.involved);
  return {
    goals: r.goals || 0,
    clutch: r.clutchGoals || 0,
    assists: r.assists || 0,
    engine: inv.length >= MIN_GAMES ? avg(inv, 1) : null,
    both: (r.assists || 0) + stops,
    wall: stops,
    clean: played.filter(m => m.minutes >= 60 && m.ga === 0).length,
    rating: ratings.length >= MIN_GAMES ? avg(ratings, 2) : null,
    mom: r.mom || 0,
    minutes: played.reduce((a, m) => a + (m.minutes || 0), 0),
    exam: r.examN ? Math.round(r.examSum / r.examN * 10) / 10 : null,
    top: r.topExams || 0,
    academic: Math.round(st.academic ?? 0),
    attitude: Math.round(st.attitude ?? 0),
    teacher: Math.round(state.relations?.teacher ?? 50),
    injury: r.injuryWeeks || 0,
    bench: ms.filter(m => m.status === "bench" && !m.minutes).length,
    susp: ms.filter(m => m.reason?.includes("학업")).length,
  };
}

// 한 부문의 순위표. rows: [{ id, s: {...}, hidden }] → [{ row, value, place }] (같은 값은 같은 등수)
export function rankList(rows, key, { withHidden = false } = {}) {
  const list = rows
    .filter(x => (withHidden || !x.hidden) && typeof x.s?.[key] === "number")
    .map(row => ({ row, value: row.s[key] }))
    .sort((a, b) => b.value - a.value || String(a.row.at || "").localeCompare(String(b.row.at || "")));
  let place = 0, last = null, n = 0;
  for (const x of list) {                                   // 숨긴 기록은 등수에서 빼고 셈
    if (x.row.hidden) { x.place = null; continue; }
    n++;
    if (x.value !== last) { place = n; last = x.value; }
    x.place = place;
  }
  return list;
}

export const fmtVal = (c, v) => `${typeof v === "number" ? (c.dec ? v.toFixed(c.dec) : v.toLocaleString("ko-KR")) : "-"}${c.unit || ""}`;
