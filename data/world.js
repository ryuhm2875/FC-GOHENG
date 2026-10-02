// 상대 학교와 무작위 이름. 모두 가상의 이름입니다. 자유롭게 고치셔도 됩니다.

// 전남 권역 주말리그 상대 9팀 (우리 팀까지 10팀이 전반기·후반기에 한 번씩 맞붙습니다)
// strength: 팀 평균 능력치 보정. 0이 보통, +면 강팀
// color: 유니폼 색, color2: 테두리 색 (경기장 위 상대 선수 점의 색)
export const LEAGUE_OPPONENTS = [
  { name: "목포 갈매기FC U-15", strength: 1,  color: "#1E88E5", color2: "#FFFFFF" },
  { name: "목포 유달중",        strength: 0,  color: "#FFFFFF", color2: "#1B5E20" },
  { name: "광양 쇠울중",        strength: 3,  color: "#455A64", color2: "#FFD54F" },
  { name: "광주 빛고을중",      strength: 4,  color: "#FDD835", color2: "#1A237E" },
  { name: "순천 새벽별중",      strength: 3,  color: "#6A1B9A", color2: "#FFFFFF" },
  { name: "장흥 정남진중",      strength: -2, color: "#2E7D32", color2: "#FFFFFF" },
  { name: "해남 땅끝중",        strength: -1, color: "#C62828", color2: "#FFFFFF" },
  { name: "영광 칠산중",        strength: -3, color: "#00897B", color2: "#E0F2F1" },
  { name: "여수 바다솔중",      strength: 2,  color: "#0D47A1", color2: "#81D4FA" },
];

// 진학 연습경기 상대 고등학교 (모두 가상)
// tier: proYouth 프로 산하 유스 / national 전국 강호 / regional 지역 강호 / footballHS 축구부 일반고
export const HIGH_SCHOOLS = [
  { id: "hs_namhae",  name: "남해안FC U-18", tier: "proYouth",   strength: 70, coach: "최동혁 감독", color: "#B71C1C", color2: "#FFD54F" },
  { id: "hs_hannuri", name: "서울 한누리고",  tier: "national",   strength: 67, coach: "정우석 감독", color: "#0D1B4C", color2: "#FFFFFF" },
  { id: "hs_saesol",  name: "경기 새솔고",    tier: "national",   strength: 66, coach: "김태환 감독", color: "#FFFFFF", color2: "#2E7D32" },
  { id: "hs_mudeung", name: "광주 무등빛고",  tier: "regional",   strength: 63, coach: "오상민 감독", color: "#F9A825", color2: "#212121" },
  { id: "hs_neul",    name: "순천 늘푸른고",  tier: "regional",   strength: 62, coach: "배진호 감독", color: "#43A047", color2: "#FFFFFF" },
  { id: "hs_chabat",  name: "보성 차밭고",    tier: "footballHS", strength: 58, coach: "윤기철 감독", color: "#7CB342", color2: "#33691E" },
];

export const HS_TIERS = {
  proYouth:   { label: "프로 산하 유스", order: 4 },
  national:   { label: "전국 강호",     order: 3 },
  regional:   { label: "지역 강호",     order: 2 },
  footballHS: { label: "축구부 일반고",  order: 1 },
};

// 전국 대회 상대
export const NATIONAL_OPPONENTS = [
  { name: "서울 한강중",        strength: 7, color: "#FFFFFF", color2: "#0D47A1" },
  { name: "경기 은하중",        strength: 6, color: "#283593", color2: "#FFFFFF" },
  { name: "부산 파도중",        strength: 5, color: "#0277BD", color2: "#FFFFFF" },
  { name: "대구 달빛중",        strength: 4, color: "#4527A0", color2: "#FFD54F" },
  { name: "인천 갯벌FC U-15",   strength: 6, color: "#212121", color2: "#29B6F6" },
  { name: "울산 고래중",        strength: 8, color: "#1565C0", color2: "#FFEB3B" },
  { name: "강원 설악중",        strength: 2, color: "#2E7D32", color2: "#FFFFFF" },
  { name: "충북 미루나무중",     strength: 1, color: "#9E9D24", color2: "#FFFFFF" },
  { name: "제주 한라FC U-15",   strength: 3, color: "#004D40", color2: "#FFFFFF" },
  { name: "전북 모악산중",      strength: 5, color: "#1B5E20", color2: "#FFEB3B" },
  { name: "대전 한밭별중",      strength: 4, color: "#4A148C", color2: "#FFFFFF" },
  { name: "경남 진주성중",      strength: 3, color: "#B71C1C", color2: "#FFFFFF" },
  { name: "경북 솔뫼중",        strength: 2, color: "#00695C", color2: "#FFFFFF" },
  { name: "세종 호수FC U-15",   strength: 1, color: "#00ACC1", color2: "#004D40" },
];

// 초등학교 팀 (가끔 연습경기 상대. 우리 팀이 조금 우세)
export const ELEMENTARY_OPPONENTS = [
  { name: "고흥 바닷바람FC U-12", strength: -9, color: "#29B6F6", color2: "#FFFFFF" },
  { name: "순천 꿈나무FC U-12",   strength: -8, color: "#FFEE58", color2: "#1B5E20" },
  { name: "벌교 꼬막FC U-12",     strength: -10, color: "#8D6E63", color2: "#FFFFFF" },
  { name: "보성 녹차잎FC U-12",   strength: -9, color: "#9CCC65", color2: "#FFFFFF" },
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
