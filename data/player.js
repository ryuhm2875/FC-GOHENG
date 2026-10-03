// 포지션, 성장 유형, 특성, 능력치 이름

export const STAT_GROUPS = [
  { id: "tech", label: "기술", stats: [
    ["dribble", "드리블"], ["pass", "패스"], ["shoot", "슈팅"],
    ["firstTouch", "퍼스트터치"], ["cross", "크로스"], ["defense", "수비"] ] },
  { id: "phys", label: "피지컬", stats: [
    ["speed", "스피드"], ["agility", "민첩성"], ["stamina", "체력"],
    ["strength", "힘"], ["jump", "점프력"] ] },
  { id: "mental", label: "정신", stats: [
    ["focus", "집중력"], ["competitive", "승부욕"], ["teamwork", "팀워크"], ["confidence", "자신감"] ] },
  { id: "student", label: "학생선수", stats: [
    ["academic", "학업"], ["attitude", "생활태도"] ] },
];

export const STAT_LABEL = Object.fromEntries(
  STAT_GROUPS.flatMap(g => g.stats.map(([k, l]) => [`${g.id}.${k}`, l]))
);

export const POSITIONS = {
  FW: { label: "공격수", short: "FW", slots: 2,
        desc: "골을 넣는 자리. 슈팅과 스피드가 중요합니다.",
        weights: { "tech.shoot": .30, "tech.dribble": .20, "phys.speed": .20, "tech.firstTouch": .15, "phys.strength": .15 },
        bias: { "tech.shoot": 6, "tech.dribble": 3, "phys.speed": 3, "tech.defense": -6 } },
  MF: { label: "미드필더", short: "MF", slots: 4,
        desc: "공격과 수비를 잇는 자리. 패스와 체력이 중요합니다.",
        weights: { "tech.pass": .30, "tech.firstTouch": .20, "phys.stamina": .20, "mental.teamwork": .15, "tech.dribble": .15 },
        bias: { "tech.pass": 6, "phys.stamina": 3, "tech.firstTouch": 3, "tech.shoot": -2 } },
  DF: { label: "수비수", short: "DF", slots: 4,
        desc: "골문을 지키는 자리. 수비와 힘, 점프력이 중요합니다.",
        weights: { "tech.defense": .35, "phys.strength": .20, "phys.jump": .20, "mental.focus": .15, "phys.speed": .10 },
        bias: { "tech.defense": 7, "phys.strength": 3, "phys.jump": 3, "tech.shoot": -6, "tech.dribble": -3 } },
};

// mult: [중1, 중2, 중3] 기술·피지컬 성장 배율
// heightShare: 신체 측정 5번(중1 2학기, 중2 1·2학기, 중3 1·2학기)에 나눠 크는 비율
export const GROWTH_TYPES = {
  early: {
    label: "조기성장형", desc: "처음부터 눈에 띄지만, 중3이 되면 성장이 느려집니다.",
    mult: [1.3, 1.0, 0.7], techMult: 1, physMult: 1,
    startBonus: 7, potential: [68, 82], heightBonus: 0, startHeight: 4,
    heightShare: [0.32, 0.27, 0.16, 0.09, 0.04] },
  steady: {
    label: "꾸준성장형", desc: "3년 내내 고르게 자랍니다.",
    mult: [1.0, 1.0, 1.0], techMult: 1, physMult: 1,
    startBonus: 0, potential: [70, 86], heightBonus: 0, startHeight: 0,
    heightShare: [0.18, 0.18, 0.18, 0.17, 0.16] },
  late: {
    label: "대기만성형", desc: "중1엔 작고 느리지만, 중3에 폭발합니다.",
    mult: [0.7, 0.95, 1.5], techMult: 1, physMult: 1,
    startBonus: -5, potential: [76, 94], heightBonus: 2, startHeight: -4,
    heightShare: [0.07, 0.12, 0.2, 0.28, 0.25] },
  physical: {
    label: "피지컬형", desc: "키와 힘이 남다르게 자랍니다. 기술은 조금 더딥니다.",
    mult: [1.0, 1.0, 1.0], techMult: 0.88, physMult: 1.3,
    startBonus: 0, potential: [70, 86], heightBonus: 5, startHeight: 2,
    heightShare: [0.2, 0.2, 0.18, 0.16, 0.14] },
  technical: {
    label: "기술형", desc: "공 다루는 감각이 빨리 늡니다. 몸은 천천히 자랍니다.",
    mult: [1.0, 1.0, 1.0], techMult: 1.3, physMult: 0.88,
    startBonus: 0, potential: [70, 86], heightBonus: -3, startHeight: -1,
    heightShare: [0.17, 0.17, 0.17, 0.17, 0.17] },
};

