// 도입부 장면과 입단 대화. 문장은 자유롭게 고치셔도 됩니다.
//
// {name} 선수 이름, {coach} 감독 이름, {assistant} 코치 이름
// {name|이/가}처럼 쓰면 받침에 맞는 조사가 붙습니다.

// ── 도입부 (영화처럼 흘러가는 장면) ─────────────
// bg: assets/img/ 안의 배경 그림 이름. 없으면 tone 색으로 대신합니다.
export const INTRO = [
  // center: 화면 한가운데에 띄움 / type: 작은 글씨를 한 글자씩 찍음
  { bg: "bg_sea",   tone: "sea",   big: "전라남도 고흥",          small: "조용하고 아름다운 자연이 있는" },
  { bg: "title",    tone: "dawn",  big: "하늘길이 열리는 곳", small: "그러니 우리의 꿈도 더욱 높이 날 수 있겠지." },
  { bg: "bg_field_day", tone: "field", big: "고흥대서중학교",    small: "작지만 큰 꿈을 지닌 학생들이 있다." },
  { bg: "bg_locker", tone: "night", big: "고흥FC U-15",          small: "올봄, 꿈을 품은 유니폼 하나가 새로 걸린다." },
  { bg: null,       tone: "black", big: "3년의 시간",            small: "미래는 네가 만들어 간다.", center: true, type: true },
];

// ── 입단 대화 ─────────────────────────────────
export const TALK = {
  greet: [
    { who: "narr",  text: "3월 첫 주 월요일. 축구부실 문을 열자 땀 냄새와 잔디 냄새가 한꺼번에 밀려왔다." },
    { who: "coach", text: "네가 오늘 온다던 1학년이냐." },
    { who: "coach", text: "이름부터 말해 봐라." },
  ],
  nameAck: [
    { who: "coach", text: "{name}. 목소리는 크네. 좋다." },
    { who: "coach", text: "{assistant}, 선수 명단에 붙일 사진 하나 찍어." },
    { who: "assistant", text: "자, 여기 보고. 웃지 말고… 아니, 그래도 좀 웃어." },
  ],
  position: [
    { who: "coach", text: "초등학교 때 어디서 뛰었냐? 아니, 어디서 뛰고 싶냐가 더 중요하지." },
  ],
  positionAnswers: {
    FW: { say: "앞에서 골 넣는 게 제일 좋아요.", react: "공격수라. 우리 팀 앞자리엔 3학년 형들이 버티고 있다. 골로 증명해라." },
    MF: { say: "가운데서 공 돌리고 패스 넣는 게 좋아요.", react: "미드필더는 제일 많이 뛰는 자리다. 머리도 발도 쉬면 안 된다." },
    DF: { say: "뒤에서 막는 게 더 재밌어요.", react: "수비하겠다는 1학년은 오랜만이네. 수비는 실수 한 번이 실점이다. 집중력 있게." },
  },
  foot: [
    { who: "coach", text: "저기 공 하나 차 봐라. 아무 생각 하지 말고." },
  ],
  footAnswers: {
    R: { say: "(오른발로 힘껏 찬다)", react: "오른발. 디딤발이 좀 흔들리는데, 그건 고치면 된다." },
    L: { say: "(왼발로 감아 찬다)", react: "오, 왼발이네. 왼발잡이는 귀하다. 측면에서 쓸 데가 많아." },
  },
  growth: [
    { who: "coach", text: "마지막으로 하나만 묻자. 넌 스스로 어떤 선수 같냐?" },
  ],
  growthAnswers: {
    early:     { say: "벌써 형들만큼 커요. 지금도 자신 있어요.", react: "일찍 큰 애들은 처음엔 다 잘한다. 문제는 친구들이 따라올 때지." },
    steady:    { say: "특별한 건 없어도, 꾸준히 하는 건 자신 있어요.", react: "그게 제일 어려운 거다. 3년 내내 그 말 지켜 봐라." },
    late:      { say: "지금은 작은데, 크면 달라질 거예요.", react: "늦게 피는 꽃이 있지. 대신 그때까지 버텨야 한다." },
    physical:  { say: "몸싸움은 안 져요.", react: "몸은 타고나는 거라 좋다. 공 다루는 건 따로 연습해야 한다." },
    technical: { say: "공 다루는 건 자신 있어요.", react: "발재간 좋은 애들은 많다. 그걸 경기에서 쓰는 애가 드물지." },
  },
  testIntro: [
    { who: "coach", text: "{assistant}, 기초 체력 측정해." },
    { who: "assistant", text: "운동장 나가자. 금방 끝나." },
    { who: "narr", text: "줄자, 초시계, 콘 몇 개. 측정은 생각보다 빨리 끝났다." },
  ],
  testOutro: [
    { who: "coach", text: "음." },
  ],
  numberIntro: [
    { who: "coach", text: "1학년은 30번 뒤로 번호를 준다. 앞 번호는 실력으로 뺏어 가는 거다." },
  ],
  farewell: [
    { who: "coach", text: "훈련은 평일 방과 후, 주말리그는 주로 토요일이다. 일정표는 늘 확인해 둬라." },
    { who: "coach", text: "그리고 하나 더. 수업 시간에 자는 놈은 경기에 안 내보낸다. 학업이 떨어지면 명단에서 뺀다." },
    { who: "coach", text: "내일부터 나와라." },
  ],
};

// 특성을 보고 감독님이 하는 말
export const TRAIT_REMARK = {
  steelMental: "눈빛이 괜찮다. 쉽게 안 무너지겠어.",
  leadership: "측정하면서 다른 1학년들 챙기더라. 그런 거 좋다.",
  clutch: "마지막 한 바퀴에서 기록이 확 줄었다. 몰릴수록 강한 타입이네.",
  bigGame: "형들이 지켜보니까 오히려 더 잘하던데. 배짱이 있다.",
  diligent: "시키지도 않았는데 콘 정리까지 하고 왔다. 성실하구나.",
  footballIQ: "공 없을 때 어디 서는지 알더라. 축구 머리가 있다.",
  glassBody: "근데 몸이 좀 약해 보인다. 다치지 않게 조심해라.",
  inconsistent: "잘할 때랑 못할 때 차이가 크다. 기복을 줄여야 한다.",
  lazy: "쉬는 시간마다 앉아 있더라. 그 버릇은 고쳐라.",
  timid: "형들 앞에서 너무 위축된다. 기죽지 마라.",
  slump: "가끔 혼자 표정이 어두워지던데. 힘들면 말해라.",
};

// 측정 수치 (능력치로 계산)
export const MEASURES = [
  { label: "50m 달리기",       stat: "phys.speed",      fmt: v => `${(9.0 - (v - 20) * 0.03).toFixed(2)}초` },
  { label: "왕복오래달리기",    stat: "phys.stamina",    fmt: v => `${Math.round(30 + (v - 20) * 1.5)}회` },
  { label: "제자리멀리뛰기",    stat: "phys.jump",       fmt: v => `${Math.round(160 + (v - 20) * 1.4)}cm` },
  { label: "리프팅",           stat: "tech.firstTouch", fmt: v => `${Math.max(3, Math.round(5 + (v - 15) * 2.2))}개` },
  { label: "슈팅 (10번 중 골문 안)", stat: "tech.shoot", fmt: v => `${Math.max(1, Math.min(10, Math.round((v - 5) / 6)))}개` },
];
