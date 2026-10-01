// 1년(43턴) 일정. 매년 같은 틀을 쓰고, 학년별 차이는 grades로 거릅니다.
// phase: league1 전반기 주말리그 / summer 하계대회 / league2 후반기 주말리그 / autumn 시즌 정리 / winter 동계대회

export const PHASES = {
  league1: { label: "전반기 주말리그", color: "pitch" },
  summer:  { label: "하계대회",       color: "orange" },
  league2: { label: "후반기 주말리그", color: "pitch" },
  autumn:  { label: "시즌 정리",       color: "muted" },
  winter:  { label: "동계대회",       color: "orange" },
};

// month, weeks(그 달 턴 수), phase
export const MONTHS = [
  { month: 3,  weeks: 4, phase: "league1" },
  { month: 4,  weeks: 4, phase: "league1" },
  { month: 5,  weeks: 4, phase: "league1" },
  { month: 6,  weeks: 3, phase: "league1" },
  { month: 7,  weeks: 4, phase: "summer"  },
  { month: 8,  weeks: 4, phase: "summer"  },
  { month: 9,  weeks: 5, phase: "league2" },
  { month: 10, weeks: 4, phase: "league2" },
  { month: 11, weeks: 3, phase: "autumn"  },
  { month: 12, weeks: 2, phase: "winter"  },
  { month: 1,  weeks: 4, phase: "winter"  },
  { month: 2,  weeks: 2, phase: "winter"  },
];

// 시험 주간. 중1 1학기는 자유학기라 수행평가 주간으로 바뀝니다.
export const EXAMS = [
  { month: 4,  week: 4, name: "1학기 중간고사", semester: 1 },
  { month: 7,  week: 1, name: "1학기 기말고사", semester: 1 },
  { month: 10, week: 2, name: "2학기 중간고사", semester: 2 },
  { month: 12, week: 1, name: "2학기 기말고사", semester: 2 },
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

  // 하계대회: 조별리그 3경기 → 16강 → 8강 → 4강 → 결승
  { month: 7, week: 2, comp: "summer", stage: "group", round: "조별리그 1차전" },
  { month: 7, week: 3, comp: "summer", stage: "group", round: "조별리그 2차전" },
  { month: 7, week: 4, comp: "summer", stage: "group", round: "조별리그 3차전" },
  { month: 8, week: 1, comp: "summer", stage: "ko", round: "16강" },
  { month: 8, week: 2, comp: "summer", stage: "ko", round: "8강" },
  { month: 8, week: 3, comp: "summer", stage: "ko", round: "4강" },
  { month: 8, week: 4, comp: "summer", stage: "ko", round: "결승" },

  // 후반기 주말리그 7라운드
  { month: 9, week: 1, comp: "league" }, { month: 9, week: 2, comp: "league" },
  { month: 9, week: 4, comp: "league" }, { month: 9, week: 5, comp: "league" },
  { month: 10, week: 1, comp: "league" }, { month: 10, week: 3, comp: "league" },
  { month: 10, week: 4, comp: "league" },

  // 연습경기 (중2는 절반 확률로 고등학교 팀과)
  { month: 11, week: 2, comp: "friendly", hsChance: { 2: 0.5 } },
  { month: 12, week: 2, comp: "friendly", hsChance: { 2: 0.5 } },

  // 동계대회: 조별리그 3경기 → 8강 → 4강 → 결승
  { month: 1, week: 1, comp: "winter", stage: "group", round: "조별리그 1차전" },
  { month: 1, week: 2, comp: "winter", stage: "group", round: "조별리그 2차전" },
  { month: 1, week: 3, comp: "winter", stage: "group", round: "조별리그 3차전" },
  { month: 1, week: 4, comp: "winter", stage: "ko", round: "8강" },
  { month: 2, week: 1, comp: "winter", stage: "ko", round: "4강" },
  { month: 2, week: 2, comp: "winter", stage: "ko", round: "결승" },
];

export const COMPS = {
  league:   { label: "주말리그",     official: true,  tournament: false },
  summer:   { label: "하계대회",     official: true,  tournament: true, name: "전국 중등 하계 축구대회", bonus: 3 },
  winter:   { label: "동계대회",     official: true,  tournament: true, name: "전국 중등 동계 축구대회", bonus: 4 },
  friendly: { label: "연습경기",     official: false, tournament: false },
  hs:       { label: "진학 연습경기", official: false, tournament: false },
};
