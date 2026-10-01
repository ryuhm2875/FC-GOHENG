// 상대 학교와 무작위 이름. 모두 가상의 이름입니다. 자유롭게 고치셔도 됩니다.

// 전남 권역 주말리그 상대 7팀 (우리 팀까지 8팀이 한 번씩 맞붙습니다)
// strength: 팀 평균 능력치 보정. 0이 보통, +면 강팀
export const LEAGUE_OPPONENTS = [
  { name: "여수 바다솔중",     strength: 2 },
  { name: "순천 새벽별중",     strength: 4 },
  { name: "광양 쇠울중",       strength: 3 },
  { name: "목포 갈매기FC U-15", strength: 1 },
  { name: "보성 녹차골중",     strength: -2 },
  { name: "해남 땅끝중",       strength: -1 },
  { name: "완도 청해FC U-15",  strength: -3 },
];

// 진학 연습경기 상대 고등학교 (모두 가상)
// tier: proYouth 프로 산하 유스 / national 전국 강호 / regional 지역 강호 / footballHS 축구부 일반고
export const HIGH_SCHOOLS = [
  { id: "hs_namhae",  name: "남해안FC U-18", tier: "proYouth",   strength: 70, coach: "최동혁 감독" },
  { id: "hs_hannuri", name: "서울 한누리고",  tier: "national",   strength: 67, coach: "정우석 감독" },
  { id: "hs_saesol",  name: "경기 새솔고",    tier: "national",   strength: 66, coach: "김태환 감독" },
  { id: "hs_mudeung", name: "광주 무등빛고",  tier: "regional",   strength: 63, coach: "오상민 감독" },
  { id: "hs_neul",    name: "순천 늘푸른고",  tier: "regional",   strength: 62, coach: "배진호 감독" },
  { id: "hs_chabat",  name: "보성 차밭고",    tier: "footballHS", strength: 58, coach: "윤기철 감독" },
];

export const HS_TIERS = {
  proYouth:   { label: "프로 산하 유스", order: 4 },
  national:   { label: "전국 강호",     order: 3 },
  regional:   { label: "지역 강호",     order: 2 },
  footballHS: { label: "축구부 일반고",  order: 1 },
};

// 전국 대회 상대
export const NATIONAL_OPPONENTS = [
  { name: "서울 한강중",        strength: 7 },
  { name: "경기 은하중",        strength: 6 },
  { name: "부산 파도중",        strength: 5 },
  { name: "대구 달빛중",        strength: 4 },
  { name: "인천 갯벌FC U-15",   strength: 6 },
  { name: "울산 고래중",        strength: 8 },
  { name: "강원 설악중",        strength: 2 },
  { name: "충북 미루나무중",     strength: 1 },
  { name: "제주 한라FC U-15",   strength: 3 },
];

// 성씨 (대략적인 빈도 가중치)
export const SURNAMES = [
  ["김", 21], ["이", 15], ["박", 8], ["최", 5], ["정", 4], ["강", 2.5], ["조", 2.5],
  ["윤", 2], ["장", 2], ["임", 1.8], ["한", 1.5], ["오", 1.4], ["서", 1.3], ["신", 1.3],
  ["권", 1.2], ["황", 1.2], ["안", 1.2], ["송", 1], ["류", 1], ["전", 1], ["홍", 0.9],
  ["고", 0.9], ["문", 0.9], ["양", 0.9], ["손", 0.9], ["배", 0.8], ["백", 0.7], ["허", 0.7],
  ["남", 0.5], ["노", 0.5], ["하", 0.5], ["곽", 0.4], ["성", 0.4], ["차", 0.4], ["주", 0.4],
];

// 2012~2014년생 남자아이에게 흔한 이름
export const GIVEN_NAMES = [
  "민준", "서준", "도윤", "예준", "시우", "하준", "주원", "지호", "지후", "준우",
  "준서", "도현", "건우", "현우", "우진", "선우", "서진", "연우", "유준", "정우",
  "승우", "승현", "시윤", "준혁", "은우", "지환", "승민", "지우", "유찬", "윤우",
  "민성", "수호", "이준", "시후", "진우", "민재", "현준", "지원", "재윤", "태윤",
  "한결", "지안", "은찬", "로운", "하율", "윤호", "태민", "재민", "민혁", "성민",
];
