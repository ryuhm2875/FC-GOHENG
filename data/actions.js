// 주간 행동 목록. 새 행동은 이 배열에 추가하기만 하면 화면에 나타납니다.
//
// gains   : 오르는 능력치와 기본 상승량 (실제 상승량은 성장 유형·잠재력·피로·사기에 따라 달라짐)
// fatigue : 피로 변화 (음수면 회복)
// morale  : 사기 변화
// coach   : 감독 신뢰도 변화
// risk    : 부상 위험 (0.02 = 2%, 피로가 높을수록 커짐)
// injured : "block" 부상 중 불가 / "only" 부상 중에만 가능 / 없으면 항상 가능

export const CATEGORIES = [
  { id: "personal", label: "개인훈련" },
  { id: "team",     label: "단체훈련" },
  { id: "school",   label: "학교생활" },
  { id: "rest",     label: "휴식" },
];

export const ACTIONS = [
  // 개인훈련
  { id: "shoot", cat: "personal", label: "슈팅 훈련", icon: "⚽", minigame: "shooting",
    desc: "골대 구석을 노리는 반복 슈팅",
    gains: { "tech.shoot": 2.2, "tech.firstTouch": 0.5, "mental.confidence": 0.3 },
    fatigue: 12, risk: 0.012, injured: "block" },
  { id: "pass", cat: "personal", label: "패스 훈련", icon: "🎯", minigame: "passing",
    desc: "짧은 패스와 롱패스, 크로스",
    gains: { "tech.pass": 2.2, "tech.cross": 0.9, "mental.focus": 0.3 },
    fatigue: 10, risk: 0.008, injured: "block" },
  { id: "dribble", cat: "personal", label: "드리블 훈련", icon: "🌀", minigame: "dribble",
    desc: "콘 사이를 빠져나가는 볼 터치",
    gains: { "tech.dribble": 2.2, "phys.agility": 0.9, "tech.firstTouch": 0.6 },
    fatigue: 12, risk: 0.012, injured: "block" },
  { id: "defend", cat: "personal", label: "수비 훈련", icon: "🛡️", minigame: "defend",
    desc: "1 대 1 수비, 위치 잡기",
    gains: { "tech.defense": 2.2, "mental.focus": 0.6, "phys.strength": 0.4 },
    fatigue: 12, risk: 0.012, injured: "block" },
  { id: "sprint", cat: "personal", label: "스프린트 훈련", icon: "⚡", minigame: "sprint",
    desc: "짧은 거리 전력 질주 반복",
    gains: { "phys.speed": 2.0, "phys.agility": 0.8 },
    fatigue: 14, risk: 0.022, injured: "block" },
  { id: "weight", cat: "personal", label: "웨이트 트레이닝", icon: "🏋️", minigame: "weight",
    desc: "하체와 코어 근력",
    gains: { "phys.strength": 2.0, "phys.jump": 1.0, "phys.stamina": 0.4 },
    fatigue: 15, risk: 0.018, injured: "block" },

  // 단체훈련
  { id: "tactics", cat: "team", label: "전술 훈련", icon: "📋",
    desc: "포메이션과 위치 이해. 감독님이 지켜봅니다",
    gains: { "mental.focus": 1.0, "mental.teamwork": 1.0, "tech.defense": 0.7, "tech.pass": 0.5 },
    fatigue: 9, coach: 0.6, risk: 0.006, injured: "block" },
  { id: "scrimmage", cat: "team", label: "연습 경기", icon: "🥅",
    desc: "자체 청백전. 실전 감각이 붙습니다",
    gains: { "position": 0.7, "mental.competitive": 0.8, "mental.confidence": 0.6 },
    fatigue: 16, coach: 0.5, risk: 0.028, injured: "block" },
  { id: "conditioning", cat: "team", label: "체력 훈련", icon: "🏃",
    desc: "운동장 돌기, 셔틀런",
    gains: { "phys.stamina": 2.2, "phys.speed": 0.6, "mental.competitive": 0.4 },
    fatigue: 18, coach: 0.4, risk: 0.015, injured: "block" },

  // 학교생활
  { id: "study", cat: "school", label: "공부", icon: "📚",
    desc: "수업 복습과 문제 풀이",
    gains: { "student.academic": 2.6, "student.attitude": 0.3 },
    fatigue: 3 },
  { id: "assessment", cat: "school", schoolOnly: true, label: "수행평가 준비", icon: "📝",
    desc: "발표, 보고서, 모둠 과제",
    gains: { "student.academic": 1.6, "student.attitude": 1.0, "mental.teamwork": 0.3 },
    fatigue: 4 },
  { id: "reading", cat: "school", label: "독서", icon: "📖",
    desc: "도서관에서 조용히 한 권",
    gains: { "student.academic": 1.0, "mental.focus": 1.0, "mental.confidence": 0.3 },
    fatigue: -4 },
  { id: "schoolEvent", cat: "school", schoolOnly: true, label: "학교 활동", icon: "🏫",
    desc: "학급 행사, 동아리, 봉사",
    gains: { "student.attitude": 1.5, "mental.teamwork": 0.8 },
    fatigue: 4, morale: 5 },

  // 휴식
  { id: "sleep", cat: "rest", label: "수면", icon: "😴",
    desc: "일찍 자고 푹 쉬기",
    gains: {}, fatigue: -25, morale: 2 },
  { id: "family", cat: "rest", label: "가족 시간", icon: "🏠",
    desc: "집밥 먹고 이야기 나누기",
    gains: { "mental.confidence": 0.4 }, fatigue: -18, morale: 8 },
  { id: "hobby", cat: "rest", label: "취미 생활", icon: "🎮",
    desc: "게임, 음악, 친구들과 놀기",
    gains: {}, fatigue: -15, morale: 12, academicLoss: 0.3 },
  // 관계 (needs: 그 사람이 있어야 가능 / rel: 관계 변화)
  { id: "rivalDuel", cat: "personal", label: "라이벌과 1 대 1", icon: "🔥", needs: "rival",
    desc: "{rival|과/와} 남아서 1 대 1. 지기 싫어서 더 뛰게 된다",
    gains: { "position": 0.6, "mental.competitive": 1.0 }, fatigue: 14, risk: 0.018, rel: { rival: 5 }, injured: "block" },
  { id: "mentorTraining", cat: "team", label: "선배와 개인 훈련", icon: "🧭", needs: "mentor",
    desc: "{mentor} 선배가 알려 주는 요령",
    gains: { "position": 0.5, "mental.focus": 0.5 }, fatigue: 11, coach: 0.3, risk: 0.01, rel: { mentor: 8 }, injured: "block" },
  { id: "careJunior", cat: "team", label: "후배 챙기기", icon: "🌱", needs: "junior",
    desc: "{junior}에게 훈련 끝나고 이것저것 알려 주기",
    gains: { "mental.teamwork": 0.9, "student.attitude": 0.5 }, fatigue: 6, coach: 0.4, rel: { junior: 9 } },
  { id: "hangout", cat: "rest", label: "친구와 놀기", icon: "🤝", needs: "friend",
    desc: "{friend|이랑/랑} PC방, 편의점, 바닷가 산책",
    gains: { "mental.confidence": 0.3 }, fatigue: -12, morale: 10, academicLoss: 0.2, rel: { friend: 9 } },

  { id: "rehab", cat: "rest", label: "재활 훈련", icon: "🩹",
    desc: "부상 부위 회복 운동. 복귀가 빨라집니다",
    gains: {}, fatigue: -10, coach: 0.4, heal: 1, injured: "only" },
];

export const ACTION_MAP = Object.fromEntries(ACTIONS.map(a => [a.id, a]));