// 특성. 효과는 엔진에서 id로 찾아 적용합니다.
export const TRAITS = {
  steelMental: { label: "강철 멘탈", good: true,  desc: "사기가 30 밑으로 잘 떨어지지 않습니다." },
  leadership:  { label: "리더십",   good: true,  desc: "팀워크가 잘 오르고 주장 후보에 유리합니다." },
  clutch:      { label: "승부사",   good: true,  desc: "지고 있을 때 더 강해집니다." },
  bigGame:     { label: "큰 경기 체질", good: true, desc: "대회와 진학 경기에서 실력이 더 나옵니다." },
  diligent:    { label: "성실함",   good: true,  desc: "모든 훈련 효과 +10%, 생활태도가 조금씩 오릅니다." },
  footballIQ:  { label: "축구 IQ",  good: true,  desc: "전술 훈련 효과 +30%, 집중력이 잘 오릅니다." },

  glassBody:   { label: "유리몸",   good: false, desc: "부상 위험이 훨씬 높습니다." },
  inconsistent:{ label: "기복형",   good: false, desc: "주마다 사기가 크게 오르내립니다." },
  lazy:        { label: "게으름",   good: false, desc: "훈련 효과 −10%, 생활태도가 조금씩 떨어집니다." },
  timid:       { label: "소심함",   good: false, desc: "큰 경기와 진학 경기에서 위축됩니다." },
  slump:       { label: "슬럼프형", good: false, desc: "가끔 이유 없이 사기가 뚝 떨어집니다." },

  // ── 경기와 생활 속에서 얻는 특성 (얻는 순간 bonus만큼 능력치가 오름) ──
  champion:  { label: "우승 DNA",    good: true, earned: true, how: "전국대회 우승",
               desc: "대회와 진학 경기에서 선택 성공률이 오릅니다.", bonus: { "mental.competitive": 2, "mental.confidence": 2 } },
  finisher:  { label: "해결사",      good: true, earned: true, how: "한 경기 2골 이상을 4번",
               desc: "내 슈팅이 골로 이어질 확률이 오릅니다.", bonus: { "tech.shoot": 2, "mental.confidence": 1 } },
  ace:       { label: "에이스",      good: true, earned: true, how: "경기 최우수 선수 8번",
               desc: "경기에서 공이 더 자주 나에게 옵니다.", bonus: { "position": 1.5 } },
  wall:      { label: "통곡의 벽",   good: true, earned: true, how: "수비수로 선발 무실점 경기 10번",
               desc: "수비 장면 성공률이 오릅니다.", bonus: { "tech.defense": 2, "mental.focus": 1 } },
  playmaker: { label: "플레이메이커", good: true, earned: true, how: "누적 도움 12개",
               desc: "내 패스를 받은 동료의 슈팅이 더 잘 들어갑니다.", bonus: { "tech.pass": 2, "mental.teamwork": 1 } },
  comeback:  { label: "오뚝이",      good: true, earned: true, how: "6주 이상 걸린 큰 부상에서 복귀",
               desc: "부상 위험이 줄고, 사기가 25 밑으로 잘 안 떨어집니다. '유리몸'이 있었다면 사라집니다.", bonus: { "mental.confidence": 2, "phys.strength": 1 } },
  ironLungs: { label: "강철 체력",   good: true, earned: true, how: "합숙 훈련 2번 + 체력 65 이상",
               desc: "후반에도 몸이 무뎌지지 않습니다.", bonus: { "phys.stamina": 2 } },
  scholar:   { label: "문무겸비",    good: true, earned: true, how: "정기시험 상위권 2번",
               desc: "공부 효과 +20%, 시험 성적이 잘 나옵니다.", bonus: { "student.academic": 3, "student.attitude": 2 } },
};

// 기존 특성 중에도 경기와 생활 속에서 새로 얻을 수 있는 것
export const EARNABLE = {
  clutch:     { how: "후반 승부처에서 동점골·역전골·결승골 3번", bonus: { "mental.competitive": 2, "mental.confidence": 2 } },
  leadership: { how: "주장 선출", bonus: { "mental.teamwork": 2 } },
};

export const FACES = ["face_01", "face_02", "face_03", "face_04", "face_05", "face_06"];

export const ROLES = [
  { id: "key",      label: "핵심 선수" },
  { id: "starter",  label: "주전" },
  { id: "rotation", label: "로테이션" },
  { id: "prospect", label: "유망주" },
  { id: "reserve",  label: "육성 대상" },
];
