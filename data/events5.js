// 새 이벤트 3종: 류봉두 선생님의 시험 내기(2부작), 유튜브 개인기 도전, 크로스바 내기
// 형식은 data/events.js와 같습니다. 여기서 새로 쓰는 표시:
//   resolve: (s) => ({ fx, result }) — 확률로 갈리는 선택. 한 번 뽑은 결과로 효과와 문장이 같이 정해짐 (js/engine/events.js)
//   trigger: (s) => true 인 주에 반드시 찾아옴 (앞선 선택을 이어받는 이야기)
//   priority: 날짜·상황으로 찾아오는 이야기끼리 겹칠 때 먼저 나오는 순서
import { turnInfo } from "../js/engine/calendar.js";
import { chance } from "../js/rng.js";

// 다음 주에 정기시험이 있는가 (중1 1학기 수행평가 주간은 빼고)
const examNextWeek = s => { const n = turnInfo(s, 1); return !!n?.exam && !n.exam.free; };
const nextExamName = s => turnInfo(s, 1)?.exam?.name || "정기시험";
// 내기 목표: 지금 학업 + 3 (최대 95). 문장과 기록이 같은 값을 쓰도록 한 곳에서만 계산
const betTarget = s => Math.min(95, Math.round(s.player.stats.student.academic) + 3);
// 결과 판정: 그 시험 주에 받은 점수 (기록이 없으면 지금 학업)
const betScore = s => {
  const b = s.flags?.teacherBet;
  if (b && s.lastExam?.turn === b.examTurn && s.lastExam.score != null) return Math.round(s.lastExam.score);
  return Math.round(s.player.stats.student.academic);
};
// 내기가 걸려 있고 시험 주가 지났으면 결과 이야기. 8주가 지난 내기는 지운다 (묵은 이야기가 뒤늦게 튀어나오지 않게)
const betDue = s => {
  const b = s.flags?.teacherBet;
  if (!b || b.examTurn == null) return false;
  const gap = s.calendar.turn - b.examTurn;
  if (gap > 8) { s.flags.teacherBet = null; return false; }
  return gap > 0;
};
const betWon = s => { const b = s.flags?.teacherBet; return !!b && betScore(s) >= (b.target ?? 0); };

// 결과 이야기는 성공·실패를 나눠 두었으므로(teacher_bet_win / teacher_bet_lose),
// 어느 쪽을 고르든 내기 기록은 여기서 정리함. 예전 저장 파일에 teacherBet이 없어도 안전함
const clearBet = s => { if (s.flags) s.flags.teacherBet = null; };

