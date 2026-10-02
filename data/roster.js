// ─────────────────────────────────────────────────────────────
// 고흥FC 선수 명단 — 선생님께서 직접 고치시는 파일입니다.
// ─────────────────────────────────────────────────────────────
//
// 기준 시점: 주인공이 "중학교 1학년으로 입학하는 해"
//
// cohort (학년 구분)
//   "3학년선배"  주인공이 중1일 때 중3  → 1년 뒤 졸업
//   "2학년선배"  주인공이 중1일 때 중2  → 2년 뒤 졸업
//   "동기"       주인공과 같은 학년
//   "1년후배"    주인공이 중2가 될 때 입학
//   "2년후배"    주인공이 중3이 될 때 입학
//
// position : "FW"(공격수) "MF"(미드필더) "DF"(수비수)   ※ 골키퍼는 이번 버전에서 제외
// number   : 등번호 (1~99, 겹치지 않게)
// ovr      : 종합 능력치. 그 선수가 처음 등장하는 해 기준 (중1 30~40, 중2 45~52, 중3 55~62 정도)
// style    : "스피드" "패서" "파이터" "테크닉" "골잡이" "철벽" 중 하나 (세부 능력치 성향)
// face     : 얼굴 그림 "mate_01" ~ "mate_08" 중 하나
//
// ※ GitHub에 공개되는 파일입니다. 실제 학생 이름 대신 별명이나 가명을 권합니다.

export const ROSTER = [
  // 3학년 선배
  { name: "김태완", cohort: "3학년선배", position: "DF", number: 4,  ovr: 58, style: "철벽",   face: "mate_07" },
  { name: "유휘천", cohort: "3학년선배", position: "DF", number: 5,  ovr: 59, style: "철벽",   face: "mate_05" },
  { name: "연제호", cohort: "3학년선배", position: "DF", number: 3,  ovr: 66, style: "파이터", face: "mate_03" }, // 강자
  { name: "박성연", cohort: "3학년선배", position: "DF", number: 15, ovr: 56, style: "파이터", face: "mate_08" },
  { name: "이부민", cohort: "3학년선배", position: "MF", number: 8,  ovr: 60, style: "패서",   face: "mate_04" }, // 중1 때 주장
  { name: "이구연", cohort: "3학년선배", position: "FW", number: 10, ovr: 60, style: "골잡이", face: "mate_06" },
  { name: "김태현", cohort: "3학년선배", position: "FW", number: 9,  ovr: 66, style: "스피드", face: "mate_02" }, // 강자

  // 2학년 선배
  { name: "정타석", cohort: "2학년선배", position: "MF", number: 6,  ovr: 50, style: "파이터", face: "mate_04" }, // 중2 때 주장
  { name: "박오창", cohort: "2학년선배", position: "MF", number: 14, ovr: 48, style: "패서",   face: "mate_05" },
  { name: "김주현", cohort: "2학년선배", position: "MF", number: 7,  ovr: 49, style: "테크닉", face: "mate_06" },
  { name: "한승채", cohort: "2학년선배", position: "DF", number: 2,  ovr: 49, style: "철벽",   face: "mate_08" },
  { name: "이동현", cohort: "2학년선배", position: "DF", number: 12, ovr: 47, style: "파이터", face: "mate_03" },
  { name: "강희주", cohort: "2학년선배", position: "FW", number: 11, ovr: 55, style: "골잡이", face: "mate_02" }, // 강자
  { name: "양화원", cohort: "2학년선배", position: "MF", number: 13, ovr: 46, style: "테크닉", face: "mate_07" },
  { name: "강교운", cohort: "2학년선배", position: "DF", number: 20, ovr: 46, style: "철벽",   face: "mate_03" },

  // 동기
  { name: "윤남치", cohort: "동기", position: "MF", number: 33, ovr: 42, style: "테크닉", face: "mate_01" }, // 강자
  { name: "정자원", cohort: "동기", position: "MF", number: 44, ovr: 34, style: "패서",   face: "mate_04" },
  { name: "손은창", cohort: "동기", position: "MF", number: 31, ovr: 36, style: "패서",   face: "mate_01" }, // 중3 때 주장 후보
  { name: "진권우", cohort: "동기", position: "DF", number: 40, ovr: 34, style: "파이터", face: "mate_05" },
  { name: "김현오", cohort: "동기", position: "FW", number: 36, ovr: 41, style: "스피드", face: "mate_02" }, // 강자
  { name: "윤웅남", cohort: "동기", position: "FW", number: 37, ovr: 36, style: "골잡이", face: "mate_06" },

  // 1년 후배 (주인공이 중2 될 때 입학)
  { name: "고주희", cohort: "1년후배", position: "DF", number: 39, ovr: 36, style: "철벽",   face: "mate_01" },
  { name: "이경만", cohort: "1년후배", position: "DF", number: 47, ovr: 35, style: "파이터", face: "mate_02" },
  { name: "이창현", cohort: "1년후배", position: "MF", number: 55, ovr: 34, style: "패서",   face: "mate_05" },
  { name: "박추원", cohort: "1년후배", position: "MF", number: 52, ovr: 35, style: "파이터", face: "mate_04" },
  { name: "이영만", cohort: "1년후배", position: "FW", number: 49, ovr: 36, style: "스피드", face: "mate_08" },
  { name: "김하유", cohort: "1년후배", position: "DF", number: 45, ovr: 35, style: "철벽",   face: "mate_07" },
  { name: "최인후", cohort: "1년후배", position: "MF", number: 54, ovr: 34, style: "테크닉", face: "mate_06" },

  // 2년 후배 (주인공이 중3 될 때 입학)
  { name: "임종잔", cohort: "2년후배", position: "FW", number: 42, ovr: 43, style: "골잡이", face: "mate_02" }, // 강자
  { name: "강금총", cohort: "2년후배", position: "FW", number: 61, ovr: 36, style: "스피드", face: "mate_04" },
  { name: "조연태", cohort: "2년후배", position: "DF", number: 58, ovr: 35, style: "철벽",   face: "mate_08" },
  { name: "권송",   cohort: "2년후배", position: "DF", number: 63, ovr: 34, style: "파이터", face: "mate_03" },
  { name: "이만송", cohort: "2년후배", position: "MF", number: 66, ovr: 35, style: "패서",   face: "mate_05" },
  { name: "강범창", cohort: "2년후배", position: "FW", number: 67, ovr: 34, style: "파이터", face: "mate_04" },
];

// 골키퍼 (경기 중계에 이름이 나옵니다). 학년이 지나면 위 학년부터 나섭니다.
// strong: true 인 골키퍼가 골문을 지키면 팀 수비가 조금 단단해집니다.
export const GOALKEEPERS = [
  { name: "조요훈", cohort: "2학년선배" },
  { name: "장만춘", cohort: "동기" },
  { name: "강인서", cohort: "1년후배", strong: true }, // 강자
];

// 학년별 주장 (주인공 학년 기준). 중3은 주장 선거에서 주인공이 떨어지면 이 선수가 주장이 됩니다.
export const CAPTAINS = { 1: "이부민", 2: "정타석", 3: "손은창" };

// 감독·코치 이름도 여기서 바꾸실 수 있습니다.
export const STAFF = {
  coach: "김 감독",
  assistant: "정 코치",
  teacher: "류봉두 선생님",
};
