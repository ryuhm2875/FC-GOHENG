// 자동 생성 파일입니다. 직접 고치지 말고 node tools/bundle.mjs 로 다시 만드세요.
(function () {
"use strict";
const __m = {}, __fix = {};
// ── data/player.js
__m["data/player.js"] = (function () {

// 포지션, 성장 유형, 특성, 능력치 이름

const STAT_GROUPS = [
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

const STAT_LABEL = Object.fromEntries(
  STAT_GROUPS.flatMap(g => g.stats.map(([k, l]) => [`${g.id}.${k}`, l]))
);

const POSITIONS = {
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
const GROWTH_TYPES = {
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
const TRAITS = {
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
const EARNABLE = {
  clutch:     { how: "후반 승부처에서 동점골·역전골·결승골 3번", bonus: { "mental.competitive": 2, "mental.confidence": 2 } },
  leadership: { how: "주장 선출", bonus: { "mental.teamwork": 2 } },
};

const FACES = ["face_01", "face_02", "face_03", "face_04", "face_05", "face_06"];

const ROLES = [
  { id: "key",      label: "핵심 선수" },
  { id: "starter",  label: "주전" },
  { id: "rotation", label: "로테이션" },
  { id: "prospect", label: "유망주" },
  { id: "reserve",  label: "육성 대상" },
];

return { STAT_GROUPS, STAT_LABEL, POSITIONS, GROWTH_TYPES, TRAITS, EARNABLE, FACES, ROLES };
})();
(__fix["data/player.js"] || []).forEach(f => f());

// ── data/roster.js
__m["data/roster.js"] = (function () {

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

const ROSTER = [
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
const GOALKEEPERS = [
  { name: "조요훈", cohort: "2학년선배" },
  { name: "장만춘", cohort: "동기" },
  { name: "강인서", cohort: "1년후배", strong: true }, // 강자
];

// 학년별 주장 (주인공 학년 기준). 중3은 주장 선거에서 주인공이 떨어지면 이 선수가 주장이 됩니다.
const CAPTAINS = { 1: "이부민", 2: "정타석", 3: "손은창" };

// 감독·코치 이름도 여기서 바꾸실 수 있습니다.
const STAFF = {
  coach: "김 감독",
  assistant: "정 코치",
  teacher: "류봉두 선생님",
};

return { ROSTER, GOALKEEPERS, CAPTAINS, STAFF };
})();
(__fix["data/roster.js"] || []).forEach(f => f());

// ── js/rng.js
__m["js/rng.js"] = (function () {

// 난수와 작은 계산 도구들. 테스트할 때는 setSeed로 결과를 고정할 수 있습니다.

let seed = null;

function setSeed(s) { seed = s >>> 0; }

function rand() {
  if (seed === null) return Math.random();
  // mulberry32
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const range = (a, b) => a + rand() * (b - a);
const int = (a, b) => Math.floor(range(a, b + 1));
const chance = p => rand() < p;
const pick = arr => arr[Math.floor(rand() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function normal(mean = 0, sd = 1) {
  const u = 1 - rand(), v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function weighted(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of pairs) { if ((r -= w) <= 0) return item; }
  return pairs[pairs.length - 1][0];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// "tech.shoot" 같은 경로로 값 읽기/쓰기
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}
function setPath(obj, path, val) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = val;
}

return { setSeed, rand, range, int, chance, pick, clamp, normal, weighted, shuffle, getPath, setPath };
})();
(__fix["js/rng.js"] || []).forEach(f => f());

// ── js/engine/growth.js
__m["js/engine/growth.js"] = (function () {
const {GROWTH_TYPES, POSITIONS} = __m["data/player.js"];
const {getPath, setPath, range, clamp, chance, normal} = __m["js/rng.js"];
// 능력치 성장과 신체 성장


const TUNE = { gain: 1.0 };   // 밸런스 조절용 전체 배율

function hasTrait(p, id) { return p.traits.includes(id); }

function capFor(player, path) {
  const [group] = path.split(".");
  if (group === "student") return 100;
  if (group === "mental") return Math.min(99, player.potential + 8);
  return player.potential;
}

// ── 컨디션 ─────────────────────────
// 피로와 사기를 합친 하나의 점수. 훈련 효율과 경기 성공률에 함께 쓰입니다.
//   피로: 30까지는 영향 없음, 그 위로는 훈련 효율이 줄어 100이면 55%
//   사기: 50이 기준, 100이면 +12%, 0이면 -12%
//   경기: 컨디션 65가 기준. 100이면 성공률 +10%p, 0이면 -19%p
const CONDITION_LEVELS = [
  { min: 85, label: "최상", cls: "hi" },
  { min: 70, label: "좋음", cls: "hi" },
  { min: 50, label: "보통", cls: "mid" },
  { min: 30, label: "나쁨", cls: "lo" },
  { min: -1, label: "최악", cls: "lo" },
];
function conditionOf(p) {
  const f = p.condition.fatigue, m = p.condition.morale;
  const score = clamp(100 - Math.max(0, f - 20) * 1.0 + (m - 55) * 0.5, 0, 100);
  const level = CONDITION_LEVELS.find(l => score >= l.min);
  const fat = f <= 30 ? 1 : 1 - ((f - 30) / 70) * 0.45;
  const mor = 0.88 + m * 0.0024;
  let trait = 1;
  if (hasTrait(p, "diligent")) trait *= 1.1;
  if (hasTrait(p, "lazy")) trait *= 0.9;
  return { score, label: level.label, cls: level.cls, train: fat * mor * trait, match: (score - 65) / 350 };
}

// 훈련 효율 (화면에도 보여주는 값)
function efficiency(state) { return conditionOf(state.player).train; }

// 능력치 하나에 기본 상승량을 적용하고 실제 변화량을 돌려줍니다
function applyGain(state, path, base, opts = {}) {
  const p = state.player;
  const [group] = path.split(".");
  const v = getPath(p.stats, path);
  let mult = base * TUNE.gain;

  if (group === "tech" || group === "phys") {
    const type = GROWTH_TYPES[p.growthType];
    mult *= type.mult[state.calendar.grade - 1];
    mult *= group === "tech" ? type.techMult : type.physMult;
  }
  if (!opts.raw) mult *= efficiency(state);
  if (path === "mental.teamwork" && hasTrait(p, "leadership")) mult *= 1.3;
  if (path === "mental.focus" && hasTrait(p, "footballIQ")) mult *= 1.3;
  if (opts.mult) mult *= opts.mult;

  const cap = capFor(p, path);
  const room = mult >= 0 ? clamp((cap - v) / (cap * 0.55), 0.06, 1.3) : 1;
  const delta = mult * room * range(0.8, 1.2);
  const next = clamp(v + delta, 1, 99);
  setPath(p.stats, path, next);
  return next - v;
}

// "position" 키: 포지션 핵심 능력치에 고르게 나눠 줌
function expandGains(state, gains) {
  const out = {};
  for (const [path, base] of Object.entries(gains)) {
    if (path === "position") {
      for (const [k, w] of Object.entries(POSITIONS[state.player.position].weights)) {
        out[k] = (out[k] || 0) + base * w * 4;
      }
    } else out[path] = (out[path] || 0) + base;
  }
  return out;
}

// 키에 맞는 몸무게 (중학생 BMI 대략 18~20.5)
function weightFor(height, grade, strength) {
  const bmi = 17.8 + grade * 0.55 + (strength - 30) * 0.02;
  return Math.round(bmi * (height / 100) ** 2 * 10) / 10;
}

// 신체 측정: 성장 단계 k(0~4)
function growBody(state, k) {
  const p = state.player;
  const b = p.body;
  const type = GROWTH_TYPES[p.growthType];
  const total = b.finalHeight - b.startHeight;
  const gain = Math.max(0, total * type.heightShare[k] + normal(0, 0.6));
  const before = b.height;
  b.height = Math.round((b.height + gain) * 10) / 10;
  b.weight = weightFor(b.height, state.calendar.grade, p.stats.phys.strength);
  b.history.push({ label: `중${state.calendar.grade} ${state.calendar.semester}학기`, height: b.height, weight: b.weight });

  // 키가 크면 힘·점프력도 조금 따라 오름
  const cm = b.height - before;
  applyGain(state, "phys.strength", cm * 0.35, { raw: true });
  applyGain(state, "phys.jump", cm * 0.25, { raw: true });
  return { cm: Math.round(cm * 10) / 10, growingPains: cm >= 4.5 && chance(0.35) };
}

// 매주 자연스럽게 일어나는 변화
function weeklyDrift(state, didSchool) {
  const p = state.player;
  const s = p.stats.student;
  s.academic = clamp(s.academic - (didSchool ? 0.2 : 0.55), 0, 100);
  if (hasTrait(p, "diligent")) s.attitude = clamp(s.attitude + 0.15, 0, 100);
  if (hasTrait(p, "lazy")) s.attitude = clamp(s.attitude - 0.2, 0, 100);
  // 사기는 55 쪽으로 천천히 돌아감
  const m = p.condition.morale;
  p.condition.morale = clamp(m + (55 - m) * 0.08, 0, 100);
}

return { TUNE, hasTrait, CONDITION_LEVELS, conditionOf, efficiency, applyGain, expandGains, weightFor, growBody, weeklyDrift };
})();
(__fix["js/engine/growth.js"] || []).forEach(f => f());

// ── data/calendar.js
__m["data/calendar.js"] = (function () {

// 1년(45턴) 일정. 매년 같은 틀을 쓰고, 학년별 차이는 grades로 거릅니다.
// phase: league1 전반기 주말리그 / summer 하계대회 / league2 후반기 주말리그 / autumn 시즌 정리 / winter 동계대회

const PHASES = {
  league1: { label: "전반기 주말리그", color: "pitch" },
  summer:  { label: "하계대회",       color: "orange" },
  league2: { label: "후반기 주말리그", color: "pitch" },
  autumn:  { label: "2학기 마무리",     color: "muted" },
  winter:  { label: "동계대회",       color: "orange" },
};

// month, weeks(그 달 턴 수), phase
const MONTHS = [
  { month: 3,  weeks: 4, phase: "league1" },
  { month: 4,  weeks: 4, phase: "league1" },
  { month: 5,  weeks: 4, phase: "league1" },
  { month: 6,  weeks: 3, phase: "league1" },
  { month: 7,  weeks: 4, phase: "summer"  },
  { month: 8,  weeks: 5, phase: "summer"  },
  { month: 9,  weeks: 4, phase: "league2" },
  { month: 10, weeks: 4, phase: "league2" },
  { month: 11, weeks: 3, phase: "league2" },
  { month: 12, weeks: 3, phase: "autumn"  },
  { month: 1,  weeks: 4, phase: "winter"  },
  { month: 2,  weeks: 3, phase: "winter"  },
];

// 정기시험. 중1 1학기는 자유학기라 수행평가 주간으로 바뀝니다.
const EXAMS = [
  { month: 5,  week: 1, name: "1학기 1차 정기시험", semester: 1 },
  { month: 7,  week: 1, name: "1학기 2차 정기시험", semester: 1 },
  { month: 10, week: 1, name: "2학기 1차 정기시험", semester: 2 },
  { month: 12, week: 1, name: "2학기 2차 정기시험", semester: 2 },
];

// 학교 행사. event: data/events.js 의 이벤트 id (그 주가 시작될 때 반드시 나옴)
// grades: 그 학년에만 / camp: 합숙 훈련 주간 (훈련 효과 1.2배, 피로 1.25배) / hidden: 일정표에 안 보임
const SCHOOL_DAYS = [
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
const VACATIONS = [
  { from: [7, 3], to: [8, 5], label: "여름방학" },
  { from: [1, 2], to: [2, 3], label: "겨울방학" },
];

// 경기 일정
// comp: league 주말리그 / summer 하계대회 / winter 동계대회 / friendly 연습경기 / hs 진학 연습경기
// stage: group 조별리그 / ko 토너먼트 (지면 그 뒤 주간은 경기가 없어집니다)
// grades: 그 학년에만 열림 (없으면 모든 학년)
// hsChance: 연습경기가 고등학교 팀과의 진학 연습경기로 바뀔 확률 (학년별) / elemChance: 초등학교 팀과 붙을 확률
const MATCHES = [
  // 전반기 주말리그 9라운드 (10팀)
  { month: 3, week: 2, comp: "league" }, { month: 3, week: 4, comp: "league" },
  { month: 4, week: 2, comp: "league" }, { month: 4, week: 4, comp: "league" },
  { month: 5, week: 1, comp: "league" }, { month: 5, week: 3, comp: "league" }, { month: 5, week: 4, comp: "league" },
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

  // 후반기 주말리그 9라운드 (10팀). 11월 1주까지
  { month: 9, week: 1, comp: "league" }, { month: 9, week: 2, comp: "league" },
  { month: 9, week: 3, comp: "league" }, { month: 9, week: 4, comp: "league" },
  { month: 10, week: 1, comp: "league" }, { month: 10, week: 2, comp: "league" }, { month: 10, week: 3, comp: "league" },
  { month: 10, week: 4, comp: "league" }, { month: 11, week: 1, comp: "league" },

  // 연습경기. hsChance: 고등학교 팀과 붙을 확률 / elemChance: 초등학교 팀과 붙을 확률 (학년별)
  { month: 11, week: 2, comp: "friendly", hsChance: { 1: 0.15, 2: 0.45, 3: 0.4 }, elemChance: { 1: 0.25, 2: 0.2, 3: 0.2 } },
  { month: 11, week: 3, comp: "friendly", hsChance: { 1: 0.15, 2: 0.45, 3: 0.4 }, elemChance: { 1: 0.25, 2: 0.2, 3: 0.2 } },
  { month: 12, week: 1, comp: "friendly", hsChance: { 1: 0.15, 2: 0.45, 3: 0.4 }, elemChance: { 1: 0.25, 2: 0.2, 3: 0.2 } },

  // 동계대회: 졸업식·동계훈련 뒤, 3학년 선배 없이. 조별리그 3경기 → 4강 → 결승
  { month: 1, week: 3, comp: "winter", stage: "group", round: "조별리그 1차전" },
  { month: 1, week: 4, comp: "winter", stage: "group", round: "조별리그 2차전" },
  { month: 2, week: 1, comp: "winter", stage: "group", round: "조별리그 3차전" },
  { month: 2, week: 2, comp: "winter", stage: "ko", round: "4강" },
  { month: 2, week: 3, comp: "winter", stage: "ko", round: "결승" },
];

const COMPS = {
  league:   { label: "주말리그",     official: true,  tournament: false },
  summer:   { label: "하계대회",     official: true,  tournament: true, name: "전국 중등 하계 축구대회", bonus: 3 },
  winter:   { label: "동계대회",     official: true,  tournament: true, name: "전국 중등 동계 축구대회", bonus: 4 },
  friendly: { label: "연습경기",     official: false, tournament: false },
  hs:       { label: "고교 연습경기", official: false, tournament: false },
};

return { PHASES, MONTHS, EXAMS, SCHOOL_DAYS, VACATIONS, MATCHES, COMPS };
})();
(__fix["data/calendar.js"] || []).forEach(f => f());

// ── js/engine/calendar.js
__m["js/engine/calendar.js"] = (function () {
const {MONTHS, EXAMS, MATCHES, PHASES, COMPS, SCHOOL_DAYS, VACATIONS} = __m["data/calendar.js"];
// 일정 계산: 학년마다 45턴짜리 달력을 펼쳐 놓고 현재 위치를 찾습니다.

const TURNS_PER_YEAR = MONTHS.reduce((s, m) => s + m.weeks, 0);

// 한 해 턴 목록 (학년과 무관한 틀). matches에는 그 주의 후보 경기가 모두 들어 있음
const YEAR = (() => {
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
const GRAD_INDEX = YEAR.findIndex(s => s.month === 1 && s.week === 1);
const TOTAL_TURNS = TURNS_PER_YEAR * 2 + GRAD_INDEX + 1;

const ord = (m, w) => ((m + 9) % 12) * 10 + w;        // 3월=0 기준 순서
function vacationOf(month, week) {
  const o = ord(month, week);
  return VACATIONS.find(v => o >= ord(...v.from) && o <= ord(...v.to)) || null;
}
function schoolDayOf(grade, month, week) {
  return SCHOOL_DAYS.filter(d => d.month === month && d.week === week && (!d.grades || d.grades.includes(grade)));
}

// 같은 단계(전반기·후반기) 안에서 몇 번째 리그 경기인지
function leagueRound(slot) {
  if (!slot.matches.some(x => x.comp === "league")) return null;
  return YEAR.filter(s => s.phase === slot.phase && s.index <= slot.index && s.matches.some(x => x.comp === "league")).length - 1;
}

function turnInfo(state, offset = 0) {
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

const label = info => `중${info.grade} ${info.month}월 ${info.week}주차`;

function upcoming(state, n = 6) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const info = turnInfo(state, i);
    if (!info) break;
    if (info.match || info.exam || info.school.some(d => !d.hidden)) out.push(info);
  }
  return out;
}

function yearTurns(grade) {
  return YEAR.map((slot, i) => ({ ...slot, turn: (grade - 1) * TURNS_PER_YEAR + i + 1 }));
}

return { TURNS_PER_YEAR, YEAR, GRAD_INDEX, TOTAL_TURNS, vacationOf, schoolDayOf, turnInfo, label, upcoming, yearTurns };
})();
(__fix["js/engine/calendar.js"] || []).forEach(f => f());

// ── js/engine/team.js
__m["js/engine/team.js"] = (function () {
const {POSITIONS, ROLES} = __m["data/player.js"];
const {getPath, int, range} = __m["js/rng.js"];
const {TURNS_PER_YEAR, GRAD_INDEX} = __m["js/engine/calendar.js"];
// 종합 능력치, 팀 명단, 선발 경쟁



function ovr(player, pos = player.position) {
  const w = POSITIONS[pos].weights;
  let sum = 0;
  for (const [path, weight] of Object.entries(w)) sum += getPath(player.stats, path) * weight;
  return sum;
}

const COHORT_OFFSET = { "3학년선배": 2, "2학년선배": 1, "동기": 0, "1년후배": -1, "2년후배": -2 };

// 주인공 학년 g일 때 그 선수의 학년
const mateGrade = (mate, g) => g + COHORT_OFFSET[mate.cohort];

// 1월 졸업식 뒤(1~2월)에는 3학년이 빠짐
function activeRoster(state) {
  const g = state.calendar.grade;
  const t = (state.calendar.turn - 1) % TURNS_PER_YEAR;
  const graduated = t > GRAD_INDEX;              // 1월 1주(졸업식) 다음부터
  return state.team.roster.filter(m => { const mg = mateGrade(m, g); return mg >= 1 && mg <= (graduated ? 2 : 3); });
}

// 학년이 바뀔 때: 남아 있는 선수들 능력치 상승
function ageRoster(state) {
  const g = state.calendar.grade;
  for (const m of state.team.roster) {
    const mg = mateGrade(m, g);
    const prev = mateGrade(m, g - 1);
    if (mg >= 2 && mg <= 3 && prev >= 1) m.ovrNow = Math.min(80, m.ovrNow + range(9, 13));
  }
}

// 선발 점수: 능력치 75% + 감독 신뢰 25%
const selectionScore = (o, coach) => o * 0.75 + coach * 0.25;

function depthChart(state) {
  const me = state.player;
  const myScore = selectionScore(ovr(me), state.relations.coach);
  const mates = activeRoster(state).filter(m => m.position === me.position)
    .map(m => ({ name: m.name, number: m.number, ovr: m.ovrNow, score: selectionScore(m.ovrNow, 50), me: false }));
  const list = [...mates, { name: me.name, number: me.number, ovr: ovr(me), score: myScore, me: true }]
    .sort((a, b) => b.score - a.score);
  const rank = list.findIndex(x => x.me) + 1;
  return { list, rank, slots: POSITIONS[me.position].slots };
}

function roleFor(state) {
  const { rank, slots } = depthChart(state);
  if (rank === 1) return ROLES[0];
  if (rank <= slots) return ROLES[1];
  if (rank <= slots + 2) return ROLES[2];
  if (state.calendar.grade === 1) return ROLES[3];
  return ROLES[4];
}

// 팀 전력: 포지션별 상위 선수 평균 (4-4-2)
function teamStrength(state, withMe) {
  const pool = activeRoster(state).map(m => ({ pos: m.position, ovr: m.ovrNow }));
  if (withMe) pool.push({ pos: state.player.position, ovr: ovr(state.player) });
  let total = 0, n = 0;
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const top = pool.filter(p => p.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, def.slots);
    for (const p of top) { total += p.ovr; n++; }
    for (let i = top.length; i < def.slots; i++) { total += 45; n++; }
  }
  return total / n;
}

function freeNumbers(state, from, to) {
  const used = new Set(activeRoster(state).map(m => m.number));
  const out = [];
  for (let i = from; i <= to; i++) if (!used.has(i)) out.push(i);
  return out;
}

function randomFreeNumber(state, from, to) {
  const free = freeNumbers(state, from, to);
  return free.length ? free[int(0, free.length - 1)] : from;
}

return { ovr, mateGrade, activeRoster, ageRoster, selectionScore, depthChart, roleFor, teamStrength, freeNumbers, randomFreeNumber };
})();
(__fix["js/engine/team.js"] || []).forEach(f => f());

// ── js/engine/relations.js
__m["js/engine/relations.js"] = (function () {
const {ROSTER} = __m["data/roster.js"];
let mailFrom, mail; (__fix["js/state.js"] ||= []).push(() => { mailFrom = __m["js/state.js"].mailFrom; mail = __m["js/state.js"].mail; });
const {mateGrade, ovr} = __m["js/engine/team.js"];
const {pick, clamp, chance} = __m["js/rng.js"];
const {applyGain, hasTrait} = __m["js/engine/growth.js"];
// 관계: 친구, 라이벌, 멘토 선배, 후배
// 게임을 시작할 때 data/roster.js 명단에서 정해집니다. 같은 포지션 후보 중 무작위라 판마다 달라집니다 (친구는 동기 중 무작위)





const REL_ROLES = {
  friend: { label: "단짝 친구", icon: "🤝", desc: "사기가 떨어질 때 붙잡아 줍니다. 관계가 70을 넘으면 사기가 35 밑으로 잘 안 내려갑니다." },
  rival:  { label: "라이벌",   icon: "🔥", desc: "같은 자리를 노리는 동기. 능력치 차이가 5 이내면 서로 자극이 되어 훈련 효율이 5% 오릅니다." },
  mentor: { label: "멘토 선배", icon: "🧭", desc: "관계가 70을 넘으면 매주 집중력·팀워크가 조금씩 오르고, 감독님 신뢰도 따라 오릅니다." },
  junior: { label: "챙기는 후배", icon: "🌱", desc: "중2부터 생깁니다. 관계가 높으면 팀워크가 오르고, 중3 주장 선거에 유리합니다." },
};

const pool = (state, cohort) => state.team.roster.filter(m => m.cohort === cohort);
// 같은 포지션 후보 중 무작위 하나. 같은 포지션이 없으면 전체 후보 중에서
const pickSame = (list, pos) => { const same = list.filter(m => m.position === pos); return same.length ? pick(same) : list.length ? pick(list) : null; };
const pack = (m, value) => m ? { id: m.id, name: m.name, face: m.face, position: m.position, cohort: m.cohort, value } : null;

function initRelations(state) {
  const p = state.player;
  const mates = pool(state, "동기");
  const rival = pickSame(mates, p.position);
  const friendPool = mates.filter(m => m.id !== rival?.id);
  const friend = friendPool.length ? pick(friendPool) : null;
  const seniors = [...pool(state, "2학년선배"), ...pool(state, "3학년선배")];
  // 2학년 선배 중 같은 포지션이 둘 이상이면 그중에서, 아니면 3학년 선배까지 넓혀서 (3학년 선배는 졸업 때 다른 선배로 바뀜)
  const sameG2 = seniors.filter(m => m.cohort === "2학년선배" && m.position === p.position);
  const mentor = sameG2.length >= 2 ? pick(sameG2) : pickSame(seniors, p.position);
  state.relations.people = {
    friend: pack(friend, 55),
    rival: pack(rival, 40),
    mentor: pack(mentor, 35),
    junior: null,
  };
}

const person = (state, key) => state.relations.people?.[key] || null;
const nameOf = (state, key) => person(state, key)?.name || "";

function adjustRel(state, key, n) {
  const r = person(state, key);
  if (!r) return 0;
  const before = r.value;
  r.value = clamp(r.value + n, 0, 100);
  return r.value - before;
}

// 매주 관계 효과
function weeklyRelations(state) {
  const p = state.player;
  const P = state.relations.people || {};
  const fx = { trainMult: 1 };
  if (P.friend) {
    P.friend.value = clamp(P.friend.value - 0.4, 0, 100);
    if (P.friend.value >= 70) { p.condition.morale = Math.max(p.condition.morale, 35); p.condition.morale = clamp(p.condition.morale + 1.2, 0, 100); }
    if (P.friend.value <= 25) p.condition.morale = clamp(p.condition.morale - 1, 0, 100);
  }
  if (P.mentor) {
    P.mentor.value = clamp(P.mentor.value - 0.4, 0, 100);
    if (P.mentor.value >= 70) {
      applyGain(state, "mental.focus", 0.15, { raw: true });
      applyGain(state, "mental.teamwork", 0.15, { raw: true });
      state.relations.coach = clamp(state.relations.coach + 0.1, 0, 100);
    }
  }
  if (P.junior) {
    P.junior.value = clamp(P.junior.value - 0.3, 0, 100);
    if (P.junior.value >= 60) applyGain(state, "mental.teamwork", 0.12 * (hasTrait(p, "leadership") ? 1.5 : 1), { raw: true });
  }
  if (P.rival) {
    const mate = state.team.roster.find(m => m.id === P.rival.id);
    if (mate && Math.abs(mate.ovrNow - ovr(p)) <= 5) {
      fx.trainMult = 1.05;
      P.rival.value = clamp(P.rival.value + 0.5, 0, 100);
      applyGain(state, "mental.competitive", 0.15, { raw: true });
    }
  }
  return fx;
}

function rivalGap(state) {
  const r = person(state, "rival");
  const mate = r && state.team.roster.find(m => m.id === r.id);
  return mate ? Math.round(ovr(state.player) - mate.ovrNow) : null;
}

// 1월 졸업식 다음 주: 3학년 멘토 선배가 떠나고 다음 선배가 멘토가 됨
function seniorsLeave(state, g) {
  const P = state.relations.people;
  if (!P?.mentor || mateGrade(P.mentor, g) !== 3) return;
  const p = state.player, old = P.mentor.name;
  const next = pickSame(state.team.roster.filter(m => { const mg = mateGrade(m, g); return mg > g && mg < 3; }), p.position);
  P.mentor = next ? pack(next, 30) : null;
  mailFrom(state, old, "friend", "졸업하면서 한마디",
    `${p.name}, 형 이제 고등학생이다. 같이 훈련한 거 재밌었다.\n\n${next ? `이제 ${next.name}한테 많이 물어봐. 걔도 좋은 형이다.` : "이제 네가 선배다. 후배들 잘 챙겨라."}\n\n동계대회 잘해라. 고등학교 가서 경기 있으면 보러 와라.`);
}

// 학년이 바뀔 때: 선배 졸업, 후배 생김
function relationsNewYear(state) {
  const g = state.calendar.grade;
  const P = state.relations.people;
  if (!P) return;
  const p = state.player;
  if (P.mentor && mateGrade(P.mentor, g) > 3) {
    const old = P.mentor.name;
    const next = pickSame(state.team.roster.filter(m => { const mg = mateGrade(m, g); return mg > g && mg <= 3; }), p.position);
    P.mentor = pack(next, 30);
    mailFrom(state, old, "friend", "졸업하면서 한마디",
      `${p.name}, 형 이제 고등학생이다. 같이 훈련한 거 재밌었다.\n\n${next ? `이제 ${next.name}한테 많이 물어봐. 걔도 좋은 형이다.` : "이제 네가 선배다. 후배들 잘 챙겨라."}\n\n고등학교 가서 경기 있으면 보러 와라.`);
  }
  if (!P.junior && g >= 2) {
    const juniors = state.team.roster.filter(m => mateGrade(m, g) === 1 && m.cohort !== "동기");
    const j = pickSame(juniors, p.position);
    if (j) {
      P.junior = pack(j, 40);
      mail(state, "assist", "후배 하나 맡아라",
        `이번에 들어온 ${j.name}, ${j.position === p.position ? "너랑 같은 포지션이다" : "너희 동네 사는 애다"}. 훈련 끝나고 이것저것 알려 줘라.\n\n후배를 챙기면 팀워크가 늘고, 감독님도 다 보고 계신다.`);
    }
  }
}

// 중3 3월: 주장 선거
function captainScore(state) {
  const p = state.player;
  const P = state.relations.people || {};
  const rels = ["friend", "mentor", "junior"].map(k => P[k]?.value).filter(v => v != null);
  const relAvg = rels.length ? rels.reduce((a, b) => a + b, 0) / rels.length : 40;
  let s = state.relations.coach * 0.35 + p.stats.mental.teamwork * 0.25 + p.stats.student.attitude * 0.2 + relAvg * 0.2;
  if (hasTrait(p, "leadership")) s += 8;
  return s;
}

return { REL_ROLES, initRelations, person, nameOf, adjustRel, weeklyRelations, rivalGap, seniorsLeave, relationsNewYear, captainScore };
})();
(__fix["js/engine/relations.js"] || []).forEach(f => f());

// ── js/state.js
__m["js/state.js"] = (function () {
const {GROWTH_TYPES, POSITIONS, STAT_GROUPS, TRAITS} = __m["data/player.js"];
const {ROSTER, STAFF} = __m["data/roster.js"];
const {normal, range, clamp, chance, pick} = __m["js/rng.js"];
const {weightFor} = __m["js/engine/growth.js"];
const {randomFreeNumber} = __m["js/engine/team.js"];
const {initRelations} = __m["js/engine/relations.js"];
// 게임 상태 만들기와 저장/불러오기






const SAVE_VERSION = 3;
const KEY = { slot: n => `gfc_slot_${n}`, auto: "gfc_auto", settings: "gfc_settings", seen: "gfc_endings" };

function rollPlayer({ name, face, position, foot, growthType }) {
  const type = GROWTH_TYPES[growthType];
  const bias = POSITIONS[position].bias;
  const stats = {};
  for (const g of STAT_GROUPS) {
    stats[g.id] = {};
    for (const [k] of g.stats) {
      const path = `${g.id}.${k}`;
      let v;
      if (g.id === "tech" || g.id === "phys") {
        v = normal(31, 3.5) + type.startBonus + (bias[path] || 0);
        if (g.id === "tech") v += (type.techMult - 1) * 12;
        if (g.id === "phys") v += (type.physMult - 1) * 12;
      } else if (g.id === "mental") v = normal(44, 6);
      else if (k === "academic") v = normal(58, 9);
      else v = normal(60, 7);
      stats[g.id][k] = clamp(v, 12, 70);
    }
  }
  if (foot === "L") stats.tech.cross += 2;

  const startHeight = Math.round((normal(151.5, 3.5) + type.startHeight) * 10) / 10;
  let finalHeight = normal(174, 4.5) + type.heightBonus;
  finalHeight = Math.max(finalHeight, startHeight + 15);

  const good = Object.keys(TRAITS).filter(k => TRAITS[k].good && !TRAITS[k].earned);   // 경기로 얻는 특성은 처음부터 주지 않음
  const bad = Object.keys(TRAITS).filter(k => !TRAITS[k].good && !TRAITS[k].earned);
  const traits = [];
  if (chance(0.75)) traits.push(pick(good));
  if (chance(0.55)) traits.push(pick(bad));
  if (!traits.length) traits.push(pick(good));

  const potential = Math.round(range(...type.potential));
  const est = potential + normal(0, 4);
  const stars = clamp(Math.round(((est - 55) / 7) * 2) / 2, 1, 5);

  const weight = weightFor(startHeight, 1, stats.phys.strength);
  return {
    name, face, position, foot, growthType, potential, traits, number: 0,
    coachStars: stars,
    stats,
    body: { height: startHeight, weight, startHeight, finalHeight: Math.round(finalHeight * 10) / 10,
            history: [{ label: "중1 입학", height: startHeight, weight }] },
    condition: { fatigue: 10, morale: 60, injury: null },
  };
}

function newGame(player) {
  const state = {
    meta: { version: SAVE_VERSION, createdAt: Date.now(), savedAt: null },
    calendar: { turn: 1, grade: 1, semester: 1 },
    player: structuredClone(player),
    relations: { coach: 50, teacher: 50 },
    team: { roster: ROSTER.map((r, i) => ({ ...r, id: `m${i}`, ovrNow: r.ovr })) },
    record: { apps: 0, starts: 0, goals: 0, assists: 0, mom: 0, ratings: [], matches: [], leagues: [], tournaments: [], titles: [] },
    flags: { academicLevel: 0, wasBenchInG1: false, captain: false, wore10: false, nationalChampion: false },
    league: null, tour: null, scouting: {}, rolls: {}, career: {},
    yearStart: null,
    inbox: [],
    plan: { wd1: null, wd2: null, we: null },
    pending: null,
    finished: false,
  };
  if (!state.player.number) state.player.number = randomFreeNumber(state, 30, 99);
  state.relations.people = null;
  initRelations(state);
  state.yearStart = snapshotStats(state);
  state.player.numberHistory = [{ grade: 1, number: state.player.number }];

  return state;
}

function snapshotStats(state) {
  return { stats: structuredClone(state.player.stats), height: state.player.body.height };
}

const SENDERS = {
  coach:   () => ({ from: STAFF.coach, kind: "coach" }),
  assist:  () => ({ from: STAFF.assistant, kind: "coach" }),
  teacher: () => ({ from: STAFF.teacher, kind: "school" }),
  mom:     () => ({ from: "엄마", kind: "family" }),
  dad:     () => ({ from: "아빠", kind: "family" }),
  group:   () => ({ from: "고흥FC 단톡방", kind: "group" }),
  medical: () => ({ from: "의무 기록", kind: "medical" }),
  system:  () => ({ from: "알림", kind: "system" }),
};

function mail(state, who, title, body) {
  return pushMail(state, SENDERS[who](), title, body);
}
function mailFrom(state, from, kind, title, body) {
  return pushMail(state, { from, kind }, title, body);
}
function pushMail(state, s, title, body) {
  state.meta.mailSeq = (state.meta.mailSeq || 0) + 1;
  const item = { id: `m${state.meta.mailSeq}`, turn: state.calendar.turn, ...s, title, body, read: false };
  state.inbox.unshift(item);
  if (state.inbox.length > 120) state.inbox.length = 120;
  return item;
}

// ── 저장 ──────────────────────────────────────────
function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
function safeDel(k) { try { localStorage.removeItem(k); } catch {} }

function summaryOf(state, info) {
  const p = state.player;
  return `${p.name} ${p.position} ${p.number}번, ${info ? `중${info.grade} ${info.month}월 ${info.week}주차` : "졸업"}`;
}

function pack(state, summary) {
  state.meta.savedAt = Date.now();
  return JSON.stringify({ version: SAVE_VERSION, savedAt: state.meta.savedAt, summary, state });
}

function saveTo(where, state, summary) {
  return safeSet(where === "auto" ? KEY.auto : KEY.slot(where), pack(state, summary));
}

function readSlot(where) {
  const raw = safeGet(where === "auto" ? KEY.auto : KEY.slot(where));
  if (!raw) return null;
  try { return migrate(JSON.parse(raw)); } catch { return null; }
}

function deleteSlot(where) { safeDel(where === "auto" ? KEY.auto : KEY.slot(where)); }

// 옛 저장 파일을 새 형식으로 고치는 곳 (버전이 오를 때 여기에 추가)
function migrate(data) {
  if (!data?.state) return null;
  // 1단계 저장(일정 40턴)은 일정이 바뀌어 이어갈 수 없습니다
  if (data.version !== SAVE_VERSION) return null;
  return data;
}

function exportCode(state, summary) {
  const json = pack(state, summary);
  return btoa(unescape(encodeURIComponent(json)));
}
function importCode(code) {
  try { return migrate(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); }
  catch { return null; }
}

function loadSettings() {
  try { return { minigame: true, ...JSON.parse(safeGet(KEY.settings) || "{}") }; }
  catch { return { minigame: true }; }
}
function saveSettings(s) { safeSet(KEY.settings, JSON.stringify(s)); }

return { SAVE_VERSION, rollPlayer, newGame, snapshotStats, mail, mailFrom, summaryOf, saveTo, readSlot, deleteSlot, exportCode, importCode, loadSettings, saveSettings };
})();
(__fix["js/state.js"] || []).forEach(f => f());

// ── data/actions.js
__m["data/actions.js"] = (function () {

// 주간 행동 목록. 새 행동은 이 배열에 추가하기만 하면 화면에 나타납니다.
//
// gains   : 오르는 능력치와 기본 상승량 (실제 상승량은 성장 유형·잠재력·피로·사기에 따라 달라짐)
// fatigue : 피로 변화 (음수면 회복)
// morale  : 사기 변화
// coach   : 감독 신뢰도 변화
// risk    : 부상 위험 (0.02 = 2%, 피로가 높을수록 커짐)
// injured : "block" 부상 중 불가 / "only" 부상 중에만 가능 / 없으면 항상 가능

const CATEGORIES = [
  { id: "personal", label: "개인훈련" },
  { id: "team",     label: "단체훈련" },
  { id: "school",   label: "학교생활" },
  { id: "rest",     label: "휴식" },
];

const ACTIONS = [
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
  { id: "defend", cat: "personal", label: "수비 훈련", icon: "🛡️",
    desc: "1 대 1 수비, 위치 잡기",
    gains: { "tech.defense": 2.2, "mental.focus": 0.6, "phys.strength": 0.4 },
    fatigue: 12, risk: 0.012, injured: "block" },
  { id: "sprint", cat: "personal", label: "스프린트 훈련", icon: "⚡",
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

const ACTION_MAP = Object.fromEntries(ACTIONS.map(a => [a.id, a]));

return { CATEGORIES, ACTIONS, ACTION_MAP };
})();
(__fix["data/actions.js"] || []).forEach(f => f());

// ── data/world.js
__m["data/world.js"] = (function () {

// 상대 학교와 무작위 이름. 모두 가상의 이름입니다. 자유롭게 고치셔도 됩니다.

// 전남 권역 주말리그 상대 9팀 (우리 팀까지 10팀이 전반기·후반기에 한 번씩 맞붙습니다)
// strength: 팀 평균 능력치 보정. 0이 보통, +면 강팀
// color: 유니폼 색, color2: 테두리 색 (경기장 위 상대 선수 점의 색)
const LEAGUE_OPPONENTS = [
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
const HIGH_SCHOOLS = [
  { id: "hs_namhae",  name: "남해안FC U-18", tier: "proYouth",   strength: 70, coach: "최동혁 감독", color: "#B71C1C", color2: "#FFD54F" },
  { id: "hs_hannuri", name: "서울 한누리고",  tier: "national",   strength: 67, coach: "정우석 감독", color: "#0D1B4C", color2: "#FFFFFF" },
  { id: "hs_saesol",  name: "경기 새솔고",    tier: "national",   strength: 66, coach: "김태환 감독", color: "#FFFFFF", color2: "#2E7D32" },
  { id: "hs_mudeung", name: "광주 무등빛고",  tier: "regional",   strength: 63, coach: "오상민 감독", color: "#F9A825", color2: "#212121" },
  { id: "hs_neul",    name: "순천 늘푸른고",  tier: "regional",   strength: 62, coach: "배진호 감독", color: "#43A047", color2: "#FFFFFF" },
  { id: "hs_chabat",  name: "보성 차밭고",    tier: "footballHS", strength: 58, coach: "윤기철 감독", color: "#7CB342", color2: "#33691E" },
];

const HS_TIERS = {
  proYouth:   { label: "프로 산하 유스", order: 4 },
  national:   { label: "전국 강호",     order: 3 },
  regional:   { label: "지역 강호",     order: 2 },
  footballHS: { label: "축구부 일반고",  order: 1 },
};

// 전국 대회 상대
const NATIONAL_OPPONENTS = [
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
const ELEMENTARY_OPPONENTS = [
  { name: "고흥 바닷바람FC U-12", strength: -9, color: "#29B6F6", color2: "#FFFFFF" },
  { name: "순천 꿈나무FC U-12",   strength: -8, color: "#FFEE58", color2: "#1B5E20" },
  { name: "벌교 꼬막FC U-12",     strength: -10, color: "#8D6E63", color2: "#FFFFFF" },
  { name: "보성 녹차잎FC U-12",   strength: -9, color: "#9CCC65", color2: "#FFFFFF" },
];

// 성씨 (대략적인 빈도 가중치)
const SURNAMES = [
  ["김", 21], ["이", 15], ["박", 8], ["최", 5], ["정", 4], ["강", 2.5], ["조", 2.5],
  ["윤", 2], ["장", 2], ["임", 1.8], ["한", 1.5], ["오", 1.4], ["서", 1.3], ["신", 1.3],
  ["권", 1.2], ["황", 1.2], ["안", 1.2], ["송", 1], ["류", 1], ["전", 1], ["홍", 0.9],
  ["고", 0.9], ["문", 0.9], ["양", 0.9], ["손", 0.9], ["배", 0.8], ["백", 0.7], ["허", 0.7],
  ["남", 0.5], ["노", 0.5], ["하", 0.5], ["곽", 0.4], ["성", 0.4], ["차", 0.4], ["주", 0.4],
];

// 2012~2014년생 남자아이에게 흔한 이름
const GIVEN_NAMES = [
  "민준", "서준", "도윤", "예준", "시우", "하준", "주원", "지호", "지후", "준우",
  "준서", "도현", "건우", "현우", "우진", "선우", "서진", "연우", "유준", "정우",
  "승우", "승현", "시윤", "준혁", "은우", "지환", "승민", "지우", "유찬", "윤우",
  "민성", "수호", "이준", "시후", "진우", "민재", "현준", "지원", "재윤", "태윤",
  "한결", "지안", "은찬", "로운", "하율", "윤호", "태민", "재민", "민혁", "성민",
];

// ── 상대 팀 핵심 선수 (모두 가상의 이름) ─────────────
// [학년, 포지션, 이름, 특징]. 학년은 주인공이 중1일 때 기준입니다.
//   "3학년선배" "2학년선배" "동기" "1년후배" "2년후배" (우리 팀 명단과 같은 방식으로 해마다 한 학년씩 올라가고, 3학년은 1월에 졸업)
// 특징은 "OO이/가 무기다"처럼 감독님 분석에 들어갑니다. 나머지 선수는 게임 시작 때 자동으로 만들어 그 판 안에서 고정됩니다.
// 이름·특징을 고치면 진행 중인 게임에도 바로 반영됩니다.
const OPPONENT_STARS = {
  // 주말리그 9팀: 5명씩
  "목포 갈매기FC U-15": [
    ["3학년선배", "FW", "남궁현", "뒷공간 침투"],
    ["2학년선배", "MF", "서지완", "왼발 롱패스"],
    ["동기", "DF", "오승기", "공중볼"],
    ["1년후배", "MF", "백시온", "탈압박"],
    ["2년후배", "FW", "차유건", "스피드"],
  ],
  "목포 유달중": [
    ["3학년선배", "DF", "문태경", "태클"],
    ["2학년선배", "FW", "길재혁", "헤더"],
    ["동기", "MF", "위성율", "중거리 슛"],
    ["1년후배", "DF", "표준영", "롱 스로인"],
    ["2년후배", "MF", "탁은결", "드리블"],
  ],
  "광양 쇠울중": [
    ["3학년선배", "MF", "구민결", "경기 조율"],
    ["2학년선배", "DF", "석강현", "몸싸움"],
    ["동기", "FW", "엄하람", "골 결정력"],
    ["1년후배", "MF", "반지호", "활동량"],
    ["2년후배", "DF", "국태린", "빌드업"],
  ],
  "광주 빛고을중": [
    ["3학년선배", "FW", "한고율", "오른발 감아 차기"],
    ["2학년선배", "MF", "노을찬", "킬패스"],
    ["동기", "MF", "기세찬", "드리블 돌파"],
    ["1년후배", "FW", "염도경", "침투"],
    ["2년후배", "DF", "설지훈", "커버 수비"],
  ],
  "순천 새벽별중": [
    ["3학년선배", "DF", "봉재윤", "제공권"],
    ["2학년선배", "MF", "김철만", "전방 압박"],
    ["동기", "FW", "은태하", "빠른 역습"],
    ["1년후배", "DF", "소하랑", "1 대 1 수비"],
    ["2년후배", "MF", "금도율", "세트피스 킥"],
  ],
  "장흥 정남진중": [
    ["3학년선배", "MF", "마준서", "거친 몸싸움"],
    ["2학년선배", "FW", "도한결", "끈질긴 압박"],
    ["동기", "DF", "팽주원", "투지"],
    ["1년후배", "FW", "경시율", "헤더"],
    ["2년후배", "MF", "피재민", "짧은 패스"],
  ],
  "해남 땅끝중": [
    ["3학년선배", "FW", "편승호", "왼발 슛"],
    ["2학년선배", "DF", "육태민", "롱패스"],
    ["동기", "MF", "함지운", "지치지 않는 체력"],
    ["1년후배", "DF", "명재혁", "태클"],
    ["2년후배", "FW", "옥서준", "스피드"],
  ],
  "영광 칠산중": [
    ["3학년선배", "DF", "변우람", "수비 조율"],
    ["2학년선배", "MF", "계도하", "침착함"],
    ["동기", "FW", "선우진", "문전 위치 선정"],
    ["1년후배", "MF", "하민결", "전진 패스"],
    ["2년후배", "DF", "우태건", "헤더"],
  ],
  "여수 바다솔중": [
    ["3학년선배", "MF", "진바름", "프리킥"],
    ["2학년선배", "FW", "공태오", "드리블"],
    ["동기", "DF", "모성훈", "제공권"],
    ["1년후배", "FW", "승지안", "침투"],
    ["2년후배", "MF", "남다온", "활동량"],
  ],
  // 전국대회 14팀: 3명씩
  "서울 한강중": [
    ["2학년선배", "MF", "강예찬", "경기 조율"],
    ["동기", "FW", "김도현", "골 결정력"],
    ["1년후배", "DF", "신해솔", "빌드업"],
  ],
  "경기 은하중": [
    ["2학년선배", "DF", "윤가람", "제공권"],
    ["동기", "MF", "이서진", "킬패스"],
    ["1년후배", "FW", "홍이든", "스피드"],
  ],
  "부산 파도중": [
    ["2학년선배", "FW", "배주안", "헤더"],
    ["동기", "DF", "정우진", "1 대 1 수비"],
    ["1년후배", "MF", "심로하", "킬패스"],
  ],
  "대구 달빛중": [
    ["2학년선배", "MF", "류건우", "중거리 슛"],
    ["동기", "FW", "지한별", "드리블"],
    ["1년후배", "DF", "채도윤", "태클"],
  ],
  "인천 갯벌FC U-15": [
    ["2학년선배", "DF", "조은산", "커버 수비"],
    ["동기", "FW", "최하준", "침투"],
    ["1년후배", "MF", "나윤석", "전방 압박"],
  ],
  "울산 고래중": [
    ["2학년선배", "MF", "방재원", "롱패스"],
    ["동기", "MF", "박지후", "탈압박"],
    ["1년후배", "FW", "권도하", "침투"],
  ],
  "강원 설악중": [
    ["2학년선배", "FW", "허산", "힘"],
    ["동기", "DF", "민재겸", "1 대 1 수비"],
    ["1년후배", "MF", "연우빈", "활동량"],
  ],
  "충북 미루나무중": [
    ["2학년선배", "DF", "길한솔", "헤더"],
    ["동기", "MF", "왕지석", "패스"],
    ["1년후배", "FW", "소재율", "골 결정력"],
  ],
  "제주 한라FC U-15": [
    ["2학년선배", "MF", "고산하", "바람을 읽는 롱볼"],
    ["동기", "FW", "부지환", "스피드"],
    ["1년후배", "DF", "양태솔", "투지"],
  ],
  "전북 모악산중": [
    ["2학년선배", "FW", "송시헌", "왼발 슛"],
    ["동기", "MF", "임채운", "드리블"],
    ["1년후배", "DF", "전하진", "제공권"],
  ],
  "대전 한밭별중": [
    ["2학년선배", "DF", "유건호", "수비 조율"],
    ["동기", "FW", "장은호", "침투"],
    ["1년후배", "MF", "서다원", "세트피스 킥"],
  ],
  "경남 진주성중": [
    ["2학년선배", "MF", "하성진", "전방 압박"],
    ["동기", "DF", "강태빈", "태클"],
    ["1년후배", "FW", "안시현", "헤더"],
  ],
  "경북 솔뫼중": [
    ["2학년선배", "FW", "권율하", "스피드"],
    ["동기", "MF", "도재하", "중거리 슛"],
    ["1년후배", "DF", "이솔민", "빌드업"],
  ],
  "세종 호수FC U-15": [
    ["2학년선배", "MF", "황보준", "경기 조율"],
    ["동기", "DF", "문지오", "공중볼"],
    ["1년후배", "FW", "손하율", "드리블"],
  ],
};

return { LEAGUE_OPPONENTS, HIGH_SCHOOLS, HS_TIERS, NATIONAL_OPPONENTS, ELEMENTARY_OPPONENTS, SURNAMES, GIVEN_NAMES, OPPONENT_STARS };
})();
(__fix["data/world.js"] || []).forEach(f => f());

// ── js/engine/season.js
__m["js/engine/season.js"] = (function () {
const {LEAGUE_OPPONENTS, NATIONAL_OPPONENTS, HIGH_SCHOOLS, HS_TIERS, ELEMENTARY_OPPONENTS} = __m["data/world.js"];
const {COMPS} = __m["data/calendar.js"];
const {rand, normal, shuffle, chance, weighted, pick} = __m["js/rng.js"];
const {ovr} = __m["js/engine/team.js"];
// 시즌 운영: 주말리그 순위표, 전국대회 조별리그·토너먼트, 진학 연습경기 상대 정하기




const US = "us";
const TEAM_NAME = "고흥FC";
const KO_BONUS = { "16강": 1, "8강": 2, "4강": 3, "결승": 4 };

function poisson(lambda) {
  const L = Math.exp(-lambda); let k = 0, p = 1;
  do { k++; p *= rand(); } while (p > L);
  return k - 1;
}
function simScore(a, b) {
  return [poisson(1.3 * Math.exp((a - b) / 12)), poisson(1.3 * Math.exp((b - a) / 12))];
}

const row = (id, name) => ({ id, name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
function addResult(table, id, gf, ga) {
  const r = table.find(x => x.id === id);
  if (!r) return;
  r.p++; r.gf += gf; r.ga += ga;
  if (gf > ga) { r.w++; r.pts += 3; } else if (gf === ga) { r.d++; r.pts += 1; } else r.l++;
}
const sortTable = t => t.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name));

// 원형 방식 리그 대진: 10팀이 9라운드 동안 한 번씩 만남 (팀 수가 짝수여야 함)
function roundRobin(ids) {
  const arr = ids.slice(); const rounds = [];
  for (let r = 0; r < arr.length - 1; r++) {
    const pairs = [];
    for (let i = 0; i < arr.length / 2; i++) pairs.push([arr[i], arr[arr.length - 1 - i]]);
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop());
  }
  return shuffle(rounds);
}

// ── 시즌 시작 ───────────────────────
function ensureSeason(state, info) {
  if (!info) return;
  if (info.phase === "league1" || info.phase === "league2") {
    const key = `${info.grade}-${info.phase}`;
    const stale = state.league?.key === key && !state.league.played && state.league.teams.length !== LEAGUE_OPPONENTS.length + 1;   // 예전 저장 파일
    if (state.league?.key !== key || stale) {
      const teams = [{ id: US, name: TEAM_NAME, strength: null },
        ...LEAGUE_OPPONENTS.map((o, i) => ({ id: `L${i}`, name: o.name, strength: 51 + o.strength + normal(0, 1.2), color: o.color, color2: o.color2 }))];
      state.league = {
        key, grade: info.grade, half: info.phase === "league1" ? "전반기" : "후반기",
        teams, table: teams.map(t => row(t.id, t.name)),
        rounds: roundRobin(teams.map(t => t.id)), played: 0, finished: false,
      };
    }
  }
  if (info.match && (info.match.comp === "summer" || info.match.comp === "winter")) {
    const key = `${info.grade}-${info.match.comp}`;
    if (state.tour?.key !== key) {
      const comp = COMPS[info.match.comp];
      const opps = shuffle(NATIONAL_OPPONENTS).map((o, i) => ({ id: `N${i}`, name: o.name, strength: 47 + o.strength + comp.bonus + normal(0, 1.2), color: o.color, color2: o.color2 }));
      const group = [{ id: US, name: TEAM_NAME, strength: null }, ...opps.slice(0, 3)];
      state.tour = {
        key, grade: info.grade, comp: info.match.comp, name: comp.name, label: comp.label,
        group, table: group.map(t => row(t.id, t.name)), pool: opps.slice(3),
        stage: "group", groupPlayed: 0, alive: true, best: "조별리그", log: [],
      };
    }
  }
}

// ── 이번 주 경기 상대 ───────────────
function matchFor(state, info) {
  if (!info?.match) return null;
  ensureSeason(state, info);
  const m = info.match, comp = COMPS[m.comp];
  const base = { comp: m.comp, compLabel: comp.label, round: m.round || null, official: comp.official, tournament: comp.tournament, ko: m.stage === "ko" };

  if (m.comp === "league") {
    const lg = state.league;
    const pairs = lg.rounds[info.leagueRound];
    if (!pairs) { if (!lg.finished) closeLeague(state, lg); return null; }   // 예전 저장 파일(7라운드)이 새 일정(9라운드)을 만난 경우
    const pair = pairs.find(p => p.includes(US));
    const opp = lg.teams.find(t => t.id === (pair[0] === US ? pair[1] : pair[0]));
    return { ...base, round: `${lg.half} ${info.leagueRound + 1}라운드`, leagueRound: info.leagueRound, opponent: opp };
  }

  if (m.comp === "summer" || m.comp === "winter") {
    const t = state.tour;
    if (!t.alive) return null;
    if (m.stage === "group") {
      const opp = t.group[1 + t.groupPlayed];
      return { ...base, opponent: opp };
    }
    if (t.stage !== "ko") return null;
    const key = `ko-${info.turn}`;
    let opp = state.rolls[key];
    if (!opp) {
      const o = t.pool.length ? t.pool.shift() : { id: "Nx", ...pick(NATIONAL_OPPONENTS), strength: 54 };
      opp = state.rolls[key] = { ...o, strength: o.strength + (KO_BONUS[m.round] || 0) };
    }
    return { ...base, opponent: opp };
  }

  // 연습경기 / 진학 연습경기
  let isHs = m.comp === "hs";
  if (m.comp === "friendly" && m.hsChance) {
    const key = `hs-${info.turn}`;
    // 진학할 학교를 이미 정한 중3에게는 고등학교 연습경기를 잡지 않음
    if (state.rolls[key] === undefined) state.rolls[key] = !(info.grade === 3 && state.career?.school) && chance(m.hsChance[info.grade] || 0);
    isHs = state.rolls[key];
  }
  if (isHs) {
    const key = `school-${info.turn}`;
    if (!state.rolls[key]) state.rolls[key] = pickSchool(state).id;
    const school = HIGH_SCHOOLS.find(s => s.id === state.rolls[key]);
    return { ...base, comp: "hs", compLabel: COMPS.hs.label, official: false, school,
      opponent: { id: school.id, name: `${school.name} 1학년`, strength: school.strength, color: school.color, color2: school.color2 } };
  }
  // 초등학교 팀과의 연습경기 (우리가 조금 우세)
  if (m.comp === "friendly" && m.elemChance) {
    const key = `el-${info.turn}`;
    if (state.rolls[key] === undefined) state.rolls[key] = chance(m.elemChance[info.grade] || 0) ? pick(ELEMENTARY_OPPONENTS).name : false;
    const el = ELEMENTARY_OPPONENTS.find(e => e.name === state.rolls[key]);
    if (el) return { ...base, elementary: true, opponent: { id: "E", name: el.name, strength: 50 + el.strength, color: el.color, color2: el.color2 } };
  }
  const key = `fr-${info.turn}`;
  if (!state.rolls[key]) {
    const o = pick(LEAGUE_OPPONENTS);
    state.rolls[key] = { id: "F", name: o.name, strength: 50 + o.strength, color: o.color, color2: o.color2 };
  }
  return { ...base, opponent: state.rolls[key] };
}

// 선수 수준에 맞는 학교가 더 자주 보러 옴
function pickSchool(state) {
  const o = ovr(state.player);
  const target = o >= 70 ? 4 : o >= 62 ? 3 : o >= 52 ? 2 : 1;
  return weighted(HIGH_SCHOOLS.map(s => [s, Math.exp(-Math.abs(HS_TIERS[s.tier].order - target) * 1.2)]));
}

// ── 결과 반영 ───────────────────────
// 반환: 메시지에 쓸 소식 목록
function applyResult(state, fx, gf, ga, { shootoutWin = null, rating = null, my = null } = {}) {
  const notes = [];
  if (fx.comp === "league") {
    const lg = state.league;
    for (const [a, b] of lg.rounds[fx.leagueRound] || []) {
      if (a === US || b === US) {
        const them = a === US ? b : a;
        addResult(lg.table, US, gf, ga); addResult(lg.table, them, ga, gf);
      } else {
        const ta = lg.teams.find(t => t.id === a), tb = lg.teams.find(t => t.id === b);
        const [x, y] = simScore(ta.strength, tb.strength);
        addResult(lg.table, a, x, y); addResult(lg.table, b, y, x);
      }
    }
    lg.played++;
    if (lg.played >= lg.rounds.length) notes.push(closeLeague(state, lg));
  }

  if (fx.comp === "summer" || fx.comp === "winter") {
    const t = state.tour;
    t.log.push({ round: fx.round, opponent: fx.opponent.name, gf, ga, shootoutWin });
    if (!fx.ko) {
      const i = t.groupPlayed;
      const opp = t.group[1 + i];
      addResult(t.table, US, gf, ga); addResult(t.table, opp.id, ga, gf);
      // 같은 조 나머지 두 팀 경기
      const others = t.group.slice(1).filter(x => x.id !== opp.id);
      const [x, y] = simScore(others[0].strength, others[1].strength);
      addResult(t.table, others[0].id, x, y); addResult(t.table, others[1].id, y, x);
      t.groupPlayed++;
      if (t.groupPlayed === 3) {
        const rank = sortTable(t.table).findIndex(r => r.id === US) + 1;
        if (rank <= 2) { t.stage = "ko"; notes.push(`조 ${rank}위로 토너먼트 진출!`); t.best = "토너먼트 진출"; }
        else { t.alive = false; t.best = "조별리그 탈락"; notes.push(`조 ${rank}위. 조별리그에서 탈락했다.`); finishTour(state); }
      }
    } else {
      const win = gf > ga || (gf === ga && shootoutWin);
      if (!win) {
        t.alive = false; t.best = fx.round === "결승" ? "준우승" : fx.round;
        notes.push(fx.round === "결승" ? "결승에서 아쉽게 졌다. 최종 성적 준우승." : `${fx.round}에서 탈락. 최종 성적 ${fx.round}.`);
        if (fx.round === "결승") state.flags.celebrate = { kind: "runnerUp", label: t.label, turn: state.calendar.turn };
        finishTour(state);
      } else if (fx.round === "결승") {
        t.alive = false; t.best = "우승"; t.champion = true;
        state.record.titles.push({ grade: t.grade, name: `${t.label} 우승`, national: true });
        state.flags.nationalChampion = true;
        state.flags.celebrate = { kind: "national", label: t.label, turn: state.calendar.turn };
        notes.push(`${t.name} 우승! 🏆`);
        finishTour(state);
      } else {
        t.best = { "16강": "8강", "8강": "4강", "4강": "결승" }[fx.round];
        notes.push(`${fx.round} 통과! 다음은 ${t.best}.`);
      }
    }
  }

  if (fx.comp === "hs") notes.push(...scoutAfter(state, fx, rating, my, gf, ga));
  if (fx.elementary) notes.push(...elementaryAfter(state, fx, rating, my, gf, ga));
  return notes;
}

// 리그를 마치고 순위를 기록
function closeLeague(state, lg) {
  lg.finished = true;
  const rank = sortTable(lg.table).findIndex(r => r.id === US) + 1;
  lg.finalRank = rank;
  state.record.leagues.push({ grade: lg.grade, half: lg.half, rank });
  if (rank === 1) {
    state.record.titles.push({ grade: lg.grade, name: `${lg.half} 주말리그 우승` });
    state.flags.celebrate = { kind: "league", label: `${lg.half} 주말리그`, turn: state.calendar.turn };
  }
  return rank === 1 ? `${lg.half} 주말리그 우승! ${lg.teams.length}팀 중 1위로 마쳤다 🏆` : `${lg.half} 주말리그가 끝났다. ${lg.teams.length}팀 중 최종 ${rank}위.`;
}

function finishTour(state) {
  const t = state.tour;
  state.record.tournaments.push({ grade: t.grade, comp: t.comp, name: t.label, best: t.best });
}

// ── 진학 연습경기 후 스카우트 관심도와 상대 감독 평가 ─
// 평가 문장은 [첫마디] + [내 경기에서 눈에 띈 점] + [몸·자세 이야기] + [끝맺음]을 상황에 맞게 골라 이어 붙임
const HS_TALK = {
  open: {
    great: ["오늘 경기 잘 봤다. 중학생이 고등학생 상대로 그렇게 뛰는 건 쉽지 않다.", "솔직히 놀랐다. 우리 1학년들이 너 하나를 못 막더라.", "경기 끝나고 우리 코치들이 네 번호부터 묻더라."],
    good:  ["오늘 경기 잘 봤다. 끝까지 공을 쫓아다니는 게 보이더구나.", "형들 상대로 겁먹지 않는 게 보였다. 그게 제일 어렵다.", "생각보다 침착하더라. 공을 받을 때 고개를 드는 게 좋았다."],
    ok:    ["고생했다. 고등학생 상대로 쉽지 않았을 거다.", "오늘은 무난했다. 아직 보여 줄 게 더 있을 것 같은데.", "한두 장면은 괜찮았다. 나머지는 다음에 보자."],
    low:   ["오늘은 몸이 좀 무거워 보였다.", "형들 속도에 많이 당황하더구나.", "오늘 경기는 너한테도 공부가 됐을 거다."],
  },
  detail: {
    goal:   ["골 장면, 마무리할 때 망설이지 않더라. 그건 가르쳐서 되는 게 아니다.", "우리 골키퍼가 꽤 하는 앤데, 그 앞에서 침착하게 넣더구나."],
    assist: ["골은 동료가 넣었지만 그 패스는 네 거였다. 시야가 좋다.", "도움 장면, 수비 사이를 보는 눈이 있더라."],
    sharp:  ["공을 잡을 때마다 뭔가를 만들어 내려는 게 보였다.", "선택이 빠르고 정확했다. 머리가 좋은 선수다."],
    shaky:  ["다만 공을 너무 오래 끌다 뺏기는 장면이 몇 번 있었다.", "결정적인 순간에 한 템포씩 늦었다. 고등학교는 그 한 템포가 다르다."],
    FW: ["공 없을 때 수비 뒷공간을 노리는 움직임은 합격이다."],
    MF: ["중원에서 공을 받는 위치가 좋았다. 형들 사이에서도 숨을 곳을 찾더라."],
    DF: ["수비 라인 맞추는 소리가 우리 쪽까지 들리더라. 그런 목소리 좋다."],
  },
  body: {
    weak:  ["몸은 아직 중학생이다. 웨이트는 지금부터 꾸준히 해라.", "몸싸움에서 자꾸 밀리더라. 고등학교 와서 1년은 몸 만드는 데 쓸 각오 해라."],
    fine:  ["몸싸움도 생각보다 버티더라. 기본기가 있는 몸이다."],
  },
  close: {
    offer: ["우리 학교에 올 생각이 있다면 문은 열려 있다. 너희 감독님께도 따로 말씀드려 두마."],
    watch: ["앞으로도 관심 있게 지켜보겠다.", "다음 경기도 보러 갈 생각이다. 그때도 오늘처럼만 해라.", "감독님께 네 이야기 잘 전해 두마."],
    cold:  ["중학교 마지막까지 어떻게 크는지 보겠다.", "아직은 판단하기 이르다. 다음에 또 보자."],
    young: ["중3 때 다시 보자. 그때도 오늘처럼만 해라.", "아직 어린데 기특하다. 몇 년 뒤가 더 기대된다.", "이름 기억해 두마. 몇 년 뒤에 다시 만나자."],
  },
};
function scoutAfter(state, fx, rating, my = null, gf = 0, ga = 0) {
  const s = fx.school;
  const sc = state.scouting[s.id] ||= { interest: 10, seen: 0, offered: false };
  sc.seen++;
  if (rating == null) {
    sc.interest = Math.max(0, sc.interest - 5);
    return [`${s.name} 감독님 앞에서 뛰지 못했다.`];
  }
  const g3 = state.calendar.grade === 3;
  const gain = (rating - 6.3) * 20 * (g3 ? 1 : 0.5);                 // 중1·중2 때 본 경기는 관심도에 절반만
  sc.interest = Math.max(0, Math.min(100, sc.interest + gain));
  const band = rating >= 8.2 ? "great" : rating >= 7.3 ? "good" : rating >= 6.4 ? "ok" : "low";
  const T = HS_TALK;
  const parts = [pick(T.open[band])];
  if (my?.goals) parts.push(pick(T.detail.goal));
  else if (my?.assists) parts.push(pick(T.detail.assist));
  if (my?.n >= 3) parts.push(my.ok / my.n >= 0.6 ? pick(T.detail.sharp) : my.ok / my.n <= 0.34 ? pick(T.detail.shaky) : pick(T.detail[my.pos] || T.detail.MF));
  else if (my?.pos) parts.push(pick(T.detail[my.pos]));
  if (my) parts.push(my.phys > 0.05 ? pick(T.body.weak) : pick(T.body.fine));
  if (band === "great" && !sc.offered && g3) { sc.offered = true; parts.push(pick(T.close.offer)); }   // 입학 제안은 중3에게만
  else if (!g3 && (band === "great" || band === "good")) parts.push(pick(T.close.young));
  else parts.push(pick(band === "low" ? T.close.cold : T.close.watch));
  if (band === "low" && rating < 5.8) return [`${s.name} 감독님은 짧게 한마디만 하고 돌아가셨다. "${parts[0]}"`];
  const title = sc.offered && band === "great" ? `${s.name}에서 연락이 왔습니다` : `${s.name} 감독님의 평가`;
  return [{ from: s.coach, title, body: parts.join(" ") }];
}

// ── 초등학교 팀과의 연습경기 뒤 ─
const ELEM_TALK = {
  win:  ["오늘 우리 아이들 상대해 줘서 고맙다. 형들 공 차는 거 보고 많이 배웠을 거다.", "역시 중학생은 다르구나. 우리 애들 눈이 반짝반짝하더라."],
  draw: ["비겼네! 우리 애들 오늘 저녁에 자랑하느라 정신없겠다. 형들이 봐준 거 다 안다.", "우리 애들이 형들 상대로 비겼다고 난리다. 다음에 또 붙자."],
  loss: ["하하, 오늘은 우리 애들이 이겼구나. 형들이 좀 방심했지?", "우리 애들도 놀랐다. 중학생 형들을 이길 줄은 몰랐다고."],
  me:   ["{name} 형 사인 받고 싶다는 애가 셋이나 된다. 다음엔 펜 좀 챙겨 와라.", "우리 애들 중에 {name} 형처럼 되고 싶다는 녀석이 생겼다.", "경기 끝나고 {name} 형 몇 번이냐고 묻는 애들이 있었다."],
};
function elementaryAfter(state, fx, rating, my, gf, ga) {
  const key = gf > ga ? "win" : gf < ga ? "loss" : "draw";
  const parts = [pick(ELEM_TALK[key])];
  if (rating != null && (rating >= 7.2 || my?.goals)) parts.push(pick(ELEM_TALK.me).replaceAll("{name}", state.player.name));
  const notes = [{ from: `${fx.opponent.name} 감독님`, title: "오늘 경기 고맙다", body: parts.join("\n\n") }];
  if (gf <= ga) notes.push("초등학생 팀을 상대로 이기지 못했다. 한동안 놀림감이 될 것 같다.");
  return notes;
}

// 그 주 경기가 아직 열리는지 (탈락한 대회의 다음 라운드, 예전 저장 파일의 없는 리그 라운드는 false)
function stillScheduled(state, i) {
  if (!i.match) return true;
  if (i.match.comp === "league" && state.league?.key === `${i.grade}-${i.phase}` && !state.league.rounds[i.leagueRound]) return false;
  if ((i.match.comp === "summer" || i.match.comp === "winter") && i.match.stage === "ko") {
    const t = state.tour;
    if (t && t.key === `${i.grade}-${i.match.comp}` && (!t.alive || t.stage !== "ko")) return t.alive && t.stage === "group" ? true : false;
  }
  return true;
}

function tierLabel(tier) { return HS_TIERS[tier].label; }

return { US, TEAM_NAME, simScore, sortTable, ensureSeason, matchFor, applyResult, scoutAfter, elementaryAfter, stillScheduled, tierLabel };
})();
(__fix["js/engine/season.js"] || []).forEach(f => f());

// ── data/match.js
__m["data/match.js"] = (function () {

// 경기 장면과 해설 문구. 장면을 추가하면 경기 중에 자동으로 섞여 나옵니다.
//
// 장면(situation)
//   pos     : 이 장면이 나오는 포지션
//   zone    : 전술판에서 공이 놓일 곳 (att 공격 / mid 중원 / def 수비)
//   text    : 상황 설명 (여러 개면 무작위)
//   choices : 선택지
//     stats : 성공 확률 계산에 쓰는 능력치와 비중
//     diff  : 난이도 (상대 수준에 더함. +면 어렵고 -면 쉬움)
//     win / lose : 결과 종류 (아래 OUTCOMES)
//     winText / loseText : 결과 문장
//   intro   : false면 "공이 나에게 온다" 문장 없이 바로 상황 설명으로 시작
//   late / leading / trailing : 경기 막판(55분 이후) / 앞설 때 / 뒤질 때만 나옴
//   once    : 한 경기에 한 번만 나옴
//
// 문장 안의 {mate}는 우리 팀 동료, {opp}는 상대 선수 이름으로 바뀝니다.
// {mate|이/가}처럼 쓰면 이름 받침에 맞춰 조사가 붙습니다.

const OUTCOMES = {
  goal:     { label: "득점",        rating: 1.0 },
  shot:     { label: "슈팅 찬스",    rating: 0.25 },
  head:     { label: "헤더 찬스",    rating: 0.25 },
  assist:   { label: "결정적 패스",  rating: 0.3 },
  keyPass:  { label: "기회 창출",    rating: 0.2 },
  killPass: { label: "킬패스",       rating: 0.35 },
  chip:     { label: "특기 슈팅",    rating: 0.3 },
  win:      { label: "수비 성공",    rating: 0.3 },
  keep:     { label: "공 지킴",      rating: 0.1 },
  miss:     { label: "무산",        rating: -0.1 },
  turnover: { label: "공 뺏김",      rating: -0.25 },
  danger:   { label: "위기 허용",    rating: -0.35 },
  tapIn:    { label: "문전 마무리",  rating: 0.3 },
  pk:       { label: "페널티킥 성공", rating: 0.1 },
  matePk:   { label: "키커 양보",    rating: 0.05 },
  setPiece: { label: "프리킥 획득",  rating: 0.15 },
  offside:  { label: "오프사이드",   rating: -0.05 },
  pkAgainst:{ label: "페널티킥 허용", rating: -0.5 },
  longShot: { label: "중거리 슈팅",  rating: 0.2 },
  acro:     { label: "곡예 슈팅",    rating: 0.3 },
  card:     { label: "경고",        rating: -0.2 },
  decoy:    { label: "공간 창출",    rating: 0.2 },
};

const SITUATIONS = [
  // ── 공격수 ─────────────────────────
  { id: "fw_1v1", pos: ["FW"], zone: "att", weight: 3,
    text: ["페널티 박스 앞, 수비수 한 명과 1 대 1로 마주 섰다.", "측면에서 공을 받았다. 앞에는 수비수 한 명뿐이다."],
    choices: [
      { label: "드리블로 제친다", stats: { "tech.dribble": 0.6, "phys.speed": 0.4 }, diff: 0, win: "shot", lose: "turnover",
        winText: ["몸을 한 번 흔들고 수비를 벗겨 냈다!", "공을 툭 치고 스피드로 따돌렸다!"], loseText: ["수비수 발끝에 공이 걸렸다.", "너무 길게 쳤다. 수비가 먼저 걷어 낸다."] },
      { label: "옆으로 내준다", stats: { "tech.pass": 0.8, "mental.teamwork": 0.2 }, diff: -6, win: "keyPass", lose: "turnover",
        winText: ["침착하게 {mate}에게 내줬다.", "수비를 끌어 놓고 {mate}에게 패스!"], loseText: ["패스가 수비 다리에 맞았다."] },
      { label: "바로 때린다", stats: { "tech.shoot": 1 }, diff: 10, win: "shot", lose: "miss",
        winText: ["수비 다리 사이로 낮게 깔아 찼다!", "생각할 틈도 없이 발을 휘둘렀다!"], loseText: ["슈팅이 수비수 몸에 막혔다.", "골대 위로 크게 뜬다."] },
    ] },
  { id: "fw_through", intro: false, pos: ["FW"], zone: "att", weight: 3,
    text: ["수비 뒷공간으로 스루패스가 들어온다!", "{mate|이/가} 찔러 준 공이 수비 사이로 굴러온다."],
    choices: [
      { label: "잡아 놓고 슈팅", stats: { "tech.firstTouch": 0.6, "phys.speed": 0.4 }, diff: 2, win: "shot", lose: "turnover",
        winText: ["첫 터치가 완벽하다. 골키퍼와 마주했다!"], loseText: ["첫 터치가 길었다. 골키퍼가 먼저 덮친다."] },
      { label: "원터치 슈팅", stats: { "tech.shoot": 0.7, "tech.firstTouch": 0.3 }, diff: 8, win: "shot", lose: "miss",
        winText: ["달려오던 그대로 발을 갖다 댔다!"], loseText: ["발에 제대로 맞지 않았다. 옆 그물."] },
    ] },
  { id: "fw_cross", intro: false, pos: ["FW"], zone: "att", weight: 2,
    text: ["측면에서 크로스가 올라온다.", "{mate|이/가} 오른쪽에서 공을 띄운다."],
    choices: [
      { label: "헤더로 노린다", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 2, win: "head", lose: "miss", physical: true,
        winText: ["수비보다 한 뼘 높이 떴다!"], loseText: ["수비수가 먼저 머리를 갖다 댄다."] },
      { label: "가슴으로 받아 슈팅", stats: { "tech.firstTouch": 0.5, "tech.shoot": 0.5 }, diff: 8, win: "shot", lose: "turnover",
        winText: ["가슴으로 떨어뜨리고 그대로 발리!"], loseText: ["트래핑하는 사이 수비가 달라붙었다."] },
    ] },
  { id: "fw_hold", pos: ["FW"], zone: "att", weight: 2,
    text: ["등을 지고 공을 받았다. 수비가 뒤에서 몸을 붙여 온다."],
    choices: [
      { label: "버티고 내준다", stats: { "phys.strength": 0.6, "tech.pass": 0.4 }, diff: 0, win: "keyPass", lose: "turnover", physical: true,
        winText: ["끝까지 버티다 달려오는 {mate}에게 내줬다."], loseText: ["몸싸움에서 밀려 넘어졌다. 반칙은 없다."] },
      { label: "돌아선다", stats: { "phys.agility": 0.5, "tech.dribble": 0.5 }, diff: 7, win: "shot", lose: "turnover",
        winText: ["순간적으로 몸을 돌렸다! 골문이 보인다."], loseText: ["돌아서다 공을 흘렸다."] },
    ] },
  { id: "fw_press", intro: false, poss: "them", pos: ["FW"], zone: "att", weight: 1,
    text: ["상대 수비가 뒤에서 느긋하게 공을 돌린다."],
    choices: [
      { label: "전방 압박", stats: { "phys.stamina": 0.5, "mental.competitive": 0.5 }, diff: 4, win: "shot", lose: "keep",
        winText: ["끝까지 따라붙어 공을 빼앗았다! 바로 골문 앞이다!"], loseText: ["한 발 늦었다. 그래도 상대를 뒤로 몰았다."] },
      { label: "자리 지키기", stats: { "mental.focus": 1 }, diff: -10, win: "keep", lose: "keep",
        winText: ["무리하지 않고 패스 길을 막았다."], loseText: ["상대가 편하게 공을 돌린다."] },
    ] },

  // ── 미드필더 ───────────────────────
  { id: "mf_press", pos: ["MF"], zone: "mid", weight: 3,
    text: ["중원에서 공을 받는 순간 상대 둘이 달려든다.", "등 뒤로 압박이 붙었다."],
    choices: [
      { label: "원터치로 내준다", stats: { "tech.firstTouch": 0.5, "tech.pass": 0.5 }, diff: -2, win: "keep", lose: "turnover",
        winText: ["원터치로 깔끔하게 {mate}에게 연결했다."], loseText: ["패스가 짧았다. 상대가 가로챈다."] },
      { label: "드리블로 탈압박", stats: { "tech.dribble": 0.5, "phys.agility": 0.5 }, diff: 5, win: "keyPass", lose: "danger",
        winText: ["한 명, 두 명 벗겨 내고 앞으로! 공간이 열렸다."], loseText: ["압박에 갇혔다. 상대 역습이다!"] },
      { label: "뒤로 돌린다", stats: { "tech.pass": 1 }, diff: -14, win: "keep", lose: "turnover",
        winText: ["안전하게 수비에게 돌렸다."], loseText: ["백패스가 약했다!"] },
    ] },
  { id: "mf_space", pos: ["MF"], zone: "mid", weight: 3,
    text: ["앞이 열렸다. 공격수들이 뛰기 시작한다.", "상대 미드필더가 올라간 사이 공간이 생겼다."],
    choices: [
      { label: "스루패스", stats: { "tech.pass": 0.7, "mental.focus": 0.3 }, diff: 6, win: "assist", lose: "turnover",
        winText: ["수비 사이로 찔러 넣은 공이 {mate} 발 앞에 떨어진다!"], loseText: ["패스가 조금 길었다. 골키퍼가 잡는다."] },
      { label: "직접 몰고 간다", stats: { "tech.dribble": 0.5, "phys.speed": 0.5 }, diff: 5, win: "shot", lose: "turnover",
        winText: ["하프라인부터 단독 돌파! 박스 앞까지 왔다."], loseText: ["태클에 걸렸다."] },
      { label: "중거리 슈팅", stats: { "tech.shoot": 1 }, diff: 14, win: "shot", lose: "miss",
        winText: ["25미터 밖에서 힘껏 때렸다! 공이 골문으로 날아간다!"], loseText: ["힘이 너무 들어갔다. 관중석으로."] },
    ] },
  { id: "mf_switch", pos: ["MF"], zone: "mid", weight: 2,
    text: ["상대가 한쪽으로 몰려 있다. 반대편 측면이 텅 비었다."],
    choices: [
      { label: "반대편으로 롱패스", stats: { "tech.pass": 0.6, "tech.cross": 0.4 }, diff: 3, win: "keyPass", lose: "turnover",
        winText: ["40미터 대각선 패스! {mate|이/가} 받아서 치고 들어간다."], loseText: ["터치라인 밖으로 나갔다."] },
      { label: "직접 크로스", stats: { "tech.cross": 1 }, diff: 6, win: "assist", lose: "miss",
        winText: ["날카로운 크로스가 골문 앞으로!"], loseText: ["크로스가 골키퍼 품에 안겼다."] },
    ] },
  { id: "mf_defend", poss: "them", pos: ["MF"], zone: "mid", weight: 2,
    text: ["상대가 역습을 시작했다. 막아야 한다!"],
    choices: [
      { label: "태클", stats: { "tech.defense": 0.6, "phys.strength": 0.4 }, diff: 3, win: "win", lose: "danger", physical: true,
        winText: ["정확한 태클로 공만 걷어 냈다."], loseText: ["태클이 빗나갔다! 상대가 빠져나간다."] },
      { label: "속도 늦추기", stats: { "mental.focus": 0.5, "tech.defense": 0.5 }, diff: -5, win: "win", lose: "turnover",
        winText: ["앞을 막고 버텼다. 동료들이 돌아왔다."], loseText: ["상대가 패스로 풀어 나간다."] },
    ] },
  { id: "mf_second", intro: false, pos: ["MF", "DF"], zone: "mid", weight: 1,
    text: ["골킥이 떨어진 자리, 세컨드볼 다툼이다."],
    choices: [
      { label: "몸으로 따낸다", stats: { "phys.strength": 0.6, "mental.competitive": 0.4 }, diff: 1, win: "keep", lose: "turnover", physical: true,
        winText: ["어깨싸움에서 이겼다. 공은 우리 것."], loseText: ["튕겨 나갔다."] },
      { label: "머리로 떨군다", stats: { "phys.jump": 1 }, diff: 2, win: "keyPass", lose: "turnover", physical: true,
        winText: ["헤더로 {mate} 앞에 정확히 떨궜다."], loseText: ["타이밍이 늦었다."] },
    ] },

  // ── 수비수 ─────────────────────────
  { id: "df_1v1", poss: "them", pos: ["DF"], zone: "def", weight: 3,
    text: ["상대 공격수 {opp|이/가} 빠르게 치고 들어온다.", "{opp|이/가} 측면을 타고 돌파를 시도한다."],
    choices: [
      { label: "태클", stats: { "tech.defense": 0.6, "phys.speed": 0.4 }, diff: 4, win: "win", lose: "danger",
        winText: ["미끄러지듯 들어간 태클, 공만 정확히 빼냈다!"], loseText: ["태클이 늦었다! {opp|이/가} 빠져나간다."] },
      { label: "거리를 두고 막기", stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: -3, win: "win", lose: "turnover",
        winText: ["거리를 유지하며 슈팅 각도를 지웠다."], loseText: ["크로스를 허용했다."] },
    ] },
  { id: "df_cross", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 3,
    text: ["상대 측면에서 크로스가 올라온다.", "코너킥. 상대 장신 선수가 들어온다."],
    choices: [
      { label: "헤더로 걷어 낸다", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 2, win: "win", lose: "danger", physical: true,
        winText: ["가장 높이 떠서 멀리 걷어 냈다."], loseText: ["{opp}에게 먼저 머리를 내줬다!"] },
      { label: "몸으로 밀착", stats: { "phys.strength": 0.7, "mental.focus": 0.3 }, diff: 3, win: "win", lose: "danger", physical: true,
        winText: ["몸을 붙여 {opp}의 점프를 막았다."], loseText: ["밀려났다! 골문 앞 혼전."] },
    ] },
  { id: "df_build", intro: false, pos: ["DF"], zone: "def", weight: 2,
    text: ["골키퍼가 공을 건넸다. 상대가 전방에서 압박한다."],
    choices: [
      { label: "짧게 연결", stats: { "tech.pass": 0.7, "tech.firstTouch": 0.3 }, diff: -6, win: "keep", lose: "danger",
        winText: ["침착하게 {mate}에게 연결. 압박을 풀었다."], loseText: ["패스가 끊겼다! 골문 앞에서 뺏겼다!"] },
      { label: "길게 찬다", stats: { "tech.pass": 0.5, "tech.cross": 0.5 }, diff: 3, win: "keyPass", lose: "turnover",
        winText: ["전방의 {mate}에게 정확히 떨어졌다."], loseText: ["상대 수비에게 그대로 갔다."] },
      { label: "직접 몰고 나간다", stats: { "tech.dribble": 0.6, "mental.confidence": 0.4 }, diff: 9, win: "keyPass", lose: "danger",
        winText: ["압박을 벗기고 하프라인까지 치고 올라갔다!"], loseText: ["뺏겼다! 위험하다!"] },
    ] },
  { id: "df_through", poss: "them", pos: ["DF"], zone: "def", weight: 2,
    text: ["상대가 수비 뒷공간을 노리고 있다."],
    choices: [
      { label: "라인 올리기", stats: { "mental.focus": 0.6, "mental.teamwork": 0.4 }, diff: 4, win: "win", lose: "danger",
        winText: ["동시에 올라섰다. 오프사이드!"], loseText: ["혼자 늦었다! 오프사이드가 아니다!"] },
      { label: "같이 뛴다", stats: { "phys.speed": 0.7, "phys.stamina": 0.3 }, diff: 2, win: "win", lose: "danger",
        winText: ["끝까지 따라붙어 공을 먼저 걷어 냈다."], loseText: ["{opp|이/가} 한 발 빨랐다."] },
    ] },
  { id: "df_corner", intro: false, pos: ["DF"], zone: "att", weight: 1,
    text: ["우리 팀 코너킥. 감독님이 올라가라고 손짓하신다."],
    choices: [
      { label: "공격 가담 헤더", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 8, win: "head", lose: "miss", physical: true,
        winText: ["상대 수비 머리 위로 솟구쳤다!"], loseText: ["헤더가 골대 위로 넘어갔다."] },
      { label: "뒤에 남는다", stats: { "mental.focus": 1 }, diff: -12, win: "keep", lose: "keep",
        winText: ["역습에 대비해 자리를 지켰다."], loseText: ["역습에 대비해 자리를 지켰다."] },
    ] },

  // ── 중거리, 코너킥 헤더, 화려한 개인기 ─────────
  // requires: 이 능력치를 넘어야 나오는 장면·선택지 (★ 특기로 표시)
  { id: "df_longshot", intro: false, pos: ["DF", "MF"], zone: "att", weight: 1,
    text: ["코너킥 뒤 걷혀 나온 공이 페널티 박스 밖, 내 앞으로 굴러온다.", "상대가 걷어 낸 공이 아크 서클 밖에 떨어졌다. 수비 한 명이 뒤늦게 달려온다."],
    choices: [
      { label: "그대로 중거리 슈팅", stats: { "tech.shoot": 0.8, "mental.confidence": 0.2 }, diff: 10, win: "longShot", lose: "miss",
        winText: ["발등에 제대로 얹었다! 공이 낮게 깔려 날아간다!", "공이 떨어지는 순간 그대로 때렸다!"], loseText: ["너무 힘이 들어갔다. 관중석으로 날아간다.", "발에 빗맞았다. 공이 힘없이 굴러간다."] },
      { label: "다시 측면으로 벌린다", stats: { "tech.pass": 0.7, "mental.focus": 0.3 }, diff: -6, win: "keep", lose: "turnover",
        winText: ["서두르지 않고 측면으로 벌렸다. 다시 공격을 만든다."], loseText: ["패스가 짧았다. 상대에게 걸렸다."] },
      { label: "한 번 접고 슈팅 각 만들기", requires: { "tech.dribble": 62, "tech.shoot": 60 }, stats: { "tech.dribble": 0.5, "tech.shoot": 0.5 }, diff: 8, win: "shot", lose: "turnover",
        winText: ["달려든 수비를 한 번 접어 놓고 슈팅 각을 만들었다!"], loseText: ["접는 순간 다른 수비가 막아섰다."] },
    ] },
  { id: "att_corner_head", intro: false, pos: ["FW", "MF", "DF"], zone: "att", weight: 1,
    text: ["코너킥. 문전에 양 팀 선수들이 엉켜 있다. 공이 날아온다.", "우리 팀 코너킥. 키커가 손을 들어 신호를 보내고 공을 올린다."],
    choices: [
      { label: "니어포스트로 뛰어들어 헤더", stats: { "phys.jump": 0.5, "phys.speed": 0.2, "tech.shoot": 0.3 }, diff: 6, win: "head", lose: "miss", physical: true,
        winText: ["수비 앞을 먼저 잘라 들어가 머리를 갖다 댔다!"], loseText: ["한 발 늦었다. 수비가 먼저 걷어 낸다."] },
      { label: "뒤로 빠져 흘러나오는 공 노리기", stats: { "mental.focus": 0.5, "tech.shoot": 0.5 }, diff: 2, win: "longShot", lose: "keep",
        winText: ["예상대로 공이 흘러나왔다. 그대로 발을 휘두른다!"], loseText: ["공이 반대쪽으로 흘렀다. 자리를 지킨다."] },
      { label: "수비를 끌고 나가 공간 만들기", stats: { "mental.teamwork": 0.6, "phys.strength": 0.4 }, diff: -4, win: "decoy", lose: "keep",
        winText: ["내가 수비 둘을 끌고 나가자 {mate} 앞이 비었다!"], loseText: ["아무도 따라오지 않았다. 공은 다른 곳으로 갔다."] },
      { label: "몸을 날려 바이시클 킥", requires: { "phys.jump": 70, "phys.agility": 66 }, stats: { "phys.jump": 0.4, "phys.agility": 0.3, "tech.shoot": 0.3 }, diff: 14, win: "acro", lose: "miss", physical: true,
        winText: ["등 뒤로 넘어가는 공을 향해 몸을 거꾸로 띄웠다!"], loseText: ["발이 허공을 갈랐다. 엉덩방아만 찧었다."] },
    ] },
  { id: "skill_wing", pos: ["FW", "MF"], zone: "att", weight: 2, requires: { "tech.dribble": 58 },
    text: ["측면에서 공을 잡았다. 수비수가 거리를 두고 버틴다.", "터치라인 근처, 수비 한 명이 나를 막아선다. 뒤에는 공간이 있다."],
    choices: [
      { label: "헛다리 짚고 안쪽으로", stats: { "tech.dribble": 0.7, "phys.agility": 0.3 }, diff: 2, win: "shot", lose: "turnover",
        winText: ["헛다리 두 번에 수비 중심이 무너졌다! 안으로 파고든다!"], loseText: ["수비가 속지 않았다. 공을 빼앗겼다."] },
      { label: "크로스를 올린다", stats: { "tech.cross": 0.8, "mental.focus": 0.2 }, diff: -2, win: "assist", lose: "miss",
        winText: ["수비 머리를 넘긴 크로스가 {mate} 앞에 떨어진다!"], loseText: ["크로스가 너무 길었다. 반대편으로 나간다."] },
      { label: "사포로 머리 위를 넘긴다", requires: { "tech.dribble": 72, "phys.agility": 64 }, stats: { "tech.dribble": 0.6, "phys.agility": 0.4 }, diff: 12, win: "shot", lose: "turnover",
        winText: ["뒤꿈치로 공을 띄워 수비 머리 위로 넘겼다! 관중석이 뒤집어진다!"], loseText: ["공이 너무 높이 떴다. 수비가 가볍게 받아 냈다."] },
      { label: "라보나 크로스", requires: { "tech.cross": 70, "tech.pass": 66 }, stats: { "tech.cross": 0.6, "tech.pass": 0.4 }, diff: 10, win: "assist", lose: "turnover",
        winText: ["디딤발 뒤로 다리를 감아 올린 크로스! 수비 타이밍을 완전히 빼앗았다!"], loseText: ["멋을 부리다 공이 발에 제대로 안 맞았다."] },
    ] },
  { id: "mf_heel", intro: false, pos: ["MF", "FW"], zone: "att", weight: 1, requires: { "tech.pass": 60 },
    text: ["박스 앞에서 등을 지고 공을 받았다. 뒤로 {mate|이/가} 뛰어 들어온다."],
    choices: [
      { label: "돌아서 직접 슈팅", stats: { "tech.firstTouch": 0.4, "tech.shoot": 0.6 }, diff: 8, win: "shot", lose: "turnover",
        winText: ["한 번에 몸을 돌려 슈팅 각을 만들었다!"], loseText: ["돌아서는 순간 수비가 공을 걷어 냈다."] },
      { label: "보지 않고 힐킥 패스", requires: { "tech.pass": 66, "mental.focus": 60 }, stats: { "tech.pass": 0.6, "mental.focus": 0.4 }, diff: 6, win: "killPass", lose: "turnover",
        winText: ["뒤꿈치로 툭. 아무도 예상 못 한 패스가 {mate} 발 앞에 떨어진다!"], loseText: ["힐킥이 {mate}보다 반 박자 빨랐다."] },
      { label: "공을 지키며 동료 기다리기", stats: { "phys.strength": 0.6, "mental.teamwork": 0.4 }, diff: -4, win: "keyPass", lose: "turnover", physical: true,
        winText: ["끝까지 버티다 {mate}에게 살짝 밀어 줬다."], loseText: ["버티다 넘어졌다. 반칙은 불리지 않았다."] },
    ] },
  { id: "df_slide_counter", poss: "them", pos: ["DF", "MF"], zone: "def", weight: 1, requires: { "tech.defense": 58 },
    text: ["상대 역습. {opp|이/가} 공을 몰고 하프라인을 넘어온다. 내가 제일 가깝다."],
    choices: [
      { label: "깔끔하게 공만 뺏는다", stats: { "tech.defense": 0.7, "phys.speed": 0.3 }, diff: 2, win: "win", lose: "danger",
        winText: ["타이밍을 재다가 공만 정확히 걷어 냈다!"], loseText: ["발을 뻗었는데 공이 다리 사이로 빠져나갔다!"] },
      { label: "뺏고 바로 롱패스 역습", requires: { "tech.defense": 66, "tech.pass": 60 }, stats: { "tech.defense": 0.5, "tech.pass": 0.5 }, diff: 6, win: "keyPass", lose: "danger",
        winText: ["뺏자마자 앞으로 길게! {mate|이/가} 달린다!"], loseText: ["뺏는 데까지는 좋았는데 패스가 다시 상대에게 갔다."] },
      { label: "파울로 끊는다", stats: { "mental.focus": 0.5, "phys.strength": 0.5 }, diff: -10, win: "keep", lose: "card",
        winText: ["영리하게 끊었다. 주심이 구두 경고만 하고 넘어간다."], loseText: ["끊긴 했는데 주심이 옐로카드를 꺼낸다."] },
    ] },

  // ── 공통 ───────────────────────────
  { id: "freekick", intro: false, pos: ["FW", "MF"], zone: "att", weight: 1,
    text: ["박스 바로 앞에서 프리킥을 얻었다. 공 앞에 섰다."],
    choices: [
      { label: "직접 찬다", stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 14, win: "shot", lose: "miss",
        winText: ["공이 벽을 넘어 휘어 들어간다!"], loseText: ["벽에 맞았다."] },
      { label: "동료에게 맡긴다", stats: { "mental.teamwork": 1 }, diff: -15, win: "setPiece", lose: "setPiece",
        winText: ["{mate}에게 공을 양보했다."], loseText: ["{mate}에게 공을 양보했다."] },
    ] },
  // ── 추가 장면: 공격수 ──────────────
  { id: "fw_rebound", intro: false, pos: ["FW"], zone: "att", weight: 1,
    text: ["{mate}의 슈팅을 골키퍼가 쳐 냈다. 공이 박스 안으로 흘러나온다!", "골대를 맞고 튀어나온 공이 내 앞으로 떨어진다!"],
    choices: [
      { label: "바로 밀어 넣는다", stats: { "tech.firstTouch": 0.4, "tech.shoot": 0.4, "mental.focus": 0.2 }, diff: -4, win: "tapIn", lose: "miss",
        winText: ["넘어지면서도 발끝을 갖다 댔다!", "누구보다 먼저 공에 발을 뻗었다!"], loseText: ["발에 제대로 맞지 않았다. 수비가 걷어 낸다."] },
      { label: "한 번 잡고 각을 본다", stats: { "tech.firstTouch": 0.6, "mental.focus": 0.4 }, diff: 4, win: "shot", lose: "turnover",
        winText: ["침착하게 잡아 놓았다. 골키퍼가 아직 일어나지 못했다!"], loseText: ["잡는 사이 수비 셋이 몰려왔다."] },
    ] },
  { id: "fw_counter", intro: false, pos: ["FW"], zone: "att", weight: 1,
    text: ["역습! 공을 몰고 달린다. 옆에서 {mate}도 같이 뛴다. 막는 수비는 한 명뿐.", "2 대 1이다. 수비수 한 명이 뒷걸음질 친다. 오른쪽에 {mate|이/가} 있다."],
    choices: [
      { label: "끌고 가다 내준다", stats: { "tech.pass": 0.5, "mental.focus": 0.5 }, diff: -2, win: "assist", lose: "turnover",
        winText: ["수비가 나에게 붙는 순간 옆으로 밀어 줬다!"], loseText: ["패스 타이밍이 늦었다. 수비 발에 걸렸다."] },
      { label: "끝까지 직접 해결", stats: { "phys.speed": 0.4, "tech.shoot": 0.6 }, diff: 6, win: "shot", lose: "miss",
        winText: ["수비가 패스를 의식한 순간, 그대로 치고 들어갔다!"], loseText: ["욕심이었다. 각이 없는 데서 때렸다."] },
    ] },
  { id: "fw_offside", intro: false, pos: ["FW"], zone: "att", weight: 2,
    text: ["{mate|이/가} 공을 잡고 고개를 든다. 상대 수비 라인이 한 줄로 서 있다."],
    choices: [
      { label: "뒷공간으로 침투", stats: { "mental.focus": 0.5, "phys.speed": 0.5 }, diff: 3, win: "shot", lose: "offside",
        winText: ["타이밍이 딱 맞았다! 라인을 깨고 골키퍼와 마주했다!"], loseText: ["한 발 먼저 나갔다. 부심 깃발이 올라간다. 오프사이드."] },
      { label: "내려와서 받아 준다", stats: { "tech.firstTouch": 0.6, "mental.teamwork": 0.4 }, diff: -6, win: "keyPass", lose: "turnover",
        winText: ["내려와 받아 주고 측면으로 벌렸다. {mate|이/가} 달려 들어간다."], loseText: ["받는 순간 뒤에서 수비가 발을 넣었다."] },
    ] },
  { id: "fw_volley", intro: false, pos: ["FW", "MF"], zone: "att", weight: 1,
    text: ["상대가 걷어 낸 공이 허리 높이로 떠서 박스 앞으로 날아온다."],
    choices: [
      { label: "논스톱 발리", stats: { "tech.shoot": 0.6, "phys.agility": 0.4 }, diff: 12, win: "shot", lose: "miss",
        winText: ["떨어지는 공을 그대로 후려쳤다!"], loseText: ["공이 발등 옆에 맞았다. 하늘 높이 뜬다."] },
      { label: "가슴으로 잡아 놓는다", stats: { "tech.firstTouch": 0.7, "phys.strength": 0.3 }, diff: 2, win: "keep", lose: "turnover",
        winText: ["부드럽게 잡아 놓고 {mate}에게 내줬다."], loseText: ["트래핑이 튀었다. 상대가 먼저 걷어 낸다."] },
    ] },
  { id: "fw_last", intro: false, pos: ["FW", "MF"], zone: "att", weight: 3, late: true, trailing: true,
    text: ["시간이 얼마 없다. 한 골이 필요하다. 박스 앞에서 공이 나에게 왔다.", "벤치에서 다들 일어섰다. 공이 내 발 앞에 떨어졌다. 마지막 기회일지도 모른다."],
    choices: [
      { label: "그대로 때린다", stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 8, win: "shot", lose: "miss",
        winText: ["망설이지 않았다. 온몸을 실어 때렸다!"], loseText: ["너무 서둘렀다. 공이 크로스바 위로 넘어간다."] },
      { label: "한 명 더 제친다", stats: { "tech.dribble": 0.6, "phys.agility": 0.4 }, diff: 8, win: "shot", lose: "turnover",
        winText: ["한 번 접어 수비를 넘어뜨렸다! 이제 골문이 보인다!"], loseText: ["수비가 끝까지 붙었다. 공을 잃었다."] },
      { label: "빈 동료를 찾는다", stats: { "tech.pass": 0.6, "mental.focus": 0.4 }, diff: 2, win: "assist", lose: "turnover",
        winText: ["모두 나를 볼 때 {mate}에게 살짝 밀어 줬다!"], loseText: ["패스가 수비 발에 걸렸다."] },
    ] },
  { id: "penalty", intro: false, once: true, pos: ["FW", "MF"], zone: "att", weight: 0.3,
    text: ["박스 안에서 수비 발에 걸려 넘어졌다. 주심이 페널티 지점을 가리킨다!"],
    choices: [
      { label: "구석으로 낮게 찬다", stats: { "tech.shoot": 0.6, "mental.focus": 0.4 }, diff: -18, win: "pk", lose: "miss",
        winText: ["숨을 고르고 달려간다… 골키퍼와 반대 방향!"], loseText: ["골키퍼가 방향을 읽었다. 막혔다."] },
      { label: "가운데로 강하게", stats: { "mental.confidence": 0.7, "tech.shoot": 0.3 }, diff: -14, win: "pk", lose: "miss",
        winText: ["골키퍼가 먼저 몸을 날렸다. 가운데가 비었다!"], loseText: ["너무 정직했다. 골키퍼 발에 걸렸다."] },
      { label: "키커를 양보한다", stats: { "mental.teamwork": 1 }, diff: -40, win: "matePk", lose: "matePk",
        winText: ["{mate}에게 공을 건넸다. \"네가 차.\""], loseText: ["{mate}에게 공을 건넸다."] },
    ] },

  // ── 추가 장면: 미드필더 ────────────
  { id: "mf_corner", intro: false, pos: ["MF"], zone: "att", weight: 1,
    text: ["코너킥. 감독님이 나를 키커로 지목하셨다."],
    choices: [
      { label: "니어포스트로 빠르게", stats: { "tech.cross": 0.8, "mental.focus": 0.2 }, diff: 4, win: "keyPass", lose: "miss",
        winText: ["낮고 빠르게 감아 찼다! {mate|이/가} 앞으로 끊어 들어간다!"], loseText: ["첫 번째 수비수 머리에 걸렸다."] },
      { label: "먼 쪽으로 높게", stats: { "tech.cross": 1 }, diff: 2, win: "keyPass", lose: "miss",
        winText: ["공이 골키퍼 손을 넘어 먼 쪽 포스트로! {mate|이/가} 뛰어오른다!"], loseText: ["너무 길었다. 반대편 터치라인 밖으로."] },
      { label: "짧게 주고받는다", stats: { "tech.pass": 0.6, "mental.teamwork": 0.4 }, diff: -8, win: "keep", lose: "turnover",
        winText: ["짧게 주고 다시 받았다. 상대 수비가 허둥댄다."], loseText: ["주고받다가 끊겼다."] },
    ] },
  { id: "mf_onetwo", intro: false, pos: ["MF", "FW"], zone: "att", weight: 1,
    text: ["박스 앞, {mate|과/와} 눈이 마주쳤다. 주고받을 수 있는 거리다."],
    choices: [
      { label: "원투 패스로 침투", stats: { "tech.pass": 0.4, "tech.firstTouch": 0.3, "mental.teamwork": 0.3 }, diff: 3, win: "shot", lose: "turnover",
        winText: ["주고, 달리고, 다시 받았다! 수비가 따라오지 못한다!"], loseText: ["돌려받는 공이 수비 발에 걸렸다."] },
      { label: "내주고 빠진다", stats: { "tech.pass": 0.6, "mental.focus": 0.4 }, diff: -4, win: "keyPass", lose: "keep",
        winText: ["{mate}에게 내주고 수비를 끌고 빠졌다. 공간이 생겼다!"], loseText: ["{mate|이/가} 돌아서지 못하고 다시 뒤로 돌린다."] },
    ] },
  { id: "mf_intercept", intro: false, poss: "them", pos: ["MF"], zone: "mid", weight: 2,
    text: ["상대 미드필더 {opp|이/가} 공을 잡고 돌아선다. 패스할 곳을 찾는다."],
    choices: [
      { label: "강하게 압박", stats: { "phys.stamina": 0.4, "tech.defense": 0.6 }, diff: 3, win: "keyPass", lose: "danger",
        winText: ["달려들어 공을 빼앗았다! 바로 앞으로 찔러 준다!"], loseText: ["{opp|이/가} 몸을 돌려 나를 벗겨 냈다!"] },
      { label: "패스 길을 막는다", stats: { "mental.focus": 0.7, "tech.defense": 0.3 }, diff: -4, win: "win", lose: "turnover",
        winText: ["앞쪽 패스 길을 막자 {opp|이/가} 결국 뒤로 돌린다."], loseText: ["옆으로 빠지는 패스까지는 막지 못했다."] },
    ] },
  { id: "mf_foul", intro: false, pos: ["MF", "FW"], zone: "mid", weight: 1,
    text: ["공을 받자마자 {opp|이/가} 뒤에서 거칠게 밀어붙인다."],
    choices: [
      { label: "버티며 지킨다", stats: { "phys.strength": 0.7, "mental.competitive": 0.3 }, diff: 2, win: "keep", lose: "turnover", physical: true,
        winText: ["몸을 낮추고 버텼다. 공은 아직 내 발밑이다."], loseText: ["힘에서 밀렸다. 공을 빼앗겼다."] },
      { label: "끝까지 공을 지켜 파울을 얻는다", stats: { "tech.dribble": 0.5, "mental.focus": 0.5 }, diff: 1, win: "setPiece", lose: "turnover",
        winText: ["{opp|이/가} 결국 내 다리를 걷어찼다. 휘슬! 좋은 위치에서 프리킥이다."], loseText: ["주심은 휘슬을 불지 않았다. 공은 이미 상대 발에 있다."] },
      { label: "먼저 내주고 피한다", stats: { "tech.firstTouch": 0.5, "tech.pass": 0.5 }, diff: -4, win: "keep", lose: "turnover",
        winText: ["부딪히기 직전에 {mate}에게 내줬다. {opp|이/가} 허공을 밀었다."], loseText: ["내주려는 순간 발이 걸렸다."] },
    ] },
  { id: "mf_lead", intro: false, pos: ["MF", "DF"], zone: "mid", weight: 3, late: true, leading: true,
    text: ["앞서고 있다. 남은 시간은 얼마 없다. 상대가 라인을 끌어올린다."],
    choices: [
      { label: "공을 돌리며 시간 쓰기", stats: { "tech.pass": 0.6, "mental.focus": 0.4 }, diff: -8, win: "keep", lose: "turnover",
        winText: ["침착하게 옆으로, 뒤로. 상대가 공을 만져 보지도 못한다."], loseText: ["너무 느긋했다. 상대가 낚아챈다."] },
      { label: "뒷공간에 한 방", stats: { "tech.pass": 0.8, "mental.confidence": 0.2 }, diff: 6, win: "keyPass", lose: "turnover",
        winText: ["비어 있는 뒷공간으로 길게! {mate|이/가} 혼자 달린다!"], loseText: ["너무 길었다. 골키퍼가 잡는다."] },
    ] },

  // ── 추가 장면: 수비수 ──────────────
  { id: "df_2v1", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 1,
    text: ["역습을 맞았다. 상대 둘이 달려오는데 막을 사람은 나 하나다."],
    choices: [
      { label: "패스 길을 끊는 자리로", stats: { "mental.focus": 0.7, "tech.defense": 0.3 }, diff: 2, win: "win", lose: "danger",
        winText: ["패스 길에 서서 버텼다. 동료들이 돌아올 시간을 벌었다."], loseText: ["{opp|이/가} 그대로 몰고 들어왔다!"] },
      { label: "공 가진 선수에게 달려든다", stats: { "tech.defense": 0.6, "phys.speed": 0.4 }, diff: 5, win: "win", lose: "danger",
        winText: ["공 가진 선수의 발끝을 정확히 걷어 냈다!"], loseText: ["달려드는 순간 옆으로 패스가 갔다. 골문 앞이 비었다!"] },
    ] },
  { id: "df_box", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 1,
    text: ["박스 안 혼전. 튕겨 나온 공이 내 발 앞에 떨어졌다. 상대가 달려든다."],
    choices: [
      { label: "멀리 걷어 낸다", stats: { "mental.focus": 0.5, "phys.strength": 0.5 }, diff: -6, win: "win", lose: "danger",
        winText: ["생각할 것 없이 멀리 걷어 냈다."], loseText: ["헛발질! 공이 상대 앞으로 굴렀다!"] },
      { label: "침착하게 연결", stats: { "tech.firstTouch": 0.5, "tech.pass": 0.5 }, diff: 6, win: "keyPass", lose: "danger",
        winText: ["한 번 접어 상대를 흘리고 {mate}에게 연결! 역습이다!"], loseText: ["접다가 뺏겼다! 골문 바로 앞이다!"] },
    ] },
  { id: "df_overlap", intro: false, pos: ["DF"], zone: "att", weight: 2,
    text: ["측면이 텅 비었다. {mate|이/가} 올라오라고 손짓한다."],
    choices: [
      { label: "올라가서 크로스", stats: { "phys.stamina": 0.3, "tech.cross": 0.7 }, diff: 4, win: "keyPass", lose: "turnover",
        winText: ["끝까지 달려가 올린 크로스가 문전으로!"], loseText: ["크로스가 수비 발에 맞았다. 내 자리가 비었다!"] },
      { label: "자리를 지킨다", stats: { "mental.focus": 1 }, diff: -12, win: "keep", lose: "keep",
        winText: ["뒤를 지켰다. 역습이 와도 걱정 없다."], loseText: ["뒤를 지켰다. 공격은 흐지부지 끝났다."] },
    ] },
  { id: "df_boxdribble", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 2,
    text: ["{opp|이/가} 공을 몰고 박스 안으로 들어온다. 발재간이 좋은 선수다."],
    choices: [
      { label: "슬라이딩 태클", stats: { "tech.defense": 0.7, "phys.agility": 0.3 }, diff: 6, win: "win", lose: "pkAgainst",
        winText: ["몸을 던져 공만 정확히 걷어 냈다! 관중석에서 박수가 터진다."], loseText: ["공보다 다리가 먼저 걸렸다. 휘슬. 페널티킥이다…"] },
      { label: "서서 버틴다", stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: 0, win: "win", lose: "danger",
        winText: ["끝까지 서서 따라붙었다. {opp|이/가} 결국 뒤로 돌린다."], loseText: ["순간 방향을 바꾼 {opp}에게 슈팅 각을 내줬다!"] },
    ] },
  { id: "df_last", intro: false, poss: "them", pos: ["DF", "MF"], zone: "def", weight: 2, late: true,
    text: ["경기 막판. 상대가 마지막 공격에 모든 걸 건다. 높은 공이 박스로 떨어진다."],
    choices: [
      { label: "머리로 걷어 낸다", stats: { "phys.jump": 0.6, "mental.focus": 0.4 }, diff: 3, win: "win", lose: "danger", physical: true,
        winText: ["가장 높이 떠서 걷어 냈다. 동료들이 소리를 지른다!"], loseText: ["머리에 빗맞았다. 공이 골문 앞으로 떨어진다!"] },
      { label: "상대 공격수를 막는다", stats: { "phys.strength": 0.6, "mental.competitive": 0.4 }, diff: 2, win: "win", lose: "danger", physical: true,
        winText: ["상대 공격수가 뛰지 못하게 몸으로 막았다. 공은 골라인 밖으로."], loseText: ["놓쳤다! {opp|이/가} 자유롭게 머리를 갖다 댄다!"] },
    ] },

  // ── 추가 장면: 포지션별 두 개씩 (spot: 공이 놓이는 자리 [[x0,x1],[y0,y1]], 없으면 zone 기본값) ──
  { id: "fw_gk_out", intro: false, pos: ["FW"], zone: "att", weight: 2, spot: [[86, 92], [26, 42]],
    text: ["{mate}의 롱패스가 수비 뒤로 넘어왔다. 골키퍼가 박스 밖까지 뛰쳐나온다!", "뒷공간으로 빠져나갔다. 골키퍼가 각을 좁히며 달려 나온다!"],
    choices: [
      { label: "칩슛으로 넘긴다", stats: { "tech.shoot": 0.6, "tech.firstTouch": 0.4 }, diff: 7, win: "chip", lose: "miss",
        winText: ["골키퍼가 몸을 낮추는 순간, 발끝으로 살짝 띄웠다!", "달려오는 골키퍼 머리 위로 공을 퍼 올렸다!"], loseText: ["너무 높이 떴다. 크로스바 위로 넘어간다.", "힘이 덜 실렸다. 골키퍼가 뒷걸음질 쳐 잡아 낸다."] },
      { label: "옆으로 내줘 빈 골문을 만든다", stats: { "tech.pass": 0.7, "mental.teamwork": 0.3 }, diff: 0, win: "killPass", lose: "turnover",
        winText: ["골키퍼를 끝까지 끌어낸 뒤 옆으로 툭. {mate} 앞에 빈 골문이 열렸다!"], loseText: ["패스가 뒤로 처졌다. 따라온 수비가 먼저 걷어 낸다."] },
    ] },
  { id: "fw_near_post", intro: false, pos: ["FW"], zone: "att", weight: 2, spot: [[93, 98], [25, 31]],
    text: ["{mate|이/가} 측면 끝까지 파고들어 낮고 빠른 크로스를 깔아 준다!", "엔드라인 앞에서 {mate|이/가} 컷백. 공이 니어포스트 쪽으로 굴러온다!"],
    choices: [
      { label: "니어포스트로 뛰어들어 방향만 바꾼다", stats: { "tech.firstTouch": 0.5, "phys.speed": 0.5 }, diff: 5, win: "tapIn", lose: "miss",
        winText: ["수비보다 반 박자 먼저 니어포스트로 뛰어들었다!", "발만 갖다 댔다. 공이 방향을 틀어 골문 구석으로 향한다!"], loseText: ["한 발이 모자랐다. 공이 발끝 앞을 스쳐 지나간다.", "발에 맞긴 했는데 골라인 밖으로 흘러 나간다."] },
      { label: "흘려보내 뒤에 양보한다", stats: { "mental.focus": 0.6, "mental.teamwork": 0.4 }, diff: -2, win: "decoy", lose: "turnover",
        winText: ["다리를 벌려 공을 흘려보냈다. 수비 둘이 나를 따라 넘어진다!"], loseText: ["흘려보낸 공을 수비가 먼저 걷어 낸다."] },
    ] },
  { id: "mf_lowblock", pos: ["MF"], zone: "att", weight: 2,
    text: ["상대가 박스 앞에 두 줄로 내려앉았다. 틈이 잘 안 보인다.", "공을 잡고 고개를 들었다. 상대 열 명이 전부 자기 진영에 있다."],
    choices: [
      { label: "수비 뒤로 띄워 준다", stats: { "tech.pass": 0.6, "tech.cross": 0.4 }, diff: 7, win: "assist", lose: "turnover",
        winText: ["수비 머리 위로 살짝 띄웠다. {mate|이/가} 뒷공간으로 빠져 들어간다!"], loseText: ["조금 길었다. 수비가 먼저 머리로 걷어 낸다."] },
      { label: "참고 옆으로 돌린다", stats: { "tech.pass": 0.7, "mental.focus": 0.3 }, diff: -10, win: "keep", lose: "turnover",
        winText: ["서두르지 않았다. {mate}에게 돌리며 다시 틈을 노린다."], loseText: ["옆으로 준 패스를 {opp|이/가} 읽고 끊었다."] },
      { label: "직접 중거리 슈팅", stats: { "tech.shoot": 0.8, "phys.strength": 0.2 }, diff: 12, win: "longShot", lose: "miss",
        winText: ["수비가 물러선 틈, 그대로 감아 찼다!"], loseText: ["수비 다리에 맞고 굴절돼 골라인 밖으로 나간다."] },
    ] },
  { id: "mf_cover", intro: false, poss: "them", pos: ["MF"], zone: "def", weight: 2,
    text: ["우리 측면 수비가 올라간 사이, {opp|이/가} 빈 측면으로 내달린다!", "역습이다. {opp|이/가} 우리 풀백이 비운 자리로 공을 몰고 온다!"],
    choices: [
      { label: "끝까지 따라 내려간다", stats: { "phys.speed": 0.5, "tech.defense": 0.5 }, diff: 2, win: "win", lose: "danger",
        winText: ["전력으로 내려와 {opp} 앞을 가로막았다. 공을 걷어 냈다!"], loseText: ["따라가지 못했다! {opp|이/가} 박스 안으로 파고든다!"] },
      { label: "안쪽 패스 길을 막는다", stats: { "mental.focus": 0.6, "mental.teamwork": 0.4 }, diff: -4, win: "win", lose: "turnover",
        winText: ["가운데로 들어올 길을 지웠다. {opp|이/가} 측면에서 머뭇거리는 사이 동료들이 돌아왔다."], loseText: ["길은 막았지만 {opp|이/가} 공을 지키며 뒤로 돌린다."] },
      { label: "전술적 반칙으로 끊는다", stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: -8, win: "keep", lose: "card",
        winText: ["어깨를 살짝 잡아 흐름을 끊었다. 휘슬. 주심은 말로만 주의를 준다."], loseText: ["휘슬과 함께 옐로카드. 그래도 역습은 멈췄다."] },
    ] },
  { id: "df_offside_trap", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 2, spot: [[30, 38], [20, 48]],
    text: ["상대 미드필더가 고개를 든다. 공격수들이 우리 수비 라인 바로 위에 서 있다.", "{opp|이/가} 뒷공간으로 뛸 준비를 한다. 패스가 곧 나온다."],
    choices: [
      { label: "라인을 올려 오프사이드 트랩", stats: { "mental.focus": 0.6, "mental.teamwork": 0.4 }, diff: 6, win: "win", lose: "danger",
        winText: ["동료들과 동시에 한 발 앞으로! 부심의 깃발이 올라갔다. 오프사이드!"], loseText: ["한 명이 늦게 올라왔다. 트랩이 깨졌다! {opp|이/가} 혼자 달려 들어간다!"] },
      { label: "한 발 물러서 뒷공간을 지킨다", stats: { "phys.speed": 0.5, "tech.defense": 0.5 }, diff: -1, win: "win", lose: "turnover",
        winText: ["물러서며 공간을 지웠다. 들어온 패스를 먼저 끊었다."], loseText: ["끊지는 못했다. {opp|이/가} 공을 받아 지키며 뒤로 돌린다."] },
    ] },
  { id: "df_scramble", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 1, spot: [[6, 12], [28, 40]],
    text: ["코너킥 뒤 골문 앞 혼전! 공이 이리저리 튄다.", "골키퍼가 쳐 낸 공이 골라인 앞으로 떨어진다! {opp|이/가} 달려든다!"],
    choices: [
      { label: "몸을 던져 걷어 낸다", stats: { "tech.defense": 0.5, "phys.agility": 0.5 }, diff: 3, win: "win", lose: "danger",
        winText: ["골라인 바로 앞에서 몸을 던져 걷어 냈다!", "{opp}의 발끝보다 먼저 공을 차 냈다!"], loseText: ["발이 엉켰다! 공이 다시 {opp} 앞으로 떨어진다!"] },
      { label: "상대를 등으로 막아선다", stats: { "phys.strength": 0.6, "mental.focus": 0.4 }, diff: 0, win: "win", lose: "danger", physical: true,
        winText: ["{opp}를 등으로 막아섰다. 굴러온 공을 침착하게 걷어 냈다."], loseText: ["{opp|이/가} 등을 밀고 들어온다! 골문 바로 앞이다!"] },
    ] },
];

// 팀 단위 해설
const LINES = {
  kickoff: ["주심의 휘슬. 경기가 시작됐다.", "킥오프! {us|이/가} 먼저 공을 잡았다.", "양 팀 선수들이 손을 맞잡고 흩어진다. 킥오프.",
    "주장끼리 악수를 나누고 동전을 던진다. 킥오프.", "관중석이 잠깐 조용해진다. 휘슬이 울린다."],
  ourChance: ["{mate|이/가} 측면을 파고든다.", "{mate}의 침투 패스!", "{mate|이/가} 박스 안으로 뛰어든다.", "코너킥. {mate|이/가} 머리를 갖다 댄다."],
  ourGoal: ["{mate}의 슈팅이 골망을 흔든다! 골!", "{mate|이/가} 밀어 넣었다! 골!", "흘러나온 공을 {mate|이/가} 마무리! 골!"],
  ourMiss: ["{mate}의 슈팅, 골키퍼 선방.", "{mate}의 슈팅이 골대를 살짝 벗어난다.", "골대를 맞고 나왔다!"],
  theirChance: ["{opp|이/가} 역습에 나선다.", "{opp}의 날카로운 크로스.", "{opp|이/가} 박스 앞에서 공을 잡는다.", "상대 프리킥. {opp|이/가} 찬다."],
  theirGoal: ["{opp}의 슈팅이 골망을 가른다. 실점.", "{opp|이/가} 마무리했다. 실점.", "혼전 끝에 {opp}에게 골을 내줬다."],
  theirMiss: ["{opp}의 슈팅, 우리 골키퍼가 잡아 낸다.", "{opp}의 슈팅이 크로스바를 넘어간다.", "{mate|이/가} 몸을 던져 막아 냈다!"],
  myShotGoal: ["골키퍼를 보고 침착하게 차 넣었다. 골!", "구석으로 꽂았다. 골!!", "발등에 제대로 얹혔다. 그물이 출렁인다. 골!", "골키퍼 가랑이 사이로! 골!"],
  myShotSaved: ["회심의 슈팅! 골키퍼가 손끝으로 쳐 냈다.", "슈팅이 골키퍼 정면으로 갔다.", "골키퍼가 몸을 날려 막아 냈다. 손바닥이 얼얼할 거다."],
  myShotWide: ["아! 골대를 살짝 빗나간다.", "골포스트를 맞고 나왔다!", "발목에 힘이 덜 들어갔다. 골대 옆으로 흘러간다."],
  myHeadGoal: ["헤더가 골문 구석으로! 골!", "이마에 맞는 순간 알았다. 골!", "머리로 방향만 바꿨다. 골키퍼 반대편으로! 골!"],
  myChipGoal: ["골! 골키퍼는 손을 뻗어 보지도 못했다!", "들어갔다! 관중석이 들썩인다!"],
  myChipMiss: ["골키퍼가 겨우 손끝으로 쳐 냈다!", "골대를 맞고 나왔다! 거의 들어갈 뻔했다."],
  myHeadMiss: ["헤더가 골키퍼 품으로 간다.", "헤더가 크로스바 위로 넘어간다."],
  myLongGoal: ["25미터 밖에서 날아간 공이 그대로 골문 구석에 꽂혔다! 골!!", "골키퍼가 몸을 날렸지만 닿지 않는다. 중거리 골!"],
  myLongSaved: ["골키퍼가 겨우 쳐 냈다. 손이 얼얼할 슈팅이었다.", "골키퍼 정면이었다. 그래도 위협적이었다."],
  myLongWide: ["골대를 살짝 넘어간다. 관중석에서 아쉬운 탄성이 터진다.", "골대 옆으로 비껴간다."],
  acroGoal: ["거꾸로 뒤집힌 몸에서 날아간 공이 골망을 흔든다! 골!! 경기장이 얼어붙었다!", "바이시클 킥이 그대로 들어갔다! 골!!"],
  acroMiss: ["공이 골대 위로 넘어간다. 그래도 관중석에서 박수가 나온다.", "골키퍼가 놀란 얼굴로 공을 잡아 낸다."],
  assistGoal: ["{mate|이/가} 그대로 밀어 넣는다! 도움 기록!", "{mate}의 마무리! 내 패스가 골이 됐다!"],
  assistMiss: ["{mate}의 슈팅이 아쉽게 빗나간다.", "{mate}의 슈팅, 골키퍼 선방."],
  dangerGoal: ["결국 {opp}에게 골을 내줬다. 고개를 숙였다.", "그대로 실점으로 이어졌다."],
  dangerSave: ["골키퍼가 막아 냈다. 가슴을 쓸어내린다.", "{mate|이/가} 뒤에서 걷어 냈다. 살았다."],
  turnoverGoal: ["뺏긴 공이 역습으로 이어졌다. 실점.", "공을 잃은 지 10초 만에 실점했다."],
  leakGoal: ["결국 상대가 슈팅까지 연결했다. 실점.", "한 번 열린 틈을 상대가 놓치지 않았다. 실점."],
  tapGoal: ["골! 빈 골문으로 밀어 넣었다!", "골라인 앞에서 툭. 골!"],
  pkGoal: ["골키퍼는 반대로 몸을 날렸다. 골!", "그물이 출렁인다. 페널티킥 성공!"],
  matePkGoal: ["{mate|이/가} 침착하게 차 넣었다. 골!", "{mate|이/가} 골키퍼를 반대로 보냈다. 골!"],
  matePkMiss: ["{mate}의 페널티킥, 골키퍼에게 막혔다!"],
  fkGoal: ["{mate}의 프리킥이 벽을 넘어 그대로 꽂힌다! 골!", "{mate}의 프리킥이 벽 사이를 뚫고 들어간다! 골!"],
  fkMiss: ["{mate}의 프리킥, 벽에 맞고 나온다.", "{mate}의 프리킥이 골대 위로 넘어간다."],
  pkAgainstGoal: ["{opp|이/가} 침착하게 차 넣는다. 실점.", "골키퍼 {gk|이/가} 방향은 맞혔지만 닿지 않았다. 실점."],
  pkAgainstSave: ["골키퍼 {gk}의 선방! 페널티킥을 막아 냈다!", "{opp}의 페널티킥이 골대를 맞고 나온다! 살았다!"],
  secondHalf: ["후반전 시작.", "후반 휘슬이 울린다. 마지막 35분이다.", "진영을 바꿔 후반이 시작된다.", "물병을 내려놓고 다시 운동장으로. 후반전이다."],
  halftime: ["전반 종료.", "전반 종료 휘슬. 선수들이 벤치로 걸어 들어온다.", "전반이 끝났다. 다들 숨이 턱까지 찼다."],
  fulltime: ["경기 종료 휘슬이 울린다.", "주심이 두 팔을 들어 올린다. 경기 끝.", "길게 휘슬이 울린다. 선수들이 그 자리에 주저앉는다.", "경기가 끝났다. 양 팀 선수들이 악수를 나눈다."],
  subIn: ["교체 투입. 감독님이 등을 두드리신다. \"보여 줘라.\"", "감독님이 짧게 말씀하신다. \"생각하지 말고 뛰어.\"",
    "코치님이 등을 떠미신다. \"오른쪽 비었다. 거기로 가.\"", "사이드라인을 넘는 순간 심장이 빨라진다. 이제 내 차례다."],
};

// 경기 흐름이 바뀔 때 (내 선택이 연달아 통하거나 막힐 때)
const FLOW = {
  up:   ["흐름이 우리 쪽으로 넘어왔다. 동료들 발걸음이 가벼워진다.", "관중석이 들썩인다. 우리가 경기를 쥐기 시작했다.", "상대가 뒤로 물러선다. 기세가 올라왔다."],
  down: ["분위기가 상대 쪽으로 기운다. 다들 표정이 굳었다.", "상대가 기세를 탔다. 버텨야 하는 시간이다.", "실수 하나에 흐름이 넘어갔다. 다시 가져와야 한다."],
};

// 하프타임 감독님 말
const HALFTIME_TALK = {
  winning: ["좋다. 그런데 방심하는 순간 뒤집힌다. 하던 대로 해.", "잘하고 있다. 수비 라인 내리지 마라.", "한 골 더 넣으면 끝난다. 물러서지 마.",
    "점수는 잊어라. 0 대 0이라고 생각하고 다시 들어가.", "상대가 후반에 라인 올린다. 뒷공간 노려.",
    "앞서고 있을 때 제일 많이 지는 이유가 뭔지 알아? 내려앉아서다. 계속 올라가.", "공 잡으면 서두르지 마. 시간은 우리 편이다.", "잘했다. 그런데 칭찬은 경기 끝나고 한다."],
  drawing: ["아직 아무것도 안 정해졌다. 한 골이면 된다.", "상대도 지쳤다. 더 뛰는 쪽이 이긴다.", "측면이 열린다. 후반엔 더 넓게 벌려라.",
    "전반은 탐색전이었다. 이제 우리가 먼저 때린다.", "물 마시고 숨 골라. 후반 10분 안에 승부 본다.",
    "상대 오른쪽 수비가 지쳤다. 그쪽으로 계속 두드려.", "세트피스 하나에 갈린다. 코너킥 얻으면 다 들어가.", "비기는 거 하러 여기 온 거 아니다."],
  losing: ["고개 들어. 35분이면 충분히 뒤집는다.", "겁먹지 마라. 우리 축구 하자.", "실점은 잊어. 지금부터 0 대 0이라고 생각해.",
    "한 골씩만 생각해라. 한 번에 두 골 넣으려 하지 말고.", "졌다고 생각하는 사람 손 들어 봐. 없지? 그럼 나가.",
    "전반은 내가 잘못 짰다. 후반엔 너희 하고 싶은 대로 해 봐.", "첫 골만 넣으면 저쪽이 흔들린다. 그 첫 골을 빨리 가져와.", "누구 탓도 하지 마. 탓할 시간에 한 번 더 뛰어."],
};

// ── 팀 공격 전개 ─────────────────────────────
// 우리 팀이 오른쪽으로 공격한다고 보고 좌표를 적습니다 (경기장 105×68).
// 상대 팀 공격일 때는 엔진이 좌우를 뒤집어 씁니다.
// at: [x, y]. y 자리에 "W"(측면) "H"(측면과 중앙 사이) "C"(중앙) "K"(코너)를 쓰면 매번 달라집니다.
// who: 그 장면에서 공을 가진 선수의 자리. {a}는 그 선수 이름, {b}는 다음 선수 이름.
// finish: shot 일반 슈팅 / header 헤더 / long 중거리 (득점 확률이 낮음)
const PLAYS = [
  { id: "build", weight: 3, finish: "shot", steps: [
    { who: "DF", at: [24, "H"], t: ["{a|이/가} 뒤에서 차분하게 공을 돌린다.", "{a|이/가} 수비 라인에서 앞을 살핀다."] },
    { who: "MF", at: [47, "C"], t: ["{a}에게 연결. 한 번 접고 고개를 든다.", "{a|이/가} 받아 방향을 튼다."] },
    { who: "FW", at: [80, "C"], t: ["수비 사이로 찔러 준다. {a|이/가} 잡았다!", "{a}의 발밑으로 들어가는 패스!"] },
  ] },
  { id: "wing", weight: 3, finish: "header", steps: [
    { who: "MF", at: [42, "H"], t: ["{a|이/가} 측면으로 공을 벌린다.", "{a}의 방향 전환 패스."] },
    { who: "MF", at: [70, "W"], t: ["{a|이/가} 측면을 타고 달린다.", "{a|이/가} 터치라인을 따라 치고 올라간다."] },
    { who: "MF", at: [93, "W"], same: true, t: ["{a}의 크로스!", "{a|이/가} 문전으로 공을 띄운다."] },
    { who: "FW", at: [95, "C"], t: [] },
  ] },
  { id: "long", weight: 2, finish: "shot", steps: [
    { who: "DF", at: [22, "C"], t: ["{a}의 롱볼!", "{a|이/가} 전방으로 길게 찬다."] },
    { who: "FW", at: [68, "C"], t: ["{a|이/가} 머리로 떨군다.", "{a|이/가} 등지고 버티며 공을 내준다."] },
    { who: "MF", at: [82, "H"], t: ["세컨드볼을 {a|이/가} 잡았다!", "흘러나온 공, {a}에게 간다!"] },
  ] },
  { id: "counter", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [38, "H"], t: ["{a|이/가} 공을 끊어 냈다! 역습!", "가로챘다! {a}에서 시작되는 역습."] },
    { who: "FW", at: [70, "H"], t: ["{a}에게 길게 연결. 수비 숫자가 부족하다!", "{a|이/가} 수비 뒤로 빠져 들어간다!"] },
    { who: "FW", at: [88, "C"], same: true, t: [] },
  ] },
  { id: "corner", weight: 2, finish: "header", steps: [
    { who: "MF", at: [104, "K"], t: ["코너킥. {a|이/가} 공을 내려놓는다.", "코너킥 기회. {a|이/가} 손을 들어 신호를 보낸다."] },
    { who: "DF", at: [95, "C"], t: [] },
  ] },
  { id: "onetwo", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [58, "C"], t: ["{a|과/와} {b}의 원투 패스!", "{a|이/가} 짧게 주고 다시 받는다."] },
    { who: "FW", at: [84, "C"], t: ["{a|이/가} 박스 안으로 파고든다!"] },
  ] },
  { id: "longshot", weight: 1, finish: "long", steps: [
    { who: "MF", at: [62, "C"], t: ["{a|이/가} 공을 잡고 앞을 본다. 수비가 물러선다.", "아무도 {a|을/를} 막지 않는다."] },
    { who: "MF", at: [72, "C"], same: true, t: [] },
  ] },
  { id: "cutback", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [55, "H"], t: ["{a|이/가} 측면으로 찔러 준다.", "{a}의 전진 패스가 측면으로."] },
    { who: "FW", at: [100, "W"], t: ["{a|이/가} 골라인 끝까지 파고든다!", "{a|이/가} 수비를 달고 엔드라인까지 간다."] },
    { who: "MF", at: [88, "C"], t: ["뒤로 내준 컷백! {a|이/가} 달려 들어온다!", "{a} 앞으로 컷백이 굴러간다!"] },
  ] },
  { id: "overlap", weight: 2, finish: "header", steps: [
    { who: "MF", at: [60, "H"], t: ["{a|이/가} 공을 잡고 측면을 본다.", "{a|이/가} 측면 수비가 올라올 시간을 번다."] },
    { who: "DF", at: [92, "W"], t: ["측면 수비 {a}의 오버래핑! 크로스!", "{a|이/가} 끝까지 올라가 공을 띄운다!"] },
    { who: "FW", at: [95, "C"], t: [] },
  ] },
  { id: "switch", weight: 2, finish: "shot", steps: [
    { who: "DF", at: [35, "H"], t: ["{a|이/가} 반대편으로 길게 공을 바꾼다.", "{a}의 대각선 롱패스."] },
    { who: "MF", at: [66, "W"], t: ["반대편의 {a|이/가} 가슴으로 받아 놓는다.", "{a|이/가} 깔끔하게 잡았다."] },
    { who: "FW", at: [86, "C"], t: ["안쪽으로 파고드는 {a}에게!", "{a|이/가} 공을 받아 돌아선다!"] },
  ] },
  { id: "press", weight: 2, finish: "shot", steps: [
    { who: "FW", at: [82, "H"], t: ["{a|이/가} 수비수를 끝까지 쫓아간다. 빼앗았다!", "전방 압박! {a|이/가} 수비수의 공을 낚아챘다!"] },
    { who: "FW", at: [90, "C"], same: true, t: [] },
  ] },
  { id: "solo", weight: 1, finish: "shot", steps: [
    { who: "FW", at: [62, "C"], t: ["{a|이/가} 공을 잡고 그대로 드리블을 시작한다.", "{a|이/가} 수비 한 명을 제치고 속도를 올린다!"] },
    { who: "FW", at: [84, "H"], same: true, t: ["또 한 명! {a|이/가} 박스 앞까지 왔다!", "{a|이/가} 두 번째 수비까지 벗겨 낸다!"] },
  ] },
  { id: "freekick", weight: 1, finish: "fk", steps: [
    { who: "MF", at: [78, "C"], t: ["박스 앞에서 프리킥. {a|이/가} 공을 내려놓는다.", "좋은 위치에서 프리킥. 키커는 {a}."] },
  ] },
  { id: "penalty", weight: 0.4, finish: "pk", steps: [
    { who: "FW", at: [92, "C"], t: ["{a|이/가} 박스 안에서 넘어졌다! 주심이 페널티 지점을 가리킨다!", "핸드볼! 주심이 휘슬과 함께 페널티 지점을 가리킨다. 키커는 {a}."] },
  ] },
  { id: "buildup", weight: 2, finish: "shot", steps: [
    { who: "DF", at: [20, "C"], t: ["{a|이/가} 옆 수비에게 짧게 내준다.", "{a|이/가} 뒤에서 공을 돌리며 압박을 끌어낸다."] },
    { who: "DF", at: [24, "H"], t: ["{a|이/가} 받아서 한 번 더 옆으로.", "{a}의 짧은 패스가 중원으로 향한다."] },
    { who: "MF", at: [45, "C"], t: ["{a|이/가} 내려와서 받는다. 압박을 한 번에 벗겨 낸다.", "{a|이/가} 등을 진 채 받아 돌아선다."] },
    { who: "MF", at: [66, "H"], t: ["{a}에게 다시 연결. 미드필드 라인을 넘었다.", "{a|이/가} 전진 패스를 받는다."] },
    { who: "FW", at: [86, "C"], t: ["박스 앞의 {a}에게!", "{a|이/가} 수비 사이에서 공을 잡는다!"] },
  ] },
  { id: "keeper", weight: 1, finish: "shot", steps: [
    { who: "GK", at: [5, "C"], t: ["골키퍼 {a|이/가} 길게 찬다.", "{a}의 골킥이 하프라인을 넘는다."] },
    { who: "FW", at: [62, "C"], t: ["{a|이/가} 머리로 떨궈 준다.", "{a|이/가} 공중볼을 따내 옆으로 흘린다."] },
    { who: "MF", at: [78, "H"], t: ["흘러나온 공을 {a|이/가} 잡아 그대로 몰고 간다!", "{a|이/가} 세컨드볼을 따냈다!"] },
  ] },
  { id: "wingdribble", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [60, "W"], t: ["측면의 {a|이/가} 수비와 1 대 1로 마주 섰다.", "{a|이/가} 터치라인 쪽에서 공을 잡는다."] },
    { who: "MF", at: [90, "W"], same: true, t: ["{a|이/가} 헛다리 한 번에 수비를 제쳤다! 엔드라인까지!", "{a|이/가} 속도로 수비를 따돌린다!"] },
    { who: "FW", at: [93, "C"], t: ["낮게 깔아 준 크로스, {a|이/가} 달려든다!", "{a} 앞으로 땅볼 크로스!"] },
  ] },
  { id: "throwin", weight: 1, finish: "header", steps: [
    { who: "DF", at: [88, "W"], t: ["{a}의 롱 스로인. 공이 박스 안으로 날아간다.", "{a|이/가} 수건으로 공을 닦고 길게 던진다."] },
    { who: "FW", at: [94, "C"], t: [] },
  ] },
];

// 공격이 슈팅까지 못 가고 끊기는 경우 (전개 중간에 무작위로)
// {a} 공을 가진 쪽 선수, {d} 끊어 낸 수비, {gk} 막는 쪽 골키퍼
const BREAK = {
  intercept: ["{d|이/가} 패스 길을 읽고 끊어 낸다.", "{d|이/가} 발을 쭉 뻗어 공을 가로챘다.", "{d|이/가} 한 발 먼저 들어와 패스를 잘라 낸다."],
  tackle:    ["{d}의 태클! {a|이/가} 공을 빼앗겼다.", "{d|이/가} 몸을 붙여 {a}의 공을 빼냈다.", "{d|이/가} 뒤에서 발을 넣어 {a}의 공을 걷어 낸다."],
  offside:   ["{r|이/가} 한 발 먼저 나갔다. 부심 깃발이 올라간다. 오프사이드.", "오프사이드. {r|이/가} 아쉬운 듯 고개를 젓는다.", "수비 라인이 한 발 올라섰다. {r|은/는} 오프사이드에 걸렸다."],
  out:       ["패스가 길었다. 공이 터치라인을 넘어간다.", "{a}의 패스가 너무 강했다. 골라인 아웃.", "{a}의 크로스가 반대편 터치라인까지 날아갔다."],
  claim:     ["골키퍼 {gk|이/가} 뛰어나와 공을 잡아 낸다.", "{gk|이/가} 먼저 나와 공을 품에 안았다.", "{gk|이/가} 높이 떠서 크로스를 두 손으로 낚아챈다."],
};

// 마무리 문장. {a} 슈팅한 선수, {gk} 골키퍼, {d} 몸을 던진 수비수
const FINISH = {
  shot:   ["{a}의 오른발 슈팅!", "{a|이/가} 수비를 앞에 두고 때린다!", "{a}의 낮게 깔린 슈팅!", "{a}의 왼발 슈팅!",
           "{a|이/가} 반 박자 빠르게 때린다!", "{a}의 감아 차기!", "{a|이/가} 수비 사이로 슈팅 각을 만든다. 슈팅!"],
  header: ["{a}의 헤더!", "{a|이/가} 솟구쳐 머리를 갖다 댄다!", "{a|이/가} 수비 사이에서 머리를 돌린다!", "{a}의 머리에 정확히 걸렸다!", "{a|이/가} 몸을 날려 머리로 받는다!"],
  long:   ["{a}의 중거리 슈팅!", "{a|이/가} 먼 거리에서 과감하게 때린다!", "{a|이/가} 30미터 밖에서 그대로 때린다!"],
  fk:     ["{a}의 프리킥! 벽을 향해 감아 찬다!", "{a|이/가} 감아 찬다!"],
  pk:     ["{a|이/가} 키커로 나선다. 달려간다…", "{a}의 페널티킥!"],
};
const RESULT = {
  us: {
    goal:  ["골! {a|이/가} 골망을 흔든다!", "들어갔다! {a}의 골!", "골키퍼가 손도 못 댔다. {a}의 골!", "골키퍼 손끝을 스치고 들어간다! {a}의 골!"],
    save:  ["{gk}의 선방에 막혔다.", "{gk|이/가} 몸을 날려 쳐 낸다!", "골키퍼 정면. {gk|이/가} 잡아 낸다.", "{gk|이/가} 다리를 뻗어 막아 낸다."],
    wide:  ["골대를 살짝 벗어난다.", "크로스바를 넘어간다.", "옆 그물을 때린다. 아깝다.", "힘이 너무 들어갔다. 관중석으로."],
    block: ["수비수 몸에 맞고 굴절된다.", "수비가 발을 뻗어 막아 낸다.", "몸을 던진 {d}에게 맞았다."],
    post:  ["골대를 맞고 튀어나온다! 아깝다!", "크로스바를 때렸다!", "골대 안쪽을 맞고 골라인 위로 굴러 나온다! 이게 안 들어가나!"],
  },
  them: {
    goal:  ["실점. {a}의 슈팅이 그대로 들어갔다.", "{a|이/가} 마무리한다. 실점.", "막을 수 없었다. {a}의 골.", "{gk|이/가} 손을 뻗었지만 닿지 않았다. 실점."],
    save:  ["우리 골키퍼 {gk}의 선방!", "{gk|이/가} 정확하게 잡아 낸다.", "{gk|이/가} 손끝으로 쳐 낸다!", "{gk|이/가} 끝까지 공을 보고 막아 낸다!"],
    wide:  ["골대를 벗어난다. 휴.", "크로스바 위로 날아간다.", "{a}의 슈팅이 골대 옆으로 흘러간다."],
    block: ["{d|이/가} 몸을 던져 막아 낸다!", "{d}의 태클! 슈팅을 막았다.", "{d|이/가} 다리를 쭉 뻗어 슈팅 길을 막았다!"],
    post:  ["골대를 맞혔다! 가슴이 철렁한다.", "{a}의 슈팅이 골대를 때리고 나온다. 운이 따랐다.", "크로스바를 맞고 위로 튄다. 휴, 살았다."],
  },
};

// 경기 흐름 사이사이에 나오는 문장
// side: us 우리 팀 이야기 / them 상대 팀 이야기 / none 중립. card: 경고 카드
const AMBIENT = [
  { side: "none", t: "중원에서 치열한 볼 다툼이 이어진다." },
  { side: "none", t: "양 팀 모두 쉽게 공을 내주지 않는다." },
  { side: "us",   t: "{a|이/가} 공을 길게 걷어 낸다. 스로인." },
  { side: "us",   t: "{coach|이/가} 사이드라인에서 소리친다. \"라인 올려! 간격 좁혀!\"" },
  { side: "them", t: "상대가 뒤에서 공을 돌리며 틈을 찾는다." },
  { side: "them", t: "{o|이/가} 측면으로 치고 들어오다 라인 밖으로 공을 흘린다." },
  { side: "them", t: "{o}의 거친 태클. 주심이 옐로카드를 꺼낸다.", card: "them" },
  { side: "us",   t: "{a|이/가} 늦게 들어간 태클로 경고를 받는다.", card: "us" },
  { side: "none", t: "관중석에서 학부모님들의 응원 소리가 들려온다." },
  { side: "none", t: "양 팀 모두 탐색전이다. 서로의 움직임을 살핀다.", early: true },
  { side: "none", t: "바닷바람이 거세진다. 높이 뜬 공이 자꾸 바람에 밀린다." },
  { side: "none", t: "부심의 깃발이 올라간다. 오프사이드." },
  { side: "none", t: "공이 관중석으로 넘어갔다. 학부모 한 분이 공을 던져 준다." },
  { side: "us",   t: "{gk|이/가} 높게 날아온 크로스를 가볍게 잡아 낸다." },
  { side: "us",   t: "{a|이/가} 수비 라인을 정리하며 소리친다. \"하나, 둘, 올려!\"" },
  { side: "us",   t: "{a|이/가} 상대 선수와 부딪혀 쓰러졌다. 잠시 경기가 멈췄다. 다행히 곧 털고 일어선다." },
  { side: "us",   t: "{a}의 스로인. 짧게 주고받으며 공을 지킨다." },
  { side: "us",   t: "{coach|이/가} 벤치에서 일어나 손뼉을 친다. \"좋아, 그렇게!\"" },
  { side: "them", t: "상대 벤치가 선수를 바꾼다. 발 빠른 공격수가 들어온다.", min: 40 },
  { side: "them", t: "상대 골키퍼가 길게 찬 공이 하프라인을 넘어온다." },
  { side: "them", t: "{o|이/가} 몸싸움 끝에 넘어지며 항의한다. 주심은 고개를 젓는다." },
  { side: "none", t: "양 팀 선수들 다리가 무거워 보인다. 종아리를 주무르는 선수도 있다.", late: true },
  { side: "us",   t: "{coach|이/가} 시계를 가리키며 소리친다. \"집중! 끝까지!\"", late: true },
  { side: "none", t: "대기심이 추가 시간 2분을 알린다.", min: 66 },
];

// 내 장면 직전, 공이 나에게 오는 문장
const TO_ME = {
  att: ["{mate}의 패스가 나에게 온다.", "{mate|이/가} 공을 찔러 준다. 내 차례다.", "{mate|이/가} 고개를 들어 나를 찾는다. 공이 온다.",
    "수비 사이에 틈이 보인다. 손을 들자 {mate|이/가} 바로 공을 보낸다.", "흘러나온 공이 내 쪽으로 굴러온다.", "{mate|이/가} 수비 둘을 끌고 가며 나에게 내준다."],
  mid: ["{mate|이/가} 나에게 공을 내준다.", "공이 중원으로 흘러나와 내 발 앞에 떨어진다.", "{mate}의 패스를 받으러 내려왔다.",
    "{mate|이/가} 고개를 들더니 나에게 공을 밀어 준다.", "골키퍼가 짧게 굴려 준 공이 돌고 돌아 나에게 온다.", "몸을 반쯤 열고 {mate}의 패스를 기다린다. 왔다."],
  def: ["{opp|이/가} 공을 몰고 내 쪽으로 온다.", "상대 공격이 내 쪽 측면으로 몰린다.", "상대가 빠르게 공을 돌리며 우리 진영으로 들어온다.",
    "{opp|이/가} 속도를 붙여 내 쪽으로 파고든다.", "상대 롱볼이 내 머리 위로 날아온다.", "{opp|이/가} 등을 지고 공을 받는다. 내가 붙어야 한다."],
};

// ── 특기 선택지 ─────────────────────────────
// 능력치가 requires 이상이면 그 장면에 선택지가 하나 더 생깁니다 (★ 특기).
// 능력치를 키울수록 경기에서 할 수 있는 일이 늘어나는 구조입니다.
const SIGNATURE = {
  fw_1v1: { label: "개인기로 무너뜨린다", requires: { "tech.dribble": 68 }, stats: { "tech.dribble": 0.7, "phys.agility": 0.3 }, diff: -4,
    win: "shot", lose: "turnover", winText: ["헛다리 두 번에 수비수가 주저앉았다! 골키퍼와 1 대 1!"], loseText: ["너무 많이 보여 줬다. 수비가 공만 걷어 낸다."] },
  fw_through: { label: "골키퍼 키를 넘긴다", requires: { "tech.shoot": 70 }, stats: { "tech.shoot": 0.6, "mental.confidence": 0.4 }, diff: 6,
    win: "chip", lose: "miss", winText: ["달려 나온 골키퍼 머리 위로 살짝 띄웠다. 공이 천천히 골문으로…"], loseText: ["너무 높았다. 크로스바 위로."] },
  fw_cross: { label: "몸을 날려 다이빙 헤더", requires: { "phys.jump": 68 }, stats: { "phys.jump": 0.6, "mental.competitive": 0.4 }, diff: 4,
    win: "head", lose: "miss", physical: true, winText: ["몸을 던졌다! 공에 이마가 정확히 닿는다!"], loseText: ["한 뼘이 모자랐다."] },
  mf_press: { label: "마르세유 턴", requires: { "tech.dribble": 66, "phys.agility": 60 }, stats: { "tech.dribble": 0.5, "phys.agility": 0.5 }, diff: -6,
    win: "keyPass", lose: "turnover", winText: ["빙글 돌아 두 명 사이를 빠져나갔다! 관중석이 술렁인다."], loseText: ["돌다가 공이 발에서 떨어졌다."] },
  mf_space: { label: "수비 셋을 가르는 킬패스", requires: { "tech.pass": 70 }, stats: { "tech.pass": 0.8, "mental.focus": 0.2 }, diff: 4,
    win: "killPass", lose: "turnover", winText: ["수비 세 명 사이로 공이 빨려 들어간다. {mate} 앞에 골키퍼뿐이다!"], loseText: ["너무 욕심냈다. 끊겼다."] },
  mf_defend: { label: "가로채서 바로 역습", requires: { "tech.defense": 62, "mental.focus": 60 }, stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: 0,
    win: "keyPass", lose: "danger", winText: ["패스 길을 읽었다! 가로채서 그대로 앞으로 찔렀다!"], loseText: ["읽었는데 한 발 늦었다."] },
  df_1v1: { label: "공 뺏고 그대로 전진", requires: { "tech.defense": 70 }, stats: { "tech.defense": 0.7, "phys.strength": 0.3 }, diff: 0,
    win: "keyPass", lose: "danger", winText: ["깨끗하게 뺏었다! 그대로 하프라인까지 몰고 올라간다!"], loseText: ["태클은 정확했는데 공이 상대에게 튀었다."] },
  df_cross: { label: "제공권으로 압도", requires: { "phys.jump": 70 }, stats: { "phys.jump": 0.8, "phys.strength": 0.2 }, diff: -10,
    win: "win", lose: "danger", physical: true, winText: ["상대보다 머리 하나는 높이 떴다. 아무도 못 따라온다."], loseText: ["타이밍이 어긋났다!"] },
  df_corner: { label: "헤더로 골문 구석을 노린다", requires: { "phys.jump": 68 }, stats: { "phys.jump": 0.6, "tech.shoot": 0.4 }, diff: 2,
    win: "head", lose: "miss", physical: true, winText: ["수비 셋을 뚫고 솟구쳤다!"], loseText: ["골대 옆으로 비껴갔다."] },
  freekick: { label: "벽을 넘겨 구석으로 감아 찬다", requires: { "tech.shoot": 74 }, stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 8,
    win: "chip", lose: "miss", winText: ["벽을 넘은 공이 뚝 떨어지며 구석으로 휘어 들어간다…"], loseText: ["아깝게 골대를 스쳤다."] },
};

// 내가 팀 공격에 자동으로 끼는 장면 (능력치가 높을수록 자주)
const ME_IN_PLAY = {
  build: ["{me|이/가} 공을 받아 앞을 본다. 상대가 두 명 붙는다.", "{me}에게 공이 모인다."],
  pass:  ["{me}의 정확한 패스!", "{me|이/가} 원터치로 방향을 바꿔 준다."],
  shot:  ["{me}의 슈팅!", "{me|이/가} 지체 없이 때린다!"],
  head:  ["{me}의 헤더!", "{me|이/가} 수비 머리 위로 솟구친다!", "{me|이/가} 공 떨어지는 곳을 먼저 잡고 머리를 갖다 댄다!"],
  fk:    ["{me|이/가} 프리킥 키커로 나섰다. 숨을 고르고… 찼다!"],
  pk:    ["{me|이/가} 페널티킥 키커로 나선다. 심장이 쿵쾅거린다…"],
  stop:  ["{me|이/가} 태클로 끊어 낸다!", "{me|이/가} 길목을 막고 공을 빼앗는다!", "{me|이/가} 몸을 날려 슈팅을 막아 낸다!"],
  marked: ["상대 감독이 {me|을/를} 가리키며 수비수에게 뭔가 지시한다.", "상대 수비수 둘이 {me} 주변에 붙어 다닌다."],
};

// ── 경기 전 한마디 ───────────────────────────
// who: coach 감독 / assistant 코치. tag: 지시 내용 (경기 중 같은 종류의 선택을 하면 성공률 +4%p)
//   shoot 슈팅 / pass 패스 / dribble 돌파 / defend 수비 / physical 몸싸움 / safe 안정 / null 지시 없음
// when: start 선발 / sub 교체로 들어가는 순간 (경기 중에 나옴) / bench 벤치 / big 대회·진학 경기 / ko 토너먼트 / hs 고교 감독 관전 / tired 피로 높음 / star 에이스
const PREMATCH = [
  { who: "coach", when: "start", tag: "shoot", t: "박스 근처에서 망설이지 마라. 보이면 때려. 빗나가도 내가 뭐라 안 한다." },
  { who: "coach", when: "start", tag: "pass", t: "오늘은 공 오래 끌지 마라. 원터치, 투터치. 공이 사람보다 빨라야 한다." },
  { who: "coach", when: "start", tag: "dribble", t: "측면에서 1 대 1 붙으면 자신 있게 들어가. 상대 풀백 발이 느리다." },
  { who: "coach", when: "start", tag: "defend", t: "오늘은 실점 안 하는 게 먼저다. 태클은 뒤에서 들어가지 말고, 타이밍 봐라." },
  { who: "coach", when: "start", tag: "physical", t: "상대가 몸으로 밀고 들어온다. 첫 번째 부딪힘에서 밀리면 경기 내내 밀린다." },
  { who: "coach", when: "start", tag: "safe", t: "무리하지 마라. 쉽게 쉽게. 실수만 안 하면 우리가 이기는 경기다." },
  { who: "assistant", when: "start", tag: "pass", t: "상대 미드필더가 공 잡으면 등 돌린다. 그 순간 앞으로 찔러 줘." },
  { who: "assistant", when: "start", tag: "shoot", t: "상대 골키퍼가 키가 작다. 높은 쪽 구석, 기억해." },
  { who: "assistant", when: "start", tag: "defend", t: "역습 맞으면 일단 늦춰. 혼자 뛰어들지 말고 동료 기다려." },
  { who: "assistant", when: "start", tag: "dribble", t: "공 잡으면 고개 먼저 들고. 앞이 비면 그냥 치고 가." },
  { who: "coach", when: "sub", tag: "dribble", t: "들어가면 바로 템포 올려라. 상대 다리가 무거울 때다." },
  { who: "coach", when: "sub", tag: "shoot", t: "시간 얼마 없다. 기회 오면 바로 때려." },
  { who: "assistant", when: "sub", tag: "pass", t: "벤치에서 보니까 오른쪽이 비더라. 들어가면 그쪽으로 공 돌려." },
  // bench: 벤치에서 시작하는 날 (교체로 들어갈지는 경기 전에 알려 주지 않음)
  { who: "assistant", when: "bench", tag: "safe", t: "벤치에서도 경기 읽어라. 언제 부를지 모른다. 몸은 계속 데워 두고." },
  { who: "assistant", when: "bench", tag: "dribble", t: "상대 풀백 버릇 하나만 찾아 둬라. 기회 오면 네가 1 대 1로 붙는 거다." },
  { who: "coach", when: "bench", tag: "pass", t: "오늘은 선발로 나간 애들 뛰는 거 봐라. 공 없을 때 어디 서 있는지. 그게 공부다." },
  { who: "coach", when: "bench", tag: "shoot", t: "오늘은 벤치에서 시작한다. 혹시 들어가게 되면 망설이지 말고 때려라." },
  { who: "assistant", when: "bench", tag: "pass", t: "벤치라고 쉬는 날 아니다. 들어가면 공 오래 끌지 말고 바로 내줘." },
  { who: "coach", when: "bench", tag: "defend", t: "먼저 나간 선수들 수비 위치 잘 봐 둬라. 들어가면 너도 거기 서야 한다." },
  { who: "coach", when: "sub", tag: "physical", t: "후반엔 다들 지친다. 들어가서 첫 경합부터 이겨라. 그럼 분위기가 바뀐다." },
  { who: "coach", when: "big", tag: "safe", t: "큰 경기는 실수 적은 팀이 이긴다. 오늘은 욕심보다 정확하게." },
  { who: "coach", when: "big", tag: "physical", t: "전국대회다. 다들 우리보다 크다. 그래도 피하지 마라." },
  { who: "coach", when: "ko", tag: "defend", t: "지면 끝이다. 먼저 실점하지 않는 게 첫째. 그다음은 너희 몫이다." },
  { who: "assistant", when: "ko", tag: "safe", t: "토너먼트는 한 번 실수가 끝이다. 위험한 곳에서는 그냥 걷어 내." },
  { who: "assistant", when: "hs", tag: "pass", t: "고등학교 감독님이 보신다. 화려한 거 말고, 공 주고 움직이는 거. 그걸 보러 오신 거다." },
  { who: "coach", when: "hs", tag: "physical", t: "형들이다. 몸으로 밀릴 거다. 그래도 한 번은 버텨 봐라. 그 한 번을 보러 오신 거다." },
  { who: "coach", when: "tired", tag: "safe", t: "너 오늘 다리 무거워 보인다. 아끼면서 뛰어. 무리한 질주는 하지 마라." },
  { who: "assistant", when: "tired", tag: "pass", t: "오늘은 짧게 주고 많이 움직이지 마라. 아낀 힘은 후반에 써라." },
  { who: "coach", when: "star", tag: "pass", t: "상대가 너만 본다. 그럼 너 말고 다른 애가 비겠지. 그걸 이용해." },
  { who: "assistant", when: "star", tag: "shoot", t: "수비 둘이 붙어도 너는 슈팅 각 나온다. 주눅 들지 마." },
  // ── 추가 지시 ──
  { who: "coach", when: "start", tag: "shoot", t: "오늘 골키퍼 발이 느리다. 낮게, 구석으로. 높이 띄우지 마라." },
  { who: "assistant", when: "start", tag: "shoot", t: "박스 밖에서도 한 번씩 때려 봐. 저 팀 수비는 나와서 막지를 않더라." },
  { who: "coach", when: "start", tag: "pass", t: "공 받기 전에 다음 패스를 정해 둬라. 받고 나서 생각하면 늦는다." },
  { who: "assistant", when: "start", tag: "pass", t: "오늘은 측면으로 벌렸다가 가운데로 찌르는 거. 연습한 대로만 해." },
  { who: "coach", when: "start", tag: "dribble", t: "1 대 1에서 뒤로 돌리는 거 금지다. 오늘은 한 번씩 부딪쳐 봐라." },
  { who: "assistant", when: "start", tag: "dribble", t: "상대 수비가 발을 먼저 내민다. 한 번 접으면 그대로 넘어간다." },
  { who: "coach", when: "start", tag: "defend", t: "오늘은 네가 뚫리면 끝이다. 공 말고 사람을 봐라." },
  { who: "assistant", when: "start", tag: "defend", t: "상대 9번이 등지고 받는 걸 좋아한다. 돌아서기 전에 붙어." },
  { who: "coach", when: "start", tag: "physical", t: "첫 공중볼 경합, 무조건 이겨라. 그걸로 오늘 경기 분위기가 정해진다." },
  { who: "assistant", when: "start", tag: "physical", t: "어깨 쓰는 거 겁내지 마. 반칙 아니다. 몸을 먼저 넣어." },
  { who: "coach", when: "start", tag: "safe", t: "오늘은 공 뺏기지 않는 게 먼저다. 애매하면 뒤로. 그것도 용기다." },
  { who: "assistant", when: "start", tag: "safe", t: "경기 초반 10분은 단순하게. 몸이 풀리면 그때 하고 싶은 거 해." },
  { who: "assistant", when: "sub", tag: "defend", t: "들어가면 수비부터 정리해. 지금 오른쪽이 계속 뚫린다." },
  { who: "coach", when: "sub", tag: "pass", t: "공 잡으면 바로 앞으로. 지금 필요한 건 속도다." },
  { who: "assistant", when: "sub", tag: "safe", t: "들어가자마자 무리하지 마. 첫 터치는 쉽게, 그다음부터 네 축구 해." },
  { who: "assistant", when: "bench", tag: "physical", t: "벤치에서도 다리 식히지 마. 들어가면 첫 경합부터다." },
  { who: "coach", when: "bench", tag: "dribble", t: "후반에 상대 다리 무거워지면 너 같은 선수가 필요하다. 준비해 둬." },
  { who: "coach", when: "big", tag: "pass", t: "큰 경기일수록 공을 쉽게 차라. 어려운 패스는 연습 때 실컷 했다." },
  { who: "assistant", when: "big", tag: "defend", t: "관중 많다고 들뜨지 마. 수비는 소리 지르면서 해. 관중보다 크게." },
  { who: "coach", when: "ko", tag: "shoot", t: "토너먼트는 찬스가 많이 안 온다. 하나 오면 그게 마지막이라고 생각하고 차." },
  { who: "assistant", when: "ko", tag: "physical", t: "연장까지 갈 수도 있다. 체력 아끼면서, 그래도 경합은 다 이겨." },
  { who: "coach", when: "hs", tag: "dribble", t: "고등학교 감독님은 1 대 1을 본다. 한 번은 자신 있게 붙어 봐라." },
  { who: "assistant", when: "hs", tag: "safe", t: "형들 상대로 실수 안 하는 것만 보여도 충분하다. 차분하게." },
  { who: "assistant", when: "tired", tag: "safe", t: "다리 무거우면 머리를 써라. 뛰는 양보다 서 있는 위치다." },
  { who: "coach", when: "star", tag: "dribble", t: "상대가 너한테 둘 붙는다. 한 명만 벗기면 그 뒤는 텅 비어 있다." },
  { who: "assistant", when: "star", tag: "pass", t: "오늘 너 막으려고 상대가 작전을 짰다더라. 그러니까 미끼가 돼. 동료가 빈다." },
];

return { OUTCOMES, SITUATIONS, LINES, FLOW, HALFTIME_TALK, PLAYS, BREAK, FINISH, RESULT, AMBIENT, TO_ME, SIGNATURE, ME_IN_PLAY, PREMATCH };
})();
(__fix["data/match.js"] || []).forEach(f => f());

// ── data/messages.js
__m["data/messages.js"] = (function () {
const {turnInfo} = __m["js/engine/calendar.js"];
// 일상 메시지. 한 주가 끝나면 가끔 하나씩 옵니다. 자유롭게 고치거나 더하셔도 됩니다.
//
// from : mom 엄마, dad 아빠, teacher 담임, coach 감독, assist 코치, group 단톡방, news 고흥 소식,
//        friend 단짝 친구, rival 라이벌, mentor 멘토 선배, junior 후배
// when : months 달 / grades 학년 (없으면 언제나)
// cond : 게임 상태를 보고 true일 때만
// body 안의 {name} 나, {friend} {rival} {mentor} {junior} {mate} 동료, {coach} {assistant} {teacher}
// {name|이/가} 처럼 쓰면 받침에 맞는 조사가 붙습니다.


// 이번 주에 경기가 있는지 / 이번 주가 시험 주간인지 / 시험이 막 끝났는지
const matchWeek = s => !!turnInfo(s)?.match;
const examWeek = s => { const n = turnInfo(s); return !!n?.exam && !n.exam.free; };
const afterExam = s => !!s.lastExam && s.calendar.turn - s.lastExam.turn <= 1;
// 지난주에 치른 경기 (없거나 오래됐으면 null)
const last = s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 ? m : null; };

const LIFE = [
  // ── 엄마 ──
  { id: "mom_food", from: "mom", title: "냉장고 열어 봐", body: "닭가슴살 삶아 놨어. 운동하는 애가 컵라면만 먹으면 안 돼.\n\n밥은 꼭 두 공기 먹고 자." },
  { id: "mom_rain", from: "mom", when: { months: [6, 7, 8] }, title: "우산 챙겼어?", body: "오후에 비 온대. 훈련 끝나고 젖은 채로 버스 타지 말고 엄마 부르고." },
  { id: "mom_cold", from: "mom", when: { months: [12, 1, 2] }, title: "목도리", body: "현관에 목도리 걸어 놨다. 운동장 바람 장난 아니라던데. 감기 걸리면 너만 손해야." },
  { id: "mom_laundry", from: "mom", title: "유니폼", body: "주황색 유니폼 흙물이 안 빠진다. 다음부터 벗자마자 물에 담가 놔. 엄마 손목 나간다 😅" },
  { id: "mom_proud", from: "mom", cond: s => (s.record.goals || 0) >= 3, title: "아빠가 자랑하더라", body: "아빠가 회사에서 네가 넣은 골 영상 보여 주고 다닌대. 모르는 척해 줘. 엄청 좋아하신다." },
  { id: "mom_sleep", from: "mom", cond: s => s.player.condition.fatigue >= 50, title: "불 끄고 자", body: "새벽 1시에 방에 불 켜져 있던데. 휴대폰 보는 거 다 안다. 키는 자는 동안 큰대." },
  { id: "mom_exam", from: "mom", cond: examWeek, title: "시험 기간이지?", body: "시험 끝나면 먹고 싶은 거 말해. 고기든 회든. 대신 이번 주는 폰 엄마한테 맡기자." },
  // ── 아빠 ──
  { id: "dad_watch", from: "dad", cond: matchWeek, title: "이번 주 경기", body: "이번 주는 아빠가 꼭 보러 간다. 관중석에서 소리 지르는 아저씨 있으면 아빠다. 창피해하지 마라." },
  { id: "dad_boots", from: "dad", cond: s => s.calendar.turn > 10, title: "축구화", body: "축구화 밑창 다 닳았더라. 주말에 순천 가서 새로 하나 보자. 너무 비싼 건 안 된다." },
  { id: "dad_fish", from: "dad", when: { months: [9, 10] }, title: "녹동항", body: "주말에 녹동항 가서 전어 먹자. 가을 전어는 집 나간 며느리도 돌아온다더라. 너도 훈련 끝나고 와라." },
  { id: "dad_talk", from: "dad", cond: s => s.player.condition.morale < 45, title: "아빠도 그랬다", body: "아빠도 고등학교 때 2년 동안 벤치만 지켰다. 그때 그만뒀으면 지금 너한테 할 말도 없었겠지.\n\n밥 먹고 산책이나 하자." },
  // ── 친구 ──
  { id: "fr_pcroom", from: "friend", title: "ㅋㅋㅋ", body: "야 오늘 훈련 끝나고 PC방 ㄱ? 1시간만. 너 피파 실력 좀 보자. 실제랑 다른지 ㅋㅋ" },
  { id: "fr_homework", from: "friend", title: "수학 숙제 몇 쪽까지야", body: "나 진짜 몰라서 묻는 거임. 62쪽까지? 64쪽까지? 빨리 답 좀 ㅠ" },
  { id: "fr_goal", from: "friend", cond: s => last(s)?.goals > 0, title: "야 미쳤다", body: "오늘 골 영상 단톡에 돌던데 ㅋㅋㅋ 반 애들 다 봄. 내일 학교 오면 사인해 줘라" },
  { id: "fr_bench", from: "friend", cond: s => last(s)?.status === "bench", title: "괜찮냐", body: "오늘 경기 못 뛰었다며. 다음엔 뛰겠지. 떡볶이 먹으러 가자. 내가 산다." },
  { id: "fr_crush", from: "friend", title: "비밀인데", body: "옆 반 걔가 너 축구하는 거 보러 운동장 왔었대. 진짜임. 나한테 들었다고 하지 마라 ㅋㅋ" },
  { id: "fr_cafe", from: "friend", when: { months: [7, 8] }, title: "덥다", body: "더워 죽겠다. 너 훈련 끝나면 편의점 앞에서 아이스크림 먹자. 바닷바람 맞으면서." },
  // ── 라이벌 ──
  { id: "rv_challenge", from: "rival", title: "내일 일찍 나와", body: "내일 아침 7시 운동장. 슈팅 100개 누가 더 넣나 내기. 지는 사람 음료수." },
  { id: "rv_respect", from: "rival", cond: s => last(s)?.rating >= 7.5, title: "…", body: "오늘 좀 하더라. 인정은 오늘만 한다." },
  { id: "rv_number", from: "rival", when: { grades: [2] }, title: "내년에", body: "내년에 등번호 고를 때 10번은 내 거다. 미리 말해 둔다." },
  // ── 멘토 선배 ──
  { id: "mt_tip_first", from: "mentor", title: "첫 터치", body: "공 받기 전에 어깨 너머로 한 번 봐라. 받고 나서 보면 늦다. 이것만 고쳐도 반은 간다." },
  { id: "mt_tip_rest", from: "mentor", cond: s => s.player.condition.fatigue >= 60, title: "형 말 들어", body: "나도 1학년 때 매일 개인훈련 했다가 발목 나갔다. 쉬는 것도 훈련이다. 이번 주 하루는 그냥 자라." },
  { id: "mt_shoes", from: "mentor", title: "축구화 끈", body: "경기 전에 축구화 끈 두 번 묶어라. 나 작년 결승에서 끈이 풀려서 결정적인 찬스를 놓쳤다. 아직도 생각난다." },
  { id: "mt_exam", from: "mentor", cond: afterExam, title: "성적표 나왔냐", body: "형 작년에 공부 안 해서 대회 하나 못 나갔다. 너는 그러지 마라. 진짜 후회한다." },
  // ── 후배 ──
  { id: "jr_thanks", from: "junior", title: "형!!", body: "형 오늘 알려 주신 대로 해 봤는데 코치님이 잘했다고 하셨어요!! 감사합니다 ㅠㅠ" },
  { id: "jr_ask", from: "junior", title: "질문 있어요", body: "형 혹시 왼발 연습 어떻게 하셨어요? 저 왼발로 차면 공이 자꾸 옆으로 가요…" },
  { id: "jr_scared", from: "junior", title: "형 저 내일 선발이래요", body: "떨려서 잠이 안 와요. 형은 처음 선발 때 어땠어요?" },
  // ── 담임 선생님 ──
  { id: "tc_notice", from: "teacher", title: "가정통신문", body: "내일까지 가정통신문 회신서 가져오기. 축구부라고 안 봐준다. 부모님 서명 꼭 받아 오고." },
  { id: "tc_cleaning", from: "teacher", title: "청소 당번", body: "이번 주 교실 청소 당번이다. 훈련 때문에 바쁜 건 아는데, 반 친구들이 대신하면 서운하겠지?" },
  { id: "tc_book", from: "teacher", title: "이번 주 한 문장", body: "\"넘어지는 건 실패가 아니다. 그대로 누워 있는 게 실패다.\"\n\n국어 시간에 읽은 문장인데, 너 생각나서 보낸다." },
  { id: "tc_good", from: "teacher", cond: s => (s.relations.teacher ?? 50) >= 65, title: "수업 시간에", body: "요즘 수업 시간에 눈빛이 달라졌더라. 피곤할 텐데 대단하다. 선생님이 다 보고 있어." },
  { id: "tc_seat", from: "teacher", when: { months: [3, 9] }, title: "자리 바꾸기", body: "이번 달 자리 바꾼다. 창가 자리 원하면 일찍 와. 운동장 보이는 자리 좋아하잖아." },
  // ── 친구 (추가) ──
  { id: "fr_lunch", from: "friend", title: "급식 뭐 나와?", body: "내일 급식 돈가스래!! 너 훈련 끝나고 늦게 오면 내가 하나 더 챙겨 둠 ㅋㅋ" },
  { id: "fr_game", from: "friend", cond: s => last(s)?.result === "승", title: "이겼다며 ㅋㅋ", body: "반 단톡에 결과 올라옴. 다들 너 얘기 중. 근데 너 골 넣었냐? 안 넣었으면 그냥 넘어가 줄게" },
  { id: "fr_loss", from: "friend", cond: s => last(s)?.result === "패", title: "괜찮아?", body: "졌다며. 너 이럴 때 말 안 하는 거 안다. 그냥 편의점 앞으로 나와. 말 안 해도 됨" },
  { id: "fr_exam_after", from: "friend", cond: afterExam, title: "시험 끝!!!", body: "시험 끝났다!!! 오늘은 축구 얘기 금지, 공부 얘기도 금지. 노래방 ㄱ?" },
  { id: "fr_sleepy", from: "friend", cond: s => s.player.condition.fatigue >= 55, title: "야 너 수업 시간에", body: "너 오늘 3교시에 졸다가 선생님한테 이름 불렸잖아 ㅋㅋㅋ 훈련 너무 빡센 거 아님?" },
  // ── 라이벌 (추가) ──
  { id: "rv_loss", from: "rival", cond: s => last(s)?.rating != null && last(s).rating < 6, title: "어제", body: "어제 경기… 나도 별로였다. 다음 주는 둘 다 잘하자. 이런 말 하는 거 처음이다." },
  { id: "rv_extra", from: "rival", title: "봤냐", body: "나 어제 혼자 남아서 프리킥 50개 찼다. 너는 뭐 했냐." },
  { id: "rv_start", from: "rival", cond: s => last(s)?.status === "start", title: "선발", body: "이번엔 네가 선발이네. 다음엔 내 차례다. 각오해라." },
  // ── 멘토 선배 (추가) ──
  { id: "mt_bus", from: "mentor", title: "원정 버스", body: "원정 가는 버스에서는 자라. 휴대폰 보지 말고. 경기 전 30분이 그날 다리를 정한다." },
  { id: "mt_bench", from: "mentor", cond: s => ["bench", "sub"].includes(last(s)?.status), title: "형도 그랬다", body: "형도 1학년 땐 물병만 날랐다. 근데 벤치에서 본 게 나중에 다 쓸모 있더라. 형들 움직임 하나만 훔쳐 와라." },
  { id: "mt_goal", from: "mentor", cond: s => last(s)?.goals > 0, title: "골 축하한다", body: "골 넣은 날일수록 집에 가서 잘 자라. 들뜬 채로 다음 경기 가면 꼭 탈 난다. 축하는 오늘까지만." },
  { id: "mt_tour", from: "mentor", when: { months: [7, 1] }, title: "대회 전에", body: "대회는 조별리그 첫 경기가 반이다. 첫 경기에서 몸이 풀리면 끝까지 간다. 긴장되면 형한테 와라." },
  // ── 후배 (추가) ──
  { id: "jr_snack", from: "junior", title: "형 간식", body: "형! 저희 엄마가 훈련 끝나고 다 같이 먹으라고 바나나 한 박스 보내셨어요!! 형이 나눠 주세요 ㅎㅎ" },
  { id: "jr_goal", from: "junior", cond: s => last(s)?.goals > 0, title: "형 골 미쳤어요", body: "형 골 장면 벤치에서 봤는데 소리 질렀어요 ㅠㅠ 저도 그렇게 차 보고 싶어요. 다음에 알려 주세요!!" },
  { id: "jr_lost", from: "junior", cond: s => last(s)?.result === "패", title: "형…", body: "오늘 진 거 제 실수 때문인 것 같아서 잠이 안 와요. 형은 이럴 때 어떻게 해요?" },
  { id: "jr_number", from: "junior", when: { grades: [3] }, title: "형 등번호", body: "형 졸업하면 형 등번호 제가 달아도 돼요? 아직 아무한테도 말 안 했어요 ㅎㅎ" },
  // ── 선생님·가족 (추가) ──
  { id: "tc_praise_exam", from: "teacher", cond: s => s.lastExam && s.lastExam.score >= 70 && s.calendar.turn - s.lastExam.turn <= 2, title: "시험 잘 봤더라", body: "이번 시험 생각보다 잘 봤더라. 훈련하면서 공부한 거 다 보인다. 이 정도면 운동장에서도 칭찬받을 일이다." },
  { id: "tc_tired", from: "teacher", cond: s => s.player.condition.fatigue >= 65, title: "보건실 다녀와", body: "얼굴이 많이 안 좋다. 오늘은 5교시에 보건실 가서 좀 쉬어라. 선생님이 체육 선생님께 말해 둘게." },
  { id: "dad_away", from: "dad", when: { months: [7, 8, 1, 2] }, title: "대회 응원", body: "대회 기간에 맞춰 아빠 휴가 냈다. 관중석에서 보고 있을 테니 다치지만 마라." },
  // ── 감독·코치 ──
  { id: "co_video", from: "assist", cond: s => last(s)?.minutes > 0, title: "영상 보내 줌", body: "지난 경기에서 네가 나온 장면만 잘라서 단톡에 올렸다. 공 받기 전 위치를 봐라. 반 발짝만 앞에 있었으면 됐다." },
  { id: "co_early", from: "coach", cond: s => s.relations.coach >= 65, title: "내일 15분 일찍", body: "내일 훈련 15분 일찍 나와라. 따로 할 얘기 있다. 혼나는 거 아니다." },
  { id: "co_diet", from: "assist", title: "음료수 그만", body: "운동장 옆 자판기 탄산 그만 마셔라. 다 보인다. 물 마셔라 물." },
  { id: "co_weather", from: "assist", when: { months: [7, 8] }, title: "폭염 주의", body: "낮 훈련은 4시 이후로 미룬다. 물병 두 개 챙겨라. 어지러우면 바로 말하고." },
  { id: "co_quote", from: "coach", title: "한마디", body: "잘하는 선수는 많다. 끝까지 하는 선수는 적다. 오늘 훈련에서 끝까지 뛴 사람이 누군지 나는 안다." },
  // ── 단톡방 ──
  { id: "gp_bus", from: "group", cond: matchWeek, title: "버스 시간 공지", body: "{assistant}: 이번 주 원정 버스 7시 30분 학교 정문 출발. 늦으면 놓고 간다. 진짜로.\n\n{mate}: 넵!!\n\n{mate2}: 7시 30분 실화냐…" },
  { id: "gp_birthday", from: "group", cond: s => !!s.relations.people?.mentor, title: "생일 축하 🎂", body: "{mate}: 오늘 {mate2} 생일임!!\n\n{mentor}: 축하한다. 내일 훈련 끝나고 초코우유 돌린다.\n\n{mate2}: 형 감사합니다 ㅠㅠ" },
  { id: "gp_meme", from: "group", title: "ㅋㅋㅋㅋ", body: "{mate}: (어제 연습경기에서 헛발질하는 {mate2} 사진)\n\n{mate2}: 야 지워라\n\n{mate}: 이미 프사함 ㅋㅋ" },
  { id: "gp_lost", from: "group", title: "분실물", body: "{assistant}: 운동장에 정강이 보호대 한 짝 떨어져 있었다. 이름 없음. 주인 찾아가라.\n\n{mate}: 저거 {mate2} 거 같은데요" },
  { id: "gp_rain", from: "group", when: { months: [6, 7, 8, 9] }, title: "우천 훈련", body: "{assistant}: 오늘 비 와서 체육관에서 한다. 실내화 챙겨.\n\n{mate}: 풋살 하나요?!\n\n{assistant}: 체력이다." },
  // ── 고흥 소식 ──
  { id: "nw_yuja", from: "news", when: { months: [11, 12] }, title: "고흥 유자 수확철", body: "고흥 유자 수확이 한창이다. 엄마가 유자차 담근다고 주말에 손 좀 보태라고 하셨다." },
  { id: "nw_rocket", from: "news", title: "나로우주센터 소식", body: "나로우주센터에서 발사 준비 소식이 들려왔다. 반 아이들이 그날 운동장에서 하늘을 보자고 난리다." },
  { id: "nw_palyeong", from: "news", when: { months: [4, 5, 10] }, title: "팔영산 산행", body: "주말에 팔영산 등산하는 사람들이 많다. 감독님이 '다음 체력 훈련은 저기다'라고 하셨다는 소문이 돈다." },
  { id: "nw_fest", from: "news", when: { months: [10] }, title: "지역 축제", body: "읍내에서 축제가 열린다. 단톡방이 '훈련 몇 시에 끝나요'로 도배됐다." },
];

// 경기 뒤 단톡방 대화 (결과와 내 활약에 따라)
const AFTER_MATCH = {
  win: [
    "{mate}: 이겼다!!!! 😆\n\n{mate2}: 오늘 수비 미쳤다",
    "{mate}: 3점 챙겼다 ㅋㅋ\n\n{mentor}: 들뜨지 마라. 다음 경기 준비",
    "{mate2}: 오늘 버스에서 노래 틀어도 됨?\n\n{assistant}: 한 곡만.",
    "{mate}: 편의점 들렀다 가자 ㅋㅋ\n\n{mentor}: 탄산은 안 된다",
    "{mate2}: 오늘 골 장면 다시 보고 싶다\n\n{mate}: 코치님이 찍으셨대 월요일에 보여 준대",
  ],
  draw: [
    "{mate}: 아 아깝다 진짜\n\n{mate2}: 마지막에 그거 들어갔어야 했는데",
    "{mentor}: 비긴 경기는 진 경기라고 생각해라. 월요일에 다시 보자",
    "{mate2}: 승점 1점이라도 챙긴 게 어디냐\n\n{mentor}: 그 1점이 나중에 순위 가른다",
    "{mate}: 골대만 두 번 맞혔네 ㅠ\n\n{mate2}: 운이 다음 경기로 미뤄진 거임",
    "{assistant}: 오늘 비긴 거 아무도 탓하지 마라. 다음 주 수요일 영상 미팅 있다",
  ],
  loss: [
    "{mate}: …\n\n{mentor}: 다들 고개 들어. 우리 아직 안 끝났다",
    "{mate2}: 오늘 내가 실수했다 미안\n\n{mate}: 아니야 다 같이 진 거야",
    "{mate}: 버스 안 너무 조용하다\n\n{assistant}: 오늘은 그냥 쉬어라. 월요일에 다시 한다",
    "{mentor}: 오늘 진 거 기억해 둬라. 다음에 똑같이 갚으면 된다",
    "{mate2}: 배고픈데 밥이 안 넘어감\n\n{mate}: 그래도 먹어라 내일 회복 훈련이다",
  ],
  myGoal: [
    "{mate}: {name} 골 뭐냐 ㅋㅋㅋㅋ 영상 있는 사람\n\n{mate2}: 내가 찍음 올림",
    "{mentor}: {name} 오늘 잘했다. 근데 세리머니는 연습 좀 해라",
    "{mate2}: {name} 골 넣고 어디로 뛰어간 거임 ㅋㅋ\n\n{mate}: 관중석에 엄마 계셨대",
    "{assistant}: {name}, 골 장면 위치 선정 좋았다. 다음에도 그 자리에 서 있어라",
  ],
  // ── 대회·특별 경기 (결과와 진행 상황에 맞춰 먼저 나옴) ──
  groupWin: [
    "{mate}: 조별리그 승점 3점 챙겼다!!\n\n{mentor}: 아직 안 끝났다. 숙소 가서 바로 씻고 자라",
    "{mate2}: 토너먼트 가자 ㅋㅋㅋ\n\n{assistant}: 다음 상대 영상 오늘 밤에 올린다. 보고 자라",
  ],
  groupDraw: [
    "{mate}: 비긴 건 아쉬운데 아직 기회 있음\n\n{mentor}: 다음 경기 이기면 된다. 계산하지 마라",
  ],
  groupLoss: [
    "{mate2}: 아… 조별리그 쉽지 않다\n\n{mentor}: 아직 안 끝났다. 남은 경기 다 이기면 된다",
    "{mate}: 숙소 분위기 장난 아님\n\n{assistant}: 오늘 저녁은 다 같이 먹는다. 고개 숙이고 먹지 마라",
  ],
  advance: [
    "{mate}: 토너먼트 진출!!!! 🔥\n\n{mate2}: 이제부터 지면 끝이다 ㄷㄷ\n\n{mentor}: 그러니까 재밌는 거다",
    "{assistant}: 조 통과 축하한다. 오늘 밤 휴대폰 10시에 걷는다\n\n{mate}: 넵… ㅠ",
  ],
  groupOut: [
    "{mate}: 조별리그 탈락이라니…\n\n{mentor}: 다음 대회가 있다. 오늘 일 꼭 기억해 둬라",
    "{mate2}: 버스 타고 고흥 가는 길이 제일 길다\n\n{assistant}: 다들 고생했다. 월요일 하루 쉰다",
  ],
  koWin: [
    "{mate}: 다음 라운드 간다!!!\n\n{mate2}: 엄마가 숙소 하루 더 연장했대 ㅋㅋ\n\n{mentor}: 짐 풀지 마라. 아직 갈 길 멀다",
    "{mate}: 오늘 진짜 심장 터지는 줄\n\n{assistant}: 내일 회복 훈련 9시. 늦으면 벤치다",
  ],
  toFinal: [
    "{mate}: 결승이다!!!!!!! 결승!!!!\n\n{mentor}: 결승은 즐기는 사람이 이긴다. 오늘은 푹 자라",
    "{mate2}: 고흥에서 응원 버스 온대 ㄷㄷ\n\n{mate}: 학교 현수막 사진 봤냐 ㅋㅋㅋ",
  ],
  champion: [
    "{mate}: 우승!!!!!!!!!! 🏆🏆🏆\n\n{mate2}: 아직도 안 믿긴다 진짜\n\n{mentor}: 오늘은 마음껏 소리 질러라",
    "{assistant}: 너희가 해냈다. 감독님 눈시울 붉어지신 거 봤냐\n\n{mate}: 코치님도 우셨잖아요 ㅋㅋ",
  ],
  runnerUp: [
    "{mate}: 준우승… 은메달 무겁다\n\n{mentor}: 결승까지 온 것만으로도 대단한 거다. 고개 들어라",
  ],
  koOut: [
    "{mate}: 여기서 끝이라니…\n\n{mentor}: 오늘 진 거 평생 기억날 거다. 그래서 다음에 이기는 거다",
    "{mate2}: 한 골이 이렇게 크다\n\n{assistant}: 다들 고생했다. 고개 숙이지 마라",
  ],
  koOutPk: [
    "{mate2}: 승부차기는 너무 잔인하다\n\n{assistant}: 찬 사람 아무도 탓하지 마라. 다 같이 진 거다",
  ],
  leagueTitle: [
    "{mate}: 리그 우승!!! 🏆\n\n{mentor}: 오늘은 축하하고 내일부터 다시 시작",
  ],
  elemWin: [
    "{mate}: 초등학생들 진짜 빠르더라 ㅋㅋ\n\n{mate2}: 우리도 저럴 때 있었는데\n\n{mentor}: 이겨도 본전이다",
  ],
  elemDraw: [
    "{mate}: 초등학생이랑 비긴 거 실화냐\n\n{mate2}: 걔네 골키퍼 미쳤던데\n\n{mentor}: 변명하지 마라. 다음 주 훈련 각오해라",
  ],
  elemLoss: [
    "{mate}: …초등학생한테 진 거 아무한테도 말하지 마\n\n{mate2}: 이미 학교에 다 퍼짐\n\n{assistant}: 월요일에 보자. 다들 각오해라",
  ],
  hs: [
    "{mate}: 고등학생 형들 몸 진짜 단단하다\n\n{mate2}: 어깨 부딪혔는데 벽인 줄\n\n{mentor}: 그게 곧 너희다",
    "{mate}: 고등학교 감독님 오셨던 거 봤냐\n\n{mate2}: 수첩에 계속 뭐 적으시던데 ㄷㄷ",
  ],
  hsMe: [
    "{mate}: 고등학교 감독님 오셨던 거 봤냐\n\n{mate2}: 계속 {name} 쪽 보시던데 ㅋㅋ",
  ],
  myHat: [
    "{mate}: 해트트릭 실화냐 ㅋㅋㅋㅋ\n\n{assistant}: 경기구는 {name|이/가} 가져가라. 오늘은 네 공이다",
    "{mate2}: {name} 혼자 세 골 ㄷㄷ\n\n{mate}: 내일 급식 줄 맨 앞은 {name}한테 양보함",
  ],
  myBad: [
    "{rival}: 오늘 {name} 컨디션 안 좋던데\n\n{friend}: 그런 날도 있지 ㅋ 다음 경기 보자",
    "{friend}: {name} 괜찮냐? 오늘 너무 신경 쓰지 마라\n\n{mentor}: 다들 한 번씩 그런 날 있다",
    "{mentor}: {name}, 오늘 거 다시 보지 말고 일찍 자라. 내일 이야기하자",
  ],
};

// ── 상대 에이스 (data/world.js의 OPPONENT_STARS) ─────────────
// {ace} 이름, {gw} 학년(예: 3학년), {posw} 공격수·미드필더·수비수, {trait} 특징, {team} 상대 팀, {goals} 우리에게 넣은 골
// {mate} {mate2} {friend} {mentor} {name}은 단톡방과 같은 사람들. {ace|이/가}처럼 쓰면 받침에 맞는 조사가 붙습니다.
const ACE_TALK = {
  // 경기 분석 메일 (정 코치)
  intro: ["이 팀은 {gw} {ace|이/가} 중심이다.", "{team}에서 제일 먼저 봐야 할 선수는 {gw} {ace}.", "요즘 {ace} 얘기가 많이 들린다. {gw} {posw}다."],
  trait: ["{trait|이/가} 무기다."],
  scoredBefore: ["지금까지 우리한테 {goals}골을 넣은 선수다. 그 이름 잊지 마라.", "우리 상대로만 {goals}골을 넣었다. 이번엔 갚아 줘야지."],
  metLastYear: ["작년에도 붙어 본 선수다. 그때보다 한 뼘은 더 컸다고 생각해라."],
  absent: ["{gw} {ace|이/가} 이번 경기엔 못 나온다더라. 그 팀 전력의 한 축이 빠지는 셈이다. 그래도 방심은 하지 마라.",
           "{ace|이/가} 다쳐서 못 나온다는 얘기가 있다. 남은 선수들이 더 악착같이 뛸 거다."],
  // 내 포지션 - 상대 에이스 포지션
  matchup: {
    "DF-FW": ["네가 제일 많이 붙을 거다. 등 뒤로 돌아 들어가는 움직임을 놓치지 마라.", "결국 너랑 저 선수 싸움이다. 첫 번째 경합에서 밀리지 마라."],
    "DF-MF": ["앞에서 공이 나오는 출발점이다. 패스 길을 먼저 읽어라."],
    "DF-DF": ["세트피스 때 저 선수가 올라온다. 코너킥 때 꼭 붙어라."],
    "MF-FW": ["공이 그쪽으로 가기 전에 끊는 게 네 몫이다."],
    "MF-MF": ["중원에서 너랑 정면으로 부딪힌다. 공 잡으면 바로 붙어라.", "저 선수가 편하게 공을 잡으면 우리가 진다. 네가 먼저 다가가라."],
    "MF-DF": ["뒤에서 우리 공격을 끊어 내는 선수다. 그 앞에서는 공을 오래 끌지 마라."],
    "FW-FW": ["상대 골문 앞에선 네가 저 선수보다 더 무서워야 한다."],
    "FW-MF": ["그 선수한테서 공이 시작된다. 앞에서부터 붙어서 편하게 못 차게 해라."],
    "FW-DF": ["너를 막으러 나올 선수다. 한 번 이기면 그 뒤로는 편해진다.", "저 선수를 등지고 버티지 마라. 공 받기 전에 먼저 움직여라."],
  },
  // 경기 전 단톡방
  chatBefore: ["{mate}: 이번 주 상대 {team}. 거기 {ace} 있잖아 ㄷㄷ\n\n{mate2}: {trait} 장난 아니라던데\n\n{mentor}: 이름 듣고 겁먹지 말고 훈련이나 하자",
               "{mate2}: {ace} 영상 봤는데 진짜 잘함\n\n{friend}: 우리도 {name} 있잖아 ㅋㅋ\n\n{mentor}: 상대 말고 우리 거나 잘하자"],
  chatRevenge: ["{mate}: 이번 주 {ace} 또 나온다더라\n\n{mate2}: 전에 우리한테 골 넣은 걔?\n\n{mentor}: 이번엔 안 된다. 다들 각오해라"],
  // 경기 뒤 단톡방
  chatAfterScored: ["{mentor}: {ace} 잘하긴 하더라. 월요일에 영상 다시 보자", "{mate}: {ace} 막는 법 누가 좀 알려 줘라 ㅠ"],
  chatAfterHeld: ["{mate}: 오늘 {ace} 한 골도 못 넣음 ㅋㅋ\n\n{mentor}: 수비 다 같이 잘했다"],
  // 경기 후 면담 (감독님)
  coachHeldWin: ["오늘 {ace|을/를} 거의 지웠다. 그게 오늘 승리다.", "{ace|이/가} 공 잡을 때마다 네가 먼저 가 있더라. 그게 오늘 경기를 결정했다."],
  coachHeldDraw: ["{ace|을/를} 묶은 건 잘했다. 그 덕에 승점 하나 챙겼다."],
  coachScored: ["{ace}한테 {goals}골. 그 선수가 공 잡을 때마다 우리가 한 박자씩 늦었다. 다음엔 먼저 붙어라."],
};

return { LIFE, AFTER_MATCH, ACE_TALK };
})();
(__fix["data/messages.js"] || []).forEach(f => f());

// ── js/engine/life.js
__m["js/engine/life.js"] = (function () {
const {LIFE, AFTER_MATCH} = __m["data/messages.js"];
const {STAFF} = __m["data/roster.js"];
const {mail, mailFrom} = __m["js/state.js"];
const {person} = __m["js/engine/relations.js"];
const {activeRoster} = __m["js/engine/team.js"];
const {pick, shuffle} = __m["js/rng.js"];
// 일상 메시지와 경기 뒤 단톡방 대화






const bat = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
const fillJ = (t, v) => t.replace(/\{(\w+)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => { const x = v[k] ?? ""; return a ? x + (bat(x) ? a : b) : x; });

function vars(state) {
  const mates = shuffle(activeRoster(state).map(m => m.name));
  return {
    name: state.player.name, coach: STAFF.coach, assistant: STAFF.assistant, teacher: STAFF.teacher,
    friend: person(state, "friend")?.name || mates[2] || "친구", rival: person(state, "rival")?.name || mates[3] || "동기",
    mentor: person(state, "mentor")?.name || STAFF.assistant,
    junior: person(state, "junior")?.name || mates[5] || "후배",   // 멘토 선배가 없으면 코치님이 그 말을 함
    mate: mates[0] || "동료", mate2: mates[1] || "동료",
  };
}
const REL = ["friend", "rival", "mentor", "junior"];

// 한 주 끝에 가끔: 조건 맞는 일상 메시지 하나
function lifeMail(state, info) {
  state.lifeLog ||= {};
  const list = LIFE.filter(x => {
    if (x.when?.months && !x.when.months.includes(info.month)) return false;
    if (x.when?.grades && !x.when.grades.includes(info.grade)) return false;
    if (x.from === "teacher" && info.vacation) return false;          // 방학에는 담임 선생님 학교 이야기 없음
    if (REL.includes(x.from) && !person(state, x.from)) return false;
    const last = state.lifeLog[x.id];
    if (last != null && state.calendar.turn - last < 30) return false;
    try { if (x.cond && !x.cond(state)) return false; } catch { return false; }
    return true;
  });
  if (!list.length) return false;
  const x = pick(list);
  const v = vars(state);
  const body = fillJ(x.body, v), title = fillJ(x.title, v);
  if (REL.includes(x.from)) mailFrom(state, person(state, x.from).name, "friend", title, body);
  else if (x.from === "news") mailFrom(state, "고흥 소식", "news", title, body);
  else mail(state, x.from, title, body);
  state.lifeLog[x.id] = state.calendar.turn;
  return true;
}

// 대회 진행 상황에 맞는 단톡방 주제 (없으면 null)
function stageKey(state, res, fx) {
  if (!fx) return null;
  const won = res.result === "승" || (res.shootout && res.shootout.win);
  if (fx.comp === "summer" || fx.comp === "winter") {
    const t = state.tour;
    if (fx.ko) {
      if (fx.round === "결승") return won ? "champion" : "runnerUp";
      if (!won) return res.shootout ? "koOutPk" : "koOut";
      return fx.round === "4강" ? "toFinal" : "koWin";
    }
    if (t && t.groupPlayed === 3) return t.stage === "ko" ? "advance" : "groupOut";
    return won ? "groupWin" : res.result === "무" ? "groupDraw" : "groupLoss";
  }
  if (fx.elementary) return won ? "elemWin" : res.result === "무" ? "elemDraw" : "elemLoss";
  if (fx.comp === "hs") return res.minutes > 0 ? pick(["hsMe", "hs"]) : "hs";
  if (fx.comp === "league" && state.league?.finished && state.league.finalRank === 1 && state.league.key?.startsWith(`${res.grade}-`)) return "leagueTitle";
  return null;
}

// 경기 결과 단톡방 첫머리 대화
// 다른 모듈에서 단톡방 문장을 만들 때 ({name}, {friend}, {mate} … 채우기)
const chatText = (state, t) => fillJ(t, vars(state));

function afterMatchChat(state, res, fx = null, lastOfAll = false) {
  const v = vars(state);
  const parts = [];
  const stage = stageKey(state, res, fx);
  if (stage && AFTER_MATCH[stage]) parts.push(fillJ(pick(AFTER_MATCH[stage]), v));
  else parts.push(fillJ(pick(AFTER_MATCH[res.result === "승" ? "win" : res.result === "패" ? "loss" : "draw"]), v));
  // 내 활약 이야기는 뒤에 덧붙임
  if (res.goals >= 3) parts.push(fillJ(pick(AFTER_MATCH.myHat), v));
  else if (res.goals > 0) parts.push(fillJ(pick(AFTER_MATCH.myGoal), v));
  else if (res.rating != null && res.rating < 6.0) parts.push(fillJ(pick(AFTER_MATCH.myBad), v));
  if (res.injury) parts.push(fillJ("{friend}: {name} 괜찮냐?? 많이 아프냐\n\n{assistant}: 병원 다녀왔다. 다들 너무 걱정 마라", v));
  if (lastOfAll) parts.push(fillJ("{junior}: 형 마지막 경기 수고하셨어요 ㅠㅠ\n\n{friend}: 3년 끝… 이상하다 진짜", v));
  return parts.join("\n\n");
}

return { lifeMail, chatText, afterMatchChat };
})();
(__fix["js/engine/life.js"] || []).forEach(f => f());

// ── js/engine/birthday.js
__m["js/engine/birthday.js"] = (function () {
const {YEAR} = __m["js/engine/calendar.js"];
const {mail} = __m["js/state.js"];
const {chatText} = __m["js/engine/life.js"];
const {pick} = __m["js/rng.js"];
// 생일 주간: 캐릭터를 만들 때 고른 생일이 들어 있는 주
// 그 주가 시작될 때 단톡방·부모님 축하 메시지와 함께 사기가 오르고 피로가 조금 풀림 (1년에 한 번)




const WEEKS = {};
for (const s of YEAR) WEEKS[s.month] = Math.max(WEEKS[s.month] || 0, s.week);

// 생일(일)이 그 달 몇째 주인지. 달력에 없는 5주차 등은 그 달 마지막 주로
const birthdayWeekOf = b => (b ? { month: b.month, week: Math.min(Math.ceil(b.day / 7), WEEKS[b.month] || 4) } : null);

function isBirthdayWeek(state, info) {
  const w = birthdayWeekOf(state.player.birthday);
  return !!(w && info && info.month === w.month && info.week === w.week);
}

const GROUP = {
  1: ["{mate}: 오늘 {name} 생일이래!!! 🎂\n\n{friend}: 생축생축 훈련 끝나고 매점 ㄱ\n\n{assistant}: 생일 축하한다. 훈련은… 그래도 똑같이 한다",
      "{friend}: 얘들아 오늘 {name} 생일임\n\n{mate2}: 헐 몰랐다 ㅋㅋ 축하해!!\n\n{mentor}: 막내 생일이네. 축하한다"],
  2: ["{junior}: {name} 형 생일 축하드려요!! 🎉\n\n{mate}: 선물은 오늘 패스 다섯 개로 대신함\n\n{mentor}: 축하한다. 저녁에 떡볶이 쏜다",
      "{mate2}: 🎂🎂🎂 {name} 생일\n\n{friend}: 작년에 케이크 얼굴에 맞은 거 기억나냐 ㅋㅋ\n\n{assistant}: 생일 축하한다. 미역국은 먹고 왔냐"],
  3: ["{junior}: 형 생일 축하드립니다!! 오늘 훈련 끝나고 다들 남으래요 🎉\n\n{friend}: 중학교 마지막 생일이다 크게 가자\n\n{coach}: 축하한다. 오늘 하루는 웃어라",
      "{mate}: 오늘 우리 {name} 생일 🎂\n\n{junior}: 형 축하드려요!!! 선물 사물함에 넣어 놨어요\n\n{assistant}: 축하한다. 3년 동안 생일마다 운동장에 있었구나"],
};

// 생일 주간이 시작될 때 한 번 (주가 넘어간 직후 week.js에서 부름)
function birthdayWeek(state, info) {
  if (!isBirthdayWeek(state, info)) return false;
  const done = state.flags.bdayMail ||= [];
  if (done.includes(info.turn)) return false;
  done.push(info.turn);
  const p = state.player;
  p.condition.morale = Math.min(100, p.condition.morale + 8);
  p.condition.fatigue = Math.max(0, p.condition.fatigue - 8);
  const b = p.birthday;
  mail(state, "group", "생일 축하 🎂", chatText(state, pick(GROUP[info.grade] || GROUP[1])));
  mail(state, "mom", "생일 축하해", info.grade === 3
    ? `우리 아들, 중학생으로 맞는 마지막 생일이네. 미역국 끓여 놨어. 운동장에서 넘어져도 꼭 웃으면서 일어나는 사람이 되렴.`
    : pick(["생일 축하해, 우리 아들. 미역국 끓여 놨어. 늦게 와도 꼭 먹고 자.", "생일 축하해! 오늘은 일찍 와. 네가 좋아하는 갈비 재워 놨어."]));
  mail(state, "dad", `${b.month}월 ${b.day}일`, pick(["생일 축하한다. 새 축구화 끈 신발장 위에 올려 뒀다.", "축하한다. 아빠가 네 나이 때는 공이 하나뿐이었다. 너는 더 멀리 차라."]));
  return true;
}

return { birthdayWeekOf, isBirthdayWeek, birthdayWeek };
})();
(__fix["js/engine/birthday.js"] || []).forEach(f => f());

// ── js/engine/opponents.js
__m["js/engine/opponents.js"] = (function () {
const {OPPONENT_STARS, SURNAMES, GIVEN_NAMES} = __m["data/world.js"];
const {GOALKEEPERS} = __m["data/roster.js"];
const {pick, weighted, shuffle, rand} = __m["js/rng.js"];
const {mateGrade} = __m["js/engine/team.js"];
const {TURNS_PER_YEAR, GRAD_INDEX} = __m["js/engine/calendar.js"];
// 상대 팀 선수단: 핵심 선수(data/world.js의 OPPONENT_STARS) + 자동으로 만든 선수
// 한 판 안에서는 같은 이름이 계속 나오고, 해마다 한 학년씩 올라가며 3학년은 1월에 졸업합니다.





const COHORTS = ["3학년선배", "2학년선배", "동기", "1년후배", "2년후배"];
const FILL = { DF: 2, MF: 2, FW: 1 };            // 학년마다 자동으로 만드는 선수 수
const STAR_NUMBERS = { FW: [9, 10, 11, 7], MF: [10, 8, 7, 6], DF: [4, 5, 3, 2] };
const NEED = { DF: 4, MF: 4, FW: 2 };            // 경기장에 서는 필드 선수

const randomName = () => weighted(SURNAMES) + pick(GIVEN_NAMES);
const allStarNames = () => new Set(Object.values(OPPONENT_STARS).flat().map(r => r[2]));

// 핵심 선수 정보는 저장 파일이 아니라 data에서 바로 읽음 (이름을 고치면 진행 중인 게임에도 반영)
function starOf(team, i) {
  const r = OPPONENT_STARS[team]?.[i];
  return r ? { cohort: r[0], pos: r[1], name: r[2], trait: r[3] } : null;
}

// 팀 선수단을 처음 한 번 만들고 저장 (핵심 선수가 없는 팀은 null)
function oppSquad(state, team) {
  if (!OPPONENT_STARS[team]) return null;
  state.oppSquads ||= {};
  if (state.oppSquads[team]) return state.oppSquads[team];
  const stars = OPPONENT_STARS[team].map((r, i) => ({ star: i, cohort: r[0], pos: r[1] }));
  const used = new Set([state.player.name, ...state.team.roster.map(m => m.name), ...GOALKEEPERS.map(g => g.name), ...allStarNames()]);
  for (const sq of Object.values(state.oppSquads)) for (const m of sq) if (m.name) used.add(m.name);
  const numbers = new Set();
  const list = [];
  for (const s of stars) {
    const n = STAR_NUMBERS[s.pos].find(x => !numbers.has(x)) ?? 20 + list.length;
    numbers.add(n); list.push({ ...s, number: n });
  }
  const free = shuffle(Array.from({ length: 34 }, (_, i) => i + 2).filter(n => !numbers.has(n) && n !== 1));
  for (const cohort of COHORTS) for (const [pos, k] of Object.entries(FILL)) {
    const have = stars.filter(s => s.cohort === cohort && s.pos === pos).length;
    for (let i = have; i < k; i++) {
      let name; do { name = randomName(); } while (used.has(name)); used.add(name);
      list.push({ name, cohort, pos, number: free.pop() ?? 40 + list.length });
    }
  }
  state.oppSquads[team] = list;
  return list;
}

// 지금 뛰는 선수 (학년 1~3, 1월 졸업식 뒤에는 3학년 제외)
function activeOpp(state, team) {
  const sq = oppSquad(state, team);
  if (!sq) return null;
  const g = state.calendar.grade;
  const t = (state.calendar.turn - 1) % TURNS_PER_YEAR;
  const top = t > GRAD_INDEX ? 2 : 3;
  return sq.map(m => {
    const s = m.star != null ? starOf(team, m.star) : null;
    if (m.star != null && !s) return null;
    const p = s ? { ...m, ...s, number: m.number } : { ...m };
    p.grade = mateGrade(p, g);
    return p;
  }).filter(p => p && p.grade >= 1 && p.grade <= top);
}

// 이번 경기 에이스: 지금 뛰는 핵심 선수 중 학년이 가장 높은 선수
function aceOf(state, team) {
  const act = activeOpp(state, team);
  if (!act) return null;
  const order = { FW: 0, MF: 1, DF: 2 };
  return act.filter(p => p.star != null).sort((a, b) => b.grade - a.grade || order[a.pos] - order[b.pos])[0] || null;
}

// 에이스 결장 여부: 같은 주·같은 팀이면 언제 물어봐도 같은 답 (경기 분석 메일과 경기가 어긋나지 않게)
function aceAbsent(state, team, turn = state.calendar.turn) {
  let h = 2166136261;
  state.meta ||= {}; state.meta.oppSeed ||= 1 + Math.floor(rand() * 1e9);
  for (const ch of `${team}|${turn}|${state.meta.oppSeed}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100 < 12;
}

// 경기에 나서는 필드 선수 10명. 핵심 선수 먼저, 그다음 학년 높은 순
function oppLineup(state, team, turn) {
  const act = activeOpp(state, team);
  if (!act) return null;
  const ace = aceOf(state, team);
  const out = aceAbsent(state, team, turn) && ace ? ace.name : null;
  const lineup = [];
  for (const [pos, n] of Object.entries(NEED)) {
    act.filter(p => p.pos === pos && p.name !== out).sort((a, b) => (b.star != null) - (a.star != null) || b.grade - a.grade)
      .slice(0, n).forEach(p => lineup.push({ name: p.name, number: p.number, pos, star: p.star != null, trait: p.trait || null, grade: p.grade }));
  }
  return { lineup, ace: ace && !out ? ace : null, absent: out ? ace : null };
}

// 맞대결 기록 (에이스 이름별): 경기 수, 우리에게 넣은 골, 마지막으로 만난 학년
function noteOpp(state, m) {
  if (!m.oppAce) return;
  state.oppMemo ||= {};
  const k = m.oppAce.name;
  const r = state.oppMemo[k] ||= { games: 0, goals: 0, grade: 0 };
  r.games++;
  r.goals += m.goalsLog.filter(g => g.team === "them" && g.name === k).length;
  r.grade = state.calendar.grade;
}

return { oppSquad, activeOpp, aceOf, aceAbsent, oppLineup, noteOpp };
})();
(__fix["js/engine/opponents.js"] || []).forEach(f => f());

// ── js/engine/advice.js
__m["js/engine/advice.js"] = (function () {
const {STAT_LABEL, POSITIONS} = __m["data/player.js"];
const {ACTIONS} = __m["data/actions.js"];
const {STAFF, ROSTER, CAPTAINS} = __m["data/roster.js"];
const {mail, mailFrom} = __m["js/state.js"];
const {turnInfo} = __m["js/engine/calendar.js"];
const {ovr, depthChart, teamStrength} = __m["js/engine/team.js"];
const {sortTable, US, TEAM_NAME} = __m["js/engine/season.js"];
const {getPath, pick} = __m["js/rng.js"];
const {conditionOf} = __m["js/engine/growth.js"];
const {lifeMail, afterMatchChat} = __m["js/engine/life.js"];
let eligibility; (__fix["js/engine/match.js"] ||= []).push(() => { eligibility = __m["js/engine/match.js"].eligibility; });
const {stillScheduled} = __m["js/engine/season.js"];
const {chance} = __m["js/rng.js"];
const {isBirthdayWeek} = __m["js/engine/birthday.js"];
const {chatText} = __m["js/engine/life.js"];
const {aceOf, aceAbsent} = __m["js/engine/opponents.js"];
const {ACE_TALK} = __m["data/messages.js"];
// 메시지 만들기: 경기 전 분석, 경기 후 피드백, 주간 조언.
// 모든 문장은 지금 게임 속 숫자(능력치, 순위, 피로, 학업)를 넣어 만듭니다.

















const f0 = v => Math.floor(v);
// 받침 판단. 숫자는 읽는 소리 기준 (0 십/영, 1 일, 3 삼, 6 육, 7 칠, 8 팔은 받침 있음)
const has = w => {
  const t = String(w); const ch = t[t.length - 1];
  if (/[0-9]/.test(ch)) return "013678".includes(ch);
  const c = t.charCodeAt(t.length - 1);
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
};
// 으로/로: ㄹ 받침(1, 7, 8, 일·칠·팔)은 '로'
const ro = w => { const t = String(w); const ch = t[t.length - 1]; if (/[0-9]/.test(ch)) return "036".includes(ch) ? "으로" : "로";
  const c = t.charCodeAt(t.length - 1); const j = (c - 0xAC00) % 28; return c >= 0xAC00 && c <= 0xD7A3 && j !== 0 && j !== 8 ? "으로" : "로"; };
const ida = n => `${n}${has(n) ? "이다" : "다"}`;
const pp = (w, a, b) => (has(w) ? a : b);          // 조사만
// 상대 에이스 문장: {ace} {gw} {posw} {trait} {team} {goals}를 먼저 채우고, 나머지({mate} 등)는 단톡방 규칙으로 채움
const POSW = { FW: "공격수", MF: "미드필더", DF: "수비수" };
function aceText(state, t, ace, extra = {}) {
  const v = { ace: ace.name, gw: `${ace.grade}학년`, posw: POSW[ace.pos], trait: ace.trait || "", ...extra };
  const once = t.replace(/\{(ace|gw|posw|trait|team|goals)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => { const x = String(v[k] ?? ""); return a ? x + (has(x) ? a : b) : x; });
  return chatText(state, once);
}
const josa = (w, a, b) => w + pp(w, a, b);         // 낱말 + 조사

// 그 능력치를 가장 많이 올리는 훈련
function drillFor(stat) {
  let best = null, v = 0;
  for (const a of ACTIONS) { const g = a.gains[stat] || 0; if (g > v) { v = g; best = a; } }
  return best;
}


// 상대 팀 성향 (이름으로 늘 같은 성향이 나옴)
// 팀마다 스타일은 고정 (같은 팀은 늘 같은 색깔), 조언 문장은 매번 골라 씀
const STYLES = [
  { label: "전방 압박이 강한 팀", stat: "tech.firstTouch", tips: ["공을 받기 전에 주변을 먼저 봐라. 원터치로 내주는 선택이 안전하다.", "이 팀은 첫 10분에 미친 듯이 뛴다. 그 시간만 버티면 뒤에 공간이 생긴다.", "골키퍼한테 돌리는 것도 겁내지 마라. 압박을 한 번 벗기면 그다음은 우리 차례다."] },
  { label: "롱볼과 높이로 밀어붙이는 팀", stat: "phys.jump", tips: ["공중볼 경합이 많을 거다. 세컨드볼 위치를 먼저 잡아라.", "머리싸움에서 지더라도 떨어지는 공은 우리가 먼저 줍자. 그게 이 경기의 반이다.", "키 큰 공격수 하나만 보고 차는 팀이다. 그 선수 등 뒤를 비우지 마라."] },
  { label: "빠른 역습을 노리는 팀", stat: "phys.speed", tips: ["공을 뺏기는 순간이 제일 위험하다. 무리한 드리블은 아껴라.", "우리가 공격할 때 한 명은 꼭 뒤에 남겨라. 이 팀은 세 번 패스로 골문 앞까지 온다.", "뺏기면 바로 반칙으로라도 끊어야 하는 순간이 온다. 그 판단은 네가 해라."] },
  { label: "공을 오래 돌리는 팀", stat: "phys.stamina", tips: ["많이 뛰어야 하는 경기다. 후반에 체력이 갈린다.", "공 쫓아다니다 지치면 지는 거다. 따라가지 말고 길목에 서 있어라.", "점유율은 줘도 된다. 대신 공을 뺏었을 때 한 번에 찔러라."] },
  { label: "몸싸움이 거친 팀", stat: "phys.strength", tips: ["부딪힐 때 버티는 쪽이 이긴다. 등지는 플레이를 조심해라.", "넘어져도 바로 일어나라. 아픈 척하면 이 팀은 더 세게 들어온다.", "몸으로 밀리면 공을 빨리 내줘라. 공이 사람보다 빠르다."] },
  { label: "측면 크로스가 많은 팀", stat: "mental.focus", tips: ["양쪽 날개가 빠르다. 크로스 올라오기 전에 박스 안 자리부터 잡아라.", "크로스는 막는 것보다 올라오기 전에 끊는 게 쉽다. 측면에서 한 발 먼저 붙어라.", "반대편 포스트를 비우지 마라. 이 팀 골은 대부분 거기서 나온다."] },
  { label: "수비를 내리고 버티는 팀", stat: "tech.pass", tips: ["공은 우리가 오래 잡을 거다. 서두르면 역습 맞는다. 옆으로 흔들다가 한 번에 찔러라.", "박스 앞에 열 명이 서 있을 거다. 중거리 하나가 경기를 연다.", "이런 팀은 한 골 먹으면 무너진다. 선제골이 전부다."] },
  { label: "에이스 한 명이 끌고 가는 팀", stat: "tech.defense", tips: ["10번 하나만 묶으면 반은 끝난다. 그 선수가 공 잡으면 두 명이 붙어라.", "그 에이스가 왼발잡이다. 오른쪽으로 몰아라.", "에이스 쪽 측면은 내버려 두지 마라. 거기로만 공이 간다."] },
];
function styleOf(name) {
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return STYLES[h % STYLES.length];
}
// 원정 길 (리그 팀 이름의 지역으로)
const TRAVEL = {
  목포: "목포까지 버스로 한 시간 반. 버스에서 자 두고, 내리면 바로 몸부터 풀자.",
  광양: "광양은 바닷바람이 세다. 긴 패스는 바람 보고 차라.",
  광주: "광주는 인조잔디다. 공이 생각보다 빨리 구른다. 첫 터치 조심.",
  순천: "순천은 가까워서 부모님들 많이 오신다. 긴장하지 말고 평소대로.",
  장흥: "장흥 운동장은 좁다. 측면이 금방 막히니 가운데로 빨리 빼라.",
  해남: "해남까지는 멀다. 아침 거르지 말고, 버스에서 간식 챙겨 먹어라.",
  영광: "영광 운동장은 잔디가 길다. 땅볼 패스가 느려지니 조금 세게.",
  여수: "여수 원정은 늘 바람이 문제다. 전반엔 바람을 등지고 뛸지 모르니 그때 몰아쳐라.",
};
const pickOr = (arr, p = 1) => (chance(p) ? pick(arr) : null);

function strengthWord(diff) {
  if (diff > 5) return "전력은 우리보다 확실히 한 수 위다";
  if (diff > 2) return "전력은 우리보다 조금 앞선다";
  if (diff > -2) return "전력은 비슷하다";
  if (diff > -5) return "전력은 해 볼 만하다";
  return "전력은 우리가 앞선다";
}

// ── 경기 전 분석 (코치) ─────────────
// 숫자를 늘어놓기보다, 코치가 옆에서 툭 건네는 말처럼 씁니다.
const levelWord = v => v < 45 ? "low" : v > 65 ? "high" : "mid";
function previewMail(state, fx) {
  const info = turnInfo(state);
  const p = state.player;
  const style = styleOf(fx.opponent.name);
  const d = depthChart(state);
  const lines = [];
  const opener = pickOr(["이번 주 상대 정리해서 보낸다.", "영상 몇 경기 돌려 봤다. 요점만 적는다.", "이번 경기 준비. 읽고 훈련 들어와라.", "상대 분석이다. 길게 안 쓴다."], 0.6);
  lines.push(`${opener ? opener + " " : ""}${info.month}월 ${info.week}주 ${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}, 상대는 ${fx.opponent.name}.`);
  // 지난번 맞대결
  const lastVs = state.record.matches.slice().reverse().find(x => x.opponent === fx.opponent.name);
  if (lastVs && fx.comp !== "hs") lines.push(lastVs.result === "승" ? pick([`지난번엔 ${lastVs.gf}:${lastVs.ga}로 이겼다. 저쪽도 그걸 기억하고 나온다.`, `지난 맞대결은 우리가 이겼다. 그래서 더 조심해야 한다. 갚으러 오는 팀이 제일 무섭다.`])
    : lastVs.result === "패" ? pick([`지난번엔 ${lastVs.gf}:${lastVs.ga}로 졌다. 이번엔 갚아 줘야지.`, `지난 맞대결에서 졌던 거, 다들 기억하지? 같은 실수는 두 번 안 한다.`])
    : pick([`지난번엔 ${lastVs.gf}:${lastVs.ga}로 비겼다. 이번엔 결판내자.`, "지난번엔 승부를 못 냈다. 이번엔 한 골 차라도 이기자."]));

  if (fx.comp === "hs") {
    const s = fx.school;
    const tierWord = { footballHS: "축구부가 탄탄한 학교", regional: "이 지역에서 손꼽히는 학교", national: "전국대회 단골인 학교", proYouth: "프로 구단 유스팀" }[s.tier];
    lines.push(`${josa(s.name, "은", "는")} ${ida(tierWord)}. ${s.coach}님께서 직접 보러 오신다는구나.`);
    const small = p.body.height < 170 || p.stats.phys.strength < 55;
    lines.push(small ? "고등학생들은 한 뼘은 더 크고 단단하다. 정면으로 부딪히기보다 한 박자 먼저 움직여라."
      : "몸으로 밀릴 정도는 아니다. 오히려 형들한테 네 몸을 보여 줄 기회다.");
    lines.push("이런 경기 하나가 진로를 바꾸기도 한다. 이기는 것보다, 네가 어떤 선수인지 보여 주고 와라.");
  } else {
    const ourStr = teamStrength(state, true) * 0.6 + 50 * 0.4;
    const diff = fx.opponent.strength - ourStr;
    const diffLine = diff > 5 ? pick(["솔직히 쉽지 않은 상대다. 버티는 시간이 길 거다.", "한 수 위인 팀이다. 대신 이런 팀한테 이기면 그게 오래 간다.", "전력만 보면 우리가 밀린다. 그래서 더 재미있는 경기다."])
      : diff > 2 ? pick(["만만치 않다. 집중력 싸움이 될 거다.", "조금 앞서는 팀이다. 실점만 늦추면 기회는 온다.", "비슷해 보여도 경험이 많은 팀이다. 흔들리지 마라."])
      : diff > -2 ? pick(["해 볼 만한 상대다. 먼저 실수하는 쪽이 진다.", "딱 우리만 한 팀이다. 누가 더 많이 뛰느냐다.", "50 대 50이다. 세트피스 하나가 갈라 놓을 거다."])
      : pick(["우리가 할 것만 하면 된다. 그래도 방심하는 순간 뒤집힌다.", "전력은 우리가 앞선다. 이런 경기를 쉽게 이겨야 강팀이다.", "이겨야 본전인 경기다. 일찍 골 넣고 편하게 가자."]);
    lines.push(`${style.label}이다. ${diffLine}`);
    // 상대 에이스
    const ace = aceOf(state, fx.opponent.name);
    if (ace) {
      const team = fx.opponent.name;
      if (aceAbsent(state, team, info.turn)) lines.push(aceText(state, pick(ACE_TALK.absent), ace, { team }));
      else {
        const memo = state.oppMemo?.[ace.name];
        const parts = [aceText(state, pick(ACE_TALK.intro), ace, { team }), aceText(state, pick(ACE_TALK.trait), ace)];
        if (memo?.goals >= 1) parts.push(aceText(state, pick(ACE_TALK.scoredBefore), ace, { goals: memo.goals }));
        else if (memo?.games && memo.grade < state.calendar.grade) parts.push(aceText(state, pick(ACE_TALK.metLastYear), ace));
        const mu = ACE_TALK.matchup[`${p.position}-${ace.pos}`];
        if (mu?.length) parts.push(aceText(state, pick(mu), ace));
        lines.push(parts.join(" "));
        // 경기 전 단톡방 (복수전이면 꼭, 아니면 가끔)
        if (memo?.goals >= 1 || chance(0.3)) mail(state, "group", `이번 주 상대: ${team}`, aceText(state, pick(memo?.goals >= 1 ? ACE_TALK.chatRevenge : ACE_TALK.chatBefore), ace, { team }));
      }
    }
    if (state.league && fx.comp === "league" && state.league.played > 0) {
      const rows = sortTable(state.league.table);
      const them = rows.findIndex(r => r.id === fx.opponent.id);
      const us = rows.findIndex(r => r.id === US);
      lines.push(them < us && diff <= -2 ? pick(["순위는 저쪽이 위지만, 전력으로는 밀리지 않는다. 여기서 잡으면 판이 달라진다.", "순위표에선 우리보다 위에 있다. 그래도 붙어 보면 우리가 낫다. 증명하고 와라."])
        : them < us ? pick(["순위표에서 우리보다 위에 있는 팀이다. 여기서 잡으면 판이 달라진다.", "우리 위에 있는 팀이다. 승점 3점이 아니라 6점짜리 경기라고 생각해라."])
        : them < 3 ? pick(["요즘 기세가 좋은 팀이다.", "최근에 지는 법을 잊은 팀이다. 그 흐름을 우리가 끊자."])
        : pick(["순위는 아래지만, 그런 팀이 제일 독하게 나온다.", "순위표만 보고 들어가면 큰코다친다. 아래 있는 팀일수록 물고 늘어진다."]));
    }
    const lv = levelWord(getPath(p.stats, style.stat));
    const st = STAT_LABEL[style.stat];
    const isTech = String(style.stat).startsWith("tech.");
    const stLine = lv === "low" ? pick([`네 ${josa(st, "은", "는")} 아직 ${isTech ? "몸에 덜 붙었으니" : "모자라니"} 무리하지 말고.`, `${josa(st, "은", "는")} 아직 네 약점이다. 오늘은 숨기고, 잘하는 걸로 승부해라.`])
      : lv === "high" ? pick([`이런 경기에선 네 ${josa(st, "이", "가")} 오히려 무기가 된다.`, `네 ${josa(st, "이", "가")} 이 팀한테는 제일 귀찮을 거다. 마음껏 써라.`])
      : pick([`네 ${josa(st, "이", "가")} 얼마나 버텨 주느냐가 관건이다.`, `${josa(st, "은", "는")} 딱 중간이다. 오늘 경기가 그걸 끌어올릴 기회다.`]);
    const aceNow = aceOf(state, fx.opponent.name);
    let tips = style.tips;
    if (aceNow && !aceAbsent(state, fx.opponent.name, info.turn)) tips = tips.filter(x => !x.includes("왼발잡이")).map(x => x.replace("10번 하나만", `${aceNow.number}번 ${aceNow.name} 하나만`));
    lines.push(`${pick(tips)} ${stLine}`);
    const city = Object.keys(TRAVEL).find(c => fx.opponent.name.startsWith(c));
    if (city && fx.comp === "league" && chance(0.4)) lines.push(TRAVEL[city]);
    if (fx.ko) lines.push(pick(["토너먼트다. 지면 그대로 짐 싸서 고흥 내려간다.", "오늘 지면 숙소 짐부터 싸야 한다. 그 생각만 해도 다리가 움직일 거다.", "토너먼트에서 다음은 없다. 70분 동안 후회 남기지 마라."]));
  }

  const elig = eligibility(state, fx);
  if (!elig.ok) {                                      // 다쳤거나 성적 때문에 못 뛰는 주에는 그 이야기만
    lines.push(p.condition.injury ? "이번 주는 재활이 먼저다. 벤치 옆에서 경기 흐름이라도 읽어 둬라."
      : "그리고… 성적 때문에 이번엔 명단에 너를 못 넣는다. 감독님도 아쉬워하신다. 책상 앞에서 먼저 이기고 와라.");
  } else {
    lines.push(d.rank <= d.slots ? pick(["감독님은 이번 주도 네 이름을 먼저 적어 두실 것 같다. 기대에 답해라.", "선발 명단에 네 이름 있을 거다. 그 자리, 당연한 거 아니다.", "이번 주도 처음부터 뛴다고 보고 준비해라. 몸 상태 숨기지 말고."])
      : d.rank <= d.slots + 2 ? pick(["벤치에서 시작할 수도 있다. 그래도 기회는 언제 올지 모른다. 준비하고 있어라.", "선발은 장담 못 한다. 대신 들어가는 순간 바로 뛸 수 있게 몸은 데워 둬라.", "주전이랑 차이가 거의 없다. 이번 주 훈련이 명단을 바꿀 수도 있다."])
      : pick(["아직은 앞에 선 선수들이 많다. 이번 주 훈련에서 감독님 눈에 띄는 게 먼저다.", "이번 주는 명단이 어렵다. 대신 훈련장에서 감독님 눈을 붙잡아라.", "지금은 순서가 뒤다. 순서는 훈련장에서 바뀐다."]));
    const c = conditionOf(p);
    if (c.score < 50) lines.push(`그리고 요즘 몸이 많이 무거워 보인다. 이대로면 가진 것의 반도 못 보여 준다.${p.condition.fatigue >= 85 ? " 감독님도 너를 선발로 쓰기 부담스러워하신다." : ""} 주중에 하루는 푹 쉬어라.`);
    else if (c.score >= 85) lines.push(pick(["몸 상태는 지금이 제일 좋다. 이럴 때 보여 줘야 한다.", "요즘 몸이 가볍다는 거 다 보인다. 그 다리로 이번 경기 뛰어라."]));
    const close = pickOr(["질문 있으면 훈련 끝나고 와라.", "물 많이 마시고, 경기 전날은 일찍 자라.", "나머지는 경기장에서 말하자.", "축구화 끈 새로 갈아 둬라. 그런 게 경기 날 마음을 편하게 한다."], 0.45);
    if (close) lines.push(close);
  }

  mail(state, "assist", `[경기 분석] vs ${fx.opponent.name}`, lines.join("\n\n"));
}

// ── 경기 후: 단톡방 결과 + 감독님 피드백 ─
function matchMails(state, m, res, notes) {
  const p = state.player, fx = m.fx;
  const scorers = side => m.goalsLog.filter(g => g.team === side).map(g => `${g.name} ${g.minute}'${g.assist ? ` (도움 ${g.assist})` : ""}`).join(", ");
  const body = [];
  body.push(afterMatchChat(state, res, fx, res.grade === 3 && noFixtureLeft(state)));
  const aceGoals = m.oppAce ? m.goalsLog.filter(g => g.team === "them" && g.name === m.oppAce.name).length : 0;
  if (m.oppAce && aceGoals >= 1 && res.result !== "승" && chance(0.7)) body.push(aceText(state, pick(ACE_TALK.chatAfterScored), m.oppAce));
  else if (m.oppAce && aceGoals === 0 && res.ga <= 1 && chance(0.45)) body.push(aceText(state, pick(ACE_TALK.chatAfterHeld), m.oppAce));
  const bdayGoal = res.goals > 0 && isBirthdayWeek(state, turnInfo(state));
  if (bdayGoal) body.push(chatText(state, pick(["{friend}: 생일골 ㅋㅋㅋ 이거 평생 우려먹겠네", "{mate}: 생일에 골 넣는 거 실화냐\n\n{friend}: 케이크 두 개 사야 됨"])));
  if (res.gf) body.push(`⚽ 득점: ${scorers("us")}`);
  if (res.ga) body.push(`실점: ${scorers("them")}`);
  body.push(`점유율 ${m.stats.poss}%, 슈팅 ${m.stats.us.shots} 대 ${m.stats.them.shots}`);
  if (state.league && fx.comp === "league") {
    const rows = sortTable(state.league.table);
    const us = rows.findIndex(r => r.id === US);
    body.push(`📊 리그 ${us + 1}위 (승점 ${rows[us].pts}, ${state.league.played}/${state.league.rounds.length}라운드)`);
  }
  for (const n of notes) if (typeof n === "string") body.push(n);
  const nxt = nextFixtureText(state);
  if (nxt) body.push(`다음 경기: ${nxt}`);
  body.push(`${STAFF.assistant}: ${res.result === "패" ? pick(["월요일엔 영상 보면서 실점 장면 짚고 간다.", "오늘 진 거 오늘까지만 생각해라. 월요일에 다시 시작한다.", "고개 숙이고 집에 가지 마라. 월요일에 영상 보자."])
    : res.result === "승" ? pick(["월요일은 회복 훈련. 무리하지 마라.", "오늘 잘했다. 월요일엔 가볍게 몸만 푼다.", "이긴 날일수록 일찍 자라. 월요일 회복 훈련 빠지지 말고."])
    : pick(["월요일은 회복 훈련. 무리하지 마라.", "비긴 경기는 아쉬움이 오래 간다. 월요일에 털고 가자.", "승점 1점도 소중하다. 월요일은 가볍게 간다."])}`);
  mail(state, "group", `${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}: ${TEAM_NAME} ${res.gf} : ${res.ga} ${fx.opponent.name}${res.shootout ? ` (승부차기 ${res.shootout.us}:${res.shootout.them})` : ""}`, body.join("\n\n"));

  for (const n of notes) if (typeof n === "object") mailFrom(state, n.from, "scout", n.title, n.body);

  // 감독님 개인 피드백: 숫자 대신 장면과 느낌으로
  const fb = [];
  if (res.minutes > 0) {
    const r = res.rating;
    const band = r >= 8.3 ? 0 : r >= 7.4 ? 1 : r >= 6.6 ? 2 : r >= 6 ? 3 : 4;
    const FEEDBACK = [
      ["오늘은 네 경기였다. 집에 가서 부모님께 자랑해도 된다.", "오늘 같은 날이 쌓이면 그게 실력이 된다. 잘했다.", "상대 감독이 경기 끝나고 네 이름을 물어보더라. 그 정도였다.",
        "오늘은 내가 따로 할 말이 별로 없다. 그게 칭찬이다.", "벤치에서 보는데 나도 모르게 일어나 있더라. 오늘 너 때문이다.", "오늘 경기 영상은 1학년들한테 보여 줄 거다. 교재로."],
      ["오늘 좋았다. 네가 있어서 팀이 편했다.", "오늘 움직임 좋았다. 공 없을 때 뛰는 게 보이더라.", "실수가 적었다. 그게 제일 어려운 거다.",
        "오늘은 믿고 볼 수 있었다. 감독한테 그것만큼 고마운 게 없다.", "자기 자리 지키면서 한 발씩 더 뛰었다. 그게 주전이다.", "오늘 같은 경기를 다섯 번만 더 하면 너를 빼는 게 어려워진다."],
      ["제 몫은 했다. 그런데 너는 그 이상을 할 수 있는 선수다.", "나쁘지 않았다. 다만 결정적인 순간에 한 번 더 용기를 내 봐라.", "무난했다. 다음엔 네가 경기를 바꾸는 장면을 하나 보여 줘라.",
        "점수로 치면 70점이다. 나머지 30점은 네가 겁낸 장면들에 있다.", "실수는 없었는데 기억나는 장면도 없다. 다음엔 하나만 남겨라.", "오늘은 팀에 맞췄다. 다음엔 팀이 너한테 맞추게 해 봐라."],
      ["오늘은 좀 조용했다. 공이 오길 기다리기만 하면 안 된다.", "공을 기다리지 말고 받으러 가라. 오늘은 그게 아쉬웠다.", "경기에 늦게 들어온 느낌이다. 첫 10분에 한 번은 공을 만져라.",
        "몸은 경기장에 있었는데 머리는 다른 데 있더라. 무슨 일 있으면 말해라.", "오늘은 네가 보이지 않았다. 다음엔 실수해도 좋으니 보이게 뛰어라.", "훈련 때 하던 게 하나도 안 나왔다. 긴장했으면 그것도 연습이다."],
      ["스스로도 알 거다. 오늘 밤은 너무 오래 곱씹지는 마라.", "이런 경기도 있다. 다음 주에 어떻게 하는지가 더 중요하다.", "오늘 일은 내가 기억할 테니, 너는 잊고 다음 경기 준비해라.",
        "다 큰 선수들도 이런 날 있다. 다만 같은 날이 두 번 연속 오면 그건 실력이다.", "화나는 거 안다. 그 화를 월요일 훈련에 써라.", "오늘 경기로 너를 판단하지 않는다. 대신 다음 경기로 판단할 거다."],
    ];
    // 결과에 맞춘 첫마디 (가끔)
    const open = res.result === "승" ? pickOr(["이긴 날은 다 좋아 보인다. 그래도 네 경기는 따로 보자.", "팀은 이겼다. 너는 어땠는지 보자."], 0.35)
      : res.result === "패" ? pickOr(["졌다. 팀 얘기는 내일 하고, 오늘은 네 얘기만 하자.", "결과는 내 책임이다. 너는 네 장면만 돌아봐라."], 0.35)
      : pickOr(["비긴 경기는 늘 아쉽다. 네 장면부터 보자."], 0.3);
    if (open) fb.push(open);
    fb.push(pick(FEEDBACK[band]));
    const firstGoal = res.goals > 0 && state.record.matches.slice(0, -1).every(x => !x.goals);
    if (res.goals > 0 && isBirthdayWeek(state, turnInfo(state))) fb.unshift("생일 주간에 골이라니. 이번 주 케이크는 네가 제일 큰 조각 먹어라.");
    if (res.goals >= 3) fb.unshift("세 골. 공에 날짜 적어서 가져가라. 그리고 내일은 다시 빈손으로 와라.");
    else if (firstGoal) fb.unshift("첫 골이구나. 오늘 밤은 마음껏 기뻐해라. 내일부터는 두 번째 골 준비다.");
    if (m.comeback) fb.push("복귀전 치고는 충분했다. 이번 주는 다리 상태부터 보고 훈련 강도 정하자.");
    if (res.injury) fb.unshift("몸은 좀 어떠냐. 경기 생각은 나중에 해라. 치료부터 제대로 받자.");
    if (m.my.log.some(x => x.out === "card")) fb.push(pick(["경고는 꼭 필요할 때만 받는 거다. 오늘 그 파울, 정말 필요했는지 생각해 봐라.", "카드 하나 받으면 그 뒤로는 태클을 못 한다. 영리하게 끊는 법을 배우자."]));
    const log = m.my.log;
    if (log.length) {
      const okN = log.filter(x => x.ok).length;
      if (okN === log.length && log.length >= 3) fb.push(pick(["공을 잡을 때마다 뭔가 됐다. 그 감각, 잊지 마라.", "오늘은 고르는 것마다 맞았다. 판단이 빨라졌다는 뜻이다.", "네 선택에 동료들이 맞춰 움직이더라. 그게 좋은 선수다."]));
      else if (okN <= log.length / 3) fb.push(pick(["몇 번은 번뜩였는데, 중요한 순간마다 한 템포씩 늦었다.", "공을 잡고 나서 생각하니까 늦는 거다. 받기 전에 정해 둬라.", "오늘은 손에 잡힐 듯한 장면들이 다 미끄러졌다. 그런 날도 있다. 같은 실수만 반복하지 마라."]));
      const fails = log.filter(x => !x.ok);
      const byStat = {};
      for (const f of fails) (byStat[f.stat] ||= []).push(f);
      const worst = Object.entries(byStat).sort((a, b) => b[1].length - a[1].length)[0];
      if (worst) {
        const [stat, list] = worst;
        const drill = drillFor(stat);
        fb.push(`"${list[0].label}" 같은 장면에서 자꾸 막히더라. ${josa(STAT_LABEL[stat], "이", "가")} 아직 ${String(stat).startsWith("tech.") ? "몸에 덜 붙었다" : "모자라다"}.${drill ? ` 이번 주엔 ${josa(drill.label, "을", "를")} 조금 더 해 보자.` : ""}`);
      }
      const brave = log.find(x => x.ok && x.level === "낮음");
      if (brave) fb.push(pick([`${brave.minute}분에 "${brave.label}", 그거 아무나 하는 선택 아니다. 그런 배짱은 좋다. 다만 매번 통하진 않는다는 것도 알고.`,
        `${brave.minute}분 장면, 다들 안 될 거라고 봤을 거다. 그걸 해냈다. 그 배짱은 오래 가져가라.`]));
      const safe = log.filter(x => x.level === "높음").length;
      if (log.length >= 4 && safe === log.length && res.goals + res.assists === 0 && r < 7.4) fb.push(pick(["실수는 없었다. 그런데 상대가 무서워할 장면도 없었다. 가끔은 승부를 걸어 봐라.", "안전하게만 갔다. 그것도 실력이지만, 경기를 바꾸는 건 결국 한 번의 모험이다."]));
      const sig = log.find(x => x.ok && x.signature);
      if (sig) fb.push(pick([`"${sig.label}" 그거 연습 많이 했구나. 관중석이 다 일어나더라.`, `"${sig.label}", 경기에서 그걸 꺼낼 줄은 몰랐다. 다만 안 통하면 그게 독이 된다. 쓸 때를 골라라.`]));
    }
    if (res.involved >= 3) fb.push(m.star >= 1 ? pick(["상대가 너만 따라다니는데도 계속 공에 관여하더라. 이제 다들 너를 안다.", "두 명이 붙어도 공을 지키더라. 이제 상대 감독들이 너부터 막으라고 할 거다."])
      : pick(["공이 너를 거쳐 가는 일이 많아졌다. 팀이 너를 찾기 시작했다는 뜻이다.", "동료들이 공 잡으면 너부터 보더라. 믿음은 그렇게 쌓이는 거다."]));
    if (res.stops >= 2) fb.push(pick(["뒤에서 몇 번이나 끊어 줬다. 그런 건 기록에 안 남아도 감독은 다 본다.", "궂은일 많이 했다. 골 넣은 애들보다 네 이름을 먼저 부르고 싶다.",
      ...(res.ga === 0 ? ["오늘 실점 안 한 건 네가 몇 번 막아 준 덕이 크다."] : [])]));
    if (m.oppAce) {
      const guard = (p.position === "DF" && ["FW", "MF"].includes(m.oppAce.pos)) || (p.position === "MF" && ["MF", "FW"].includes(m.oppAce.pos));
      if (aceGoals >= 2 && ["DF", "MF"].includes(p.position)) fb.push(aceText(state, pick(ACE_TALK.coachScored), m.oppAce, { goals: aceGoals }));
      else if (aceGoals === 0 && guard && res.minutes >= 45 && res.result !== "패") fb.push(aceText(state, pick(res.result === "승" ? ACE_TALK.coachHeldWin : ACE_TALK.coachHeldDraw), m.oppAce));
    }
    const cnow = conditionOf(p);
    if (cnow.score < 50) fb.push("경기 내내 다리가 무거워 보였다. 쉬는 것도 훈련이다.");
    if (m.goalsLog.some(g => g.myFault)) fb.push("실점 장면, 너도 마음에 걸릴 거다. 내일 영상으로 같이 보자.");
    if (fx.comp === "hs" && m.physGap > 0.04) fb.push("고등학생 몸싸움에 자꾸 밀리더라. 웨이트는 하루아침에 안 된다. 꾸준히 해라.");
    if (res.mom) fb.push(pick(["오늘 최우수 선수는 너다. 그래도 들뜨지 마라. 내일 훈련은 똑같다.", "오늘 최우수 선수. 상은 오늘까지만 기뻐하고, 내일은 다시 처음부터다."]));
    if (fx.elementary && res.result !== "승") fb.push("초등학생 팀한테 이 결과는 말이 안 된다. 방심했지? 다음 주 훈련에서 다시 보자.");
    if (fx.elementary && res.result === "승" && r >= 7) fb.push("동생들 앞에서 제대로 보여 줬다. 너를 보고 축구 시작하는 애가 생길지도 모른다.");
  } else if (res.status === "bench" || res.status === "out") {
    if (res.reason?.includes("학업")) fb.push("성적 때문에 못 데려갔다. 나도 아쉽다. 공부도 훈련이다. 책상 앞에서 먼저 이기고 와라.");
    else if (res.reason?.includes("부상")) {
      state.advice ||= {};
      if (state.advice.injMeet == null || state.calendar.turn - state.advice.injMeet > 4) {   // 다쳐서 빠질 때마다 같은 말을 반복하지 않게
        state.advice.injMeet = state.calendar.turn;
        fb.push("다친 건 어쩔 수 없다. 조급해하지 말고 재활 제대로 하고 돌아와라. 자리는 기다려 준다.");
      }
    }
    else {
      const d = depthChart(state);
      const gap = d.list[d.slots - 1] ? d.list[d.slots - 1].ovr - ovr(p) : 0;
      fb.push(res.status === "bench" ? pick(["끝까지 못 넣어 줘서 미안하다. 벤치에서 본 것도 다 공부다.", "오늘은 못 넣었다. 대신 벤치에서 본 걸 다음 주 훈련에서 보여 줘라."])
        : pick(["이번엔 명단에서 뺐다. 서운하겠지.", "이번 주도 명단엔 못 넣었다. 대신 훈련장에선 계속 보고 있다.", "명단에 없다고 팀이 아닌 건 아니다. 다음 주 훈련에서 보여 줘라."]));
      fb.push(gap > 8 ? "앞에 선 선수들과는 아직 거리가 좀 있다. 하루아침에 좁혀지진 않는다. 대신 매일 조금씩은 좁혀진다."
        : gap > 3 ? "앞에 있는 선수들이 아직 한 걸음 앞서 있다. 그 한 걸음, 훈련장에서 좁혀 와라."
        : "솔직히 거의 다 왔다. 다음엔 네 이름을 먼저 적을지도 모른다.");
      if (state.relations.coach < 45) fb.push("그리고 단체훈련 때 좀 더 얼굴을 보여라. 나는 거기서 선수를 본다.");
    }
  }
  // 우승·준우승, 중학교 마지막 경기
  if (notes.some(n => typeof n === "string" && /우승!/.test(n))) fb.push("우승했다고 끝은 아니다. 그래도 오늘은 다 같이 웃어라. 3월의 너희랑 지금은 다른 팀이다.");
  if (fx.round === "결승" && res.result !== "승" && !(res.shootout?.win)) fb.push("결승까지 온 것도 실력이다. 은메달 걸고 다녀도 된다. 다음엔 그 한 골을 우리가 넣자.");
  const lastOfAll = res.grade === 3 && noFixtureLeft(state);
  if (lastOfAll) fb.push("중학교에서 뛰는 마지막 경기였다. 3년 동안 고흥FC 유니폼 입어 줘서 고맙다.");
  if (fb.length) mail(state, "coach", `경기 후 면담: vs ${fx.opponent.name}`, fb.join("\n\n"));
  if (res.goals > 0 && res.minutes > 0 && state.record.matches.slice(0, -1).every(x => !x.goals))
    mail(state, "mom", "첫 골 축하해!", "아빠가 단톡방 보고 거실에서 소리를 질렀어. 오늘 저녁은 네가 먹고 싶은 걸로 하자.");
  if (res.status === "start" && state.record.starts === 1)
    mail(state, "dad", "첫 선발", "이름이 선발 명단 맨 위에 있더라. 아빠는 그 사진만 열 번 봤다.");
  // 코치님의 짧은 전술 메모 (가끔, 포지션과 오늘 경기에 맞춰)
  if (res.minutes > 0 && chance(0.45)) {
    const tips = {
      FW: ["수비 뒷공간 노릴 때 한 번 내려왔다가 뛰어라. 그냥 서 있으면 오프사이드 라인에 걸린다.", "슈팅은 골키퍼 보고 차는 거다. 골대 보고 차면 골키퍼 정면으로 간다.", "크로스 들어올 때 니어포스트로 한 번 끊어 들어가라. 수비가 너를 놓친다.",
        "공 없을 때 수비수 등 뒤에 숨어 있다가 튀어나와라. 수비는 안 보이는 선수를 제일 무서워한다.", "슈팅 전에 고개를 한 번만 들어라. 두 번 들면 늦는다.", "골 못 넣은 날도 수비 한 번 더 해 주면 감독님은 그걸 기억하신다."],
      MF: ["공 받기 전에 어깨 너머로 두 번 봐라. 등지고 받으면 뺏기기 쉽다.", "패스하고 멈추지 마라. 주고 바로 움직여야 다시 받는다.", "압박 들어오면 원터치로 빼라. 끌면 끌수록 위험해진다.",
        "몸을 반쯤 열고 받아라. 그래야 앞도 뒤도 다 보인다.", "공격할 때 박스 안까지 한 번은 들어가라. 미드필더 골이 경기를 바꾼다.", "패스 길이 안 보이면 공을 쥐고 기다려도 된다. 동료가 길을 만들어 준다."],
      DF: ["라인 올릴 때 소리를 더 크게 내라. 수비는 입으로도 하는 거다.", "태클은 마지막 수단이다. 늦추고, 따라가고, 그다음에 발을 내밀어라.", "공 잡으면 첫 패스를 앞으로 줄 수 있는지부터 봐라. 옆으로만 돌리면 상대가 편해진다.",
        "공을 보지 말고 상대 골반을 봐라. 공은 속여도 골반은 못 속인다.", "크로스 막을 때 몸을 공 쪽으로 반만 돌려라. 다 돌리면 뒤로 누가 뛰는지 못 본다.", "실점은 수비 한 명 잘못이 아니다. 그러니 다음 공에서는 고개 들고 소리부터 내라."],
    }[p.position] || [];
    const pre = res.result === "승" ? "이긴 경기라도 복기는 한다. " : res.result === "패" ? "진 경기는 오늘 밤 한 번만 떠올리고, 이것만 기억해 둬라. " : "";
    if (tips.length) mail(state, "assist", "영상 보고 하나만", pre + pick(tips));
  }
}

// 졸업 전까지 남은 경기가 하나도 없는지 (3학년 마지막 경기 판정용)
function noFixtureLeft(state) {
  for (let i = 1; i < 60; i++) {
    const info = turnInfo(state, i);
    if (!info) return true;
    if (info.match && stillScheduled(state, info)) return false;
  }
  return true;
}

function nextFixtureText(state) {
  for (let i = 1; i < 8; i++) {
    const info = turnInfo(state, i);
    if (!info) return null;
    if (info.match && stillScheduled(state, info)) return `${info.month}월 ${info.week}주 ${info.comp.label}${info.match.round ? ` ${info.match.round}` : ""}`;
  }
  return null;
}

// ── 주간 조언 (주 끝에 최대 두 개) ──
function weeklyAdvice(state, rep) {
  const p = state.player;
  const out = [];
  state.advice ||= {};
  const push = (key, cd, fn) => {
    if (out.length >= 2) return;
    const last = state.advice[key];
    if (last != null && state.calendar.turn - last < cd) return;
    if (fn()) { state.advice[key] = state.calendar.turn; out.push(key); }
  };
  const s = p.stats.student;
  const hist = state.history || [];

  // 시험 예고
  const soon = [1, 2].map(i => turnInfo(state, i - 1)).find(x => x?.exam && !x.exam.free);
  push("exam", 3, () => {
    if (!soon) return false;
    const v = s.academic;
    const tier = v >= 85 ? "상위권" : v >= 70 ? "중상위권" : v >= 55 ? "중위권" : v >= 40 ? "중하위권" : "하위권";
    mail(state, "teacher", `${soon.exam.name} 안내`,
      `${soon.month}월 ${soon.week}주에 ${soon.exam.name}이 있어.\n\n지금 수업 태도랑 과제로 보면, 이대로는 ${tier} 정도가 아닐까 싶어.\n\n시험 주에 하루라도 책을 펴면 결과가 꽤 달라져. 운동부라고 봐주는 거 없다는 거 알지?${state.flags.academicLevel > 0 ? "\n\n감독님도 이번 시험 결과를 보신대." : ""}`);
    return true;
  });

  // 피로
  push("fatigue", 4, () => {
    if (p.condition.fatigue < 70) return false;
    mail(state, "mom", "요즘 너무 지쳐 보여",
      `집에 오자마자 씻지도 않고 잠들더라.\n\n코치님 말씀이 이렇게 지친 채로 훈련하면 효과도 반쯤 날아가고, 다치기도 쉽대.\n\n이번 주엔 하루라도 일찍 자. 엄마가 맛있는 거 해 줄게.`);
    return true;
  });

  // 사기
  push("morale", 5, () => {
    if (p.condition.morale >= 35) return false;
    mail(state, "mom", "괜찮니?",
      `요즘 말수가 줄었네. 경기 못 뛰어서 그러니?\n\n마음이 가라앉으면 훈련도 잘 안 된대. 이번 주엔 아빠랑 셋이 외식하든지, 친구들이랑 바람 좀 쐬고 와. 그래도 괜찮아.`);
    return true;
  });

  // 감독 신뢰
  push("trust", 6, () => {
    if (state.relations.coach >= 35) return false;
    const teamCnt = hist.slice(-4).flatMap(h => h.acts).filter(a => ACTIONS.find(x => x.id === a)?.cat === "team").length;
    mail(state, "assist", "감독님 눈치 좀 봐라",
      `요즘 감독님이 네 얘기를 잘 안 하신다.\n\n${teamCnt <= 1 ? "단체훈련에서 네 얼굴을 본 지가 꽤 됐다는 말씀을 하시더라." : "훈련 태도 얘기가 한 번 나왔다."} 감독님은 단체훈련에서 선수를 보신다. 같은 실력이면 믿을 만한 쪽을 내보내는 게 감독이다.`);
    return true;
  });

  // 성장 급등
  push("growth", 10, () => {
    if (!rep.body || rep.body.cm < 3.5) return false;
    mail(state, "mom", (p.body.history?.length ?? 0) > 2 ? "바지가 또 짧아졌네" : "바지가 짧아졌네",
      `이번 측정에서 ${rep.body.cm}cm나 컸다며? 지금 ${p.body.height.toFixed(1)}cm.\n\n키 클 때는 무릎이나 뒤꿈치가 아플 수 있대. 아프면 참지 말고 바로 말해. 우유는 냉장고에 있다.`);
    return true;
  });

  // 학업 하락
  push("academic", 6, () => {
    if (hist.length < 6 || s.academic >= 48 || turnInfo(state)?.vacation) return false;   // 방학에는 담임 선생님 학교 이야기 없음
    const schoolCnt = hist.slice(-6).flatMap(h => h.acts).filter(a => ACTIONS.find(x => x.id === a)?.cat === "school").length;
    mail(state, "teacher", "요즘 수업 시간에",
      `피곤한 건 알지만 수업 시간에 자주 졸더라.\n\n${schoolCnt <= 1 ? "요즘 학교 공부엔 거의 손을 안 댄 것 같더라. " : ""}이대로 가면 감독님께 연락을 드려야 할 것 같아. 그러면 대회에 못 나갈 수도 있어.\n\n일주일에 하루만이라도 책을 펴 보자. 생각보다 금방 올라.`);
    return true;
  });

  // 6주마다 훈련 점검 (코치)
  push("review", 6, () => {
    if (hist.length < 6) return false;
    const recent = hist.slice(-6).flatMap(h => h.acts);
    const cnt = { personal: 0, team: 0, school: 0, rest: 0 };
    for (const a of recent) { const c = ACTIONS.find(x => x.id === a)?.cat; if (c) cnt[c]++; }
    const keys = Object.keys(POSITIONS[p.position].weights);
    const weak = keys.slice().sort((a, b) => getPath(p.stats, a) - getPath(p.stats, b))[0];
    const drill = drillFor(weak);
    const used = drill ? recent.filter(a => a === drill.id).length : 0;
    const total = recent.length || 1;
    const lines = [];
    if (cnt.personal / total > 0.6) lines.push("요 몇 주 혼자 하는 훈련만 하더라. 열심인 건 아는데, 축구는 같이 하는 거다.");
    else if (cnt.team / total > 0.6) lines.push("단체훈련엔 빠짐없이 나왔더라. 감독님도 알고 계신다. 다만 네 것도 따로 챙겨라.");
    else lines.push("훈련은 고르게 잘 나눠 하고 있다. 그게 제일 어렵다.");
    lines.push(`네 자리에서 지금 제일 아쉬운 건 ${ida(STAT_LABEL[weak])}.${drill ? used === 0 ? ` 그런데 ${josa(drill.label, "은", "는")} 한 번도 안 했더라.` : used <= 1 ? ` ${josa(drill.label, "을", "를")} 조금 더 늘려 보자.` : " 그래도 꾸준히 채우고 있으니 곧 올라올 거다." : ""}`);
    if (cnt.rest === 0) lines.push("쉬는 날이 하나도 없었다. 몸은 쉬는 동안 자란다.");
    if (cnt.school === 0) lines.push("그리고 담임 선생님이 수업 시간 얘기를 하시더라. 공부 칸도 잊지 마라.");
    mail(state, "assist", "요즘 훈련 이야기", lines.join("\n\n"));
    return true;
  });

  // 일상 메시지 (다른 소식이 적은 주에)
  if (out.length < 2 && chance(out.length ? 0.3 : 0.6)) lifeMail(state, turnInfo(state) || {});

  // 부상 중 재활 독려
  push("rehab", 3, () => {
    const inj = p.condition.injury;
    if (!inj || rep.injury) return false;
    mail(state, "medical", "재활 경과",
      `복귀까지 약 ${Math.max(1, Math.ceil(inj.weeksLeft))}주 남았다.\n\n재활 훈련 한 칸은 회복을 1주 앞당긴다. 이 기간에 공부나 독서로 학업과 집중력을 챙겨 두는 선수들이 많다.`);
    return true;
  });
}

// 처음 받는 안내 메시지들
function welcomeMails(state) {
  const p = state.player;
  mail(state, "mom", "첫날 어땠어?",
    `감독님 무섭지는 않았어? 저녁은 뭐 먹고 싶어?\n\n엄마는 네가 축구하는 거 응원해. 대신 공부 손 놓으면 안 되는 거 알지? 학교 성적표 나오면 같이 보자.`);
  mail(state, "assist", "1학년 생활 안내",
    [`${p.name}, ${ida(STAFF.assistant)}. 처음이니 몇 가지만 알려 준다.`,
     "한 주는 평일 두 칸, 주말 한 칸이다. 주말에 경기가 있으면 주말 칸은 경기로 고정된다.",
     "개인훈련은 능력치를 올리고, 단체훈련은 감독님 신뢰를 올린다. 선발은 능력치 75%, 감독 신뢰 25%로 정해진다.",
     "피로가 30을 넘으면 훈련 효율이 떨어지기 시작하고, 높을수록 더 크게 떨어진다. 다칠 위험도 커진다. 수면과 가족 시간이 피로를 푼다.",
     "학업은 가만있으면 매주 조금씩 떨어진다. 40 아래로 내려가면 감독님 경고, 20 아래면 대회 출전이 막힌다.",
     `지금 ${POSITIONS[p.position].label} 자리엔 형들이 있다. 1학년은 기회가 많지 않다. 조급해하지 마라.`].join("\n\n"));
  const captain = CAPTAINS?.[1] || ROSTER.filter(r => r.cohort === "3학년선배").sort((a, b) => b.ovr - a.ovr)[0]?.name || "주장";
  mail(state, "group", "고흥FC 단톡방에 초대되었습니다",
    `${STAFF.assistant}: 신입생들 환영한다~ 3월 2주부터 주말리그 시작이다.\n\n주장 ${captain}: 1학년들 선배 보면 인사 잘하고, 축구화는 각자 챙겨라. 물통 당번은 1학년 돌아가면서 😄`);
}

return { drillFor, previewMail, matchMails, weeklyAdvice, welcomeMails };
})();
(__fix["js/engine/advice.js"] || []).forEach(f => f());

// ── js/engine/match.js
__m["js/engine/match.js"] = (function () {
const {SITUATIONS, OUTCOMES, LINES, HALFTIME_TALK, PLAYS, FINISH, RESULT, AMBIENT, TO_ME, SIGNATURE, ME_IN_PLAY, BREAK, PREMATCH, FLOW} = __m["data/match.js"];
const {SURNAMES, GIVEN_NAMES} = __m["data/world.js"];
const {POSITIONS} = __m["data/player.js"];
const {GOALKEEPERS, STAFF} = __m["data/roster.js"];
const {rand, int, range, normal, chance, pick, weighted, clamp, getPath, shuffle} = __m["js/rng.js"];
const {ovr, depthChart, teamStrength, activeRoster, mateGrade} = __m["js/engine/team.js"];
const {hasTrait, applyGain, conditionOf} = __m["js/engine/growth.js"];
const {applyResult, TEAM_NAME} = __m["js/engine/season.js"];
const {matchMails} = __m["js/engine/advice.js"];
const {isBirthdayWeek} = __m["js/engine/birthday.js"];
const {turnInfo} = __m["js/engine/calendar.js"];
const {oppLineup, noteOpp} = __m["js/engine/opponents.js"];
// 경기 엔진: 시간순 사건을 미리 깔아 두고, 내 장면에서 멈춰 선택을 받습니다.
// 각 해설 줄에는 공 위치(ball)와 공을 가진 팀(poss)이 붙어 있어 화면이 선수들을 움직입니다.












const LENGTH = 70;
const MY_SLOT = { FW: 0, MF: 1, DF: 1 };        // 경기장에서 내가 서는 자리 (포지션 안 순서)          // 중등부 전후반 35분씩
const HALF = 35;
const STATUS_LABEL = { start: "선발 출전", sub: "교체 출전", bench: "벤치 대기", out: "명단 제외" };

// ── 문장 채우기 (받침에 맞는 조사) ───
function batchim(word) {
  const w = String(word);
  const c = w.charCodeAt(w.length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 !== 0;
  return false;
}
function fill(tpl, vars) {
  return tpl.replace(/\{(\w+)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => {
    const v = vars[k] ?? "";
    return a ? v + (batchim(v) ? a : b) : v;
  });
}
const say = (arr, vars) => fill(pick(arr), vars);
const randomName = () => weighted(SURNAMES) + pick(GIVEN_NAMES);

function poisson(lambda) {
  const L = Math.exp(-lambda); let k = 0, q = 1;
  do { k++; q *= rand(); } while (q > L);
  return k - 1;
}

function eligibility(state, fx) {
  const p = state.player;
  if (p.condition.injury) return { ok: false, reason: "부상으로 결장" };
  const lv = state.flags.academicLevel;
  if (fx.official && lv >= 4) return { ok: false, reason: "학업 부진으로 공식 경기 출전 정지" };
  if (fx.tournament && lv >= 3) return { ok: false, reason: "학업 부진으로 대회 출전 제한" };
  return { ok: true };
}

// 학년이 높은 골키퍼가 나서되, 강한 골키퍼(strong)가 있으면 그 선수가 먼저 나섭니다
function keeperOf(state) {
  const g = state.calendar.grade;
  const list = GOALKEEPERS.map(k => ({ ...k, g: mateGrade(k, g) })).filter(k => k.g >= 1 && k.g <= 3)
    .sort((a, b) => (b.strong ? 1 : 0) - (a.strong ? 1 : 0) || b.g - a.g);
  return list[0] || { name: "골키퍼" };
}
function ourKeeper(state) { return keeperOf(state).name; }

// 경기 전 감독·코치 한마디 (지시 tag와 같은 종류의 선택을 하면 성공률 +4%p)
function pickTalk(state, fx, status, star) {
  const p = state.player;
  const keys = [];
  if (status === "start") keys.push("start");
  // 교체 출전 예정이어도 경기 전에는 벤치 선수와 똑같이 보임 (투입은 깜짝)
  if (status === "sub" || status === "bench") keys.push("bench");
  if (status === "start") {
    if (fx.tournament) keys.push("big");
    if (fx.ko) keys.push("ko");
    if (fx.comp === "hs") keys.push("hs");
    if (p.condition.fatigue >= 60) keys.push("tired");
    if (star >= 1) keys.push("star");
  }
  if (!keys.length) return null;
  if (status === "start" && !(state.record.starts > 0))
    return { who: "coach", text: "첫 선발이다. 떨리는 거 안다. 첫 패스 하나만 정확하게 해라. 나머지는 몸이 알아서 한다.", tag: tagFit(p.position, "pass") >= 0.18 ? "pass" : "safe" };
  // 내 포지션에서 실제로 따를 수 있는 지시만 (공격수에게 '수비 먼저' 같은 지시가 가지 않게)
  const fits = t => !t.tag || tagFit(p.position, t.tag) >= 0.18;
  const special = PREMATCH.filter(t => keys.includes(t.when) && !["start", "sub", "bench"].includes(t.when) && fits(t));
  const pool = special.length && chance(0.6) ? special : PREMATCH.filter(t => keys.includes(t.when) && fits(t));
  const t = pool.length ? pick(pool) : null;
  return t ? { who: t.who, text: t.t, tag: t.tag } : null;
}
// 포지션별로 그 지시를 따를 수 있는 장면의 비율 (처음 한 번 계산)
let FIT = null;
function tagFit(pos, tag) {
  if (!FIT) {
    FIT = {};
    for (const ps of ["FW", "MF", "DF"]) {
      const sits = SITUATIONS.filter(x => x.pos.includes(ps));
      const tot = sits.reduce((a, x) => a + x.weight, 0) || 1;
      FIT[ps] = {};
      for (const tg of ["shoot", "pass", "dribble", "defend", "physical", "safe"])
        FIT[ps][tg] = sits.filter(x => x.choices.some(c => choiceTag(c) === tg)).reduce((a, x) => a + x.weight, 0) / tot;
    }
  }
  return FIT[pos]?.[tag] ?? 0;
}
const TAG_LABEL = { shoot: "슈팅", pass: "패스", dribble: "돌파", defend: "수비", physical: "몸싸움", safe: "안정적으로" };
function choiceTag(c) {
  const st = c.stats || {};
  const top = Object.entries(st).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  if (st["tech.shoot"] >= 0.5) return "shoot";
  if (st["tech.defense"] >= 0.5) return "defend";
  if ((st["tech.pass"] || 0) + (st["tech.cross"] || 0) >= 0.5) return "pass";
  if (st["tech.dribble"] >= 0.5 || top === "phys.agility" || top === "phys.speed") return "dribble";
  if (top === "phys.strength" || top === "phys.jump") return "physical";
  if (c.diff <= -6 || top.startsWith("mental")) return "safe";
  return null;
}
// 타이밍 버튼이 붙는 결정적 장면
function timingKind(c) {
  if (["shot", "chip", "head", "tapIn", "pk", "longShot", "acro"].includes(c.win)) return "shot";
  const st = c.stats || {};
  if ((st["tech.defense"] || 0) >= 0.5) return "tackle";
  if (["assist", "killPass"].includes(c.win)) return "pass";
  if ((st["tech.dribble"] || 0) >= 0.5 && c.win !== "keep") return "dribble";
  return null;
}

// 타이밍 버튼의 제목과 문구: 선택지가 실제로 하는 동작에 맞춤
const TIMING_RULES = [
  [/바이시클/, "바이시클 킥", "몸을 던진다!"],
  [/칩슛/, "칩슛", "살짝 띄운다!"],
  [/방향만 바꾼다/, "니어포스트", "방향을 바꾼다!"],
  [/반칙/, "전술적 반칙", "붙잡는다!"],
  [/몸을 던져/, "육탄 방어", "몸을 던진다!"],
  [/띄워 준다/, "로빙 패스", "띄워 준다!"],
  [/사포/, "사포", "띄운다!"],
  [/라보나/, "라보나", "감아 올린다!"],
  [/힐킥/, "힐킥", "뒤꿈치로!"],
  [/헛다리/, "헛다리", "제친다!"],
  [/중거리/, "중거리 슈팅", "때린다!"],
  [/뺏/, "태클", "발을 뻗는다!"],
  [/헤더/, "헤더", "뛰어오른다!"],
  [/발리/, "발리", "발을 갖다 댄다!"],
  [/밀어 넣/, "마무리", "밀어 넣는다!"],
  [/구석으로|가운데로/, "페널티킥", "찬다!"],
  [/직접 찬다/, "프리킥", "감아 찬다!"],
  [/돌아선다/, "턴", "돌아선다!"],
  [/제친다/, "돌파", "제친다!"],
  [/탈압박/, "탈압박", "빠져나간다!"],
  [/몰고|직접 해결/, "돌파", "치고 나간다!"],
  [/원투/, "원투 패스", "주고 들어간다!"],
  [/침투/, "침투", "뛰어든다!"],
  [/압박|달려든다/, "압박", "달려든다!"],
  [/슬라이딩/, "태클", "몸을 던진다!"],
  [/태클/, "태클", "발을 뻗는다!"],
  [/늦추기|거리를 두고|버틴다|지켜/, "버티기", "버틴다!"],
  [/크로스/, "크로스", "올린다!"],
  [/스루패스/, "스루패스", "찔러 준다!"],
  [/내준다|내줘|동료를 찾는다/, "패스", "내준다!"],
];
const TIMING_DEFAULT = { shot: ["슈팅", "때린다!"], pass: ["패스", "찔러 준다!"], tackle: ["수비", "막아선다!"], dribble: ["돌파", "치고 나간다!"] };
function timingOf(c) {
  const kind = timingKind(c);
  if (!kind) return null;
  const hit = TIMING_RULES.find(([re]) => re.test(c.label));
  const [label, btn] = hit ? [hit[1], hit[2]] : TIMING_DEFAULT[kind];
  const stat = Object.entries(c.stats || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "tech.shoot";   // 바늘 난이도는 이 선택의 핵심 능력치로
  return { kind, label, btn, stat };
}

// ── 경기 준비 ───────────────────────
function prepareMatch(state, info, fx) {
  const p = state.player;
  const elig = eligibility(state, fx);
  const depth = depthChart(state);

  let status = "out", minIn = 0;
  if (elig.ok) {
    if (depth.rank <= depth.slots) status = "start";
    else if (!fx.official) { status = "sub"; minIn = int(30, 40); }
    else if (depth.rank <= depth.slots + 2 && chance(0.65)) { status = "sub"; minIn = int(45, 60); }
    else if (depth.rank <= depth.slots + 3) status = "bench";
  }
  let restNote = null;
  if (status === "start" && fx.official && !fx.ko && p.condition.fatigue >= 85) {
    status = "sub"; minIn = int(40, 50);
    restNote = `피로가 ${Math.round(p.condition.fatigue)}까지 쌓여 감독님이 후반에 넣기로 하셨다.`;
  }
  const onPitch = status === "start" || status === "sub";
  const cond = conditionOf(p);
  const teamAvg = teamStrength(state, false);
  const myOvr = ovr(p);
  const star = onPitch ? clamp((myOvr - teamAvg) / 15 + (hasTrait(p, "ace") ? 0.2 : 0), 0, 1.7) : 0;

  const roster = activeRoster(state);
  const lineup = [];
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const n = def.slots - (status === "start" && pos === p.position ? 1 : 0);
    roster.filter(m => m.position === pos).sort((a, b) => b.ovrNow - a.ovrNow).slice(0, n)
      .forEach(m => lineup.push({ name: m.name, number: m.number, pos }));
  }
  // 안전장치: 어느 포지션이 모자라면 다른 포지션 후보가 내려오거나 올라가서 채우고, 그래도 없으면 신입생이 채움
  for (const [pos, def] of Object.entries(POSITIONS)) {
    const need = def.slots - (status === "start" && pos === p.position ? 1 : 0);
    let have = lineup.filter(x => x.pos === pos).length;
    while (have < need) {
      const spare = roster.filter(m => !lineup.some(l => l.name === m.name)).sort((a, b) => b.ovrNow - a.ovrNow)[0];
      if (spare) lineup.push({ name: spare.name, number: spare.number, pos });
      else lineup.push({ name: `신입생 ${randomName()}`, number: 90 + have, pos });
      have++;
    }
  }
  // 상대 필드 선수 10명 (DF 4, MF 4, FW 2). 경기장 위 번호와 중계 이름이 같은 사람
  const usedNames = new Set([p.name, ...roster.map(r => r.name), ...GOALKEEPERS.map(g => g.name)]);
  // 핵심 선수가 있는 팀은 그 판에서 고정된 선수단으로 (data/world.js의 OPPONENT_STARS)
  const known = oppLineup(state, fx.opponent.name, info.turn);
  let oppPlayers;
  if (known) {
    oppPlayers = known.lineup.map(x => ({ name: x.name, number: x.number, pos: x.pos, star: x.star }));
    oppPlayers.forEach(x => usedNames.add(x.name));
    for (const [pos, n] of [["DF", 4], ["MF", 4], ["FW", 2]]) {
      for (let have = oppPlayers.filter(x => x.pos === pos).length; have < n; have++) {
        let name; do { name = randomName(); } while (usedNames.has(name)); usedNames.add(name);
        oppPlayers.push({ name, number: 40 + oppPlayers.length, pos });
      }
    }
    oppPlayers.sort((a, b) => ["DF", "MF", "FW"].indexOf(a.pos) - ["DF", "MF", "FW"].indexOf(b.pos));
  } else {
    oppPlayers = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 17]).slice(0, 10).map((n, i) => {
      let name; do { name = randomName(); } while (usedNames.has(name)); usedNames.add(name);
      return { name, number: n, pos: i < 4 ? "DF" : i < 8 ? "MF" : "FW" };
    });
  }
  const oppAce = known?.ace ? { name: known.ace.name, pos: known.ace.pos, trait: known.ace.trait, grade: known.ace.grade, number: known.ace.number } : null;
  // 교체로 들어갈 같은 포지션 후보 (부상 교체용)
  const benchAll = roster.filter(m => !lineup.some(l => l.name === m.name)).sort((a, b) => (b.position === p.position) - (a.position === p.position) || b.ovrNow - a.ovrNow);
  const bench = benchAll.map(m => ({ name: m.name, number: m.number }));

  // 내가 뛰면 내 능력치와 컨디션이 팀 전력에 직접 더해짐
  const ours = teamStrength(state, onPitch) * 0.6 + 50 * 0.4 + (onPitch ? (myOvr - teamAvg) * 0.12 + cond.match * 15 : 0)
    + (keeperOf(state).strong ? 1.5 : 0);
  const theirs = fx.opponent.strength + (oppAce ? 0.6 : known?.absent ? -1.5 : 0);   // 에이스가 뛰면 조금 더 강하고, 빠지면 약해짐

  const events = [{ type: "kickoff", minute: 0 }];
  const nOur = poisson(6.8 * Math.exp((ours - theirs) / 14));
  const nTheir = poisson(6.8 * Math.exp((theirs - ours) / 14));
  for (let i = 0; i < nOur; i++) events.push({ type: "ours", minute: int(1, LENGTH) });
  for (let i = 0; i < nTheir; i++) events.push({ type: "theirs", minute: int(1, LENGTH) });
  for (let i = 0, n = int(4, 6); i < n; i++) events.push({ type: "ambient", minute: int(2, LENGTH - 1) });
  if (onPitch) {
    const from = status === "start" ? 1 : minIn + 1;
    // 능력치가 팀 평균보다 높을수록 공이 더 자주 나에게 옴
    const n = status === "start" ? int(6, 7) + Math.round(star * 1.5) : Math.max(2, Math.round((LENGTH - minIn) / LENGTH * (7 + star * 2)));
    for (let i = 0; i < n; i++) events.push({ type: "moment", minute: int(from, LENGTH) });
    if (status === "sub") events.push({ type: "subIn", minute: minIn - 0.5 });
    // 경기 중 부상 (드묾). 피로가 높을수록, 유리몸이면 더 자주
    const share = (LENGTH - (status === "start" ? 0 : minIn)) / LENGTH;
    const injP = 0.012 * share * (1 + p.condition.fatigue / 60) * (hasTrait(p, "glassBody") ? 1.8 : 1) * (hasTrait(p, "comeback") ? 0.8 : 1);
    if (chance(injP)) events.push({ type: "injury", minute: int(from + 3, LENGTH - 2) + 0.3 });
  }
  events.push({ type: "ht", minute: HALF + 0.5 }, { type: "2h", minute: HALF + 0.6 }, { type: "ft", minute: LENGTH + 0.5 });
  events.sort((a, b) => a.minute - b.minute);

  let physGap = 0;
  if (fx.comp === "hs") physGap = clamp((172 - p.body.height) / 120 + (58 - p.stats.phys.strength) / 160, 0, 0.12);

  return {
    fx, turn: info.turn, grade: info.grade, status, reason: elig.ok ? null : elig.reason, restNote,
    star, meRate: onPitch ? clamp(0.09 + star * 0.11 + (hasTrait(p, "ace") ? 0.03 : 0), 0.08, 0.32) : 0, me: p.name, myPos: p.position,
    minIn: status === "sub" ? minIn : 0, onPitch,
    ours, theirs, lineup, oppPlayers, oppAce, oppAceAbsent: known?.absent?.name || null, bench, talk: pickTalk(state, fx, status, star),
    gk: { us: ourKeeper(state), them: (() => { let n; do { n = randomName(); } while (usedNames.has(n)); usedNames.add(n); return n; })() }, myNumber: p.number,
    events, i: 0, minute: 0, score: [0, 0],
    stats: { us: { shots: 0, on: 0, corners: 0, cards: 0 }, them: { shots: 0, on: 0, corners: 0, cards: 0 },
             poss: Math.round(clamp(50 + (ours - theirs) * 1.1 + normal(0, 4), 28, 72)) },
    goalsLog: [],
    my: { goals: 0, assists: 0, delta: 0, decisions: 0, successes: 0, log: [], followed: 0, timing: [] },
    formSwing: hasTrait(p, "inconsistent") ? normal(0, 0.06) : 0, physGap,
    feed: [], pending: null, half: 1, done: false, used: {}, trailed: { us: false, them: false },
    flow: 0,                                       // 경기 흐름 −1(상대) ~ +1(우리). 내 선택의 성공·실패로 바뀜
  };
}

// ── 좌표 ────────────────────────────
function yOf(spec, side) {
  if (typeof spec === "number") return clamp(spec + range(-2, 2), 2, 66);
  if (spec === "W") return side ? range(5, 10) : range(58, 63);
  if (spec === "H") return side ? range(16, 24) : range(44, 52);
  if (spec === "K") return side ? 1 : 67;
  return range(27, 41);
}
const flip = (team, x) => (team === "us" ? x : 105 - x);
const goalPt = team => [team === "us" ? 104.6 : 0.4, range(31, 37)];
const keeperPt = team => [team === "us" ? 101 : 4, range(31, 37)];

function namesOf(m, team, pos) {
  if (pos === "GK") return [team === "us" ? m.gk.us : m.gk.them];
  const pool = team === "us" ? m.lineup : m.oppPlayers;
  const list = pool.filter(x => x.pos === pos);
  const names = (list.length ? list : pool).map(x => x.name);
  const ace = team === "them" && m.oppAce && names.includes(m.oppAce.name) ? m.oppAce.name : null;
  return ace ? [...names, ace, ace] : names;            // 상대 에이스가 공을 더 자주 잡음
}
const mateName = (m, prefer = ["FW", "MF"]) => {
  const pool = m.lineup.filter(x => prefer.includes(x.pos));
  return pick(pool.length ? pool : m.lineup)?.name || "동료";
};
const oppName = (m, prefer = ["FW", "MF"]) => {
  if (m.oppAce && prefer.includes(m.oppAce.pos) && m.oppPlayers.some(x => x.name === m.oppAce.name) && chance(0.35)) return m.oppAce.name;
  const pool = m.oppPlayers.filter(x => prefer.includes(x.pos));
  return pick(pool.length ? pool : m.oppPlayers).name;
};

// 골이 들어간 뒤 스코어와 흐름을 알려 주는 한 줄
function goalNote(m, team, min) {
  const [a, b] = m.score;
  const d = team === "us" ? a - b : b - a;      // 득점한 팀 기준 점수 차
  const behind = team === "us" ? m.trailed.us : m.trailed.them;
  // 골 뒤 한 줄 (같은 문장이 반복되지 않게 몇 가지 중에서 고름)
  const N = {
    tie:   [["동점골! 승부는 다시 원점이다.", "균형을 맞췄다! 이제부터 다시 시작이다."], ["동점을 허용했다.", "다시 동점이 됐다. 아쉽다."]],
    flip:  [["역전골! 경기를 뒤집었다!", "뒤집었다! 벤치가 모두 일어섰다!"], ["역전을 허용했다…", "경기가 뒤집혔다. 다시 따라가야 한다."]],
    first: [["선제골! 경기장 분위기가 우리 쪽으로 넘어온다.", "먼저 골문을 열었다!"], ["먼저 실점했다.", "선제골을 내줬다. 아직 시간은 많다."]],
    ahead: [["앞서 나가는 골!", "다시 앞서 간다!"], ["다시 리드를 내줬다.", "상대가 다시 앞서 나간다."]],
    more:  [["달아나는 골! 격차를 벌린다.", "한 골 더! 상대가 고개를 숙인다."], ["격차가 벌어진다.", "두 골 차 이상. 따라가기가 버거워진다."]],
    chase: [["한 골 따라붙었다!", "추격골! 아직 끝나지 않았다!"], ["상대가 한 골 따라붙었다.", "한 골 차로 좁혀졌다. 긴장해야 한다."]],
  };
  const kind = d === 0 ? "tie" : d === 1 && behind ? "flip" : d === 1 ? (a + b === 1 ? "first" : "ahead") : d >= 2 ? "more" : "chase";
  const note = pick(N[kind][team === "us" ? 0 : 1]);
  if (a < b) m.trailed.us = true;
  if (b < a) m.trailed.them = true;
  // 골 뒤에는 실점한 팀이 센터서클에서 다시 시작
  return { t: `${note} ${TEAM_NAME} ${a} : ${b} ${m.fx.opponent.name}`, k: "stat", minute: min, ball: [52.5, 34], poss: team === "us" ? "them" : "us" };
}

// 팀 공격 한 번: 패스 전개 → 마무리 → 결과
function runPlay(m, team) {
  m.flow = (m.flow || 0) * 0.9;                  // 흐름은 시간이 지나면 조금씩 가라앉음
  // 페널티킥 전개는 한 경기에 팀당 한 번까지
  const plays = PLAYS.filter(pl => pl.finish !== "pk" || !m.used[`pk_${team}`]);
  const play = weighted(plays.map(pl => [pl, pl.weight]));
  if (play.finish === "pk") m.used[`pk_${team}`] = true;
  const side = chance(0.5);
  const min = m.minute;
  const lines = [];
  const onNow = m.onPitch && min >= m.minIn;

  // 내가 끼는 공격: 같은 자리 단계 하나를 내가 맡음 (문장을 만들기 전에 먼저 정함)
  let meIdx = -1;
  if (team === "us" && onNow && chance(m.meRate)) {
    const idx = play.steps.map((st, i) => (!st.same && (st.who === m.myPos || (m.myPos !== "DF" && i === play.steps.length - 1))) ? i : -1).filter(i => i >= 0);
    if (idx.length) meIdx = pick(idx);
  }
  // 단계마다 공을 가진 선수. same: true 단계는 앞 단계 선수가 그대로 이어 감
  let prev = null;
  const actors = play.steps.map((st, i) => {
    if (st.same && prev) return prev;
    if (i === meIdx) { prev = m.me; return prev; }
    const names = namesOf(m, team, st.who).filter(n => n !== prev);
    prev = pick(names.length ? names : namesOf(m, team, st.who));
    return prev;
  });
  // 내가 맡은 단계 뒤에 same 단계가 이어지면 그것도 나
  if (meIdx >= 0) for (let i = meIdx + 1; i < play.steps.length && play.steps[i].same; i++) actors[i] = m.me;
  play.steps.forEach((st, i) => {
    const pt = [flip(team, st.at[0]), yOf(st.at[1], side)];
    const mine = actors[i] === m.me && team === "us";
    const last = i === play.steps.length - 1;
    let t = st.t.length ? fill(pick(st.t), { a: actors[i], b: actors[i + 1] || actors[i] }) : "";
    if (mine && !last && !st.t.length) t = fill(pick(i === play.steps.length - 2 ? ME_IN_PLAY.pass : ME_IN_PLAY.build), { me: m.me });
    if (t) lines.push({ t, k: mine ? "me-auto" : team === "us" ? "us" : "them", minute: min, ball: pt, poss: team, fast: true, meHold: mine, actor: actors[i] });
    else lines.push({ t: "", k: "", minute: min, ball: pt, poss: team, fast: true, silent: true, actor: actors[i] });
  });
  // 슈팅까지 못 가고 끊기는 공격 (약 30%)
  if (!["pk", "fk"].includes(play.finish) && play.steps.length >= 2 && chance(0.3)) {
    const k = int(1, play.steps.length - 1);           // 이 단계에서 끊김
    const cut = lines.slice(0, k);
    const other = team === "us" ? "them" : "us";
    const sameStep = play.steps[k].same;              // 혼자 몰고 가던 중이면 태클로만 끊김
    const kind = play.finish === "header" && k === play.steps.length - 1 ? "claim"
      : sameStep ? "tackle" : weighted([["intercept", 0.38], ["tackle", 0.32], ["offside", 0.15], ["out", 0.15]]);
    let d = team === "us" ? oppName(m, ["DF", "MF"]) : mateName(m, ["DF", "MF"]);
    // 상대 공격을 내가 끊는 장면 (수비수·미드필더)
    const meCut = other === "us" && onNow && (m.myPos === "DF" || m.myPos === "MF") && ["intercept", "tackle"].includes(kind) && chance(m.meRate);
    if (meCut) { d = m.me; m.my.delta += 0.1; m.my.involved = (m.my.involved || 0) + 1; m.my.stops = (m.my.stops || 0) + 1; }
    const gk = team === "us" ? m.gk.them : m.gk.us;
    const at = cut.at(-1)?.ball || [52.5, 34];
    const ballPt = kind === "out" ? [flip(team, 104), chance(0.5) ? 0.5 : 67.5] : kind === "claim" ? keeperPt(team) : [Math.max(2, Math.min(103, at[0] + (team === "us" ? 6 : -6))), at[1]];
    const txt = fill(pick(BREAK[kind]), { a: actors[k - 1], r: actors[k], d, gk });   // a 공을 준 선수, r 받으려던 선수
    cut.push({ t: (meCut ? "" : "") + txt, k: meCut ? "me-auto" : other === "us" ? "us" : "them", minute: min, ball: ballPt, poss: other,
      actor: kind === "claim" ? gk : ["intercept", "tackle"].includes(kind) ? d : null, meHold: meCut });
    if (meIdx >= 0 && meIdx < k) { m.my.delta += 0.03; m.my.involved = (m.my.involved || 0) + 1; }
    return cut;
  }
  if (meIdx >= 0) { m.my.delta += 0.05; m.my.involved = (m.my.involved || 0) + 1; }

  // 상대 공격: 수비 능력이 좋으면 내가 끊어 냄
  if (team === "them" && onNow && (m.myPos === "DF" || m.myPos === "MF") && chance(m.meRate * (m.myPos === "DF" ? 1.1 : 0.7))) {
    const pl = m._p;
    const q = clamp(0.3 + (pl.stats.tech.defense - m.theirs) / 60 + conditionOf(pl).match, 0.1, 0.85);
    if (rand() < q) {
      lines.push({ t: fill(pick(ME_IN_PLAY.stop), { me: m.me }), k: "me-auto", minute: min, ball: lines.at(-1).ball, poss: "us", meHold: true, actor: m.me });
      m.my.delta += 0.2; m.my.involved = (m.my.involved || 0) + 1; m.my.stops = (m.my.stops || 0) + 1;
      return lines;
    }
  }

  const shooter = actors.at(-1);
  // 도움: 혼자 몰고 간 구간(same)을 거슬러 올라가 마지막으로 공을 준 다른 선수
  let ai = play.steps.length - 1; while (ai > 0 && play.steps[ai].same) ai--;
  const assister = ai > 0 && actors[ai - 1] !== shooter ? actors[ai - 1] : null;
  const meShoots = shooter === m.me && team === "us";
  const finTxt = meShoots ? (ME_IN_PLAY[{ header: "head", fk: "fk", pk: "pk" }[play.finish]] || ME_IN_PLAY.shot) : FINISH[play.finish];
  lines.push({ t: fill(pick(finTxt), { a: shooter, me: m.me }), k: meShoots ? "me-auto" : team === "us" ? "us" : "them", minute: min, ball: lines.at(-1).ball, poss: team, fast: true, meHold: meShoots, actor: shooter });

  const st = m.stats[team];
  st.shots++;
  if (play.id === "corner") st.corners++;
  const diff = team === "us" ? m.ours - m.theirs : m.theirs - m.ours;
  const mult = { shot: 1, header: 0.85, long: 0.45, fk: 0.5 }[play.finish] || 1;
  let conv = clamp((0.24 + diff / 200) * mult, 0.06, 0.42);
  if (meShoots) {
    const pl = m._p;
    const stat = play.finish === "header" ? pl.stats.phys.jump * 0.6 + pl.stats.tech.shoot * 0.4 : pl.stats.tech.shoot;
    conv = clamp((0.06 + (stat - (m.theirs + 4)) / 110 + conditionOf(pl).match * 0.6 + (hasTrait(pl, "finisher") ? 0.04 : 0)) * mult, 0.04, 0.36);
  }
  if (play.finish !== "pk") conv = clamp(conv * (1 + (team === "us" ? 1 : -1) * (m.flow || 0) * 0.3), 0.04, 0.45);   // 흐름을 탄 팀이 더 잘 넣음
  if (play.finish === "pk") conv = meShoots ? clamp(0.62 + (m._p.stats.tech.shoot - 55) / 200 + conditionOf(m._p).match, 0.5, 0.88) : clamp(0.72 + diff / 300, 0.6, 0.84);
  const vars = { a: shooter, gk: team === "us" ? m.gk.them : m.gk.us, d: team === "us" ? oppName(m, ["DF"]) : mateName(m, ["DF"]) };
  const R = RESULT[team];
  if (rand() < conv) {
    st.on++;
    team === "us" ? m.score[0]++ : m.score[1]++;
    const ast = play.id === "longshot" ? null : assister;
    m.goalsLog.push({ team, name: shooter, minute: min, assist: ast, me: meShoots, myAssist: ast === m.me });
    if (meShoots) { m.my.goals++; m.my.delta += 0.85; }
    if (team === "us" && ast === m.me) { m.my.assists++; m.my.delta += 0.45; }
    lines.push({ t: say(R.goal, vars), k: meShoots ? "goal-me" : team === "us" ? "goal-us" : "goal-them", minute: min, ball: goalPt(team), poss: team, score: [...m.score] });
    lines.push(goalNote(m, team, min));
  } else {
    const kind = play.finish === "pk" ? weighted([["save", 0.7], ["wide", 0.2], ["post", 0.1]])
      : weighted([["save", 0.42], ["wide", 0.3], ["block", 0.16], ["post", 0.12]]);
    if (kind === "save") st.on++;
    const ball = kind === "save" ? keeperPt(team) : kind === "wide" ? [flip(team, 105), range(18, 50)] : kind === "post" ? [flip(team, 104.5), chance(0.5) ? 30.4 : 37.6] : [flip(team, 88), range(26, 42)];
    lines.push({ t: say(R[kind], vars), k: team === "us" ? "us" : "them", minute: min, ball, poss: kind === "save" || kind === "wide" ? (team === "us" ? "them" : "us") : team,
      actor: kind === "save" ? vars.gk : kind === "block" ? vars.d : null });
    if ((kind === "save" || kind === "block") && chance(0.35)) {
      st.corners++;
      const taker = team === "us" ? mateName(m, ["MF"]) : oppName(m, ["MF"]);
      lines.push({ t: team === "us" ? `코너킥을 얻었다. ${taker}의 킥은 수비 머리에 걸린다.` : `상대 코너킥. ${taker}의 킥을 우리 수비가 걷어 냈다.`, k: team === "us" ? "us" : "them", minute: min, ball: [flip(team, 104), chance(0.5) ? 1 : 67], poss: team, fast: true, actor: taker });
    }
  }
  return lines;
}

// ── 진행 ────────────────────────────
// kind: "line" 계속 / "moment" 선택 대기 / "ht" 하프타임 / "ft" 종료
function next(state, m) {
  if (m.pending || m.done) return { kind: m.done ? "ft" : "moment", lines: [] };
  const ev = m.events[m.i++];
  if (!ev) { m.done = true; return { kind: "ft", lines: [] }; }
  m.minute = Math.min(LENGTH, Math.floor(ev.minute));
  const min = m.minute;
  const L = (t, k = "info", extra = {}) => ({ t, k, minute: min, ...extra });
  let lines = [];

  if (ev.type === "kickoff") {
    lines.push(L(say(LINES.kickoff, { us: TEAM_NAME }), "whistle", { ball: [52.5, 34], poss: "us" }));
    if (m.status !== "start") lines.push(L(m.status === "bench" || m.status === "sub" ? "벤치에서 경기를 지켜본다. 언제 부를지 모른다." : (m.reason || "관중석에서 경기를 지켜본다.")));
    if (m.restNote) lines.push(L(m.restNote, "coach"));
    if (m.star >= 1 && m.status === "start") lines.push(L(fill(pick(ME_IN_PLAY.marked), { me: m.me }), "me-auto"));
    if (m.status === "start" && isBirthdayWeek(state, turnInfo(state)))
      lines.push(L(fill("생일 주간에 선발 출전한 {me}. 벤치에서 {a|이/가} 손가락으로 케이크 모양을 그려 보인다.", { me: m.me, a: STAFF.assistant }), "coach"));
    if (state.flags.captain && m.status === "start") lines.push(L(fill("주장 완장을 찬 {me|이/가} 상대 주장과 악수하고 동전 던지기에 나선다.", { me: m.me }), "me"));
    if (state.player.number === 10 && m.grade === 3 && m.status === "start" && !state.flags.played10) {
      state.flags.played10 = true;
      lines.push(L("등에 10번을 단 첫 경기. 관중석에서 엄마가 휴대폰을 높이 든다.", "me"));
    }
    // 큰 부상 뒤 복귀전
    if (m.status === "start" && state.flags.returnTurn != null && m.turn - state.flags.returnTurn <= 3) {
      m.comeback = true; state.flags.returnTurn = null;
      lines.push(L(fill("{me}의 복귀전. 벤치에서 {a|이/가} 엄지를 들어 보인다.", { me: m.me, a: STAFF.assistant }), "coach"));
    }
  }
  if (ev.type === "injury" && m.onPitch && !m.injured) {
    const type = weighted([["ankle", 0.55], ["hamstring", 0.3], ["knee", 0.15]]);
    const t = INJURY_LINES[type];
    m.injured = { type, minute: min, cause: t.cause };
    m.onPitch = false;
    lines.push(L(fill(pick(t.lines), { me: m.me }), "me-bad", { ball: [range(40, 80), range(15, 55)], poss: "them" }));
    lines.push(L(fill("의무 트레이너가 뛰어 들어간다. {coach|이/가} 벤치에서 교체 사인을 보낸다.", { coach: STAFF.coach }), "coach"));
    const rep = m.bench?.[0];
    if (rep) m.lineup.push({ name: rep.name, number: rep.number, pos: m.myPos });
    lines.push(L(pick(t.after) + (rep ? fill(` ${rep.number}번 {r|이/가} 대신 들어간다.`, { r: rep.name }) : ""), "info", { injuredOff: rep || { name: "교체 선수", number: "" } }));
  }
  if (ev.type === "2h") lines.push(L(say(LINES.secondHalf, {}), "whistle", { ball: [52.5, 34], poss: "them", half2: true }));
  if (ev.type === "subIn") {
    // 경기장 위에서 내 자리에 서 있던 동료가 나간다 (화면의 점도 같은 사람)
    const same = m.lineup.filter(x => x.pos === m.myPos);
    const out = same.at(-1);                       // 같은 자리에서 가장 약한 선수가 나감 (명단은 능력치 순)
    if (out) m.lineup = m.lineup.filter(x => x !== out);
    lines.push(L(fill(`교체: {o|이/가} 나오고 {me|이/가} 들어간다. `, { o: out?.name || "동료", me: m.me }) + pick(LINES.subIn), "me",
      { subIn: true, outNo: out?.number ?? "", outName: out?.name || "" }));
    // 들어가는 순간 받는 지시. 이 지시를 따르면 성공률 +4%p
    const st = pick(PREMATCH.filter(t => t.when === "sub" && (!t.tag || tagFit(m.myPos, t.tag) >= 0.18)));
    if (st) {
      m.talk = { who: st.who, text: st.t, tag: st.tag };
      lines.push(L(`${st.who === "coach" ? STAFF.coach : STAFF.assistant}: "${st.t}"${st.tag ? ` (지시: ${TAG_LABEL[st.tag]})` : ""}`, "coach", { fast: true }));
    }
  }
  Object.defineProperty(m, "_p", { value: state.player, enumerable: false, configurable: true, writable: true });
  if (ev.type === "ours") lines = runPlay(m, "us");
  if (ev.type === "theirs") lines = runPlay(m, "them");
  if (ev.type === "ambient") {
    const fit = AMBIENT.filter(x => (!x.early || min < 15) && (!x.late || min >= 58) && (!x.min || min >= x.min) && !m.used[`amb${AMBIENT.indexOf(x)}`]);
    const a = pick(fit.length ? fit : AMBIENT);
    m.used[`amb${AMBIENT.indexOf(a)}`] = true;                  // 같은 경기에서 같은 문장은 한 번만
    if (a.card) m.stats[a.card].cards++;
    const poss = a.side === "them" ? "them" : a.side === "us" ? "us" : chance(m.stats.poss / 100) ? "us" : "them";
    m.carded ||= [];
    const freshOpp = m.oppPlayers.filter(o => !m.carded.includes(o.name));
    const freshMate = m.lineup.filter(x => ["DF", "MF"].includes(x.pos) && !m.carded.includes(x.name));
    const av = { a: a.card === "us" && freshMate.length ? pick(freshMate).name : mateName(m, ["DF", "MF"]),
      o: a.card === "them" && freshOpp.length ? pick(freshOpp).name : oppName(m), coach: STAFF.coach, gk: m.gk.us };
    if (a.card) m.carded.push(a.card === "them" ? av.o : av.a);   // 경고 받은 선수가 또 받지 않게
    const actor = /\{a[|}]/.test(a.t) ? av.a : /\{o[|}]/.test(a.t) ? av.o : /\{gk[|}]/.test(a.t) ? av.gk : null;
    lines.push(L(fill(a.t, av), a.card ? "card" : "info",
      { ball: actor === av.gk ? [range(5, 9), range(28, 40)] : [range(30, 75), range(10, 58)], poss, actor }));
  }
  if (ev.type === "moment" && m.injured) { m.feed.push(...lines); return { kind: "line", lines }; }
  if (ev.type === "moment") {
    const sit = pickSituation(state, m);
    const poss = sit.poss || "us";
    if (sit.once) m.used[sit.id] = true;
    const myPos = state.player.position;
    const oppPref = poss === "them" ? ({ DF: ["FW"], MF: ["MF", "FW"], FW: ["DF"] }[myPos]) : (myPos === "DF" ? ["FW", "MF"] : ["DF", "MF"]);
    const sv = { mate: mateName(m), opp: oppName(m, oppPref), gk: m.gk.us, ogk: m.gk.them };
    const zone = sit.zone;
    const ball = sit.spot ? [range(...sit.spot[0]), range(...sit.spot[1])]      // 장면마다 정해 둔 자리 (골문 앞 혼전 등)
      : zone === "att" ? [range(80, 88), range(24, 44)] : zone === "mid" ? [range(48, 60), range(18, 50)] : [range(20, 30), range(18, 50)];
    const holder = poss === "them" ? sv.opp : m.me;
    if (sit.intro !== false) lines.push(L(fill(pick(TO_ME[poss === "them" ? "def" : zone] || TO_ME.mid), sv), "me", { ball, poss, toMe: poss !== "them", actor: holder, press: poss === "them" }));
    // 상대 에이스와 처음 마주칠 때 한 줄 (경기마다 한 번)
    if (poss === "them" && sit.intro !== false && m.oppAce && sv.opp === m.oppAce.name && !m._aceSeen) {
      m._aceSeen = true;
      lines.push(L(fill(pick(["{a|이다/다}. 경기 전 분석에서 몇 번이나 들은 이름이다.", "상대 에이스 {a}. 오늘 제일 조심하라던 선수다."]), { a: sv.opp }), "me", { ball, poss, actor: holder, press: true }));
    }
    else lines.push({ t: "", k: "", minute: min, ball, poss, toMe: poss !== "them", silent: true, actor: holder, press: poss === "them" });
    m._sitPoss = poss;
    const list = sit.choices.filter(c => meets(state, c.requires)).map(c => (c.requires ? { ...c, signature: true } : c));
    const sig = SIGNATURE[sit.id];
    if (sig && Object.entries(sig.requires).every(([k, v]) => getPath(state.player.stats, k) >= v)) list.push({ ...sig, signature: true });
    const choices = list.map(c => { const p = prob(state, m, c); return { label: c.label, p, signature: !!c.signature,
      level: p >= 0.65 ? "높음" : p >= 0.4 ? "보통" : "낮음", timing: timingOf(c), follow: !!(m.talk?.tag && choiceTag(c) === m.talk.tag) }; });
    m.pending = { sit, list, vars: sv, text: fill(pick(sit.text), sv), choices, ball };
    m.feed.push(...lines);
    return { kind: "moment", lines };
  }
  if (ev.type === "ht") {
    m.half = 2;
    const [a, b] = m.score;
    const mood = a > b ? "winning" : a === b ? "drawing" : "losing";
    lines.push(L(`전반 종료. ${TEAM_NAME} ${a} : ${b} ${m.fx.opponent.name}`, "whistle", { ball: [52.5, 34], poss: null }));
    lines.push(L(statLine(m), "stat"));
    lines.push(L(`${STAFF.coach}: "${pick(HALFTIME_TALK[mood])}"`, "coach"));
    m.feed.push(...lines);
    return { kind: "ht", lines };
  }
  if (ev.type === "ft") {
    lines.push(L(say(LINES.fulltime, {}), "whistle", { ball: [52.5, 34], poss: null }));
    lines.push(L(statLine(m), "stat"));
    m.done = true;
    m.feed.push(...lines);
    return { kind: "ft", lines };
  }
  m.feed.push(...lines);
  return { kind: "line", lines };
}

function statLine(m) {
  const u = m.stats.us, t = m.stats.them;
  return `점유율 ${m.stats.poss}% 대 ${100 - m.stats.poss}%, 슈팅 ${u.shots} 대 ${t.shots} (유효 ${u.on} 대 ${t.on}), 코너킥 ${u.corners} 대 ${t.corners}`;
}

function pickSituation(state, m) {
  const pos = state.player.position;
  const [a, b] = m.score;
  const late = m.minute >= 55;
  const pool = SITUATIONS.filter(s => s.pos.includes(pos) && (!s.once || !m.used[s.id]) && meets(state, s.requires)
    && (!s.late || late) && (!s.leading || a > b) && (!s.trailing || a < b));
  const losingLate = a < b && m.minute > 50;
  return weighted(pool.map(s => [s, s.weight * (losingLate && s.zone === "att" ? 1.6 : 1)]));
}

// 능력치 조건 (장면·선택지가 열리는지)
function meets(state, req) {
  return !req || Object.entries(req).every(([k, v]) => getPath(state.player.stats, k) >= v);
}
// 이미 정해 둔 사건 사이에 공격 한 번을 끼워 넣음 (흐름이 넘어갈 때)
function addAttack(m, type, minute) {
  if (minute >= LENGTH || (minute > HALF - 1 && minute < HALF + 1)) return;
  let j = m.i;
  while (j < m.events.length && m.events[j].minute <= minute) j++;
  m.events.splice(j, 0, { type, minute });
}

function prob(state, m, c) {
  const p = state.player;
  let s = 0, w = 0;
  for (const [path, k] of Object.entries(c.stats)) { s += getPath(p.stats, path) * k; w += k; }
  s /= w;
  let x = 0.45 + (s - (m.theirs + c.diff)) / 70;
  x += (p.stats.mental.confidence - 50) / 350;
  x += conditionOf(p).match;                       // 컨디션 (피로 + 사기)
  // 후반이 될수록 체력이 낮거나 지친 선수는 무뎌짐
  if (m.minute > HALF) {
    const tired = Math.max(0, (p.condition.fatigue - 40) / 100) + Math.max(0, (60 - p.stats.phys.stamina) / 100);
    x -= tired * ((m.minute - HALF) / HALF) * 0.15 * (hasTrait(p, "ironLungs") ? 0.4 : 1);
  }
  const big = m.fx.tournament || m.fx.comp === "hs";
  if (big && hasTrait(p, "bigGame")) x += 0.05;
  if (big && hasTrait(p, "timid")) x -= 0.06;
  if (big && hasTrait(p, "champion")) x += 0.03;
  if (m._sitPoss === "them" && hasTrait(p, "wall")) x += 0.05;
  if (m.talk?.tag && choiceTag(c) === m.talk.tag) x += 0.04;
  if (hasTrait(p, "clutch") && m.score[0] < m.score[1] && m.minute > HALF) x += 0.07;
  if (c.physical) x -= m.physGap;
  x += m.formSwing;
  return clamp(x, 0.05, 0.95);
}

// ── 내 선택 처리 ────────────────────
function resolve(state, m, ci, timing = null) {
  const pd = m.pending;
  const c = pd.list[ci];
  const bonus = timing ? { perfect: 0.12, good: 0.06, miss: -0.04 }[timing] || 0 : 0;
  const p = clamp(pd.choices[ci].p + bonus, 0.03, 0.97);
  if (timing) m.my.timing.push(timing);
  if (pd.choices[ci].follow) m.my.followed++;
  const ok = rand() < p;
  const out = ok ? c.win : c.lose;
  const v = pd.vars;
  const min = m.minute;
  const pl = state.player;
  const [bx, by] = pd.ball;
  // 상황 설명을 기록에 남겨야 나중에 읽어도 앞뒤가 이어짐
  const them = pd.sit.poss === "them";
  const holder0 = them ? v.opp : m.me;
  const lines = [{ t: pd.text, k: "me", minute: min, ball: pd.ball, poss: pd.sit.poss || "us", fast: true, actor: holder0, press: them },
                 { t: `▶ ${c.label}${timing ? ` ${{ perfect: "(완벽한 타이밍!)", good: "(좋은 타이밍)", miss: "(타이밍이 어긋났다)" }[timing]}` : ""}`, k: "me", minute: min, ball: pd.ball, poss: pd.sit.poss || "us", actor: holder0, press: them }];

  // 결과 문장과 공의 움직임
  const after = {
    win: [[bx + 10, by], "us"], keep: [[bx + 5, by + range(-6, 6)], "us"], miss: [[100, 34], "them"],
    turnover: [[bx - 4, by], "them"], danger: [[range(14, 20), range(28, 40)], "them"],
    shot: [[Math.max(bx, 86), range(28, 40)], "us"], chip: [[Math.max(bx, 88), range(30, 38)], "us"], head: [[94, range(30, 38)], "us"],
    assist: [[90, range(28, 40)], "us"], keyPass: [[84, range(22, 46)], "us"], killPass: [[93, range(30, 38)], "us"],
    tapIn: [[97, range(31, 37)], "us"], pk: [[94, 34], "us"], matePk: [[94, 34], "us"], setPiece: [[80, range(26, 42)], "us"],
    offside: [[bx, by], "them"], pkAgainst: [[11, 34], "them"],
    longShot: [[Math.max(bx, 74), range(26, 42)], "us"], acro: [[96, range(30, 38)], "us"], card: [[bx, by], "them"], decoy: [[92, range(28, 40)], "us"],
  }[out] || [[bx, by], "us"];
  if (out === "keep" && pd.sit.poss === "them") { after[0] = [bx, by]; after[1] = "them"; }   // 상대 공을 막기만 한 장면은 공이 상대에게 남음
  // 결과 장면에서 공을 가진 사람
  const actorOf = { win: m.me, keep: m.me, shot: m.me, chip: m.me, head: m.me, tapIn: m.me, pk: m.me,
    assist: v.mate, keyPass: v.mate, killPass: v.mate, matePk: v.mate, setPiece: v.mate,
    turnover: v.opp, danger: v.opp, pkAgainst: v.opp, offside: null, miss: null, longShot: m.me, acro: m.me, card: null, decoy: v.mate }[out];
  const actorNow = out === "keep" && pd.sit.poss === "them" ? v.opp : actorOf;
  lines.push({ t: fill(pick(ok ? c.winText : c.loseText), v), k: ok ? "me-good" : "me-bad", minute: min, ball: after[0], poss: after[1], actor: actorNow });
  if (ok && pd.choices[ci].follow) lines.push({ t: fill("{c|이/가} 벤치에서 주먹을 쥔다. 경기 전 지시 그대로다.", { c: m.talk.who === "coach" ? STAFF.coach : STAFF.assistant }), k: "coach", minute: min });

  const main = Object.entries(c.stats).sort((a, b) => b[1] - a[1])[0][0];
  m.my.decisions++; if (ok) m.my.successes++;
  m.my.log.push({ sit: pd.sit.id, label: c.label, ok, out, stat: main, value: getPath(pl.stats, main), level: pd.choices[ci].level, minute: min, signature: !!c.signature });
  m.my.delta += OUTCOMES[out].rating;
  if (pd.sit.id === "penalty" && out === "miss") { m.stats.us.shots++; m.stats.us.on++; }
  else if (out === "miss" && (c.stats["tech.shoot"] || 0) >= 0.5) m.stats.us.shots++;   // 빗나간 슈팅도 슈팅 수에
  if (/corner/.test(pd.sit.id)) m.stats.us.corners++;

  const finish = (stat, goalTxt, saveTxt, wideTxt) => {
    m.stats.us.shots++;
    const q = clamp(0.035 + (stat - (m.theirs + 4)) / 120 + (pl.stats.mental.confidence - 50) / 400 + conditionOf(pl).match * 0.6
      + (hasTrait(pl, "finisher") ? 0.04 : 0), 0.04, 0.36);
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++; m.my.goals++; m.my.delta += 0.75;
      m.goalsLog.push({ team: "us", name: pl.name, minute: min, me: true });
      lines.push({ t: fill(pick(goalTxt), v), k: "goal-me", minute: min, ball: goalPt("us"), poss: "us", score: [...m.score] });
      lines.push(goalNote(m, "us", min));
    } else {
      const saved = rand() < 0.6;
      if (saved) m.stats.us.on++;
      lines.push({ t: fill(pick(saved ? saveTxt : wideTxt), v), k: "me", minute: min, ball: saved ? keeperPt("us") : [105, range(20, 48)], poss: "them", actor: saved ? m.gk.them : null });
    }
  };
  const teammateFinish = (q, goalTxt = LINES.assistGoal, missTxt = LINES.assistMiss, credit = true) => {
    m.stats.us.shots++;
    if (credit && hasTrait(pl, "playmaker")) q += 0.06;
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++;
      if (credit) { m.my.assists++; m.my.delta += 0.6; }
      m.goalsLog.push({ team: "us", name: v.mate, minute: min, assist: credit ? pl.name : null, myAssist: credit });
      lines.push({ t: fill(pick(goalTxt), v), k: "goal-us", minute: min, ball: goalPt("us"), poss: "us", score: [...m.score] });
      lines.push(goalNote(m, "us", min));
    } else lines.push({ t: fill(pick(missTxt), v), k: "us", minute: min, ball: keeperPt("us"), poss: "them", actor: m.gk.them });
  };
  const concede = (q, txtGoal, txtSave) => {
    m.stats.them.shots++;
    if (rand() < q) {
      m.stats.them.on++; m.score[1]++; m.my.delta -= 0.25;
      m.goalsLog.push({ team: "them", name: v.opp, minute: min, myFault: true });
      lines.push({ t: fill(pick(txtGoal), v), k: "goal-them", minute: min, ball: goalPt("them"), poss: "them", score: [...m.score] });
      lines.push(goalNote(m, "them", min));
    } else if (txtSave) lines.push({ t: fill(pick(txtSave), { ...v, mate: mateName(m, ["DF"]) }), k: "them", minute: min, ball: keeperPt("them"), poss: "us", actor: m.gk.us });
  };

  if (out === "shot") finish(pl.stats.tech.shoot, LINES.myShotGoal, LINES.myShotSaved, LINES.myShotWide);
  if (out === "chip") finish(pl.stats.tech.shoot + 8, LINES.myChipGoal, LINES.myChipMiss, LINES.myChipMiss);
  if (out === "head") finish(pl.stats.phys.jump * 0.6 + pl.stats.tech.shoot * 0.4, LINES.myHeadGoal, LINES.myHeadMiss, LINES.myHeadMiss);
  if (out === "assist") teammateFinish(0.35);
  if (out === "keyPass") teammateFinish(0.18);
  if (out === "killPass") teammateFinish(0.5);
  if (out === "tapIn") finish(pl.stats.tech.shoot + 20, LINES.tapGoal, LINES.myShotSaved, LINES.myShotWide);
  if (out === "pk") {
    m.stats.us.shots++; m.stats.us.on++; m.score[0]++; m.my.goals++; m.my.delta += 0.6;
    m.goalsLog.push({ team: "us", name: pl.name, minute: min, me: true });
    lines.push({ t: fill(pick(LINES.pkGoal), v), k: "goal-me", minute: min, ball: goalPt("us"), poss: "us", score: [...m.score] });
    lines.push(goalNote(m, "us", min));
  }
  if (out === "matePk") teammateFinish(0.72, LINES.matePkGoal, LINES.matePkMiss, false);
  if (out === "setPiece") teammateFinish(0.16, LINES.fkGoal, LINES.fkMiss, false);
  if (out === "longShot") finish(pl.stats.tech.shoot - 14, LINES.myLongGoal, LINES.myLongSaved, LINES.myLongWide);
  if (out === "acro") finish((pl.stats.phys.jump + pl.stats.phys.agility + pl.stats.tech.shoot) / 3 + 2, LINES.acroGoal, LINES.acroMiss, LINES.acroMiss);
  if (out === "card") m.stats.us.cards++;
  if (out === "decoy") teammateFinish(0.3, ["{mate|이/가} 빈 공간에서 마무리한다! 골!", "내가 비운 자리로 {mate|이/가} 뛰어들었다! 골!"], LINES.assistMiss, false);   // 도움은 아니지만 공간을 만든 몫
  if (out === "pkAgainst") concede(0.74, LINES.pkAgainstGoal, LINES.pkAgainstSave);
  if (out === "turnover") concede(0.1, pd.sit.poss === "them" ? LINES.leakGoal : LINES.turnoverGoal, null);
  if (out === "danger") concede(0.38, LINES.dangerGoal, LINES.dangerSave);

  // 경기 흐름: 내 선택이 통하면 우리 쪽으로, 막히면 상대 쪽으로. 흐름을 탄 팀은 공격 기회가 한 번 더 생기기도 함
  const big = ["shot", "chip", "head", "tapIn", "pk", "longShot", "acro", "win", "killPass", "assist"].includes(out);
  const bad = ["danger", "turnover", "pkAgainst", "card"].includes(out);
  const before = m.flow || 0;
  m.flow = clamp(before * 0.7 + (ok ? (big ? 0.32 : 0.2) : (bad ? -0.32 : -0.14)), -1, 1);
  if (m.flow >= 0.45 && before < 0.45) lines.push({ t: pick(FLOW.up), k: "stat", minute: min });
  if (m.flow <= -0.45 && before > -0.45) lines.push({ t: pick(FLOW.down), k: "stat", minute: min });
  if (ok && chance(0.22 + Math.max(0, m.flow) * 0.25)) addAttack(m, "ours", min + int(1, 3));
  if (!ok && bad && chance(0.15 + Math.max(0, -m.flow) * 0.25)) addAttack(m, "theirs", min + int(1, 3));

  m.pending = null;
  m.feed.push(...lines);
  return { ok, outcome: out, lines };
}

const VALUE = { goal: 1, chip: 0.45, shot: 0.35, head: 0.3, assist: 0.45, killPass: 0.55, keyPass: 0.3, win: 0.3, keep: 0.1, miss: 0, turnover: -0.12, danger: -0.38,
  tapIn: 0.6, pk: 1, matePk: 0.6, setPiece: 0.2, offside: -0.05, pkAgainst: -0.75, longShot: 0.2, acro: 0.35, card: -0.15, decoy: 0.25 };
function autoChoice(m) {
  const pd = m.pending;
  let best = 0, bestV = -9;
  pd.list.forEach((c, i) => {
    const p = pd.choices[i].p;
    const v = p * (VALUE[c.win] ?? 0) + (1 - p) * (VALUE[c.lose] ?? 0);
    if (v > bestV) { bestV = v; best = i; }
  });
  return best;
}

function autoPlay(state, m) {
  let guard = 0;
  while (!m.done && guard++ < 300) {
    if (m.pending) resolve(state, m, autoChoice(m));
    else next(state, m);
  }
}

const rec0 = state => state.record;

// 경기 중 부상 문장
const INJURY_LINES = {
  ankle: { cause: "경기 중 상대 태클에 발목이 꺾였다.",
    lines: ["{me|이/가} 상대 태클에 걸려 넘어졌다. 발목을 붙잡고 일어나지 못한다.", "착지하던 {me}의 발목이 안쪽으로 꺾였다. 표정이 일그러진다."],
    after: ["동료의 부축을 받아 절뚝이며 경기장을 빠져나간다.", "벤치에서 얼음찜질을 한다. 발목이 금세 부어오른다."] },
  hamstring: { cause: "전력 질주 중 허벅지 뒤가 당겼다.",
    lines: ["전력으로 뛰던 {me|이/가} 갑자기 멈춰 선다. 허벅지 뒤를 잡는다.", "{me|이/가} 공을 쫓다가 다리를 절기 시작한다. 햄스트링이다."],
    after: ["더 뛰겠다고 했지만 감독님은 고개를 저으셨다.", "벤치에 앉아 수건을 머리에 덮는다."] },
  knee: { cause: "몸싸움 끝에 무릎을 다쳤다.",
    lines: ["경합 끝에 넘어진 {me|이/가} 무릎을 감싸 쥔다. 경기가 멈췄다.", "{me}의 무릎이 상대와 부딪혔다. 쉽게 일어나지 못한다."],
    after: ["들것이 들어왔다. 관중석이 조용해진다.", "부축을 받고 나가며 하늘을 올려다본다."] },
};

// ── 경기 끝 ─────────────────────────
function finishMatch(state, m) {
  const p = state.player, fx = m.fx;
  const [gf, ga] = m.score;
  let shootout = null;
  if (fx.ko && gf === ga) {
    const pw = 0.5 + (m.ours - m.theirs) / 80 + (m.onPitch ? (p.stats.tech.shoot - 50) / 400 : 0);
    const win = chance(clamp(pw, 0.2, 0.8));
    const k = int(3, 5);
    shootout = win ? { win, us: k, them: k - 1 } : { win, us: k - 1, them: k };
    m.feed.push({ t: `승부차기 ${shootout.us} : ${shootout.them}. ${win ? "이겼다!" : "졌다…"}`, k: win ? "goal-us" : "goal-them", minute: LENGTH });
  }

  noteOpp(state, m);                               // 상대 에이스 맞대결 기록
  let minutes = m.status === "start" ? LENGTH : m.status === "sub" ? LENGTH - m.minIn : 0;
  if (m.injured) minutes = Math.max(1, m.injured.minute - (m.status === "sub" ? m.minIn : 0));
  // 후반 승부처 골 (55분 이후, 동점을 만들거나 앞서게 한 내 골)
  let clutch = 0;
  { let a = 0, b = 0;
    for (const g of m.goalsLog.slice().sort((x, y) => x.minute - y.minute)) {
      if (g.team === "us") { const before = a - b; a++; if (g.me && g.minute >= 55 && before <= 0 && a - b >= 0) clutch++; } else b++;
    } }
  if (clutch) rec0(state).clutchGoals = (rec0(state).clutchGoals || 0) + clutch;
  let rating = null;
  if (minutes > 0) {
    let r = 6.1 + m.my.delta * 0.66 + (gf > ga ? 0.3 : gf < ga ? -0.3 : 0) + normal(0, 0.2);
    if (p.position === "DF" && ga === 0) r += 0.3;
    if (minutes < 25) r = 6 + (r - 6) * 0.6;
    rating = Math.round(clamp(r, 4, 10) * 10) / 10;
  }
  const result = gf > ga ? "승" : gf < ga ? "패" : (shootout ? (shootout.win ? "승" : "패") : "무");
  const mom = rating != null && rating >= 8 && result !== "패";

  const rec = state.record;
  if (minutes > 0) {
    rec.apps++; if (m.status === "start") rec.starts++;
    rec.goals += m.my.goals; rec.assists += m.my.assists; rec.ratings.push(rating);
    if (mom) rec.mom = (rec.mom || 0) + 1;
    state.relations.coach = clamp(state.relations.coach + (rating - 6.6) * 0.8, 0, 100);
    p.condition.fatigue = clamp(p.condition.fatigue + 16 * minutes / LENGTH, 0, 100);
    if (m.my.goals) applyGain(state, "mental.confidence", m.my.goals * 1.2, { raw: true });
    applyGain(state, "mental.competitive", 0.4, { raw: true });
    if (rating >= 7.5) applyGain(state, "mental.confidence", 0.5, { raw: true });
    if (rating < 5.8) applyGain(state, "mental.confidence", -0.6, { raw: true });
  }
  p.condition.morale = clamp(p.condition.morale + (result === "승" ? 6 : result === "패" ? -5 : 0)
    + (m.onPitch ? 0 : -3) + (mom ? 5 : 0), 0, 100);

  const notes = applyResult(state, fx, gf, ga, { shootoutWin: shootout?.win ?? null, rating,
    my: { goals: m.my.goals, assists: m.my.assists, ok: m.my.successes, n: m.my.decisions, pos: p.position, phys: m.physGap || 0 } });

  const res = {
    turn: m.turn, grade: m.grade, comp: fx.compLabel, compId: fx.comp, round: fx.round, official: fx.official,
    opponent: fx.opponent.name, gf, ga, result, status: m.status, minutes, goals: m.my.goals, assists: m.my.assists,
    rating, reason: m.reason, shootout, mom, school: fx.school?.name || null,
    possession: m.stats.poss, shots: [m.stats.us.shots, m.stats.them.shots], involved: m.my.involved || 0, stops: m.my.stops || 0,
    injury: m.injured || null, clutch, elementary: !!fx.elementary, ko: !!fx.ko,
    decisions: m.my.decisions, successes: m.my.successes,
  };
  rec.matches.push(res);
  matchMails(state, m, res, notes);
  res.notes = notes.map(n => typeof n === "string" ? n : n.title);
  return res;
}

return { LENGTH, MY_SLOT, HALF, STATUS_LABEL, fill, eligibility, tagFit, TAG_LABEL, choiceTag, timingKind, timingOf, prepareMatch, next, statLine, prob, resolve, autoChoice, autoPlay, finishMatch };
})();
(__fix["js/engine/match.js"] || []).forEach(f => f());

// ── data/events.js
__m["data/events.js"] = (function () {
const {CAPTAINS} = __m["data/roster.js"];
const {turnInfo} = __m["js/engine/calendar.js"];
const {pick} = __m["js/rng.js"];



// 이번 주(이벤트가 보이는 주)에 경기가 있는지 / 다음 주에 정기시험이 있는지
const matchWeek = s => !!turnInfo(s)?.match;
const examNextWeek = s => { const n = turnInfo(s, 1); return !!n?.exam && !n.exam.free; };
const lastMatch = s => { const m = s.record.matches.at(-1); return m && s.calendar.turn - m.turn <= 1 ? m : null; };
// 랜덤 이벤트. 한 주가 끝날 때 가끔 하나씩 일어납니다.
//
// who   : 말하는 사람 (coach 감독, assistant 코치, teacher 담임, mom 엄마, dad 아빠,
//         friend 친구, rival 라이벌, mentor 멘토 선배, junior 후배, narr 해설)
// when  : grades 학년, months 달 (없으면 아무 때나)
// needs : 이 사람이 있어야 일어남 (friend, rival, mentor, junior)
// cond  : 추가 조건 (게임 상태를 보고 true/false)
// school: true면 방학 중에는 안 나옴
// fixed : true면 무작위로 뽑히지 않고 data/calendar.js 의 SCHOOL_DAYS 일정에만 나옴
// fx.teacher: 류봉두 선생님과의 관계 / hurt: { p 확률, type 부상 종류, cause, result } 다칠 수 있는 선택
// text, result 자리에 (s) => 문장 함수를 쓰면 상황에 따라 문장이 달라집니다
// bg    : 배경 그림 이름 (assets/img/). 있으면 글 상자 뒤에 그림이 깔립니다
// urgent: true면 조건이 맞을 때 무작위 이벤트보다 먼저 찾아옴 (경기 뒤 면담 등)
// weight: 뽑힐 확률 비중 (기본 1) / once: true면 한 번만
// text  : 상황. {name} 나, {friend} {rival} {mentor} {junior} 각 인물, {coach} {assistant} {teacher}
// choices: label 선택지, fx 효과, result 결과 문장
//   fx: s 능력치 {"tech.shoot": 1}, fatigue 피로, morale 사기, coach 감독 신뢰, rel 관계 {friend: 5}

const EVENTS = [
  // ── 학교생활 ──────────────────────────────────
  { id: "group_project", school: true, who: "friend", needs: "friend", weight: 1.2,
    text: "야, 사회 수행평가 모둠 과제 이번 주까지래. 우리 둘이 같은 모둠인데… 너 훈련 끝나고 시간 돼?",
    choices: [
      { label: "밤에 같이 끝내자", fx: { s: { "student.academic": 2, "student.attitude": 1 }, fatigue: 8, rel: { friend: 6 } }, result: "밤 11시까지 편의점 테이블에서 PPT를 만들었다. 발표 점수가 꽤 잘 나왔다." },
      { label: "미안, 네가 좀 해 줘", fx: { s: { "student.attitude": -1.5 }, rel: { friend: -8 } }, result: "{friend|이/가} 혼자 다 했다. 발표 날 눈을 안 마주친다." },
    ] },
  { id: "sports_day", bg: "ev_sportsday", who: "teacher", school: true, when: { months: [10] }, once: true,
    text: "2학기 학급 대항 줄다리기 날. {teacher}께서 부르신다. \"{given|아/야}, 반 아이들이 맨 앞자리를 너한테 맡기자는데?\"",
    choices: [
      { label: "맡겠습니다", fx: { s: { "student.attitude": 1.5, "phys.strength": 0.5 }, fatigue: 6, morale: 6 }, result: "구령에 맞춰 버텼다. 마지막 한 뼘에서 우리 반이 끌려가지 않았다. 반 아이들이 한꺼번에 달려들었다." },
      { label: "다치면 안 돼서요…", fx: { s: { "student.attitude": -0.5 }, fatigue: -3 }, result: "선생님은 웃으며 괜찮다고 하셨지만, 반 단톡방은 조용했다." },
    ] },
  { id: "phone_confiscated", school: true, who: "teacher", cond: s => s.player.stats.student.attitude < 60,
    text: "수업 중에 하이라이트 영상을 보다가 {teacher}께 걸렸다. \"휴대폰은 종례 때 찾아가.\"",
    choices: [
      { label: "죄송합니다. 반성문 쓰겠습니다", fx: { s: { "student.attitude": 1.5 } }, result: "반성문 한 장. 선생님이 \"다음엔 쉬는 시간에 봐\" 하며 휴대폰을 돌려주셨다." },
      { label: "축구 공부였다고 말한다", fx: { s: { "student.attitude": -2 }, morale: -3 }, result: "변명이 통하지 않았다. 감독님 귀에도 들어갔다.", fxAfter: { coach: -2 } },
    ] },
  { id: "class_president", school: true, who: "teacher", when: { months: [3] }, once: true, cond: s => s.player.stats.student.attitude >= 60,
    text: "반장 선거에 너를 추천하는 애들이 있더라. 운동하면서 할 수 있겠니?",
    choices: [
      { label: "해 보겠습니다", fx: { s: { "student.attitude": 3, "mental.teamwork": 1 }, fatigue: 5 }, result: "반장이 됐다. 아침 조회를 맡게 됐다. 바쁘지만 뿌듯하다." },
      { label: "운동에 집중할게요", fx: { morale: 2 }, result: "선생님은 고개를 끄덕이셨다. \"그래, 그것도 용기야.\"" },
    ] },
  { id: "field_trip", school: true, who: "narr", when: { months: [5, 10] }, once: true,
    text: "학년 체험학습 날. 나로우주센터 견학이다. 그런데 그날 오후에 팀 자율 훈련이 잡혀 있다.",
    choices: [
      { label: "체험학습에 끝까지 간다", fx: { morale: 8, fatigue: -8, s: { "student.academic": 1 } }, result: "로켓 발사대 앞에서 친구들과 사진을 찍었다. 오랜만에 축구 생각이 안 났다." },
      { label: "오후엔 빠져서 훈련한다", fx: { s: { "position": 0.6 }, coach: 1.5, morale: -3 }, result: "혼자 운동장에 남아 슈팅 50개. 감독님이 멀리서 보고 계셨다." },
    ] },
  { id: "late_school", school: true, who: "narr", cond: s => s.player.condition.fatigue >= 55,
    text: "아침 알람을 세 번 껐다. 눈을 뜨니 8시 25분.",
    choices: [
      { label: "택시 타고 간다 (용돈 손해)", fx: { morale: -2 }, result: "겨우 출석. 이번 달 용돈이 반으로 줄었다." },
      { label: "지각하고 혼난다", fx: { s: { "student.attitude": -2 }, fatigue: -6 }, result: "벌점 1점. 그래도 몸은 좀 개운하다. 알람을 세 번이나 끈 건 피로가 쌓였다는 신호다." },
    ] },
  { id: "library_book", school: true, who: "teacher", when: { grades: [1, 2] },
    text: "도서관에 새로 들어온 축구 선수 자서전 있던데, 읽어 볼래? 독후감 쓰면 수행평가에도 들어가.",
    choices: [
      { label: "빌려서 읽는다", fx: { s: { "mental.focus": 1, "student.academic": 1.5, "mental.confidence": 0.5 }, fatigue: -2 }, result: "\"남들이 쉴 때 한 번 더 찼다\"는 문장에 밑줄을 그었다." },
      { label: "시간 없어서 패스", fx: {}, result: "책은 다른 반 친구가 빌려 갔다." },
    ] },
  { id: "exam_night", school: true, who: "friend", needs: "friend", cond: s => s.player.stats.student.academic < 60 && examNextWeek(s),
    text: "다음 주 시험인데 나 수학 하나도 모르겠다… 같이 공부할래? 대신 내가 떡볶이 쏜다.",
    choices: [
      { label: "도서관 가자", fx: { s: { "student.academic": 3 }, fatigue: 4, rel: { friend: 5 } }, result: "서로 모르는 걸 물어보다 보니 의외로 머리에 남았다." },
      { label: "난 그냥 훈련할래", fx: { s: { "position": 0.4 }, rel: { friend: -3 } }, result: "{friend|은/는} 혼자 도서관에 갔다." },
    ] },

  // ── 축구부 ────────────────────────────────────
  { id: "senior_errand", who: "mentor", needs: "mentor", when: { grades: [1] },
    text: "야 1학년, 물통 좀 채워 와라. 콘도 정리하고.",
    choices: [
      { label: "네! 바로 하겠습니다", fx: { s: { "student.attitude": 1 }, fatigue: 3, rel: { mentor: 6 } }, result: "선배가 어깨를 툭 쳤다. \"너 괜찮네.\"" },
      { label: "오늘 당번 아닌데요…", fx: { rel: { mentor: -8 }, morale: -2 }, result: "선배 표정이 굳었다. 그날 훈련 내내 패스가 안 왔다." },
    ] },
  { id: "rainy_training", who: "assistant",
    text: "비가 이렇게 오는데 훈련할 사람? 자율이다. 안 나와도 뭐라 안 한다.",
    choices: [
      { label: "비 맞으며 훈련", fx: { s: { "mental.competitive": 1, "tech.firstTouch": 0.6 }, fatigue: 10, coach: 2 }, result: "젖은 잔디에서 공이 미끄러진다. 그래서 터치가 더 늘었다." },
      { label: "실내에서 영상 분석", fx: { s: { "mental.focus": 1 }, fatigue: -4 }, result: "지난 경기 영상을 돌려 봤다. 내가 공 없을 때 너무 서 있었다." },
      { label: "집에 가서 쉰다", fx: { fatigue: -12, coach: -1 }, result: "따뜻한 라면 한 그릇. 몸이 풀린다." },
    ] },
  { id: "night_shooting", who: "coach", cond: s => s.relations.coach >= 55,
    text: "너, 남아서 슈팅 100개 찰 수 있냐? 다른 애들한테는 말 안 했다.",
    choices: [
      { label: "100개 차겠습니다", fx: { s: { "tech.shoot": 2, "mental.confidence": 0.5 }, fatigue: 14, coach: 3 }, result: "다리가 후들거렸지만 마지막 10개가 제일 잘 들어갔다." },
      { label: "오늘은 너무 지쳤습니다", fx: { fatigue: -4, coach: -1 }, result: "\"그래, 몸이 먼저다.\" 말은 그렇게 하셨지만 아쉬운 표정이었다." },
    ] },
  { id: "torn_boots", who: "narr",
    text: "축구화 밑창이 떨어졌다. 새 축구화는 20만 원이 넘는다.",
    choices: [
      { label: "엄마한테 말한다", fx: { morale: 3, rel: {} }, result: "엄마가 한숨을 쉬더니 주말에 같이 순천 가자고 했다. 새 축구화, 발이 가볍다.", fxAfter: { s: { "tech.firstTouch": 0.5 } } },
      { label: "테이프 감고 버틴다", fx: { s: { "mental.competitive": 0.8 }, morale: -2 }, result: "흰 테이프를 칭칭 감았다. 다들 웃었지만 상관없다." },
    ] },
  { id: "pro_match", who: "dad", when: { months: [4, 5, 9, 10] }, cond: s => !matchWeek(s),
    text: "이번 주말에 광양 가서 프로 경기 볼래? 표 두 장 생겼다.",
    choices: [
      { label: "같이 간다", fx: { s: { "mental.focus": 1, "mental.confidence": 0.5 }, morale: 8, fatigue: -5 }, result: "같은 포지션 선수만 90분 내내 봤다. 공 없을 때 움직임이 전혀 달랐다." },
      { label: "훈련하겠다고 한다", fx: { s: { "position": 0.5 }, morale: -2 }, result: "아빠는 \"그래, 다음에 가자\" 하고 혼자 웃었다." },
    ] },
  { id: "rival_bench", who: "rival", needs: "rival", cond: s => s.relations.people?.rival,
    text: "이번 주 연습경기에 감독님이 나를 네 자리에 세운대. 미안하다, 근데 양보 안 한다.",
    choices: [
      { label: "\"나도 안 진다\"", fx: { s: { "mental.competitive": 1.5 }, rel: { rival: 6 }, morale: 2 }, result: "둘 다 웃었다. 그날 미니게임은 거의 싸움이었다." },
      { label: "속으로 삭인다", fx: { morale: -5, s: { "mental.focus": 0.5 } }, result: "말없이 축구화 끈만 다시 맸다." },
    ] },
  { id: "rival_injury", who: "narr", needs: "rival", once: true,
    text: "{rival|이/가} 훈련 중 발목을 접질렸다. 일주일은 못 뛴다고 한다.",
    choices: [
      { label: "병원에 찾아간다", fx: { rel: { rival: 15, friend: 3 }, s: { "mental.teamwork": 1 } }, result: "\"빨리 와라. 너 없으니까 재미없다.\" {rival|이/가} 피식 웃었다." },
      { label: "이번이 기회라고 생각한다", fx: { s: { "mental.competitive": 1 }, coach: 1, rel: { rival: -5 } }, result: "그 주 훈련에서 유난히 많이 뛰었다. 마음 한쪽이 조금 불편했다." },
    ] },
  { id: "mentor_tip", who: "mentor", needs: "mentor", cond: s => s.relations.people?.mentor?.value >= 55,
    text: "너 공 받기 전에 어깨 너머로 한 번 봐라. 그거 하나로 달라진다. 나도 작년에 감독님한테 배운 거다.",
    choices: [
      { label: "그 자리에서 따라 해 본다", fx: { s: { "tech.firstTouch": 1, "mental.focus": 1 }, rel: { mentor: 5 } }, result: "고개를 한 번 돌렸을 뿐인데 다음 패스가 보였다." },
      { label: "고맙다고만 한다", fx: { rel: { mentor: 2 } }, result: "선배가 \"꼭 해 봐라\" 하고 돌아섰다." },
    ] },
  { id: "senior_mistake", who: "narr", needs: "mentor", when: { grades: [1, 2] },
    text: "라커룸 정리를 안 한 게 걸렸다. 사실 {mentor} 선배가 마지막에 나갔다. 감독님이 우리 학년을 보며 물으신다. \"누구야?\"",
    choices: [
      { label: "제가 했습니다 (대신 혼난다)", fx: { coach: -1, rel: { mentor: 12 }, s: { "mental.teamwork": 1 } }, result: "운동장 다섯 바퀴. 다음 날 선배가 몰래 음료수를 줬다." },
      { label: "사실대로 말한다", fx: { coach: 1, rel: { mentor: -10 } }, result: "감독님은 고개를 끄덕이셨다. 선배와는 한동안 어색했다." },
    ] },
  { id: "junior_slump", who: "junior", needs: "junior",
    text: "형… 저 축구 그만둘까 봐요. 경기도 못 나가고 엄마도 공부하래요.",
    choices: [
      { label: "내 중1 얘기를 해 준다", fx: { rel: { junior: 12 }, s: { "mental.teamwork": 1, "student.attitude": 0.5 }, fatigue: 2 }, result: "{junior|이/가} 한참 듣더니 \"내일도 나올게요\" 했다." },
      { label: "감독님께 말해 보라고 한다", fx: { rel: { junior: 3 } }, result: "{junior|은/는} 고개만 끄덕였다." },
    ] },
  { id: "junior_ask", who: "junior", needs: "junior",
    text: "형, 저 왼발 슈팅 좀 봐 주시면 안 돼요? 10분만요.",
    choices: [
      { label: "30분 봐 준다", fx: { rel: { junior: 8 }, s: { "tech.shoot": 0.5, "mental.teamwork": 0.5 }, fatigue: 5 }, result: "가르치다 보니 내 자세도 고쳐졌다." },
      { label: "오늘은 피곤하다", fx: { rel: { junior: -5 }, fatigue: -3 }, result: "{junior|은/는} 혼자 골대 앞으로 갔다." },
    ] },
  { id: "coach_talk", who: "coach", cond: s => s.relations.coach < 45,
    text: "잠깐 와 봐라. 요즘 너 훈련 태도, 스스로는 어떻게 생각하냐?",
    choices: [
      { label: "솔직하게 부족했다고 말한다", fx: { coach: 4, s: { "student.attitude": 1 } }, result: "\"알면 됐다. 내일부터 보여 줘라.\"" },
      { label: "출전 기회를 달라고 한다", fx: { coach: -2, s: { "mental.confidence": 1 } }, result: "\"기회는 훈련에서 만드는 거다.\" 감독님은 그 말만 하셨다." },
    ] },
  { id: "video_analysis", who: "assistant", cond: s => s.record.apps >= 3 && lastMatch(s)?.minutes > 0,
    text: "지난 경기에서 네가 나온 장면만 모아 봤다. 같이 볼래?",
    choices: [
      { label: "끝까지 같이 본다", fx: { s: { "mental.focus": 1.5 }, coach: 1, fatigue: -2 }, result: "실수한 장면을 다섯 번 돌려 봤다. 다음엔 안 그럴 것 같다." },
      { label: "잘한 장면만 보고 싶다", fx: { s: { "mental.confidence": 1 } }, result: "골 장면만 세 번 봤다. 기분은 좋다." },
    ] },
  { id: "palyeong_hike", who: "coach", when: { months: [3, 9, 12, 1] },
    text: "이번 주 체력 훈련은 팔영산이다. 정상까지 뛰어서 간다.",
    choices: [
      { label: "선두로 뛴다", fx: { s: { "phys.stamina": 1.5, "mental.competitive": 0.5 }, fatigue: 12, coach: 2 }, result: "정상에서 내려다본 다도해. 숨이 턱까지 찼지만 1등이었다." },
      { label: "페이스 조절한다", fx: { s: { "phys.stamina": 0.8 }, fatigue: 5 }, result: "중간쯤 들어왔다. 다리는 멀쩡하다." },
    ] },
  // 경기에서 지면 다음 주에 자주 나옵니다 (엔진이 패배 직후 확률을 크게 올림)
  { id: "beach_training", bg: "ev_beach", who: "assistant", afterLoss: true, when: { months: [3, 4, 5, 6, 7, 8, 9, 10] },
    cond: s => { const m = s.record.matches.at(-1); return !!m && m.result === "패" && s.calendar.turn - m.turn <= 2; },
    text: () => pick(["지난 경기 그렇게 지고 그냥 넘어갈 순 없지. 오늘은 해변 모래 훈련이다. 다리 터질 각오 해라.",
      "진 경기는 모래가 기억하게 한다. 신발 벗고 따라와.", "오늘은 공 없다. 해변 끝까지 왕복이다. 지난 경기 실점 장면 떠올리면서 뛰어라."]),
    choices: [
      { label: "끝까지 버틴다", fx: { s: { "phys.strength": 1, "phys.agility": 0.8, "mental.competitive": 0.6 }, fatigue: 14, morale: 3 }, result: "모래에 발이 푹푹 빠진다. 마지막 왕복에서 다들 소리를 질렀다. 진 건 진 거고, 다음은 다음이다." },
      { label: "중간에 쉬었다 한다", fx: { s: { "phys.strength": 0.5 }, fatigue: 6 }, result: "파도 소리가 들렸다. 그래도 지난 경기 장면이 자꾸 떠올랐다." },
    ] },
  { id: "team_dinner", bg: "ev_dinner", who: "narr", once: true,
    cond: s => !(s.flags.lastCelebration && s.calendar.turn - s.flags.lastCelebration <= 6) && ((s.tour && !s.tour.alive && s.tour.grade === s.calendar.grade && s.calendar.turn - (s.record.matches.at(-1)?.turn ?? 0) <= 2)
      || (s.league?.finished && s.calendar.turn - (s.record.matches.at(-1)?.turn ?? 0) <= 2)),
    text: "대회가 끝나고 감독님이 삼겹살을 쏘신다고 했다. 마침 그날 가족 외식 약속이 있다.",
    choices: [
      { label: "팀 회식에 간다", fx: { s: { "mental.teamwork": 1.5 }, morale: 5, rel: { mentor: 3, friend: 3, junior: 3 } },
        result: s => s.calendar.grade === 3 ? "이번엔 내가 고기를 구웠다. 후배들이 젓가락을 들고 줄을 섰다." : "선배들이 고기를 구워 줬다. 처음으로 팀이 가족 같았다." },
      { label: "가족 외식에 간다", fx: { morale: 6, fatigue: -6 }, result: "엄마가 \"요즘 얼굴 좋아졌다\"며 웃었다." },
    ] },
  { id: "number_envy", who: "rival", needs: "rival", when: { grades: [2] },
    text: "내년에 10번 누가 달까? 난 이미 감독님한테 말해 놨다.",
    choices: [
      { label: "나도 노린다고 말한다", fx: { s: { "mental.competitive": 1 }, rel: { rival: 4 } }, result: "둘 다 웃었지만 눈은 웃고 있지 않았다." },
      { label: "번호는 상관없다고 한다", fx: { s: { "mental.focus": 0.5 } }, result: "{rival|이/가} \"너답다\" 하고 어깨를 쳤다." },
    ] },
  { id: "scout_rumor", who: "friend", needs: "friend", when: { grades: [3] }, cond: s => Object.keys(s.scouting || {}).length > 0,
    text: "야, 저번에 온 고등학교 감독님이 네 이름 물어봤다던데? 진짜야?",
    choices: [
      { label: "더 열심히 해야겠다", fx: { s: { "mental.confidence": 1 }, morale: 5 }, result: "괜히 그날 훈련 내내 몸이 가벼웠다." },
      { label: "괜히 부담된다", fx: { morale: -2, s: { "mental.focus": 0.5 } }, result: "잠자리에 누워서도 그 말이 맴돌았다." },
    ] },

  // ── 가족 ──────────────────────────────────────
  { id: "mom_birthday", who: "narr", once: true,
    text: "오늘이 엄마 생일이다. 훈련 끝나면 저녁 7시. 선물은 아직 못 샀다.",
    choices: [
      { label: "훈련을 일찍 마치고 케이크를 산다", fx: { morale: 8, coach: -1, fatigue: -4 }, result: "엄마가 울 것 같은 얼굴로 웃었다. 케이크 위 초가 흔들렸다." },
      { label: "편지를 써서 식탁에 둔다", fx: { morale: 5, s: { "student.academic": 0.5 } }, result: "다음 날 아침, 편지가 냉장고에 붙어 있었다." },
    ] },
  { id: "dad_busy", who: "dad", when: { months: [5, 9] }, cond: matchWeek,
    text: "이번 경기엔 일 때문에 못 가겠다. 미안하다. 대신 끝나면 전화해라.",
    choices: [
      { label: "괜찮다고 한다", fx: { morale: 1 }, result: "경기 끝나고 전화를 했다. 아빠는 점수를 이미 알고 있었다. 단톡방을 보고 있었던 거다." },
      { label: "서운하다고 말한다", fx: { morale: -3 }, result: "아빠가 한참 말이 없었다. 다음 주 경기엔 맨 앞줄에 계셨다.", fxAfter: { morale: 6 } },
    ] },
  { id: "mom_worry", who: "mom", cond: s => s.player.stats.student.academic < 45,
    text: "성적표 봤어. 축구도 좋지만… 엄마는 네가 공부를 아예 놓을까 봐 무서워.",
    choices: [
      { label: "주 1회는 꼭 공부하겠다고 약속한다", fx: { s: { "student.academic": 2 }, morale: 2 }, result: "엄마가 손가락을 걸자고 했다. 좀 유치했지만 걸었다." },
      { label: "축구로 성공하면 된다고 한다", fx: { morale: -4, s: { "mental.competitive": 0.5 } }, result: "엄마는 대답 대신 설거지를 시작했다." },
    ] },
  { id: "allowance", who: "mom",
    text: "이번 달 용돈이다. 아껴 써라.",
    choices: [
      { label: "닭가슴살과 단백질 음료를 산다", fx: { s: { "phys.strength": 0.6 }, morale: -1 }, result: "맛은 없다. 근데 형들이 다 이렇게 했다더라." },
      { label: "친구들과 PC방에 간다", fx: { morale: 6, fatigue: -4, rel: { friend: 4 } }, result: "오랜만에 크게 웃었다." },
      { label: "축구 영상 강의를 결제한다", fx: { s: { "mental.focus": 1, "tech.pass": 0.4 } }, result: "패스 각도 강의를 세 번 돌려 봤다." },
    ] },
  { id: "sibling_exam", who: "narr", once: true, when: { months: [11] },
    text: "이번 주는 고3 누나의 수능이다. 집안 분위기가 무겁다. 엄마가 이번 주엔 조용히 지내 달라고 했다.",
    choices: [
      { label: "누나 도시락 심부름을 한다", fx: { morale: 4, s: { "student.attitude": 1 } }, result: "수능 끝나고 누나가 축구화 끈을 사 줬다." },
      { label: "도서관에 늦게까지 남는다", fx: { s: { "student.academic": 2 }, fatigue: 3 }, result: "조용한 도서관이 의외로 잘 맞았다." },
    ] },
  // ── 경기 뒤 개인 면담 (urgent: 조건이 맞으면 다음 주에 먼저 찾아옴) ──
  { id: "co_scold", bg: "ev_office", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.rating != null && m.rating < 5.9 && !m.elementary; },
    text: "감독실. 감독님께서 아무 말 없이 지난 경기 영상을 틀어 놓으셨다. 내가 공을 뺏기는 장면에서 화면이 멈춘다. \"이게 너냐?\"",
    choices: [
      { label: "변명 없이 끝까지 듣는다", fx: { coach: 4, morale: -4, s: { "mental.focus": 1 } }, result: "한 장면씩 짚으실 때마다 얼굴이 뜨거워졌다. 나올 때 감독님이 어깨를 한 번 두드리셨다." },
      { label: "\"컨디션이 안 좋았어요\"", fx: { coach: -3, morale: 2 }, result: "\"컨디션은 네가 만드는 거다.\" 감독님 목소리가 한 톤 낮아졌다." },
      { label: "다음 경기에서 보여 드리겠다고 한다", fx: { coach: 1, morale: -1, s: { "mental.competitive": 1.5 } }, result: "\"말은 쉽다. 훈련장에서 보자.\" 그래도 감독님 입꼬리가 아주 조금 올라간 것 같았다." },
    ] },
  { id: "co_scold_elem", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.elementary && m.result !== "승" && !(m.reason || "").includes("부상"); },
    text: "{coach}: \"동생들한테 그 결과는 아니지. 다들 운동장 열 바퀴부터 돌고 와.\" 동기들이 한숨을 쉰다.",
    choices: [
      { label: "말없이 맨 앞에서 뛴다", fx: { coach: 3, fatigue: 8, s: { "phys.stamina": 1 } }, result: "맨 앞에서 뛰니 뒤에서 하나둘 속도를 맞춰 왔다. 열 바퀴째에 감독님이 고개를 끄덕이셨다." },
      { label: "동기들에게 같이 뛰자고 소리친다", fx: { fatigue: 6, rel: { friend: 4 }, s: { "mental.teamwork": 1.5 } }, result: "\"한 바퀴만 더!\" 소리가 운동장을 몇 번 돌았다. 다 뛰고 나니 이상하게 웃음이 났다." },
      { label: "\"걔네가 잘했던 거예요\"", fx: { coach: -4, morale: 2 }, result: "\"그래, 그럼 너희는 못한 거다.\" 다섯 바퀴가 더 붙었다." },
    ] },
  { id: "co_scold_attitude", bg: "ev_office", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return s.player.stats.student.attitude < 45 && m && m.turn >= s.calendar.turn - 1 && m.rating != null && m.rating < 6.5; },
    text: "{coach}: \"담임 선생님께 전화 받았다. 수업 시간에 엎드려 있다며. 경기장에서도 그게 보이더라.\"",
    choices: [
      { label: "잘못했다고 말씀드린다", fx: { coach: 3, s: { "student.attitude": 2 }, teacher: 2 }, result: "\"축구는 교실에서부터다.\" 짧은 말이 오래 남았다." },
      { label: "피곤해서 그랬다고 말한다", fx: { coach: -2, fatigue: -4 }, result: "\"다들 피곤하다.\" 감독님은 더 말씀하지 않으셨다. 그게 더 무서웠다." },
    ] },
  { id: "co_praise", bg: "ev_office", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.rating != null && m.rating >= 8.0; },
    text: "훈련이 끝나고 감독님께서 부르셨다. \"앉아 봐라. 혼내려는 거 아니다. 지난 경기, 잘했다.\"",
    choices: [
      { label: "꾸벅 감사 인사를 한다", fx: { morale: 6, coach: 2 }, result: "\"고맙긴. 네가 한 거다.\" 짧은 한마디였는데, 집에 가는 길 내내 발걸음이 가벼웠다." },
      { label: "부족했던 점을 여쭤본다", fx: { coach: 4, s: { "mental.focus": 1.5 } }, result: "감독님이 한참 웃으셨다. \"그 질문이 나오는 게 네가 크는 이유다.\" 그리고 세 가지를 짚어 주셨다." },
      { label: "동료들 덕분이라고 말한다", fx: { coach: 2, rel: { friend: 3 }, s: { "mental.teamwork": 1.5 } }, result: "\"그 말, 팀 앞에서도 해라.\" 다음 날 훈련 전, 감독님이 내 말을 그대로 전하셨다." },
    ] },
  { id: "as_praise", urgent: true, who: "assistant",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.decisions >= 4 && m.successes / m.decisions >= 0.75 && (m.rating ?? 0) < 8.0 && (s.eventLog?.as_praise == null || s.calendar.turn - s.eventLog.as_praise >= 20); },
    text: "코치님께서 태블릿을 내미셨다. \"지난 경기 네 선택만 쭉 모아 봤다. 이번엔 맞힌 게 더 많더라. 오늘은 칭찬할 거 위주다.\"",
    choices: [
      { label: "같이 본다", fx: { morale: 5, s: { "mental.confidence": 1.5 } }, result: "좋은 장면을 연달아 보니 어깨가 펴졌다. \"이게 네 기준이다. 여기서 내려가지 마라.\"" },
      { label: "실수한 장면도 보여 달라고 한다", fx: { coach: 2, s: { "mental.focus": 1.5 } }, result: "코치님이 잠깐 놀라시더니 실수 장면 두 개를 골라 주셨다. 고칠 게 분명해졌다." },
    ] },
  { id: "co_bench_talk", urgent: true, who: "coach",
    cond: s => { const ms = s.record.matches.filter(m => m.grade === s.calendar.grade).slice(-3); return ms.length === 3 && ms[2].turn >= s.calendar.turn - 1 && ms.every(m => ["bench", "out"].includes(m.status) && !m.reason); },
    text: "감독님께서 운동장 벤치 옆으로 부르셨다. \"세 경기째 너를 못 넣어 줬다. 서운하지?\"",
    choices: [
      { label: "솔직하게 서운하다고 한다", fx: { coach: 2, morale: 3 }, result: "\"그 마음 그대로 훈련에서 보여 줘라. 나는 거기서 정한다.\"" },
      { label: "아니라고, 괜찮다고 한다", fx: { morale: -2, s: { "mental.focus": 1 } }, result: "\"괜찮으면 안 되는 거다.\" 감독님은 그 말만 남기고 가셨다." },
      { label: "무엇을 더 하면 되는지 묻는다", fx: { coach: 4, s: { "mental.competitive": 1 } }, result: "감독님이 내 포지션에서 제일 필요한 것 하나를 짚어 주셨다. 이번 주 훈련 목표가 생겼다." },
    ] },

  // ── 소소한 학교생활 ──────────────────────────
  { id: "s_rain_pe", school: true, who: "narr", when: { months: [6, 7, 9] },
    text: "체육 시간에 비가 온다. 체육관에서 반 대항 피구를 한단다. 반 아이들이 축구부인 나를 쳐다본다.",
    choices: [
      { label: "에이스처럼 공을 던진다", fx: { morale: 5, rel: { friend: 3 } }, result: "세 명을 연달아 맞혔다. 축구부는 피구도 잘한다는 소문이 났다." },
      { label: "친구들이 던지게 양보한다", fx: { s: { "mental.teamwork": 1 }, teacher: 1 }, result: "공을 넘겨줬더니 평소 조용하던 친구가 마지막 한 명을 맞혔다. 반이 이겼다." },
    ] },
  { id: "s_bag", who: "narr", cond: s => !!lastMatch(s),
    text: "원정 다녀오는 버스에서 내렸는데, 축구화 가방이 없다. 버스는 이미 떠났다.",
    choices: [
      { label: "코치님께 바로 연락한다", fx: { coach: -1, fatigue: 2 }, result: "코치님이 기사님께 전화해 주셨다. \"다음엔 내리기 전에 자리부터 한 번 돌아봐라.\"" },
      { label: "다음 날 일찍 가서 찾는다", fx: { fatigue: 4, s: { "student.attitude": 0.5 } }, result: "새벽같이 차고지에 갔더니 가방이 맨 뒷자리에 그대로 있었다." },
    ] },
  { id: "s_cooking", school: true, who: "narr", when: { grades: [1, 2] },
    text: "기술·가정 수행평가로 조별 요리를 한다. 우리 조 메뉴는 김치볶음밥. 조원들이 칼을 나에게 넘긴다.",
    choices: [
      { label: "자신 있게 칼을 잡는다", fx: { morale: 4, s: { "student.academic": 1 } }, result: "양파가 조금 굵었지만 맛은 괜찮았다. 선생님이 \"축구부 손맛 좋네\" 하셨다." },
      { label: "설거지 담당을 맡는다", fx: { s: { "student.attitude": 1.5 }, rel: { friend: 2 } }, result: "조원들이 요리하는 동안 묵묵히 설거지를 했다. 점수는 조원들이 챙겨 줬다." },
    ] },
  { id: "s_little", who: "narr",
    text: "훈련 끝나고 운동장을 나서는데, 초등학생 몇 명이 공을 들고 다가온다. \"형, 축구부죠? 슈팅 한 번만 보여 주세요!\"",
    choices: [
      { label: "몇 개 차 주고 같이 놀아 준다", fx: { morale: 6, fatigue: 3, s: { "mental.teamwork": 1 } }, result: "해가 질 때까지 공을 찼다. 꼬마들이 내 등번호를 외우고 갔다." },
      { label: "다음에 하자고 하고 집에 간다", fx: { fatigue: -3 }, result: "아쉬워하는 얼굴들이 자꾸 떠올랐다. 다음 주에 다시 와 보기로 했다." },
    ] },
  { id: "s_phone", who: "narr",
    text: "휴대폰을 떨어뜨렸다. 액정에 거미줄이 쫙 갔다. 엄마한테 말해야 한다.",
    choices: [
      { label: "바로 솔직하게 말한다", fx: { morale: -2, s: { "student.attitude": 1 } }, result: "엄마는 한숨을 쉬셨지만 혼내지는 않으셨다. \"대신 이번 달 용돈에서 반 낸다.\"" },
      { label: "케이스로 가리고 버틴다", fx: { morale: -3 }, result: "사흘 만에 들켰다. 엄마는 액정보다 거짓말에 더 화를 내셨다." },
    ] },
  { id: "s_vote", school: true, who: "narr", when: { months: [3, 9] },
    text: "학급 체육부장을 뽑는다. 누군가 \"축구부가 해야지!\" 하며 내 이름을 칠판에 적었다.",
    choices: [
      { label: "맡겠다고 한다", fx: { s: { "mental.teamwork": 1, "student.attitude": 1 }, fatigue: 3, teacher: 2 }, result: "체육 시간마다 준비물을 챙기느라 바빠졌다. 그래도 반 아이들과 훨씬 가까워졌다." },
      { label: "훈련 때문에 어렵다고 한다", fx: { fatigue: -2 }, result: "다른 친구가 맡았다. 조금 미안했지만 훈련에 집중하기로 했다." },
    ] },
  { id: "t_hallway", who: "teacher", school: true, cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1; },
    text: "복도에서 {teacher}께서 부르신다. \"{given|아/야}, 지난 주말 경기 결과 봤다. 선생님도 축구 좀 아는 사람이야.\"",
    choices: [
      { label: "경기 이야기를 신나게 한다", fx: { teacher: 4, morale: 3 }, result: "선생님은 쉬는 시간이 끝날 때까지 들어 주셨다. \"다음 경기는 선생님도 보러 갈게.\"" },
      { label: "쑥스러워서 웃기만 한다", fx: { teacher: 2 }, result: "선생님이 웃으며 어깨를 두드리셨다. \"말 안 해도 다 안다.\"" },
    ] },
  { id: "t_essay", bg: "ev_classroom", who: "teacher", school: true, once: true, when: { months: [4, 5, 10] },
    text: "국어 시간, {teacher}께서 '나의 꿈'에 대해 한 쪽씩 써 오라고 하셨다. 집에 와서 원고지를 앞에 두고 한참을 앉아 있었다.",
    choices: [
      { label: "축구 선수의 꿈을 솔직하게 쓴다", fx: { teacher: 4, s: { "student.academic": 1, "mental.focus": 1 } }, result: "선생님이 빨간 펜으로 한 줄 남기셨다. \"꿈을 이렇게 구체적으로 쓴 글은 처음이다.\"" },
      { label: "축구 말고 다른 꿈도 함께 쓴다", fx: { teacher: 3, s: { "student.academic": 1.5 } }, result: "쓰다 보니 축구 말고도 해 보고 싶은 게 있었다. 선생님은 그 부분에 밑줄을 그어 주셨다." },
    ] },
  { id: "t_doze", who: "teacher", school: true, cond: s => s.player.condition.fatigue >= 55,
    text: "5교시 국어 시간. 눈꺼풀이 자꾸 내려온다. {teacher}께서 내 책상 옆을 지나가시다 멈추셨다.",
    choices: [
      { label: "벌떡 일어나 뒤에 서서 듣는다", fx: { teacher: 3, s: { "student.attitude": 1 }, fatigue: 2 }, result: "\"그래, 그 정신이면 됐다.\" 반 아이들이 킥킥 웃었다." },
      { label: "그대로 엎드린다", fx: { teacher: -4, fatigue: -5, s: { "student.attitude": -1.5 } }, result: "종이 울리고 나서야 일어났다. 선생님은 아무 말씀 없이 출석부에 뭔가를 적으셨다." },
    ] },
  { id: "t_lunch", who: "teacher", school: true,
    text: "급식 줄에서 {teacher}께서 배식을 도와주고 계신다. 내 식판을 보시더니 \"운동하는 애가 이것만 먹어?\" 하신다.",
    choices: [
      { label: "한 국자 더 받는다", fx: { teacher: 2, fatigue: -3 }, result: "선생님이 고기반찬을 한 국자 더 얹어 주셨다. 오후 훈련이 든든했다." },
      { label: "다이어트 중이라고 농담한다", fx: { teacher: 1, morale: 2 }, result: "\"축구부가 무슨 다이어트야.\" 선생님이 웃으며 반찬을 두 배로 주셨다." },
    ] },

  // ── 학교 행사 (data/calendar.js 의 SCHOOL_DAYS 일정에 맞춰 반드시 나옴) ──
  { id: "retreat", bg: "ev_retreat", fixed: true, who: "narr",
    text: "수련회 첫날 밤, 레크리에이션 시간. 반 아이들이 \"축구부니까 네가 나가!\" 하며 등을 떠민다.",
    choices: [
      { label: "무대에 나간다", fx: { morale: 8, s: { "mental.teamwork": 1, "mental.confidence": 1 }, rel: { friend: 6 } }, result: "다리 찢기를 하다 바지가 터졌다. 반 아이들이 바닥을 굴렀다. 이제 다들 내 이름을 안다." },
      { label: "끝까지 안 나간다", fx: { fatigue: -4 }, result: "다른 애가 끌려 나갔다. 무사히 넘어갔는데, 조금 아쉬운 것도 같다." },
      { label: "몰래 숙소 앞에서 줄넘기", fx: { s: { "phys.stamina": 1, "student.attitude": -1.5 }, fatigue: 3 }, result: "교관 선생님한테 걸렸다. 벌로 숙소 앞 청소. 그래도 천 개는 채웠다." },
    ] },
  { id: "singapore", bg: "ev_singapore", fixed: true, who: "narr",
    text: "싱가포르 국제교류. 현지 학교 운동장에서 그쪽 친구들이 공을 차고 있다. 한 명이 손짓을 한다. 말은 잘 안 통한다.",
    choices: [
      { label: "영어로 먼저 말을 건다", fx: { s: { "student.academic": 2, "mental.confidence": 1.5 }, morale: 5 }, result: "\"Do you play football?\" 떨리는 첫마디에 걔가 웃었다. 그날 저녁 SNS 친구가 하나 생겼다." },
      { label: "공으로 대화한다", fx: { s: { "tech.dribble": 1, "mental.teamwork": 1 }, morale: 6 }, result: "헛다리 한 번에 다들 소리를 질렀다. 축구는 어디서나 통한다." },
      { label: "멀리서 구경한다", fx: { fatigue: -8 }, result: "그늘에 앉아 쉬었다. 습하고 더운 공기 속에서 남의 축구를 보는 것도 나쁘지 않았다." },
    ] },
  { id: "sportsday", bg: "ev_sportsday", fixed: true, who: "teacher",
    text: "고흥 연합 체육대회 날. 다른 학교 축구부 애들도 보인다. {teacher}께서 부르신다. \"{given|아/야}, 반 대항 계주 마지막 주자 해 볼래?\"",
    choices: [
      { label: "마지막 주자를 맡는다", fx: { s: { "phys.speed": 0.8, "student.attitude": 1 }, morale: 7, fatigue: 6, teacher: 3 },
        hurt: { p: 0.05, type: "hamstring", cause: "체육대회 계주 마지막 코너에서 허벅지 뒤가 당겼다.", result: "마지막 코너에서 허벅지가 뚝 하고 당겼다. 1등은 했는데, 결승선을 지나 주저앉았다." },
        result: "마지막 코너에서 다른 학교 축구부를 제쳤다. 반 아이들이 운동장으로 뛰어나왔다." },
      { label: "응원단장을 한다", fx: { s: { "mental.teamwork": 1.5 }, morale: 5, teacher: 2, rel: { friend: 4 } }, result: "목이 쉬도록 소리를 질렀다. 반이 2등을 했다." },
      { label: "다칠까 봐 빠진다", fx: { fatigue: -5, teacher: -2 }, result: "다칠까 봐 빠졌다. 반 단톡방이 조용했다." },
    ] },
  { id: "harmony_camp", bg: "bg_home", fixed: true, who: "teacher",
    text: "1학기 마지막 날, 대서어울림문화캠프. 학교에서 하룻밤을 잔다. 밤 11시, {teacher}께서 손전등을 들고 복도를 도신다. \"{given|아/야}, 아직 안 자냐?\"",
    choices: [
      { label: "선생님께 고민을 꺼낸다", fx: { s: { "mental.focus": 1, "mental.confidence": 1 }, teacher: 8 }, result: "복도 창가에 나란히 섰다. 선생님은 끝까지 듣기만 하셨다. \"넌 생각보다 단단한 애야.\" 그 말이 오래 남았다." },
      { label: "친구들과 밤새 논다", fx: { morale: 10, fatigue: 8, rel: { friend: 6 } }, result: "교실 바닥에 이불을 깔고 새벽까지 웃었다. 내일부터 방학이다." },
      { label: "일찍 잔다", fx: { fatigue: -8 }, result: "다음 주부터 하계훈련이다. 눈을 감자마자 잠들었다." },
    ] },
  { id: "summer_camp", bg: "bg_field_day", fixed: true, who: "coach",
    text: "{coach}: \"이번 주는 합숙이다. 휴대폰 걷는다. 하계대회 전까지 몸을 만든다.\" 이번 주 훈련은 효과가 크게 오르고 피로도 더 쌓인다. 어디에 집중할까?",
    choices: [
      { label: "기술 (볼 터치, 슈팅)", fx: { camp: true, s: { "tech.firstTouch": 1, "tech.shoot": 1, "tech.dribble": 1 }, fatigue: 6 }, result: "하루 천 번 볼 터치. 공이 발에 붙기 시작했다." },
      { label: "체력 (오르막 달리기)", fx: { camp: true, s: { "phys.stamina": 1.5, "phys.speed": 1 }, fatigue: 10 }, result: "팔영산 오르막을 다섯 번 뛰었다. 토할 것 같았는데, 다리가 단단해졌다." },
      { label: "전술 (영상 분석, 포지션 훈련)", fx: { camp: true, s: { "position": 0.8, "mental.focus": 1 }, fatigue: 4, coach: 2 }, result: "밤마다 상대 팀 영상을 봤다. 감독님이 내 질문을 마음에 들어 하셨다." },
    ] },
  { id: "winter_camp", bg: "bg_field_day", fixed: true, who: "coach",
    text: "{coach}: \"동계훈련이다. 곧 3학년 형들 없이 처음 나가는 대회다. 이번 합숙에서 팀을 새로 만든다.\" 어디에 집중할까?",
    choices: [
      { label: "기술 (볼 터치, 슈팅)", fx: { camp: true, s: { "tech.firstTouch": 1, "tech.shoot": 1, "tech.pass": 1 }, fatigue: 6 }, result: "손이 얼어도 공은 차진다. 한겨울 운동장에서 슈팅 500개." },
      { label: "체력 (모래사장 달리기)", fx: { camp: true, s: { "phys.stamina": 1.5, "phys.strength": 1 }, fatigue: 10 }, result: "겨울 바다 모래사장을 달렸다. 바람이 칼 같았다." },
      { label: "전술 (새 포메이션)", fx: { camp: true, s: { "position": 0.8, "mental.teamwork": 1 }, fatigue: 4, coach: 2 },
        result: s => s.calendar.grade === 1 ? "새로 맞춘 포메이션. 형들이 비운 자리를 우리 1학년이 메워야 한다." : "새로 맞춘 포메이션. 후배들 자리를 잡아 주는 게 내 몫이 됐다." },
    ] },
  { id: "school_trip", bg: "ev_schooltrip", fixed: true, who: "narr",
    text: "수학여행 둘째 날 저녁, 노을 지는 광화문 광장을 걷는다. 앞서 걷던 {friend|이/가} 뒤돌아 묻는다. \"너 고등학교 가서도 축구 할 거야?\"",
    choices: [
      { label: "진지하게 답한다", fx: { s: { "mental.focus": 1.5, "mental.confidence": 1 }, rel: { friend: 5 } }, result: "말로 하니까 오히려 분명해졌다. 왜 이걸 하는지, 어디까지 가고 싶은지." },
      { label: "웃어넘긴다", fx: { morale: 6 }, result: "\"모르지~\" 하고 웃었다. 하늘이 온통 주황색이었다. 지금은 그걸로 됐다." },
      { label: "같은 질문을 되묻는다", fx: { rel: { friend: 8 }, s: { "mental.teamwork": 1 } }, result: "{friend}의 꿈 얘기를 처음 들었다. 3년 동안 몰랐던 게 많았다." },
    ] },
  { id: "ski_camp", bg: "ev_ski", fixed: true, who: "coach",
    text: s => s.calendar.grade === 3 ? "스키캠프 출발 전. 감독님께서 3학년만 따로 부르셨다. \"고등학교 가기 전에 다치면 너희만 손해다. 알아서들 해라.\""
      : "스키캠프 출발 전. 감독님께서 축구부만 따로 부르셨다. \"다치면 동계대회 없다. 알아서들 해라.\"",
    choices: [
      { label: "상급 코스에 도전한다", fx: { morale: 9, s: { "mental.competitive": 1.5, "phys.agility": 0.5 } },
        hurt: { p: 0.14, type: "ankle", cause: "스키캠프 상급 코스에서 넘어지며 발목이 돌아갔다.", result: "세 번째로 내려올 때 넘어졌다. 발목이 돌아갔다. 감독님 얼굴이 떠올랐다." },
        result: "넘어지지 않고 끝까지 내려왔다. 다리가 후들거렸지만 짜릿했다." },
      { label: "초급 코스에서 천천히", fx: { morale: 5 }, result: "친구들과 엉거주춤 내려왔다. 다들 웃느라 정신이 없었다." },
      { label: "숙소에서 쉰다", fx: { fatigue: -10, morale: -2 }, result: "창밖으로 친구들이 스키 타는 걸 봤다. 몸은 편했다." },
    ] },
  { id: "festival", bg: "ev_festival", fixed: true, who: "narr",
    text: s => s.calendar.grade === 3 ? "봉두예술제. 축구부 장기자랑 무대가 잡혔다. 후배들이 나를 쳐다본다. \"형이 센터 해 주세요.\""
      : "봉두예술제. 축구부 장기자랑 무대가 잡혔다. 선배가 나를 가리킨다. \"센터는 너다.\"",
    choices: [
      { label: "춤을 맡는다", fx: { morale: 9, s: { "mental.confidence": 1.5, "mental.teamwork": 1 }, fatigue: 4 }, result: "연습 일주일, 무대 3분. 강당이 떠나가라 함성이 터졌다. 영상이 학교 전체에 돌았다." },
      { label: "뒤에서 소품을 맡는다", fx: { s: { "student.attitude": 1.5, "mental.teamwork": 1 }, teacher: 2 },
        result: s => `조명과 소품을 맡았다. 무대가 끝나고 ${s.calendar.grade === 3 ? "후배들이" : "선배가"} 제일 먼저 나를 찾았다.` },
      { label: "객석에서 본다", fx: { fatigue: -5 }, result: "다른 반 공연을 보며, 한 해가 끝나 간다는 걸 실감했다." },
    ] },
  { id: "graduation", bg: "ev_graduation", fixed: true, who: "narr",
    text: s => {
      const g = s.calendar.grade, m = s.relations.people?.mentor;
      const leaving = m && ((m.cohort === "3학년선배" && g === 1) || (m.cohort === "2학년선배" && g === 2));
      const cap = CAPTAINS[g] || "주장";
      if (leaving && m.value >= 60) return `졸업식 날. ${m.name} 선배가 낡은 축구화 한 켤레를 건넨다. "이거 신고 여기까지 왔다. 이제 네 차례다."`;
      if (leaving) return `졸업식 날. 3학년 선배들이 꽃다발을 들고 운동장에 모였다. ${m.name} 선배가 어깨를 툭 친다. "잘해라."`;
      return `졸업식 날. 3학년 선배들이 꽃다발을 들고 운동장에 모였다. 주장 ${cap} 선배가 후배들을 한 명씩 안아 준다.`;
    },
    choices: [
      { label: "고개 숙여 인사한다", fx: { s: { "mental.focus": 1 }, morale: 4 }, result: "선배들이 교문을 나간다. 동계대회는 우리끼리다. 내일부터 방학이다." },
      { label: "\"꼭 다시 같이 뛰어요\"", fx: { s: { "mental.competitive": 1 }, morale: 6 }, result: "\"고등학교 와라. 기다린다.\" 선배가 웃었다." },
    ] },
  { id: "graduation_me", bg: "ev_graduation", fixed: true, who: "teacher",
    text: s => {
      const t = s.relations.teacher ?? 50;
      return t >= 70 ? "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 이름을 부르며 손편지를 주신다. 내 편지는 다른 애들 것보다 두 장이나 더 길다."
        : t >= 45 ? "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 이름을 부르며 손편지를 주신다."
        : "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 손편지를 주신다. 나한테 주실 때 잠깐 망설이시는 것 같았다.";
    },
    choices: [
      { label: "편지를 펼친다", fx: { morale: 5 }, result: "마지막 줄까지 다 읽었다. 고개를 들 수가 없었다." },
      { label: "집에 가서 읽기로 한다", fx: { morale: 3 }, result: "가방 맨 안쪽에 편지를 넣었다. 운동장을 한 바퀴 돌고 교문을 나섰다." },
    ] },


  // ── 생일 주간 (js/engine/birthday.js, rollEvent) ──
  { id: "bday_team", bg: "ev_birthday", fixed: true, who: "friend",
    text: s => s.calendar.grade === 1
      ? "훈련이 끝나고 라커룸 불이 갑자기 꺼졌다. 어둠 속에서 촛불 하나가 다가온다. 입단하고 처음 맞는 생일인데, 다들 어떻게 알았지?"
      : s.calendar.grade === 3 ? "훈련이 끝나고 라커룸 불이 꺼졌다. 이번엔 후배들까지 줄을 서서 노래를 부른다. 중학교에서 맞는 마지막 생일이다."
      : "훈련이 끝나고 라커룸 불이 꺼졌다. 작년에 당한 걸 알면서도 또 당했다. {friend|이/가} 케이크를 들고 웃고 있다.",
    choices: [
      { label: "소원을 빌고 촛불을 끈다", fx: { morale: 5, s: { "mental.confidence": 0.8 } },
        result: s => s.calendar.grade === 3 ? "소원은 말하지 않았다. 다들 안다는 얼굴이었다. 촛불이 꺼지자 박수가 길게 이어졌다." : "눈을 감았다. 소원은 비밀이다. 대충 짐작은 가겠지만." },
      { label: "케이크를 {friend} 얼굴에 먼저 묻힌다", fx: { morale: 7, rel: { friend: 5 }, coach: -1 },
        result: "선제공격은 성공했다. 그 뒤로 라커룸이 생크림 범벅이 됐고, 다음 날 아침 정 코치님께 단체로 혼났다. 그래도 다들 웃고 있었다." },
      { label: "한 조각씩 직접 잘라 돌린다", fx: { s: { "mental.teamwork": 1.2 }, morale: 4, rel: { mentor: 2, junior: 3 } },
        result: s => s.calendar.grade === 1 ? "선배들부터 돌렸다. \"막내가 센스 있네.\" 마지막 조각은 크림만 남았지만 괜찮았다." : "후배들 것부터 크게 잘랐다. 내 몫은 제일 작았는데, 이상하게 제일 달았다." },
    ] },
  { id: "bday_home", bg: "ev_birthday_home", fixed: true, who: "mom",
    text: "방학 중에 맞은 생일. 훈련 끝나고 집에 들어서니 거실 불이 꺼져 있다. 엄마 아빠가 케이크를 들고 서 있고, 식탁 위에 포장지에 싸인 상자가 하나 놓여 있다.",
    choices: [
      { label: "소원을 빌고 상자를 연다", fx: { morale: 6, fatigue: -4 },
        result: "새 정강이 보호대였다. 아빠가 \"이번엔 네 등번호 박아 왔다\"며 웃었다. 엄마는 사진을 스무 장쯤 찍었다." },
      { label: "\"고맙습니다\" 하고 먼저 안아 드린다", fx: { morale: 5, s: { "student.attitude": 1, "mental.focus": 0.5 } },
        result: "엄마가 잠깐 말을 못 했다. 아빠는 괜히 창밖을 봤다. 그날 미역국은 두 그릇을 먹었다." },
    ] },

  // ── 우승·준우승 축하: 대회가 끝난 뒤 며칠 안에 반드시 찾아옴 (js/engine/events.js rollEvent) ──
  { id: "cel_league", bg: "ev_dinner", fixed: true, who: "coach",
    text: s => `${s.celebration?.label || "주말리그"} 우승 기념 회식 날. 감독님께서 읍내 고깃집을 통째로 빌리셨다. "오늘은 아무도 칼로리 계산 안 한다." 불판마다 삼겹살이 지글거리고, 우승 트로피는 상추 바구니 옆에 놓였다.`,
    choices: [
      { label: "후배들 먼저 챙긴다", fx: { s: { "mental.teamwork": 1.5 }, morale: 6, rel: { junior: 4, friend: 3 } },
        result: s => s.calendar.grade === 1 ? "막내라고 뒷정리부터 하려는데 선배가 손을 붙잡았다. \"우승한 날은 막내도 먹는 거다.\" 처음으로 팀 사진 한가운데 앉았다."
          : "후배들 접시부터 채웠다. 정작 내 접시는 마지막까지 비어 있었는데, 이상하게 배가 불렀다." },
      { label: "감독님 옆자리에 앉는다", fx: { coach: 5, s: { "mental.focus": 1 }, morale: 4 },
        result: "감독님은 거의 드시지 않고 사이다만 드셨다. \"우승은 오늘까지만 기뻐해라. 내일부터 너희는 쫓기는 팀이다.\" 그 말이 이상하게 좋았다." },
      { label: "소감 한마디 하라는 말에 일어선다", fx: { s: { "mental.confidence": 1.5 }, morale: 5, rel: { mentor: 2, friend: 2 } },
        result: s => s.flags.captain ? "주장답게 일어섰다. \"우리가 잘해서가 아니라, 같이 해서 이긴 겁니다.\" 정 코치님이 제일 크게 박수를 치셨다."
          : "일어서자마자 머리가 하얘졌다. \"어… 고기 맛있습니다!\" 고깃집이 떠나가게 웃음이 터졌다. 그날 별명이 하나 생겼다." },
    ] },
  { id: "cel_national", bg: "ev_welcome", fixed: true, who: "teacher",
    // 전국대회는 방학 중에 열리므로, 학교로 돌아오는 버스 장면으로 (방학이어도 어색하지 않게)
    text: s => `${s.celebration?.label || "전국대회"} 우승컵을 싣고 고흥으로 돌아오는 길. 버스가 교문 앞에 서자 현수막이 보였다. "축 우승 고흥대서중 축구부". 교장 선생님과 부모님들이 박수를 치고, 맨 앞줄에서 류봉두 선생님이 휴대폰을 들고 계신다.`,
    choices: [
      { label: "버스에서 내려 크게 인사한다", fx: { s: { "mental.confidence": 2 }, morale: 8, teacher: 2 },
        result: "\"응원해 주셔서 감사합니다!\" 목소리가 운동장 끝까지 울렸다. 엄마가 제일 크게 손을 흔들었다." },
      { label: "류봉두 선생님 목에 메달을 걸어 드린다", fx: { teacher: 8, morale: 6, s: { "student.attitude": 1 } },
        result: "선생님은 한참 메달을 내려다보셨다. \"이거 국어 시간에 쓴 글보다 무겁네.\" 그 사진이 학교 홈페이지 첫 화면에 올라갔다." },
      { label: "반 단톡방에 메달 사진을 올린다", fx: { morale: 7, rel: { friend: 5 }, fatigue: -4 },
        result: "답장이 순식간에 백 개를 넘겼다. 반장이 \"교실 칠판에 '우리 반 전국 챔피언'이라고 써 놓겠다\"며 약속했다." },
    ] },
  { id: "cel_runnerup", bg: "ev_jjajang", fixed: true, who: "coach",
    text: s => `${s.celebration?.label || "대회"} 준우승. 돌아오는 길에 감독님께서 버스를 중국집 앞에 세우셨다. "자장면 곱빼기, 탕수육은 테이블마다 하나씩." 목에 건 은메달이 자꾸 그릇에 부딪힌다.`,
    choices: [
      { label: "웃으며 곱빼기를 비운다", fx: { morale: 6, fatigue: -6, rel: { friend: 2, junior: 2 } },
        result: "누군가 \"내년엔 여기서 탕수육 두 개 먹자\"고 했다. 다들 웃었다. 진 날인데도 이상하게 배부른 저녁이었다." },
      { label: "메달을 만지작거리며 결승을 떠올린다", fx: { s: { "mental.competitive": 1.5, "mental.focus": 0.5 }, morale: 2 },
        result: "결승 마지막 10분이 머릿속에서 자꾸 다시 돌아갔다. 감독님이 옆에 앉으며 말씀하셨다. \"그 기분, 잊지 마라. 그게 다음 대회 연료다.\"" },
    ] },

  // ── 류봉두의 축복: 선생님과의 관계가 70 이상이면 1년에 한 번, 2학기 중 무작위로 찾아옴 (js/engine/events.js) ──
  { id: "t_blessing", bg: "ev_classroom", fixed: true, who: "teacher",
    text: "방과 후, {teacher}께서 국어실로 부르셨다. \"한 해 동안 운동장에서도 교실에서도 한 번도 손을 놓지 않더라. 선생님이 주는 선물이다.\" 작은 봉투 안에 손글씨 쪽지가 한 장 들어 있다.",
    choices: [
      { label: "고개 숙여 감사드린다", fx: { blessing: true, teacher: 2 },
        result: s => `쪽지에는 한 줄이 적혀 있었다. "너는 이미 충분히 잘하고 있다." 그날부터 이상하게 몸이 가벼웠다. ✨ 류봉두의 축복: ${s.lastBlessing || "능력치"} 상승` },
      { label: "\"왜 저한테 주세요?\" 하고 여쭌다", fx: { blessing: true, teacher: 2 },
        result: s => `"선생님 눈에는 다 보이거든." 선생님이 웃으며 쪽지를 접어 주머니에 넣어 주셨다. ✨ 류봉두의 축복: ${s.lastBlessing || "능력치"} 상승` },
    ] },
  // ── 류봉두 선생님 ──────────────────────────────
  { id: "t_diary", bg: "ev_classroom", fixed: true, who: "teacher",
    text: "생활 일기 첫 장에 {teacher}께서 빨간 펜으로 한 줄을 남기셨다. \"운동장에서 네 목소리가 제일 크더라. 교실에서도 들려줄래?\"",
    choices: [
      { label: "답을 적는다", fx: { teacher: 6, s: { "student.attitude": 1 } }, result: "\"수업 시간에도 크게 말해 볼게요.\" 다음 날 일기장에 웃는 얼굴이 그려져 있었다." },
      { label: "그냥 넘긴다", fx: {}, result: "일기장을 덮었다. 선생님은 다음 주에도 한 줄을 남기셨다." },
    ] },
  { id: "t_sixth", who: "teacher", school: true, weight: 1.3, cond: s => s.player.condition.fatigue >= 55,
    text: "6교시 국어 시간. 새벽 훈련 때문에 눈꺼풀이 무겁다. {teacher}께서 시를 읽고 계신다.",
    choices: [
      { label: "허벅지를 꼬집으며 버틴다", fx: { s: { "student.academic": 1, "mental.focus": 0.5 }, fatigue: 2, teacher: 2 }, result: "끝까지 버텼다. 선생님이 지나가며 책상을 톡 두드리셨다. 칭찬인지 경고인지 모르겠다." },
      { label: "엎드린다", fx: { fatigue: -6, teacher: -4, s: { "student.attitude": -1 } }, result: "깨어 보니 종이 울렸다. 칠판에 '피곤해도 국어는 국어다'라고 적혀 있었다." },
      { label: "손을 들고 질문한다", fx: { s: { "student.academic": 1.5, "mental.confidence": 0.5 }, teacher: 5 }, result: "\"이 시는 왜 바다 얘기만 해요?\" 반 아이들이 웃었다. 선생님은 그 질문으로 남은 20분을 쓰셨다." },
    ] },
  { id: "t_presentation", bg: "ev_classroom", fixed: true, who: "teacher",
    text: "{teacher}: \"다음 주 목요일 국어 수행평가, 발표다. 빠지면 대체 과제는 없어.\" 그런데 그날 오후 고등학교 팀과 연습경기가 잡혔다. 고등학교 감독님이 보러 오신다고 한다.",
    choices: [
      { label: "감독님께 말씀드리고 발표한다", fx: { s: { "student.academic": 2, "student.attitude": 2 }, coach: -2, teacher: 6 }, result: "발표를 마치고 운동장으로 뛰어갔다. 경기는 끝나 있었다. 감독님은 \"공부도 경기다\" 한마디만 하셨다." },
      { label: "연습경기에 간다", fx: { s: { "student.academic": -2, "position": 0.4 }, coach: 3, teacher: -5 }, result: "후반에 들어가 열심히 뛰었다. 다음 날 국어 시간, 선생님과 눈이 마주치지 않았다." },
      { label: "발표를 미리 녹화해 내게 해 달라고 부탁한다", fx: { s: { "student.academic": 1 }, fatigue: 12, teacher: 3, coach: 1 },
        result: s => (s.relations.teacher ?? 50) >= 60
          ? "선생님이 웃으셨다. \"이번 한 번만이다.\" 새벽 2시까지 녹화를 했다. 둘 다 지켰다."
          : "\"규칙은 규칙이야.\" 결국 발표는 놓쳤다. 밤새 준비한 영상만 남았다." },
    ] },
  { id: "t_book", who: "teacher", school: true, once: true, when: { grades: [2], months: [9, 10, 11] },
    text: "{teacher}께서 책 한 권을 건네신다. 축구 선수가 쓴 에세이다. \"읽고 한 줄만 써 와. 숙제 아니야.\"",
    choices: [
      { label: "그 주 안에 다 읽는다", fx: { s: { "mental.focus": 1, "student.academic": 1.5, "mental.confidence": 0.5 }, teacher: 6 }, result: "\"재능은 출발선일 뿐이다\"에 밑줄을 그었다. 그 문장을 써서 드렸다." },
      { label: "나중에 읽는다", fx: { teacher: -1 }, result: "책은 가방 속에서 한 달을 보냈다. 선생님은 아무 말도 안 하셨다." },
    ] },
  { id: "t_injured", who: "teacher", school: true, weight: 2.5, cond: s => !!s.player.condition.injury && s.player.condition.injury.total >= 3,
    text: "다리를 절며 교무실 앞을 지나가는데 {teacher}께서 부르신다. \"운동 못 하는 동안 뭐 할 거냐.\"",
    choices: [
      { label: "공부 계획을 말한다", fx: { s: { "student.academic": 1.5 }, morale: 4, teacher: 5 }, result: "선생님이 문제집 한 권을 꺼내 주셨다. \"다 풀면 가져와.\" 다리 대신 머리를 쓰는 몇 주가 됐다." },
      { label: "모르겠다고 한다", fx: { morale: 2, teacher: 2 }, result: "\"모르는 게 당연해. 근데 가만히 있지는 마.\" 선생님이 어깨를 두드리셨다." },
    ] },
  { id: "t_report", who: "teacher", weight: 3, cond: s => !!s.lastExam && s.calendar.turn - s.lastExam.turn <= 2 && s.lastExam.score < 50,
    text: "시험 성적표가 나왔다. {teacher}께서 교무실로 부르신다. \"축구 그만두라는 얘기 아니다. 둘 다 하라는 거다.\"",
    choices: [
      { label: "같이 계획을 짠다", fx: { s: { "student.academic": 2.5, "student.attitude": 1 }, teacher: 6, fatigue: 3 }, result: "훈련 없는 저녁 두 번은 공부하기로 했다. 선생님이 달력에 동그라미를 쳐 주셨다." },
      { label: "고개만 끄덕인다", fx: { teacher: -2 }, result: "고개만 끄덕이고 교무실을 나왔다. 문을 닫고 나서야 한숨이 나왔다." },
    ] },
  { id: "t_counsel", fixed: true, who: "teacher",
    text: s => {
      const st = s.player.stats.student;
      return st.attitude >= 65 && st.academic >= 55
        ? "3자 진로 상담. 엄마, {teacher}, 그리고 나. 선생님이 생활기록부를 펼치신다. \"3년 동안 성실했어요. 고등학교에서도 이런 건 다 봅니다.\" 엄마 눈가가 빨개진다."
        : "3자 진로 상담. 엄마, {teacher}, 그리고 나. 선생님이 생활기록부를 펼치시더니 잠깐 말을 고르신다. \"운동은 정말 열심히 했어요. 다만…\" 엄마가 내 쪽을 본다.";
    },
    choices: [
      { label: "내 생각을 먼저 말한다", fx: { s: { "mental.confidence": 1.5, "student.attitude": 1 }, teacher: 5, morale: 4 }, result: "가고 싶은 학교와 이유를 말했다. 엄마와 선생님이 동시에 고개를 끄덕이셨다." },
      { label: "어른들 이야기를 듣는다", fx: { s: { "mental.focus": 1 }, teacher: 2 }, result: "고등학교 이야기가 내 머리 위로 오갔다. 끝나고 엄마가 떡볶이를 사 주셨다." },
    ] },
];

// 주장 선거 (중3 3월 2주차에 반드시 일어남). 결과는 엔진이 계산합니다.
const CAPTAIN_EVENT = {
  id: "captain_vote", who: "coach",
  text: "올해 주장을 뽑는다. 3학년들, 스스로 하고 싶은 사람 있으면 손 들어라.",
  choices: [
    { label: "손을 든다", run: true },
    { label: "다른 친구를 추천한다", run: false },
  ],
};

return { EVENTS, CAPTAIN_EVENT };
})();
(__fix["data/events.js"] || []).forEach(f => f());

// ── js/engine/injury.js
__m["js/engine/injury.js"] = (function () {
const {mail} = __m["js/state.js"];
const {int, clamp} = __m["js/rng.js"];
// 부상: 종류, 진단 메시지


const INJURIES = {
  growingPains: { label: "성장통", weeks: [1, 2] },
  ankle:        { label: "발목 염좌", weeks: [2, 4] },
  hamstring:    { label: "햄스트링 부상", weeks: [3, 5] },
  knee:         { label: "무릎 부상", weeks: [6, 10] },
};

function injure(state, type, cause = null) {
  const def = INJURIES[type];
  const weeks = int(def.weeks[0], def.weeks[1]);
  state.player.condition.injury = { type, weeksLeft: weeks, total: weeks };
  state.record.injuries = (state.record.injuries || 0) + 1;
  state.player.condition.morale = clamp(state.player.condition.morale - 10, 0, 100);
  const p = state.player;
  const why = cause ? cause : type === "growingPains" ? `이번 측정에서 키가 많이 컸다. 뼈가 자라는 속도를 근육이 못 따라가서 생기는 통증이다.`
    : `훈련 직전 피로가 ${(f => f + ("013678".includes(String(f).at(-1)) ? "이었다" : "였다"))(Math.round(p.condition.fatigue))}. 지친 상태에서는 다칠 확률이 크게 오른다.${p.traits.includes("glassBody") ? " 원래 몸이 약한 편이니 더 조심해야 한다." : ""}`;
  mail(state, "medical", `${def.label} 진단`,
    `예상 회복 기간 ${weeks}주.\n\n${why}\n\n그동안 개인훈련과 단체훈련은 할 수 없다. 재활 훈련 한 칸이면 회복이 1주 빨라진다. 남는 시간엔 공부나 독서로 학업을 챙겨 두자.`);
  return { type, label: def.label, weeks };
}


return { INJURIES, injure };
})();
(__fix["js/engine/injury.js"] || []).forEach(f => f());

// ── js/engine/events.js
__m["js/engine/events.js"] = (function () {
const {EVENTS, CAPTAIN_EVENT} = __m["data/events.js"];
const {STAT_LABEL} = __m["data/player.js"];
const {STAFF, CAPTAINS} = __m["data/roster.js"];
const {turnInfo} = __m["js/engine/calendar.js"];
const {applyGain, expandGains} = __m["js/engine/growth.js"];
const {adjustRel, person, captainScore, REL_ROLES} = __m["js/engine/relations.js"];
const {mail} = __m["js/state.js"];
const {chance, weighted, clamp, rand, pick} = __m["js/rng.js"];
const {injure} = __m["js/engine/injury.js"];
const {isBirthdayWeek} = __m["js/engine/birthday.js"];
// 이벤트 엔진: 한 주가 끝나면 조건에 맞는 이벤트를 하나 골라 두고, 화면에서 선택을 받아 반영합니다.



const _bat = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };








const EVENT_CHANCE = 0.32;
const PORTRAIT = { coach: "npc_coach", assistant: "npc_assistant", teacher: "npc_teacher", mom: "npc_mom", dad: "npc_dad" };
const SPEAKER = { coach: () => STAFF.coach, assistant: () => STAFF.assistant, teacher: () => STAFF.teacher, mom: () => "엄마", dad: () => "아빠" };

const findEvent = id => (id === CAPTAIN_EVENT.id ? CAPTAIN_EVENT : EVENTS.find(e => e.id === id));

function eligible(state, ev, info) {
  if (ev.when?.grades && !ev.when.grades.includes(info.grade)) return false;
  if (ev.when?.months && !ev.when.months.includes(info.month)) return false;
  if (ev.school && info.vacation) return false;
  if (ev.needs && !person(state, ev.needs)) return false;
  if (ev.once && state.seenEvents?.includes(ev.id)) return false;
  const last = state.eventLog?.[ev.id];
  if (last != null && state.calendar.turn - last < (ev.afterLoss ? 8 : 12)) return false;
  try { if (ev.cond && !ev.cond(state)) return false; } catch { return false; }
  return true;
}

// 주 끝에 호출: 다음 주 시작 때 보여 줄 이벤트를 정해 둠
function rollEvent(state) {
  const info = turnInfo(state);
  if (!info || state.pendingEvent) return;
  if (info.grade === 3 && info.month === 3 && info.week === 2 && !state.flags.captainVoted) {
    state.pendingEvent = { id: CAPTAIN_EVENT.id };
    return;
  }
  // 학교 행사 (그 주에 반드시)
  const day = info.school.find(d => d.event && EVENTS.some(e => e.id === d.event));
  if (day) { state.pendingEvent = { id: day.event }; return; }
  // 생일 주간: 1년에 한 번, 방학이면 집에서 / 학기 중이면 라커룸에서
  // (그 주에 학교 행사가 있으면 행사 없는 주까지 최대 3주 미룸. 어느 해 생일인지는 그 주의 턴 번호로 구분)
  const bday = [0, 1, 2, 3].map(o => turnInfo(state, -o)).find(x => x && isBirthdayWeek(state, x));
  const given = state.flags.bdayGiven ||= [];
  if (bday && !given.includes(bday.turn)) {
    given.push(bday.turn);
    state.pendingEvent = { id: info.vacation ? "bday_home" : "bday_team" };
    return;
  }
  // 우승·준우승 축하: 대회가 끝난 뒤 3주 안에 (학교 행사 주간이면 다음 주로 미룸)
  const cel = state.flags.celebrate;
  if (cel) {
    state.flags.celebrate = null;
    if (state.calendar.turn - cel.turn <= 3) {
      state.flags.lastCelebration = state.calendar.turn;
      state.celebration = cel;
      state.pendingEvent = { id: { league: "cel_league", national: "cel_national", runnerUp: "cel_runnerup" }[cel.kind] };
      return;
    }
  }
  // 경기에서 졌다면 해변 모래 훈련이 먼저 찾아옴
  const beach = EVENTS.find(e => e.afterLoss);
  if (beach && eligible(state, beach, info) && chance(0.35)) { state.pendingEvent = { id: beach.id }; return; }
  // 류봉두의 축복: 관계 70 이상, 2학기(9~12월) 학기 중에 1년에 한 번. 12월이 되도록 안 왔으면 행사 없는 첫 주에 반드시
  const t = state.relations.teacher ?? 50;
  if (t >= 70 && !state.flags.blessed?.[info.grade] && [9, 10, 11, 12].includes(info.month) && !info.vacation
      && !info.school.some(d => d.event) && (chance(0.16) || info.month === 12)) {   // 학교 행사 주간은 피하고, 12월이 되면 반드시
    state.pendingEvent = { id: "t_blessing" }; return;
  }
  // 경기 뒤 면담처럼 급한 이야기는 먼저
  const urgent = EVENTS.filter(e => e.urgent && eligible(state, e, info));
  if (urgent.length && chance(0.75)) { state.pendingEvent = { id: pick(urgent).id }; return; }
  if (!chance(EVENT_CHANCE)) return;
  const list = EVENTS.filter(e => !e.afterLoss && !e.fixed && !e.urgent && eligible(state, e, info));
  if (!list.length) return;
  const ev = weighted(list.map(e => [e, (e.weight || 1) * (state.seenEvents?.includes(e.id) ? 0.35 : 1)]));
  state.pendingEvent = { id: ev.id };
}

function eventVars(state) {
  return {
    name: state.player.name, coach: STAFF.coach, assistant: STAFF.assistant, teacher: STAFF.teacher,
    given: state.player.name.length === 3 ? state.player.name.slice(1) : state.player.name,   // 선생님은 이름만 부름 (민준아)
    friend: person(state, "friend")?.name || "친구", rival: person(state, "rival")?.name || "동기",
    mentor: person(state, "mentor")?.name || "선배", junior: person(state, "junior")?.name || "후배",
    mom: "엄마",
  };
}

// 화면에 보여 줄 정보
function eventView(state) {
  const pe = state.pendingEvent;
  if (!pe) return null;
  const ev = findEvent(pe.id);
  if (!ev) { state.pendingEvent = null; return null; }
  const rel = person(state, ev.who);
  return {
    ev, text: typeof ev.text === "function" ? ev.text(state) : ev.text,
    speaker: rel ? `${REL_ROLES[ev.who].label} ${rel.name}` : SPEAKER[ev.who]?.() || "",
    portrait: rel ? rel.face : PORTRAIT[ev.who] || null,
  };
}

function applyFx(state, fx, changes) {
  if (!fx) return;
  const p = state.player;
  for (const [path, v] of Object.entries(expandGains(state, fx.s || {}))) {
    const d = applyGain(state, path, v, { raw: true });
    changes.push({ label: STAT_LABEL[path] || path, d });
  }
  if (fx.fatigue) { const b = p.condition.fatigue; p.condition.fatigue = clamp(b + fx.fatigue, 0, 100); changes.push({ label: "피로", d: p.condition.fatigue - b, invert: true }); }
  if (fx.morale) { const b = p.condition.morale; p.condition.morale = clamp(b + fx.morale, 0, 100); changes.push({ label: "사기", d: p.condition.morale - b }); }
  if (fx.coach) { const b = state.relations.coach; state.relations.coach = clamp(b + fx.coach, 0, 100); changes.push({ label: "감독 신뢰", d: state.relations.coach - b }); }
  if (fx.teacher) {
    const b = state.relations.teacher ?? 50;
    state.relations.teacher = clamp(b + fx.teacher, 0, 100);
    changes.push({ label: "류봉두 선생님", d: state.relations.teacher - b });
  }
  if (fx.camp) state.record.camps = (state.record.camps || 0) + 1;
  if (fx.blessing) {                                   // 류봉두의 축복: 축구 능력치 하나가 무작위로 +3
    const pool = ["tech", "phys", "mental"].flatMap(g => Object.keys(p.stats[g]).map(k => `${g}.${k}`));
    const path = pick(pool);
    const d = applyGain(state, path, 3, { raw: true });
    changes.push({ label: STAT_LABEL[path] || path, d });
    state.lastBlessing = STAT_LABEL[path] || path;
    (state.flags.blessed ||= {})[state.calendar.grade] = true;
  }
  for (const [k, v] of Object.entries(fx.rel || {})) {
    const d = adjustRel(state, k, v);
    if (d) changes.push({ label: `${REL_ROLES[k].label} ${person(state, k).name}`, d });
  }
}

// 선택 반영. 돌려주는 값: 결과 문장과 바뀐 수치
function chooseEvent(state, idx) {
  const pe = state.pendingEvent;
  const ev = findEvent(pe.id);
  const c = ev.choices[idx];
  const changes = [];
  let result;
  if (ev.id === CAPTAIN_EVENT.id) result = captainVote(state, c.run, changes);
  else {
    applyFx(state, c.fx, changes);
    applyFx(state, c.fxAfter, changes);
    result = typeof c.result === "function" ? c.result(state) : c.result;
    // 다칠 수 있는 선택 (스키캠프 상급 코스 등)
    if (c.hurt && !state.player.condition.injury && chance(c.hurt.p)) {
      const r = injure(state, c.hurt.type, c.hurt.cause);
      changes.push({ label: r.label, d: -r.weeks, invert: false, note: `${r.weeks}주` });
      result = c.hurt.result;
      state.lastEventInjury = r;
    }
  }
  state.seenEvents ||= [];
  if (!state.seenEvents.includes(ev.id)) state.seenEvents.push(ev.id);
  state.eventLog ||= {};
  state.eventLog[ev.id] = state.calendar.turn;
  state.pendingEvent = null;
  return { result, changes: changes.filter(x => Math.abs(x.d) >= 0.05) };
}

function captainVote(state, run, changes) {
  const p = state.player;
  state.flags.captainVoted = true;
  const score = captainScore(state) + (rand() * 8 - 4);
  const need = run ? 66 : 76;
  const win = score >= need;
  if (win) {
    state.flags.captain = true;
    p.condition.morale = clamp(p.condition.morale + 12, 0, 100);
    state.relations.coach = clamp(state.relations.coach + 5, 0, 100);
    changes.push({ label: "사기", d: 12 }, { label: "감독 신뢰", d: 5 });
    mail(state, "coach", "주장 완장",
      `올해 주장은 ${p.name}${/[가-힣]/.test(p.name.at(-1)) && (p.name.at(-1).charCodeAt(0) - 0xAC00) % 28 ? "이다" : "다"}.\n\n주장은 제일 잘하는 선수가 아니라, 제일 먼저 나오고 제일 늦게 들어가는 선수다. 힘들 때 고개 숙이지 마라. 다들 너를 본다.`);
    return run ? "동기들이 하나둘 손을 들었다. 만장일치. 감독님이 주황색 완장을 건네셨다." : "다른 친구를 추천했는데, 동기들이 오히려 네 이름을 불렀다. 감독님이 완장을 건네셨다.";
  }
  p.condition.morale = clamp(p.condition.morale - (run ? 6 : 0), 0, 100);
  if (run) changes.push({ label: "사기", d: -6 });
  const cap = CAPTAINS?.[3] && CAPTAINS[3] !== p.name ? CAPTAINS[3] : null;
  if (cap) mail(state, "group", "올해 주장", `${STAFF.coach}: 올해 주장은 ${cap}${_bat(cap) ? "이다" : "다"}.\n\n주장 ${cap}: 마지막 해다. 후회 없이 하자. 다 같이.`);
  return run ? `손을 들었지만 표가 모자랐다. 완장은 ${cap || "다른 친구"}에게 갔다. 감독님 신뢰, 팀워크, 동료들과의 관계가 조금씩 더 필요했다.`
    : `${cap ? `추천한 ${cap}${_bat(cap) ? "이" : "가"}` : "추천한 친구가"} 주장이 됐다. 박수를 쳐 줬다.`;
}

return { findEvent, rollEvent, eventVars, eventView, chooseEvent };
})();
(__fix["js/engine/events.js"] || []).forEach(f => f());

// ── data/endings.js
__m["data/endings.js"] = (function () {

// 엔딩. 위에서부터 차례로 조건을 확인해, 먼저 맞는 엔딩이 나옵니다.
// grade: S, A, B, C, D, 숨겨진(H), 전설(L)
// img: assets/img/ 안의 엔딩 그림 이름
// cond(c): c는 엔진이 계산한 3년 요약 (아래 career.js의 summarize 참고)
// story(c): 엔딩 문장. 줄바꿈은 \n

const ENDINGS = [
  { id: "legend", grade: "L", title: "레전드", img: "ending_legend",
    cond: c => c.captain && c.wore10 && c.nationalChampion && c.nationalTeam,
    story: c => `주장 완장, 등번호 10번, 전국대회 우승 트로피, 그리고 태극마크.\n\n고흥대서중 운동장 한쪽 벽에 ${c.name}의 이름이 새겨졌다. 후배들은 지금도 그 앞을 지나며 한 번씩 고개를 든다.\n\n${c.schoolName}에서 시작될 다음 이야기는, 이미 많은 사람이 기다리고 있다.` },

  { id: "national", grade: "S", title: "청소년 국가대표", img: "ending_national",
    cond: c => c.nationalTeam,
    story: c => `U-15 대표팀 소집 명단, 맨 아래에 ${c.name}의 이름이 있었다.\n\n고흥에서 파주까지는 버스로 다섯 시간. 창밖을 보다가 입단 첫날 측정표가 떠올랐다. 그때 그 숫자들이 여기까지 왔다.\n\n봄에는 ${c.schoolName} 유니폼을 입는다.` },

  { id: "pro", grade: "S", title: "프로 유스 입단", img: "ending_pro",
    cond: c => c.tier === "proYouth",
    story: c => `${c.schoolName}의 하얀 훈련복을 받았다. 가슴에 프로 구단 엠블럼이 박혀 있다.\n\n중학교 3년 동안 ${c.apps}경기, ${c.goals}골. 숫자보다 오래 남는 건 비 오는 날 혼자 남아 찼던 슈팅들이다.\n\n이제부터는 매일이 시험이다.` },

  { id: "comeback", grade: "H", title: "역전의 아이콘", img: "ending_highschool",
    cond: c => c.wasBenchInG1 && c.g3StartRatio >= 0.85 && c.g3Rating >= 7.6 && c.ovr >= 70,
    story: c => `중1 때는 벤치에서 물통을 날랐다. 경기 명단에 이름이 없는 날이 더 많았다.\n\n중3, ${c.nameEun} 팀에서 가장 먼저 이름이 불리는 선수가 됐다. 3학년 평균 평점 ${c.g3Rating.toFixed(2)}.\n\n늦게 핀 꽃이 가장 오래간다는 말, 이제는 조금 믿게 됐다. ${c.schoolName}에서도 그럴 것이다.` },

  { id: "captain", grade: "H", title: "주장", img: "ending_captain",
    cond: c => c.captain,
    story: c => `1년 동안 주황색 완장을 찼다.\n\n잘한 날보다, 진 날 라커룸에서 먼저 일어나 박수를 친 날들이 더 기억에 남는다. 후배들은 ${c.nameEul} "형"보다 "주장"이라고 더 많이 불렀다.\n\n졸업식 날, 완장은 ${c.juniorName || "후배"}에게 넘어갔다. ${c.schoolName}에서 또 다른 시작이다.` },

  { id: "model", grade: "H", title: "모범 학생선수", img: "ending_graduate",
    cond: c => c.academic >= 75 && c.attitude >= 75,
    story: c => `졸업식에서 ${c.teacherName}께서 ${c.name}의 이름을 한 번 더 부르셨다. 학교장상.\n\n훈련 끝나고 도서관, 시험 전날엔 단톡방 대신 문제집. 축구도 공부도 놓지 않은 3년이었다.\n\n${c.schoolName}에서도 그 균형은 계속된다.` },

  { id: "injury", grade: "D", title: "부상으로 좌절", img: "ending_setback",
    cond: c => c.injuryWeeks >= 14 && c.g3Rating < 7.1 && ["footballHS", "general", "regional", "none"].includes(c.tier),
    story: c => `3년 중 ${c.injuryWeeks}주를 재활실에서 보냈다.\n\n몸이 회복되면 다른 곳이 아팠다. 쉬어야 할 때 쉬지 못했던 날들이 하나씩 떠오른다.\n\n그래도 축구화를 버리지는 않았다. 몸을 아끼는 법을 배운 것도 3년의 결과다.` },

  { id: "nationalSchool", grade: "A", title: "전국 강호 진학", img: "ending_highschool",
    cond: c => c.tier === "national",
    story: c => `${c.schoolName}. 전국대회 단골 우승 후보.\n\n입학 테스트 날, 운동장에 선 1학년만 서른 명이 넘었다. 고흥에서는 에이스였지만 여기서는 다시 맨 아래부터다.\n\n괜찮다. 중1 때도 그랬으니까.` },

  { id: "regionalBest", grade: "A", title: "지역 최고의 선수", img: "ending_highschool",
    cond: c => c.tier === "regional" && (c.g3Rating >= 7.1 || c.g3LeagueTitle),
    story: c => `전남 권역 주말리그에서 ${c.nameIrane} 이름을 모르는 지도자는 없었다.\n\n3년 통산 ${c.apps}경기 ${c.goals}골 ${c.assists}도움. ${c.schoolEun} 망설이지 않고 손을 내밀었다.\n\n더 큰 무대는 이제부터다.` },

  { id: "academicBan", grade: "D", title: "학업 부진으로 출전 정지", img: "ending_setback",
    cond: c => c.suspended >= 4,
    story: c => `공식 경기에 ${c.suspended}번 나서지 못했다. 이유는 부상이 아니라 성적표였다.\n\n관중석에서 동료들 경기를 보던 날들이 가장 길었다. "공부도 훈련이다." 감독님 말이 그제야 들렸다.\n\n고등학교에서는 다르게 할 수 있다. 아직 늦지 않았다.` },

  { id: "dream", grade: "C", title: "벤치의 꿈", img: "ending_bench",
    cond: c => c.g3StartRatio < 0.3 && c.apps > 0 && c.apps < 50,
    story: c => `3년 동안 경기에 나선 건 ${c.apps}번. 선발 명단에 이름이 오른 날은 손에 꼽았다.\n\n유니폼은 늘 깨끗했다. 그래도 경기 전날마다 축구화 끈을 새로 묶었다. 언젠가 부를지 모르니까.\n\n꿈은 아직 벤치 위에 그대로 있다.` },

  { id: "bench", grade: "C", title: "만년 후보", img: "ending_bench",
    cond: c => c.g3StartRatio < 0.3,
    story: c => `3학년이 돼서도 선발 명단에 이름이 올라간 날은 손에 꼽았다.\n\n그래도 훈련엔 한 번도 빠지지 않았다. 대부분 교체로 나선 ${c.apps}경기, 그 몇 분을 위해 3년을 뛰었다.\n\n${c.schoolName}에서 다시 시작한다. 벤치에서 본 것들도 다 실력이 된다.` },

  { id: "study", grade: "B", title: "공부형 학생선수", img: "ending_graduate",
    cond: c => c.tier === "general" && c.academic >= 70,
    story: c => `${c.schoolName}에 진학했다. 축구부가 아니라 일반 진학이다.\n\n후회는 없다. 3년 동안 배운 건 공 차는 법만이 아니었다. 지는 법, 버티는 법, 다시 일어나는 법.\n\n주말이면 여전히 고흥대서중 운동장에 나가 후배들 공을 받아 준다.` },

  { id: "ordinary", grade: "B", title: "평범한 학생선수", img: "ending_graduate",
    cond: () => true,
    story: c => `특별한 기록은 없었다. ${c.apps}경기, ${c.goals}골, 그리고 3년.\n\n그래도 운동장에서 웃던 날이 훨씬 많았다. ${c.friendName ? `친구 ${c.friendName}하고` : "친구하고"} 바닷가를 걷던 저녁도, 비 맞으며 찼던 공도 다 남았다.\n\n${c.schoolName}에서도 공은 계속 찬다.` },
];

const GRADE_INFO = {
  L: { label: "전설", cls: "gL" },
  S: { label: "S", cls: "gS" },
  H: { label: "숨겨진 엔딩", cls: "gH" },
  A: { label: "A", cls: "gA" },
  B: { label: "B", cls: "gB" },
  C: { label: "C", cls: "gC" },
  D: { label: "D", cls: "gD" },
};

return { ENDINGS, GRADE_INFO };
})();
(__fix["data/endings.js"] || []).forEach(f => f());

// ── js/engine/career.js
__m["js/engine/career.js"] = (function () {
const {HIGH_SCHOOLS, HS_TIERS} = __m["data/world.js"];
const {ENDINGS} = __m["data/endings.js"];
const {STAFF} = __m["data/roster.js"];
const {mail, mailFrom} = __m["js/state.js"];
const {ovr} = __m["js/engine/team.js"];
const {person} = __m["js/engine/relations.js"];
const {clamp} = __m["js/rng.js"];
// 진로: 진학 상담(중3 10월), 국가대표 선발(중3 12월), 엔딩 판정(졸업)







const MILESTONES = {
  guide:     { grade: 3, month: 9,  week: 1 },
  admission: { grade: 3, month: 10, week: 4 },
  national:  { grade: 3, month: 12, week: 2 },
};
const at = (info, m) => info && info.grade === m.grade && info.month === m.month && info.week === m.week;

const TIER_NEED = { proYouth: 82, national: 74, regional: 63, footballHS: 48 };
const BEST_RANK = { "우승": 6, "준우승": 5, "결승": 5, "4강": 4, "8강": 3, "16강": 2, "토너먼트 진출": 1, "조별리그 탈락": 0, "조별리그": 0 };

const has = w => { const c = String(w).charCodeAt(String(w).length - 1); if (/[0-9]/.test(String(w).at(-1))) return "013678".includes(String(w).at(-1)); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
const j = (w, a, b) => w + (has(w) ? a : b);

// 주가 넘어갈 때 호출: 진로 관련 일정 처리
function careerMilestones(state, info) {
  const p = state.player;
  if (at(info, MILESTONES.guide)) {
    mail(state, "coach", "진학 이야기 좀 하자",
      `이제 슬슬 고등학교 생각을 해야 할 때다.\n\n10월 말에 진학 상담을 한다. 그때까지 보여 주는 게 전부라고 생각해라. 고등학교 감독님들은 경기만 보지 않는다. 훈련 태도, 성적표, 다 물어보신다.\n\n${outlook(state)}`);
  }
  if (at(info, MILESTONES.admission)) {
    state.pending = { type: "admission" };
    mail(state, "coach", "진학 상담", "상담실로 와라. 네가 갈 수 있는 학교들 정리해 뒀다. 마지막엔 네가 정하는 거다.");
  }
  if (at(info, MILESTONES.national)) {
    const r = nationalSelection(state);
    state.flags.nationalTeam = r.selected;
    state.career.national = r;
    state.pending = { type: "national" };
  }
}

// 감독님이 돌려서 말하는 진학 전망
function outlook(state) {
  const o = ovr(state.player);
  if (o >= 75) return "솔직히 말하면, 너를 궁금해하는 곳이 꽤 있다. 들뜨지만 마라.";
  if (o >= 67) return "좋은 학교 문 앞까지는 왔다. 마지막 한 걸음은 남은 경기에서 만들어라.";
  if (o >= 57) return "지역에서 이름 있는 학교들은 충분히 노려 볼 만하다. 다만 방심하면 순식간이다.";
  return "지금은 선택지가 많지 않다. 그래도 아직 시간이 있다. 남은 두 달을 버리지 마라.";
}

function bestTournament(state) {
  return state.record.tournaments.reduce((b, t) => Math.max(b, BEST_RANK[t.best] ?? 0), 0);
}

// 학교별 진학 가능 여부
function schoolOptions(state) {
  const p = state.player, o = ovr(p);
  const recommend = state.relations.coach >= 70 && p.stats.student.attitude >= 60;
  const best = bestTournament(state);
  const list = HIGH_SCHOOLS.map(s => {
    const sc = state.scouting[s.id];
    let need = TIER_NEED[s.tier];
    const notes = [];
    if (recommend) { need -= 3; notes.push("감독님 추천서 −3"); }
    if (p.stats.student.attitude < 40) { need += 3; notes.push("생활태도 부족 +3"); }
    if (p.stats.student.academic < 30) { need += 2; notes.push("학업 부족 +2"); }
    if (sc?.interest) { const d = Math.min(5, Math.floor(sc.interest / 15)); if (d) { need -= d; notes.push(`관심도 −${d}`); } }
    if ((s.tier === "national" || s.tier === "proYouth") && best >= 3) { need -= 2; notes.push("전국대회 8강 이상 −2"); }
    const offered = !!sc?.offered;
    return { ...s, tierLabel: HS_TIERS[s.tier].label, need, ok: offered || o >= need, offered, notes, interest: sc?.interest || 0 };
  });
  list.push({ id: "general", name: "순천 일반고 (일반 진학)", tier: "general", tierLabel: "일반고",
    need: null, ok: true, notes: [p.stats.student.academic >= 70 ? "성적이 좋아 원하는 학교를 고를 수 있음" : "축구부 없이 공부로 진학"] });
  return { ovr: o, recommend, list };
}

function chooseSchool(state, id) {
  const opts = schoolOptions(state).list;
  const s = opts.find(x => x.id === id && x.ok);
  if (!s) return { ok: false };
  state.career.school = { id: s.id, name: s.name, tier: s.tier, tierLabel: s.tierLabel };
  state.pending = null;
  if (s.tier !== "general") {
    mailFrom(state, s.coach || "고등학교", "scout", `${s.name} 합격`,
      `${state.player.name}, 반갑다. 내년 봄부터 같이 운동한다.\n\n중학교에서 했던 대로만 해라. 졸업할 때까지 몸 관리 잘하고.`);
  }
  mail(state, "coach", "결정했구나",
    s.tier === "general"
      ? "축구를 그만두는 게 아니라, 다른 길로 가는 거다. 3년 동안 고생 많았다. 운동장은 언제든 열려 있다."
      : `${j(s.name, "이면", "면")} 좋은 선택이다. 거기서도 지금처럼만 해라. 졸업할 때까지는 아직 고흥FC 선수다. 끝까지 뛰어라.`);
  return { ok: true, school: s };
}

// U-15 국가대표 선발 평가
function nationalSelection(state) {
  const p = state.player, o = ovr(p);
  const g3 = state.record.matches.filter(m => m.grade === 3 && m.rating != null);
  const avg = g3.length ? g3.reduce((a, m) => a + m.rating, 0) / g3.length : 6;
  const best = bestTournament(state);
  const mental = (p.stats.mental.focus + p.stats.mental.competitive + p.stats.mental.teamwork + p.stats.mental.confidence) / 4;
  const score = o * 0.6 + (avg - 6.5) * 8 + best * 1.2 + (mental - 50) * 0.15 + (g3.filter(m => m.mom).length) * 0.4;
  return { score: Math.round(score * 10) / 10, selected: score >= 60 && o >= 77, ovr: Math.round(o), avg: Math.round(avg * 100) / 100, best };
}

// 3년 요약 (엔딩 판정과 문장에 씀)
function summarize(state) {
  const p = state.player, r = state.record;
  const g3 = r.matches.filter(m => m.grade === 3 && m.official);
  const g3Played = g3.filter(m => m.rating != null);
  const school = state.career.school || { name: "고등학교", tier: "none" };
  return {
    name: p.name, nameEun: j(p.name, "은", "는"), nameEul: j(p.name, "을", "를"), nameIrane: j(p.name, "이라는", "라는"),
    schoolName: school.name, schoolEun: j(school.name, "은", "는"), tier: school.tier,
    ovr: Math.round(ovr(p)), apps: r.apps, goals: r.goals, assists: r.assists,
    g3StartRatio: g3.length ? g3.filter(m => m.status === "start").length / g3.length : 0,
    g3Rating: g3Played.length ? g3Played.reduce((a, m) => a + m.rating, 0) / g3Played.length : 6,
    g3LeagueTitle: r.leagues.some(l => l.grade === 3 && l.rank === 1),
    captain: !!state.flags.captain, wore10: !!state.flags.wore10, nationalChampion: !!state.flags.nationalChampion,
    nationalTeam: !!state.flags.nationalTeam, wasBenchInG1: !!state.flags.wasBenchInG1,
    academic: p.stats.student.academic, attitude: p.stats.student.attitude,
    injuryWeeks: r.injuryWeeks || 0, suspended: r.matches.filter(m => m.reason?.includes("학업")).length,
    teacherName: STAFF.teacher, friendName: person(state, "friend")?.name, juniorName: person(state, "junior")?.name,
    height: p.body.height, titles: r.titles, teacher: state.relations.teacher ?? 50,
    earned: (r.earned || []).length,
  };
}

function decideEnding(state) {
  const c = summarize(state);
  const e = ENDINGS.find(x => { try { return x.cond(c); } catch { return false; } });
  state.career.ending = e.id;
  return { ending: e, c };
}

// 졸업식 날 담임 선생님 편지 (관계에 따라 다름)
function teacherLetter(state) {
  const t = state.relations.teacher ?? 50, n = state.player.name;
  const sign = `— ${STAFF.teacher.replace(/\s*선생님$/, "")}`;
  if (t >= 70) return `${n}에게.\n\n3년 동안 운동장에서 제일 먼저 뛰고, 교실에서도 끝까지 버티던 너를 기억한다. 넘어지는 날도 있었지. 그래도 너는 매번 일어났다.\n\n고등학교에 가서도 그 모습 그대로면 된다. 고흥에 오면 국어실 문 두드려라.\n\n${sign}`;
  if (t >= 45) return `${n}에게.\n\n축구화 끈 묶는 손이 3년 사이에 많이 커졌더라. 운동장에서 보낸 시간만큼 교실에서 보낸 시간도 너를 만들었다는 걸, 언젠가는 알게 될 거다.\n\n어디서 뛰든 응원한다.\n\n${sign}`;
  return `${n}에게.\n\n솔직히 말하면, 교실에서는 너와 이야기할 기회가 많지 않았다. 그게 내내 마음에 걸렸다. 그래도 운동장에서 뛰는 너를 창문으로 자주 봤다.\n\n다음 3년은 공도 사람도 조금 더 가까이 두고 지내라. 그렇게 될 거라고 믿는다.\n\n${sign}`;
}

// 엔딩 도감 (이 기기에 저장)
const KEY = "gfc_endings";
function seenEndings() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function markEnding(id) {
  try { const s = new Set(seenEndings()); s.add(id); localStorage.setItem(KEY, JSON.stringify([...s])); } catch {}
}

return { MILESTONES, careerMilestones, bestTournament, schoolOptions, chooseSchool, nationalSelection, summarize, decideEnding, teacherLetter, seenEndings, markEnding };
})();
(__fix["js/engine/career.js"] || []).forEach(f => f());

// ── js/engine/traits.js
__m["js/engine/traits.js"] = (function () {
const {TRAITS, EARNABLE} = __m["data/player.js"];
const {STAFF} = __m["data/roster.js"];
const {applyGain, expandGains} = __m["js/engine/growth.js"];
const {mail} = __m["js/state.js"];
// 경기와 생활 속에서 특성을 얻는 규칙. 얻는 순간 bonus만큼 능력치가 오릅니다.




// 조건: 상태를 보고 true면 획득
const RULES = {
  champion:   s => s.record.titles.some(t => t.national),
  finisher:   s => s.record.matches.filter(m => m.goals >= 2).length >= 4,
  ace:        s => (s.record.mom || 0) >= 8,
  wall:       s => s.player.position === "DF" && s.record.matches.filter(m => m.status === "start" && m.ga === 0 && m.official).length >= 10,
  playmaker:  s => s.record.assists >= 12,
  clutch:     s => (s.record.clutchGoals || 0) >= 3,
  leadership: s => !!s.flags.captain,
  comeback:   s => !!s.flags.comebackReady,
  ironLungs:  s => (s.record.camps || 0) >= 2 && s.player.stats.phys.stamina >= 65,
  scholar:    s => (s.record.topExams || 0) >= 2,
};

const LINES = {
  champion:   "우승 메달을 목에 건 날부터, 큰 경기가 덜 무섭다.",
  finisher:   "골문 앞에서 서두르지 않게 됐다. 이제 골키퍼가 먼저 움직이는 게 보인다.",
  ace:        "상대 감독들이 경기 전에 내 등번호부터 확인한다.",
  wall:       "공격수들이 내 쪽으로 오기를 꺼린다.",
  playmaker:  "동료들이 내가 공을 잡으면 먼저 뛰기 시작한다.",
  clutch:     "지고 있을 때 오히려 심장이 차분해진다.",
  leadership: "완장을 차고 나서, 내 말 한마디에 다들 고개를 든다.",
  comeback:   "넘어져 봤으니 일어나는 법도 안다.",
  ironLungs:  "합숙을 두 번 버텼다. 후반 30분에도 다리가 가볍다.",
  scholar:    "운동장에서도 교실에서도 밀리지 않는다. 류봉두 선생님이 웃으셨다.",
};

function traitInfo(id) {
  return TRAITS[id] ? { ...TRAITS[id], ...(EARNABLE[id] || {}) } : null;
}

// 새로 얻은 특성 목록을 돌려줌
function checkTraits(state) {
  const p = state.player;
  const got = [];
  for (const [id, rule] of Object.entries(RULES)) {
    if (p.traits.includes(id)) continue;
    let ok = false;
    try { ok = rule(state); } catch { ok = false; }
    if (!ok) continue;
    p.traits.push(id);
    const info = traitInfo(id);
    const changes = [];
    for (const [path, v] of Object.entries(expandGains(state, info.bonus || {}))) changes.push({ path, d: applyGain(state, path, v, { raw: true }) });
    let extra = "";
    if (id === "comeback" && p.traits.includes("glassBody")) {
      p.traits.splice(p.traits.indexOf("glassBody"), 1);
      extra = "\n\n'유리몸' 특성이 사라졌다.";
    }
    state.record.earned ||= [];
    state.record.earned.push({ id, turn: state.calendar.turn });
    mail(state, "system", `새 특성: ${info.label}`,
      `${LINES[id] || ""}\n\n(${info.how}) → ${info.desc}${extra}`);
    got.push({ id, label: info.label, desc: info.desc, changes });
  }
  return got;
}

return { traitInfo, checkTraits };
})();
(__fix["js/engine/traits.js"] || []).forEach(f => f());

// ── js/engine/week.js
__m["js/engine/week.js"] = (function () {
const {ACTION_MAP} = __m["data/actions.js"];
const {STAT_GROUPS} = __m["data/player.js"];
const {turnInfo, label, GRAD_INDEX} = __m["js/engine/calendar.js"];
const {applyGain, expandGains, growBody, weeklyDrift, hasTrait} = __m["js/engine/growth.js"];
const {matchFor} = __m["js/engine/season.js"];
const {prepareMatch, autoPlay, finishMatch} = __m["js/engine/match.js"];
const {previewMail, weeklyAdvice, drillFor} = __m["js/engine/advice.js"];
const {adjustRel, weeklyRelations, relationsNewYear, rivalGap, seniorsLeave} = __m["js/engine/relations.js"];
const {rollEvent} = __m["js/engine/events.js"];
const {birthdayWeek} = __m["js/engine/birthday.js"];
const {careerMilestones} = __m["js/engine/career.js"];
const {STAT_LABEL, POSITIONS} = __m["data/player.js"];
const {getPath} = __m["js/rng.js"];
const {ovr, ageRoster, activeRoster, mateGrade, roleFor, randomFreeNumber, freeNumbers, depthChart} = __m["js/engine/team.js"];
const {mail, snapshotStats} = __m["js/state.js"];
const {CAPTAINS, STAFF} = __m["data/roster.js"];
const {INJURIES, injure} = __m["js/engine/injury.js"];
const {checkTraits} = __m["js/engine/traits.js"];
const {normal, chance, clamp, int, weighted, range} = __m["js/rng.js"];
// 한 주 진행: 행동 → 경기 → 시험 → 부상 → 학업 체크 → 다음 주


















const _bat = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };


const SLOTS = [
  { id: "wd1", label: "평일 1" },
  { id: "wd2", label: "평일 2" },
  { id: "we",  label: "주말" },
];


function actionAllowed(state, action) {
  if (action.needs && !state.relations.people?.[action.needs]) return { ok: false, reason: "아직 없음" };
  const injured = !!state.player.condition.injury;
  if (action.injured === "block" && injured) return { ok: false, reason: "부상 중" };
  if (action.injured === "only" && !injured) return { ok: false, reason: "부상 중에만" };
  if (action.schoolOnly && turnInfo(state)?.vacation) return { ok: false, reason: "방학 중" };
  return { ok: true };
}

// 이번 주 경기 (탈락한 대회 주간은 null)
function currentFixture(state) {
  const info = turnInfo(state);
  return info ? matchFor(state, info) : null;
}

function slotLocked(state, slotId) {
  if (slotId !== "we") return null;
  const fx = currentFixture(state);
  return fx ? { fx, info: turnInfo(state) } : null;
}

function planReady(state) {
  return SLOTS.every(s => slotLocked(state, s.id) || state.plan[s.id]);
}

function academicLevel(v) {
  if (v < 10) return 4; if (v < 20) return 3; if (v < 30) return 2; if (v < 40) return 1; return 0;
}

// 경기까지 자동으로 처리하는 한 주 (자동 시뮬레이션용)
function runWeek(state) {
  const ctx = beginWeek(state);
  let result = null;
  if (ctx.fx) {
    const m = prepareMatch(state, ctx.info, ctx.fx);
    autoPlay(state, m);
    result = finishMatch(state, m);
  }
  return endWeek(state, ctx, result);
}

// 1부: 평일·주말 행동 반영. 경기가 있으면 ctx.fx에 상대가 담깁니다
function beginWeek(state) {
  const p = state.player;
  const info = turnInfo(state);
  const before = snapshotStats(state);
  const coachBefore = state.relations.coach;
  const report = { info, title: label(info), actions: [], match: null, exam: null, injury: null,
                   recovered: false, body: null, yearEnd: null, graduation: false, mails: [] };
  const mailStart = state.inbox.length;

  // 1. 행동
  const chosenSlots = SLOTS.filter(s => !slotLocked(state, s.id) && ACTION_MAP[state.plan[s.id]]).map(s => ({ slot: s.id, a: ACTION_MAP[state.plan[s.id]] }));
  const chosen = chosenSlots.map(x => x.a);
  let risk = 0, didSchool = false, didTeam = false, rehab = 0, sprint = false;
  const gap = rivalGap(state);
  const rivalMult = gap != null && Math.abs(gap) <= 5 ? 1.05 : 1;
  const camp = info.camp;                              // 합숙 훈련 주간
  if (camp) report.camp = true;
  for (const { slot, a } of chosenSlots) {
    if (!actionAllowed(state, a).ok) continue;
    const mg = state.planMult?.[slot] ?? 1;          // 미니게임 결과 배율
    const campMult = camp && (a.cat === "personal" || a.cat === "team") ? 1.2 : 1;
    const studyMult = a.cat === "school" && hasTrait(p, "scholar") ? 1.2 : 1;
    for (const [path, base] of Object.entries(expandGains(state, a.gains))) applyGain(state, path, base, { mult: mg * rivalMult * campMult * studyMult });
    if (a.rel) for (const [k, v] of Object.entries(a.rel)) adjustRel(state, k, v);
    p.condition.fatigue = clamp(p.condition.fatigue + (a.fatigue || 0) * (camp && a.fatigue > 0 ? 1.25 : 1), 0, 100);
    p.condition.morale = clamp(p.condition.morale + (a.morale || 0), 0, 100);
    if (a.coach) state.relations.coach = clamp(state.relations.coach + a.coach, 0, 100);
    if (a.academicLoss) p.stats.student.academic = clamp(p.stats.student.academic - a.academicLoss, 0, 100);
    risk += a.risk || 0;
    if (a.cat === "school") didSchool = true;
    if (a.cat === "team") didTeam = true;
    if (a.heal) rehab += a.heal;
    if (a.id === "sprint") sprint = true;
    report.actions.push(a.label);
  }

  report.minigames = state.planMult || null;
  state.planMult = null;
  state.history ||= [];
  state.history.push({ turn: info.turn, acts: chosen.map(a => a.id) });
  if (state.history.length > 12) state.history.shift();
  const fx = currentFixture(state);
  return { info, fx, report, before, coachBefore, mailStart, chosen, risk, didSchool, didTeam, rehab, sprint };
}

// 2부: 경기 결과를 받아 시험·부상·학업·다음 주 처리
function endWeek(state, ctx, matchResult) {
  const p = state.player;
  const { info, report, before, coachBefore, mailStart, chosen, didSchool, didTeam, rehab, sprint } = ctx;
  let risk = ctx.risk;
  if (matchResult) {
    report.match = matchResult;
    risk += 0.006 * (matchResult.minutes / 70);       // 경기 중 부상은 경기 안에서 따로 판정
    // 경기 경험: 뛴 시간만큼 포지션 능력치가 조금 오름 (주말 훈련 대신 경기를 뛴 몫)
    if (matchResult.minutes > 0) for (const [path, base] of Object.entries(expandGains(state, { position: 0.15 * matchResult.minutes / 70 }))) applyGain(state, path, base);
  }

  // 3. 시험
  if (info.exam) report.exam = runExam(state, info, chosen);

  // 4. 자연 변화와 특성
  weeklyDrift(state, didSchool);
  weeklyRelations(state);
  const att = p.stats.student.attitude;
  if (att >= 70) state.relations.coach += 0.2;
  if (att < 40) state.relations.coach -= 0.5;
  if (!didTeam && !matchResult) state.relations.coach -= 0.3;
  state.relations.coach += (50 - state.relations.coach) * 0.025;
  if (hasTrait(p, "inconsistent")) p.condition.morale += normal(0, 6);
  if (hasTrait(p, "slump") && chance(0.06)) {
    p.condition.morale -= 15;
    mail(state, "system", "괜히 다 안 되는 한 주", "공이 발에 안 붙는다. 이유는 모르겠다. 슬럼프인가…");
  }
  if (hasTrait(p, "steelMental")) p.condition.morale = Math.max(p.condition.morale, 30);
  if (hasTrait(p, "comeback")) p.condition.morale = Math.max(p.condition.morale, 25);
  p.condition.morale = clamp(p.condition.morale, 0, 100);
  p.condition.fatigue = clamp(p.condition.fatigue - 8, 0, 100);
  state.relations.coach = clamp(state.relations.coach, 0, 100);

  // 5. 부상
  const inj = p.condition.injury;
  if (inj) {
    state.record.injuryWeeks = (state.record.injuryWeeks || 0) + 1;
    inj.weeksLeft -= 1 + rehab;
    if (inj.weeksLeft <= 0) {
      p.condition.injury = null;
      report.recovered = true;
      if (inj.total >= 6) { state.flags.comebackReady = true; state.flags.returnTurn = state.calendar.turn + 1; }
      mail(state, "medical", `${INJURIES[inj.type].label} 회복`, "훈련에 복귀해도 좋다는 소견이 나왔다. 처음 일주일은 무리하지 말 것.");
    }
  } else if (matchResult?.injury) {
    const mi = matchResult.injury;
    report.injury = injure(state, mi.type, `${mi.minute}분, ${mi.cause} 피로가 쌓여 있을수록 경기 중 부상 위험도 커진다.`);
  } else {
    const r = risk * 0.32 * (1 + p.condition.fatigue / 40) * (hasTrait(p, "glassBody") ? 1.8 : 1) * (hasTrait(p, "comeback") ? 0.8 : 1);
    if (chance(r)) report.injury = injure(state, weighted([["ankle", 0.55], ["hamstring", sprint ? 0.6 : 0.3], ["knee", 0.15]]));
  }

  // 6. 학업 단계
  checkAcademics(state);
  const newTraits = checkTraits(state);
  if (newTraits.length) report.traits = newTraits;

  // 7. 다음 주로
  state.plan = { wd1: null, wd2: null, we: null };
  state.calendar.turn++;
  const next = turnInfo(state);
  if (!next) {
    state.finished = true;
    report.graduation = true;
  } else {
    if (next.grade !== info.grade) report.yearEnd = yearTransition(state, info.grade);
    else if (next.index === GRAD_INDEX + 1) graduateSeniors(state, info.grade);   // 졸업식 다음 주: 3학년 선배들이 떠남
    state.calendar.grade = next.grade;
    state.calendar.semester = next.semester;
    const k = growthIndex(next);
    if (k !== null) {
      const g = growBody(state, k);
      report.body = g;
      if (g.growingPains && !p.condition.injury) {
        report.injury = injure(state, "growingPains");
      }
      roleMail(state);
    }
  }

  if (!state.finished) {
    state.career ||= {};
    careerMilestones(state, next);
    birthdayWeek(state, next);
    rollEvent(state);
    weeklyAdvice(state, report);
    const nfx = currentFixture(state);
    if (nfx) previewMail(state, nfx);
  }

  report.deltas = diffStats(before.stats, state.player.stats);
  report.coachDelta = state.relations.coach - coachBefore;
  report.mails = state.inbox.slice(0, state.inbox.length - mailStart);
  return report;
}

function growthIndex(info) {
  if (info.week !== 1) return null;
  if (info.month === 9) return (info.grade - 1) * 2;
  if (info.month === 3 && info.grade > 1) return (info.grade - 1) * 2 - 1;
  return null;
}

function runExam(state, info, chosen) {
  const s = state.player.stats.student;
  const studied = chosen.some(a => a.id === "study" || a.id === "assessment");
  if (info.exam.free) {
    applyGain(state, "student.attitude", studied ? 1.5 : 0.3, { raw: true });
    mail(state, "teacher", info.exam.name,
      studied ? "모둠 발표 준비를 성실하게 해 왔더구나. 칭찬한다." : "수행평가 제출물이 조금 아쉬웠어. 다음엔 미리 준비하자.");
    return { name: info.exam.name, free: true };
  }
  const score = clamp(s.academic + normal(0, 6) + (studied ? 5 : 0) + (hasTrait(state.player, "scholar") ? 4 : 0), 0, 100);
  const tier = score >= 85 ? "상위권" : score >= 70 ? "중상위권" : score >= 55 ? "중위권" : score >= 40 ? "중하위권" : "하위권";
  if (score >= 70) state.relations.coach = clamp(state.relations.coach + 1, 0, 100);
  if (score >= 85) state.record.topExams = (state.record.topExams || 0) + 1;
  state.relations.teacher = clamp((state.relations.teacher ?? 50) + (score >= 70 ? 3 : score < 40 ? -2 : 0) + (studied ? 1 : 0), 0, 100);
  state.lastExam = { tier: score >= 85 ? "상위권" : score >= 70 ? "중상위권" : score >= 55 ? "중위권" : score >= 40 ? "중하위권" : "하위권", score, turn: state.calendar.turn };
  const comment = {
    상위권: "축구하면서 이 성적이면 정말 대단하다. 부모님께서도 기뻐하시겠구나.",
    중상위권: "운동과 공부를 잘 챙기고 있구나. 지금처럼만 하자.",
    중위권: "나쁘지 않아. 조금만 더 하면 한 단계 올라갈 수 있겠다.",
    중하위권: "훈련으로 피곤한 건 알지만, 수업 시간엔 집중하자.",
    하위권: "성적이 많이 걱정된다. 감독님과도 이야기를 나눠 봐야겠어.",
  }[tier];
  const rank = Math.max(1, Math.round((100 - score) / 100 * 28));
  mail(state, "teacher", `${info.exam.name} 결과: ${tier}`,
    `평균 ${Math.round(score)}점, 반에서 28명 중 ${rank}등 정도야.\n\n${comment}\n\n${studied ? "시험 주에 공부한 게 점수에 보였어." : "시험 주에 공부하는 모습을 한 번도 못 봤어. 하루만 책을 폈어도 5점은 더 나왔을 거야."}${score >= 70 ? "\n\n감독님께도 말씀드렸어. 좋아하시더라." : ""}`);
  return { name: info.exam.name, tier, score: Math.round(score) };
}

function checkAcademics(state) {
  const v = state.player.stats.student.academic;
  const lv = academicLevel(v);
  const prev = state.flags.academicLevel;
  if (lv === prev) return;
  state.flags.academicLevel = lv;
  if (lv > prev) {
    if (lv >= 1 && prev < 1) { state.relations.coach -= 2;
      mail(state, "coach", "학업 경고", "담임 선생님께 연락을 받았다. 성적이 계속 떨어지고 있다는구나. 이번 주부터 공부 시간도 챙겨라. 경고다."); }
    if (lv >= 2 && prev < 2) { state.relations.coach -= 2; state.player.condition.morale -= 10;
      mail(state, "mom", "선생님이랑 상담했어", "오늘 학교 가서 담임 선생님이랑 감독님 만나고 왔어. 축구 계속하려면 공부도 놓으면 안 된대. 엄마도 걱정돼."); }
    if (lv >= 3 && prev < 3)
      mail(state, "coach", "대회 출전 제한", "학업 성적이 기준에 못 미친다. 성적이 오를 때까지 대회(하계·동계)에는 데려갈 수 없다.");
    if (lv >= 4 && prev < 4)
      mail(state, "coach", "공식 경기 출전 정지", "주말리그를 포함한 모든 공식 경기에 나설 수 없다. 지금은 공부가 먼저다.");
  } else {
    mail(state, "coach", "성적이 올랐구나", lv === 0
      ? "학업 경고를 풀겠다. 운동도 공부도 이렇게만 하자."
      : "조금씩 나아지고 있다. 제한 하나를 풀어 주마. 계속 노력해라.");
  }
  state.relations.coach = clamp(state.relations.coach, 0, 100);
  state.player.condition.morale = clamp(state.player.condition.morale, 0, 100);
}

const josaWord = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };

function roleMail(state) {
  const role = roleFor(state);
  state.player.role = role.id;
  const p = state.player;
  const d = depthChart(state);
  const lines = {
    key: "지금 팀에서 네가 제일 믿음직하다. 그만큼 책임감도 가져라.",
    starter: "이번 학기 주전으로 생각하고 있다. 자리는 지키는 게 더 어렵다.",
    rotation: "주전과 교체를 오갈 거다. 훈련에서 보여 주면 기회는 온다.",
    prospect: "아직 1학년이다. 서두르지 말고 기본기를 쌓아라.",
    reserve: "지금은 출전 기회가 적을 거다. 포기하지 말고 버텨라.",
  };
  const keys = Object.keys(POSITIONS[p.position].weights);
  const weak = keys.slice().sort((x, y) => getPath(p.stats, x) - getPath(p.stats, y))[0];
  const drill = drillFor(weak);
  const last = d.list[d.slots - 1];
  const gap = last ? last.ovr - ovr(p) : 0;
  const body = [lines[role.id],
    d.rank <= d.slots ? "네 자리는 지금 네 거다. 다만 뒤에서 쫓아오는 발소리도 들어라."
      : gap > 8 ? "앞에 선 선수들과는 아직 거리가 있다. 조급해하지 말고, 하루하루 쌓아라."
      : "선발까지 그리 멀지 않다. 한 학기면 충분히 따라잡을 수 있는 거리다.",
    `이번 학기엔 ${josaWord(STAT_LABEL[weak], "을", "를")} 채워 와라. 네 자리에서 지금 제일 아쉬운 부분이다.${drill ? ` ${josaWord(drill.label, "이", "가")} 도움이 될 거다.` : ""}`];
  mail(state, "coach", `이번 학기 역할: ${role.label}`, body.join("\n\n"));
}

function graduateSeniors(state, g) {
  const leaving = state.team.roster.filter(m => mateGrade(m, g) === 3).map(m => m.name);
  (state.flags.gradMail ||= {})[g] = true;
  if (leaving.length) mail(state, "group", "선배들이 졸업했습니다",
    `${leaving.join(", ")} ${leaving.length > 1 ? "선배들이" : "선배가"} 졸업했다. 고등학교에 가서도 잘할 거다.\n동계대회부터는 선배들 없이 뛴다. 남긴 자리는 이제 우리가 채워야 한다.`);
  seniorsLeave(state, g);
}

function yearTransition(state, oldGrade) {
  const p = state.player;
  const summary = {
    grade: oldGrade,
    ovrFrom: null, ovrTo: Math.round(ovr(p)),
    heightFrom: state.yearStart.height, heightTo: p.body.height,
    matches: state.record.matches.filter(m => m.grade === oldGrade && m.minutes > 0).length,
    goals: state.record.matches.filter(m => m.grade === oldGrade).reduce((s, m) => s + m.goals, 0),
  };
  const fake = { ...p, stats: state.yearStart.stats };
  summary.ovrFrom = Math.round(ovr(fake));

  if (oldGrade === 1) {
    const off = state.record.matches.filter(m => m.grade === 1 && m.official);
    const starts = off.filter(m => m.status === "start").length;
    state.flags.wasBenchInG1 = off.length > 0 && starts / off.length < 0.3;
  }

  state.calendar.grade = oldGrade + 1;
  ageRoster(state);
  relationsNewYear(state);
  const leaving = state.team.roster.filter(m => mateGrade(m, oldGrade) === 3).map(m => m.name);
  const joining = state.team.roster.filter(m => mateGrade(m, oldGrade + 1) === 1 && m.cohort !== "동기").map(m => m.name);

  if (leaving.length && !state.flags.gradMail?.[oldGrade]) mail(state, "group", "선배들이 졸업했습니다",
    `${leaving.join(", ")} ${leaving.length > 1 ? "선배들이" : "선배가"} 졸업했다. 고등학교에 가서도 잘할 거다.\n선배들이 남긴 번호와 자리는 이제 우리가 채워야 한다.`);
  if (joining.length) mail(state, "group", "신입생이 들어왔습니다",
    `새 1학년 ${joining.join(", ")} 입단! 이제 너도 선배다. 잘 챙겨 줘라.`);

  if (oldGrade + 1 === 2) {
    p.number = randomFreeNumber(state, 13, 29);
    p.numberHistory.push({ grade: 2, number: p.number });
    mail(state, "coach", `2학년 등번호: ${p.number}번`, `2학년은 13번부터 29번 사이에서 번호를 준다. 올해 너는 ${p.number}번이다.`);
  } else if (oldGrade + 1 === 3) {
    state.pending = { type: "number" };
    mail(state, "coach", "3학년 등번호를 골라라", "이제 3학년이다. 원하는 번호를 골라 와라. 다만 7번, 9번, 10번은 탐내는 녀석이 많을 거다.");
  }

  // 코치 재평가
  const est = p.potential + normal(0, 3);
  p.coachStars = clamp(Math.round(((est - 55) / 7) * 2) / 2, 1, 5);

  const ms = state.record.matches.filter(m => m.grade === oldGrade && m.rating != null);
  const best = ms.slice().sort((a, b) => b.rating - a.rating)[0];
  const avg = ms.length ? (ms.reduce((a, m) => a + m.rating, 0) / ms.length).toFixed(2) : null;
  const tours = state.record.tournaments.filter(t => t.grade === oldGrade).map(t => `${t.name} ${t.best}`).join(", ");
  const lg = state.record.leagues.filter(l => l.grade === oldGrade).map(l => `${l.half} ${l.rank}위`).join(", ");
  const grow = summary.ovrTo - summary.ovrFrom;
  mail(state, "coach", `중${oldGrade} 시즌 총평`, [
    grow >= 15 ? "1년 사이에 다른 선수가 됐다. 3월에 처음 봤을 때랑 지금은 공 받는 자세부터 다르다."
      : grow >= 8 ? "꾸준히 늘었다. 눈에 확 띄진 않아도, 뒤돌아보면 많이 왔다."
      : "생각보다 덜 늘었다. 열심히 안 했다는 게 아니라, 방향을 한번 돌아보자는 얘기다.",
    best ? `올해 제일 기억에 남는 건 ${best.opponent}전이다. 그날 너는 정말 좋았다.` : "올해는 경기장보다 훈련장에서 더 많은 걸 배웠을 거다.",
    (() => { const ls = state.record.leagues.filter(l => l.grade === oldGrade); if (!ls.length) return "";
      if (ls.some(l => l.rank === 1)) return "리그 우승도 했다. 그 순간은 오래 기억해라. 다만 내년엔 다들 우리를 잡으러 온다.";
      const avgR = ls.reduce((a, l) => a + l.rank, 0) / ls.length;
      return avgR <= 3 ? "팀으로도 좋은 한 해였다. 위에서 버티는 것도 실력이다." : "팀으로도 쉽지 않은 한 해였다. 그래도 끝까지 같이 뛰었다."; })(),
    oldGrade === 1 ? "이제 후배가 들어온다. 선배가 된다는 건 책임이 생긴다는 뜻이다." : "이제 3학년이다. 진학이 걸린 해다. 고등학교 감독님들이 경기를 보러 오실 거다.",
  ].filter(Boolean).join("\n\n"));
  if (oldGrade === 1 && CAPTAINS?.[2]) {
    mail(state, "group", "새 시즌, 새 주장",
      `${STAFF.coach}: 올해 주장은 ${CAPTAINS[2]}${_bat(CAPTAINS[2]) ? "이다" : "다"}. 다들 박수.\n\n주장 ${CAPTAINS[2]}: 작년 선배들만큼은 못해도, 우리 학년은 절대 안 무너진다. 2학년들도 이제 선배다. 후배들 잘 챙겨라.`);
  }

  state.yearStart = snapshotStats(state);
  return summary;
}

// 3학년 등번호 고르기. 인기 번호는 동기와 경쟁
const POPULAR = [7, 9, 10];
function numberChoices(state) { return freeNumbers(state, 1, 99); }

function chooseNumber(state, n) {
  const p = state.player;
  if (POPULAR.includes(n)) {
    const taken = state.pending?.takenBy || [];      // 이미 다른 번호를 가져간 동기는 빼고
    const rivals = activeRoster(state).filter(m => m.cohort === "동기" && !taken.includes(m.id)).sort((a, b) => b.ovrNow - a.ovrNow);
    const rival = rivals[0];
    if (rival) {
      const tried = state.pending?.tried || [];
      if (tried.includes(n)) return { ok: false, msg: `${n}번은 이미 ${state.pending?.owners?.[n] || rival.name}에게 넘어갔다.` };
      const pWin = clamp(0.5 + (ovr(p) - rival.ovrNow) / 20 + (state.relations.coach - 50) / 100, 0.15, 0.9);
      if (!chance(pWin)) {
        rival.number = n;                              // 그 동기가 실제로 그 번호를 달게 됨
        state.pending = { type: "number", tried: [...tried, n], takenBy: [...taken, rival.id], owners: { ...(state.pending?.owners || {}), [n]: rival.name } };
        mail(state, "group", `${n}번 쟁탈전`, `${rival.name}도 ${n}번을 원했다. 감독님은 ${rival.name}의 손을 들어 주셨다.`);
        return { ok: false, msg: `${rival.name}도 ${n}번을 원했고, 감독님은 ${rival.name}의 손을 들어 주셨습니다. 다른 번호를 골라 주세요.` };
      }
      mail(state, "group", `${n}번 쟁탈전`, `${rival.name}도 ${n}번을 노렸지만, 감독님은 ${p.name}에게 ${n}번을 맡기셨다.`);
    }
  }
  p.number = n;
  p.numberHistory.push({ grade: 3, number: n });
  if (n === 10) state.flags.wore10 = true;
  state.pending = null;
  return { ok: true, msg: `올해 등번호는 ${n}번입니다.` };
}

function diffStats(a, b) {
  const out = [];
  for (const g of STAT_GROUPS) for (const [k, l] of g.stats) {
    const d = b[g.id][k] - a[g.id][k];
    if (Math.abs(d) >= 0.05) out.push({ path: `${g.id}.${k}`, label: l, from: a[g.id][k], to: b[g.id][k], d });
  }
  return out.sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
}

return { SLOTS, actionAllowed, currentFixture, slotLocked, planReady, runWeek, beginWeek, endWeek, POPULAR, numberChoices, chooseNumber };
})();
(__fix["js/engine/week.js"] || []).forEach(f => f());

// ── js/ui/util.js
__m["js/ui/util.js"] = (function () {
const {STAT_GROUPS} = __m["data/player.js"];
// 화면 공용 도구

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 그림이 아직 없으면 실루엣으로 대신합니다 (.webp → .png → 실루엣 순서로 시도)
const SILHOUETTE = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1C2759"/>` +
  `<circle cx="50" cy="40" r="17" fill="#3A4785"/><path d="M14 100c2-22 17-33 36-33s34 11 36 33z" fill="#F26B1D"/>` +
  `<path d="M38 68l12 9 12-9" fill="none" stroke="#1F2C8F" stroke-width="4"/></svg>`);

window.__imgFallback = el => {
  if (!el.dataset.tried) { el.dataset.tried = "1"; el.src = `assets/img/${el.dataset.name}.png`; }
  else { el.onerror = null; el.src = SILHOUETTE; }
};

const img = (name, alt = "") =>
  `<img src="assets/img/${name}.webp" data-name="${esc(name)}" alt="${esc(alt)}" loading="lazy" onerror="__imgFallback(this)">`;

const faceOf = (player, grade) => `${player.face}_g${Math.min(3, Math.max(1, grade))}`;

const fl = v => Math.floor(v);

function stars(n) {
  const pct = Math.round((n / 5) * 100);
  return `<span class="starbar" style="--p:${pct}%" aria-label="코치 평가 별 ${n}개"></span>`;
}

function gauge(label, value, { invert = false, max = 100 } = {}) {
  const v = Math.round(value);
  const good = invert ? 100 - v : v;
  const cls = good >= 55 ? "" : good >= 30 ? "warn" : "bad";
  return `<div class="gauge"><span>${label}</span>
    <div class="track"><div class="fill ${cls}" style="width:${Math.min(100, (v / max) * 100)}%"></div></div>
    <span class="v num">${v}</span></div>`;
}

function statLevel(v) { return v >= 70 ? "hi" : v >= 50 ? "mid" : v >= 15 ? "" : "lo"; }

function signed(d, digits = 1) {
  const s = d.toFixed(digits);
  return d > 0 ? `+${s}` : s;
}

const groupsOf = () => STAT_GROUPS;

const AVATAR = { coach: "📣", school: "🏫", family: "🏠", group: "💬", medical: "🩺", system: "🔔", scout: "🎓" };

// 문장 채우기: {name} → 값, {name|이/가} → 받침에 맞는 조사
function batchim(word) {
  const c = String(word).charCodeAt(String(word).length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 !== 0;
  return false;
}
function fillText(tpl, vars) {
  return tpl.replace(/\{(\w+)(?:\|([^/}]+)\/([^}]+))?\}/g, (_, k, a, b) => {
    const v = vars[k] ?? "";
    return a ? v + (batchim(v) ? a : b) : v;
  });
}

return { esc, img, faceOf, fl, stars, gauge, statLevel, signed, groupsOf, AVATAR, fillText };
})();
(__fix["js/ui/util.js"] || []).forEach(f => f());

// ── js/ui/fx.js
__m["js/ui/fx.js"] = (function () {

// 화면 연출: 뒤에 깔리는 배경 그림, 화면 들어올 때 움직임, 숫자 올라가기, 그림 미리 불러오기
const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// 저사양 기기는 흐림 효과와 배경 움직임을 끕니다
(function liteMode() {
  const n = navigator, cores = n.hardwareConcurrency || 8, mem = n.deviceMemory || 8;
  if (cores <= 4 && mem <= 3) document.documentElement.classList.add("lite");
})();

// ── 화면 뒤 배경 (홈: 저녁 운동장, 경기: 경기장) ──
// mode: home 은은하게 / dim 더 어둡게 / match 경기 화면 / prematch 경기 직전
let curScene = null;
function setScene(name, mode = "dim") {
  let host = document.getElementById("scene");
  if (!host) {
    host = document.createElement("div");
    host.id = "scene"; host.setAttribute("aria-hidden", "true");
    document.body.prepend(host);
  }
  host.dataset.mode = name ? mode : "none";
  if (name === curScene) return;
  curScene = name;
  const layer = document.createElement("div");
  layer.className = "scene-layer";
  if (name) {
    const im = new Image();
    im.alt = ""; im.decoding = "async";
    im.onerror = () => { if (!im.dataset.tried) { im.dataset.tried = "1"; im.src = `assets/img/${name}.png`; } else im.remove(); };
    im.src = `assets/img/${name}.webp`;
    layer.appendChild(im);
  }
  host.appendChild(layer);
  requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("on")));
  const old = [...host.children].slice(0, -1);
  setTimeout(() => old.forEach(o => o.remove()), 1100);
}

// ── 화면이 바뀔 때 새 화면이 부드럽게 올라오게 ──
function enter(el) {
  if (!el || reduced()) return;
  el.classList.remove("enter");
  void el.offsetWidth;          // 애니메이션 다시 시작
  el.classList.add("enter");
  setTimeout(() => el.classList.remove("enter"), 900);
}

// ── 숫자가 from → to 로 올라감 ──
function countUp(el, from, to, { ms = 700, delay = 0, digits = 0 } = {}) {
  if (reduced()) { el.textContent = to.toFixed(digits); return; }
  el.textContent = from.toFixed(digits);
  const start = performance.now() + delay;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const loop = now => {
    const t = Math.min(1, Math.max(0, (now - start) / ms));
    el.textContent = (from + (to - from) * ease(t)).toFixed(digits);
    if (t < 1) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ── 그림 미리 불러오기 (화면이 바뀔 때 그림이 늦게 뜨지 않도록) ──
const loaded = new Set();
function preload(names) {
  const list = names.filter(n => n && !loaded.has(n));
  if (!list.length) return;
  const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
  const nextOne = () => {
    const n = list.shift();
    if (!n) return;
    loaded.add(n);
    const im = new Image();
    im.onload = im.onerror = () => idle(nextOne);
    im.src = `assets/img/${n}.webp`;
  };
  idle(nextOne);
}
const SCENES = ["bg_home", "bg_prematch", "bg_stadium", "ev_retreat", "ev_singapore", "ev_sportsday", "ev_ski", "ev_festival", "ev_graduation", "bg_field_day",
  "ev_office", "ev_classroom", "ev_dinner", "ev_birthday", "ev_birthday_home", "ev_jjajang", "ev_welcome", "ev_schooltrip", "ev_beach", "bg_sea", "bg_locker"];

// ── 짧은 진동 (휴대폰) ──
function buzz(pattern) {
  try { navigator.vibrate?.(pattern); } catch { /* 지원 안 하면 무시 */ }
}

return { reduced, setScene, enter, countUp, preload, SCENES, buzz };
})();
(__fix["js/ui/fx.js"] || []).forEach(f => f());

// ── js/ui/sfx.js
__m["js/ui/sfx.js"] = (function () {

// 효과음: 소리 파일 없이 브라우저에서 직접 만듭니다 (용량 0). 처음에는 꺼져 있습니다.
let ctx = null, on = false, master = null;

function ensure() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
  return ctx;
}

// 짧은 음 하나
function tone(freq, { t = 0, dur = 0.12, type = "sine", vol = 0.2, slide = 0, attack = 0.005 } = {}) {
  const c = ctx, now = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, now);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(master); o.start(now); o.stop(now + dur + 0.02);
  return o;
}

// 잡음 (관중 함성, 휙 소리)
function noise({ t = 0, dur = 1, vol = 0.2, freq = 900, q = 0.8, type = "bandpass", attack = 0.08, sweep = 0 } = {}) {
  const c = ctx, now = c.currentTime + t;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, now); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), now + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(now); src.stop(now + dur + 0.02);
}

// 심판 휘슬: 높은 음 + 빠른 떨림
function whistle(t, dur) {
  const c = ctx, now = c.currentTime + t;
  const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = "sine"; o.frequency.value = 2900;
  lfo.frequency.value = 34; lg.gain.value = 140; lfo.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.13, now + 0.02);
  g.gain.setValueAtTime(0.13, now + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(master);
  o.start(now); lfo.start(now); o.stop(now + dur + 0.02); lfo.stop(now + dur + 0.02);
}

const SOUNDS = {
  tap: () => tone(1250, { dur: 0.05, vol: 0.07, slide: -400 }),
  select: () => { tone(660, { dur: 0.08, vol: 0.09, type: "triangle" }); tone(990, { t: 0.06, dur: 0.12, vol: 0.08, type: "triangle" }); },
  open: () => noise({ dur: 0.28, vol: 0.05, freq: 600, sweep: 1800, q: 0.6 }),
  good: () => { tone(784, { dur: 0.12, vol: 0.1, type: "triangle" }); tone(1175, { t: 0.09, dur: 0.22, vol: 0.1, type: "triangle" }); },
  bad: () => { tone(392, { dur: 0.14, vol: 0.1, type: "triangle" }); tone(294, { t: 0.12, dur: 0.25, vol: 0.1, type: "triangle" }); },
  up: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { t: i * 0.07, dur: 0.18, vol: 0.08, type: "triangle" })),
  kickoff: () => whistle(0, 0.45),
  half: () => { whistle(0, 0.3); whistle(0.4, 0.55); },
  full: () => { whistle(0, 0.28); whistle(0.36, 0.28); whistle(0.72, 0.8); },
  goal: () => {
    noise({ dur: 2.2, vol: 0.22, freq: 700, q: 0.5, attack: 0.15 });
    noise({ t: 0.05, dur: 1.8, vol: 0.12, freq: 1800, q: 0.7, attack: 0.2 });
    [523, 659, 784].forEach((f, i) => tone(f, { t: 0.05 + i * 0.09, dur: 0.5, vol: 0.07, type: "triangle" }));
  },
  concede: () => { noise({ dur: 1.1, vol: 0.12, freq: 380, q: 0.7, attack: 0.1, sweep: -200 }); tone(220, { t: 0.1, dur: 0.5, vol: 0.06, slide: -80 }); },
};

const sfx = {
  get on() { return on; },
  set(v) { on = !!v; },
  play(name) {
    if (!on) return;
    if (!ensure()) return;
    try { SOUNDS[name]?.(); } catch { /* 소리가 안 나도 게임은 계속 */ }
  },
};

// 버튼을 누를 때마다 작은 소리 (켜져 있을 때만)
document.addEventListener("pointerdown", e => {
  if (!on) return;
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.matches(".vn-choice, .mo-btn, .act, [data-c], [data-i]")) sfx.play("select");
  else sfx.play("tap");
}, { passive: true });

return { sfx };
})();
(__fix["js/ui/sfx.js"] || []).forEach(f => f());

// ── js/ui/modals.js
__m["js/ui/modals.js"] = (function () {
const {ACTIONS, CATEGORIES} = __m["data/actions.js"];
const {STAT_LABEL} = __m["data/player.js"];
const {actionAllowed, numberChoices, chooseNumber, POPULAR, SLOTS} = __m["js/engine/week.js"];
const {STATUS_LABEL} = __m["js/engine/match.js"];
const {ovr} = __m["js/engine/team.js"];
const {readSlot, saveTo, deleteSlot, exportCode, importCode} = __m["js/state.js"];
const {esc, fl, signed, img, faceOf, fillText} = __m["js/ui/util.js"];
const {eventView, eventVars, chooseEvent} = __m["js/engine/events.js"];
const {reduced, countUp} = __m["js/ui/fx.js"];
const {sfx} = __m["js/ui/sfx.js"];
// 팝업: 행동 고르기, 주간 결과, 메시지, 저장, 등번호, 학년 마무리, 졸업










const root = () => document.getElementById("modal-root");

function openModal(html, mount, { dismissable = true, onClose, scene = null, cls = "" } = {}) {
  const el = document.createElement("div");
  el.className = `backdrop ${scene ? "scened" : ""} ${cls}`;
  el.innerHTML = (scene ? `<div class="ev-scene" aria-hidden="true"><img src="assets/img/${scene}.webp" data-name="${scene}" alt="" onerror="__bgFallback(this)"></div>` : "")
    + `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  root().appendChild(el);
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    document.removeEventListener("keydown", onKey);
    // 닫힐 때 살짝 가라앉으며 사라짐 (그동안 눌리지 않게 이름을 바꿔 둠)
    if (reduced()) el.remove();
    else {
      el.inert = true; el.setAttribute("aria-hidden", "true");
      el.className = el.className.replace(/\bbackdrop\b/, "backdrop-gone");
      el.querySelector(".sheet")?.classList.replace("sheet", "sheet-gone");
      setTimeout(() => el.remove(), 230);
    }
    onClose?.();
  };
  const onKey = e => { if (e.key === "Escape" && dismissable) close(); };
  document.addEventListener("keydown", onKey);
  if (dismissable) el.addEventListener("click", e => { if (e.target === el) close(); });
  el.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
  mount?.(el, close);
  el.querySelector("button, input, textarea")?.focus({ preventScroll: true });
  return close;
}

// 브라우저 confirm() 대신 쓰는 확인 창 (일부 환경에서 confirm이 막혀 있음)
function ask(message, okLabel = "확인") {
  return new Promise(resolve => {
    let ok = false;
    openModal(`<p style="font-size:16px;margin:4px 0 18px;white-space:pre-line">${esc(message)}</p>
      <div style="display:flex;gap:10px"><button class="btn btn-ghost" style="flex:1" data-close>취소</button>
      <button class="btn btn-kit" style="flex:1" data-ok>${esc(okLabel)}</button></div>`,
      (el, close) => el.querySelector("[data-ok]").addEventListener("click", () => { ok = true; close(); }),
      { onClose: () => resolve(ok) });
  });
}

// ── 행동 고르기 ─────────────────────
function fxLine(a) {
  const parts = Object.entries(a.gains).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k]) =>
    `<span class="up">▲ ${k === "position" ? "포지션 능력치" : STAT_LABEL[k]}</span>`);
  if (a.fatigue) parts.push(`<span class="${a.fatigue > 0 ? "down" : "up"}">피로 ${a.fatigue > 0 ? "+" : ""}${a.fatigue}</span>`);
  if (a.morale) parts.push(`<span class="up">사기 +${a.morale}</span>`);
  if (a.coach) parts.push(`<span class="up">감독 신뢰 ▲</span>`);
  if (a.academicLoss) parts.push(`<span class="down">학업 ▼</span>`);
  if (a.heal) parts.push(`<span class="up">회복 빨라짐</span>`);
  if (a.rel) parts.push(...Object.keys(a.rel).map(k => `<span class="up">${{ friend: "친구", rival: "라이벌", mentor: "선배", junior: "후배" }[k]} 관계 ▲</span>`));
  if (a.minigame) parts.push(`<span class="mute">🎮</span>`);
  return parts.join("");
}

function actionPicker(app, slotId) {
  const state = app.state;
  let cat = ACTIONS.find(a => a.id === state.plan[slotId])?.cat || (state.player.condition.injury ? "rest" : "personal");
  const slot = SLOTS.find(s => s.id === slotId);
  const html = () => `<button class="close" data-close aria-label="닫기">×</button>
    <h2>${slot.label}</h2><p class="sub">무엇을 할까요?</p>
    <div class="tabs" role="tablist">${CATEGORIES.map(c => `<button role="tab" data-cat="${c.id}" aria-selected="${c.id === cat}">${c.label}</button>`).join("")}</div>
    <div class="acts">${ACTIONS.filter(a => a.cat === cat).map(a => {
      const ok = actionAllowed(state, a);
      if (!ok.ok && a.injured === "only") return "";
      return `<button class="act ${state.plan[slotId] === a.id ? "sel" : ""}" data-act="${a.id}" ${ok.ok ? "" : "disabled"}>
        <span class="n">${a.icon} ${a.label}${ok.ok ? "" : ` <small class="mute">(${ok.reason})</small>`}</span>
        <span class="d">${esc(fillText(a.desc, eventVars(state)))}</span><span class="fx">${fxLine(a)}</span></button>`;
    }).join("")}</div>`;
  openModal(html(), function mount(el, close) {
    el.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
      cat = b.dataset.cat; el.querySelector(".sheet").innerHTML = html(); mount(el, close);
      el.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", close));
    }));
    el.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
      state.plan[slotId] = b.dataset.act; close(); app.render();
    }));
  });
}

// ── 주간 결과 ───────────────────────
function weekReport(app, rep, done) {
  const m = rep.match;
  const resCls = m ? { 승: "W", 무: "D", 패: "L" }[m.result] : "";
  const ups = rep.deltas.filter(d => d.d > 0);
  const downs = rep.deltas.filter(d => d.d < 0);
  const crossed = d => fl(d.to) > fl(d.from);
  const html = `<h2>${rep.title}</h2>
    <p class="sub">${rep.actions.length ? rep.actions.join(", ") : "경기 주간"}</p>
    ${m ? `<div class="scoreline">
        <span class="tm">고흥FC</span><span class="sc num">${m.gf} : ${m.ga}</span><span class="tm">${esc(m.opponent)}</span>
        <span style="grid-column:1/-1;font-size:13px"><span class="badge-res ${resCls}">${m.result}</span>
        ${m.comp}${m.round ? ` ${m.round}` : ""}. ${m.minutes > 0
          ? `${STATUS_LABEL[m.status]} ${m.minutes}분, 평점 <b>${m.rating.toFixed(1)}</b>${m.goals ? `, ⚽ ${m.goals}골` : ""}${m.assists ? `, 🅰️ ${m.assists}도움` : ""}`
          : (m.reason || STATUS_LABEL[m.status])}</span></div>` : ""}
    ${rep.minigames ? `<div class="mg-sum">🎮 ${Object.entries(rep.minigames).map(([k, v]) => `${SLOTS.find(x => x.id === k).label} <b class="mg-grade g${{ 1.5: "S", 1.25: "A", 1: "B", 0.8: "C" }[v]}">${{ 1.5: "S", 1.25: "A", 1: "B", 0.8: "C" }[v]}</b>`).join(" ")}</div>` : ""}
    ${rep.exam ? `<div class="alert gold">📝 ${rep.exam.name}${rep.exam.tier ? `: ${rep.exam.tier}` : " 끝"}</div>` : ""}
    ${rep.injury ? `<div class="alert">🩹 ${rep.injury.label}. ${rep.injury.weeks}주 정도 쉬어야 합니다.</div>` : ""}
    ${rep.recovered ? `<div class="alert gold">💪 부상에서 회복했습니다.</div>` : ""}
    ${rep.camp ? `<div class="alert gold">⛺ 합숙 훈련 주간: 훈련 효과 1.2배</div>` : ""}
    ${(rep.traits || []).map(t => `<div class="alert gold trait-new">✨ 새 특성 <b>${esc(t.label)}</b>: ${esc(t.desc)}</div>`).join("")}
    ${rep.body ? `<div class="alert gold">📏 신체 측정: 키가 ${rep.body.cm}cm 자랐습니다.</div>` : ""}
    <div class="result-list">
      ${ups.slice(0, 8).map((d, i) => `<div class="r" style="--i:${i}"><span>${d.label}</span><span class="num mute">${fl(d.from)} → <b style="color:var(--chalk)" data-from="${fl(d.from)}" data-to="${fl(d.to)}">${fl(d.to)}</b></span>
        <span class="num up pop" style="min-width:44px;text-align:right">${crossed(d) ? "▲ " : ""}${signed(d.d)}</span></div>`).join("")}
      ${downs.slice(0, 3).map(d => `<div class="r"><span>${d.label}</span><span class="num mute">${fl(d.from)} → ${fl(d.to)}</span>
        <span class="num down" style="min-width:44px;text-align:right">${signed(d.d)}</span></div>`).join("")}
      ${Math.abs(rep.coachDelta) >= 0.5 ? `<div class="r"><span>감독 신뢰</span><span></span><span class="num ${rep.coachDelta > 0 ? "up" : "down"}">${signed(rep.coachDelta)}</span></div>` : ""}
    </div>
    ${rep.mails.length ? `<p class="mute" style="font-size:13px">💬 새 메시지 ${rep.mails.length}개</p>` : ""}
    <button class="btn btn-kit btn-wide" data-close>확인</button>`;
  openModal(html, el => {
    el.querySelectorAll("[data-to]").forEach((b, i) => countUp(b, +b.dataset.from, +b.dataset.to, { delay: 180 + i * 70 }));
    if (m) sfx.play(m.result === "승" ? "good" : m.result === "패" ? "bad" : "tap");
    if ((rep.traits || []).length) setTimeout(() => sfx.play("up"), 300);
  }, { onClose: done, cls: "report" });
}

// list: 메시지함 순서(위에서 아래) 그대로. 이전 = 목록에서 위, 다음 = 목록에서 아래
function mailModal(m, { list = [m], onRead } = {}) {
  let i = Math.max(0, list.indexOf(m)), key = null;
  openModal(`<button class="close" data-close aria-label="닫기">×</button><div class="mail-view" id="mv"></div>
    <div class="mail-nav"><button class="btn btn-ghost" data-prev>◀ 이전</button><span class="mail-pos num" id="mpos"></span><button class="btn btn-ghost" data-next>다음 ▶</button></div>
    <button class="btn btn-wide" data-close>닫기</button>`, (el, close) => {
    const view = el.querySelector("#mv"), pos = el.querySelector("#mpos"), prev = el.querySelector("[data-prev]"), next = el.querySelector("[data-next]");
    const show = (k, dir = 0) => {
      i = Math.max(0, Math.min(list.length - 1, k));
      const cur = list[i];
      if (!cur.read) { cur.read = true; onRead?.(); }
      view.innerHTML = `<p class="sub">${esc(cur.from)}</p><h2>${esc(cur.title)}</h2><p class="mail-body">${esc(cur.body)}</p>`;
      view.classList.remove("in-l", "in-r"); void view.offsetWidth; if (dir) view.classList.add(dir > 0 ? "in-r" : "in-l");
      pos.textContent = `${i + 1} / ${list.length}`;
      prev.disabled = i === 0; next.disabled = i === list.length - 1;
      el.querySelector(".sheet").scrollTop = 0;
    };
    prev.addEventListener("click", () => show(i - 1, -1));
    next.addEventListener("click", () => show(i + 1, 1));
    key = e => { if (e.key === "ArrowLeft") show(i - 1, -1); if (e.key === "ArrowRight") show(i + 1, 1); };
    document.addEventListener("keydown", key);
    // 손가락으로 옆으로 밀어도 넘어감
    let sx = null, sy = null;
    view.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    view.addEventListener("touchend", e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      sx = null;
    });
    show(i);
  }, { onClose: () => document.removeEventListener("keydown", key) });
}

// ── 저장 ────────────────────────────
function saveModal(app, { loadOnly = false } = {}) {
  const fmt = t => new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const html = () => {
    const rows = ["auto", 1, 2, 3].map(w => {
      const d = readSlot(w);
      const name = w === "auto" ? "자동 저장" : `슬롯 ${w}`;
      return `<div class="saveslot"><div><div class="t">${name}</div>
        <div class="s">${d ? `${esc(d.summary)} (${fmt(d.savedAt)})` : "비어 있음"}</div></div>
        <div class="b">
          ${!loadOnly && w !== "auto" && app.state ? `<button class="btn btn-sm btn-kit" data-save="${w}">저장</button>` : ""}
          ${d ? `<button class="btn btn-sm" data-load="${w}">불러오기</button>` : ""}
          ${d && w !== "auto" && !loadOnly ? `<button class="btn btn-sm btn-ghost" data-del="${w}" aria-label="${name} 지우기">지우기</button>` : ""}
        </div></div>`;
    }).join("");
    return `<button class="close" data-close aria-label="닫기">×</button>
      <h2>${loadOnly ? "불러오기" : "저장과 불러오기"}</h2>
      <p class="sub">매주 자동 저장됩니다. 저장은 이 기기의 이 브라우저에만 남습니다.</p>
      <div class="slot-list">${rows}</div>
      <h2 style="font-size:17px;margin-top:20px">다른 기기로 옮기기</h2>
      <p class="sub">저장 코드를 복사해 다른 기기에서 붙여 넣으면 이어서 할 수 있습니다.</p>
      ${app.state && !loadOnly ? `<button class="btn btn-sm" data-export>저장 코드 만들기</button>` : ""}
      <textarea class="code" placeholder="저장 코드를 여기에 붙여 넣으세요" aria-label="저장 코드"></textarea>
      <button class="btn btn-sm" data-import style="margin-top:8px">코드로 불러오기</button>
      ${app.state && !loadOnly ? `<hr style="border:0;border-top:1px solid var(--line);margin:20px 0">
        <button class="btn btn-ghost btn-wide" data-title>타이틀 화면으로</button>` : ""}`;
  };
  openModal(html(), function mount(el, close) {
    const re = () => { el.querySelector(".sheet").innerHTML = html(); mount(el, close); el.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", close)); };
    el.querySelectorAll("[data-save]").forEach(b => b.addEventListener("click", async () => {
      const w = +b.dataset.save;
      if (readSlot(w) && !(await ask(`슬롯 ${w}에 덮어쓸까요?`, "덮어쓰기"))) return;
      app.saveTo(w); app.toast(`슬롯 ${w}에 저장했습니다`); re();
    }));
    el.querySelectorAll("[data-load]").forEach(b => b.addEventListener("click", async () => {
      const w = b.dataset.load === "auto" ? "auto" : +b.dataset.load;
      if (app.state && !(await ask("지금 진행 중인 게임은 마지막 자동 저장 이후 내용이 사라집니다. 불러올까요?", "불러오기"))) return;
      app.load(readSlot(w).state); close();
    }));
    el.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
      if (!(await ask("이 저장을 지울까요? 되돌릴 수 없습니다.", "지우기"))) return;
      deleteSlot(+b.dataset.del); re();
    }));
    el.querySelector("[data-export]")?.addEventListener("click", () => {
      const ta = el.querySelector("textarea");
      ta.value = exportCode(app.state, app.summary());
      ta.select();
      navigator.clipboard?.writeText(ta.value).then(() => app.toast("저장 코드를 복사했습니다"), () => {});
    });
    el.querySelector("[data-import]").addEventListener("click", () => {
      const d = importCode(el.querySelector("textarea").value);
      if (!d) { app.toast("코드를 읽지 못했습니다. 처음부터 끝까지 빠짐없이 붙여 넣었는지 확인해 주세요."); return; }
      app.load(d.state); close();
    });
    el.querySelector("[data-title]")?.addEventListener("click", async () => {
      if (!(await ask("타이틀로 나갑니다. 지난주까지는 자동 저장되어 있습니다.", "나가기"))) return;
      close(); app.toTitle();
    });
  });
}

// ── 3학년 등번호 ────────────────────
function numberModal(app, done) {
  const state = app.state;
  const html = (msg = "") => {
    const free = new Set(numberChoices(state));
    const tried = state.pending?.tried || [];
    return `<h2>3학년 등번호</h2>
      <p class="sub">원하는 번호를 고르세요. 노란 번호(7, 9, 10)는 동기와 경쟁합니다.</p>
      ${msg ? `<div class="alert gold" style="margin-bottom:12px">${esc(msg)}</div>` : ""}
      <div class="numgrid">${Array.from({ length: 99 }, (_, i) => i + 1).map(n =>
        `<button class="num ${POPULAR.includes(n) ? "pop" : ""}" data-n="${n}" ${free.has(n) && !tried.includes(n) ? "" : "disabled"}>${n}</button>`).join("")}</div>`;
  };
  openModal(html(), function mount(el, close) {
    el.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => {
      const r = chooseNumber(state, +b.dataset.n);
      if (r.ok) { close(); app.toast(r.msg); done?.(); }
      else { el.querySelector(".sheet").innerHTML = html(r.msg); mount(el, close); }
    }));
  }, { dismissable: false });
}

// ── 학년 마무리 ─────────────────────
function yearModal(app, y, done) {
  const p = app.state.player;
  openModal(`<h2>중${y.grade} 시즌이 끝났습니다</h2>
    <p class="sub">이제 중${y.grade + 1}입니다.</p>
    <div style="display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center;margin-bottom:14px">
      <div style="border-radius:10px;overflow:hidden">${img(faceOf(p, y.grade + 1), p.name)}</div>
      <dl class="kv">
        <dt>종합 능력치</dt><dd class="num">${y.ovrFrom} → ${y.ovrTo} <span class="up">▲${y.ovrTo - y.ovrFrom}</span></dd>
        <dt>키</dt><dd class="num">${y.heightFrom.toFixed(1)} → ${y.heightTo.toFixed(1)}cm</dd>
        <dt>출전</dt><dd class="num">${y.matches}경기, ${y.goals}골</dd>
      </dl></div>
    <p class="mute" style="font-size:14px">새 시즌 일정과 등번호, 팀 소식은 메시지함에서 확인하세요.</p>
    <button class="btn btn-kit btn-wide" data-close>새 학년 시작</button>`, null, { onClose: done });
}

// ── 이벤트 ──────────────────────────
function eventModal(app, done) {
  const state = app.state;
  const v = eventView(state);
  if (!v) { done?.(); return; }
  const vars = eventVars(state);
  const html = `<div class="ev">
      ${v.portrait ? `<div class="ev-por">${img(v.portrait, v.speaker)}</div>` : ""}
      <div class="ev-body">
        ${v.speaker ? `<div class="ev-who">${esc(v.speaker)}</div>` : `<div class="ev-who mute">이번 주 이야기</div>`}
        <p class="ev-text">${esc(fillText(v.text, vars))}</p>
      </div>
    </div>
    <div class="vn-choices" id="evc">${v.ev.choices.map((c, i) => `<button class="vn-choice" style="--i:${i}" data-i="${i}">${esc(fillText(c.label, vars))}</button>`).join("")}</div>`;
  openModal(html, (el, close) => {
    el.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => {
      const r = chooseEvent(state, +b.dataset.i);
      app.saveTo("auto");
      let score = 0;
      const chips = r.changes.map((c, i) => {
        if (c.note) { score -= 2; return `<span class="evchip down" style="--i:${i}">${esc(c.label)} ${esc(c.note)}</span>`; }
        const good = c.invert ? c.d < 0 : c.d > 0;
        score += good ? 1 : -1;
        return `<span class="evchip ${good ? "up" : "down"}" style="--i:${i}">${esc(c.label)} ${c.d > 0 ? "+" : ""}${Math.abs(c.d) < 1 ? c.d.toFixed(1) : Math.round(c.d)}</span>`;
      }).join("");
      el.querySelector("#evc").outerHTML = `<p class="ev-result">${esc(fillText(r.result, eventVars(state)))}</p>
        ${chips ? `<div class="evchips">${chips}</div>` : ""}
        <button class="btn btn-kit btn-wide" data-close style="margin-top:14px">확인</button>`;
      el.querySelector("[data-close]").addEventListener("click", close);
      el.querySelector("[data-close]").focus({ preventScroll: true });
      sfx.play(score >= 0 ? "good" : "bad");
    }));
  }, { dismissable: false, onClose: done, scene: v.ev.bg || null, cls: "event" });
}

return { openModal, ask, actionPicker, weekReport, mailModal, saveModal, numberModal, yearModal, eventModal };
})();
(__fix["js/ui/modals.js"] || []).forEach(f => f());

// ── js/ui/minigames.js
__m["js/ui/minigames.js"] = (function () {
const {openModal} = __m["js/ui/modals.js"];
// 훈련 미니게임 4종. 결과 등급에 따라 그 훈련의 능력치 상승량이 달라집니다.
//   S ×1.5 / A ×1.25 / B ×1.0 / C ×0.8   (건너뛰면 B)
// 능력치가 오르면 난이도 단계(LV.1~4)가 올라 더 빠르고 방해물이 많아집니다. 등급과 배율 기준은 그대로입니다.

const GRADES = { S: 1.5, A: 1.25, B: 1.0, C: 0.8 };
const STAT_FOR = { shooting: "tech.shoot", passing: "tech.pass", dribble: "tech.dribble", weight: "phys.strength" };
const INFO = {
  shooting: { title: "슈팅 훈련", tag: "SHOOTING DRILL", how: "조준점이 골문 위를 움직입니다. 골키퍼를 피해 구석을 노려 누르세요. 다섯 번 찹니다.", btn: "슈팅" },
  passing:  { title: "패스 훈련", tag: "PASSING DRILL", how: "동료 등번호를 1부터 6까지 순서대로 빠르게 누르세요. 흰 유니폼 상대를 누르면 끊깁니다.", btn: null },
  dribble:  { title: "드리블 훈련", tag: "DRIBBLE DRILL", how: "달려드는 수비를 왼쪽·오른쪽으로 피하세요. 12초 버티면 끝입니다. 방향키나 화면을 밀어서도 움직일 수 있습니다.", btn: null },
  weight:   { title: "웨이트 트레이닝", tag: "STRENGTH", how: "줄어드는 원이 주황 테두리에 닿는 순간 누르세요. 여섯 번 들어 올립니다.", btn: "들어 올리기" },
};
const ease = v => Math.max(0, Math.min(1, (v - 20) / 60));
function statFor(kind) { return STAT_FOR[kind]; }

// 난이도 단계: 그 훈련의 능력치 45 / 60 / 75 에서 한 단계씩
const levelOf = v => v >= 75 ? 4 : v >= 60 ? 3 : v >= 45 ? 2 : 1;
const LV_NAME = ["", "기본", "중급", "상급", "프로"];
const LV_NOTE = {
  shooting: ["", "", "조준점이 더 빨라졌습니다.", "골키퍼가 좌우로 움직입니다.", "골키퍼가 조준점을 따라붙습니다."],
  passing:  ["", "", "상대가 한 명 늘고 시간이 줄었습니다.", "상대 선수들이 패스 길로 움직입니다.", "상대가 더 많고, 시간이 더 짧습니다."],
  dribble:  ["", "", "수비가 더 빨리 달려옵니다.", "두 명이 한꺼번에 막아섭니다.", "더 빠르고, 더 자주 두 명이 막습니다."],
  weight:   ["", "", "원이 더 빨리 줄어듭니다.", "원이 줄어드는 속도가 매번 바뀝니다.", "판정 범위가 좁아졌습니다."],
};

// 공통 그래픽 조각
const SHIRT = (fill, stroke, num, numFill = "#fff") => `<path d="M-5 -4 L-2 -6 Q0 -4.6 2 -6 L5 -4 L6.5 -0.5 L4 0.6 L4 6 L-4 6 L-4 0.6 L-6.5 -0.5 Z" fill="${fill}" stroke="${stroke}" stroke-width=".6" stroke-linejoin="round"/>
  ${num != null ? `<text y="3.2" text-anchor="middle" class="mg-num" fill="${numFill}">${num}</text>` : ""}`;
// 입체감 있는 공: 가운데 오각형 + 가장자리 조각 + 둥근 음영 + 하이라이트 (그라데이션은 COMMON_DEFS)
const BALL = r => {
  const pent = (cx, cy, k) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; return `${(cx + Math.cos(a) * r * k).toFixed(2)},${(cy + Math.sin(a) * r * k).toFixed(2)}`; }).join(" ");
  const edge = [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + (i + 0.5) * Math.PI * 2 / 5; return `<polygon points="${pent(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, 0.32)}" fill="#1B1E26"/>`; }).join("");
  return `<g class="mg-ball"><circle r="${r}" fill="#F7F8FB"/><g clip-path="circle(${r}px at 0 0)">${edge}</g><polygon points="${pent(0, 0, 0.4)}" fill="#1B1E26"/>
    <circle r="${r}" fill="url(#mgBallShade)"/><circle r="${r}" fill="none" stroke="rgba(10,14,30,.55)" stroke-width="${(r * 0.08).toFixed(2)}"/>
    <ellipse cx="${(-r * 0.36).toFixed(2)}" cy="${(-r * 0.42).toFixed(2)}" rx="${(r * 0.3).toFixed(2)}" ry="${(r * 0.18).toFixed(2)}" fill="rgba(255,255,255,.8)" transform="rotate(-30 ${(-r * 0.36).toFixed(2)} ${(-r * 0.42).toFixed(2)})"/></g>`;
};
// 모든 장면이 같이 쓰는 그라데이션 (공 음영, 피부, 유니폼 주름)
const COMMON_DEFS = `
  <radialGradient id="mgBallShade" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="rgba(255,255,255,0)"/><stop offset=".55" stop-color="rgba(20,30,60,.06)"/><stop offset="1" stop-color="rgba(10,16,40,.55)"/></radialGradient>
  <linearGradient id="mgSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D99E76"/><stop offset=".45" stop-color="#F2C49B"/><stop offset="1" stop-color="#C98C66"/></linearGradient>
  <linearGradient id="mgShirtO" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9520F"/><stop offset=".4" stop-color="#FF7A2A"/><stop offset=".7" stop-color="#FF6B1A"/><stop offset="1" stop-color="#C94A0C"/></linearGradient>
  <linearGradient id="mgShirtW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C7CDE0"/><stop offset=".4" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#EEF1FA"/><stop offset="1" stop-color="#B9C0D6"/></linearGradient>
  <linearGradient id="mgNavy" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#141E66"/><stop offset=".5" stop-color="#2A3AA8"/><stop offset="1" stop-color="#121A5A"/></linearGradient>
  <linearGradient id="mgBlue" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1F2EA8"/><stop offset=".5" stop-color="#3B50E6"/><stop offset="1" stop-color="#1C2A99"/></linearGradient>`;
// 관중석: 점 대신 머리·어깨 실루엣, 드문드문 켜지는 카메라 플래시
function crowdRows(rowsY, cols, dx, seed = 1) {
  const pal = ["#232C63", "#2E3874", "#3A4583", "#C9561A", "#D9DDF0", "#1B2358", "#B8862F"];
  let out = "", fl = "";
  rowsY.forEach((y, row) => {
    for (let i = 0; i < cols; i++) {
      const x = i * dx + (row % 2) * dx / 2 + 1, k = (i * 7 + row * 3 + seed) % 7, c = pal[k];
      const op = (0.45 + ((i * 13 + row * 5) % 6) * 0.09).toFixed(2), sz = 1 + ((i * 3 + row) % 3) * 0.08;
      out += `<g transform="translate(${x.toFixed(1)},${y}) scale(${sz.toFixed(2)})" opacity="${op}"><path d="M-1.7 3.4 Q-1.7 1.3 0 1.2 Q1.7 1.3 1.7 3.4 Z" fill="${c}"/><circle cy="0" r="1.05" fill="${k === 4 ? "#8E94B0" : "#C49A7A"}" opacity=".85"/></g>`;
      if ((i * 31 + row * 17 + seed) % 23 === 0) fl += `<circle class="mg-bulb" cx="${x.toFixed(1)}" cy="${y}" r="1.1" style="animation-delay:${(((i * 37 + row * 11) % 50) / 10).toFixed(1)}s"/>`;
    }
  });
  return out + `<g fill="#fff">${fl}</g>`;
}
// 조명탑: 램프 여러 개 + 번짐 + 가로 빛줄기
const floodBank = (cx, cy, w = 12) => `<g transform="translate(${cx},${cy})">
    <rect x="${-w / 2 - 0.8}" y="-2.6" width="${w + 1.6}" height="5.2" rx=".8" fill="#141A36" stroke="#3A4466" stroke-width=".3"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${(-w / 2 + (i % 4) * w / 4 + 0.35).toFixed(2)}" y="${i < 4 ? -2 : 0.2}" width="${(w / 4 - 0.7).toFixed(2)}" height="1.8" rx=".3" fill="#FFFDF4"/>`).join("")}
    <ellipse rx="${w * 1.9}" ry="${w * 1.2}" fill="url(#mgBloom)" opacity=".9"/>
    <rect x="${-w * 2.6}" y="-.3" width="${w * 5.2}" height=".6" fill="url(#mgFlare)"/>
    <rect x="-.3" y="${-w * 1.1}" width=".6" height="${w * 2.2}" fill="url(#mgFlare)" opacity=".5" transform="rotate(90) rotate(-90)"/>
  </g>`;
const STADIUM_DEFS = `
  <radialGradient id="mgBloom" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,246,218,.9)"/><stop offset=".28" stop-color="rgba(255,236,190,.35)"/><stop offset="1" stop-color="rgba(255,236,190,0)"/></radialGradient>
  <linearGradient id="mgFlare" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(255,240,210,0)"/><stop offset=".5" stop-color="rgba(255,245,225,.95)"/><stop offset="1" stop-color="rgba(255,240,210,0)"/></linearGradient>
  <linearGradient id="mgHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(120,140,220,0)"/><stop offset="1" stop-color="rgba(150,170,240,.22)"/></linearGradient>
  <linearGradient id="mgBoard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3BB8"/><stop offset="1" stop-color="#16206E"/></linearGradient>`;
// 광고판: LED 느낌 + 글씨
const boards = (y, h, x0 = 0, x1 = 160) => {
  const words = ["GOHEUNG FC", "DREAM", "고흥대서중", "U-15"];
  let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" fill="#070B22"/>`;
  for (let x = x0, i = 0; x < x1; x += 22, i++) s += `<rect x="${x + 0.6}" y="${y + 0.6}" width="20.8" height="${h - 1.2}" rx=".5" fill="${i % 2 ? "url(#mgBoard)" : "#0F1640"}"/>
    <text x="${x + 11}" y="${y + h / 2 + 0.95}" text-anchor="middle" class="mg-boardtxt" fill="${i % 2 ? "#FFFFFF" : "#FF8A3D"}">${words[i % 4]}</text>`;
  return s + `<rect x="${x0}" y="${y}" width="${x1 - x0}" height=".35" fill="rgba(255,255,255,.25)"/>`;
};
// 터지는 조각 (골·완벽 등)
function burst(parent, x, y, { n = 14, colors = ["#FF6B1A", "#FFC93C", "#FFFFFF", "#3B50E6"], spread = 16, size = 1.1, cls = "mg-spark" } = {}) {
  parent.insertAdjacentHTML("beforeend", `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, d = spread * (0.55 + Math.random() * 0.6);
    return `<rect class="${cls}" x="${-size / 2}" y="${-size / 4}" width="${size}" height="${size / 2}" fill="${colors[i % colors.length]}" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d - spread * 0.3).toFixed(1)}px;--r:${Math.round(Math.random() * 720 - 360)}deg"/>`;
  }).join("")}</g>`);
  const g = parent.lastElementChild; setTimeout(() => g.remove(), 900);
}
// 필름 질감 (한 번만 만들어 CSS 변수로)
function ensureGrain() {
  if (document.documentElement.style.getPropertyValue("--mg-grain")) return;
  try {
    const c = document.createElement("canvas"); c.width = c.height = 96;
    const x = c.getContext("2d"), d = x.createImageData(96, 96);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    document.documentElement.style.setProperty("--mg-grain", `url(${c.toDataURL()})`);
  } catch { /* 캔버스가 없으면 질감 없이 */ }
}

function playMinigame(kind, statValue, slotLabel) {
  return new Promise(resolve => {
    const info = INFO[kind];
    const lv = levelOf(statValue);
    // 세로로 긴 휴대폰 화면: 창을 화면 가득 띄우고 장면도 세로형으로 그림
    const tall = innerHeight / innerWidth > 1.3 && innerWidth < 700;
    let finished = false, stop = () => {};
    const html = `<div class="mg">
      <div class="mg-head"><span class="eyebrow">${info.tag}</span><h2>${info.title}</h2><span class="mg-lv lv${lv}">LV.${lv} ${LV_NAME[lv]}</span><span class="mute">${slotLabel}</span></div>
      <p class="sub">${info.how}${LV_NOTE[kind][lv] ? ` <b class="mg-lvnote">${LV_NOTE[kind][lv]}</b>` : ""}</p>
      <div class="mg-area k-${kind}" id="mga"></div>
      <div class="mg-status" id="mgs" aria-live="polite"></div>
      <div class="ctl-row" id="mgc"><button class="btn btn-ghost" data-skip>건너뛰기 (B등급)</button><button class="btn btn-kit" data-go>시작</button></div>
    </div>`;
    ensureGrain();
    openModal(html, (el, close) => {
      const area = el.querySelector("#mga"), status = el.querySelector("#mgs"), ctl = el.querySelector("#mgc");
      const mg = el.querySelector(".mg");
      // 남은 높이에 맞춰 장면 크기를 정함 (가로·세로 비율은 그대로)
      const fit = () => {
        if (!tall || !area.isConnected) return;
        const svg = area.querySelector("svg"); if (!svg) return;
        const vb = svg.viewBox.baseVal, ar = vb.width / vb.height;
        // 장면을 뺀 나머지(제목·설명·상태·버튼) 높이를 직접 더해서 남는 높이를 구함
        const others = [...mg.children].filter(c => c !== area).reduce((t, c) => {
          const cs = getComputedStyle(c); return t + c.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
        }, 0);
        const availH = mg.clientHeight - others - 14;
        const availW = mg.clientWidth;
        const h = Math.max(160, Math.min(availH, availW / ar));
        area.style.width = `${Math.floor(h * ar)}px`;
      };
      addEventListener("resize", fit);
      const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => fit()) : null;
      ro?.observe(ctl);
      PREVIEW[kind](area, tall);
      requestAnimationFrame(fit);
      const prevStop = () => { removeEventListener("resize", fit); ro?.disconnect(); };
      const done = grade => {
        if (finished) return; finished = true; stop();
        const mult = GRADES[grade];
        area.insertAdjacentHTML("beforeend", `<div class="mg-result"><span class="mg-bigrade m${grade}">${grade}</span><span>훈련 효과 ×${mult}</span></div>`);
        status.textContent = "";
        ctl.innerHTML = `<button class="btn btn-kit btn-wide" data-ok>확인</button>`;
        fit(); prevStop();                                   // 확인 버튼이 생긴 만큼 장면 크기를 다시 맞춤
        ctl.querySelector("[data-ok]").addEventListener("click", () => { close(); resolve({ grade, mult }); });
        ctl.querySelector("[data-ok]").focus({ preventScroll: true });
      };
      ctl.querySelector("[data-skip]").addEventListener("click", () => { finished = true; stop(); prevStop(); close(); resolve({ grade: "B", mult: 1, skipped: true }); });
      ctl.querySelector("[data-go]").addEventListener("click", () => {
        ctl.innerHTML = info.btn ? `<button class="btn btn-kit btn-wide mg-act" data-act>${info.btn}</button>` : "";
        stop = GAMES[kind](area, status, ctl, ease(statValue), done, lv, tall) || (() => {});
        requestAnimationFrame(fit);
      });
    }, { dismissable: false, cls: tall ? "mg-modal mg-tall" : "mg-modal" });
  });
}

// 시작 전 미리보기 화면
const PREVIEW = {
  shooting: (area, tall) => { area.innerHTML = shootScene(tall); },
  passing: (area, tall) => {
    const demo = [{ x: 40, y: 30 }, { x: 74, y: 22 }, { x: 116, y: 34 }, { x: 54, y: 66 }, { x: 96, y: 70 }, { x: 132, y: 62 }, { x: 80, y: 74 }];
    area.innerHTML = passScene(demo, 6, tall).replace(/<\/svg>/, `<text x="${tall ? 48 : 80}" y="${tall ? 84 : 54}" class="mg-cap mgp-cap">준비되면 시작</text></svg>`);
  },
  dribble: (area, tall) => { area.innerHTML = `<div class="mgd-wrap">${dribbleScene(tall)}</div>`; },
  weight: (area, tall) => { area.innerHTML = weightScene(tall); wtDraw(area.querySelector("svg"), 1); },
};

// ── 슈팅 ────────────────────────────
// 야간 경기장, 원근감 있는 골문, 움직이는 골키퍼. 좌표: 가로 160 × 세로 96
const GX0 = 30, GX1 = 130, GTOP = 20, GLINE = 62;   // 골대 안쪽 왼쪽·오른쪽, 크로스바, 골라인
// tall: 세로 휴대폰에서는 좌우를 조금 잘라 내고 위(관중석 위층)와 아래(잔디)를 늘려 크게 보여 줌
function shootScene(tall = false) {
  const rowsY = tall ? [-27, -21.4, -15.8, -10.2, 13.6, 19.2, 24.8, 30.2] : [13.6, 19.2, 24.8, 30.2];
  const crowd = crowdRows(rowsY, 46, 3.6, 3);
  const Y0 = tall ? -40 : 0, H = tall ? 160 : 96, YB = tall ? 120 : 96;
  // 잔디: 가로 줄무늬 + 소실점으로 모이는 세로 줄무늬(체크 무늬) + 골문 앞 빛 웅덩이
  const stripes = [[40, 45], [45, 51], [51, 58], [58, 66], [66, 76], [76, 88], [88, 96], ...(tall ? [[96, 106], [106, 120]] : [])]
    .map(([y0, y1], i) => `<rect x="0" y="${y0}" width="160" height="${y1 - y0}" fill="${i % 2 ? "#187A41" : "#1D8A4A"}"/>`).join("");
  const VP = [80, -30];
  const fan = Array.from({ length: 14 }, (_, i) => {
    const a = -150 + i * 32, b = a + 16, y = YB;
    const xa = VP[0] + (a - VP[0]) * 1, xb = VP[0] + (b - VP[0]) * 1;
    const t = (40 - VP[1]) / (y - VP[1]);
    return `<polygon points="${(VP[0] + (xa - VP[0]) * t).toFixed(1)},40 ${(VP[0] + (xb - VP[0]) * t).toFixed(1)},40 ${xb.toFixed(1)},${y} ${xa.toFixed(1)},${y}" fill="rgba(0,0,0,.06)"/>`;
  }).join("");
  return `<svg viewBox="${tall ? "20 -40 120 160" : "0 0 160 96"}" class="mg-svg mg-shoot">
    <defs>${COMMON_DEFS}${STADIUM_DEFS}
      <linearGradient id="shSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030A"/><stop offset=".55" stop-color="#0B1238"/><stop offset="1" stop-color="#18235E"/></linearGradient>
      <linearGradient id="shBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,244,210,.18)"/><stop offset="1" stop-color="rgba(255,244,210,0)"/></linearGradient>
      <linearGradient id="shPost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA4B8"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E6EAF2"/><stop offset="1" stop-color="#8994AA"/></linearGradient>
      <linearGradient id="shBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#DCE1EB"/><stop offset="1" stop-color="#8994AA"/></linearGradient>
      <pattern id="shNet" width="2.6" height="2.6" patternUnits="userSpaceOnUse"><path d="M0 0 L2.6 2.6 M2.6 0 L0 2.6" stroke="rgba(255,255,255,.34)" stroke-width=".22"/></pattern>
      <linearGradient id="shNetDepth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(4,8,24,.55)"/><stop offset="1" stop-color="rgba(4,8,24,.15)"/></linearGradient>
      <radialGradient id="shPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,252,225,.24)"/><stop offset="1" stop-color="rgba(255,252,225,0)"/></radialGradient>
      <radialGradient id="shVig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.6)"/></radialGradient>
      <linearGradient id="shKit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#93B81F"/><stop offset=".4" stop-color="#D3FA45"/><stop offset=".7" stop-color="#C6F432"/><stop offset="1" stop-color="#86A81A"/></linearGradient>
      <linearGradient id="shTrail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgba(255,255,255,0)"/><stop offset="1" stop-color="rgba(255,236,170,.9)"/></linearGradient>
      <filter id="shGlow"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shSoft"><feGaussianBlur stdDeviation=".6"/></filter>
    </defs>
    <rect y="${Y0}" width="160" height="${H}" fill="url(#shSky)"/>
    ${tall ? `<path d="M0 -36 H160 V-4 H0 Z" fill="#0A1030"/><rect x="0" y="-4" width="160" height="1.6" fill="#FF6B1A" opacity=".75"/>` : ""}
    <!-- 지붕과 조명탑 -->
    <path d="M-10 ${tall ? -40 : 0} H170 V${tall ? -36 : 3.2} Q80 ${tall ? -33 : 6} -10 ${tall ? -36 : 3.2} Z" fill="#05081A"/>
    <path d="M14 4 L-14 62 L50 62 Z" fill="url(#shBeam)"/><path d="M146 4 L110 62 L174 62 Z" fill="url(#shBeam)"/>
    ${floodBank(14, 5)}${floodBank(146, 5)}
    <!-- 관중석 -->
    <path d="M0 10 H160 V34 H0 Z" fill="#0A1134"/>
    <g>${crowd}</g>
    <rect x="0" y="22" width="160" height="12" fill="url(#mgHaze)"/>
    <g fill="#FF6B1A" opacity=".85"><path d="M22 11 l5 1.6 -5 1.6 z"/><path d="M71 11 l5 1.6 -5 1.6 z"/><path d="M118 11 l5 1.6 -5 1.6 z"/></g>
    ${boards(34, 6)}
    <!-- 잔디 -->
    ${stripes}${fan}
    <ellipse cx="80" cy="66" rx="70" ry="16" fill="url(#shPool)"/>
    <g fill="none" stroke="rgba(255,255,255,.78)" stroke-width=".55">
      <path d="M0 ${GLINE} H160"/>
      <path d="M20 ${GLINE} L12 72 H148 L140 ${GLINE}"/>
      <path d="M2 ${GLINE} L-14 92"/><path d="M158 ${GLINE} L174 92"/>
      <path d="M58 72 Q80 78 102 72" opacity=".7"/>
    </g>
    <ellipse cx="80" cy="84" rx="1.2" ry=".5" fill="#fff" opacity=".8"/>
    <!-- 골대 그림자 -->
    <path d="M${GX0 + 1.2} ${GLINE} L${GX0 + 9} ${GLINE + 6} L${GX0 + 10.6} ${GLINE + 6} L${GX0 + 2.6} ${GLINE} Z M${GX1 - 1} ${GLINE} L${GX1 + 7} ${GLINE + 6} L${GX1 + 8.6} ${GLINE + 6} L${GX1 + 0.4} ${GLINE} Z" fill="rgba(0,0,0,.25)"/>
    <!-- 골문: 뒷그물(깊이 음영), 옆그물, 지붕 그물 -->
    <g id="shNetG">
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} H${GX0 + 6} Z" fill="url(#shNetDepth)"/>
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} H${GX0 + 6} Z" fill="url(#shNet)"/>
      <path d="M${GX0} ${GTOP} L${GX0 + 6} ${GTOP + 7} V${GLINE - 6} L${GX0} ${GLINE} Z" fill="url(#shNet)" opacity=".85"/>
      <path d="M${GX1} ${GTOP} L${GX1 - 6} ${GTOP + 7} V${GLINE - 6} L${GX1} ${GLINE} Z" fill="url(#shNet)" opacity=".85"/>
      <path d="M${GX0} ${GTOP} H${GX1} L${GX1 - 6} ${GTOP + 7} H${GX0 + 6} Z" fill="url(#shNet)" opacity=".75"/>
      <path d="M${GX0 + 6} ${GLINE - 6} H${GX1 - 6} L${GX1} ${GLINE} H${GX0} Z" fill="rgba(0,0,0,.22)"/>
      <path d="M${GX0 + 6} ${GTOP + 7} H${GX1 - 6} V${GLINE - 6} M${GX0 + 6} ${GTOP + 7} V${GLINE - 6}" fill="none" stroke="rgba(255,255,255,.4)" stroke-width=".45"/>
    </g>
    <!-- 골대 (둥근 기둥 음영) -->
    <path d="M${GX0} ${GLINE + .6} V${GTOP} H${GX1} V${GLINE + .6}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3.2" transform="translate(.8,.8)"/>
    <rect x="${GX0 - 1.3}" y="${GTOP - 1.3}" width="2.6" height="${GLINE - GTOP + 1.9}" fill="url(#shPost)"/>
    <rect x="${GX1 - 1.3}" y="${GTOP - 1.3}" width="2.6" height="${GLINE - GTOP + 1.9}" fill="url(#shPost)"/>
    <rect x="${GX0 - 1.3}" y="${GTOP - 1.3}" width="${GX1 - GX0 + 2.6}" height="2.6" fill="url(#shBar)"/>
    <!-- 골키퍼 -->
    <g transform="translate(0,${GLINE})"><g id="gk" class="mg-gkmove" style="transform:translateX(80px)"><g class="mg-keeper"><g class="mg-gkidle">
      <ellipse cx="0" cy=".6" rx="9" ry="1.6" fill="rgba(0,0,0,.4)" filter="url(#shSoft)"/>
      <path d="M-4.6 -11.4 L-5.4 -4.2 L-2.2 -4.2 L-1.2 -9.6 Z" fill="#1A1F2A"/><path d="M4.6 -11.4 L5.4 -4.2 L2.2 -4.2 L1.2 -9.6 Z" fill="#1A1F2A"/>
      <path d="M-5.4 -4.4 H-2.1 L-2.3 -.9 H-5.2 Z" fill="url(#shKit)"/><path d="M2.1 -4.4 H5.4 L5.2 -.9 H2.3 Z" fill="url(#shKit)"/>
      <path d="M-6.2 -1.2 Q-6.2 .4 -4.4 .4 H-1.8 L-2 -1.2 Z" fill="#0D0F14"/><path d="M6.2 -1.2 Q6.2 .4 4.4 .4 H1.8 L2 -1.2 Z" fill="#0D0F14"/>
      <path d="M-5.3 -12.6 H5.3 L4.8 -9.4 Q0 -8.4 -4.8 -9.4 Z" fill="#141821"/>
      <path d="M-6.2 -24.2 Q0 -26.4 6.2 -24.2 L5.7 -11.8 Q0 -10.8 -5.7 -11.8 Z" fill="url(#shKit)" stroke="#7C9A16" stroke-width=".35"/>
      <path d="M-6 -21 L6 -21 M-5.8 -18.4 L5.8 -18.4" stroke="rgba(20,40,0,.18)" stroke-width=".6"/>
      <path d="M-6.1 -24.2 L-14 -27.4 L-15.2 -24.8 L-6.5 -20.2 Z" fill="url(#shKit)" stroke="#7C9A16" stroke-width=".35"/>
      <path d="M6.1 -24.2 L14 -27.4 L15.2 -24.8 L6.5 -20.2 Z" fill="url(#shKit)" stroke="#7C9A16" stroke-width=".35"/>
      <path d="M-13.4 -27.6 L-14.6 -24.8" stroke="#141821" stroke-width=".9"/><path d="M13.4 -27.6 L14.6 -24.8" stroke="#141821" stroke-width=".9"/>
      <g><circle cx="-15.8" cy="-26.8" r="2.6" fill="#F4F6FF" stroke="#FF6B1A" stroke-width=".8"/><path d="M-17.6 -28.2 Q-15.8 -30.2 -14 -28.2" stroke="#FF6B1A" stroke-width=".6" fill="none"/></g>
      <g><circle cx="15.8" cy="-26.8" r="2.6" fill="#F4F6FF" stroke="#FF6B1A" stroke-width=".8"/><path d="M14 -28.2 Q15.8 -30.2 17.6 -28.2" stroke="#FF6B1A" stroke-width=".6" fill="none"/></g>
      <text y="-15.2" text-anchor="middle" font-size="5.4" font-weight="800" fill="#141821" font-family="Barlow Condensed, sans-serif">1</text>
      <rect x="-1.5" y="-26.8" width="3" height="2.6" fill="#D9A47E"/>
      <circle cy="-29.8" r="3.7" fill="url(#mgSkin)"/>
      <path d="M-3.8 -30.4 Q-3.6 -34.6 0 -34.2 Q3.8 -34.6 3.8 -30.4 Q2.2 -32.2 0 -32 Q-2.2 -32.2 -3.8 -30.4 Z" fill="#17171C"/>
      <path d="M-2 -30.6 h1.2 M.8 -30.6 h1.2" stroke="#2A1E18" stroke-width=".45" stroke-linecap="round"/>
      <circle cx="-1.3" cy="-29.4" r=".45" fill="#17171C"/><circle cx="1.3" cy="-29.4" r=".45" fill="#17171C"/>
      <path d="M-1 -27.6 Q0 -27.2 1 -27.6" stroke="#8A4A38" stroke-width=".4" fill="none" stroke-linecap="round"/>
    </g></g></g></g>
    <!-- 남은 공 자국 -->
    <g id="balls"></g>
    <g id="shTrailG"></g>
    <!-- 조준점 -->
    <g id="aim" transform="translate(80,40)" filter="url(#shGlow)">
      <circle r="4.6" fill="rgba(255,201,60,.12)" stroke="#FFC93C" stroke-width=".7"/>
      <circle r="1" fill="#FFC93C"/>
      <path d="M-7.4 0 H-5.4 M5.4 0 H7.4 M0 -7.4 V-5.4 M0 5.4 V7.4" stroke="#FFC93C" stroke-width=".8" stroke-linecap="round"/>
      <circle r="6.4" fill="none" stroke="rgba(255,201,60,.45)" stroke-width=".35" stroke-dasharray="2 2.2" class="mg-aimspin"/>
    </g>
    <!-- 공 -->
    <ellipse id="sshadow" cx="80" cy="88.2" rx="3.4" ry="1" fill="rgba(0,0,0,.45)" filter="url(#shSoft)"/>
    <g transform="translate(80,85.6)"><g id="sball">${BALL(2.9)}</g></g>
    <g id="shFx"></g>
    <text id="shMsg" x="80" y="52" text-anchor="middle" class="mg-shmsg"></text>
    <rect y="${Y0}" width="160" height="${H}" fill="url(#shVig)" pointer-events="none"/>
    <rect id="shFlash" y="${Y0}" width="160" height="${H}" fill="#FFF6D8" opacity="0" pointer-events="none"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(5)}</span><span id="pts" class="num">0점</span></div>`;
}
function shooting(area, status, ctl, e, done, lv = 1, tall = false) {
  area.innerHTML = shootScene(tall);
  const aim = area.querySelector("#aim"), gk = area.querySelector("#gk"), keeper = gk.querySelector(".mg-keeper"), ball = area.querySelector("#sball"),
    shadow = area.querySelector("#sshadow"), net = area.querySelector("#shNetG"), msg = area.querySelector("#shMsg"),
    dots = area.querySelectorAll("#dots i"), pts = area.querySelector("#pts");
  const period = (1500 - e * 650) * [1, 1, 0.86, 0.76, 0.68][lv];   // 단계가 오를수록 조준점이 빨라짐
  const gkW = (26 - e * 8) * 1.32;                                    // 골키퍼가 막는 폭 (가로 160 기준)
  const MID = (GX0 + GX1) / 2, HALF = (GX1 - GX0) / 2 - 4;
  let shot = 0, score = 0, x = MID, y = 40, t0 = performance.now(), raf, lock = false, gkC = MID, gkBase = MID, gkPh = Math.random() * 6;
  const setGk = (c, smooth) => { gkC = c; gk.style.transition = smooth ? "" : "none"; gk.style.transform = `translateX(${c}px)`; };
  const placeGk = () => { gkBase = MID - 28 + Math.random() * 56; setGk(gkBase, true); };
  gk.style.transform = `translateX(${MID}px)`;
  placeGk();
  const loop = now => {
    const t = (now - t0) / period;
    if (!lock) {                                  // 찬 뒤에는 조준점이 그 자리에 멈춤
      x = MID + Math.sin(t * Math.PI * 2) * HALF; y = (GTOP + GLINE) / 2 + 1 + Math.sin(t * Math.PI * 3.1) * 15;
      aim.setAttribute("transform", `translate(${x.toFixed(2)},${y.toFixed(2)})`);
    }
    if (!lock && lv >= 3) {
      let c = gkBase + Math.sin(now / (lv >= 4 ? 520 : 700) + gkPh) * (lv >= 4 ? 14 : 18);   // LV.3 좌우로 움직임
      if (lv >= 4) c += (x - c) * 0.22;                                                      // LV.4 조준점 쪽으로 따라붙음
      setGk(Math.max(GX0 + 8, Math.min(GX1 - 8, c)), false);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const fire = () => {
    if (lock) return; lock = true;
    const saved = Math.abs(x - gkC) <= gkW / 2 && y > GTOP + 4;
    const corner = x < GX0 + 24 || x > GX1 - 24;
    const p = saved ? 0 : corner ? 2 : 1;
    score += p;
    // 공이 날아가며 작아지고, 골키퍼가 몸을 날림
    ball.style.transition = "transform .36s cubic-bezier(.15,.7,.3,1)";
    ball.style.transform = `translate(${x - 80}px, ${y - 85.6}px) scale(.55) rotate(540deg)`;
    shadow.style.transition = "transform .36s cubic-bezier(.15,.7,.3,1), opacity .36s";
    shadow.style.transform = `translate(${(x - 80) * 0.9}px, ${GLINE - 88}px) scale(.5)`; shadow.style.opacity = ".4";
    // 막을 때는 공 쪽으로 정확히, 먹힐 때는 한 박자 늦게 짧게 몸을 날림
    const dx = Math.max(-26, Math.min(26, (x - gkC) * (saved ? 1 : 0.45)));
    const high = Math.max(0, Math.min(1, (GLINE - y - 10) / 26));          // 높은 공일수록 위로 뜀
    const rot = Math.max(-75, Math.min(75, dx * (2 + high * 1.5)));
    keeper.style.transform = `translate(${dx * 0.7}px, ${-high * 8}px) rotate(${rot}deg)`;
    const d = dots[shot]; d.className = saved ? "miss" : corner ? "top" : "hit";
    shot++;
    pts.textContent = `${score}점`;
    status.innerHTML = `<b class="${saved ? "down" : "up"}">${saved ? "막혔다!" : corner ? "구석! +2" : "골! +1"}</b>`;
    // 공 궤적
    const trailG = area.querySelector("#shTrailG"), fxG = area.querySelector("#shFx");
    const cx = 80 + (x - 80) * 0.35, cy = 84 - (84 - y) * 0.15 - 18;
    trailG.insertAdjacentHTML("beforeend", `<path class="mg-trail" d="M80 84 Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}" stroke="rgba(255,236,170,.75)" stroke-width="1.6"/><path class="mg-trail" d="M80 84 Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}" stroke="rgba(255,255,255,.9)" stroke-width=".5"/>`);
    setTimeout(() => { trailG.innerHTML = ""; }, 600);
    setTimeout(() => {
      if (saved) burst(fxG, x, y, { n: 10, colors: ["#FFFFFF", "#C6F432", "#DDE3FF"], spread: 9, size: .9 });
      else {
        burst(fxG, x, y, { n: corner ? 22 : 16, spread: corner ? 22 : 16 });
        const fl = area.querySelector("#shFlash"); fl.classList.remove("mg-flash"); void fl.getBoundingClientRect(); fl.classList.add("mg-flash");
        area.classList.remove("mg-shake"); void area.offsetWidth; area.classList.add("mg-shake");
      }
    }, 330);
    setTimeout(() => {
      msg.textContent = saved ? "SAVE" : "GOAL";
      msg.setAttribute("class", `mg-shmsg show ${saved ? "save" : "goal"}`);
      if (!saved) { net.classList.remove("ripple"); void net.getBoundingClientRect(); net.classList.add("ripple"); }
    }, 300);
    setTimeout(() => {
      area.querySelector("#balls").insertAdjacentHTML("beforeend", `<g transform="translate(${x},${y}) scale(.42)" opacity="${saved ? .35 : .7}">${BALL(2.9)}</g>`);
      ball.style.transition = "none"; ball.style.transform = "";
      shadow.style.transition = "none"; shadow.style.transform = ""; shadow.style.opacity = "";
      keeper.style.transform = "";
      msg.setAttribute("class", "mg-shmsg");
      if (shot >= 5) return done(score >= 8 ? "S" : score >= 6 ? "A" : score >= 4 ? "B" : "C");
      placeGk(); lock = false;
    }, 900);
  };
  ctl.querySelector("[data-act]").addEventListener("click", fire);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); fire(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 패스 ────────────────────────────
// 야간 경기장을 위에서 본 화면. 판정은 누른 순간에 끝나고, 공은 그 뒤를 따라 실제로 굴러가거나 떠서 날아감
// 좌표: 가로 160 × 세로 96
function passPitch() {
  // 잔디: 세로 줄무늬 + 가로 줄무늬를 겹친 체크 무늬, 네 귀퉁이 조명탑의 빛 웅덩이
  const stripes = Array.from({ length: 10 }, (_, i) => `<rect x="${i * 16}" y="0" width="16" height="96" fill="${i % 2 ? "#1A7C44" : "#1F8C4D"}"/>`).join("");
  const cross = Array.from({ length: 6 }, (_, i) => i % 2 ? `<rect x="0" y="${i * 16}" width="160" height="16" fill="rgba(255,255,255,.035)"/>` : "").join("");
  return `<defs>${COMMON_DEFS}
      <radialGradient id="psPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,248,215,.2)"/><stop offset="1" stop-color="rgba(255,248,215,0)"/></radialGradient>
      <radialGradient id="psFlood" cx=".5" cy=".46" r=".7"><stop offset="0" stop-color="rgba(255,250,225,.14)"/><stop offset="1" stop-color="rgba(255,250,225,0)"/></radialGradient>
      <radialGradient id="psVig" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(2,6,20,.62)"/></radialGradient>
      <pattern id="psNet" width="1.4" height="1.4" patternUnits="userSpaceOnUse"><path d="M0 0 L1.4 1.4 M1.4 0 L0 1.4" stroke="rgba(255,255,255,.5)" stroke-width=".18"/></pattern>
      <filter id="psSoft"><feGaussianBlur stdDeviation=".7"/></filter>
    </defs>
    ${stripes}${cross}
    <rect width="160" height="96" fill="url(#psFlood)"/>
    <ellipse cx="6" cy="6" rx="62" ry="44" fill="url(#psPool)"/><ellipse cx="154" cy="6" rx="62" ry="44" fill="url(#psPool)"/>
    <ellipse cx="6" cy="90" rx="62" ry="44" fill="url(#psPool)"/><ellipse cx="154" cy="90" rx="62" ry="44" fill="url(#psPool)"/>
    <g fill="none" stroke="rgba(255,255,255,.7)" stroke-width=".55">
      <rect x="3" y="3" width="154" height="90"/><path d="M80 3 V93"/><circle cx="80" cy="48" r="13"/>
      <rect x="3" y="26" width="20" height="44"/><rect x="137" y="26" width="20" height="44"/>
      <rect x="3" y="37" width="7" height="22"/><rect x="150" y="37" width="7" height="22"/>
      <path d="M23 41 A8 8 0 0 1 23 55"/><path d="M137 41 A8 8 0 0 0 137 55"/>
      <path d="M3 6 A3 3 0 0 0 6 3 M154 3 A3 3 0 0 0 157 6 M3 90 A3 3 0 0 1 6 93 M154 93 A3 3 0 0 1 157 90"/>
    </g>
    <circle cx="80" cy="48" r=".9" fill="rgba(255,255,255,.75)"/><circle cx="16" cy="48" r=".6" fill="rgba(255,255,255,.7)"/><circle cx="144" cy="48" r=".6" fill="rgba(255,255,255,.7)"/>
    <g><rect x="-1.6" y="43" width="4.4" height="10" fill="url(#psNet)"/><rect x="157.2" y="43" width="4.4" height="10" fill="url(#psNet)"/>
      <path d="M2.8 43 V53 M157.2 43 V53" stroke="#fff" stroke-width=".9"/></g>
    <g fill="#FF6B1A"><path d="M3 3 v-3 l2.4 1 z"/><path d="M157 3 v-3 l-2.4 1 z"/><path d="M3 93 v3 l2.4 -1 z"/><path d="M157 93 v3 l-2.4 -1 z"/></g>`;
}
// 위에서 살짝 비스듬히 본 선수 (네 조명탑이 만드는 겹그림자, 음영 있는 유니폼, 머리 하이라이트)
function passPlayer(us, num) {
  const fill = us ? "url(#mgShirtO)" : "url(#mgShirtW)", edge = us ? "#FFD7B8" : "#2D3FD1", txt = us ? "#fff" : "#1F2C8F", shorts = us ? "url(#mgNavy)" : "url(#mgBlue)";
  return `<ellipse cx="2.2" cy="9.2" rx="5.4" ry="1.5" fill="rgba(0,0,0,.22)" filter="url(#psSoft)" transform="rotate(14 2.2 9.2)"/>
    <ellipse cx="-1.6" cy="9.6" rx="5.4" ry="1.5" fill="rgba(0,0,0,.22)" filter="url(#psSoft)" transform="rotate(-14 -1.6 9.6)"/>
    <ellipse cx=".3" cy="9.7" rx="4.2" ry="1.3" fill="rgba(0,0,0,.35)"/>
    <g class="mgp-body">
      <rect x="-3" y="7.6" width="2.2" height="2" rx=".6" fill="#111"/><rect x=".8" y="7.6" width="2.2" height="2" rx=".6" fill="#111"/>
      <rect x="-3.7" y="5.2" width="3.1" height="3.6" rx=".9" fill="${shorts}"/><rect x=".6" y="5.2" width="3.1" height="3.6" rx=".9" fill="${shorts}"/>
      ${SHIRT(fill, edge, num, txt)}
      <path d="M-2 -6 Q0 -4.9 2 -6" fill="none" stroke="${us ? "#1F2C8F" : "#2D3FD1"}" stroke-width=".7"/>
      <circle cy="-8.4" r="2.6" fill="url(#mgSkin)"/>
      <path d="M-2.7 -9 Q-2.4 -11.6 0 -11.4 Q2.5 -11.6 2.7 -9 Q1.3 -10.2 0 -10.1 Q-1.3 -10.2 -2.7 -9 Z" fill="#17171C"/>
      <path d="M-1.4 -10.8 Q0 -11.3 1.2 -10.9" stroke="rgba(255,255,255,.25)" stroke-width=".4" fill="none"/>
      <circle cx="-.9" cy="-8" r=".32" fill="#1B1B1F"/><circle cx=".9" cy="-8" r=".32" fill="#1B1B1F"/>
    </g>`;
}
// tall: 세로 휴대폰에서는 경기장을 세워서 그림 (좌표는 그대로, 그룹째 90도 돌리고 선수만 다시 바로 세움)
function passScene(spots, nMates, tall = false) {
  const up = tall ? `<g transform="rotate(-90)">` : "<g>";
  return `<svg viewBox="${tall ? "0 0 96 160" : "0 0 160 96"}" class="mg-svg mgp">${tall ? `<g transform="translate(96,0) rotate(90)">` : "<g>"}${passPitch()}
    <g id="lines"></g><g id="fx"></g>
    ${spots.map((s, i) => [s, i]).sort((a, b) => (a[1] < nMates) - (b[1] < nMates)).map(([s, i]) => i < nMates
      ? `<g class="mgp-mate" data-n="${i + 1}" transform="translate(${s.x.toFixed(1)},${s.y.toFixed(1)})"><circle r="11" fill="transparent"/>${up}${passPlayer(true, i + 1)}
          <g class="mgp-check" transform="translate(0,-15)"><circle r="2.6" fill="#18C964"/><path d="M-1.2 0 L-.3 .9 L1.3 -.9" stroke="#fff" stroke-width=".7" fill="none"/></g></g></g>`
      : `<g class="mgp-foe" data-foe data-i="${i}" transform="translate(${s.x.toFixed(1)},${s.y.toFixed(1)})"><circle r="10" fill="transparent"/>${up}${passPlayer(false, null)}</g></g>`).join("")}
    <g id="pshadow" transform="translate(80,49.4)"><ellipse rx="2" ry=".8" fill="rgba(0,0,0,.45)" filter="url(#psSoft)"/></g>
    <g id="pball" transform="translate(80,48)"><g id="pspin">${BALL(1.8)}</g></g></g>
    <rect width="${tall ? 96 : 160}" height="${tall ? 160 : 96}" fill="url(#psVig)" pointer-events="none"/>
  </svg>`;
}
function passing(area, status, ctl, e, done, lv = 1, tall = false) {
  const limit = (6 + e * 3) * [1, 1, 0.92, 0.86, 0.8][lv];   // 단계가 오를수록 시간이 줄어듦
  const foesN = [0, 2, 3, 4, 5][lv];                          // 상대 수
  const spots = [];
  let sep = lv >= 4 ? 21 : 24, tries = 0;
  const far = (x, y) => spots.every(s => Math.hypot(s.x - x, s.y - y) > sep);
  while (spots.length < 6 + foesN) {
    const x = 14 + Math.random() * 132, y = 17 + Math.random() * 62;
    if (far(x, y) && Math.hypot(x - 80, y - 48) > 9) spots.push({ x, y });
    if (++tries % 400 === 0) sep *= 0.92;                     // 자리가 안 나오면 간격을 조금씩 줄임 (무한 반복 방지)
  }
  area.innerHTML = passScene(spots, 6, tall) + `<div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="nx" class="num">다음 1</span></div>`;
  const lines = area.querySelector("#lines"), fx = area.querySelector("#fx"), pball = area.querySelector("#pball"), pspin = area.querySelector("#pspin"),
    pshadow = area.querySelector("#pshadow"), tbar = area.querySelector("#tbar"), nx = area.querySelector("#nx");
  let nextN = 1, mistakes = 0, start = performance.now(), timer, last = { x: 80, y: 48 }, ended = false;
  const foeEls = [...area.querySelectorAll("[data-foe]")];
  // 공: 누를 때마다 목표를 줄 세우고, 앞 패스가 도착하면 다음으로 출발
  const ball = { x: 80, y: 48.5, from: null, to: null, t0: 0, dur: 0, peak: 0, spin: 0, queue: [] };
  const kick = now => {
    const tgt = ball.queue.shift(); if (!tgt) return;
    const d = Math.hypot(tgt.x - ball.x, tgt.y - ball.y);
    ball.from = { x: ball.x, y: ball.y }; ball.to = tgt; ball.t0 = now;
    ball.dur = Math.max(160, Math.min(420, d / 0.2));          // 멀수록 오래 날아감
    ball.peak = d > 48 ? d * 0.11 : d * 0.025;                 // 먼 패스는 띄워서, 짧은 패스는 땅볼로
  };
  const moveBall = now => {
    if (!ball.to && ball.queue.length) kick(now);
    let h = 0;
    if (ball.to) {
      const u = Math.min(1, (now - ball.t0) / ball.dur);
      const lofted = ball.peak > 3;
      const k = lofted ? u : 1 - (1 - u) * (1 - u);              // 땅볼은 마찰로 점점 느려짐
      const px = ball.x;
      ball.x = ball.from.x + (ball.to.x - ball.from.x) * k; ball.y = ball.from.y + (ball.to.y - ball.from.y) * k;
      h = ball.peak * 4 * u * (1 - u);
      ball.spin += (ball.x - px) * 22;
      if (u >= 1) {
        fx.insertAdjacentHTML("beforeend", `<circle class="mgp-ring" cx="${ball.to.x.toFixed(1)}" cy="${ball.to.y.toFixed(1)}" r="6"/>`);
        const r = fx.lastElementChild; setTimeout(() => r.remove(), 520);
        ball.to = null; kick(now);
      }
    }
    // 화면에서 "위"는 세운 경기장에서는 x 쪽이라, 공이 뜨는 방향과 그림자 방향도 바꿔 줌
    const [lx, ly] = tall ? [ball.x - h, ball.y] : [ball.x, ball.y - h];
    const [sx2, sy2] = tall ? [ball.x + 1.3, ball.y] : [ball.x, ball.y + 1.3];
    pball.setAttribute("transform", `translate(${lx.toFixed(2)},${ly.toFixed(2)}) scale(${(1 + h * 0.05).toFixed(3)})`);
    pspin.setAttribute("transform", `rotate(${(ball.spin % 360).toFixed(1)})`);
    pshadow.setAttribute("transform", `translate(${sx2.toFixed(2)},${sy2.toFixed(2)}) scale(${Math.max(0.5, 1 - h * 0.05).toFixed(3)})${tall ? " rotate(90)" : ""}`);
  };
  const tick = now => {
    if (lv >= 3) foeEls.forEach((g, k) => {          // LV.3부터 상대가 패스 길로 움직임
      const s0 = spots[+g.dataset.i], t = (now - start) / 1000;
      g.setAttribute("transform", `translate(${(s0.x + Math.sin(t * 1.7 + k) * 11).toFixed(2)},${(s0.y + Math.cos(t * 1.3 + k * 2) * 8).toFixed(2)})`);
    });
    moveBall(now);
    if (ended) { timer = requestAnimationFrame(tick); return; }
    const left = limit - (now - start) / 1000;
    tbar.style.width = `${Math.max(0, left / limit) * 100}%`;
    tbar.className = left < limit * 0.3 ? "low" : "";
    status.textContent = mistakes ? `실수 ${mistakes}` : "";
    if (left <= 0) return finish();
    timer = requestAnimationFrame(tick);
  };
  const finish = () => {
    if (ended) return; ended = true;
    const used = (performance.now() - start) / 1000, made = nextN - 1;
    done(made === 6 && mistakes === 0 && used < limit * 0.65 ? "S" : made === 6 && mistakes <= 1 ? "A" : made >= 4 ? "B" : "C");
  };
  const flash = (g, label, x, y) => {
    g.classList.remove("bad"); void g.getBBox(); g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 280);
    if (label) {
      const [tx, ty] = tall ? [x - 14, y] : [x, y - 14];
      fx.insertAdjacentHTML("beforeend", `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)})${tall ? " rotate(-90)" : ""}"><text class="mgp-pop" x="0" y="0">${label}</text></g>`);
      const t = fx.lastElementChild; setTimeout(() => t.remove(), 720);
    }
  };
  area.querySelectorAll("[data-n]").forEach(g => g.addEventListener("pointerdown", () => {
    if (ended) return;
    const s = spots[+g.dataset.n - 1];
    if (+g.dataset.n === nextN) {
      g.classList.add("ok");
      [...lines.children].forEach(l => l.classList.add("old"));
      lines.insertAdjacentHTML("beforeend", `<line x1="${last.x.toFixed(1)}" y1="${last.y.toFixed(1)}" x2="${s.x.toFixed(1)}" y2="${s.y.toFixed(1)}" class="mgp-glow"/><line x1="${last.x.toFixed(1)}" y1="${last.y.toFixed(1)}" x2="${s.x.toFixed(1)}" y2="${s.y.toFixed(1)}" class="mgp-trail"/>`);
      ball.queue.push(tall ? { x: s.x + 8.6, y: s.y - 3.4 } : { x: s.x + 3.4, y: s.y + 8.6 });   // 받는 선수의 발밑
      last = s; nextN++; nx.textContent = nextN <= 6 ? `다음 ${nextN}` : "완료";
      if (nextN > 6) finish();
    } else if (!g.classList.contains("ok")) { mistakes++; flash(g, "", 0, 0); }
  }));
  foeEls.forEach(g => g.addEventListener("pointerdown", () => {
    if (ended) return;
    mistakes += 2;
    const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute("transform"));
    flash(g, "끊겼다!", +m[1], +m[2]);
    burst(fx, +m[1], +m[2], { n: 10, colors: ["#FF3B4E", "#FFFFFF"], spread: 10, size: .9 });
  }));
  timer = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(timer);
}

// ── 드리블 ──────────────────────────
// 내 등 뒤에서 본 원근 화면. 수비는 멀리 지평선에서 달려와 점점 커짐
// 판정은 예전과 같음: 수비 위치(fy) 74~92 구간에서 같은 줄이면 부딪힘
// tall: 세로 휴대폰용 화면 (좌우를 조금 잘라 내고 위아래를 늘림. 판정 규칙은 같음)
let DRB, DR_ME_Y, DR_VB, DR_TALL = false;
const drY = fy => DRB.HOR + (DRB.BOT - DRB.HOR) * Math.pow(Math.max(0, (fy + 10) / 110), 1.55);
function drSetup(tall) {
  DR_TALL = !!tall;
  DRB = tall ? { VPY: 16, HOR: 46, BOT: 178, ME: 83 } : { VPY: 6, HOR: 25, BOT: 96, ME: 83 };
  DR_ME_Y = drY(DRB.ME);
  DR_VB = tall ? "16 0 128 178" : "0 0 160 96";
}
drSetup(false);
const drS = y => (y - DRB.VPY) / (DR_ME_Y - DRB.VPY);            // 원근 배율 (내 자리 = 1)
const drX = (lanePos, y) => 80 + (lanePos - 1) * 40 * drS(y);
function drRunner(front, legId) {
  // front: 앞에서 본 수비수 / 아니면 뒤에서 본 나. 발 위치가 원점
  const shirt = front ? SHIRT("url(#mgShirtW)", "#2D3FD1", null) : SHIRT("url(#mgShirtO)", "#FFD7B8", null);
  const shorts = front ? "url(#mgBlue)" : "url(#mgNavy)", sock = front ? "#F4F6FF" : "#FF6B1A", sleeve = front ? "#E9ECF6" : "#F06318";
  const arm = side => `<g class="mgd-arm${side}"><rect x="${side === "L" ? -6.6 : 4.6}" y="-20.6" width="2" height="5.6" rx=".9" fill="${sleeve}"/><rect x="${side === "L" ? -6.4 : 4.8}" y="-15.6" width="1.7" height="4.6" rx=".8" fill="url(#mgSkin)"/></g>`;
  return `<ellipse cx="0" cy="0" rx="6" ry="1.6" fill="rgba(0,0,0,.4)"/>
    <g class="mgd-arms">${arm("L")}${arm("R")}</g>
    <g ${legId ? `id="${legId}"` : ""} class="mgd-legs">
      <g class="mgd-legL"><rect x="-3.2" y="-8" width="2.4" height="8" rx="1" fill="#E8B88C"/><rect x="-3.3" y="-4" width="2.6" height="3.4" fill="${sock}"/><ellipse cx="-2" cy="-.4" rx="2" ry="1" fill="#111"/></g>
      <g class="mgd-legR"><rect x=".8" y="-8" width="2.4" height="8" rx="1" fill="#E8B88C"/><rect x=".7" y="-4" width="2.6" height="3.4" fill="${sock}"/><ellipse cx="2" cy="-.4" rx="2" ry="1" fill="#111"/></g>
    </g>
    <rect x="-4" y="-11" width="8" height="4" rx="1" fill="${shorts}"/>
    <g transform="translate(0,-16.5) scale(1.05)">${shirt}</g>
    <circle cy="-25" r="3.2" fill="url(#mgSkin)"/>
    ${front ? `<path d="M-3.3 -25.6 Q-3 -29 0 -28.8 Q3.1 -29 3.3 -25.6 Q1.6 -27.2 0 -27 Q-1.6 -27.2 -3.3 -25.6 Z" fill="#1B1B1F"/>
      <path d="M-2 -25.3 h1.2 M.8 -25.3 h1.2" stroke="#2A1E18" stroke-width=".45" stroke-linecap="round"/>
      <circle cx="-1.3" cy="-24.3" r=".42" fill="#1B1B1F"/><circle cx="1.3" cy="-24.3" r=".42" fill="#1B1B1F"/>
      <path d="M-1 -22.6 Q0 -22.2 1 -22.6" stroke="#8A4A38" stroke-width=".4" fill="none" stroke-linecap="round"/>
      <ellipse cx="-3.2" cy="-24.8" rx=".5" ry=".8" fill="#D99E76"/><ellipse cx="3.2" cy="-24.8" rx=".5" ry=".8" fill="#D99E76"/>`
            : `<path d="M-3.3 -24.4 Q-3.4 -29 0 -28.8 Q3.4 -29 3.3 -24.4 Q1.6 -23.6 0 -23.8 Q-1.6 -23.6 -3.3 -24.4 Z" fill="#1B1B1F"/>`}`;
}
function drCone() {
  return `<ellipse cx="0" cy="0" rx="4.6" ry="1.3" fill="rgba(0,0,0,.4)"/><path d="M-4.4 0 H4.4 L3.6 -1.2 H-3.6 Z" fill="#E2560C"/>
    <path d="M-3 -1.2 L0 -11 L3 -1.2 Z" fill="#FF7A1F"/><path d="M-2 -4.4 H2 L1.5 -6.4 H-1.5 Z" fill="#fff"/>`;
}
function dribbleScene(tall = false) {
  drSetup(tall);
  const rows = tall ? Math.floor((DRB.HOR - 18) / 4.2) : 2, L1 = tall ? 26 : 10, L2 = tall ? 134 : 150;
  const crowd = crowdRows(Array.from({ length: rows }, (_, row) => 11.6 + row * 4.2), 46, 3.55, 5);
  const edge = (o, y) => drX(o, y).toFixed(2);
  return `<svg viewBox="${DR_VB}" class="mg-svg mgd">
    <defs>${COMMON_DEFS}${STADIUM_DEFS}
      <linearGradient id="drGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F4F2B"/><stop offset=".35" stop-color="#16703D"/><stop offset="1" stop-color="#1D8B4B"/></linearGradient>
      <radialGradient id="drPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,250,220,.2)"/><stop offset="1" stop-color="rgba(255,250,220,0)"/></radialGradient>
      <linearGradient id="drSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030A"/><stop offset="1" stop-color="#16225E"/></linearGradient>
      <radialGradient id="drFlood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6DA"/><stop offset=".3" stop-color="rgba(255,240,200,.5)"/><stop offset="1" stop-color="rgba(255,240,200,0)"/></radialGradient>
      <linearGradient id="drFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(5,8,26,.75)"/><stop offset=".3" stop-color="rgba(5,8,26,0)"/></linearGradient>
      <radialGradient id="drVig" cx=".5" cy=".6" r=".8"><stop offset=".6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.5)"/></radialGradient>
    </defs>
    <rect width="160" height="${DRB.BOT}" fill="url(#drSky)"/>
    <path d="M0 9 H160 V${DRB.HOR} H0 Z" fill="#0A1134"/>${crowd}
    <rect x="0" y="${DRB.HOR - 10}" width="160" height="6" fill="url(#mgHaze)"/>
    ${boards(DRB.HOR - 4, 4)}
    ${floodBank(L1, 4.5, 10)}${floodBank(L2, 4.5, 10)}
    <rect x="0" y="${DRB.HOR}" width="160" height="${DRB.BOT - DRB.HOR}" fill="url(#drGrass)"/>
    <ellipse cx="80" cy="${DR_ME_Y.toFixed(1)}" rx="70" ry="${((DRB.BOT - DRB.HOR) * 0.45).toFixed(1)}" fill="url(#drPool)"/>
    <g id="drStripes"></g><g id="drSpeed"></g>
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".5">
      <path d="M${edge(-0.5, DRB.HOR)} ${DRB.HOR} L${edge(-0.5, DRB.BOT)} ${DRB.BOT}"/><path d="M${edge(0.5, DRB.HOR)} ${DRB.HOR} L${edge(0.5, DRB.BOT)} ${DRB.BOT}" stroke-dasharray="2 2"/>
      <path d="M${edge(1.5, DRB.HOR)} ${DRB.HOR} L${edge(1.5, DRB.BOT)} ${DRB.BOT}" stroke-dasharray="2 2"/><path d="M${edge(2.5, DRB.HOR)} ${DRB.HOR} L${edge(2.5, DRB.BOT)} ${DRB.BOT}"/>
    </g>
    <g transform="translate(80,${DRB.HOR})"><path d="M-6 0 V-4.4 H6 V0" fill="none" stroke="#fff" stroke-width=".7"/><rect x="-6" y="-4.4" width="12" height="4.4" fill="rgba(255,255,255,.12)"/></g>
    <rect x="0" y="${DRB.HOR}" width="160" height="30" fill="url(#drFade)"/>
    <g id="drBack"></g>
    <g id="drMe" transform="translate(80,${DR_ME_Y.toFixed(2)})"><g id="drLean">
      <g id="drBall" transform="translate(5,-1.2)"><ellipse id="drBallSh" cx="0" cy="1.4" rx="2" ry=".7" fill="rgba(0,0,0,.45)"/><g id="drBallB">${BALL(1.8)}</g></g>
      <g class="mgd-me">${drRunner(false, "drLegs")}</g>
    </g></g>
    <g id="drFront"></g>
    <g id="drFx"></g>
    <rect width="160" height="${DRB.BOT}" fill="url(#drVig)" pointer-events="none"/>
  </svg>`;
}
function dribble(area, status, ctl, e, done, lv = 1, tall = false) {
  const DURATION = 12000;
  const speed = (34 - e * 10) * [1, 1, 1.18, 1.3, 1.42][lv];   // 단계가 오를수록 수비가 빨라짐
  const gapMs = (820 - e * 220) * [1, 1, 0.9, 0.95, 0.88][lv];
  const pairP = [0, 0, 0, 0.3, 0.45][lv];                       // LV.3부터 두 명이 한꺼번에 막음
  area.innerHTML = `<div class="mgd-wrap" id="lanes">${dribbleScene(tall)}</div>
    <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="hits" class="num">부딪힘 0</span></div>`;
  ctl.innerHTML = `<button class="btn mg-dir" data-l>◀ 왼쪽</button><button class="btn mg-dir" data-r>오른쪽 ▶</button>`;
  const lanes = area.querySelector("#lanes"), tbar = area.querySelector("#tbar"), hitsEl = area.querySelector("#hits");
  const stripesG = area.querySelector("#drStripes"), backG = area.querySelector("#drBack"), frontG = area.querySelector("#drFront"), fxG = area.querySelector("#drFx");
  const meG = area.querySelector("#drMe"), leanG = area.querySelector("#drLean"), legs = area.querySelector("#drLegs"),
    legL = legs.querySelector(".mgd-legL"), legR = legs.querySelector(".mgd-legR"), ballG = area.querySelector("#drBall"), ballB = area.querySelector("#drBallB"), ballSh = area.querySelector("#drBallSh");
  // 잔디 줄무늬 (수비가 다가오는 속도와 같이 흘러감)
  const N = 9;
  stripesG.innerHTML = Array.from({ length: N }, (_, i) => `<polygon fill="${i % 2 ? "rgba(255,255,255,.055)" : "rgba(0,0,0,.05)"}"/>`).join("");
  const polys = [...stripesG.children];
  const speedG = area.querySelector("#drSpeed");
  const SL = [-1.55, -1.25, -0.95, 2.95, 3.25, 3.55];
  speedG.innerHTML = SL.map(() => `<line class="mg-speed"/>`).join("");
  const slines = [...speedG.children];
  const armsMe = area.querySelector("#drMe .mgd-arms");
  let lane = 1, px = 80, hits = 0, foes = [], start = performance.now(), last = start, spawnAt = start + 400, raf, run = 0, stumble = 0;
  const setLane = n => { lane = Math.max(0, Math.min(2, n)); };
  ctl.querySelector("[data-l]").addEventListener("pointerdown", () => setLane(lane - 1));
  ctl.querySelector("[data-r]").addEventListener("pointerdown", () => setLane(lane + 1));
  const key = ev => { if (ev.key === "ArrowLeft") setLane(lane - 1); if (ev.key === "ArrowRight") setLane(lane + 1); };
  document.addEventListener("keydown", key);
  // 밀기 또는 화면 왼쪽·오른쪽 누르기
  let sx = null;
  lanes.addEventListener("pointerdown", ev => { sx = ev.clientX; });
  lanes.addEventListener("pointerup", ev => {
    if (sx == null) return;
    const dx = ev.clientX - sx, r = lanes.getBoundingClientRect();
    if (Math.abs(dx) > 30) setLane(lane + (dx > 0 ? 1 : -1));
    else setLane(lane + (ev.clientX - r.left > r.width / 2 ? 1 : -1));
    sx = null;
  });
  const dust = (x, y, s) => {
    fxG.insertAdjacentHTML("beforeend", `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})">${Array.from({ length: 7 }, (_, i) =>
      `<circle class="mgd-dust" r="${(0.9 + (i % 3) * 0.5).toFixed(1)}" style="--dx:${(Math.cos(i * 0.9) * 8).toFixed(1)}px;--dy:${(-2 - (i % 4) * 2).toFixed(1)}px"/>`).join("")}</g>`);
    const g = fxG.lastElementChild; setTimeout(() => g.remove(), 650);
  };
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const flow = speed * 3;                                        // 수비가 다가오는 속도 (fy 단위/초)
    // 잔디 줄무늬
    const phase = ((now - start) / 1000 * flow / 120) % 1;
    polys.forEach((pg, i) => {
      const a = ((i + phase) / N) * 120 - 10, b = ((i + 1 + phase) / N) * 120 - 10;
      const ya = drY(a), yb = Math.min(DRB.BOT, drY(b));
      if (ya >= DRB.BOT) { pg.setAttribute("points", ""); return; }
      pg.setAttribute("points", `${drX(-1, ya).toFixed(1)},${ya.toFixed(1)} ${drX(3, ya).toFixed(1)},${ya.toFixed(1)} ${drX(3, yb).toFixed(1)},${yb.toFixed(1)} ${drX(-1, yb).toFixed(1)},${yb.toFixed(1)}`);
    });
    // 양옆 속도선
    slines.forEach((ln, i) => {
      const a = ((i * 0.37 + phase * 2.2) % 1) * 120 - 10, ya = drY(a), yb = Math.min(DRB.BOT, drY(a + 7));
      if (ya >= DRB.BOT) { ln.setAttribute("x1", 0); ln.setAttribute("x2", 0); ln.setAttribute("y1", 0); ln.setAttribute("y2", 0); return; }
      ln.setAttribute("x1", drX(SL[i], ya).toFixed(1)); ln.setAttribute("y1", ya.toFixed(1)); ln.setAttribute("x2", drX(SL[i], yb).toFixed(1)); ln.setAttribute("y2", yb.toFixed(1));
      ln.setAttribute("stroke-width", (0.25 + drS(yb) * 0.5).toFixed(2));
    });
    // 수비 등장 (예전과 같은 규칙)
    if (now >= spawnAt) {
      const first = Math.floor(Math.random() * 3);
      const ls = Math.random() < pairP ? [first, (first + 1 + Math.floor(Math.random() * 2)) % 3] : [first];
      for (const l of ls) {
        const cone = ls.length === 1 && Math.random() < 0.25;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "mgd-foe");
        g.innerHTML = `<g class="mgd-foeB">${cone ? drCone() : drRunner(true)}</g>`;
        backG.insertBefore(g, backG.firstChild);                   // 새로 온 수비는 멀리 있으니 뒤에 그림
        foes.push({ el: g, body: g.firstChild, l, y: -10, hit: false, cone, ph: Math.random() * 6, front: false });
      }
      spawnAt = now + gapMs * (ls.length > 1 ? 1.25 : 1) * (0.7 + Math.random() * 0.6);
    }
    for (const f of foes) {
      f.y += flow * dt;
      const y = drY(f.y), s = drS(y);
      if (!f.front && f.y > DRB.ME) { f.front = true; frontG.insertBefore(f.el, frontG.firstChild); }   // 나를 지나치면 내 앞쪽(화면 가까이)에 그림
      f.el.setAttribute("transform", `translate(${drX(f.l, y).toFixed(2)},${y.toFixed(2)}) scale(${(s * 1.05).toFixed(3)})`);
      if (!f.cone && !f.hit) {
        const sw = Math.sin(now / 70 + f.ph) * 26;
        const lg = f.body.querySelector(".mgd-legs");
        if (lg) { lg.children[0].setAttribute("transform", `rotate(${sw.toFixed(1)} -2 -8)`); lg.children[1].setAttribute("transform", `rotate(${(-sw).toFixed(1)} 2 -8)`); }
        const am = f.body.querySelector(".mgd-arms");
        if (am) { am.children[0].setAttribute("transform", `rotate(${(-sw * 0.9).toFixed(1)} -5.6 -20)`); am.children[1].setAttribute("transform", `rotate(${(sw * 0.9).toFixed(1)} 5.6 -20)`); }
      }
      if (!f.hit && f.y > 74 && f.y < 92 && f.l === lane) {
        f.hit = true; hits++; stumble = 1;
        f.el.classList.add("hit");
        if (!f.cone) f.body.setAttribute("transform", `translate(${f.l > lane ? -4 : 4},2) rotate(${f.l >= 1 ? -62 : 62})`);   // 태클
        lanes.classList.remove("shake"); void lanes.offsetWidth; lanes.classList.add("shake");
        dust(px, DR_ME_Y, 1.4);
        burst(fxG, px, DR_ME_Y - 8, { n: 9, colors: ["#FFFFFF", "#FF3B4E", "#DDE3FF"], spread: 10, size: 1 });
        hitsEl.textContent = `부딪힘 ${hits}`;
      }
    }
    foes = foes.filter(f => { if (f.y > 110) { f.el.remove(); return false; } return true; });
    // 나: 줄 이동은 판정상 즉시, 화면에서는 부드럽게 미끄러짐
    const tx = drX(lane, DR_ME_Y);
    const vx = (tx - px);
    px += vx * (1 - Math.exp(-dt * 20));
    run += dt * 15;
    stumble = Math.max(0, stumble - dt * 2.4);
    const sw = Math.sin(run) * 30;
    legL.setAttribute("transform", `rotate(${sw.toFixed(1)} -2 -8)`); legR.setAttribute("transform", `rotate(${(-sw).toFixed(1)} 2 -8)`);
    if (armsMe) { armsMe.children[0].setAttribute("transform", `rotate(${(-sw * 0.9).toFixed(1)} -5.6 -20)`); armsMe.children[1].setAttribute("transform", `rotate(${(sw * 0.9).toFixed(1)} 5.6 -20)`); }
    const bob = Math.abs(Math.sin(run)) * 0.9;
    meG.setAttribute("transform", `translate(${px.toFixed(2)},${(DR_ME_Y - bob).toFixed(2)})`);
    leanG.setAttribute("transform", `rotate(${Math.max(-14, Math.min(14, vx * 0.5 + Math.sin(now / 40) * stumble * 10)).toFixed(1)})`);
    // 공: 발끝에서 톡톡 치고 나감
    const touch = Math.abs(Math.sin(run * 0.5));
    ballG.setAttribute("transform", `translate(${(4.5 + Math.sin(run * 0.5) * 1.2).toFixed(2)},${(-1.4 - touch * 2.2).toFixed(2)})`);
    ballB.setAttribute("transform", `rotate(${(run * 60 % 360).toFixed(0)})`);
    ballSh.setAttribute("cy", (1.4 + touch * 2.2).toFixed(2));
    const left = (DURATION - (now - start)) / 1000;
    tbar.style.width = `${Math.max(0, left / 12) * 100}%`;
    if (left <= 0) return done(hits === 0 ? "S" : hits === 1 ? "A" : hits <= 3 ? "B" : "C");
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 웨이트 ──────────────────────────
// 야간 체력실, 옆에서 본 스쿼트. 원이 줄어드는 판정 규칙(반지름 26→4, 목표 10)은 예전과 같고, 화면에는 0.8배로 그림
let WT = { CX: 129, CY: 44, K: 0.8 };
// tall: 세로 휴대폰에서는 타이밍 원을 선수 아래 바닥 쪽에 둠
const wtSetup = tall => { WT = tall ? { CX: 71, CY: 118, K: 0.8, VB: "20 0 102 150", H: 150, BX: 26, DX: 34, Z: 1.14 } : { CX: 129, CY: 44, K: 0.8, VB: "0 0 160 96", H: 96, BX: 8, DX: 14, Z: 1.14 }; };
const wtZ = pt => [72 + (pt[0] - 72) * WT.Z, 78 + (pt[1] - 78) * WT.Z];      // 선수 그룹 좌표 → 화면 좌표
const lerp = (a, b, t) => a + (b - a) * t;
function wtPose(q) {
  // q: 0 = 가장 깊이 앉은 자세, 1 = 다 일어선 자세
  const A = [70, 77];
  const K = [lerp(80, 71, q), lerp(67, 64, q)];
  const H = [lerp(66, 70, q), lerp(64, 51, q)];
  const S = [lerp(75, 71, q), lerp(51, 36.5, q)];
  const head = [S[0] + lerp(4.2, 2.4, q), S[1] - lerp(4.2, 5.4, q)];
  const bar = [S[0] - 3.4, S[1] - 0.4];              // 바는 목 뒤 등 위에 얹힘
  const E = [S[0] - 6.2, S[1] + 4.6];
  const hand = [bar[0] - 1.6, bar[1] + 0.4];
  return { A, K, H, S, head, bar, E, hand, toe: [76.5, 78] };
}
function weightScene(tall = false) {
  wtSetup(tall);
  const bricks = Array.from({ length: 9 }, (_, r) => Array.from({ length: 12 }, (_, c) =>
    `<rect x="${c * 14 + (r % 2) * 7 - 7}" y="${r * 7 + 2}" width="13.2" height="6.2" rx=".6" fill="rgba(255,255,255,${(0.025 + ((r * 7 + c * 3) % 5) * 0.006).toFixed(3)})"/>`).join("")).join("");
  const p = wtPose(1);
  return `<svg viewBox="${WT.VB}" class="mg-svg mgw">
    <defs>
      <linearGradient id="wtWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1030"/><stop offset="1" stop-color="#1A2350"/></linearGradient>
      <radialGradient id="wtSpot" cx=".44" cy="0" r=".9"><stop offset="0" stop-color="rgba(255,236,200,.32)"/><stop offset=".5" stop-color="rgba(255,236,200,.08)"/><stop offset="1" stop-color="rgba(255,236,200,0)"/></radialGradient>
      <linearGradient id="wtSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5C6680"/><stop offset=".5" stop-color="#C9D1DE"/><stop offset="1" stop-color="#5C6680"/></linearGradient>
      <radialGradient id="wtPlate" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3A3F52"/><stop offset="1" stop-color="#14161F"/></radialGradient>
      <radialGradient id="wtVig" cx=".45" cy=".5" r=".8"><stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.55)"/></radialGradient>
      <filter id="wtSoft"><feGaussianBlur stdDeviation=".8"/></filter>
      <linearGradient id="wtMirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3466"/><stop offset=".5" stop-color="#1A2250"/><stop offset="1" stop-color="#121838"/></linearGradient>
      <linearGradient id="wtCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,240,205,.2)"/><stop offset="1" stop-color="rgba(255,240,205,.02)"/></linearGradient>
      <linearGradient id="wtFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1E30"/><stop offset="1" stop-color="#0B0D16"/></linearGradient>
      <linearGradient id="wtShirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C94A0C"/><stop offset=".45" stop-color="#FF7A2A"/><stop offset="1" stop-color="#E35A12"/></linearGradient>
      <linearGradient id="wtShorts" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#121A5A"/><stop offset=".5" stop-color="#2A3AA8"/><stop offset="1" stop-color="#141E66"/></linearGradient>
      ${COMMON_DEFS}
      <filter id="wtGlow"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="160" height="${WT.H}" fill="url(#wtWall)"/>${bricks}
    <rect x="0" y="9" width="160" height="5" fill="#FF6B1A" opacity=".85"/><rect x="0" y="14" width="160" height="1.2" fill="#1F2C8F"/>
    <text x="${WT.BX}" y="12.9" class="mgw-banner">GOHEUNG FC · STRENGTH</text>
    <!-- 거울과 벽 소품 -->
    <rect x="96" y="22" width="${tall ? 22 : 58}" height="40" rx="1" fill="url(#wtMirror)" stroke="#2B3355" stroke-width=".8"/>
    <path d="M100 24 L106 24 L98 60 L96 60 Z M110 24 L113 24 L105 60 L102 60 Z" fill="rgba(255,255,255,.05)"/>
    <g transform="translate(${tall ? 34 : 24},28)"><rect x="-9" y="-6" width="18" height="12" rx="1" fill="#1A2048" stroke="#FF6B1A" stroke-width=".5"/>
      <text y="-1" text-anchor="middle" class="mgw-poster">땀은</text><text y="3.4" text-anchor="middle" class="mgw-poster">배신하지 않는다</text></g>
    <g transform="translate(${tall ? 40 : 34},52)">${[0, 1, 2].map(i => `<rect x="${-7 + i * 5}" y="-1" width="1" height="8" fill="#5C6680"/><circle cx="${-6.5 + i * 5}" cy="${2 + (i % 2)}" r="${3.4 - i * 0.6}" fill="url(#wtPlate)" stroke="#2B3047" stroke-width=".4"/>`).join("")}</g>
    <!-- 천장 조명 -->
    <g transform="translate(72,15.2)"><rect x="-9" y="0" width="18" height="1.6" rx=".5" fill="#2B3047"/><rect x="-8" y="1.4" width="16" height=".9" fill="#FFF8E2"/></g>
    <path d="M64 17 L80 17 L104 78 L40 78 Z" fill="url(#wtCone)"/>
    <!-- 바닥 매트 -->
    <rect x="0" y="78" width="160" height="${WT.H - 78}" fill="url(#wtFloor)"/>
    <rect x="0" y="78" width="160" height="2.4" fill="rgba(255,255,255,.035)"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 20} 78 L${i * 20 - 6} ${WT.H}" stroke="rgba(255,255,255,.06)" stroke-width=".5"/>`).join("")}
    <path d="M0 78 H160" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>
    <!-- 덤벨 거치대와 초크통 -->
    <g transform="translate(${WT.DX},70)"><rect x="-10" y="0" width="22" height="8" rx="1" fill="#1D2236"/>${[-6, 0, 6].map(x => `<g transform="translate(${x + 1},-1)"><rect x="-3" y="-.8" width="6" height="1.6" fill="#8A93AA"/><rect x="-3.6" y="-2.2" width="1.8" height="4.4" rx=".5" fill="#2B3047"/><rect x="1.8" y="-2.2" width="1.8" height="4.4" rx=".5" fill="#2B3047"/></g>`).join("")}</g>
    <g transform="translate(100,78)"><path d="M-4 0 L-3 -6 H3 L4 0 Z" fill="#3A4060"/><ellipse cy="-6" rx="3.2" ry=".9" fill="#E9ECF5"/></g>
    <!-- 스쿼트 랙 -->
    <rect width="160" height="96" fill="url(#wtSpot)"/>
    <g transform="translate(72,78) scale(${WT.Z}) translate(-72,-78)">
    <g fill="url(#wtSteel)"><rect x="54" y="26" width="2.6" height="52" rx=".6"/><rect x="86" y="26" width="2.6" height="52" rx=".6"/></g>
    <rect x="54" y="26" width="34.6" height="2" rx=".6" fill="#5C6680"/>
    <rect x="52" y="58" width="39" height="1.6" rx=".6" fill="#8A93AA" opacity=".8"/>
    <ellipse cx="72" cy="78.4" rx="13" ry="1.6" fill="rgba(0,0,0,.5)" filter="url(#wtSoft)"/>
    <!-- 선수 -->
    <g id="wtBody" stroke-linejoin="round">
      <path id="wtShin" fill="url(#mgSkin)" stroke="#B9805C" stroke-width=".25"/>
      <path id="wtSock" fill="#FF6B1A"/>
      <path id="wtShoe" fill="#111"/>
      <path id="wtShoeHi" fill="none" stroke="#FF6B1A" stroke-width=".5"/>
      <path id="wtThigh" fill="url(#wtShorts)" stroke="#0E1446" stroke-width=".3"/>
      <path id="wtTorso" fill="url(#wtShirt)" stroke="#B4430B" stroke-width=".3"/>
      <path id="wtUpper" fill="#F06318"/>
      <path id="wtFore" fill="url(#mgSkin)"/>
      <circle id="wtHead" r="3.6" fill="url(#mgSkin)"/>
      <path id="wtHair" fill="#17171C"/>
      <circle id="wtEar" r=".8" fill="#D99E76"/>
      <path id="wtBand" fill="none" stroke="#FFFFFF" stroke-width=".9"/>
    </g>
    <!-- 바벨 (옆에서 보면 원판이 정면으로 보임) -->
    <g id="wtBar" transform="translate(${p.bar[0]},${p.bar[1]})"><g id="wtPlates">
      <circle cx="1" cy=".4" r="5.6" fill="#0B0C12"/>
      <circle r="5.6" fill="url(#wtPlate)" stroke="#FF6B1A" stroke-width="1.1"/>
      <text y="3.1" text-anchor="middle" class="mgw-kg">20KG</text>
      <circle r="3.9" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".4"/>
      <path d="M-3.6 -1.5 A3.9 3.9 0 0 1 -1 -3.7" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".5" stroke-linecap="round"/>
      <circle r="1.6" fill="url(#wtSteel)"/><circle r=".6" fill="#14161F"/>
    </g></g>
    </g>
    <g id="wtFx"></g>
    <!-- 타이밍 원 -->
    <g transform="translate(${WT.CX},${WT.CY})">
      <circle r="${(26 * WT.K).toFixed(1)}" fill="rgba(5,8,26,.55)" stroke="rgba(255,255,255,.08)"/>
      <circle r="${(10 * WT.K).toFixed(1)}" class="mg-target" fill="rgba(255,107,26,.12)"/>
      <circle id="ring" r="${(26 * WT.K).toFixed(1)}" class="mg-ring"/>
      <text id="wtRep" y="-24.5" text-anchor="middle" class="mgw-rep">REP 1 / 6</text>
    </g>
    <text id="wtMsg" x="${WT.CX}" y="${WT.CY + 3}" text-anchor="middle" class="mg-shmsg mgw-msg"></text>
    <rect width="160" height="${WT.H}" fill="url(#wtVig)" pointer-events="none"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(6)}</span><span id="pts" class="num">0점</span></div>`;
}
// a에서 b로 가는 팔다리: 시작 굵기 wa, 끝 굵기 wb, 가운데가 bulge만큼 불룩한 근육 모양
function limb(a, b, wa, wb, bulge = 0.6) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], wm = (wa + wb) / 2 + bulge;
  const P = (pt, w, sgn) => `${(pt[0] + nx * w / 2 * sgn).toFixed(2)} ${(pt[1] + ny * w / 2 * sgn).toFixed(2)}`;
  return `M${P(a, wa, 1)} Q${P(m, wm * 1.08, 1)} ${P(b, wb, 1)} L${P(b, wb, -1)} Q${P(m, wm * 1.08, -1)} ${P(a, wa, -1)} Z`;
}
function wtDraw(root, q, tilt = 0) {
  const p = wtPose(q), $ = id => root.querySelector(id);
  $("#wtShin").setAttribute("d", limb(p.K, p.A, 4.4, 2.8, 1.1));
  const sk = [lerp(p.K[0], p.A[0], 0.7), lerp(p.K[1], p.A[1], 0.7)];
  $("#wtSock").setAttribute("d", limb(sk, [p.A[0], p.A[1] - 0.4], 3.5, 3, 0));
  $("#wtShoe").setAttribute("d", `M${p.A[0] - 2.6} ${p.A[1] + 1.4} Q${p.A[0] - 2.4} ${p.A[1] - 1.6} ${p.A[0]} ${p.A[1] - 1.5} H${p.A[0] + 2.4} Q${p.toe[0] + 0.6} ${p.toe[1] - 0.8} ${p.toe[0] + 0.4} ${p.toe[1] + 0.4} L${p.toe[0] + 0.4} ${p.toe[1] + 0.9} H${p.A[0] - 2.6} Z`);
  $("#wtShoeHi").setAttribute("d", `M${p.A[0] - 1.6} ${p.A[1] + 0.2} L${p.toe[0] - 0.6} ${p.toe[1] - 0.1}`);
  $("#wtThigh").setAttribute("d", limb(p.H, p.K, 6.6, 4.8, 1.2));
  // 몸통: 등은 곧게, 가슴은 둥글게
  const tdx = p.H[0] - p.S[0], tdy = p.H[1] - p.S[1], tl = Math.hypot(tdx, tdy), nx = -tdy / tl, ny = tdx / tl;
  const pt = (o, w) => [o[0] + nx * w, o[1] + ny * w];
  const s1 = pt(p.S, -3.9), s2 = pt(p.S, 4.2), h1 = pt(p.H, -3.6), h2 = pt(p.H, 3.4), mid = [(p.S[0] + p.H[0]) / 2, (p.S[1] + p.H[1]) / 2], chest = pt(mid, 5.4);
  $("#wtTorso").setAttribute("d", `M${s1[0].toFixed(2)} ${s1[1].toFixed(2)} Q${pt(p.S, 0)[0].toFixed(2)} ${(pt(p.S, 0)[1] - 1.4).toFixed(2)} ${s2[0].toFixed(2)} ${s2[1].toFixed(2)} Q${chest[0].toFixed(2)} ${chest[1].toFixed(2)} ${h2[0].toFixed(2)} ${h2[1].toFixed(2)} L${h1[0].toFixed(2)} ${h1[1].toFixed(2)} Z`);
  $("#wtUpper").setAttribute("d", limb(p.S, p.E, 3.6, 2.8, 0.8));
  $("#wtFore").setAttribute("d", limb(p.E, p.hand, 2.6, 2, 0.5));
  const h = $("#wtHead"); h.setAttribute("cx", p.head[0].toFixed(2)); h.setAttribute("cy", p.head[1].toFixed(2));
  const [hx, hy] = p.head;
  $("#wtHair").setAttribute("d", `M${hx - 3.7} ${hy - 0.2} Q${hx - 3.6} ${hy - 4.4} ${hx} ${hy - 4} Q${hx + 3.4} ${hy - 4.2} ${hx + 3.6} ${hy - 1.4} Q${hx + 1} ${hy - 2.6} ${hx - 1.6} ${hy - 1.6} Q${hx - 2.8} ${hy - 1} ${hx - 3.7} ${hy - 0.2} Z`);
  const ear = $("#wtEar"); ear.setAttribute("cx", (hx - 0.6).toFixed(2)); ear.setAttribute("cy", (hy + 0.2).toFixed(2));
  $("#wtBand").setAttribute("d", `M${hx - 3.6} ${hy - 1.2} Q${hx} ${hy - 2.8} ${hx + 3.5} ${hy - 1.9}`);
  $("#wtBar").setAttribute("transform", `translate(${p.bar[0].toFixed(2)},${p.bar[1].toFixed(2)})`);
  $("#wtPlates").setAttribute("transform", `rotate(${tilt.toFixed(1)})`);
  return p;
}
function weight(area, status, ctl, e, done, lv = 1, tall = false) {
  area.innerHTML = weightScene(tall);
  const svg = area.querySelector("svg"), ring = area.querySelector("#ring"), dots = area.querySelectorAll("#dots i"), ptsEl = area.querySelector("#pts"),
    repEl = area.querySelector("#wtRep"), msg = area.querySelector("#wtMsg"), fx = area.querySelector("#wtFx"), body = area.querySelector("#wtBody");
  const baseDur = (1300 + e * 300) * [1, 1, 0.85, 0.8, 0.72][lv];   // 단계가 오를수록 원이 빨리 줄어듦
  const tol = (1.6 + e * 1.4) * (lv >= 4 ? 0.8 : 1);                // LV.4 판정 범위 좁아짐
  let dur = baseDur;
  const nextDur = () => { dur = lv >= 3 ? baseDur * (0.75 + Math.random() * 0.5) : baseDur; };   // LV.3부터 속도가 매번 바뀜
  let rep = 0, score = 0, t0 = performance.now(), raf, lock = false, rLogic = 26;
  // 자세: q를 목표로 부드럽게 따라감 (스프링). 들어 올릴 때는 결과에 따라 빠르기·흔들림이 다름
  let q = 1, qv = 0, qTarget = 1, stiff = 60, tilt = 0, tiltV = 0, shakeUntil = 0, lift = null;
  const loop = now => {
    const dt = Math.min(0.05, (now - (loop.last || now)) / 1000); loop.last = now;
    if (!lock) {
      const k = ((now - t0) % dur) / dur;
      rLogic = 26 - k * 22;
      ring.setAttribute("r", (rLogic * WT.K).toFixed(2));
      qTarget = 1 - 0.85 * Math.min(1, k * 1.15);                  // 원이 줄어드는 동안 천천히 앉음
      stiff = 70;
    } else if (lift) {
      const u = (now - lift.t) / 1000;
      if (lift.pts === 0) qTarget = u < 0.16 ? 0.42 : 0.12;          // 버티다 다시 주저앉음
      else qTarget = 1;
      stiff = lift.pts === 2 ? 420 : lift.pts === 1 ? 160 : 120;
    }
    // 감쇠 스프링 (완벽할수록 단단하게, 살짝 넘쳤다가 자리 잡음)
    const damp = 2 * Math.sqrt(stiff) * (lift?.pts === 2 ? 0.55 : 0.9);
    qv += (stiff * (qTarget - q) - damp * qv) * dt; q += qv * dt;
    q = Math.max(0, Math.min(1.04, q));
    tiltV += (-90 * tilt - 9 * tiltV) * dt; tilt += tiltV * dt;
    const shake = now < shakeUntil ? Math.sin(now / 22) * 0.8 : 0;
    body.setAttribute("transform", `translate(${shake.toFixed(2)},0)`);
    wtDraw(svg, Math.min(1, q), tilt + shake * 2);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const chalk = p => {
    const hz = wtZ(p.hand);
    fx.insertAdjacentHTML("beforeend", `<g transform="translate(${hz[0].toFixed(1)},${hz[1].toFixed(1)})">${Array.from({ length: 8 }, (_, i) =>
      `<circle class="mgw-chalk" r="${(0.8 + (i % 3) * 0.5).toFixed(1)}" style="--dx:${(Math.cos(i * 0.8) * 9).toFixed(1)}px;--dy:${(Math.sin(i * 0.8) * 6 - 4).toFixed(1)}px"/>`).join("")}</g>`);
    const g = fx.lastElementChild; setTimeout(() => g.remove(), 700);
  };
  const press = () => {
    if (lock) return; lock = true;
    const err = Math.abs(rLogic - 10);
    const pts = err <= tol ? 2 : err <= tol * 2.2 ? 1 : 0;
    score += pts;
    dots[rep].className = pts === 2 ? "top" : pts === 1 ? "hit" : "miss";
    rep++;
    ptsEl.textContent = `${score}점`;
    status.innerHTML = `<b class="${pts ? "up" : "down"}">${pts === 2 ? "완벽!" : pts === 1 ? "좋아" : "자세가 무너졌다"}</b>`;
    ring.classList.add(pts === 2 ? "perfect" : pts === 1 ? "good" : "miss");
    lift = { pts, t: performance.now() };
    if (pts) { tiltV = pts === 2 ? 70 : 30; chalk(wtPose(q)); } else shakeUntil = performance.now() + 380;
    if (pts === 2) {
      const pb = wtZ(wtPose(1).bar);
      fx.insertAdjacentHTML("beforeend", `<circle class="mg-shock" cx="${WT.CX}" cy="${WT.CY}" r="${(10 * WT.K).toFixed(1)}"/><circle class="mg-shock" cx="${pb[0].toFixed(1)}" cy="${pb[1].toFixed(1)}" r="7"/>`);
      burst(fx, pb[0], pb[1] - 4, { n: 14, spread: 14 });
      const sh = [...fx.querySelectorAll(".mg-shock")]; setTimeout(() => sh.forEach(x => x.remove()), 650);
    }
    if (pts >= 1) {
      const hd = wtZ(wtPose(q).head);
      fx.insertAdjacentHTML("beforeend", `<g transform="translate(${hd[0].toFixed(1)},${(hd[1] + 1).toFixed(1)})">${[0, 1, 2].map(i => `<path class="mg-sweat" d="M0 -1 Q.8 .2 0 .8 Q-.8 .2 0 -1 Z" style="--dx:${(i - 1) * 3 + 2}px;animation-delay:${i * 60}ms"/>`).join("")}</g>`);
      const sw = fx.lastElementChild; setTimeout(() => sw.remove(), 900);
    }
    msg.textContent = pts === 2 ? "PERFECT" : pts === 1 ? "GOOD" : "MISS";
    msg.setAttribute("class", `mg-shmsg mgw-msg show ${pts ? "goal" : "save"}`);
    setTimeout(() => {
      ring.classList.remove("perfect", "good", "miss"); msg.setAttribute("class", "mg-shmsg mgw-msg");
      if (rep >= 6) return done(score >= 10 ? "S" : score >= 7 ? "A" : score >= 4 ? "B" : "C");
      repEl.textContent = `REP ${rep + 1} / 6`;
      lift = null; t0 = performance.now(); nextDur(); lock = false;
    }, 480);
  };
  ctl.querySelector("[data-act]").addEventListener("click", press);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); press(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

const GAMES = { shooting, passing, dribble, weight };

return { GRADES, statFor, levelOf, playMinigame };
})();
(__fix["js/ui/minigames.js"] || []).forEach(f => f());

// ── data/audio.js
__m["data/audio.js"] = (function () {

// 배경음악 파일
// 비워 두면(null) 게임이 직접 만든 음악이 나옵니다.
// mp3 파일을 assets/audio/ 폴더에 넣고 이름을 적으면 그 파일이 대신 나옵니다.
//   예: home: "bgm_home.mp3"
// GitHub에 올리는 게임이라 저작권이 없는 음악(무료 공개 음악, 직접 만든 음악)만 넣어 주세요.
const BGM_FILES = {
  home: null,     // 타이틀, 홈 화면, 입단
  match: null,    // 경기
  ending: null,   // 엔딩
};

return { BGM_FILES };
})();
(__fix["data/audio.js"] || []).forEach(f => f());

// ── js/ui/bgm.js
__m["js/ui/bgm.js"] = (function () {
const {BGM_FILES} = __m["data/audio.js"];
// 배경음악: 브라우저가 직접 연주합니다 (용량 0). data/audio.js 에 파일을 적으면 그 파일을 씁니다.
// home 잔잔한 로파이 / match 신나는 경기 음악 / ending 피아노

let ctx = null, master = null, revIn = null, noiseBuf = null;
let on = false, want = null, cur = null, timer = null;
let play = null;            // 지금 연주 중인 곡 { name, gain, step, nextT, seed, file }
const VOLUME = 0.32;

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function ensure() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = VOLUME;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
  master.connect(comp); comp.connect(ctx.destination);
  // 잔향: 짧게 사라지는 잡음으로 만든 방 울림
  const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = ctx.createConvolver(); conv.buffer = ir;
  revIn = ctx.createGain(); revIn.gain.value = 0.32;
  revIn.connect(conv); conv.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return true;
}

// ── 악기 ──
function voice(dest, t, { type = "sine", freq, dur, vol, a = 0.01, d = 0.3, s = 0.4, r = 0.4, cut = 2400, detune = 0, send = 0.3 }) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  f.type = "lowpass"; f.frequency.value = cut; f.Q.value = 0.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setTargetAtTime(vol * s, t + a, d / 3);
  g.gain.setTargetAtTime(0.0001, t + dur, r / 3);
  o.connect(f); f.connect(g); g.connect(dest);
  if (send) { const sg = ctx.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(revIn); }
  o.start(t); o.stop(t + dur + r * 2);
}
const epiano = (dest, t, m, dur, vol = 0.07) => {
  voice(dest, t, { freq: mtof(m), dur, vol, a: 0.008, d: 0.6, s: 0.35, r: 0.5, cut: 2200, send: 0.35 });
  voice(dest, t, { type: "triangle", freq: mtof(m + 12), dur: dur * 0.5, vol: vol * 0.25, a: 0.005, d: 0.2, s: 0.1, r: 0.2, cut: 3000, send: 0.2 });
};
const piano = (dest, t, m, dur, vol = 0.08) => {
  voice(dest, t, { type: "triangle", freq: mtof(m), dur, vol, a: 0.006, d: 1.4, s: 0.15, r: 0.9, cut: 2600, send: 0.45 });
  voice(dest, t, { freq: mtof(m + 12), dur: dur * 0.6, vol: vol * 0.3, a: 0.004, d: 0.6, s: 0.05, r: 0.5, cut: 4000, send: 0.3 });
};
const pad = (dest, t, m, dur, vol = 0.03, cut = 900) => {
  voice(dest, t, { type: "sawtooth", freq: mtof(m), dur, vol, a: 0.5, d: 1, s: 0.9, r: 1.2, cut, detune: -7, send: 0.5 });
  voice(dest, t, { type: "sawtooth", freq: mtof(m), dur, vol, a: 0.5, d: 1, s: 0.9, r: 1.2, cut, detune: 7, send: 0.5 });
};
const bass = (dest, t, m, dur, vol = 0.16) => voice(dest, t, { type: "triangle", freq: mtof(m), dur, vol, a: 0.01, d: 0.25, s: 0.6, r: 0.12, cut: 520, send: 0 });
const pluck = (dest, t, m, vol = 0.05, cut = 2600) => voice(dest, t, { type: "square", freq: mtof(m), dur: 0.05, vol, a: 0.003, d: 0.12, s: 0.05, r: 0.15, cut, send: 0.25 });

function kick(dest, t, vol = 0.55) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.35);
}
function noiseHit(dest, t, { vol, dur, type = "highpass", freq = 7000, q = 0.7, send = 0 }) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(dest);
  if (send) { const sg = ctx.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(revIn); }
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}
const snare = (dest, t, vol = 0.18) => { noiseHit(dest, t, { vol, dur: 0.18, type: "bandpass", freq: 1900, q: 0.8, send: 0.25 }); voice(dest, t, { type: "triangle", freq: 190, dur: 0.05, vol: vol * 0.6, a: 0.002, d: 0.06, s: 0.01, r: 0.05, cut: 1200, send: 0 }); };
const hat = (dest, t, vol = 0.035, open = false) => noiseHit(dest, t, { vol, dur: open ? 0.18 : 0.04, freq: 8000 });

// 곡마다 다른 멜로디가 나오도록 쓰는 간단한 난수
const rng = s => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;

// ── 곡 ── (한 마디 = 16칸, 4마디가 한 바퀴)
const TRACKS = {
  home: {
    bpm: 82, swing: 0.14,
    chords: [[48, [0, 4, 7, 11]], [45, [0, 3, 7, 10]], [41, [0, 4, 7, 11]], [43, [0, 4, 5, 9]]],   // Cmaj7 Am7 Fmaj7 Gsus
    scale: [72, 74, 76, 79, 81, 84],
    step(g, t, bar, s, r, beat) {
      const [root, iv] = this.chords[bar % 4];
      if (s === 0 || s === 10) iv.forEach((x, i) => epiano(g, t + i * 0.012, root + 12 + x, beat * (s === 0 ? 2.2 : 1.4), 0.055));
      if (s === 0) bass(g, t, root - 12, beat * 1.6);
      if (s === 8) bass(g, t, root - 12 + 7, beat * 0.8, 0.12);
      if (s === 14) bass(g, t, root - 12 + (bar % 2 ? 10 : 12), beat * 0.4, 0.1);
      if (s === 0 || s === 7 || s === 10) kick(g, t, s === 0 ? 0.42 : 0.3);
      if (s === 4 || s === 12) snare(g, t, 0.11);
      if (s % 2 === 0) hat(g, t, s % 4 === 2 ? 0.03 : 0.018);
      if (bar % 4 !== 3 && s % 2 === 0 && r() < 0.24) epiano(g, t, this.scale[Math.floor(r() * this.scale.length)], beat * 0.9, 0.045);
    },
  },
  match: {
    bpm: 124, swing: 0,
    chords: [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]],                 // Am F C G
    step(g, t, bar, s, r, beat) {
      const [root, iv] = this.chords[bar % 4];
      if (s === 0) iv.forEach(x => pad(g, t, root + 12 + x, beat * 3.8, 0.018, 1400));
      if (s % 2 === 0) bass(g, t, root - 12 + (s % 4 === 2 ? 12 : 0), beat * 0.4, 0.13);
      if (s % 4 === 0) kick(g, t, 0.5);
      if (s === 4 || s === 12) snare(g, t, 0.2);
      if (s % 4 === 2) hat(g, t, 0.05, true); else if (s % 2 === 1) hat(g, t, 0.02);
      const arp = [0, 1, 2, 1];
      if (bar % 8 >= 4 || s % 2 === 0) pluck(g, t, root + 24 + iv[arp[s % 4]], 0.022, bar % 8 >= 4 ? 3200 : 1800);
      if (bar % 8 === 7 && s >= 12) snare(g, t, 0.08 + (s - 12) * 0.03);   // 넘어가는 마디의 짧은 드럼 채움
    },
  },
  ending: {
    bpm: 70, swing: 0,
    chords: [[41, [0, 4, 7, 11]], [40, [0, 3, 8, 12]], [38, [0, 3, 7, 10]], [46, [0, 4, 7, 11]]],    // Fmaj7 C/E Dm7 Bbmaj7
    scale: [77, 79, 81, 84, 86, 88],
    step(g, t, bar, s, r, beat) {
      const [root, iv] = this.chords[bar % 4];
      if (s === 0) { bass(g, t, root - 12, beat * 3.6, 0.15); iv.forEach(x => pad(g, t, root + 12 + x, beat * 3.8, 0.02, 800)); }
      if (s % 2 === 0) { const seq = [0, 1, 2, 3, 2, 1, 2, 3]; piano(g, t, root + 12 + iv[seq[(s / 2) % 8]], beat * 1.2, 0.09); }
      if (s % 4 === 0 && r() < 0.55) piano(g, t + beat * 0.02, this.scale[Math.floor(r() * this.scale.length)], beat * 2.2, 0.12);
    },
  },
};

// ── 연주 예약 (조금씩 앞서서 미리 예약) ──
function schedule() {
  if (!play || play.file) return;
  const tr = TRACKS[play.name], beat = 60 / tr.bpm, six = beat / 4;
  while (play.nextT < ctx.currentTime + 0.15) {
    const s = play.step % 16, bar = Math.floor(play.step / 16);
    if (s === 0 && bar % 4 === 0) play.r = rng(play.seed + bar);       // 네 마디마다 멜로디가 조금씩 바뀜
    const t = play.nextT + (s % 2 === 1 ? six * tr.swing : 0);
    try { tr.step(play.gain, t, bar, s, play.r, beat); } catch { /* 한 칸이 실패해도 계속 */ }
    play.nextT += six; play.step++;
  }
}

function startTrack(name) {
  const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
  g.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
  const file = BGM_FILES[name];
  const p = { name, gain: g, step: 0, nextT: ctx.currentTime + 0.1, seed: Math.floor(Math.random() * 1e6), r: Math.random, file: null };
  if (file) {                                       // mp3 파일은 브라우저 기본 재생기로 (내 컴퓨터에서 열어도 됨)
    const el = new Audio(`assets/audio/${file}`);
    el.loop = true; el.volume = 0;
    p.file = el;
    el.onerror = () => { p.file = null; };          // 파일이 없으면 직접 만든 음악으로
    el.play().then(() => fadeEl(el, VOLUME * 1.6)).catch(() => {});
  }
  return p;
}
function fadeEl(el, to, ms = 1200) {
  const from = el.volume, t0 = performance.now();
  const f = () => { const k = Math.min(1, (performance.now() - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) requestAnimationFrame(f); else if (to === 0) el.pause(); };
  requestAnimationFrame(f);
}
function stopTrack(p) {
  if (!p) return;
  p.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
  if (p.file) fadeEl(p.file, 0);
  setTimeout(() => { try { p.gain.disconnect(); } catch { /* 이미 끊김 */ } }, 2500);
}

function sync() {
  if (!on || !want) { if (play) { stopTrack(play); play = null; cur = null; } return; }
  if (!ensure()) return;
  if (cur === want) return;
  stopTrack(play);
  play = startTrack(want); cur = want;
  if (!timer) timer = setInterval(schedule, 40);
}

const bgm = {
  get on() { return on; },
  set(v) { on = !!v; sync(); },
  play(name) { want = name; sync(); },
};

// 탭을 숨기면 쉬고, 돌아오면 다시 연주
document.addEventListener("visibilitychange", () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
});
// 브라우저가 소리를 막아 두었다면 첫 터치에서 다시 시작
document.addEventListener("pointerdown", () => { if (on && ctx && ctx.state === "suspended") ctx.resume(); }, { passive: true });

return { bgm };
})();
(__fix["js/ui/bgm.js"] || []).forEach(f => f());

// ── js/ui/match.js
__m["js/ui/match.js"] = (function () {
const {next, resolve, autoChoice, autoPlay, finishMatch, STATUS_LABEL, TAG_LABEL, MY_SLOT} = __m["js/engine/match.js"];
const {STAFF} = __m["data/roster.js"];
const {getPath} = __m["js/rng.js"];
const {tierLabel, TEAM_NAME} = __m["js/engine/season.js"];
const {esc, img, faceOf, fillText} = __m["js/ui/util.js"];
const {conditionOf} = __m["js/engine/growth.js"];
const {setScene, enter, buzz} = __m["js/ui/fx.js"];
const {sfx} = __m["js/ui/sfx.js"];
const {bgm} = __m["js/ui/bgm.js"];
// 경기 화면: 전광판 → 22명이 움직이는 경기장 → 문자 중계 → 내 장면 선택지









const SPEED = { normal: 1250, fast: 420 };
const HALF_MIN = 35;                                  // 후반부터는 양 팀이 진영을 바꿔 공격 방향이 반대가 됨

// 상대 팀 유니폼 색. 데이터에 없으면 팀 이름으로 정해진 색을 씀
const KIT_POOL = [["#F3F5FB", "#1F2C8F"], ["#1E88E5", "#FFFFFF"], ["#C62828", "#FFFFFF"], ["#2E7D32", "#FFFFFF"], ["#6A1B9A", "#FFFFFF"], ["#FDD835", "#1A237E"], ["#212121", "#29B6F6"], ["#00897B", "#FFFFFF"]];
function kitOf(opp) {
  let fill = opp.color, stroke = opp.color2;
  if (!fill) { let h = 0; for (const ch of String(opp.name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; [fill, stroke] = KIT_POOL[h % KIT_POOL.length]; }
  const n = parseInt(fill.slice(1), 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  // 상대 골키퍼 색: 유니폼과 확실히 다르게 (밝은 유니폼이면 검정, 어두운 유니폼이면 형광)
  const gk = lum > 0.5 ? "#212121" : "#C6FF00";
  return { fill, stroke: stroke || "#FFFFFF", text: lum > 0.55 ? "#14181F" : "#FFFFFF", gk, gkText: lum > 0.5 ? "#FFFFFF" : "#14181F" };
}

// 기본 대형 (우리 팀이 오른쪽으로 공격). 상대는 좌우를 뒤집어 씀
const BASE = {
  GK: [[4, 34]],
  DF: [[18, 10], [16, 26], [16, 42], [18, 58]],
  MF: [[38, 12], [35, 27], [35, 41], [38, 56]],
  FW: [[55, 26], [55, 42]],
};
const LIMIT = { GK: [2, 10], DF: [7, 72], MF: [14, 88], FW: [24, 98] };

// 선수 22명 만들기. 점 하나하나가 명단의 실제 선수(이름·등번호)와 이어져 있음
function buildPlayers(state, m) {
  const p = state.player;
  const list = [];
  const ours = { GK: [{ name: m.gk.us, number: 1 }], DF: [], MF: [], FW: [] };
  for (const x of m.lineup) ours[x.pos].push({ ...x });
  for (const [pos, spots] of Object.entries(BASE)) {
    spots.forEach((pt, i) => {
      let who = ours[pos][i], me = false;
      const mySlot = pos === p.position && i === MY_SLOT[pos];
      if (mySlot && m.status === "start") { ours[pos].splice(i, 0, { name: p.name, number: p.number }); who = ours[pos][i]; me = true; }
      list.push({ id: `u-${pos}-${i}`, team: "us", pos, base: pt, number: who?.number ?? "", name: who?.name ?? "", me,
        subSlot: mySlot && m.status === "sub", x: pt[0], y: pt[1] });
      const oy = Math.min(64, Math.max(4, pt[1] + (pos === "GK" ? 0 : 3)));
      const opp = pos === "GK" ? { name: m.gk.them, number: 1 } : m.oppPlayers.filter(o => o.pos === pos)[i];
      list.push({ id: `t-${pos}-${i}`, team: "them", pos, base: [105 - pt[0], oy], number: opp?.number ?? "", name: opp?.name ?? "", me: false, x: 105 - pt[0], y: oy });
    });
  }
  return list;
}

// 공 위치와 소유 팀, 공을 가진 선수(actor)에 맞춰 모두의 목표 위치 계산
function layout(players, ball, poss, opt = {}) {
  const [bx, by] = ball;
  const t = (bx - 52.5) / 52.5;
  for (const pl of players) {
    const [x0, y0] = pl.base;
    if (pl.pos === "GK") {
      const near = pl.team === "us" ? Math.max(0, 22 - bx) : Math.max(0, bx - 83);
      pl.x = pl.team === "us" ? 3 + near * 0.12 : 102 - near * 0.12;
      pl.y = 34 + (by - 34) * 0.25;
      continue;
    }
    const attack = pl.team === poss;
    const dir = pl.team === "us" ? 1 : -1;
    let x = x0 + t * 20 + dir * (attack ? 7 : -3);
    let y = y0 + (by - 34) * 0.32;
    const [lo, hi] = LIMIT[pl.pos];
    x = pl.team === "us" ? Math.min(hi, Math.max(lo, x)) : Math.min(105 - lo, Math.max(105 - hi, x));
    pl.x = x; pl.y = Math.min(65, Math.max(3, y));
  }
  if (bx < 1 || bx > 104) return;                                   // 골망·라인 밖
  const named = opt.actor ? players.find(p => p.name === opt.actor) : null;
  const team = named ? named.team : poss;
  if (!team) return;
  const holder = named || (opt.holderIsMe ? players.find(p => p.me) : null)
    || players.filter(p => p.team === team && p.pos !== "GK").sort((a, b) => dist(a, ball) - dist(b, ball))[0];
  const side = team === "us" ? 1 : -1;
  if (holder) { holder.x = holder.pos === "GK" ? bx : bx - side * 1.6; holder.y = by; }
  // 수비 쪽: 가장 가까운 두 명이 붙음. 내가 막는 장면이면 내가 제일 먼저 붙음
  const meTok = players.find(p => p.me);
  const foes = players.filter(p => p.team !== team && p.pos !== "GK" && p !== holder).sort((a, b) => dist(a, ball) - dist(b, ball));
  if (opt.press && meTok && meTok.team !== team) { foes.splice(foes.indexOf(meTok), 1); foes.unshift(meTok); }
  if (foes[0]) { foes[0].x = bx + side * 3; foes[0].y = by + (foes[0].y > by ? 2 : -2); }
  if (foes[1] && dist(foes[1], ball) < 14) { foes[1].x = bx + side * 6; foes[1].y = by + (foes[1].y > by ? 6 : -6); }
  // 수비가 골라인·터치라인 밖으로 밀려나지 않게. 코너킥·스로인 키커만 라인 바로 바깥에 설 수 있음
  for (const p of players) {
    const m = p === holder ? 0 : 1.5;
    p.x = Math.min(105 - m, Math.max(m, p.x)); p.y = Math.min(68 - m, Math.max(m, p.y));
  }
}
const dist = (p, [x, y]) => Math.hypot(p.x - x, p.y - y);

function pitchSvg(players, kit) {
  return `<svg class="pitch" viewBox="0 0 105 68" role="img" aria-label="경기장" style="--opp:${kit.fill};--opp2:${kit.stroke};--oppText:${kit.text};--oppGk:${kit.gk};--oppGkText:${kit.gkText}">
    <rect x="0" y="0" width="105" height="68" class="turf"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${i * 15}" y="0" width="7.5" height="68" class="stripe"/>`).join("")}
    <g class="lines"><rect x="1" y="1" width="103" height="66"/><line x1="52.5" y1="1" x2="52.5" y2="67"/>
      <circle cx="52.5" cy="34" r="9.15"/><rect x="1" y="13.85" width="16.5" height="40.3"/><rect x="87.5" y="13.85" width="16.5" height="40.3"/>
      <rect x="1" y="24.85" width="5.5" height="18.3"/><rect x="98.5" y="24.85" width="5.5" height="18.3"/>
      <rect x="-1" y="30.3" width="2" height="7.4" class="goal"/><rect x="104" y="30.3" width="2" height="7.4" class="goal"/></g>
    ${players.map(p => `<g class="dot ${p.team} ${p.pos === "GK" ? "gk" : ""} ${p.me ? "me" : ""}" data-id="${p.id}" style="transform:translate(${p.x}px,${p.y}px)">
      <circle r="4" class="ring"/><circle r="2.3" class="body"/><text y="0.75" class="no">${p.number}</text><text y="-4.3" class="tag">나</text></g>`).join("")}
    <g class="ball" style="transform:translate(52.5px,34px)"><circle r="1.2"/></g>
  </svg>`;
}

const LINE_CLASS = { info: "", us: "us", them: "them", "goal-us": "goal", "goal-me": "goal mine", "goal-them": "goal against",
  me: "me", "me-auto": "me auto", "me-good": "me good", "me-bad": "me bad", whistle: "whistle", coach: "coach", stat: "stat", card: "card" };
const ICON = { "goal-us": "⚽ ", "goal-me": "⚽ ", "goal-them": "", card: "🟨 ", whistle: "", stat: "📊 " };

function showMatch(app, m, onDone) {
  const state = app.state;
  const p = state.player;
  const fx = m.fx;
  let speed = "normal", timer = null, paused = false, queue = [], after = null;
  const players = buildPlayers(state, m);
  layout(players, [52.5, 34], null);

  app.root.innerHTML = `<div class="match-screen">
    <header class="board">
      <div class="comp">${esc(fx.compLabel)}${fx.round ? ` ${esc(fx.round)}` : ""}</div>
      <div class="teams">
        <span class="tm home"><img src="assets/img/logo.png" alt="">${TEAM_NAME}</span>
        <span class="sc num" id="sc">0 : 0</span>
        <span class="tm away"><i class="kit-dot" style="background:${kitOf(fx.opponent).fill};border-color:${kitOf(fx.opponent).stroke}"></i>${esc(fx.opponent.name)}</span>
      </div>
      <div class="clock num" id="clock">경기 전</div>
    </header>
    <div class="match-body">
      <div class="pitch-wrap" id="pitch">${pitchSvg(players, kitOf(fx.opponent))}<div class="goal-flash" id="flash" hidden>GOAL</div><div class="atk-dir" id="atk">공격 방향 ▶</div></div>
      <ol class="feed" id="feed" aria-live="polite"></ol>
    </div>
    <footer class="ctl" id="ctl"></footer>
  </div>`;

  const root = app.root;
  setScene("bg_prematch", "prematch");                 // 경기 직전: 조명 켜진 운동장
  bgm.play("match");
  enter(root.querySelector(".match-screen"));
  const feed = root.querySelector("#feed");
  const ctl = root.querySelector("#ctl");
  const svg = root.querySelector(".pitch");
  const flash = root.querySelector("#flash");
  const dotEls = Object.fromEntries([...svg.querySelectorAll(".dot")].map(el => [el.dataset.id, el]));
  const ballEl = svg.querySelector(".ball");
  // 세로 화면: 전광판·선택지 높이를 빼고 남은 만큼만 경기장을 키움 (중계 줄은 최소 64px 남김)
  const pitchWrap = root.querySelector("#pitch"), boardEl = root.querySelector(".board");
  const narrow = () => innerWidth < 900 && !(matchMedia("(orientation: landscape) and (max-height: 620px)").matches);
  const fitPitch = () => {
    if (!pitchWrap.isConnected) return;
    if (!narrow()) { pitchWrap.style.maxWidth = ""; return; }
    const avail = innerHeight - boardEl.offsetHeight - ctl.offsetHeight - 16 - 8 - 64;
    pitchWrap.style.maxWidth = `${Math.max(180, Math.floor(avail * 105 / 68))}px`;
  };
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(fitPitch) : null;
  ro?.observe(ctl); ro?.observe(boardEl);
  addEventListener("resize", fitPitch);
  fitPitch();
  const raiseMe = () => { const t = players.find(x => x.me); if (t) svg.insertBefore(dotEls[t.id], ballEl); };   // 내 점은 맨 위에
  raiseMe();

  // 화면에 그릴 때만 좌표를 돌림: 후반에는 우리 팀이 왼쪽으로 공격 (엔진 좌표는 그대로)
  let flipped = false, lastBall = [52.5, 34];
  const SX = x => (flipped ? 105 - x : x), SY = y => (flipped ? 68 - y : y);
  function draw(ball, poss, ms, opt = {}) {
    if (ball) { layout(players, ball, poss, opt); lastBall = ball; }
    const dur = `${Math.max(120, ms * 0.85)}ms`;
    for (const pl of players) {
      const el = dotEls[pl.id];
      el.style.transitionDuration = dur;
      el.style.transform = `translate(${SX(pl.x).toFixed(2)}px,${SY(pl.y).toFixed(2)}px)`;
    }
    const b = ball || lastBall;
    ballEl.style.transitionDuration = dur; ballEl.style.transform = `translate(${SX(b[0]).toFixed(2)}px,${SY(b[1]).toFixed(2)}px)`;
  }
  function setHalf(second) {
    if (second === flipped) return;
    flipped = second;
    const a = root.querySelector("#atk");
    a.textContent = flipped ? "◀ 공격 방향" : "공격 방향 ▶";
    a.classList.remove("swap"); void a.offsetWidth; a.classList.add("swap");
    draw(null, null, 1400);
  }

  // 경기 전 선발 명단: 경기장 위 점과 같은 순서·번호
  const byPos = pos => players.filter(x => x.team === "us" && x.pos === pos).map(x => `${x.me ? "<b class='me-n'>" : ""}${x.number} ${esc(x.name)}${x.me ? "</b>" : ""}`).join(", ");
  feed.innerHTML = `<li class="lineup"><span class="mn">선발</span><span>
    <b>GK</b> ${byPos("GK")}<br><b>DF</b> ${byPos("DF")}<br><b>MF</b> ${byPos("MF")}<br><b>FW</b> ${byPos("FW")}
    </span></li>`;

  // 교체 투입 / 부상 교체 때 점의 주인 바꾸기
  function swapToken(tok, who, me) {
    tok.name = who.name; tok.number = who.number; tok.me = me;
    const el = dotEls[tok.id];
    el.classList.toggle("me", me);
    el.querySelector(".no").textContent = who.number;
    if (me) raiseMe();
  }

  // 전광판은 중계 문장이 골 장면에 도착했을 때 바뀜 (엔진은 한 번의 공격을 미리 다 계산해 둠)
  let shown = [0, 0], shownMin = null, lastScore = "0 : 0";
  const updateBoard = () => {
    const sc = root.querySelector("#sc"), now = `${shown[0]} : ${shown[1]}`;
    sc.textContent = now;
    if (now !== lastScore) { lastScore = now; sc.classList.remove("bump"); void sc.offsetWidth; sc.classList.add("bump"); }
    root.querySelector("#clock").textContent = m.done ? "종료" : `${shownMin ?? m.minute}'`;
  };
  function addLine(l) {
    if (l.silent || !l.t) return;
    const li = document.createElement("li");
    li.className = LINE_CLASS[l.k] || "";
    li.innerHTML = `<span class="mn num">${l.minute}'</span><span>${ICON[l.k] || ""}${esc(l.t)}</span>`;
    feed.appendChild(li);
    feed.scrollTop = feed.scrollHeight;
  }
  function goalFlash(k) {
    flash.textContent = k === "goal-them" ? "실점" : "GOAL";
    flash.className = `goal-flash ${k === "goal-them" ? "against" : ""}`;
    flash.hidden = false;
    clearTimeout(flash._t);
    flash._t = setTimeout(() => { flash.hidden = true; }, 1300);
    const scr = root.querySelector(".match-screen");
    scr.classList.remove("shake"); void scr.offsetWidth; scr.classList.add(k === "goal-them" ? "shake-soft" : "shake");
    setTimeout(() => scr.classList.remove("shake", "shake-soft"), 700);
    if (k === "goal-them") { sfx.play("concede"); buzz(40); }
    else { sfx.play("goal"); buzz(k === "goal-me" ? [70, 50, 70, 50, 160] : [60, 40, 120]); }
  }

  // 교체 투입 연출: 대기심의 번호판 + "경기에 투입됩니다"
  function subBoard(outNo) {
    const wrap = root.querySelector("#pitch");
    wrap.querySelector(".sub-board")?.remove();
    wrap.insertAdjacentHTML("beforeend", `<div class="sub-board" role="status">
      <div class="sb-panel">
        <div class="sb-head">SUBSTITUTION</div>
        <div class="sb-nums"><span class="sb-out"><i>OUT</i><b class="num">${esc(String(outNo || "–"))}</b></span><span class="sb-in"><i>IN</i><b class="num">${p.number}</b></span></div>
      </div>
      <div class="sb-msg"><span class="sb-name">${esc(p.name)}</span> 경기에 투입됩니다</div>
    </div>`);
    sfx.play("kickoff"); setTimeout(() => sfx.play("up"), 450);
    buzz([40, 60, 120]);
    const scr = root.querySelector(".match-screen");
    scr.classList.add("subbing");
    setTimeout(() => { wrap.querySelector(".sub-board")?.classList.add("out"); scr.classList.remove("subbing"); }, 2300);
    setTimeout(() => wrap.querySelector(".sub-board")?.remove(), 2800);
  }

  // 줄을 하나씩 보여 주며 선수들을 움직임
  function play(lines, then) {
    queue = lines.slice();
    after = then;
    step();
  }
  function step() {
    clearTimeout(timer);
    if (paused) return;
    const l = queue.shift();
    if (!l) { const f = after; after = null; f?.(); return; }
    const ms = SPEED[speed] * (l.fast ? 0.62 : 1);
    if (l.subIn) { const tok = players.find(x => x.team === "us" && x.name === l.outName) || players.find(x => x.subSlot); if (tok) swapToken(tok, { name: p.name, number: p.number }, true); subBoard(l.outNo); }
    if (l.injuredOff) { const tok = players.find(x => x.me); if (tok) swapToken(tok, l.injuredOff, false); }
    if (l.ball) draw(l.ball, l.poss, ms, { actor: l.actor, press: l.press, holderIsMe: !!(l.toMe || l.meHold) && !l.actor });
    addLine(l);
    if (l.score) shown = l.score.slice();
    if (l.minute != null) shownMin = l.minute;
    if (l.half2 || (l.minute != null && l.minute > HALF_MIN)) setHalf(true);   // 후반 킥오프 문장부터 진영 교체
    if (l.k?.startsWith("goal")) goalFlash(l.k);
    updateBoard();
    timer = setTimeout(step, l.subIn ? Math.max(2600, ms) : l.silent ? ms * 0.7 : (l.k?.startsWith("goal") ? ms * 1.4 : ms));
  }

  // ── 경기 전 ──
  const statusLine = m.onPitch
    ? (m.status === "sub" ? STATUS_LABEL.bench : STATUS_LABEL[m.status])   // 교체 투입은 미리 알려 주지 않음
    : `${STATUS_LABEL[m.status]}${m.reason ? `: ${m.reason}` : ""}`;
  const barPct = v => Math.round(Math.max(5, Math.min(95, 50 + (v - 50) * 3)));
  ctl.innerHTML = `<div class="prematch">
    <div class="pm-me">
      <div class="pm-face">${img(faceOf(p, state.calendar.grade), p.name)}</div>
      <div><div class="pm-name">${p.number}. ${esc(p.name)} <span class="pos-tag ${p.position}">${p.position}</span></div>
        <div class="pm-status ${m.status === "start" ? "" : "off"}">${statusLine}</div></div>
    </div>
    ${(() => { const c = conditionOf(p); const mp = Math.round(c.match * 100);
      const role = m.status !== "start" ? "" : m.star >= 1 ? "에이스. 상대가 집중 견제합니다" : m.star >= 0.4 ? "핵심 선수" : "팀의 일원";
      return `<div class="pm-tags"><span class="cond ${c.cls}">컨디션 ${c.label}</span><span class="mute">선택 성공률 ${mp > 0 ? "+" : ""}${mp}%p</span>
        ${role ? `<span class="chip ${m.star >= 1 ? "kit" : ""}">영향력: ${role}</span>` : ""}</div>`; })()}
    ${m.talk ? `<div class="talk">
      <div class="talk-face">${img(m.talk.who === "coach" ? "npc_coach" : "npc_assistant", "")}</div>
      <div><div class="talk-who">${esc(m.talk.who === "coach" ? STAFF.coach : STAFF.assistant)}</div>
        <p>"${esc(m.talk.text)}"</p>
        ${m.talk.tag ? `<span class="chip kit">지시: ${TAG_LABEL[m.talk.tag]}</span> <span class="mute" style="font-size:12px">같은 종류를 고르면 성공률 +4%p</span>` : ""}</div></div>` : ""}
    ${fx.school ? `<div class="alert gold">🎓 오늘 ${esc(fx.school.name)}(${tierLabel(fx.school.tier)}) ${esc(fx.school.coach)}님이 직접 보러 오셨습니다. 상대는 고등학생이라 몸싸움이 버겁습니다.</div>` : ""}
    ${m.oppAce ? `<div class="alert">👀 주목할 상대: ${m.oppAce.pos} ${m.oppAce.number}번 ${esc(m.oppAce.name)} (${m.oppAce.grade}학년${m.oppAce.trait ? `, ${esc(m.oppAce.trait)}` : ""})</div>`
      : m.oppAceAbsent ? `<div class="alert">${esc(fillText("상대 에이스 {a|이/가} 오늘은 나오지 않습니다.", { a: m.oppAceAbsent }))}</div>` : ""}
    ${fx.ko ? `<div class="alert gold">지면 탈락입니다. 비기면 승부차기.</div>` : ""}
    ${fx.elementary ? `<div class="alert gold">🧒 오늘은 초등학교 팀과의 연습경기. 이겨야 본전, 지면 한동안 놀림감이다.</div>` : ""}
    <div class="power"><span>우리 전력</span><div class="pw"><i style="width:${barPct(m.ours)}%"></i></div>
      <span>상대 전력</span><div class="pw them"><i style="width:${barPct(m.theirs)}%"></i></div></div>
    <div class="ctl-row"><button class="btn btn-ghost" data-skip>결과만 보기</button><button class="btn btn-kit" data-start>${m.status === "start" ? "킥오프" : "경기 지켜보기"}</button></div>
  </div>`;
  ctl.querySelector("[data-start]").addEventListener("click", () => { setScene("bg_stadium", "match"); sfx.play("kickoff"); controls(); tick(); });
  ctl.querySelector("[data-skip]").addEventListener("click", skipAll);

  function controls() {
    ctl.innerHTML = `<div class="ctl-row">
      <button class="btn btn-ghost" data-pause>일시정지</button>
      <button class="btn btn-ghost" data-speed>${speed === "fast" ? "보통 속도" : "빠르게"}</button>
      <button class="btn" data-skip>결과만 보기</button></div>`;
    ctl.querySelector("[data-pause]").addEventListener("click", e => {
      paused = !paused; e.target.textContent = paused ? "계속" : "일시정지";
      if (!paused) (queue.length || after ? step() : tick()); else clearTimeout(timer);
    });
    ctl.querySelector("[data-speed]").addEventListener("click", e => {
      speed = speed === "normal" ? "fast" : "normal"; e.target.textContent = speed === "fast" ? "보통 속도" : "빠르게";
    });
    ctl.querySelector("[data-skip]").addEventListener("click", skipAll);
  }

  function tick() {
    clearTimeout(timer);
    if (paused) return;
    const r = next(state, m);
    play(r.lines, () => {
      if (r.kind === "moment") return showMoment();
      if (r.kind === "ht") { sfx.play("half"); return showHalftime(); }
      if (r.kind === "ft") { sfx.play("full"); return end(); }
      timer = setTimeout(tick, r.lines.length ? 120 : 0);
    });
  }

  function showMoment() {
    const pd = m.pending;
    ctl.innerHTML = `<div class="moment" role="group" aria-label="선택">
      <p class="mo-text"><span class="num">${m.minute}'</span> ${esc(pd.text)}</p>
      <div class="mo-choices">${pd.choices.map((c, i) => `<button class="mo-btn" data-c="${i}">
        <span>${c.signature ? `<b class="sigb">★ 특기</b> ` : ""}${esc(c.label)}${c.follow ? ` <b class="follow">지시</b>` : ""}${c.timing ? ` <b class="tmark" title="타이밍 버튼">⏱</b>` : ""}</span><span class="lv ${c.level === "높음" ? "hi" : c.level === "보통" ? "mid" : "lo"}">${c.level}</span></button>`).join("")}</div>
      <button class="linkbtn" data-autopick>알아서 하기</button>
    </div>`;
    ctl.classList.add("ask");
    buzz(60);
    const pickIt = (i, timing = null) => {
      if (!m.pending || m.done) return;                 // 그 사이 '결과만 보기'를 눌렀으면 무시
      ctl.classList.remove("ask");
      const r = resolve(state, m, i, timing);
      controls();
      paused = false;
      play(r.lines, () => { timer = setTimeout(tick, 200); });
    };
    const choose = i => {
      const kind = pd.choices[i].timing;
      if (!kind || app.settings.timing === false) return pickIt(i);
      timingGame(kind, i, res => pickIt(i, res));
    };
    ctl.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => choose(+b.dataset.c)));
    ctl.querySelector("[data-autopick]").addEventListener("click", () => pickIt(autoChoice(m)));
    ctl.querySelector("[data-c]").focus({ preventScroll: true });
  }

  // 결정적 장면: 움직이는 바늘을 초록 칸에 맞춰 누르기
  function timingGame(T, i, done) {
    const sv = getPath(p.stats, T.stat);
    const width = 16 + sv * 0.12;                       // 초록 칸 너비(%)
    const center = 30 + Math.random() * 40;
    const lo = center - width / 2, hi = center + width / 2, plo = center - width / 6, phi = center + width / 6;
    const period = 1300 - Math.min(400, sv * 3);         // 바늘 왕복 시간(ms)
    ctl.innerHTML = `<div class="timing">
      <p class="tm-title"><b>${T.label} 타이밍!</b> 바늘이 초록 칸에 올 때 누르세요</p>
      <div class="tbar"><i class="zone" style="left:${lo}%;width:${width}%"></i><i class="perfect" style="left:${plo}%;width:${phi - plo}%"></i><b class="needle" id="needle"></b></div>
      <button class="btn btn-kit btn-wide tm-btn" data-hit>${T.btn}</button></div>`;
    const needle = ctl.querySelector("#needle");
    const t0 = performance.now();
    let raf, fin = false, pos = 0;
    const loop = now => {
      const ph = ((now - t0) % period) / period;
      pos = ph < 0.5 ? ph * 200 : (1 - ph) * 200;
      needle.style.left = `${pos}%`;
      if (now - t0 > period * 3.2) return hit(true);
      raf = requestAnimationFrame(loop);
    };
    const hit = (timeout = false) => {
      if (fin) return; fin = true;
      cancelAnimationFrame(raf); document.removeEventListener("keydown", key);
      const res = timeout ? "miss" : pos >= plo && pos <= phi ? "perfect" : pos >= lo && pos <= hi ? "good" : "miss";
      sfx.play(res === "miss" ? "bad" : "good");
      ctl.querySelector(".timing").insertAdjacentHTML("beforeend", `<p class="tm-res ${res}">${{ perfect: "완벽한 타이밍! 성공률 크게 상승", good: "좋은 타이밍! 성공률 상승", miss: timeout ? "머뭇거렸다…" : "타이밍이 어긋났다…" }[res]}</p>`);
      setTimeout(() => done(res), 650);
    };
    const key = e => { if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); hit(); } };
    document.addEventListener("keydown", key);
    ctl.querySelector("[data-hit]").addEventListener("pointerdown", e => { e.preventDefault(); hit(); });
    raf = requestAnimationFrame(loop);
  }

  function showHalftime() {
    let left = 8;
    ctl.innerHTML = `<div class="ctl-row"><button class="btn btn-kit btn-wide" data-second>후반 시작 <span class="mute" id="htc">(${left})</span></button></div>`;
    const go = () => { clearInterval(iv); controls(); tick(); };
    const iv = setInterval(() => { left--; const c = ctl.querySelector("#htc"); if (c) c.textContent = `(${left})`; if (left <= 0) go(); }, 1000);
    ctl.querySelector("[data-second]").addEventListener("click", go);
  }

  function skipAll() {
    clearTimeout(timer);
    setScene("bg_stadium", "match");
    ctl.classList.remove("ask");
    queue.forEach(addLine); queue = []; after = null;
    const before = m.feed.length;
    autoPlay(state, m);
    m.feed.slice(before).forEach(addLine);
    shown = m.score.slice();
    end();
  }

  function end() {
    clearTimeout(timer);
    const before = m.feed.length;
    const res = finishMatch(state, m);
    m.feed.slice(before).forEach(addLine);
    draw([52.5, 34], null, 600);
    shown = m.score.slice();
    updateBoard();
    const resCls = { 승: "W", 무: "D", 패: "L" }[res.result];
    const goals = m.goalsLog.map(g => `<li class="${g.team}">${g.minute}' ${esc(g.name)}${g.assist ? ` <span class="mute">(도움 ${esc(g.assist)})</span>` : ""}</li>`).join("");
    ctl.innerHTML = `<div class="postmatch">
      <div class="pm-head"><span class="badge-res ${resCls}">${res.result}</span>
        <span class="num">${TEAM_NAME} ${res.gf} : ${res.ga} ${esc(res.opponent)}</span>
        ${res.shootout ? `<span class="mute">(승부차기 ${res.shootout.us}:${res.shootout.them})</span>` : ""}</div>
      ${goals ? `<ul class="pm-goals">${goals}</ul>` : ""}
      ${res.minutes > 0 ? `<div class="pm-rating">
          <div class="rt num ${res.rating >= 7.5 ? "hi" : res.rating >= 6.5 ? "mid" : "lo"}">${res.rating.toFixed(1)}</div>
          <div><div>${STATUS_LABEL[res.status]} ${res.minutes}분${res.goals ? `, ${res.goals}골` : ""}${res.assists ? `, ${res.assists}도움` : ""}</div>
          <div class="mute" style="font-size:13px">선택 ${m.my.decisions}번 중 ${m.my.successes}번 성공${res.mom ? ` <span class="chip kit">경기 최우수 선수</span>` : ""}</div></div>
        </div>` : `<p class="mute">${esc(res.reason || STATUS_LABEL[res.status])}</p>`}
      ${res.notes.length ? `<ul class="pm-notes">${res.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
      <p class="mute" style="font-size:13px;margin:0">감독님 면담과 경기 기록은 메시지함에 왔습니다.</p>
      <button class="btn btn-kit btn-wide" data-done>이번 주 마무리</button>
    </div>`;
    ctl.querySelector("[data-done]").addEventListener("click", () => { ro?.disconnect(); removeEventListener("resize", fitPitch); onDone(res); });
    ctl.querySelector("[data-done]").focus({ preventScroll: true });
  }
}

return { showMatch };
})();
(__fix["js/ui/match.js"] || []).forEach(f => f());

// ── data/story.js
__m["data/story.js"] = (function () {

// 도입부 장면과 입단 대화. 문장은 자유롭게 고치셔도 됩니다.
//
// {name} 선수 이름, {coach} 감독 이름, {assistant} 코치 이름
// {name|이/가}처럼 쓰면 받침에 맞는 조사가 붙습니다.

// ── 도입부 (영화처럼 흘러가는 장면) ─────────────
// bg: assets/img/ 안의 배경 그림 이름. 없으면 tone 색으로 대신합니다.
const INTRO = [
  // center: 화면 한가운데에 띄움 / type: 작은 글씨를 한 글자씩 찍음
  { bg: "bg_sea",   tone: "sea",   big: "전라남도 고흥",          small: "조용하고 아름다운 자연이 있는" },
  { bg: "title",    tone: "dawn",  big: "하늘길이 열리는 곳", small: "그러니 우리의 꿈도 더욱 높이 날 수 있겠지." },
  { bg: "bg_field_day", tone: "field", big: "고흥대서중학교",    small: "작지만 큰 꿈을 지닌 학생들이 있다." },
  { bg: "bg_locker", tone: "night", big: "고흥FC U-15",          small: "올봄, 꿈을 품은 유니폼 하나가 새로 걸린다." },
  { bg: null,       tone: "black", big: "3년의 시간",            small: "미래는 네가 만들어 간다.", center: true, type: true },
];

// ── 입단 대화 ─────────────────────────────────
const TALK = {
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
const TRAIT_REMARK = {
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
const MEASURES = [
  { label: "50m 달리기",       stat: "phys.speed",      fmt: v => `${(9.0 - (v - 20) * 0.03).toFixed(2)}초` },
  { label: "왕복오래달리기",    stat: "phys.stamina",    fmt: v => `${Math.round(30 + (v - 20) * 1.5)}회` },
  { label: "제자리멀리뛰기",    stat: "phys.jump",       fmt: v => `${Math.round(160 + (v - 20) * 1.4)}cm` },
  { label: "리프팅",           stat: "tech.firstTouch", fmt: v => `${Math.max(3, Math.round(5 + (v - 15) * 2.2))}개` },
  { label: "슈팅 (10번 중 골문 안)", stat: "tech.shoot", fmt: v => `${Math.max(1, Math.min(10, Math.round((v - 5) / 6)))}개` },
];

return { INTRO, TALK, TRAIT_REMARK, MEASURES };
})();
(__fix["data/story.js"] || []).forEach(f => f());

// ── js/ui/intro.js
__m["js/ui/intro.js"] = (function () {
const {INTRO} = __m["data/story.js"];
const {esc} = __m["js/ui/util.js"];
// 시네마틱 도입부: 레터박스, 천천히 다가가는 배경, 한 줄씩 떠오르는 자막


const AUTO_MS = 4300;

// 배경 그림: .webp → .png → 없으면 색 그라데이션만
window.__bgFallback = el => {
  if (!el.dataset.tried) { el.dataset.tried = "1"; el.src = `assets/img/${el.dataset.name}.png`; }
  else el.remove();
};
const bgLayer = (name, tone, extra = "") =>
  `<div class="cine-bg tone-${tone} ${extra}">${name ? `<img src="assets/img/${name}.webp" data-name="${name}" alt="" onerror="__bgFallback(this)">` : ""}</div>`;

function renderIntro(app, onDone) {
  let i = -1, timer = null, finished = false;
  app.root.innerHTML = `<div class="cine" id="cine">
      <div class="cine-stage" id="stage"></div>
      <div class="cine-bar top"></div><div class="cine-bar bot"></div>
      <div class="cine-text" id="ctext" aria-live="polite"></div>
      <button class="cine-skip" id="skip">건너뛰기</button>
    </div>`;
  const root = app.root.querySelector("#cine");
  const stage = root.querySelector("#stage");
  const text = root.querySelector("#ctext");

  const done = () => { if (finished) return; finished = true; clearTimeout(timer); onDone(); };

  function show(n) {
    clearTimeout(timer);
    i = n;
    if (i >= INTRO.length) return titleCard();
    const cut = INTRO[i];
    const layer = document.createElement("div");
    layer.innerHTML = bgLayer(cut.bg, cut.tone, "kb");
    const el = layer.firstElementChild;
    stage.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    [...stage.children].slice(0, -2).forEach(c => c.remove());
    text.classList.toggle("center", !!cut.center);
    text.innerHTML = `<h1 class="cine-big">${esc(cut.big).replace(/\n/g, "<br>")}</h1><p class="cine-small ${cut.type ? "typed" : ""}">${cut.type ? "" : esc(cut.small)}</p>`;
    let wait = AUTO_MS;
    if (cut.type) {                                   // 한 글자씩 찍힘 (큰 글씨가 뜬 뒤 시작)
      const p = text.querySelector(".cine-small"), full = cut.small, me = i;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) p.textContent = full;
      else full.split("").forEach((ch, k) => setTimeout(() => { if (i === me && !finished) p.textContent = full.slice(0, k + 1); }, 1100 + k * 95));
      wait = AUTO_MS + 1400;
    }
    timer = setTimeout(() => show(i + 1), wait);
  }

  function titleCard() {
    const layer = document.createElement("div");
    layer.innerHTML = bgLayer(null, "black");
    const el = layer.firstElementChild;
    stage.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    text.classList.add("center");
    text.innerHTML = `<img class="cine-logo" src="assets/img/logo.png" alt="고흥FC 엠블럼">
      <h1 class="cine-title">고흥FC</h1><p class="cine-title-sub">드림 프로젝트</p>
      <button class="btn btn-kit cine-go" id="go">축구부실로 가기</button>`;
    root.querySelector("#skip").remove();
    text.querySelector("#go").addEventListener("click", e => { e.stopPropagation(); done(); });
    text.querySelector("#go").focus({ preventScroll: true });
  }

  root.addEventListener("click", e => {
    if (e.target.closest("#skip")) { done(); return; }
    if (i < INTRO.length) show(i + 1);
  });
  show(0);
}

return { bgLayer, renderIntro };
})();
(__fix["js/ui/intro.js"] || []).forEach(f => f());

// ── js/ui/create.js
__m["js/ui/create.js"] = (function () {
const {POSITIONS, GROWTH_TYPES, FACES, TRAITS} = __m["data/player.js"];
const {TALK, TRAIT_REMARK, MEASURES} = __m["data/story.js"];
const {ROSTER, STAFF} = __m["data/roster.js"];
const {rollPlayer} = __m["js/state.js"];
const {ovr} = __m["js/engine/team.js"];
const {getPath, pick} = __m["js/rng.js"];
const {esc, img, stars, fillText} = __m["js/ui/util.js"];
const {bgLayer} = __m["js/ui/intro.js"];
// 입단: 감독님과 대화하며 선수를 만듭니다 (비주얼 노벨 방식)








const MAX_REROLL = 3;
const TYPE_MS = 26;

const PORTRAIT = { coach: "npc_coach", assistant: "npc_assistant" };
const NAME_TAG = { coach: () => STAFF.coach, assistant: () => STAFF.assistant };

function renderCreate(app) {
  const d = { name: "", face: null, birthday: null, position: null, foot: null, growthType: null, rolled: null, rerolls: 0, number: 0 };
  app.root.innerHTML = `<div class="vn" id="vn">
      <div class="vn-stage" id="vbg">${bgLayer("bg_locker", "night", "on")}</div>
      <div class="vn-portrait" id="por" aria-hidden="true"></div>
      <div class="vn-box" id="box">
        <div class="vn-name" id="who"></div>
        <p class="vn-text" id="txt"></p>
        <div class="vn-ui" id="ui"></div>
        <span class="vn-more" id="more" aria-hidden="true">화면을 누르면 다음 ▼</span>
      </div>
      <button class="vn-exit linkbtn" id="exit">처음으로</button>
    </div>`;
  const $ = id => app.root.querySelector(`#${id}`);
  const box = $("box"), txt = $("txt"), who = $("who"), ui = $("ui"), more = $("more"), por = $("por"), stageEl = $("vn");
  // 선택지·입력칸이 나타나면 상자 안에서 보이도록 스크롤 (낮은 화면 대비)
  new MutationObserver(() => { if (ui.childElementCount) requestAnimationFrame(() => box.scrollTo({ top: box.scrollHeight, behavior: "smooth" })); })
    .observe(ui, { childList: true });
  let alive = true;
  $("exit").addEventListener("click", () => { alive = false; app.go("title"); });

  const vars = () => ({ name: d.name, coach: STAFF.coach, assistant: STAFF.assistant });

  function setSpeaker(w) {
    who.textContent = w === "narr" ? "" : w === "me" ? d.name || "나" : NAME_TAG[w]();
    who.hidden = w === "narr";
    box.classList.toggle("narr", w === "narr");
    const face = w === "me" ? (d.face ? `${d.face}_g1` : null) : PORTRAIT[w];
    if (face) {
      if (por.dataset.face !== face) { por.innerHTML = img(face, ""); por.dataset.face = face; }
      por.className = `vn-portrait on ${w === "me" ? "right" : ""}`;
    } else por.className = "vn-portrait";
  }

  // 한 줄 말하기: 글자가 다 나오면 클릭으로 넘어감
  function say(w, text) {
    return new Promise(resolve => {
      if (!alive) return;
      setSpeaker(w);
      ui.innerHTML = "";
      const full = fillText(text, vars());
      let n = 0, typing = true;
      more.hidden = true;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const t = setInterval(() => {
        n += 1; txt.textContent = full.slice(0, n);
        if (n >= full.length) finish();
      }, reduce ? 0 : TYPE_MS);
      function finish() { clearInterval(t); typing = false; txt.textContent = full; more.hidden = false; }
      // 화면 어디를 눌러도 넘어감 (버튼·입력칸·측정표 제외)
      const onClick = e => {
        if (e.target.closest?.("button, input, form, .vn-report")) return;
        if (typing) { finish(); return; }
        stageEl.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKey);
        resolve();
      };
      const onKey = e => {
        if (!(e.key === "Enter" || e.key === " ")) return;
        if (e.target.closest?.("button, input")) return;      // 버튼에 초점이 있으면 버튼이 처리
        e.preventDefault(); onClick({ target: box });
      };
      stageEl.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
    });
  }
  async function lines(list) { for (const l of list) await say(l.who, l.text); }

  // 선택지: 마지막 대사를 띄운 채로 버튼을 보여 줌
  function choose(options) {
    return new Promise(resolve => {
      more.hidden = true;
      ui.innerHTML = `<div class="vn-choices">${options.map((o, i) =>
        `<button class="vn-choice" data-i="${i}">${o.html || esc(o.label)}</button>`).join("")}</div>`;
      ui.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => resolve(options[+b.dataset.i])));
      ui.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  function askName() {
    return new Promise(resolve => {
      more.hidden = true;
      ui.innerHTML = `<form class="vn-form" id="nf"><input id="nm" maxlength="5" placeholder="이름 (2~5글자)" autocomplete="off" aria-label="선수 이름">
        <button class="btn btn-kit" type="submit">말하기</button></form>`;
      const input = ui.querySelector("#nm");
      input.focus();
      ui.querySelector("#nf").addEventListener("submit", e => {
        e.preventDefault();
        const v = input.value.trim();
        if (v.length < 2) { input.focus(); input.placeholder = "두 글자 이상 적어 주세요"; return; }
        resolve(v);
      });
    });
  }

  // 생일: 월·일 고르기 (생일 주간에 축하 이벤트와 컨디션 보너스)
  const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function askBirthday() {
    return new Promise(resolve => {
      more.hidden = true;
      const opt = (n, unit) => Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1}${unit}</option>`).join("");
      ui.innerHTML = `<form class="vn-form vn-bday" id="bd">
        <select id="bm" aria-label="태어난 달">${opt(12, "월")}</select>
        <select id="bdd" aria-label="태어난 날">${opt(31, "일")}</select>
        <button class="btn btn-kit" type="submit">말하기</button></form>`;
      const m = ui.querySelector("#bm"), dd = ui.querySelector("#bdd");
      m.addEventListener("change", () => {             // 그 달에 없는 날짜는 고를 수 없게 (2월 30일 등)
        const max = DAYS[+m.value - 1];
        [...dd.options].forEach(o => { o.disabled = +o.value > max; });
        if (+dd.value > max) dd.value = String(max);
      });
      m.focus();
      ui.querySelector("#bd").addEventListener("submit", e => { e.preventDefault(); resolve({ month: +m.value, day: +dd.value }); });
    });
  }

  function askFace() {
    return new Promise(resolve => {
      more.hidden = true;
      ui.innerHTML = `<div class="vn-faces">${FACES.map((f, i) =>
        `<button data-face="${f}" aria-label="얼굴 ${i + 1}">${img(`${f}_g1`, `얼굴 ${i + 1}`)}</button>`).join("")}</div>`;
      ui.querySelectorAll("[data-face]").forEach(b => b.addEventListener("click", () => resolve(b.dataset.face)));
    });
  }

  function setBg(name, tone) {
    const stage = $("vbg");
    const w = document.createElement("div");
    w.innerHTML = bgLayer(name, tone);
    const el = w.firstElementChild;
    stage.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    setTimeout(() => [...stage.children].slice(0, -1).forEach(c => c.remove()), 900);
  }

  // 측정 결과로 감독님 한마디 만들기
  function verdict(p) {
    const keys = Object.keys(POSITIONS[p.position].weights);
    const all = ["tech.dribble", "tech.pass", "tech.shoot", "tech.firstTouch", "tech.defense", "phys.speed", "phys.stamina", "phys.strength", "phys.jump"];
    const label = { "tech.dribble": "드리블", "tech.pass": "패스", "tech.shoot": "슈팅", "tech.firstTouch": "볼 터치", "tech.defense": "수비",
      "phys.speed": "스피드", "phys.stamina": "체력", "phys.strength": "몸싸움", "phys.jump": "점프" };
    const best = all.slice().sort((a, b) => getPath(p.stats, b) - getPath(p.stats, a))[0];
    const worst = keys.slice().sort((a, b) => getPath(p.stats, a) - getPath(p.stats, b))[0];
    return fillText("{b|은/는} 쓸 만하다. 그런데 {p|이/가} {w|이/가} 이래서는 곤란해. 거기부터 채워라.",
      { b: label[best], p: POSITIONS[p.position].label, w: label[worst] });
  }

  function reportCard(p) {
    return `<div class="vn-report">
      <div class="vr-head">기초 체력 측정표 <span class="mute">${esc(d.name)}, 1학년</span></div>
      <dl class="vr-list">
        <dt>키 / 몸무게</dt><dd class="num">${p.body.height.toFixed(1)}cm / ${p.body.weight.toFixed(1)}kg</dd>
        ${MEASURES.map(m => `<dt>${m.label}</dt><dd class="num">${m.fmt(getPath(p.stats, m.stat))}</dd>`).join("")}
        <dt>종합 능력치</dt><dd class="num">${Math.floor(ovr(p))}</dd>
        <dt>코치 평가</dt><dd>${stars(p.coachStars)}</dd>
      </dl>
      <div>${p.traits.map(t => `<span class="trait ${TRAITS[t].good ? "good" : "bad"}">${TRAITS[t].label}</span>`).join("")}</div>
    </div>`;
  }

  function freeNumber() {
    const used = new Set(ROSTER.filter(r => ["3학년선배", "2학년선배", "동기"].includes(r.cohort)).map(r => r.number));
    const free = []; for (let n = 30; n <= 99; n++) if (!used.has(n)) free.push(n);
    return pick(free);
  }

  // ── 대본 ──
  (async () => {
    await lines(TALK.greet);
    d.name = await askName();
    await say("me", "{name}입니다!");
    await lines(TALK.nameAck);
    await say("assistant", "얼굴은 어떤 느낌으로 찍을래?");
    d.face = await askFace();
    await say("narr", "찰칵. 명단 맨 아래에 사진 한 장이 붙었다.");
    await say("assistant", "생일은 언제야? 명단에 적어 두면 그 주엔 다들 알게 된다.");
    d.birthday = await askBirthday();
    await say("me", `${d.birthday.month}월 ${d.birthday.day}일이에요!`);
    await say("assistant", d.birthday.month >= 3 && d.birthday.month <= 12 ? "적어 뒀다. 그 주엔 훈련 끝나고 라커룸 불 꺼져도 놀라지 마라." : "방학 중이네. 그래도 단톡방은 안 잊는다.");

    setBg("bg_field_day", "field");
    await lines(TALK.position);
    const pos = await choose(Object.entries(TALK.positionAnswers).map(([k, v]) =>
      ({ k, html: `${esc(v.say)}<small>${POSITIONS[k].label} (${k})</small>` })));
    d.position = pos.k;
    await say("me", TALK.positionAnswers[d.position].say);
    await say("coach", TALK.positionAnswers[d.position].react);

    await lines(TALK.foot);
    const ft = await choose(Object.entries(TALK.footAnswers).map(([k, v]) => ({ k, html: `${esc(v.say)}<small>${k === "R" ? "오른발잡이" : "왼발잡이"}</small>` })));
    d.foot = ft.k;
    await say("me", TALK.footAnswers[d.foot].say);
    await say("coach", TALK.footAnswers[d.foot].react);

    await lines(TALK.growth);
    const gr = await choose(Object.entries(TALK.growthAnswers).map(([k, v]) => ({ k, html: `${esc(v.say)}<small>${GROWTH_TYPES[k].label}: ${GROWTH_TYPES[k].desc}</small>` })));
    d.growthType = gr.k;
    await say("me", TALK.growthAnswers[d.growthType].say);
    await say("coach", TALK.growthAnswers[d.growthType].react);

    await lines(TALK.testIntro);
    while (alive) {
      d.rolled = rollPlayer(d);
      const p = d.rolled;
      await say("assistant", `키 ${p.body.height.toFixed(1)}cm, 몸무게 ${p.body.weight.toFixed(1)}kg.`);
      await say("assistant", `50미터 ${MEASURES[0].fmt(p.stats.phys.speed)}, 리프팅 ${MEASURES[3].fmt(p.stats.tech.firstTouch)}.`);
      await lines(TALK.testOutro);
      await say("coach", verdict(p));
      for (const t of p.traits) if (TRAIT_REMARK[t]) await say("coach", TRAIT_REMARK[t]);   // 한마디가 없는 특성은 건너뜀
      setSpeaker("coach");
      txt.textContent = "측정표 봐라. 이게 지금 너다.";
      ui.innerHTML = reportCard(p);
      const left = MAX_REROLL - d.rerolls;
      const opts = [{ k: "ok", label: "열심히 하겠습니다!" }];
      if (left > 0) opts.push({ k: "again", label: `한 번만 다시 뛰어 볼게요 (${left}번 남음)` });
      more.hidden = true;
      const wrap = document.createElement("div");
      wrap.className = "vn-choices";
      wrap.innerHTML = opts.map((o, i) => `<button class="vn-choice" data-i="${i}">${esc(o.label)}</button>`).join("");
      ui.appendChild(wrap);
      const pickd = await new Promise(r => wrap.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => r(opts[+b.dataset.i]))));
      if (pickd.k === "ok") break;
      d.rerolls++;
      await say("coach", "그래. 한 번만 더 해 봐라. 이번엔 제대로.");
    }

    setBg("bg_locker", "night");
    await lines(TALK.numberIntro);
    d.number = freeNumber();
    await say("coach", `넌 ${d.number}번이다.`);
    await say("narr", `${d.number}번. 아직 이름도 안 박힌 주황색 유니폼을 받았다.`);
    await lines(TALK.farewell);
    if (alive) app.startGame({ ...d.rolled, name: d.name, number: d.number, birthday: d.birthday });
  })();
}

return { renderCreate };
})();
(__fix["js/ui/create.js"] || []).forEach(f => f());

// ── js/ui/views.js
__m["js/ui/views.js"] = (function () {
const {ACTION_MAP} = __m["data/actions.js"];
const {POSITIONS, GROWTH_TYPES, TRAITS, STAT_GROUPS, ROLES, EARNABLE} = __m["data/player.js"];
const {STAFF, ROSTER} = __m["data/roster.js"];
const {PHASES, MONTHS} = __m["data/calendar.js"];
const {turnInfo, upcoming, yearTurns, label} = __m["js/engine/calendar.js"];
const {SLOTS, slotLocked} = __m["js/engine/week.js"];
const {INJURIES} = __m["js/engine/injury.js"];
const {sortTable, US, tierLabel, ensureSeason, stillScheduled} = __m["js/engine/season.js"];
const {HIGH_SCHOOLS} = __m["data/world.js"];
const {ovr, depthChart, activeRoster, mateGrade} = __m["js/engine/team.js"];
const {efficiency, conditionOf} = __m["js/engine/growth.js"];
const {SIGNATURE} = __m["data/match.js"];
const {STAT_LABEL} = __m["data/player.js"];
const {esc, img, faceOf, fl, stars, gauge, statLevel, AVATAR} = __m["js/ui/util.js"];
const {getPath} = __m["js/rng.js"];
const {REL_ROLES, rivalGap, captainScore} = __m["js/engine/relations.js"];
const {isBirthdayWeek} = __m["js/engine/birthday.js"];
// 게임 안 화면들: 홈, 선수, 팀, 일정, 메시지

















const ACADEMIC_ALERT = [
  null,
  ["gold", "학업 경고 중. 학업이 40을 넘으면 풀립니다."],
  ["gold", "학부모 상담까지 했습니다. 학업 30 아래."],
  ["", "대회 출전 제한. 학업이 20을 넘어야 하계·동계대회에 나갈 수 있습니다."],
  ["", "공식 경기 출전 정지. 학업이 10을 넘어야 합니다."],
];

// FC 시리즈 느낌의 선수 카드: 종합 능력치, 포지션, 얼굴, 여섯 가지 대표 능력치
const avg = (...v) => v.reduce((a, b) => a + b, 0) / v.length;
function sixStats(p) {
  const t = p.stats.tech, h = p.stats.phys;
  return [["속도", avg(h.speed, h.agility)], ["슈팅", t.shoot], ["패스", avg(t.pass, t.cross)],
    ["드리블", avg(t.dribble, t.firstTouch)], ["수비", t.defense], ["체격", avg(h.strength, h.stamina, h.jump)]];
}
function cardTier(o) { return o >= 75 ? "hero" : o >= 64 ? "gold" : o >= 50 ? "silver" : "bronze"; }

function fcCard(state, { big = false } = {}) {
  const p = state.player;
  const o = fl(ovr(p));
  const role = ROLES.find(r => r.id === p.role);
  return `<div class="fccard t-${cardTier(o)} ${big ? "big" : ""}" aria-label="선수 카드">
    <div class="fc-shine" aria-hidden="true"></div>
    <div class="fc-top">
      <div class="fc-ovr num">${o}</div>
      <div class="fc-pos">${p.position}</div>
      <img class="fc-crest" src="assets/img/logo.png" alt="">
      ${state.flags.captain ? `<div class="fc-cap" title="주장">C</div>` : ""}
    </div>
    <div class="fc-face">${img(faceOf(p, state.calendar.grade), `${p.name} 얼굴`)}</div>
    <div class="fc-name">${esc(p.name)}</div>
    <div class="fc-stats">${sixStats(p).map(([k, v]) => `<div><b class="num">${fl(v)}</b><span>${k}</span></div>`).join("")}</div>
    <div class="fc-foot"><span class="num">#${p.number}</span><span>${GROWTH_TYPES[p.growthType].label}</span>${role ? `<span>${role.label}</span>` : ""}</div>
  </div>`;
}
const jerseyCard = state => `<section class="cardwrap">${fcCard(state)}
  <div class="card-under"><span title="코치 평가">잠재력 ${stars(state.player.coachStars)}</span></div></section>`;

// 다음 경기 타일
function shield(name) {
  const ch = name.replace(/^(서울|경기|부산|대구|인천|울산|강원|충북|제주|여수|순천|광양|목포|보성|해남|완도|광주|남해안)\s?/, "").slice(0, 1);
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return `<svg class="shield" viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2 L37 8 V24 C37 35 29 41 20 44 C11 41 3 35 3 24 V8 Z" fill="hsl(${hue} 55% 38%)" stroke="hsl(${hue} 60% 70%)" stroke-width="1.5"/>
    <text x="20" y="29" text-anchor="middle">${esc(ch)}</text></svg>`;
}
function nextMatchTile(state) {
  let info = null, k = 0;
  for (let i = 0; i < 10; i++) { const x = turnInfo(state, i); if (!x) break; if (x.match && stillScheduled(state, x)) { info = x; k = i; break; } }
  if (!info) return `<section class="tile next empty"><span class="eyebrow">NEXT MATCH</span><p class="mute">당분간 경기가 없습니다. 몸을 만들 시간입니다.</p></section>`;
  const locked = k === 0 ? slotLocked(state, "we") : null;
  let opp = locked?.fx?.opponent?.name;
  if (!opp && info.match.comp === "league") {
    ensureSeason(state, info);
    const pair = state.league?.rounds?.[info.leagueRound]?.find(x => x.includes(US));
    opp = pair && state.league.teams.find(t => t.id === (pair[0] === US ? pair[1] : pair[0]))?.name;
  }
  if (!opp && (info.match.comp === "summer" || info.match.comp === "winter") && info.match.stage === "group" && state.tour?.key === `${info.grade}-${info.match.comp}`) opp = state.tour.group[1 + state.tour.groupPlayed]?.name;
  opp ||= info.match.comp === "hs" ? "고등학교 팀" : "상대 미정";
  const when = k === 0 ? "이번 주말" : `${k}주 뒤`;
  return `<section class="tile next ${info.comp.tournament ? "cup" : ""}">
    <div class="nm-head"><span class="eyebrow">NEXT MATCH</span><span class="nm-when">${when}</span></div>
    <div class="nm-teams">
      <div class="nm-team"><img src="assets/img/logo.png" alt=""><b>고흥FC</b></div>
      <span class="nm-vs">VS</span>
      <div class="nm-team">${shield(opp)}<b>${esc(opp)}</b></div>
    </div>
    <div class="nm-comp">${info.comp.label}${info.match.round ? `, ${esc(info.match.round)}` : info.leagueRound != null ? `, ${info.leagueRound + 1}라운드` : ""}<span>${info.month}월 ${info.week}주차</span></div>
  </section>`;
}

function conditionPanel(state) {
  const p = state.player;
  const s = p.stats.student;
  const inj = p.condition.injury;
  const alert = ACADEMIC_ALERT[state.flags.academicLevel];
  const c = conditionOf(p);
  const mp = Math.round(c.match * 100);
  return `<section class="panel">
    <h2>컨디션 <span class="cond ${c.cls}">${c.label} ${Math.round(c.score)}</span></h2>
    <p class="cond-note">훈련 효율 <b class="num">${Math.round(c.train * 100)}%</b>, 경기 선택 성공률 <b class="num ${mp > 0 ? "up" : mp < 0 ? "down" : ""}">${mp > 0 ? "+" : ""}${mp}%p</b></p>
    <div class="gauges">
      ${gauge("피로", p.condition.fatigue, { invert: true })}
      ${gauge("사기", p.condition.morale)}
      ${gauge("감독 신뢰", state.relations.coach)}
      ${gauge("학업", s.academic)}
      ${gauge("생활태도", s.attitude)}
    </div>
    ${inj ? `<div class="alert">🩹 ${INJURIES[inj.type].label}, 복귀까지 약 ${Math.max(1, Math.ceil(inj.weeksLeft))}주. 훈련 대신 재활과 학교생활만 할 수 있습니다.</div>` : ""}
    ${p.condition.fatigue >= 85 ? `<div class="alert">피로 ${Math.round(p.condition.fatigue)}. 이대로면 감독님이 다음 공식 경기에서 선발로 안 쓰고 후반에 넣습니다. 다칠 확률도 크게 오릅니다.</div>`
      : p.condition.fatigue >= 50 ? `<div class="alert gold">피로가 쌓였습니다. 30을 넘으면 훈련 효율이, 40을 넘으면 경기 후반 집중력이 떨어집니다. 수면이나 가족 시간이 피로를 가장 많이 풉니다.</div>` : ""}
    ${alert ? `<div class="alert ${alert[0]}">📚 ${alert[1]}</div>` : ""}
  </section>`;
}

function weekPanel(state, opts = {}) {
  const eff = Math.round(efficiency(state) * 100);
  return `<section class="panel">
    <h2>이번 주 <small>훈련 효율 ${eff}%</small>
      <button class="linkbtn mg-toggle" data-mgtoggle aria-pressed="${!!opts.minigame}">🎮 미니게임 ${opts.minigame ? "ON" : "OFF"}</button>
      ${state.lastPlan ? `<button class="linkbtn right" data-repeat>지난주처럼</button>` : ""}</h2>
    <div class="slots">${SLOTS.map(s => {
      const locked = slotLocked(state, s.id);
      if (locked) {
        const fx = locked.fx;
        return `<div class="slot locked"><span class="when">${s.label}</span>
          <span><span class="what">⚽ vs ${esc(fx.opponent.name)}</span>
          <span class="hint">${fx.compLabel}${fx.round ? ` ${esc(fx.round)}` : ""}${fx.school ? `. ${esc(fx.school.coach)} 관전` : ""}</span></span><span></span></div>`;
      }
      const a = ACTION_MAP[state.plan[s.id]];
      return `<button class="slot ${a ? "filled" : ""}" data-slot="${s.id}">
        <span class="when">${s.label}</span>
        <span>${a ? `<span class="what"><span class="ic">${a.icon}</span>${a.label}</span>` : `<span class="what mute">행동 고르기</span>`}</span>
        <span class="chev" aria-hidden="true">›</span></button>`;
    }).join("")}</div>
  </section>`;
}

// 이미 탈락한 대회의 토너먼트 주간은 일정에서 뺍니다

function upcomingPanel(state) {
  const list = upcoming(state, 8).filter(i => stillScheduled(state, i) || i.exam || i.school.some(d => !d.hidden));
  return `<section class="panel"><h2>다가오는 일정</h2>
    ${list.length ? list.map(i => `<div class="fixture"><span class="d">${i.month}월 ${i.week}주</span><span>
      ${i.match && stillScheduled(state, i) ? `<span class="chip ${i.comp.tournament ? "kit" : i.match.comp === "hs" ? "gold" : "turf"}">${i.comp.label}</span>${i.match.round || (i.leagueRound != null ? `${i.leagueRound + 1}라운드` : "")}` : ""}
      ${i.exam ? `<span class="chip gold">시험</span>${i.exam.name}` : ""}
      ${i.school.filter(d => !d.hidden).map(d => `<span class="chip">학교</span>${d.label}`).join(" ")}
    </span></div>`).join("") : `<p class="mute">당분간 경기와 시험이 없습니다. 훈련에 집중할 때입니다.</p>`}
  </section>`;
}

function mailPreview(state) {
  const unread = state.inbox.filter(m => !m.read);
  const list = [...unread, ...state.inbox.filter(m => m.read)].slice(0, 4);
  return `<section class="panel mailbox ${unread.length ? "has-new" : ""}">
    <h2>메시지 ${unread.length ? `<span class="newbadge">새 메시지 ${unread.length}</span>` : ""}<button class="linkbtn right" data-go="inbox">전체 보기</button></h2>
    ${list.length ? list.map(m => mailRow(m, state)).join("") : `<p class="mute">아직 메시지가 없습니다.</p>`}</section>`;
}

// 보낸 사람 얼굴: 감독·코치·선생님·부모님은 인물 그림, 선수는 그 선수 얼굴, 단톡방은 엠블럼
const FACE_BY_NAME = Object.fromEntries(ROSTER.map(r => [r.name, r.face]));
function avatarOf(m) {
  const map = { [STAFF.coach]: "npc_coach", [STAFF.assistant]: "npc_assistant", [STAFF.teacher]: "npc_teacher", "엄마": "npc_mom", "아빠": "npc_dad" };
  const face = map[m.from] || FACE_BY_NAME[m.from];
  if (face) return img(face, "");
  if (m.kind === "group") return `<img src="assets/img/logo.png" alt="">`;
  return AVATAR[m.kind] || "💬";
}
const ago = (m, state) => {
  if (!state) return "";
  const d = state.calendar.turn - m.turn;
  return d <= 1 ? "이번 주" : `${d}주 전`;
};

function mailRow(m, state) {
  const preview = String(m.body || "").replace(/\s+/g, " ").slice(0, 46);
  return `<button class="mail ${m.read ? "" : "unread"}" data-mail="${m.id}">
    <span class="av" aria-hidden="true">${avatarOf(m)}</span>
    <span class="mb"><span class="fr"><b>${esc(m.from)}</b><span class="ago">${ago(m, state)}</span></span>
      <span class="t">${esc(m.title)}</span><span class="pv">${esc(preview)}${String(m.body || "").length > 46 ? "…" : ""}</span></span></button>`;
}

function depthPanel(state) {
  const d = depthChart(state);
  return `<section class="panel"><h2>${POSITIONS[state.player.position].label} 주전 경쟁 <small>${d.slots}자리</small></h2>
    <table class="tbl"><thead><tr><th>순위</th><th>선수</th><th class="r">OVR</th></tr></thead><tbody>
    ${d.list.slice(0, Math.max(d.slots + 2, d.rank)).map((x, i) => `<tr class="${x.me ? "me" : ""}">
      <td class="num">${i + 1}${i < d.slots ? " ⚽" : ""}</td><td>${x.number}. ${esc(x.name)}</td><td class="r num">${fl(x.ovr)}</td></tr>`).join("")}
    </tbody></table>
    <p class="mute" style="font-size:12px;margin:8px 0 0">선발은 능력치와 감독 신뢰도로 정해집니다.</p></section>`;
}

function leagueTable(state, compact = false) {
  const lg = state.league;
  if (!lg) return `<p class="mute">주말리그는 3월 2주차에 시작합니다.</p>`;
  const rows = sortTable(lg.table);
  return `<table class="tbl"><thead><tr><th>#</th><th>팀</th><th class="r">경기</th>${compact ? "" : `<th class="r">승</th><th class="r">무</th><th class="r">패</th><th class="r">득실</th>`}<th class="r">승점</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr class="${r.id === US ? "us" : ""}"><td class="num">${i + 1}</td><td>${esc(r.name)}</td><td class="r num">${r.p}</td>
      ${compact ? "" : `<td class="r num">${r.w}</td><td class="r num">${r.d}</td><td class="r num">${r.l}</td><td class="r num">${r.gf - r.ga > 0 ? "+" : ""}${r.gf - r.ga}</td>`}
      <td class="r num pts">${r.pts}</td></tr>`).join("")}</tbody></table>`;
}

function tourBlock(state) {
  const t = state.tour;
  if (!t) return `<p class="mute">아직 출전한 대회가 없습니다. 하계대회는 7월, 동계대회는 1월입니다.</p>`;
  const rows = sortTable(t.table);
  return `<p style="margin:0 0 8px"><b>${esc(t.name)}</b> <span class="chip ${t.champion ? "gold" : t.alive ? "turf" : ""}">${t.champion ? "우승" : t.alive ? (t.stage === "ko" ? (t.best.endsWith("진출") ? t.best : `${t.best} 진출`) : "조별리그 중") : t.best}</span></p>
    <table class="tbl"><thead><tr><th>#</th><th>조별리그</th><th class="r">경기</th><th class="r">득실</th><th class="r">승점</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr class="${r.id === US ? "us" : ""}"><td class="num">${i + 1}</td><td>${esc(r.name)}</td><td class="r num">${r.p}</td><td class="r num">${r.gf - r.ga > 0 ? "+" : ""}${r.gf - r.ga}</td><td class="r num pts">${r.pts}</td></tr>`).join("")}
    </tbody></table>
    ${t.log.length ? `<h3 style="font-size:13px;color:var(--mute);margin:14px 0 4px">경기 기록</h3>${t.log.map(l => `<div class="fixture"><span class="d">${esc(l.round)}</span><span>vs ${esc(l.opponent)} <b class="num">${l.gf}:${l.ga}</b>${l.shootoutWin != null ? ` (승부차기 ${l.shootoutWin ? "승" : "패"})` : ""}</span></div>`).join("")}` : ""}`;
}

function compPanel(state) {
  const info = turnInfo(state);
  const inTour = info && (info.phase === "summer" || info.phase === "winter") && state.tour?.key?.startsWith(`${info.grade}-`);
  if (inTour) return `<section class="panel"><h2>${esc(state.tour.label)}</h2>${tourBlock(state)}</section>`;
  const lg = state.league;
  return `<section class="panel"><h2>주말리그 순위 ${lg ? `<small>${lg.half}${lg.finished ? " 최종" : ` ${lg.played}/${lg.rounds.length}라운드`}</small>` : ""}
    <button class="linkbtn right" data-go="team">자세히</button></h2>${leagueTable(state, true)}</section>`;
}

function homeView(state, opts = {}) {
  // 휴대폰에서는 다음 경기 → 카드 → 이번 주 → 컨디션 → 순위 → 메시지 → 경쟁 순서 (css .home)
  return `<div class="cols home">
    <div class="colwrap"><div class="o2">${jerseyCard(state)}</div><div class="o4">${conditionPanel(state)}</div><div class="o7">${depthPanel(state)}</div></div>
    <div class="colwrap"><div class="o1">${nextMatchTile(state)}</div><div class="o3">${weekPanel(state, opts)}</div>
      <div class="advance o3b"><button class="btn btn-kit btn-go" data-advance><span>이번 주 진행</span></button></div>
      <div class="o5">${compPanel(state)}</div><div class="o6">${mailPreview(state)}</div><div class="o8">${upcomingPanel(state)}</div></div>
  </div>`;
}

// ── 선수 ────────────────────────────
function playerView(state, tab = "stats") {
  const p = state.player;
  const keys = Object.keys(POSITIONS[p.position].weights);
  let body = "";
  if (tab === "stats") {
    body = `<div class="statgrid">${STAT_GROUPS.map(g => `<div class="statgroup"><h3>${g.label}</h3>
      ${g.stats.map(([k, l]) => {
        const v = p.stats[g.id][k], from = state.yearStart.stats[g.id][k], d = fl(v) - fl(from);
        const key = keys.includes(`${g.id}.${k}`);
        return `<div class="srow ${key ? "key" : ""}"><span class="k">${l}</span>
          <div class="track"><div class="fill ${statLevel(v)}" style="width:${v}%"></div></div>
          <span class="v num">${fl(v)}</span>
          <span class="ch num ${d > 0 ? "up" : d < 0 ? "down" : "mute"}">${d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : "–"}</span></div>`;
      }).join("")}</div>`).join("")}</div>
      <p class="mute" style="font-size:12px;margin:12px 0 0">주황색 이름은 ${POSITIONS[p.position].label} 종합 능력치에 들어가는 능력치입니다. 화살표는 올해 3월 대비 변화입니다.</p>`;
  }
  if (tab === "body") {
    body = `<dl class="kv" style="margin-bottom:14px">
        <dt>키</dt><dd class="num">${p.body.height.toFixed(1)}cm</dd>
        <dt>몸무게</dt><dd class="num">${p.body.weight.toFixed(1)}kg</dd>
        <dt>주발</dt><dd>${p.foot === "L" ? "왼발" : "오른발"}</dd>
        ${p.birthday ? `<dt>생일</dt><dd>${p.birthday.month}월 ${p.birthday.day}일${isBirthdayWeek(state, turnInfo(state)) ? " 🎂 생일 주간" : ""}</dd>` : ""}
        <dt>성장 유형</dt><dd>${GROWTH_TYPES[p.growthType].label}</dd>
      </dl>
      <table class="tbl"><thead><tr><th>측정</th><th class="r">키</th><th class="r">몸무게</th></tr></thead><tbody>
      ${p.body.history.map(h => `<tr><td>${h.label}</td><td class="r num">${h.height.toFixed(1)}</td><td class="r num">${h.weight.toFixed(1)}</td></tr>`).join("")}
      </tbody></table>
      <p class="mute" style="font-size:12px;margin:10px 0 0">신체 측정은 매년 3월과 9월에 합니다.</p>`;
  }
  if (tab === "traits") {
    const earnedIds = new Set((state.record.earned || []).map(e => e.id));
    const locked = Object.entries({ ...Object.fromEntries(Object.entries(TRAITS).filter(([, t]) => t.earned)), ...EARNABLE })
      .filter(([id]) => !p.traits.includes(id));
    body = p.traits.map(t => `<div style="margin-bottom:12px"><span class="trait ${TRAITS[t].good ? "good" : "bad"}">${TRAITS[t].label}</span>${earnedIds.has(t) ? ` <span class="chip kit">획득</span>` : ""}
      <div class="mute" style="font-size:14px">${TRAITS[t].desc}</div></div>`).join("") +
      `<h3 style="font-size:14px;margin:18px 0 6px">얻을 수 있는 특성 <small class="mute">조건을 채우면 특성이 생기고 능력치도 오릅니다</small></h3>
       <div class="sigs">${locked.map(([id, x]) => `<div class="sig"><span class="sn">☆ ${esc(TRAITS[id].label)}</span><span class="sr">${esc(x.how)}</span></div>`).join("")}</div>` +
      `<h3 style="font-size:14px;margin:18px 0 6px">경기 특기 <small class="mute">능력치가 기준을 넘으면 경기에서 선택지가 생깁니다</small></h3>
       <div class="sigs">${Object.entries(SIGNATURE).filter(([id]) => sigPos(id).includes(p.position)).map(([id, sg]) => {
         const okAll = Object.entries(sg.requires).every(([k, v]) => getPath(p.stats, k) >= v);
         return `<div class="sig ${okAll ? "on" : ""}"><span class="sn">${okAll ? "★" : "☆"} ${esc(sg.label)}</span>
           <span class="sr">${Object.entries(sg.requires).map(([k, v]) => `${STAT_LABEL[k]} <b class="num ${getPath(p.stats, k) >= v ? "up" : ""}">${Math.floor(getPath(p.stats, k))}</b>/${v}`).join(", ")}</span></div>`;
       }).join("")}</div>` +
      `<div style="margin-top:16px"><div class="mute" style="font-size:13px">코치 평가 (잠재력 추정)</div>${stars(p.coachStars)}
       <p class="mute" style="font-size:12px">코치님의 눈도 가끔 틀립니다. 매년 3월에 다시 평가합니다.</p></div>`;
  }
  if (tab === "record") {
    const r = state.record;
    const avg = r.ratings.length ? (r.ratings.reduce((a, b) => a + b, 0) / r.ratings.length).toFixed(2) : "–";
    const last = r.matches.filter(m => m.rating != null).slice(-5);
    body = `<dl class="kv" style="margin-bottom:14px">
        <dt>출전</dt><dd class="num">${r.apps}경기 (선발 ${r.starts})</dd>
        <dt>득점</dt><dd class="num">${r.goals}골</dd>
        <dt>도움</dt><dd class="num">${r.assists}개</dd>
        <dt>평균 평점</dt><dd class="num">${avg}</dd>
        <dt>최근 폼</dt><dd><div class="form">${last.length ? last.map(m => {
          const c = m.rating >= 7.5 ? "var(--turf)" : m.rating >= 6.5 ? "var(--gold)" : "var(--red)";
          return `<span style="background:${c};color:#0D1433">${m.rating.toFixed(1)}</span>`; }).join("") : `<span class="mute" style="width:auto">기록 없음</span>`}</div></dd>
      </dl>
      <table class="tbl"><thead><tr><th>날짜</th><th>대회</th><th>상대</th><th class="r">결과</th><th class="r">평점</th></tr></thead><tbody>
      ${r.matches.slice().reverse().slice(0, 30).map(m => {
        const t = turnInfo({ calendar: { turn: m.turn } });
        return `<tr><td class="num">${t ? `중${t.grade} ${t.month}/${t.week}` : ""}</td><td>${m.comp}</td><td>${esc(m.opponent)}</td>
        <td class="r num">${m.gf}:${m.ga}</td><td class="r num">${m.rating != null ? m.rating.toFixed(1) : `<span class="mute">${m.status === "bench" ? "벤치" : "–"}</span>`}</td></tr>`; }).join("")}
      </tbody></table>`;
  }
  const tabs = [["stats", "능력치"], ["body", "신체"], ["traits", "특성"], ["record", "기록"]];
  return `<div class="cols">
    <div>${jerseyCard(state)}</div>
    <section class="panel">
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-ptab="${k}" aria-selected="${tab === k}">${l}</button>`).join("")}</div>
      ${body}
    </section></div>`;
}

function sigPos(id) {
  return { fw_1v1: ["FW"], fw_through: ["FW"], fw_cross: ["FW"], mf_press: ["MF"], mf_space: ["MF"], mf_defend: ["MF"],
    df_1v1: ["DF"], df_cross: ["DF"], df_corner: ["DF"], freekick: ["FW", "MF"] }[id] || [];
}

// ── 팀 ──────────────────────────────
function teamView(state, tab = "league") {
  const tabs = [["rel", "관계"], ["league", "리그"], ["tour", "대회"], ["scout", "진학"], ["squad", "선수단"]];
  let body = "";
  if (tab === "rel") {
    const P = state.relations.people || {};
    const word = v => v >= 85 ? "절친" : v >= 70 ? "가까움" : v >= 45 ? "보통" : v >= 25 ? "서먹함" : "불편함";
    const rivalWord = v => v >= 70 ? "불꽃 튀는 사이" : v >= 45 ? "신경 쓰이는 사이" : "아직은 덤덤";
    const g = state.calendar.grade;
    const tv = state.relations.teacher ?? 50;
    const teacherCard = `<div class="rel">
        <div class="rel-face">${img("npc_teacher", STAFF.teacher)}</div>
        <div class="rel-main">
          <div class="rel-head"><span class="rel-ic">📒</span><b>${esc(STAFF.teacher)}</b><span class="mute">담임, 국어</span></div>
          <div class="rel-bar"><div class="track"><div class="fill" style="width:${tv}%"></div></div><span class="num">${Math.round(tv)}</span><span class="mute">${word(tv)}</span></div>
          <p class="rel-desc">시험 성적, 수업 태도, 학교 행사에서의 선택에 따라 관계가 달라지고, 졸업식 날 받는 편지도 바뀝니다. 70 이상이면 1년에 한 번 '류봉두의 축복'이 찾아옵니다${state.flags.blessed?.[state.calendar.grade] ? " (올해 받음 ✨)" : ""}.</p>
        </div></div>`;
    body = `<h2>관계</h2><div class="rels">${teacherCard}${Object.entries(REL_ROLES).map(([k, r]) => {
      const x = P[k];
      if (!x) return `<div class="rel empty"><div class="rel-head"><span class="rel-ic">${r.icon}</span><b>${r.label}</b></div>
        <p class="mute">${k === "junior" ? "중2가 되면 후배가 생깁니다." : "지금은 없습니다."}</p></div>`;
      const gap = k === "rival" ? rivalGap(state) : null;
      return `<div class="rel">
        <div class="rel-face">${img(x.face, x.name)}</div>
        <div class="rel-main">
          <div class="rel-head"><span class="rel-ic">${r.icon}</span><b>${esc(x.name)}</b><span class="mute">${r.label}, ${x.position}</span></div>
          <div class="rel-bar"><div class="track"><div class="fill" style="width:${x.value}%"></div></div><span class="num">${Math.round(x.value)}</span><span class="mute">${k === "rival" ? rivalWord(x.value) : word(x.value)}</span></div>
          <p class="rel-desc">${r.desc}</p>
          ${gap != null ? `<p class="rel-desc">종합 능력치 차이 <b class="num ${gap >= 0 ? "up" : "down"}">${gap > 0 ? "+" : ""}${gap}</b>${Math.abs(gap) <= 5 ? " · 라이벌 효과 켜짐 (훈련 효율 +5%)" : ""}</p>` : ""}
        </div></div>`;
    }).join("")}</div>
    ${g === 3 ? `<p class="mute" style="font-size:13px;margin:12px 0 0">${state.flags.captain ? "🟧 주장 완장을 차고 있습니다." : state.flags.captainVoted ? "주장 선거가 끝났습니다." : `3월 2주차에 주장 선거가 있습니다. 지금 지지도 ${Math.round(captainScore(state))} (손을 들었을 때 66 이상이면 당선)`}</p>`
      : `<p class="mute" style="font-size:13px;margin:12px 0 0">중3 3월에 주장 선거가 있습니다. 감독 신뢰, 팀워크, 생활태도, 관계가 모두 반영됩니다.</p>`}`;
  }
  if (tab === "league") {
    const lg = state.league;
    const past = state.record.leagues;
    body = `<h2>주말리그 ${lg ? `<small>${lg.grade}학년 ${lg.half}${lg.finished ? " 최종 순위" : ` ${lg.played}/${lg.rounds.length}라운드`}</small>` : ""}</h2>
      <div style="overflow-x:auto">${leagueTable(state)}</div>
      <p class="mute" style="font-size:12px;margin:8px 0 0">${lg ? lg.teams.length : 10}팀이 한 번씩 맞붙습니다. 이기면 3점, 비기면 1점.</p>
      ${past.length ? `<h2 style="margin-top:20px">지난 리그</h2>${past.map(l => `<div class="fixture"><span class="d">중${l.grade} ${l.half}</span><span>${l.rank === 1 ? "🏆 우승" : `${l.rank}위`}</span></div>`).join("")}` : ""}`;
  }
  if (tab === "tour") {
    const r = state.record;
    body = `<h2>전국대회</h2>${tourBlock(state)}
      ${r.tournaments.length ? `<h2 style="margin-top:20px">대회 성적</h2>${r.tournaments.map(t => `<div class="fixture"><span class="d">중${t.grade} ${esc(t.name)}</span><span>${t.best === "우승" ? "🏆 우승" : esc(t.best)}</span></div>`).join("")}` : ""}
      ${r.titles.length ? `<h2 style="margin-top:20px">우승 기록</h2>${r.titles.map(t => `<div class="fixture"><span class="d">중${t.grade}</span><span>🏆 ${esc(t.name)}</span></div>`).join("")}` : ""}`;
  }
  if (tab === "scout") {
    const seen = HIGH_SCHOOLS.filter(h => state.scouting[h.id]);
    body = `<h2>진학 관심도</h2>
      <p class="mute" style="font-size:14px;margin-top:0">고등학교 팀과의 진학 연습경기에서 활약하면 그 학교의 관심이 커집니다. 중3 4월과 6월에 꼭 열리고, 중2 2학기에도 가끔 잡힙니다.</p>
      ${seen.length ? seen.map(h => { const sc = state.scouting[h.id]; return `<div class="interest">
        <span>${esc(h.name)}<br><small class="mute">${tierLabel(h.tier)}${sc.offered ? ` <span class="chip kit">입학 제안</span>` : ""}</small></span>
        <div class="track"><div class="fill" style="width:${sc.interest}%"></div></div><span class="num r">${Math.round(sc.interest)}</span></div>`; }).join("")
      : `<p class="mute">아직 고등학교 감독님이 경기를 보러 온 적이 없습니다.</p>`}`;
  }
  if (tab === "squad") {
    const g = state.calendar.grade;
    const roster = activeRoster(state).map(m => ({ ...m, g: mateGrade(m, g) }));
    const me = state.player;
    const rows = [...roster, { name: me.name, number: me.number, position: me.position, ovrNow: ovr(me), g, me: true }]
      .sort((a, b) => b.g - a.g || ["FW", "MF", "DF"].indexOf(a.position) - ["FW", "MF", "DF"].indexOf(b.position) || b.ovrNow - a.ovrNow);
    body = `<h2>고흥FC U-15 <small>${rows.length}명</small></h2>
      <table class="tbl"><thead><tr><th>번호</th><th>이름</th><th>학년</th><th>포지션</th><th class="r">OVR</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="${r.me ? "me" : ""}"><td class="num">${r.number}</td><td>${esc(r.name)}</td><td>중${r.g}</td>
        <td><span class="pos-tag ${r.position}">${r.position}</span></td><td class="r num">${fl(r.ovrNow)}</td></tr>`).join("")}
      </tbody></table>
      <p class="mute" style="font-size:12px;margin:10px 0 0">선수 명단은 data/roster.js 파일에서 바꿀 수 있습니다.</p>`;
  }
  return `<div class="cols"><div>${depthPanel(state)}</div>
    <section class="panel">
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-ttab="${k}" aria-selected="${tab === k}">${l}</button>`).join("")}</div>
      ${body}
    </section></div>`;
}

// ── 일정 ────────────────────────────
function scheduleView(state, grade = state.calendar.grade) {
  const turns = yearTurns(grade);
  const now = state.calendar.turn;
  const byMonth = MONTHS.map(m => ({ ...m, weeks: turns.filter(t => t.month === m.month && turnInfo({ calendar: { turn: t.turn } })) }))
    .filter(m => m.weeks.length);
  return `<section class="panel">
    <div class="tabs" role="tablist">${[1, 2, 3].map(g => `<button role="tab" data-sgrade="${g}" aria-selected="${g === grade}">중${g}</button>`).join("")}</div>
    ${byMonth.map(m => `<div class="month"><h3>${m.month}월 <span class="chip ${PHASES[m.phase].color === "orange" ? "kit" : PHASES[m.phase].color === "pitch" ? "turf" : ""}">${PHASES[m.phase].label}</span></h3>
      ${m.weeks.map(t => {
        const info = turnInfo({ calendar: { turn: t.turn } });
        const cls = t.turn === now ? "now" : t.turn < now ? "past" : "";
        const items = [];
        if (info.match) items.push(`<span class="chip ${info.comp.tournament ? "kit" : info.match.comp === "hs" ? "gold" : "turf"}">${info.comp.label}</span>${info.match.round || (info.leagueRound != null ? `${info.leagueRound + 1}라운드` : info.match.hsChance?.[grade] ? (info.match.elemChance?.[grade] ? "고교·초등 팀일 수도" : "고교 팀일 수도") : "")}`);
        if (info.exam) items.push(`<span class="chip gold">시험</span>${info.exam.name}`);
        if (t.week === 1 && (t.month === 3 || t.month === 9)) items.push(`<span class="chip">측정</span>신체 측정`);
        for (const d of info.school.filter(d => !d.hidden)) items.push(`<span class="chip">학교</span>${d.label}`);
        if (info.vacation && !info.school.length && !info.match) items.push(`<span class="mute">${info.vacation.label}</span>`);
        return `<div class="week ${cls}"><span class="num">${t.week}주차</span><span>${items.join(" ") || `<span class="mute">훈련</span>`}</span></div>`;
      }).join("")}</div>`).join("")}
  </section>`;
}

function inboxView(state) {
  return `<section class="panel" style="max-width:720px;margin:0 auto;width:100%"><h2>메시지 <small>${state.inbox.filter(m => !m.read).length}개 안 읽음</small>
    <button class="linkbtn right" data-readall>모두 읽음</button></h2>
    ${state.inbox.map(m => mailRow(m, state)).join("") || `<p class="mute">아직 받은 메시지가 없습니다.</p>`}</section>`;
}


return { sixStats, cardTier, fcCard, jerseyCard, mailRow, leagueTable, homeView, playerView, teamView, scheduleView, inboxView, label };
})();
(__fix["js/ui/views.js"] || []).forEach(f => f());

// ── js/ui/career.js
__m["js/ui/career.js"] = (function () {
const {ENDINGS, GRADE_INFO} = __m["data/endings.js"];
const {schoolOptions, chooseSchool, decideEnding, markEnding, seenEndings, teacherLetter} = __m["js/engine/career.js"];
const {openModal} = __m["js/ui/modals.js"];
const {bgLayer} = __m["js/ui/intro.js"];
const {setScene} = __m["js/ui/fx.js"];
const {bgm} = __m["js/ui/bgm.js"];
const {esc, img, faceOf} = __m["js/ui/util.js"];
// 진로 화면: 진학 상담, 국가대표 발표, 엔딩, 엔딩 도감







// 학교 엠블럼 (그림 없이 이름 첫 글자로)
function crest(name, tier) {
  const ch = name.replace(/^(서울|경기|광주|순천|보성|남해안)\s?/, "").slice(0, 1);
  return `<span class="crest t-${tier}">${esc(ch)}</span>`;
}

// ── 진학 상담 ───────────────────────
function admissionModal(app, done) {
  const state = app.state;
  const { ovr, recommend, list } = schoolOptions(state);
  const html = `<div class="adm">
    <div class="adm-head"><span class="eyebrow">CAREER</span><h2>진학 상담</h2>
      <p class="sub">갈 수 있는 학교 중 하나를 고르세요. 한 번 정하면 바꿀 수 없습니다.${recommend ? " 감독님 추천서가 붙었습니다." : ""}</p></div>
    <div class="adm-list">${list.map(s => {
      const pct = s.need ? Math.max(4, Math.min(100, (ovr / s.need) * 100)) : 100;
      return `<button class="adm-card ${s.ok ? "" : "locked"}" data-id="${s.id}" ${s.ok ? "" : "disabled"}>
        ${crest(s.name, s.tier)}
        <span class="adm-main"><b>${esc(s.name)}</b><span class="adm-tier">${esc(s.tierLabel)}${s.offered ? ` <span class="chip kit">입학 제안</span>` : ""}</span>
          ${s.need ? `<span class="adm-bar"><i style="width:${pct}%"></i></span><span class="adm-need">${s.ok ? "가능" : "조금 더 필요"}${s.notes.length ? `, ${esc(s.notes.join(", "))}` : ""}</span>`
            : `<span class="adm-need">${esc(s.notes[0])}</span>`}
        </span>
        <span class="adm-go">${s.ok ? "선택" : "🔒"}</span></button>`;
    }).join("")}</div></div>`;
  openModal(html, (el, close) => {
    el.querySelectorAll("[data-id]:not([disabled])").forEach(b => b.addEventListener("click", () => {
      const r = chooseSchool(state, b.dataset.id);
      if (!r.ok) return;
      app.saveTo("auto");
      el.querySelector(".adm").innerHTML = `<div class="adm-done">${crest(r.school.name, r.school.tier)}
        <span class="eyebrow">DECIDED</span><h2>${esc(r.school.name)}</h2><p class="sub">${esc(r.school.tierLabel)}. 졸업할 때까지 고흥FC 선수로 끝까지 뜁니다.</p>
        <button class="btn btn-kit btn-wide" data-close>확인</button></div>`;
      el.querySelector("[data-close]").addEventListener("click", close);
    }));
  }, { dismissable: false, onClose: done });
}

// ── 국가대표 발표 ───────────────────
function nationalModal(app, done) {
  const state = app.state;
  const r = state.career.national || { selected: false };
  const p = state.player;
  const html = `<div class="nat">
    <span class="eyebrow">U-15 NATIONAL TEAM</span>
    <h2>청소년 대표팀 소집 명단 발표</h2>
    <p class="sub">협회 홈페이지에 명단이 올라왔다. 손가락이 떨린다.</p>
    <ol class="nat-list" id="natl"></ol>
    <div id="natr"></div>
  </div>`;
  openModal(html, (el, close) => {
    const names = ["김도현 (서울 한강중)", "박지후 (울산 고래중)", "이서진 (경기 은하중)", "최하준 (인천 갯벌FC U-15)", "정우진 (부산 파도중)"];
    if (r.selected) names.push(`${p.name} (고흥대서중)`);
    const ol = el.querySelector("#natl");
    let i = 0;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      if (i < names.length) {
        const li = document.createElement("li");
        li.textContent = names[i];
        if (names[i].startsWith(p.name)) li.className = "me";
        ol.appendChild(li); i++;
        setTimeout(step, reduce ? 0 : 520);
      } else {
        el.querySelector("#natr").innerHTML = `<p class="nat-res ${r.selected ? "yes" : "no"}">${r.selected
          ? "있다. 내 이름이 있다. 엄마한테 전화를 걸었는데 목소리가 안 나왔다."
          : "끝까지 내렸지만 이름은 없었다. 그래도 고흥에서 여기까지 온 것만으로도 먼 길이었다."}</p>
          <button class="btn btn-kit btn-wide" data-close>확인</button>`;
        el.querySelector("[data-close]").addEventListener("click", () => { state.pending = null; app.saveTo("auto"); close(); });
      }
    };
    setTimeout(step, 600);
  }, { dismissable: false, onClose: done });
}

// ── 엔딩 ────────────────────────────
function showEnding(app) {
  const state = app.state;
  setScene(null);
  bgm.play("ending");
  const { ending, c } = decideEnding(state);
  markEnding(ending.id);
  app.saveTo("auto");
  const g = GRADE_INFO[ending.grade];
  const p = state.player;
  const recap = [
    ["진학", c.schoolName], ["최종 능력치", c.ovr], ["키", `${c.height.toFixed(1)}cm`],
    ["통산", `${c.apps}경기 ${c.goals}골 ${c.assists}도움`], ["등번호", p.numberHistory.map(h => h.number).join(" → ")],
    ["우승", c.titles.length ? c.titles.map(t => t.name).join(", ") : "없음"],
  ];
  app.view = "ending";
  app.root.innerHTML = `<div class="ending">
    <div class="ending-stage">${bgLayer(ending.img, "night", "kb on")}</div>
    <div class="cine-bar top"></div><div class="cine-bar bot"></div>
    <div class="ending-body">
      <div class="end-grade ${g.cls}">${g.label}</div>
      <span class="eyebrow">ENDING</span>
      <h1 class="end-title">${esc(ending.title)}</h1>
      <div class="end-face">${img(faceOf(p, 3), p.name)}</div>
      <p class="end-story" id="story"></p>
      <div class="end-letter" id="letter" hidden><span class="eyebrow">LETTER</span><p>${esc(teacherLetter(state))}</p></div>
      <dl class="end-recap" id="recap" hidden>${recap.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <div class="end-btns" id="eb" hidden>
        <button class="btn btn-ghost" data-gallery>엔딩 도감</button>
        <button class="btn btn-kit" data-title>타이틀로</button>
      </div>
    </div>
  </div>`;
  const story = app.root.querySelector("#story");
  const text = ending.story(c);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let n = 0;
  const finish = () => { story.textContent = text; app.root.querySelector("#letter").hidden = false; app.root.querySelector("#recap").hidden = false; app.root.querySelector("#eb").hidden = false; };
  const t = setInterval(() => { n += 2; story.textContent = text.slice(0, n); if (n >= text.length) { clearInterval(t); finish(); } }, reduce ? 1 : 32);
  app.root.querySelector(".ending").addEventListener("click", e => { if (!e.target.closest("button")) { clearInterval(t); finish(); } });
  app.root.querySelector("[data-gallery]").addEventListener("click", () => galleryModal());
  app.root.querySelector("[data-title]").addEventListener("click", () => app.toTitle());
}

function galleryModal() {
  const seen = new Set(seenEndings());
  const order = ["L", "S", "H", "A", "B", "C", "D"];
  const list = ENDINGS.slice().sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade));
  openModal(`<button class="close" data-close aria-label="닫기">×</button>
    <span class="eyebrow">COLLECTION</span><h2>엔딩 도감 <small class="mute">${seen.size}/${ENDINGS.length}</small></h2>
    <div class="gal">${list.map(e => {
      const on = seen.has(e.id), g = GRADE_INFO[e.grade];
      return `<div class="gal-item ${on ? "on" : ""}"><span class="gal-grade ${g.cls}">${g.label}</span><b>${on ? esc(e.title) : "???"}</b></div>`;
    }).join("")}</div>
    <p class="mute" style="font-size:13px">엔딩 기록은 이 기기의 이 브라우저에 남습니다.</p>`);
}

return { crest, admissionModal, nationalModal, showEnding, galleryModal };
})();
(__fix["js/ui/career.js"] || []).forEach(f => f());

// ── js/main.js
__m["js/main.js"] = (function () {
const {newGame, saveTo, readSlot, summaryOf, loadSettings, saveSettings} = __m["js/state.js"];
const {playMinigame, statFor} = __m["js/ui/minigames.js"];
const {getPath} = __m["js/rng.js"];
const {turnInfo, label} = __m["js/engine/calendar.js"];
const {beginWeek, endWeek, planReady, SLOTS, slotLocked, actionAllowed} = __m["js/engine/week.js"];
const {prepareMatch} = __m["js/engine/match.js"];
const {welcomeMails} = __m["js/engine/advice.js"];
const {birthdayWeek} = __m["js/engine/birthday.js"];
const {initRelations} = __m["js/engine/relations.js"];
const {showMatch} = __m["js/ui/match.js"];
const {ACTION_MAP} = __m["data/actions.js"];
const {renderCreate} = __m["js/ui/create.js"];
const {renderIntro} = __m["js/ui/intro.js"];
const {homeView, playerView, teamView, scheduleView, inboxView} = __m["js/ui/views.js"];
const {ask, eventModal, actionPicker, weekReport, mailModal, saveModal, numberModal, yearModal} = __m["js/ui/modals.js"];
const {esc} = __m["js/ui/util.js"];
const {admissionModal, nationalModal, showEnding, galleryModal} = __m["js/ui/career.js"];
const {setScene, enter, preload, SCENES} = __m["js/ui/fx.js"];
const {sfx} = __m["js/ui/sfx.js"];
const {bgm} = __m["js/ui/bgm.js"];
// 진입점: 화면 전환, 저장, 한 주 진행




















// 메뉴 아이콘 (선으로 그린 SVG)
const ICONS = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  player: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/>',
  team: '<circle cx="8.5" cy="8.5" r="3.2"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M2.5 20c.8-3.8 3.4-6 6-6s5.2 2.2 6 6M14.5 14.3c3 0 5.6 1.9 6.5 5.7"/>',
  schedule: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  inbox: '<path d="M4 5h16v11H9l-5 4z"/>',
};
const soundIcon = on => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${on ? '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5"/>'}</svg>`;
const musicIcon = on => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>${on ? "" : '<path d="M3 3l18 18"/>'}</svg>`;
const icon = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const NAV = [["home", "홈"], ["player", "선수"], ["team", "팀"], ["schedule", "일정"], ["inbox", "메시지"]];

const app = {
  root: document.getElementById("app"),
  state: null,
  view: "title",
  sub: { ptab: "stats", sgrade: null, ttab: "rel" },
  draft: null,
  settings: loadSettings(),

  go(view) { this.view = view; this._enter = true; this.render(); this._enter = false; window.scrollTo(0, 0); },
  toTitle() { this.state = null; this.go("title"); },

  startGame(player) {
    this.state = newGame(player);
    welcomeMails(this.state);
    birthdayWeek(this.state, turnInfo(this.state));      // 입단 첫 주가 생일 주간인 경우
    this.saveTo("auto");
    this.go("home");
    this.toast(`${player.name}, 등번호 ${this.state.player.number}번으로 입단했습니다`);
  },
  load(state) {
    if (!state.relations.people) initRelations(state);     // 이전 저장 파일 보정
    this.state = state;
    this.sub = { ptab: "stats", sgrade: null, ttab: "rel" };
    this.go("home");
    this.toast("불러왔습니다");
    if (state.finished) { showEnding(this); return; }
    if (state.pending) this.pendingFlow(() => this.render());
    else if (state.pendingEvent) eventModal(this, () => this.render());
  },
  summary() { return summaryOf(this.state, turnInfo(this.state)); },
  saveTo(where) { return saveTo(where, this.state, this.summary()); },

  toggleMusic() {
    this.settings.music = !this.settings.music; saveSettings(this.settings);
    bgm.set(this.settings.music);
    this.toast(this.settings.music ? "배경음악을 켰습니다" : "배경음악을 껐습니다");
    document.querySelectorAll("[data-music]").forEach(b => { b.innerHTML = musicIcon(this.settings.music); b.setAttribute("aria-pressed", this.settings.music); });
  },

  toggleSound() {
    this.settings.sound = !this.settings.sound; saveSettings(this.settings);
    sfx.set(this.settings.sound);
    if (this.settings.sound) sfx.play("good");
    this.toast(this.settings.sound ? "효과음을 켰습니다" : "효과음을 껐습니다");
    document.querySelectorAll("[data-sound]").forEach(b => { b.innerHTML = soundIcon(this.settings.sound); b.setAttribute("aria-pressed", this.settings.sound); });
  },

  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(this._t); this._t = setTimeout(() => t.classList.remove("show"), 2600);
  },

  render() {
    if (["title", "intro", "create"].includes(this.view)) setScene(null);
    if (this.view !== "match" && this.view !== "ending") bgm.play("home");
    if (this.view === "title") return renderTitle(this);
    if (this.view === "intro") return renderIntro(this, () => this.go("create"));
    if (this.view === "create") return renderCreate(this);
    if (this.view === "match" || this.view === "ending") return;   // 경기·엔딩 화면이 직접 그립니다
    renderShell(this);
  },

  advance() {
    const s = this.state;
    if (s.pending) { this.pendingFlow(() => this.render()); return; }
    if (!planReady(s)) { this.toast("이번 주 빈 칸을 먼저 채워 주세요"); return; }
    s.lastPlan = { ...s.plan };
    this.runMinigames().then(() => this.startWeek());
  },

  // 등번호 선택, 진학 상담, 대표 발표처럼 꼭 거쳐야 하는 창
  pendingFlow(done) {
    const t = this.state.pending?.type;
    if (t === "number") numberModal(this, done);
    else if (t === "admission") admissionModal(this, done);
    else if (t === "national") nationalModal(this, done);
    else done();
  },

  // 미니게임이 있는 훈련을 차례로 진행하고 칸별 배율을 남김
  async runMinigames() {
    const s = this.state;
    s.planMult = null;
    if (!this.settings.minigame) return;
    const mult = {};
    for (const slot of SLOTS) {
      if (slotLocked(s, slot.id)) continue;
      const a = ACTION_MAP[s.plan[slot.id]];
      if (!a?.minigame || !actionAllowed(s, a).ok) continue;
      const r = await playMinigame(a.minigame, getPath(s.player.stats, statFor(a.minigame)), `${slot.label}, ${a.label}`);
      mult[slot.id] = r.mult;
    }
    s.planMult = Object.keys(mult).length ? mult : null;
  },

  startWeek() {
    const s = this.state;
    const ctx = beginWeek(s);
    if (ctx.fx) {
      const m = prepareMatch(s, ctx.info, ctx.fx);
      this.view = "match";
      window.scrollTo(0, 0);
      showMatch(this, m, result => { this.view = "home"; this.finishWeek(ctx, result); });
    } else this.finishWeek(ctx, null);
  },

  finishWeek(ctx, result) {
    const s = this.state;
    const rep = endWeek(s, ctx, result);
    this.saveTo("auto");
    this.render();
    window.scrollTo(0, 0);
    weekReport(this, rep, () => {
      const chain = [];
      if (rep.yearEnd) chain.push(next => yearModal(this, rep.yearEnd, next));
      if (s.pending) chain.push(next => this.pendingFlow(next));
      if (s.pendingEvent) chain.push(next => eventModal(this, next));
      if (rep.graduation) chain.push(() => showEnding(this));
      const run = () => { const f = chain.shift(); if (f) f(() => { this.saveTo("auto"); this.render(); run(); }); };
      this.render();
      run();
    });
  },

  repeatPlan() {
    const s = this.state;
    for (const slot of SLOTS) {
      if (slotLocked(s, slot.id)) continue;
      const id = s.lastPlan?.[slot.id];
      if (id && actionAllowed(s, ACTION_MAP[id]).ok) s.plan[slot.id] = id;
    }
    this.render();
  },
};

function renderTitle(app) {
  const auto = readSlot("auto");
  const cont = auto && !auto.state.finished;
  app.root.innerHTML = `<main class="fc-title" id="ft">
    <div class="ft-bg"><img src="assets/img/title.webp" data-name="title" alt="" onerror="__bgFallback(this)"><span class="ft-streak s1"></span><span class="ft-streak s2"></span><span class="ft-streak s3"></span></div>
    <div class="ft-brand">
      <img class="ft-logo" src="assets/img/logo.png" alt="고흥FC 엠블럼">
      <div class="ft-words"><span class="ft-kicker">GOHEUNG FC U-15</span><h1 class="ft-name">DREAM<br>PROJECT</h1><p class="ft-ko">고흥FC 드림 프로젝트</p></div>
    </div>
    <button class="ft-press" id="press">화면을 눌러 시작</button>
    <nav class="ft-menu" id="menu" hidden>
      ${cont ? `<button class="ft-tile main" data-continue><span class="ft-t">이어하기</span><span class="ft-s">${esc(auto.summary)}</span></button>` : ""}
      <button class="ft-tile ${cont ? "" : "main"}" data-new><span class="ft-t">새 커리어</span><span class="ft-s">중학교 1학년, 입단 첫날부터</span></button>
      <button class="ft-tile" data-loadmenu><span class="ft-t">불러오기</span><span class="ft-s">저장 슬롯, 저장 코드</span></button>
      <button class="ft-tile" data-gallery><span class="ft-t">엔딩 도감</span><span class="ft-s">지금까지 본 엔딩</span></button>
    </nav>
    <p class="ft-foot">made by 류봉두</p>
    <button class="snd-btn ft-snd" data-sound aria-label="효과음" aria-pressed="${app.settings.sound}">${soundIcon(app.settings.sound)}</button>
    <button class="snd-btn ft-mus" data-music aria-label="배경음악" aria-pressed="${!!app.settings.music}">${musicIcon(app.settings.music)}</button>
  </main>`;
  const r = app.root;
  const open = () => { r.querySelector("#press").hidden = true; const m = r.querySelector("#menu"); m.hidden = false; m.querySelector("button").focus({ preventScroll: true }); document.removeEventListener("keydown", key); };
  const key = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  document.addEventListener("keydown", key);
  r.querySelector("#press").addEventListener("click", open);
  r.querySelector("#ft").addEventListener("click", e => { if (!e.target.closest("button")) open(); });
  r.querySelector("[data-continue]")?.addEventListener("click", () => app.load(auto.state));
  r.querySelector("[data-new]").addEventListener("click", async () => {
    if (cont && !(await ask("새로 시작하면 자동 저장이 덮어씌워집니다.\n슬롯에 저장해 둔 게임은 그대로 남습니다.", "새로 시작"))) return;
    app.draft = null; app.go("intro");
  });
  r.querySelector("[data-loadmenu]").addEventListener("click", () => saveModal(app, { loadOnly: true }));
  r.querySelector("[data-gallery]").addEventListener("click", () => galleryModal());
  r.querySelector("[data-sound]").addEventListener("click", e => { e.stopPropagation(); app.toggleSound(); });
  r.querySelector("[data-music]").addEventListener("click", e => { e.stopPropagation(); app.toggleMusic(); });
}

function renderShell(app) {
  const s = app.state;
  const info = turnInfo(s);
  const unread = s.inbox.filter(m => !m.read).length;
  let main = "";
  if (app.view === "home") main = homeView(s, { minigame: app.settings.minigame });
  if (app.view === "player") main = playerView(s, app.sub.ptab);
  if (app.view === "team") main = teamView(s, app.sub.ttab);
  if (app.view === "schedule") main = scheduleView(s, app.sub.sgrade || s.calendar.grade);
  if (app.view === "inbox") main = inboxView(s);

  setScene("bg_home", app.view === "home" ? "home" : "dim");
  const when = info ? label(info) : "졸업";
  const flip = app._when && app._when !== when;
  app._when = when;
  app.root.innerHTML = `<div class="shell">
    <header class="topbar">
      <img class="tb-logo" src="assets/img/logo.png" alt="">
      <div class="tb-when ${flip ? "flip" : ""}"><div class="when">${when}</div><div class="phase">${info ? info.phaseLabel : ""}</div></div>
      <nav class="tabs-top" aria-label="메뉴">${NAV.map(([k, l]) => `<button data-nav="${k}" ${app.view === k ? `aria-current="page"` : ""}>${l}${k === "inbox" && unread ? `<span class="badge num">${unread}</span>` : ""}</button>`).join("")}</nav>
      <span class="spacer"></span>
      <button class="snd-btn" data-music aria-label="배경음악" aria-pressed="${!!app.settings.music}">${musicIcon(app.settings.music)}</button>
      <button class="snd-btn" data-sound aria-label="효과음" aria-pressed="${app.settings.sound}">${soundIcon(app.settings.sound)}</button>
      <button class="btn btn-sm btn-ghost" data-savemenu>저장</button>
    </header>
    <nav class="nav" aria-label="메뉴">${NAV.map(([k, l]) =>
      `<button data-nav="${k}" ${app.view === k ? `aria-current="page"` : ""}>${icon(k)}<span>${l}</span>${k === "inbox" && unread ? `<span class="dot" aria-label="안 읽은 메시지 ${unread}개"></span>` : ""}</button>`).join("")}</nav>
    <main class="main">${main}</main>
  </div>`;

  const r = app.root;
  if (app._enter) enter(r.querySelector(".main"));
  if (!app._pre) { app._pre = true; preload(SCENES); }
  r.querySelector("[data-sound]").addEventListener("click", () => app.toggleSound());
  r.querySelector("[data-music]").addEventListener("click", () => app.toggleMusic());
  r.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => app.go(b.dataset.nav)));
  r.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => app.go(b.dataset.go)));
  r.querySelector("[data-savemenu]").addEventListener("click", () => saveModal(app));
  r.querySelectorAll("[data-slot]").forEach(b => b.addEventListener("click", () => actionPicker(app, b.dataset.slot)));
  r.querySelector("[data-advance]")?.addEventListener("click", () => app.advance());
  r.querySelector("[data-repeat]")?.addEventListener("click", () => app.repeatPlan());
  r.querySelector("[data-mgtoggle]")?.addEventListener("click", () => {
    app.settings.minigame = !app.settings.minigame; saveSettings(app.settings);
    app.toast(app.settings.minigame ? "훈련할 때 미니게임을 합니다" : "미니게임 없이 B등급으로 진행합니다"); app.render();
  });
  r.querySelectorAll("[data-ptab]").forEach(b => b.addEventListener("click", () => { app.sub.ptab = b.dataset.ptab; app.render(); }));
  r.querySelectorAll("[data-ttab]").forEach(b => b.addEventListener("click", () => { app.sub.ttab = b.dataset.ttab; app.render(); }));
  r.querySelectorAll("[data-sgrade]").forEach(b => b.addEventListener("click", () => { app.sub.sgrade = +b.dataset.sgrade; app.render(); }));
  r.querySelector("[data-readall]")?.addEventListener("click", () => { s.inbox.forEach(m => m.read = true); app.render(); });
  r.querySelectorAll("[data-mail]").forEach(b => b.addEventListener("click", () => {
    const m = s.inbox.find(x => x.id === b.dataset.mail);
    if (!m) return;
    m.read = true; mailModal(m, { list: s.inbox, onRead: () => app.render() }); app.render();
  }));
  if (app.view === "schedule") r.querySelector(".week.now")?.scrollIntoView({ block: "center" });
}

// ── 전체 화면 버튼 (모든 화면 오른쪽 위) ──
(function fullscreenButton() {
  const d = document, el = d.documentElement;
  const can = !!(el.requestFullscreen || el.webkitRequestFullscreen);
  const isFs = () => !!(d.fullscreenElement || d.webkitFullscreenElement);
  const standalone = matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches || navigator.standalone;
  if (standalone) return;                                       // 홈 화면 앱으로 열었으면 이미 전체 화면
  const b = d.createElement("button");
  b.className = "fs-btn"; b.type = "button"; b.setAttribute("aria-label", "전체 화면");
  const ICON_ON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`;
  const ICON_OFF = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>`;
  const paint = () => { b.innerHTML = isFs() ? ICON_OFF : ICON_ON; b.title = isFs() ? "전체 화면 끄기" : "전체 화면"; };
  paint();
  b.addEventListener("click", async () => {
    try {
      if (isFs()) await (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else if (can) await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: "hide" });
      else app.toast("아이폰은 사파리 공유 버튼 → '홈 화면에 추가'로 열면 전체 화면이 됩니다");
    } catch { app.toast("이 브라우저에서는 전체 화면을 쓸 수 없습니다"); }
  });
  d.addEventListener("fullscreenchange", paint); d.addEventListener("webkitfullscreenchange", paint);
  d.body.appendChild(b);
})();

sfx.set(app.settings.sound);
bgm.set(app.settings.music);
app.render();
window.gfc = app; // 개발 확인용

return {  };
})();
(__fix["js/main.js"] || []).forEach(f => f());
})();
