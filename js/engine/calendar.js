// 일정 계산: 학년마다 45턴짜리 달력을 펼쳐 놓고 현재 위치를 찾습니다.
import { MONTHS, EXAMS, MATCHES, PHASES, COMPS, SCHOOL_DAYS, VACATIONS } from "../../data/calendar.js";

export const TURNS_PER_YEAR = MONTHS.reduce((s, m) => s + m.weeks, 0);

// 한 해 턴 목록 (학년과 무관한 틀). matches에는 그 주의 후보 경기가 모두 들어 있음
export const YEAR = (() => {
  const list = [];
  for (const m of MONTHS) {
    for (let w = 1; w <= m.weeks; w++) {
      const exam = EXAMS.find(e => e.month === m.month && e.week === w) || null;
      const matches = MATCHES.filter(x => x.month === m.month && x.week === w);
      list.push({ index: list.length, month: m.month, week: w, phase: m.phase, exam, matches });
    }
  }
  return list;
})();

// 중3은 1월 졸업식 주간이 마지막 턴
export const GRAD_INDEX = YEAR.findIndex(s => s.month === 1 && s.week === 1);
export const TOTAL_TURNS = TURNS_PER_YEAR * 2 + GRAD_INDEX + 1;

const ord = (m, w) => ((m + 9) % 12) * 10 + w;        // 3월=0 기준 순서
export function vacationOf(month, week) {
  const o = ord(month, week);
  return VACATIONS.find(v => o >= ord(...v.from) && o <= ord(...v.to)) || null;
}
export function schoolDayOf(grade, month, week) {
  return SCHOOL_DAYS.filter(d => d.month === month && d.week === week && (!d.grades || d.grades.includes(grade)));
}

// 같은 단계(전반기·후반기) 안에서 몇 번째 리그 경기인지
function leagueRound(slot) {
  if (!slot.matches.some(x => x.comp === "league")) return null;
  return YEAR.filter(s => s.phase === slot.phase && s.index <= slot.index && s.matches.some(x => x.comp === "league")).length - 1;
}

export function turnInfo(state, offset = 0) {
  const t = state.calendar.turn - 1 + offset;            // 0부터
  if (t >= TOTAL_TURNS || t < 0) return null;
  const grade = Math.floor(t / TURNS_PER_YEAR) + 1;
  const slot = YEAR[t % TURNS_PER_YEAR];
  const semester = [3, 4, 5, 6, 7].includes(slot.month) ? 1 : 2;
  let exam = slot.exam;
  if (exam && grade === 1 && exam.semester === 1) {
    exam = { ...exam, name: "1학기 수행평가 주간", free: true };
  }
  const match = slot.matches.find(x => !x.grades || x.grades.includes(grade)) || null;
  return {
    turn: t + 1, grade, semester, index: slot.index, month: slot.month, week: slot.week, phase: slot.phase, exam, match,
    leagueRound: match?.comp === "league" ? leagueRound(slot) : null,
    phaseLabel: PHASES[slot.phase].label,
    comp: match ? COMPS[match.comp] : null,
    vacation: vacationOf(slot.month, slot.week), school: schoolDayOf(grade, slot.month, slot.week),
    camp: schoolDayOf(grade, slot.month, slot.week).some(d => d.camp),
    lastWeek: t + 1 === TOTAL_TURNS,
  };
}

export const label = info => `중${info.grade} ${info.month}월 ${info.week}주차`;

export function upcoming(state, n = 6) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const info = turnInfo(state, i);
    if (!info) break;
    if (info.match || info.exam || info.school.some(d => !d.hidden)) out.push(info);
  }
  return out;
}

export function yearTurns(grade) {
  return YEAR.map((slot, i) => ({ ...slot, turn: (grade - 1) * TURNS_PER_YEAR + i + 1 }));
}
