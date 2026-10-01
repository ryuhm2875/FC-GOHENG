// 1년(45턴) 일정. 매년 같은 틀을 쓰고, 학년별 차이는 grades로 거릅니다.
// phase: league1 전반기 주말리그 / summer 하계대회 / league2 후반기 주말리그 / autumn 시즌 정리 / winter 동계대회

export const PHASES = {
  league1: { label: "전반기 주말리그", color: "pitch" },
  summer:  { label: "하계대회",       color: "orange" },
  league2: { label: "후반기 주말리그", color: "pitch" },
  autumn:  { label: "2학기 마무리",     color: "muted" },
  winter:  { label: "동계대회",       color: "orange" },
};

// month, weeks(그 달 턴 수), phase
export const MONTHS = [
  { month: 3,  weeks: 4, phase: "league1" },
  { month: 4,  weeks: 4, phase: "league1" },
  { month: 5,  weeks: 4, phase: "league1" },
  { month: 6,  weeks: 3, phase: "league1" },
  { month: 7,  weeks: 4, phase: "summer"  },
  { month: 8,  weeks: 5, phase: "summer"  },
  { month: 9,  weeks: 4, phase: "league2" },
  { month: 10, weeks: 4, phase: "league2" },
  { month: 11, weeks: 3, phase: "autumn"  },
  { month: 12, weeks: 3, phase: "autumn"  },
  { month: 1,  weeks: 4, phase: "winter"  },
  { month: 2,  weeks: 3, phase: "winter"  },
];

// 정기시험. 중1 1학기는 자유학기라 수행평가 주간으로 바뀝니다.
export const EXAMS = [
  { month: 5,  week: 1, name: "1학기 1차 정기시험", semester: 1 },
  { month: 7,  week: 1, name: "1학기 2차 정기시험", semester: 1 },
  { month: 10, week: 1, name: "2학기 1차 정기시험", semester: 2 },
  { month: 12, week: 1, name: "2학기 2차 정기시험", semester: 2 },
];

// 학교 행사. event: data/events.js 의 이벤트 id (그 주가 시작될 때 반드시 나옴)
// grades: 그 학년에만 / camp: 합숙 훈련 주간 (훈련 효과 1.2배, 피로 1.25배) / hidden: 일정표에 안 보임
export const SCHOOL_DAYS = [
  { month: 3,  week: 2, grades: [1],    event: "t_diary",      label: "첫 생활 일기", hidden: true },
  { month: 4,  week: 2, grades: [1],    event: "retreat",      label: "수련회" },
  { month: 5,  week: 2, grades: [2],    event: "singapore",    label: "싱가포르 국제교류" },
  { month: 5,  week: 4,                 event: "sportsday",    label: "고흥 연합 체육대회" },
  { month: 6,  week: 2, grades: [2],    event: "t_presentation", label: "국어 수행평가 발표", hidden: true },
  { month: 7,  week: 2,                 event: "harmony_camp", label: "대서어울림문화캠프 · 방학식" },
  { month: 7,  week: 3,                 event: "summer_camp",  label: "하계훈련 (합숙)", camp: true },
  { month: 9,  week: 3, grades: [3],    event: "t_counsel",    label: "3자 진로 상담" },
  { month: 11, week: 1, grades: [3],    event: "school_trip",  label: "수학여행" },
  { month: 12, week: 2,                 event: "ski_camp",     label: "스키캠프" },
  { month: 12, week: 3,                 event: "festival",     label: "봉두예술제" },
  { month: 1,  week: 1, grades: [1, 2], event: "graduation",   label: "졸업식 · 방학식" },
  { month: 1,  week: 1, grades: [3],    event: "graduation_me", label: "졸업식" },
  { month: 1,  week: 2, grades: [1, 2], event: "winter_camp",  label: "동계훈련 (합숙)", camp: true },
];

// 방학 (학교 행동을 고를 수 없음). [시작 월, 주] ~ [끝 월, 주]
export const VACATIONS = [
  { from: [7, 3], to: [8, 5], label: "여름방학" },
  { from: [1, 2], to: [2, 3], label: "겨울방학" },
];

// 경기 일정
// comp: league 주말리그 / summer 하계대회 / winter 동계대회 / friendly 연습경기 / hs 진학 연습경기
// stage: group 조별리그 / ko 토너먼트 (지면 그 뒤 주간은 경기가 없어집니다)
// grades: 그 학년에만 열림 (없으면 모든 학년)
// hsChance: 연습경기가 고등학교 팀과의 진학 연습경기로 바뀔 확률 (학년별)
export const MATCHES = [
  // 전반기 주말리그 7라운드
  { month: 3, week: 2, comp: "league" }, { month: 3, week: 4, comp: "league" },
  { month: 4, week: 2, comp: "league" },
  { month: 5, week: 1, comp: "league" }, { month: 5, week: 3, comp: "league" },
  { month: 6, week: 1, comp: "league" }, { month: 6, week: 3, comp: "league" },

  // 중3 진학 연습경기 (고정)
  { month: 4, week: 3, comp: "hs", grades: [3] },
  { month: 6, week: 2, comp: "hs", grades: [3] },

  // 하계대회: 하계훈련 뒤, 조별리그 3경기 → 8강 → 4강 → 결승
  { month: 7, week: 4, comp: "summer", stage: "group", round: "조별리그 1차전" },
  { month: 8, week: 1, comp: "summer", stage: "group", round: "조별리그 2차전" },
  { month: 8, week: 2, comp: "summer", stage: "group", round: "조별리그 3차전" },
  { month: 8, week: 3, comp: "summer", stage: "ko", round: "8강" },
  { month: 8, week: 4, comp: "summer", stage: "ko", round: "4강" },
  { month: 8, week: 5, comp: "summer", stage: "ko", round: "결승" },

  // 후반기 주말리그 7라운드
  { month: 9, week: 1, comp: "league" }, { month: 9, week: 2, comp: "league" },
  { month: 9, week: 3, comp: "league" }, { month: 9, week: 4, comp: "league" },
  { month: 10, week: 1, comp: "league" }, { month: 10, week: 3, comp: "league" },
  { month: 10, week: 4, comp: "league" },

  // 연습경기 (중2는 절반 확률로 고등학교 팀과)
  { month: 11, week: 2, comp: "friendly", hsChance: { 2: 0.5 } },
  { month: 12, week: 1, comp: "friendly", hsChance: { 2: 0.5 } },

  // 동계대회: 졸업식·동계훈련 뒤, 3학년 선배 없이. 조별리그 3경기 → 4강 → 결승
  { month: 1, week: 3, comp: "winter", stage: "group", round: "조별리그 1차전" },
  { month: 1, week: 4, comp: "winter", stage: "group", round: "조별리그 2차전" },
  { month: 2, week: 1, comp: "winter", stage: "group", round: "조별리그 3차전" },
  { month: 2, week: 2, comp: "winter", stage: "ko", round: "4강" },
  { month: 2, week: 3, comp: "winter", stage: "ko", round: "결승" },
];

export const COMPS = {
  league:   { label: "주말리그",     official: true,  tournament: false },
  summer:   { label: "하계대회",     official: true,  tournament: true, name: "전국 중등 하계 축구대회", bonus: 3 },
  winter:   { label: "동계대회",     official: true,  tournament: true, name: "전국 중등 동계 축구대회", bonus: 4 },
  friendly: { label: "연습경기",     official: false, tournament: false },
  hs:       { label: "진학 연습경기", official: false, tournament: false },
};