export const EVENTS_NEW = [
  // ── 류봉두 선생님의 시험 내기 (1화: 제안 / 2화: 결과 — 성공·실패로 나눠 둠) ──
  { id: "teacher_bet_start", bg: "ev_teacher_bet", who: "teacher", school: true, cool: 4, priority: 1,
    trigger: s => examNextWeek(s) && !s.flags?.teacherBet,
    text: s => `종례가 끝나고, {teacher}께서 교탁 위에 아이스크림 컵 하나를 올려놓으신다. 반 아이들 눈이 일제히 그쪽으로 간다. "다음 주 ${nextExamName(s)}. 네 학업 ${betTarget(s)} 넘겨 봐라. 넘기면 우리 반 전원 아이스크림 쏜다. 못 넘기면 내가 아침자습 감독한다. 어때, 해 볼래?"`,
    choices: [
      { label: "해 보겠습니다", fx: { teacher: 3, morale: 4 },
        act: s => { s.flags.teacherBet = { target: betTarget(s), examTurn: s.calendar.turn + 1, startTurn: s.calendar.turn }; },
        result: s => `선생님이 종례 노트에 날짜와 숫자를 적으셨다. 반 아이들이 책상을 두드리며 박자를 맞췄다. 목표는 학업 ${betTarget(s)}. 다음 주 시험 하나로 끝나는 내기다.` },
      { label: "부담스러워서 못 하겠습니다", fx: { teacher: -1, morale: -1, s: { "student.attitude": -1 } },
        result: "선생님이 아이스크림을 다시 가방에 넣으셨다. \"그래, 부담 주려던 건 아니다.\" 반 아이들이 아쉬운 소리를 냈지만, 선생님은 아무 말 없이 교실을 나가셨다." },
    ] },

  // 내기가 걸린 주의 성적이 목표를 넘겼을 때만 열림 (내기 기록은 아래 선택에서 정리)
  { id: "teacher_bet_win", bg: "ev_teacher_bet", who: "teacher", school: true, cool: 4, priority: 3,
    trigger: s => betDue(s) && betWon(s),
    text: s => {
      const target = s.flags?.teacherBet?.target ?? 0, score = betScore(s);
      return `성적표가 돌아왔다. 평균 ${score}점. 시험 전에 건 ${target}을 넘겼다. {teacher}께서 종례 시간에 비닐봉지를 들고 들어오신다. "약속은 지키는 거다. 아이스크림, 줄 서라."`;
    },
    choices: [
      { label: "내 컵부터 챙겨 받는다", act: clearBet,
        fx: { morale: 10, teacher: 4, rel: { friend: 6 }, s: { "student.attitude": 2, "mental.confidence": 1 } },
        result: "아이스크림을 받아 들었다. 반 아이들이 박수를 치며 줄을 섰다. 선생님이 내 컵만 크게 떠 주셨다. \"제일 어려운 걸 해 낸 사람 몫이다.\"" },
      { label: "친구들 것부터 나눠 준다", act: clearBet,
        fx: { morale: 8, teacher: 6, rel: { friend: 9 }, s: { "student.attitude": 2, "mental.teamwork": 1.5 } },
        result: "상자를 뜯어 아이들 손에 하나씩 쥐여 줬다. 마지막 남은 하나를 선생님께 드리자 손사래를 치시며 웃으셨다. \"이건 네가 먹어라. 오늘 반 분위기, 네가 만든 거다.\"" },
    ] },

  // 목표에 닿지 못한 주에만 열림 (내기 기록은 아래 선택에서 정리)
  { id: "teacher_bet_lose", bg: "ev_teacher_bet", who: "teacher", school: true, cool: 4, priority: 3,
    trigger: s => betDue(s) && !betWon(s),
    text: s => {
      const target = s.flags?.teacherBet?.target ?? 0, score = betScore(s);
      return `성적표가 돌아왔다. 평균 ${score}점. ${target}에는 닿지 못했다. {teacher}께서 분필을 조용히 내려놓으신다. "약속은 약속이다. 내일부터 아침 8시, 내가 직접 본다."`;
    },
    choices: [
      { label: "내일 아침 8시에 나오겠다고 한다", act: clearBet,
        fx: { fatigue: 10, morale: -2, teacher: 2, s: { "student.academic": 2, "student.attitude": 1 } },
        result: "다음 날 아침 8시, 교실에는 나와 선생님 둘뿐이었다. 조용한 교실에서 30분 동안 국어 문제집을 풀었다. 30분이 이렇게 길 줄 몰랐다." },
      { label: "다음 시험에서 만회하겠다고 한다", act: clearBet,
        fx: { fatigue: 6, morale: 1, teacher: 3, s: { "student.academic": 1, "mental.confidence": 0.5 } },
        result: "선생님께 다시 한 번 기회를 청했다. 선생님은 잠깐 나를 보시더니 웃으셨다. \"좋다. 대신 다음엔 목표를 더 높여라. 아침자습은 그대로다.\"" },
    ] },

  // ── 유튜브 무회전 킥 따라 하기 (하이리스크 하이리턴) ────────────────
  { id: "trick_kick_challenge", bg: "ev_trick_kick", who: "friend", needs: "friend", weight: 2.2, cool: 16,
    text: "쉬는 시간, {friend|이/가} 휴대폰을 들이민다. \"야, 이거 봐. 무회전 킥이래. 조회수가 300만이야.\" 화면 속 선수가 공을 발등에 얹고 발목을 비틀자, 공이 회전 한 번 없이 일직선으로 날아간다. {friend|은/는} 운동장 쪽을 힐끗 본다. \"한 번 해 볼래?\"",
    choices: [
      { label: "해 본다 (성공하면 대박)", resolve: s => chance(0.4)
        ? { fx: { morale: 10, rel: { friend: 6 }, s: { "tech.dribble": 3, "tech.shoot": 3 } },
            result: "여섯 번째 시도. 발등에 붙인 공이 회전 없이 쭉 뻗어 나갔다. 골대를 한참 지나서야 떨어졌지만, 방향은 정확했다. {friend|이/가} 소리를 질렀다. 오늘만큼은 내가 영상 속 그 선수다." }
        : { fx: { fatigue: 10, morale: -5 },
            result: "공을 밟고 그대로 엉덩방아를 찧었다. 그 꼴을 {friend|이/가} 웃으면서 찍고 있다. 무회전은커녕 무게중심도 못 잡았다. 발등이 얼얼하다." } },
      { label: "기본기부터 다시 다진다", fx: { fatigue: 2, s: { "tech.firstTouch": 1, "position": 0.3 } },
        result: "개인기 대신 벽 리프팅을 백 번 했다. 화려하진 않아도, 발등에 공이 붙는 느낌이 조금 달라졌다. {friend|은/는} \"너 진짜 재미없다\"며 웃었다." },
    ] },

  // ── 크로스바 맞히기 1:1 내기 (하이리스크 하이리턴) ──────────────────
  { id: "crossbar_bet", bg: "ev_crossbar", who: "friend", needs: "friend", weight: 2, cool: 14,
    text: "훈련이 끝난 골대 앞. {friend|이/가} 공을 발밑에 두고 다섯 손가락을 편다. \"크로스바 맞히기, 한 번에 음료수 한 병. 진 쪽이 다음 훈련 물통 담당. 어때, 자신 있어?\" 노을이 골대 위 철망에 걸려 반짝인다.",
    choices: [
      { label: "골대를 노린다", resolve: s => chance(0.5)
        ? { fx: { morale: 12, s: { "tech.shoot": 2, "mental.competitive": 2 } },
            result: "발등으로 감아 찬 공이 골대를 스치며 위로 솟았다. '딸그랑' 소리가 났다. {friend|이/가} 두 손을 머리에 올리고 그대로 주저앉았다. 오늘 훈련의 마지막 장면이 이걸로 정해졌다." }
        : { fx: { fatigue: 12, morale: -6 },
            result: "세 번을 찼고 세 번 다 골망을 흔들었다. 크로스바는 늘 손가락 두 마디만큼 위였다. {friend|이/가} 웃으며 물통 두 개를 내 앞에 놓았다. 다음 훈련은 내가 물통 담당이다." } },
      { label: "구경만 하며 쉰다", fx: { fatigue: -3 },
        result: "잔디에 누워 {friend|이/가} 차는 공을 올려다봤다. 세 번 중 한 번 맞혔다. 웃으면서도 손끝이 근질거렸지만, 다친 데 없이 하루가 끝났다." },
    ] },
];
