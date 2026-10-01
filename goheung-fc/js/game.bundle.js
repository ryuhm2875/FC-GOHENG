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

  glassBody:   { label: "유리몸",   good: false, desc: "부상 위험이 크게 높습니다." },
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
  ironLungs: { label: "강철 체력",   good: true, earned: true, how: "합숙 훈련 2번 + 지구력 65 이상",
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

  // 동기
  { name: "윤지남", cohort: "동기", position: "MF", number: 33, ovr: 42, style: "테크닉", face: "mate_01" }, // 강자
  { name: "정자원", cohort: "동기", position: "MF", number: 44, ovr: 34, style: "패서",   face: "mate_04" },
  { name: "손은창", cohort: "동기", position: "MF", number: 31, ovr: 36, style: "패서",   face: "mate_01" }, // 중3 때 주장 후보
  { name: "진권우", cohort: "동기", position: "DF", number: 40, ovr: 34, style: "파이터", face: "mate_05" },
  { name: "김연호", cohort: "동기", position: "FW", number: 36, ovr: 41, style: "스피드", face: "mate_02" }, // 강자

  // 1년 후배 (주인공이 중2 될 때 입학)
  { name: "고주희", cohort: "1년후배", position: "DF", number: 39, ovr: 36, style: "철벽",   face: "mate_01" },
  { name: "이경만", cohort: "1년후배", position: "DF", number: 47, ovr: 35, style: "파이터", face: "mate_02" },
  { name: "이창현", cohort: "1년후배", position: "MF", number: 55, ovr: 34, style: "패서",   face: "mate_05" },

  // 2년 후배 (주인공이 중3 될 때 입학)
  { name: "임종잔", cohort: "2년후배", position: "FW", number: 42, ovr: 43, style: "골잡이", face: "mate_02" }, // 강자
  { name: "강금총", cohort: "2년후배", position: "FW", number: 61, ovr: 36, style: "스피드", face: "mate_04" },
  { name: "조연태", cohort: "2년후배", position: "DF", number: 58, ovr: 35, style: "철벽",   face: "mate_08" },
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
  { month: 11, weeks: 3, phase: "autumn"  },
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
// hsChance: 연습경기가 고등학교 팀과의 진학 연습경기로 바뀔 확률 (학년별)
const MATCHES = [
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

const COMPS = {
  league:   { label: "주말리그",     official: true,  tournament: false },
  summer:   { label: "하계대회",     official: true,  tournament: true, name: "전국 중등 하계 축구대회", bonus: 3 },
  winter:   { label: "동계대회",     official: true,  tournament: true, name: "전국 중등 동계 축구대회", bonus: 4 },
  friendly: { label: "연습경기",     official: false, tournament: false },
  hs:       { label: "진학 연습경기", official: false, tournament: false },
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
// 게임을 시작할 때 data/roster.js 명단에서 자동으로 정해집니다.





const REL_ROLES = {
  friend: { label: "단짝 친구", icon: "🤝", desc: "사기가 떨어질 때 붙잡아 줍니다. 관계가 70을 넘으면 사기가 35 밑으로 잘 안 내려갑니다." },
  rival:  { label: "라이벌",   icon: "🔥", desc: "같은 자리를 노리는 동기. 능력치 차이가 5 이내면 서로 자극이 되어 훈련 효율이 5% 오릅니다." },
  mentor: { label: "멘토 선배", icon: "🧭", desc: "관계가 70을 넘으면 매주 집중력·팀워크가 조금씩 오르고, 감독님 신뢰도 따라 오릅니다." },
  junior: { label: "챙기는 후배", icon: "🌱", desc: "중2부터 생깁니다. 관계가 높으면 팀워크가 오르고, 중3 주장 선거에 유리합니다." },
};

const pool = (state, cohort) => state.team.roster.filter(m => m.cohort === cohort);
const pack = (m, value) => m ? { id: m.id, name: m.name, face: m.face, position: m.position, cohort: m.cohort, value } : null;

function initRelations(state) {
  const p = state.player;
  const mates = pool(state, "동기");
  const same = mates.filter(m => m.position === p.position);
  const rival = (same.length ? same : mates).slice().sort((a, b) => b.ovrNow - a.ovrNow)[0];
  const friendPool = mates.filter(m => m.id !== rival?.id);
  const friend = friendPool.length ? pick(friendPool) : null;
  const seniors = [...pool(state, "2학년선배"), ...pool(state, "3학년선배")];
  const mentor = seniors.find(m => m.position === p.position && m.cohort === "2학년선배") || seniors.find(m => m.position === p.position) || seniors[0];
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

// 학년이 바뀔 때: 선배 졸업, 후배 생김
function relationsNewYear(state) {
  const g = state.calendar.grade;
  const P = state.relations.people;
  if (!P) return;
  const p = state.player;
  if (P.mentor && mateGrade(P.mentor, g) > 3) {
    const old = P.mentor.name;
    const next = state.team.roster.filter(m => { const mg = mateGrade(m, g); return mg > g && mg <= 3; })
      .sort((a, b) => (b.position === p.position) - (a.position === p.position))[0];
    P.mentor = pack(next, 30);
    mailFrom(state, old, "friend", "졸업하면서 한마디",
      `${p.name}, 형 이제 고등학생이다. 같이 훈련한 거 재밌었다.\n\n${next ? `이제 ${next.name}한테 많이 물어봐. 걔도 좋은 형이다.` : "이제 네가 선배다. 후배들 잘 챙겨라."}\n\n고등학교 가서 경기 있으면 보러 와라.`);
  }
  if (!P.junior && g >= 2) {
    const juniors = state.team.roster.filter(m => mateGrade(m, g) === 1 && m.cohort !== "동기");
    const j = juniors.find(m => m.position === p.position) || juniors[0];
    if (j) {
      P.junior = pack(j, 40);
      mail(state, "assist", "후배 하나 맡아라",
        `이번에 들어온 ${j.name}, 너랑 같은 ${j.position === p.position ? "포지션" : "반 근처"}다. 훈련 끝나고 이것저것 알려 줘라.\n\n후배를 챙기면 팀워크가 늘고, 감독님도 다 보고 계신다.`);
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

return { REL_ROLES, initRelations, person, nameOf, adjustRel, weeklyRelations, rivalGap, relationsNewYear, captainScore };
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

  const good = Object.keys(TRAITS).filter(k => TRAITS[k].good);
  const bad = Object.keys(TRAITS).filter(k => !TRAITS[k].good);
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
    desc: "1대1 수비, 위치 잡기",
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
  { id: "rivalDuel", cat: "personal", label: "라이벌과 1대1", icon: "🔥", needs: "rival",
    desc: "{rival|과/와} 남아서 1대1. 지기 싫어서 더 뛰게 된다",
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

// 전남 권역 주말리그 상대 7팀 (우리 팀까지 8팀이 한 번씩 맞붙습니다)
// strength: 팀 평균 능력치 보정. 0이 보통, +면 강팀
const LEAGUE_OPPONENTS = [
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
const HIGH_SCHOOLS = [
  { id: "hs_namhae",  name: "남해안FC U-18", tier: "proYouth",   strength: 70, coach: "최동혁 감독" },
  { id: "hs_hannuri", name: "서울 한누리고",  tier: "national",   strength: 67, coach: "정우석 감독" },
  { id: "hs_saesol",  name: "경기 새솔고",    tier: "national",   strength: 66, coach: "김태환 감독" },
  { id: "hs_mudeung", name: "광주 무등빛고",  tier: "regional",   strength: 63, coach: "오상민 감독" },
  { id: "hs_neul",    name: "순천 늘푸른고",  tier: "regional",   strength: 62, coach: "배진호 감독" },
  { id: "hs_chabat",  name: "보성 차밭고",    tier: "footballHS", strength: 58, coach: "윤기철 감독" },
];

const HS_TIERS = {
  proYouth:   { label: "프로 산하 유스", order: 4 },
  national:   { label: "전국 강호",     order: 3 },
  regional:   { label: "지역 강호",     order: 2 },
  footballHS: { label: "축구부 일반고",  order: 1 },
};

// 전국 대회 상대
const NATIONAL_OPPONENTS = [
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

return { LEAGUE_OPPONENTS, HIGH_SCHOOLS, HS_TIERS, NATIONAL_OPPONENTS, SURNAMES, GIVEN_NAMES };
})();
(__fix["data/world.js"] || []).forEach(f => f());

// ── js/engine/season.js
__m["js/engine/season.js"] = (function () {
const {LEAGUE_OPPONENTS, NATIONAL_OPPONENTS, HIGH_SCHOOLS, HS_TIERS} = __m["data/world.js"];
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

// 원형 방식 리그 대진: 8팀이 7라운드 동안 한 번씩 만남
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
    if (state.league?.key !== key) {
      const teams = [{ id: US, name: TEAM_NAME, strength: null },
        ...LEAGUE_OPPONENTS.map((o, i) => ({ id: `L${i}`, name: o.name, strength: 51 + o.strength + normal(0, 1.2) }))];
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
      const opps = shuffle(NATIONAL_OPPONENTS).map((o, i) => ({ id: `N${i}`, name: o.name, strength: 47 + o.strength + comp.bonus + normal(0, 1.2) }));
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
      const o = t.pool.length ? t.pool.shift() : { id: "Nx", name: pick(NATIONAL_OPPONENTS).name, strength: 54 };
      opp = state.rolls[key] = { ...o, strength: o.strength + (KO_BONUS[m.round] || 0) };
    }
    return { ...base, opponent: opp };
  }

  // 연습경기 / 진학 연습경기
  let isHs = m.comp === "hs";
  if (m.comp === "friendly" && m.hsChance) {
    const key = `hs-${info.turn}`;
    if (state.rolls[key] === undefined) state.rolls[key] = chance(m.hsChance[info.grade] || 0);
    isHs = state.rolls[key];
  }
  if (isHs) {
    const key = `school-${info.turn}`;
    if (!state.rolls[key]) state.rolls[key] = pickSchool(state).id;
    const school = HIGH_SCHOOLS.find(s => s.id === state.rolls[key]);
    return { ...base, comp: "hs", compLabel: COMPS.hs.label, official: false, school,
      opponent: { id: school.id, name: `${school.name} 1학년`, strength: school.strength } };
  }
  const key = `fr-${info.turn}`;
  if (!state.rolls[key]) {
    const o = pick(LEAGUE_OPPONENTS);
    state.rolls[key] = { id: "F", name: o.name, strength: 50 + o.strength };
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
function applyResult(state, fx, gf, ga, { shootoutWin = null, rating = null } = {}) {
  const notes = [];
  if (fx.comp === "league") {
    const lg = state.league;
    for (const [a, b] of lg.rounds[fx.leagueRound]) {
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
    if (lg.played >= lg.rounds.length) {
      lg.finished = true;
      const rank = sortTable(lg.table).findIndex(r => r.id === US) + 1;
      lg.finalRank = rank;
      state.record.leagues.push({ grade: lg.grade, half: lg.half, rank });
      if (rank === 1) state.record.titles.push({ grade: lg.grade, name: `${lg.half} 주말리그 우승` });
      notes.push(rank === 1 ? `${lg.half} 주말리그 우승! 8팀 중 1위로 마쳤다 🏆` : `${lg.half} 주말리그가 끝났다. 최종 ${rank}위.`);
    }
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
        t.alive = false; t.best = fx.round;
        notes.push(`${fx.round}에서 탈락. 최종 성적 ${fx.round}.`);
        finishTour(state);
      } else if (fx.round === "결승") {
        t.alive = false; t.best = "우승"; t.champion = true;
        state.record.titles.push({ grade: t.grade, name: `${t.label} 우승`, national: true });
        state.flags.nationalChampion = true;
        notes.push(`${t.name} 우승! 🏆`);
        finishTour(state);
      } else {
        t.best = { "16강": "8강", "8강": "4강", "4강": "결승" }[fx.round];
        notes.push(`${fx.round} 통과! 다음은 ${t.best}.`);
      }
    }
  }

  if (fx.comp === "hs") notes.push(...scoutAfter(state, fx, rating));
  return notes;
}

function finishTour(state) {
  const t = state.tour;
  state.record.tournaments.push({ grade: t.grade, comp: t.comp, name: t.label, best: t.best });
}

// ── 진학 연습경기 후 스카우트 관심도 ─
function scoutAfter(state, fx, rating) {
  const s = fx.school;
  const sc = state.scouting[s.id] ||= { interest: 10, seen: 0, offered: false };
  sc.seen++;
  if (rating == null) {
    sc.interest = Math.max(0, sc.interest - 5);
    return [`${s.name} 감독님 앞에서 뛰지 못했다.`];
  }
  const gain = (rating - 6.3) * 20;
  sc.interest = Math.max(0, Math.min(100, sc.interest + gain));
  const notes = [];
  if (rating >= 8.2 && !sc.offered) {
    sc.offered = true;
    notes.push({ from: s.coach, title: `${s.name}에서 연락이 왔습니다`,
      body: `오늘 경기 잘 봤다. 중학생이 고등학생 상대로 그렇게 뛰는 건 쉽지 않다.\n\n우리 학교에 올 생각이 있다면 문은 열려 있다. 감독님께도 따로 말씀드려 두마.` });
  } else if (rating >= 7.5) {
    notes.push({ from: s.coach, title: `${s.name} 감독님의 한마디`,
      body: `몸 싸움에서 밀리지 않더구나. 앞으로도 관심 있게 지켜보겠다.` });
  } else if (rating < 5.8) {
    notes.push(`${s.name} 감독님은 아무 말 없이 돌아가셨다.`);
  }
  return notes;
}

function tierLabel(tier) { return HS_TIERS[tier].label; }

return { US, TEAM_NAME, simScore, sortTable, ensureSeason, matchFor, applyResult, scoutAfter, tierLabel };
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
};

const SITUATIONS = [
  // ── 공격수 ─────────────────────────
  { id: "fw_1v1", pos: ["FW"], zone: "att", weight: 3,
    text: ["페널티 박스 앞, 수비수 한 명과 1대1로 마주 섰다.", "측면에서 공을 받았다. 앞에는 수비수 한 명뿐이다."],
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
        winText: ["40미터 대각선 패스! {mate|이/가} 받아 들어간다."], loseText: ["터치라인 밖으로 나갔다."] },
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
        winText: ["미끄러지듯 들어간 태클, 공만 정확히 뺐다!"], loseText: ["태클이 늦었다! {opp|이/가} 빠져나간다."] },
      { label: "거리를 두고 막기", stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: -3, win: "win", lose: "turnover",
        winText: ["끝까지 따라붙어 슈팅 각도를 지웠다."], loseText: ["크로스를 허용했다."] },
    ] },
  { id: "df_cross", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 3,
    text: ["상대 측면에서 크로스가 올라온다.", "코너킥. 상대 장신 선수가 들어온다."],
    choices: [
      { label: "헤더로 걷어낸다", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 2, win: "win", lose: "danger", physical: true,
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
    text: ["우리 팀 코너킥. 감독님이 올라가라고 손짓한다."],
    choices: [
      { label: "공격 가담 헤더", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 8, win: "head", lose: "miss", physical: true,
        winText: ["상대 수비 머리 위로 솟구쳤다!"], loseText: ["헤더가 골대 위로 넘어갔다."] },
      { label: "뒤에 남는다", stats: { "mental.focus": 1 }, diff: -12, win: "keep", lose: "keep",
        winText: ["역습에 대비해 자리를 지켰다."], loseText: ["역습에 대비해 자리를 지켰다."] },
    ] },

  // ── 공통 ───────────────────────────
  { id: "freekick", intro: false, pos: ["FW", "MF"], zone: "att", weight: 1,
    text: ["박스 바로 앞에서 프리킥을 얻었다. 공 앞에 섰다."],
    choices: [
      { label: "직접 찬다", stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 14, win: "shot", lose: "miss",
        winText: ["공이 벽을 넘어 휘어 들어간다!"], loseText: ["벽에 맞았다."] },
      { label: "동료에게 맡긴다", stats: { "mental.teamwork": 1 }, diff: -15, win: "keep", lose: "keep",
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
    text: ["역습! 공을 몰고 달린다. 옆에서 {mate}도 같이 뛴다. 막는 수비는 한 명뿐.", "2대1이다. 수비수 한 명이 뒷걸음질 친다. 오른쪽에 {mate|이/가} 있다."],
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
    text: ["시간이 얼마 없다. 한 골이 필요하다. 박스 앞에서 공이 나에게 왔다.", "벤치에서 다들 일어섰다. 마지막 기회일지도 모른다."],
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
    text: ["코너킥. 감독님이 나를 키커로 지목했다."],
    choices: [
      { label: "니어 포스트로 빠르게", stats: { "tech.cross": 0.8, "mental.focus": 0.2 }, diff: 4, win: "keyPass", lose: "miss",
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
        winText: ["달려들어 공을 빼앗았다! 바로 앞으로 찔러 준다!"], loseText: ["{opp|이/가} 나를 등지고 돌아서 빠져나갔다!"] },
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
];

// 팀 단위 해설
const LINES = {
  kickoff: ["주심의 휘슬. 경기가 시작됐다.", "킥오프! {us|이/가} 먼저 공을 잡았다.", "양 팀 선수들이 손을 맞잡고 흩어진다. 킥오프."],
  ourChance: ["{mate|이/가} 측면을 파고든다.", "{mate}의 침투 패스!", "{mate|이/가} 박스 안으로 뛰어든다.", "코너킥. {mate|이/가} 머리를 갖다 댄다."],
  ourGoal: ["{mate}의 슈팅이 골망을 흔든다! 골!", "{mate|이/가} 밀어 넣었다! 골!", "흘러나온 공을 {mate|이/가} 마무리! 골!"],
  ourMiss: ["{mate}의 슈팅, 골키퍼 선방.", "{mate}의 슈팅이 골대를 살짝 벗어난다.", "골대를 맞고 나왔다!"],
  theirChance: ["{opp|이/가} 역습에 나선다.", "{opp}의 날카로운 크로스.", "{opp|이/가} 박스 앞에서 공을 잡는다.", "상대 프리킥. {opp|이/가} 찬다."],
  theirGoal: ["{opp}의 슈팅이 골망을 가른다. 실점.", "{opp|이/가} 마무리했다. 실점.", "혼전 끝에 {opp}에게 골을 내줬다."],
  theirMiss: ["{opp}의 슈팅, 우리 골키퍼가 잡아 낸다.", "{opp}의 슈팅이 크로스바를 넘어간다.", "{mate|이/가} 몸을 던져 막아 냈다!"],
  myShotGoal: ["골키퍼를 보고 침착하게 차 넣었다. 골!", "구석으로 꽂았다. 골!!"],
  myShotSaved: ["회심의 슈팅! 골키퍼가 손끝으로 쳐 냈다.", "슈팅이 골키퍼 정면으로 갔다."],
  myShotWide: ["아! 골대를 살짝 빗나간다.", "골포스트를 맞고 나왔다!"],
  myHeadGoal: ["헤더가 골문 구석으로! 골!"],
  myChipGoal: ["골! 골키퍼는 손을 뻗어 보지도 못했다!", "들어갔다! 관중석이 들썩인다!"],
  myChipMiss: ["골키퍼가 겨우 손끝으로 쳐 냈다!", "골대를 맞고 나왔다! 거의 들어갈 뻔했다."],
  myHeadMiss: ["헤더가 골키퍼 품으로 간다.", "헤더가 크로스바 위로 넘어간다."],
  assistGoal: ["{mate|이/가} 그대로 밀어 넣는다! 도움 기록!", "{mate}의 마무리! 내 패스가 골이 됐다!"],
  assistMiss: ["{mate}의 슈팅이 아쉽게 빗나간다.", "{mate}의 슈팅, 골키퍼 선방."],
  dangerGoal: ["결국 {opp}에게 골을 내줬다. 고개를 숙였다.", "그대로 실점으로 이어졌다."],
  dangerSave: ["골키퍼가 막아 냈다. 가슴을 쓸어내린다.", "{mate|이/가} 뒤에서 걷어 냈다. 살았다."],
  turnoverGoal: ["뺏긴 공이 역습으로 이어졌다. 실점.", "공을 잃은 지 10초 만에 실점했다."],
  leakGoal: ["결국 상대가 슈팅까지 연결했다. 실점.", "한 번 열린 틈을 상대가 놓치지 않았다. 실점."],
  tapGoal: ["골! 빈 골문으로 밀어 넣었다!", "골라인 앞에서 툭. 골!"],
  pkGoal: ["골키퍼는 반대로 몸을 날렸다. 골!", "그물이 출렁인다. 페널티킥 성공!"],
  matePkGoal: ["{mate|이/가} 침착하게 차 넣었다. 골!"],
  matePkMiss: ["{mate}의 페널티킥, 골키퍼에게 막혔다!"],
  fkGoal: ["{mate}의 프리킥이 벽을 넘어 그대로 꽂힌다! 골!"],
  fkMiss: ["{mate}의 프리킥, 벽에 맞고 나온다.", "{mate}의 프리킥이 골대 위로 넘어간다."],
  pkAgainstGoal: ["{opp|이/가} 침착하게 차 넣는다. 실점.", "골키퍼 {gk|이/가} 방향은 맞혔지만 닿지 않았다. 실점."],
  pkAgainstSave: ["골키퍼 {gk}의 선방! 페널티킥을 막아 냈다!", "{opp}의 페널티킥이 골대를 맞고 나온다! 살았다!"],
  secondHalf: ["후반전 시작.", "후반 휘슬이 울린다. 마지막 35분이다."],
  halftime: ["전반 종료."],
  fulltime: ["경기 종료 휘슬이 울린다."],
  subIn: ["교체 투입. 감독님이 등을 두드린다. \"보여 줘라.\""],
};

// 하프타임 감독님 말
const HALFTIME_TALK = {
  winning: ["좋다. 그런데 방심하는 순간 뒤집힌다. 하던 대로 해.", "잘하고 있다. 수비 라인 내리지 마라.", "한 골 더 넣으면 끝난다. 물러서지 마."],
  drawing: ["아직 아무것도 안 정해졌다. 한 골이면 된다.", "상대도 지쳤다. 더 뛰는 쪽이 이긴다.", "측면이 열린다. 후반엔 더 넓게 벌려라."],
  losing: ["고개 들어. 35분이면 충분히 뒤집는다.", "겁먹지 마라. 우리 축구 하자.", "실점은 잊어. 지금부터 0 대 0이라고 생각해."],
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
    { who: "FW", at: [70, "H"], t: ["{a}에게 길게 연결. 상대 수비 숫자가 부족하다!", "{a|이/가} 수비 뒤로 빠져 들어간다!"] },
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
    { who: "FW", at: [82, "H"], t: ["{a|이/가} 상대 수비를 끝까지 쫓아간다. 빼앗았다!", "전방 압박! {a|이/가} 수비수의 공을 낚아챘다!"] },
    { who: "FW", at: [90, "C"], same: true, t: [] },
  ] },
  { id: "solo", weight: 1, finish: "shot", steps: [
    { who: "FW", at: [62, "C"], t: ["{a|이/가} 공을 잡고 그대로 드리블을 시작한다.", "{a|이/가} 수비 한 명을 제치고 속도를 올린다!"] },
    { who: "FW", at: [84, "H"], same: true, t: ["또 한 명! {a|이/가} 박스 앞까지 왔다!", "{a|이/가} 두 번째 수비까지 벗겨 낸다!"] },
  ] },
  { id: "freekick", weight: 1, finish: "fk", steps: [
    { who: "MF", at: [78, "C"], t: ["박스 앞에서 프리킥. {a|이/가} 공을 내려놓는다.", "좋은 위치에서 프리킥을 얻었다. 키커는 {a}."] },
  ] },
  { id: "penalty", weight: 0.4, finish: "pk", steps: [
    { who: "FW", at: [92, "C"], t: ["{a|이/가} 박스 안에서 넘어졌다! 주심이 페널티 지점을 가리킨다!", "핸드볼! 주심이 휘슬과 함께 페널티 지점을 가리킨다. 키커는 {a}."] },
  ] },
];

// 마무리 문장. {a} 슈팅한 선수, {gk} 골키퍼, {d} 몸을 던진 수비수
const FINISH = {
  shot:   ["{a}의 오른발 슈팅!", "{a|이/가} 수비를 앞에 두고 때린다!", "{a}의 낮게 깔린 슈팅!", "{a}의 왼발 슈팅!",
           "{a|이/가} 반 박자 빠르게 때린다!", "{a}의 감아 차기!", "{a|이/가} 수비 사이로 슈팅 각을 만든다. 슈팅!"],
  header: ["{a}의 헤더!", "{a|이/가} 솟구쳐 머리를 갖다 댄다!", "{a|이/가} 수비 사이에서 머리를 돌린다!"],
  long:   ["{a}의 중거리 슈팅!", "{a|이/가} 먼 거리에서 과감하게 때린다!", "{a|이/가} 30미터 밖에서 그대로 때린다!"],
  fk:     ["{a}의 프리킥! 벽을 넘어간다!", "{a|이/가} 감아 찬다!"],
  pk:     ["{a|이/가} 키커로 나선다. 달려간다…", "{a}의 페널티킥!"],
};
const RESULT = {
  us: {
    goal:  ["골! {a|이/가} 골망을 흔든다!", "들어갔다! {a}의 골!", "골키퍼가 손도 못 댔다. {a}의 골!", "골키퍼 손끝을 스치고 들어간다! {a}의 골!"],
    save:  ["{gk}의 선방에 막혔다.", "{gk|이/가} 몸을 날려 쳐 낸다!", "골키퍼 정면. {gk|이/가} 잡아 낸다.", "{gk|이/가} 다리를 뻗어 막아 낸다."],
    wide:  ["골대를 살짝 벗어난다.", "크로스바를 넘어간다.", "옆 그물을 때린다. 아깝다.", "힘이 너무 들어갔다. 관중석으로."],
    block: ["수비수 몸에 맞고 굴절된다.", "수비가 발을 뻗어 막아 낸다.", "몸을 던진 {d}에게 맞았다."],
    post:  ["골대를 맞고 튀어나온다! 아깝다!", "크로스바를 때렸다!"],
  },
  them: {
    goal:  ["실점. {a}의 슈팅이 그대로 들어갔다.", "{a|이/가} 마무리한다. 실점.", "막을 수 없었다. {a}의 골.", "{gk|이/가} 손을 뻗었지만 닿지 않았다. 실점."],
    save:  ["우리 골키퍼 {gk}의 선방!", "{gk|이/가} 정확하게 잡아 낸다.", "{gk|이/가} 손끝으로 쳐 낸다!", "{gk|이/가} 각을 좁히고 나와 막아 낸다!"],
    wide:  ["골대를 벗어난다. 휴.", "크로스바 위로 날아간다.", "{a}의 슈팅이 골대 옆으로 흘러간다."],
    block: ["{d|이/가} 몸을 던져 막아 낸다!", "{d}의 태클! 슈팅을 막았다."],
    post:  ["골대를 맞혔다! 가슴이 철렁한다."],
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
  { side: "us",   t: "{a|이/가} 상대 선수와 부딪혀 쓰러졌다. 잠시 경기가 멈췄다가, 다시 일어선다." },
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
  att: ["{mate}의 패스가 나에게 온다.", "{mate|이/가} 공을 찔러 준다. 내 차례다.", "{mate|이/가} 고개를 들어 나를 찾는다. 공이 온다."],
  mid: ["{mate|이/가} 나에게 공을 내준다.", "공이 중원으로 흘러나와 내 발 앞에 떨어진다.", "{mate}의 패스를 받으러 내려왔다."],
  def: ["{opp|이/가} 공을 몰고 내 쪽으로 온다.", "상대 공격이 내 쪽 측면으로 몰린다.", "상대가 빠르게 공을 돌리며 우리 진영으로 들어온다."],
};

// ── 특기 선택지 ─────────────────────────────
// 능력치가 requires 이상이면 그 장면에 선택지가 하나 더 생깁니다 (★ 특기).
// 능력치를 키울수록 경기에서 할 수 있는 일이 늘어나는 구조입니다.
const SIGNATURE = {
  fw_1v1: { label: "개인기로 무너뜨린다", requires: { "tech.dribble": 68 }, stats: { "tech.dribble": 0.7, "phys.agility": 0.3 }, diff: -4,
    win: "shot", lose: "turnover", winText: ["헛다리 두 번에 수비수가 주저앉았다! 골키퍼와 1대1!"], loseText: ["너무 많이 보여 줬다. 수비가 공만 걷어 낸다."] },
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
    win: "head", lose: "miss", physical: true, winText: ["수비 셋을 뚫고 솟구쳤다!"], loseText: ["골대 옆으로 비껴 갔다."] },
  freekick: { label: "벽을 넘겨 구석으로 감아 찬다", requires: { "tech.shoot": 74 }, stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 8,
    win: "chip", lose: "miss", winText: ["벽을 넘은 공이 뚝 떨어지며 구석으로 휘어 들어간다…"], loseText: ["아깝게 골대를 스쳤다."] },
};

// 내가 팀 공격에 자동으로 끼는 장면 (능력치가 높을수록 자주)
const ME_IN_PLAY = {
  build: ["{me|이/가} 공을 받아 앞을 본다. 상대가 두 명 붙는다.", "{me}에게 공이 모인다."],
  pass:  ["{me}의 정확한 패스!", "{me|이/가} 원터치로 방향을 바꿔 준다."],
  shot:  ["{me}의 슈팅!", "{me|이/가} 지체 없이 때린다!"],
  head:  ["{me}의 헤더!", "{me|이/가} 수비 머리 위로 솟구친다!"],
  fk:    ["{me|이/가} 프리킥 키커로 나섰다. 숨을 고르고… 찼다!"],
  pk:    ["{me|이/가} 페널티킥 키커로 나선다. 심장이 쿵쾅거린다…"],
  stop:  ["{me|이/가} 태클로 끊어 낸다!", "{me|이/가} 길목을 막고 공을 빼앗는다!", "{me|이/가} 몸을 날려 슈팅을 막아 낸다!"],
  marked: ["상대 감독이 {me|을/를} 가리키며 수비수에게 뭔가 지시한다.", "상대 수비수 둘이 {me} 주변에 붙어 다닌다."],
};

return { OUTCOMES, SITUATIONS, LINES, HALFTIME_TALK, PLAYS, FINISH, RESULT, AMBIENT, TO_ME, SIGNATURE, ME_IN_PLAY };
})();
(__fix["data/match.js"] || []).forEach(f => f());

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
const josa = (w, a, b) => w + pp(w, a, b);         // 낱말 + 조사

// 그 능력치를 가장 많이 올리는 훈련
function drillFor(stat) {
  let best = null, v = 0;
  for (const a of ACTIONS) { const g = a.gains[stat] || 0; if (g > v) { v = g; best = a; } }
  return best;
}


// 상대 팀 성향 (이름으로 늘 같은 성향이 나옴)
const STYLES = [
  { label: "전방 압박이 강한 팀", stat: "tech.firstTouch", tip: "공을 받기 전에 주변을 먼저 봐라. 원터치로 내주는 선택이 안전하다." },
  { label: "롱볼과 높이로 밀어붙이는 팀", stat: "phys.jump", tip: "공중볼 경합이 많을 거다. 세컨드볼 위치를 먼저 잡아라." },
  { label: "빠른 역습을 노리는 팀", stat: "phys.speed", tip: "공을 뺏기는 순간이 제일 위험하다. 무리한 드리블은 아껴라." },
  { label: "공을 오래 돌리는 팀", stat: "phys.stamina", tip: "많이 뛰어야 하는 경기다. 후반에 체력이 갈린다." },
  { label: "몸싸움이 거친 팀", stat: "phys.strength", tip: "부딪힐 때 버티는 쪽이 이긴다. 등지는 플레이를 조심해라." },
];
function styleOf(name) {
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return STYLES[h % STYLES.length];
}

function strengthWord(diff) {
  if (diff > 5) return "전력은 우리보다 확실히 한 수 위다";
  if (diff > 2) return "전력은 우리보다 조금 앞선다";
  if (diff > -2) return "전력은 비슷하다";
  if (diff > -5) return "전력은 해볼 만하다";
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
  lines.push(`${info.month}월 ${info.week}주 ${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}, 상대는 ${fx.opponent.name}.`);

  if (fx.comp === "hs") {
    const s = fx.school;
    const tierWord = { footballHS: "축구부가 탄탄한 학교", regional: "이 지역에서 손꼽히는 학교", national: "전국대회 단골인 학교", proYouth: "프로 구단 유스팀" }[s.tier];
    lines.push(`${josa(s.name, "은", "는")} ${tierWord}다. ${s.coach}께서 직접 보러 오신다는구나.`);
    const small = p.body.height < 170 || p.stats.phys.strength < 55;
    lines.push(small ? "고등학생들은 한 뼘은 더 크고 단단하다. 정면으로 부딪히기보다 한 박자 먼저 움직여라."
      : "몸으로 밀릴 정도는 아니다. 오히려 형들한테 네 몸을 보여 줄 기회다.");
    lines.push("이런 경기 하나가 진로를 바꾸기도 한다. 이기는 것보다, 네가 어떤 선수인지 보여 주고 와라.");
  } else {
    const ourStr = teamStrength(state, true) * 0.6 + 50 * 0.4;
    const diff = fx.opponent.strength - ourStr;
    lines.push(`${style.label}이다. ${diff > 5 ? "솔직히 쉽지 않은 상대다. 버티는 시간이 길 거다." : diff > 2 ? "만만치 않다. 집중력 싸움이 될 거다." : diff > -2 ? "해 볼 만한 상대다. 먼저 실수하는 쪽이 진다." : "우리가 할 것만 하면 된다. 그래도 방심하는 순간 뒤집힌다."}`);
    if (state.league && fx.comp === "league" && state.league.played > 0) {
      const rows = sortTable(state.league.table);
      const them = rows.findIndex(r => r.id === fx.opponent.id);
      const us = rows.findIndex(r => r.id === US);
      lines.push(them < us ? "순위표에서 우리보다 위에 있는 팀이다. 여기서 잡으면 판이 달라진다." : them < 3 ? "요즘 기세가 좋은 팀이다." : "순위는 아래지만, 그런 팀이 제일 독하게 나온다.");
    }
    const lv = levelWord(getPath(p.stats, style.stat));
    const st = STAT_LABEL[style.stat];
    lines.push(`${style.tip} ${lv === "low" ? `네 ${josa(st, "은", "는")} 아직 몸에 덜 붙었으니 무리하지 말고.` : lv === "high" ? `이런 경기에선 네 ${josa(st, "이", "가")} 오히려 무기가 된다.` : `네 ${josa(st, "이", "가")} 얼마나 버텨 주느냐가 관건이다.`}`);
    if (fx.ko) lines.push("토너먼트다. 지면 그대로 짐 싸서 고흥 내려간다.");
  }

  lines.push(d.rank <= d.slots ? "감독님은 이번 주도 네 이름을 먼저 적어 두실 것 같다. 기대에 답해라."
    : d.rank <= d.slots + 2 ? "벤치에서 시작할 수도 있다. 그래도 들어가는 순간은 꼭 온다. 준비하고 있어라."
    : "아직은 앞에 선 형들이 많다. 이번 주 훈련에서 감독님 눈에 띄는 게 먼저다.");
  const c = conditionOf(p);
  if (c.score < 50) lines.push(`그리고 요즘 몸이 많이 무거워 보인다. 이대로면 가진 것의 반도 못 보여 준다.${p.condition.fatigue >= 85 ? " 감독님도 너를 선발로 쓰기 부담스러워하신다." : ""} 주중에 하루는 푹 쉬어라.`);
  else if (c.score >= 85) lines.push("몸 상태는 지금이 제일 좋다. 이럴 때 보여 줘야 한다.");
  if (state.flags.academicLevel >= 3 && fx.tournament) lines.push("그리고… 성적 때문에 대회 명단에 너를 못 넣는다. 감독님도 아쉬워하신다. 책상 앞에서 먼저 이겨라.");

  mail(state, "assist", `[경기 분석] vs ${fx.opponent.name}`, lines.join("\n\n"));
}

// ── 경기 후: 단톡방 결과 + 감독님 피드백 ─
function matchMails(state, m, res, notes) {
  const p = state.player, fx = m.fx;
  const scorers = side => m.goalsLog.filter(g => g.team === side).map(g => `${g.name} ${g.minute}'${g.assist ? ` (도움 ${g.assist})` : ""}`).join(", ");
  const body = [];
  body.push(`${res.result === "승" ? "이겼다! 다들 고생했다 👏" : res.result === "패" ? "졌다. 고개 숙이지 말고 다음 경기 준비하자." : "비겼다. 이길 수 있던 경기라 아쉽다."}`);
  if (res.gf) body.push(`⚽ 득점: ${scorers("us")}`);
  if (res.ga) body.push(`실점: ${scorers("them")}`);
  body.push(`점유율 ${m.stats.poss}%, 슈팅 ${m.stats.us.shots} 대 ${m.stats.them.shots}`);
  if (state.league && fx.comp === "league") {
    const rows = sortTable(state.league.table);
    const us = rows.findIndex(r => r.id === US);
    body.push(`📊 리그 ${us + 1}위 (승점 ${rows[us].pts}, ${state.league.played}/7라운드)`);
  }
  for (const n of notes) if (typeof n === "string") body.push(n);
  const nxt = nextFixtureText(state);
  if (nxt) body.push(`다음 경기: ${nxt}`);
  body.push(`${STAFF.assistant}: ${res.result === "패" ? "월요일엔 영상 보면서 실점 장면 짚고 간다." : "월요일은 회복 훈련. 무리하지 마라."}`);
  mail(state, "group", `${fx.compLabel}${fx.round ? ` ${fx.round}` : ""}: ${TEAM_NAME} ${res.gf} : ${res.ga} ${fx.opponent.name}${res.shootout ? ` (승부차기 ${res.shootout.us}:${res.shootout.them})` : ""}`, body.join("\n\n"));

  for (const n of notes) if (typeof n === "object") mailFrom(state, n.from, "scout", n.title, n.body);

  // 감독님 개인 피드백: 숫자 대신 장면과 느낌으로
  const fb = [];
  if (res.minutes > 0) {
    const r = res.rating;
    fb.push(r >= 8.3 ? "오늘은 네 경기였다. 집에 가서 부모님께 자랑해도 된다." : r >= 7.4 ? "오늘 좋았다. 네가 있어서 팀이 편했다."
      : r >= 6.6 ? "제 몫은 했다. 그런데 너는 그 이상을 할 수 있는 선수다." : r >= 6 ? "오늘은 좀 조용했다. 공이 오길 기다리기만 하면 안 된다." : "오늘은 스스로도 알 거다. 오늘 밤은 너무 오래 곱씹지는 마라.");
    const log = m.my.log;
    if (log.length) {
      const okN = log.filter(x => x.ok).length;
      if (okN === log.length && log.length >= 3) fb.push("공을 잡을 때마다 뭔가 됐다. 그 감각, 잊지 마라.");
      else if (okN <= log.length / 3) fb.push("몇 번은 번뜩였는데, 중요한 순간마다 한 템포씩 늦었다.");
      const fails = log.filter(x => !x.ok);
      const byStat = {};
      for (const f of fails) (byStat[f.stat] ||= []).push(f);
      const worst = Object.entries(byStat).sort((a, b) => b[1].length - a[1].length)[0];
      if (worst) {
        const [stat, list] = worst;
        const drill = drillFor(stat);
        fb.push(`"${list[0].label}" 같은 장면에서 자꾸 막히더라. ${josa(STAT_LABEL[stat], "이", "가")} 아직 몸에 덜 붙었다.${drill ? ` 이번 주엔 ${josa(drill.label, "을", "를")} 조금 더 해 보자.` : ""}`);
      }
      const brave = log.find(x => x.ok && x.level === "낮음");
      if (brave) fb.push(`${brave.minute}분에 "${brave.label}", 그거 아무나 하는 선택 아니다. 그런 배짱은 좋다. 다만 매번 통하진 않는다는 것도 알고.`);
      const safe = log.filter(x => x.level === "높음").length;
      if (log.length >= 4 && safe === log.length) fb.push("실수는 없었다. 그런데 상대가 무서워할 장면도 없었다. 가끔은 승부를 걸어 봐라.");
    }
    if (res.involved >= 3) fb.push(m.star >= 1 ? "상대가 너만 따라다니는데도 계속 공에 관여하더라. 이제 다들 너를 안다." : "공이 너를 거쳐 가는 일이 많아졌다. 팀이 너를 찾기 시작했다는 뜻이다.");
    if (res.stops >= 2) fb.push("뒤에서 몇 번이나 끊어 줬다. 그런 건 기록에 안 남아도 감독은 다 본다.");
    const cnow = conditionOf(p);
    if (cnow.score < 50) fb.push("경기 내내 다리가 무거워 보였다. 쉬는 것도 훈련이다.");
    if (m.goalsLog.some(g => g.myFault)) fb.push("실점 장면, 너도 마음에 걸릴 거다. 내일 영상으로 같이 보자.");
    if (fx.comp === "hs" && m.physGap > 0.04) fb.push("고등학생 몸싸움에 자꾸 밀리더라. 웨이트는 하루아침에 안 된다. 꾸준히 해라.");
    if (res.mom) fb.push("오늘 최우수 선수는 너다. 그래도 들뜨지 마라. 내일 훈련은 똑같다.");
  } else if (res.status === "bench" || res.status === "out") {
    if (res.reason?.includes("학업")) fb.push("성적 때문에 못 데려갔다. 나도 아쉽다. 공부도 훈련이다. 책상 앞에서 먼저 이기고 와라.");
    else if (res.reason?.includes("부상")) fb.push("다친 건 어쩔 수 없다. 조급해하지 말고 재활 제대로 하고 돌아와라. 자리는 기다려 준다.");
    else {
      const d = depthChart(state);
      const gap = d.list[d.slots - 1] ? d.list[d.slots - 1].ovr - ovr(p) : 0;
      fb.push(res.status === "bench" ? "끝까지 못 넣어 줘서 미안하다. 벤치에서 본 것도 다 공부다." : "이번엔 명단에서 뺐다. 서운하겠지.");
      fb.push(gap > 8 ? "앞에 선 형들과는 아직 거리가 좀 있다. 하루아침에 좁혀지진 않는다. 대신 매일 조금씩은 좁혀진다."
        : gap > 3 ? "앞에 있는 형들이 아직 한 걸음 앞서 있다. 그 한 걸음, 훈련장에서 좁혀 와라."
        : "솔직히 거의 다 왔다. 다음엔 네 이름을 먼저 적을지도 모른다.");
      if (state.relations.coach < 45) fb.push("그리고 단체훈련 때 좀 더 얼굴을 보여라. 나는 거기서 선수를 본다.");
    }
  }
  if (fb.length) mail(state, "coach", `경기 후 면담: vs ${fx.opponent.name}`, fb.join("\n\n"));
}

function nextFixtureText(state) {
  for (let i = 1; i < 8; i++) {
    const info = turnInfo(state, i);
    if (!info) return null;
    if (info.match) return `${info.month}월 ${info.week}주 ${info.comp.label}${info.match.round ? ` ${info.match.round}` : ""}`;
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
      `${soon.month}월 ${soon.week}주에 ${soon.exam.name}이 있어.\n\n지금 수업 태도랑 과제로 보면, 이대로는 ${tier} 정도가 아닐까 싶어.\n\n시험 주에 공부를 한 칸이라도 넣으면 결과가 꽤 달라져. 운동부라고 봐주는 거 없다는 거 알지?${state.flags.academicLevel > 0 ? "\n\n감독님도 이번 시험 결과를 보신대." : ""}`);
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
      `요즘 말수가 줄었네. 경기 못 뛰어서 그러니?\n\n마음이 가라앉으면 훈련도 잘 안 된대. 이번 주엔 가족이랑 밥 한 끼 하든지, 친구들이랑 바람 좀 쐬고 와. 그래도 괜찮아.`);
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
    mail(state, "mom", "바지가 또 짧아졌네",
      `이번 측정에서 ${rep.body.cm}cm나 컸다며? 지금 ${p.body.height.toFixed(1)}cm.\n\n키 클 때는 무릎이나 뒤꿈치가 아플 수 있대. 아프면 참지 말고 바로 말해. 우유는 냉장고에 있다.`);
    return true;
  });

  // 학업 하락
  push("academic", 6, () => {
    if (hist.length < 6 || s.academic >= 48) return false;
    const schoolCnt = hist.slice(-6).flatMap(h => h.acts).filter(a => ACTIONS.find(x => x.id === a)?.cat === "school").length;
    mail(state, "teacher", "요즘 수업 시간에",
      `피곤한 건 알지만 수업 시간에 자주 졸더라.\n\n${schoolCnt <= 1 ? "요즘 학교 공부엔 거의 손을 안 댄 것 같더라. " : ""}이대로 가면 감독님께 연락을 드려야 할 것 같아. 그러면 대회에 못 나갈 수도 있어.\n\n일주일에 한 칸만이라도 공부해 보자. 생각보다 금방 올라.`);
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
    lines.push(`네 자리에서 지금 제일 아쉬운 건 ${josa(STAT_LABEL[weak], "이", "가")}다.${drill ? used === 0 ? ` 그런데 ${josa(drill.label, "은", "는")} 한 번도 안 했더라.` : used <= 1 ? ` ${josa(drill.label, "을", "를")} 조금 더 늘려 보자.` : " 그래도 꾸준히 채우고 있으니 곧 올라올 거다." : ""}`);
    if (cnt.rest === 0) lines.push("쉬는 날이 하나도 없었다. 몸은 쉬는 동안 자란다.");
    if (cnt.school === 0) lines.push("그리고 담임 선생님이 수업 시간 얘기를 하시더라. 공부 칸도 잊지 마라.");
    mail(state, "assist", "요즘 훈련 이야기", lines.join("\n\n"));
    return true;
  });

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
    [`${p.name}, ${STAFF.assistant}다. 처음이니 몇 가지만 알려 준다.`,
     "한 주는 평일 두 칸, 주말 한 칸이다. 주말에 경기가 있으면 주말 칸은 경기로 고정된다.",
     "개인훈련은 능력치를 올리고, 단체훈련은 감독님 신뢰를 올린다. 선발은 능력치 75%, 감독 신뢰 25%로 정해진다.",
     "피로가 40을 넘으면 훈련 효율이 떨어지고, 70을 넘으면 크게 떨어진다. 다칠 위험도 커진다. 수면과 가족 시간이 피로를 푼다.",
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
const {SITUATIONS, OUTCOMES, LINES, HALFTIME_TALK, PLAYS, FINISH, RESULT, AMBIENT, TO_ME, SIGNATURE, ME_IN_PLAY} = __m["data/match.js"];
const {SURNAMES, GIVEN_NAMES} = __m["data/world.js"];
const {POSITIONS} = __m["data/player.js"];
const {GOALKEEPERS, STAFF} = __m["data/roster.js"];
const {rand, int, range, normal, chance, pick, weighted, clamp, getPath, shuffle} = __m["js/rng.js"];
const {ovr, depthChart, teamStrength, activeRoster, mateGrade} = __m["js/engine/team.js"];
const {hasTrait, applyGain, conditionOf} = __m["js/engine/growth.js"];
const {applyResult, TEAM_NAME} = __m["js/engine/season.js"];
const {matchMails} = __m["js/engine/advice.js"];
// 경기 엔진: 시간순 사건을 미리 깔아 두고, 내 장면에서 멈춰 선택을 받습니다.
// 각 해설 줄에는 공 위치(ball)와 공을 가진 팀(poss)이 붙어 있어 화면이 선수들을 움직입니다.









const LENGTH = 70;          // 중등부 전후반 35분씩
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
    restNote = `피로가 ${Math.round(p.condition.fatigue)}까지 쌓여 감독님이 후반에 넣기로 했다.`;
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
  const oppPlayers = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14]).map((n, i) => ({
    name: randomName(), number: n, pos: i < 4 ? "DF" : i < 8 ? "MF" : "FW" }));

  // 내가 뛰면 내 능력치와 컨디션이 팀 전력에 직접 더해짐
  const ours = teamStrength(state, onPitch) * 0.6 + 50 * 0.4 + (onPitch ? (myOvr - teamAvg) * 0.12 + cond.match * 15 : 0)
    + (keeperOf(state).strong ? 1.5 : 0);
  const theirs = fx.opponent.strength;

  const events = [{ type: "kickoff", minute: 0 }];
  const nOur = poisson(5.2 * Math.exp((ours - theirs) / 14));
  const nTheir = poisson(5.2 * Math.exp((theirs - ours) / 14));
  for (let i = 0; i < nOur; i++) events.push({ type: "ours", minute: int(1, LENGTH) });
  for (let i = 0; i < nTheir; i++) events.push({ type: "theirs", minute: int(1, LENGTH) });
  for (let i = 0, n = int(4, 6); i < n; i++) events.push({ type: "ambient", minute: int(2, LENGTH - 1) });
  if (onPitch) {
    const from = status === "start" ? 1 : minIn + 1;
    // 능력치가 팀 평균보다 높을수록 공이 더 자주 나에게 옴
    const n = status === "start" ? int(4, 5) + Math.round(star * 1.5) : Math.max(1, Math.round((LENGTH - minIn) / LENGTH * (5 + star * 2)));
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
    star, meRate: onPitch ? clamp(0.08 + star * 0.12 + (hasTrait(p, "ace") ? 0.03 : 0), 0.05, 0.29) : 0, me: p.name, myPos: p.position,
    minIn: status === "sub" ? minIn : 0, onPitch,
    ours, theirs, lineup, oppPlayers, gk: { us: ourKeeper(state), them: randomName() },
    events, i: 0, minute: 0, score: [0, 0],
    stats: { us: { shots: 0, on: 0, corners: 0, cards: 0 }, them: { shots: 0, on: 0, corners: 0, cards: 0 },
             poss: Math.round(clamp(50 + (ours - theirs) * 1.1 + normal(0, 4), 28, 72)) },
    goalsLog: [],
    my: { goals: 0, assists: 0, delta: 0, decisions: 0, successes: 0, log: [] },
    formSwing: hasTrait(p, "inconsistent") ? normal(0, 0.06) : 0, physGap,
    feed: [], pending: null, half: 1, done: false, used: {}, trailed: { us: false, them: false },
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
  const pool = team === "us" ? m.lineup : m.oppPlayers;
  const list = pool.filter(x => x.pos === pos);
  return (list.length ? list : pool).map(x => x.name);
}
const mateName = (m, prefer = ["FW", "MF"]) => {
  const pool = m.lineup.filter(x => prefer.includes(x.pos));
  return pick(pool.length ? pool : m.lineup)?.name || "동료";
};
const oppName = (m, prefer = ["FW", "MF"]) => pick(m.oppPlayers.filter(x => prefer.includes(x.pos))).name;

// 골이 들어간 뒤 스코어와 흐름을 알려 주는 한 줄
function goalNote(m, team, min) {
  const [a, b] = m.score;
  const d = team === "us" ? a - b : b - a;      // 득점한 팀 기준 점수 차
  const behind = team === "us" ? m.trailed.us : m.trailed.them;
  let note;
  if (d === 0) note = team === "us" ? "동점골! 승부는 다시 원점이다." : "동점을 허용했다.";
  else if (d === 1 && behind) note = team === "us" ? "역전골! 경기를 뒤집었다!" : "역전을 허용했다…";
  else if (d === 1) note = team === "us" ? "앞서 나가는 골!" : "먼저 실점했다.";
  else if (d >= 2) note = team === "us" ? "달아나는 골! 격차를 벌린다." : "격차가 벌어진다.";
  else note = team === "us" ? "한 골 따라붙었다!" : "상대가 한 골 따라붙었다.";
  if (a < b) m.trailed.us = true;
  if (b < a) m.trailed.them = true;
  return { t: `${note} ${TEAM_NAME} ${a} : ${b} ${m.fx.opponent.name}`, k: "stat", minute: min };
}

// 팀 공격 한 번: 패스 전개 → 마무리 → 결과
function runPlay(m, team) {
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
    const idx = play.steps.map((st, i) => (st.who === m.myPos || (m.myPos !== "DF" && i === play.steps.length - 1)) ? i : -1).filter(i => i >= 0);
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
    if (t) lines.push({ t, k: mine ? "me-auto" : team === "us" ? "us" : "them", minute: min, ball: pt, poss: team, fast: true, meHold: mine });
    else lines.push({ t: "", k: "", minute: min, ball: pt, poss: team, fast: true, silent: true });
  });
  if (meIdx >= 0) { m.my.delta += 0.05; m.my.involved = (m.my.involved || 0) + 1; }

  // 상대 공격: 수비 능력이 좋으면 내가 끊어 냄
  if (team === "them" && onNow && (m.myPos === "DF" || m.myPos === "MF") && chance(m.meRate * (m.myPos === "DF" ? 1.1 : 0.7))) {
    const pl = m._p;
    const q = clamp(0.3 + (pl.stats.tech.defense - m.theirs) / 60 + conditionOf(pl).match, 0.1, 0.85);
    if (rand() < q) {
      lines.push({ t: fill(pick(ME_IN_PLAY.stop), { me: m.me }), k: "me-auto", minute: min, ball: lines.at(-1).ball, poss: "us", meHold: true });
      m.my.delta += 0.2; m.my.involved = (m.my.involved || 0) + 1; m.my.stops = (m.my.stops || 0) + 1;
      return lines;
    }
  }

  const shooter = actors.at(-1);
  const assister = actors.length > 1 ? actors.at(-2) : null;
  const meShoots = shooter === m.me && team === "us";
  const finTxt = meShoots ? (ME_IN_PLAY[{ header: "head", fk: "fk", pk: "pk" }[play.finish]] || ME_IN_PLAY.shot) : FINISH[play.finish];
  lines.push({ t: fill(pick(finTxt), { a: shooter, me: m.me }), k: meShoots ? "me-auto" : team === "us" ? "us" : "them", minute: min, ball: lines.at(-1).ball, poss: team, fast: true, meHold: meShoots });

  const st = m.stats[team];
  st.shots++;
  if (play.id === "corner") st.corners++;
  const diff = team === "us" ? m.ours - m.theirs : m.theirs - m.ours;
  const mult = { shot: 1, header: 0.85, long: 0.45, fk: 0.5 }[play.finish] || 1;
  let conv = clamp((0.24 + diff / 200) * mult, 0.06, 0.42);
  if (meShoots) {
    const pl = m._p;
    const stat = play.finish === "header" ? pl.stats.phys.jump * 0.6 + pl.stats.tech.shoot * 0.4 : pl.stats.tech.shoot;
    conv = clamp((0.08 + (stat - (m.theirs + 4)) / 110 + conditionOf(pl).match * 0.6 + (hasTrait(pl, "finisher") ? 0.04 : 0)) * mult, 0.04, 0.44);
  }
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
    lines.push({ t: say(R.goal, vars), k: meShoots ? "goal-me" : team === "us" ? "goal-us" : "goal-them", minute: min, ball: goalPt(team), poss: team });
    lines.push(goalNote(m, team, min));
  } else {
    const kind = play.finish === "pk" ? weighted([["save", 0.7], ["wide", 0.2], ["post", 0.1]])
      : weighted([["save", 0.42], ["wide", 0.3], ["block", 0.16], ["post", 0.12]]);
    if (kind === "save") st.on++;
    const ball = kind === "save" ? keeperPt(team) : kind === "wide" ? [flip(team, 105), range(18, 50)] : kind === "post" ? [flip(team, 104.5), chance(0.5) ? 30.4 : 37.6] : [flip(team, 88), range(26, 42)];
    lines.push({ t: say(R[kind], vars), k: team === "us" ? "us" : "them", minute: min, ball, poss: kind === "save" || kind === "wide" ? (team === "us" ? "them" : "us") : team });
    if ((kind === "save" || kind === "block") && chance(0.35)) {
      st.corners++;
      lines.push({ t: team === "us" ? "코너킥을 얻었다." : "상대 코너킥. 잘 걷어 냈다.", k: team === "us" ? "us" : "them", minute: min, ball: [flip(team, 104), chance(0.5) ? 1 : 67], poss: team, fast: true });
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
    if (!m.onPitch) lines.push(L(m.status === "bench" ? "벤치에서 경기를 지켜본다. 언제 부를지 모른다." : (m.reason || "관중석에서 경기를 지켜본다.")));
    if (m.restNote) lines.push(L(m.restNote, "coach"));
    if (m.star >= 1 && m.status === "start") lines.push(L(fill(pick(ME_IN_PLAY.marked), { me: m.me }), "me-auto"));
  }
  if (ev.type === "injury" && m.onPitch && !m.injured) {
    const type = weighted([["ankle", 0.55], ["hamstring", 0.3], ["knee", 0.15]]);
    const t = INJURY_LINES[type];
    m.injured = { type, minute: min, cause: t.cause };
    m.onPitch = false;
    lines.push(L(fill(pick(t.lines), { me: m.me }), "me-bad", { ball: [range(40, 80), range(15, 55)], poss: "them" }));
    lines.push(L(fill("의무 트레이너가 뛰어 들어간다. {coach|이/가} 벤치에서 교체 사인을 보낸다.", { coach: STAFF.coach }), "coach"));
    lines.push(L(pick(t.after), "info"));
  }
  if (ev.type === "2h") lines.push(L(say(LINES.secondHalf, {}), "whistle", { ball: [52.5, 34], poss: "them" }));
  if (ev.type === "subIn") lines.push(L(say(LINES.subIn, {}), "me", { ball: [52.5, 34], poss: "us" }));
  Object.defineProperty(m, "_p", { value: state.player, enumerable: false, configurable: true, writable: true });
  if (ev.type === "ours") lines = runPlay(m, "us");
  if (ev.type === "theirs") lines = runPlay(m, "them");
  if (ev.type === "ambient") {
    const fit = AMBIENT.filter(x => (!x.early || min < 15) && (!x.late || min >= 58) && (!x.min || min >= x.min));
    const a = pick(fit.length ? fit : AMBIENT);
    if (a.card) m.stats[a.card].cards++;
    const poss = a.side === "them" ? "them" : a.side === "us" ? "us" : chance(m.stats.poss / 100) ? "us" : "them";
    lines.push(L(fill(a.t, { a: mateName(m, ["DF", "MF"]), o: oppName(m), coach: STAFF.coach, gk: m.gk.us }), a.card ? "card" : "info",
      { ball: [range(30, 75), range(10, 58)], poss }));
  }
  if (ev.type === "moment" && m.injured) { m.feed.push(...lines); return { kind: "line", lines }; }
  if (ev.type === "moment") {
    const sit = pickSituation(state, m);
    const poss = sit.poss || "us";
    if (sit.once) m.used[sit.id] = true;
    const oppPref = poss === "them" ? (state.player.position === "DF" ? ["FW"] : ["MF", "FW"]) : ["DF", "MF"];
    const sv = { mate: mateName(m), opp: oppName(m, oppPref), gk: m.gk.us, ogk: m.gk.them };
    const zone = sit.zone;
    const ball = zone === "att" ? [range(80, 88), range(24, 44)] : zone === "mid" ? [range(48, 60), range(18, 50)] : [range(20, 30), range(18, 50)];
    if (sit.intro !== false) lines.push(L(fill(pick(TO_ME[poss === "them" ? "def" : zone] || TO_ME.mid), sv), "me", { ball, poss, toMe: true }));
    else lines.push({ t: "", k: "", minute: min, ball, poss, toMe: true, silent: true });
    m._sitPoss = poss;
    const list = sit.choices.slice();
    const sig = SIGNATURE[sit.id];
    if (sig && Object.entries(sig.requires).every(([k, v]) => getPath(state.player.stats, k) >= v)) list.push({ ...sig, signature: true });
    const choices = list.map(c => { const p = prob(state, m, c); return { label: c.label, p, signature: !!c.signature, level: p >= 0.65 ? "높음" : p >= 0.4 ? "보통" : "낮음" }; });
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
    lines.push(L(`감독님: "${pick(HALFTIME_TALK[mood])}"`, "coach"));
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
  const pool = SITUATIONS.filter(s => s.pos.includes(pos) && (!s.once || !m.used[s.id])
    && (!s.late || late) && (!s.leading || a > b) && (!s.trailing || a < b));
  const losingLate = a < b && m.minute > 50;
  return weighted(pool.map(s => [s, s.weight * (losingLate && s.zone === "att" ? 1.6 : 1)]));
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
  if (hasTrait(p, "clutch") && m.score[0] < m.score[1] && m.minute > HALF) x += 0.07;
  if (c.physical) x -= m.physGap;
  x += m.formSwing;
  return clamp(x, 0.05, 0.95);
}

// ── 내 선택 처리 ────────────────────
function resolve(state, m, ci) {
  const pd = m.pending;
  const c = pd.list[ci];
  const p = pd.choices[ci].p;
  const ok = rand() < p;
  const out = ok ? c.win : c.lose;
  const v = pd.vars;
  const min = m.minute;
  const pl = state.player;
  const [bx, by] = pd.ball;
  // 상황 설명을 기록에 남겨야 나중에 읽어도 앞뒤가 이어짐
  const lines = [{ t: pd.text, k: "me", minute: min, ball: pd.ball, poss: pd.sit.poss || "us", fast: true },
                 { t: `▶ ${c.label}`, k: "me", minute: min, ball: pd.ball, poss: pd.sit.poss || "us" }];

  // 결과 문장과 공의 움직임
  const after = {
    win: [[bx + 10, by], "us"], keep: [[bx + 5, by + range(-6, 6)], "us"], miss: [[100, 34], "them"],
    turnover: [[bx - 4, by], "them"], danger: [[range(14, 20), range(28, 40)], "them"],
    shot: [[Math.max(bx, 86), range(28, 40)], "us"], chip: [[Math.max(bx, 88), range(30, 38)], "us"], head: [[94, range(30, 38)], "us"],
    assist: [[90, range(28, 40)], "us"], keyPass: [[84, range(22, 46)], "us"], killPass: [[93, range(30, 38)], "us"],
    tapIn: [[97, range(31, 37)], "us"], pk: [[94, 34], "us"], matePk: [[94, 34], "us"], setPiece: [[80, range(26, 42)], "us"],
    offside: [[bx, by], "them"], pkAgainst: [[11, 34], "them"],
  }[out] || [[bx, by], "us"];
  lines.push({ t: fill(pick(ok ? c.winText : c.loseText), v), k: ok ? "me-good" : "me-bad", minute: min, ball: after[0], poss: after[1] });

  const main = Object.entries(c.stats).sort((a, b) => b[1] - a[1])[0][0];
  m.my.decisions++; if (ok) m.my.successes++;
  m.my.log.push({ sit: pd.sit.id, label: c.label, ok, out, stat: main, value: getPath(pl.stats, main), level: pd.choices[ci].level, minute: min });
  m.my.delta += OUTCOMES[out].rating;
  if (pd.sit.id === "penalty" && out === "miss") { m.stats.us.shots++; m.stats.us.on++; }
  else if (out === "miss" && (c.stats["tech.shoot"] || 0) >= 0.5) m.stats.us.shots++;   // 빗나간 슈팅도 슈팅 수에
  if (/corner/.test(pd.sit.id)) m.stats.us.corners++;

  const finish = (stat, goalTxt, saveTxt, wideTxt) => {
    m.stats.us.shots++;
    const q = clamp(0.08 + (stat - (m.theirs + 4)) / 120 + (pl.stats.mental.confidence - 50) / 400 + conditionOf(pl).match * 0.6
      + (hasTrait(pl, "finisher") ? 0.04 : 0), 0.04, 0.44);
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++; m.my.goals++; m.my.delta += 0.75;
      m.goalsLog.push({ team: "us", name: pl.name, minute: min, me: true });
      lines.push({ t: fill(pick(goalTxt), v), k: "goal-me", minute: min, ball: goalPt("us"), poss: "us" });
      lines.push(goalNote(m, "us", min));
    } else {
      const saved = rand() < 0.6;
      if (saved) m.stats.us.on++;
      lines.push({ t: fill(pick(saved ? saveTxt : wideTxt), v), k: "me", minute: min, ball: saved ? keeperPt("us") : [105, range(20, 48)], poss: "them" });
    }
  };
  const teammateFinish = (q, goalTxt = LINES.assistGoal, missTxt = LINES.assistMiss, credit = true) => {
    m.stats.us.shots++;
    if (credit && hasTrait(pl, "playmaker")) q += 0.06;
    if (rand() < q) {
      m.stats.us.on++; m.score[0]++;
      if (credit) { m.my.assists++; m.my.delta += 0.6; }
      m.goalsLog.push({ team: "us", name: v.mate, minute: min, assist: credit ? pl.name : null, myAssist: credit });
      lines.push({ t: fill(pick(goalTxt), v), k: "goal-us", minute: min, ball: goalPt("us"), poss: "us" });
      lines.push(goalNote(m, "us", min));
    } else lines.push({ t: fill(pick(missTxt), v), k: "us", minute: min, ball: keeperPt("us"), poss: "them" });
  };
  const concede = (q, txtGoal, txtSave) => {
    m.stats.them.shots++;
    if (rand() < q) {
      m.stats.them.on++; m.score[1]++; m.my.delta -= 0.25;
      m.goalsLog.push({ team: "them", name: v.opp, minute: min, myFault: true });
      lines.push({ t: fill(pick(txtGoal), v), k: "goal-them", minute: min, ball: goalPt("them"), poss: "them" });
      lines.push(goalNote(m, "them", min));
    } else if (txtSave) lines.push({ t: fill(pick(txtSave), { ...v, mate: mateName(m, ["DF"]) }), k: "them", minute: min, ball: keeperPt("them"), poss: "us" });
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
    lines.push({ t: fill(pick(LINES.pkGoal), v), k: "goal-me", minute: min, ball: goalPt("us"), poss: "us" });
    lines.push(goalNote(m, "us", min));
  }
  if (out === "matePk") teammateFinish(0.72, LINES.matePkGoal, LINES.matePkMiss, false);
  if (out === "setPiece") teammateFinish(0.16, LINES.fkGoal, LINES.fkMiss, false);
  if (out === "pkAgainst") concede(0.74, LINES.pkAgainstGoal, LINES.pkAgainstSave);
  if (out === "turnover") concede(0.1, pd.sit.poss === "them" ? LINES.leakGoal : LINES.turnoverGoal, null);
  if (out === "danger") concede(0.38, LINES.dangerGoal, LINES.dangerSave);

  m.pending = null;
  m.feed.push(...lines);
  return { ok, outcome: out, lines };
}

const VALUE = { goal: 1, chip: 0.45, shot: 0.35, head: 0.3, assist: 0.45, killPass: 0.55, keyPass: 0.3, win: 0.3, keep: 0.1, miss: 0, turnover: -0.12, danger: -0.38,
  tapIn: 0.6, pk: 1, matePk: 0.6, setPiece: 0.2, offside: -0.05, pkAgainst: -0.75 };
function autoChoice(m) {
  const pd = m.pending;
  let best = 0, bestV = -9;
  pd.list.forEach((c, i) => {
    const p = pd.choices[i].p;
    const v = p * VALUE[c.win] + (1 - p) * VALUE[c.lose];
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
    after: ["더 뛰겠다고 했지만 감독님은 고개를 저었다.", "벤치에 앉아 수건을 머리에 덮는다."] },
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
    let r = 6.08 + m.my.delta * 0.8 + (gf > ga ? 0.3 : gf < ga ? -0.3 : 0) + normal(0, 0.2);
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

  const notes = applyResult(state, fx, gf, ga, { shootoutWin: shootout?.win ?? null, rating });

  const res = {
    turn: m.turn, grade: m.grade, comp: fx.compLabel, compId: fx.comp, round: fx.round, official: fx.official,
    opponent: fx.opponent.name, gf, ga, result, status: m.status, minutes, goals: m.my.goals, assists: m.my.assists,
    rating, reason: m.reason, shootout, mom, school: fx.school?.name || null,
    possession: m.stats.poss, shots: [m.stats.us.shots, m.stats.them.shots], involved: m.my.involved || 0, stops: m.my.stops || 0,
    injury: m.injured || null, clutch,
  };
  rec.matches.push(res);
  matchMails(state, m, res, notes);
  res.notes = notes.map(n => typeof n === "string" ? n : n.title);
  return res;
}

return { LENGTH, HALF, STATUS_LABEL, fill, eligibility, prepareMatch, next, statLine, prob, resolve, autoChoice, autoPlay, finishMatch };
})();
(__fix["js/engine/match.js"] || []).forEach(f => f());

// ── data/events.js
__m["data/events.js"] = (function () {
const {CAPTAINS} = __m["data/roster.js"];

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
      { label: "미안, 너가 좀 해 줘", fx: { s: { "student.attitude": -1.5 }, rel: { friend: -8 } }, result: "{friend|이/가} 혼자 다 했다. 발표 날 눈을 안 마주친다." },
    ] },
  { id: "sports_day", who: "teacher", when: { months: [5, 10] }, once: false,
    text: "{name|아/야}, 체육대회 반 대항 계주 마지막 주자 좀 맡아 줄래? 축구부니까 다들 너 믿고 있어.",
    choices: [
      { label: "맡겠습니다", fx: { s: { "student.attitude": 1.5, "phys.speed": 0.5 }, fatigue: 6, morale: 6 }, result: "마지막 코너에서 두 명을 제쳤다. 반 애들이 운동장으로 뛰어나왔다." },
      { label: "다치면 안 돼서요…", fx: { s: { "student.attitude": -0.5 }, fatigue: -3 }, result: "선생님은 웃으며 괜찮다고 했지만, 반 단톡방은 조용했다." },
    ] },
  { id: "phone_confiscated", school: true, who: "teacher", cond: s => s.player.stats.student.attitude < 60,
    text: "수업 중에 하이라이트 영상을 보다가 {teacher}께 걸렸다. \"휴대폰은 종례 때 찾아가.\"",
    choices: [
      { label: "죄송합니다. 반성문 쓰겠습니다", fx: { s: { "student.attitude": 1.5 } }, result: "반성문 한 장. 선생님이 \"다음엔 쉬는 시간에 봐\" 하고 돌려주셨다." },
      { label: "축구 공부였다고 말한다", fx: { s: { "student.attitude": -2 }, morale: -3 }, result: "변명이 통하지 않았다. 감독님 귀에도 들어갔다.", fxAfter: { coach: -2 } },
    ] },
  { id: "class_president", school: true, who: "teacher", when: { months: [3] }, once: true, cond: s => s.player.stats.student.attitude >= 60,
    text: "반장 선거에 너를 추천하는 애들이 있더라. 운동하면서 할 수 있겠니?",
    choices: [
      { label: "해 보겠습니다", fx: { s: { "student.attitude": 3, "mental.teamwork": 1 }, fatigue: 5 }, result: "반장이 됐다. 아침 조회를 맡게 됐다. 바쁘지만 뿌듯하다." },
      { label: "운동에 집중할게요", fx: { morale: 2 }, result: "선생님은 고개를 끄덕였다. \"그래, 그것도 용기야.\"" },
    ] },
  { id: "field_trip", school: true, who: "narr", when: { months: [5, 10] }, once: false,
    text: "학년 체험학습 날. 나로우주센터 견학이다. 그런데 그날 오후에 팀 자율 훈련이 잡혀 있다.",
    choices: [
      { label: "체험학습에 끝까지 간다", fx: { morale: 8, fatigue: -8, s: { "student.academic": 1 } }, result: "로켓 발사대 앞에서 친구들과 사진을 찍었다. 오랜만에 축구 생각이 안 났다." },
      { label: "오후엔 빠져서 훈련한다", fx: { s: { "position": 0.6 }, coach: 1.5, morale: -3 }, result: "혼자 운동장에 남아 슈팅 50개. 감독님이 멀리서 보고 계셨다." },
    ] },
  { id: "late_school", school: true, who: "narr", cond: s => s.player.condition.fatigue >= 55,
    text: "아침 알람을 세 번 껐다. 눈을 뜨니 8시 25분.",
    choices: [
      { label: "택시 타고 간다 (용돈 손해)", fx: { morale: -2 }, result: "겨우 출석. 이번 달 용돈이 반으로 줄었다." },
      { label: "지각하고 혼난다", fx: { s: { "student.attitude": -2 }, fatigue: -6 }, result: "벌점 1점. 그래도 몸은 좀 개운하다. 피로가 쌓였다는 신호다." },
    ] },
  { id: "library_book", who: "teacher", when: { grades: [1, 2] },
    text: "도서관에 새로 들어온 축구 선수 자서전 있던데, 읽어 볼래? 독후감 쓰면 수행평가에도 들어가.",
    choices: [
      { label: "빌려서 읽는다", fx: { s: { "mental.focus": 1, "student.academic": 1.5, "mental.confidence": 0.5 }, fatigue: -2 }, result: "\"남들이 쉴 때 한 번 더 찼다\"는 문장에 밑줄을 그었다." },
      { label: "시간 없어서 패스", fx: {}, result: "책은 다른 반 친구가 빌려 갔다." },
    ] },
  { id: "exam_night", school: true, who: "friend", needs: "friend", cond: s => s.player.stats.student.academic < 60, when: { months: [4, 6, 10, 11] },
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
      { label: "테이프 감고 버틴다", fx: { s: { "mental.competitive": 0.8 }, morale: -2 }, result: "흰 테이프를 칭칭 감았다. 형들이 웃었지만 상관없다." },
    ] },
  { id: "pro_match", who: "dad", when: { months: [4, 5, 9, 10] },
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
    text: "라커룸 정리를 안 한 게 걸렸다. 사실 {mentor} 선배가 마지막에 나갔다. 감독님이 1학년들을 보며 묻는다. \"누구야?\"",
    choices: [
      { label: "제가 했습니다 (대신 혼난다)", fx: { coach: -1, rel: { mentor: 12 }, s: { "mental.teamwork": 1 } }, result: "운동장 다섯 바퀴. 다음 날 선배가 몰래 음료수를 줬다." },
      { label: "사실대로 말한다", fx: { coach: 1, rel: { mentor: -10 } }, result: "감독님은 고개를 끄덕였다. 선배와는 한동안 어색했다." },
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
      { label: "출전 기회를 달라고 한다", fx: { coach: -2, s: { "mental.confidence": 1 } }, result: "\"기회는 훈련에서 만드는 거다.\" 감독님은 그 말만 했다." },
    ] },
  { id: "video_analysis", who: "assistant", cond: s => s.record.apps >= 3,
    text: "지난 경기 네 장면만 모아 봤다. 같이 볼래?",
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
  { id: "beach_training", who: "assistant", afterLoss: true, when: { months: [3, 4, 5, 6, 7, 8, 9, 10] },
    cond: s => { const m = s.record.matches.at(-1); return !!m && m.result === "패" && s.calendar.turn - m.turn <= 2; },
    text: "어제 그렇게 지고 그냥 넘어갈 순 없지. 오늘은 해변 모래 훈련이다. 다리 터질 각오 해라.",
    choices: [
      { label: "끝까지 버틴다", fx: { s: { "phys.strength": 1, "phys.agility": 0.8, "mental.competitive": 0.6 }, fatigue: 14, morale: 3 }, result: "모래에 발이 푹푹 빠진다. 마지막 왕복에서 다들 소리를 질렀다. 진 건 진 거고, 다음은 다음이다." },
      { label: "중간에 쉬었다 한다", fx: { s: { "phys.strength": 0.5 }, fatigue: 6 }, result: "파도 소리가 들렸다. 그래도 어제 경기 장면이 자꾸 떠올랐다." },
    ] },
  { id: "team_dinner", who: "narr", when: { months: [6, 8, 2] },
    text: "대회가 끝나고 감독님이 삼겹살을 쏘신다고 했다. 마침 그날 가족 외식 약속이 있다.",
    choices: [
      { label: "팀 회식에 간다", fx: { s: { "mental.teamwork": 1.5 }, morale: 5, rel: { mentor: 3, friend: 3, junior: 3 } }, result: "선배들이 고기를 구워 줬다. 처음으로 팀이 가족 같았다." },
      { label: "가족 외식에 간다", fx: { morale: 6, fatigue: -6 }, result: "엄마가 \"요즘 얼굴 좋아졌다\"며 웃었다." },
    ] },
  { id: "number_envy", who: "rival", needs: "rival", when: { grades: [2] },
    text: "내년에 10번 누가 달까? 난 이미 감독님한테 말해 놨다.",
    choices: [
      { label: "나도 노린다고 말한다", fx: { s: { "mental.competitive": 1 }, rel: { rival: 4 } }, result: "둘 다 웃었지만 눈은 웃고 있지 않았다." },
      { label: "번호는 상관없다고 한다", fx: { s: { "mental.focus": 0.5 } }, result: "{rival|이/가} \"너답다\" 하고 어깨를 쳤다." },
    ] },
  { id: "scout_rumor", who: "friend", needs: "friend", when: { grades: [3] }, cond: s => Object.keys(s.scouting || {}).length > 0,
    text: "야, 저번에 온 고등학교 감독님이 너 이름 물어봤다던데? 진짜야?",
    choices: [
      { label: "더 열심히 해야겠다", fx: { s: { "mental.confidence": 1 }, morale: 5 }, result: "괜히 그날 훈련이 가볍다." },
      { label: "괜히 부담된다", fx: { morale: -2, s: { "mental.focus": 0.5 } }, result: "잠자리에 누워서도 그 말이 맴돌았다." },
    ] },

  // ── 가족 ──────────────────────────────────────
  { id: "mom_birthday", who: "narr", once: true,
    text: "오늘이 엄마 생일이다. 훈련 끝나면 저녁 7시. 선물은 아직 못 샀다.",
    choices: [
      { label: "훈련을 일찍 마치고 케이크를 산다", fx: { morale: 8, coach: -1, fatigue: -4 }, result: "엄마가 울 것 같은 얼굴로 웃었다. 케이크 위 초가 흔들렸다." },
      { label: "편지를 써서 식탁에 둔다", fx: { morale: 5, s: { "student.academic": 0.5 } }, result: "다음 날 아침, 편지가 냉장고에 붙어 있었다." },
    ] },
  { id: "dad_busy", who: "dad", when: { months: [5, 9] },
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
  { id: "sibling_exam", who: "narr", when: { months: [11] },
    text: "누나가 고3 수능이다. 집안 분위기가 무겁다. 엄마가 이번 주엔 조용히 지내 달라고 했다.",
    choices: [
      { label: "누나 도시락 심부름을 한다", fx: { morale: 4, s: { "student.attitude": 1 } }, result: "수능 끝나고 누나가 축구화 끈을 사 줬다." },
      { label: "도서관에서 늦게까지 있는다", fx: { s: { "student.academic": 2 }, fatigue: 3 }, result: "조용한 도서관이 의외로 잘 맞았다." },
    ] },
  // ── 학교 행사 (data/calendar.js 의 SCHOOL_DAYS 일정에 맞춰 반드시 나옴) ──
  { id: "retreat", fixed: true, who: "narr",
    text: "수련회 첫날 밤, 레크리에이션 시간. 반 아이들이 \"축구부니까 네가 나가!\" 하며 등을 떠민다.",
    choices: [
      { label: "무대에 나간다", fx: { morale: 8, s: { "mental.teamwork": 1, "mental.confidence": 1 }, rel: { friend: 6 } }, result: "다리 찢기를 하다 바지가 터졌다. 반 아이들이 바닥을 굴렀다. 이제 다들 내 이름을 안다." },
      { label: "끝까지 버틴다", fx: { fatigue: -4 }, result: "다른 애가 끌려 나갔다. 무사히 넘어갔는데, 조금 아쉬운 것도 같다." },
      { label: "몰래 숙소 앞에서 줄넘기", fx: { s: { "phys.stamina": 1, "student.attitude": -1.5 }, fatigue: 3 }, result: "교관 선생님한테 걸렸다. 벌로 숙소 앞 청소. 그래도 천 개는 채웠다." },
    ] },
  { id: "singapore", fixed: true, who: "narr",
    text: "싱가포르 국제교류. 현지 학교 운동장에서 그쪽 친구들이 공을 차고 있다. 하나가 손짓을 한다. 말은 잘 안 통한다.",
    choices: [
      { label: "영어로 먼저 말을 건다", fx: { s: { "student.academic": 2, "mental.confidence": 1.5 }, morale: 5 }, result: "\"Do you play football?\" 떨리는 첫마디에 걔가 웃었다. 그날 저녁 SNS 친구가 하나 생겼다." },
      { label: "공으로 대화한다", fx: { s: { "tech.dribble": 1, "mental.teamwork": 1 }, morale: 6 }, result: "헛다리 한 번에 다들 소리를 질렀다. 축구는 어디서나 통한다." },
      { label: "멀리서 구경한다", fx: { fatigue: -8 }, result: "그늘에 앉아 쉬었다. 습하고 더운 공기 속에서 남의 축구를 보는 것도 나쁘지 않았다." },
    ] },
  { id: "sportsday", fixed: true, who: "teacher",
    text: "고흥 연합 체육대회 날. 다른 학교 축구부 애들도 보인다. {teacher}께서 부르신다. \"{name|아/야}, 반 대항 계주 마지막 주자 해 볼래?\"",
    choices: [
      { label: "마지막 주자를 맡는다", fx: { s: { "phys.speed": 0.8, "student.attitude": 1 }, morale: 7, fatigue: 6, teacher: 3 },
        hurt: { p: 0.05, type: "hamstring", cause: "체육대회 계주 마지막 코너에서 허벅지 뒤가 당겼다.", result: "마지막 코너에서 허벅지가 뚝 하고 당겼다. 1등은 했는데, 결승선을 지나 주저앉았다." },
        result: "마지막 코너에서 다른 학교 축구부를 제쳤다. 반 아이들이 운동장으로 뛰어나왔다." },
      { label: "응원단장을 한다", fx: { s: { "mental.teamwork": 1.5 }, morale: 5, teacher: 2, rel: { friend: 4 } }, result: "목이 쉬도록 소리를 질렀다. 반이 2등을 했다." },
      { label: "축구부는 빠진다", fx: { fatigue: -5, teacher: -2 }, result: "다칠까 봐 빠졌다. 반 단톡방이 조용했다." },
    ] },
  { id: "harmony_camp", fixed: true, who: "teacher",
    text: "1학기 마지막 날, 대서어울림문화캠프. 학교에서 하룻밤을 잔다. 밤 11시, {teacher}께서 손전등을 들고 복도를 도신다. \"{name}, 아직 안 자냐?\"",
    choices: [
      { label: "선생님께 고민을 꺼낸다", fx: { s: { "mental.focus": 1, "mental.confidence": 1 }, teacher: 8 }, result: "복도 창가에 나란히 섰다. 선생님은 끝까지 듣기만 하셨다. \"넌 생각보다 단단한 애야.\" 그 말이 오래 남았다." },
      { label: "친구들과 밤새 논다", fx: { morale: 10, fatigue: 8, rel: { friend: 6 } }, result: "교실 바닥에 이불을 깔고 새벽까지 웃었다. 내일부터 방학이다." },
      { label: "일찍 잔다", fx: { fatigue: -8 }, result: "다음 주부터 하계훈련이다. 눈을 감자마자 잠들었다." },
    ] },
  { id: "summer_camp", fixed: true, who: "coach",
    text: "{coach}: \"이번 주는 합숙이다. 휴대폰 걷는다. 하계대회 전까지 몸을 만든다.\" 이번 주 훈련은 효과가 크게 오르고 피로도 더 쌓인다. 어디에 집중할까?",
    choices: [
      { label: "기술 (볼 터치, 슈팅)", fx: { camp: true, s: { "tech.firstTouch": 1, "tech.shoot": 1, "tech.dribble": 1 }, fatigue: 6 }, result: "하루 천 번 볼 터치. 공이 발에 붙기 시작했다." },
      { label: "체력 (오르막 달리기)", fx: { camp: true, s: { "phys.stamina": 1.5, "phys.speed": 1 }, fatigue: 10 }, result: "팔영산 오르막을 다섯 번 뛰었다. 토할 것 같았는데, 다리가 단단해졌다." },
      { label: "전술 (영상 분석, 포지션 훈련)", fx: { camp: true, s: { "position": 0.8, "mental.focus": 1 }, fatigue: 4, coach: 2 }, result: "밤마다 상대 팀 영상을 봤다. 감독님이 내 질문을 마음에 들어 하셨다." },
    ] },
  { id: "winter_camp", fixed: true, who: "coach",
    text: "{coach}: \"동계훈련이다. 3학년 형들 없이 처음 나가는 대회가 곧이다. 이번 합숙에서 팀을 새로 만든다.\" 어디에 집중할까?",
    choices: [
      { label: "기술 (볼 터치, 슈팅)", fx: { camp: true, s: { "tech.firstTouch": 1, "tech.shoot": 1, "tech.pass": 1 }, fatigue: 6 }, result: "손이 얼어도 공은 차진다. 한겨울 운동장에서 슈팅 500개." },
      { label: "체력 (모래사장 달리기)", fx: { camp: true, s: { "phys.stamina": 1.5, "phys.strength": 1 }, fatigue: 10 }, result: "겨울 바다 모래사장을 달렸다. 바람이 칼 같았다." },
      { label: "전술 (새 포메이션)", fx: { camp: true, s: { "position": 0.8, "mental.teamwork": 1 }, fatigue: 4, coach: 2 }, result: "새로 맞춘 포메이션. 후배들 자리를 잡아 주는 게 내 몫이 됐다." },
    ] },
  { id: "school_trip", fixed: true, who: "narr",
    text: "수학여행 둘째 날 밤. 숙소 옥상에서 {friend|이/가} 묻는다. \"너 고등학교 가서도 축구 할 거야?\"",
    choices: [
      { label: "진지하게 답한다", fx: { s: { "mental.focus": 1.5, "mental.confidence": 1 }, rel: { friend: 5 } }, result: "말로 하니까 오히려 분명해졌다. 왜 이걸 하는지, 어디까지 가고 싶은지." },
      { label: "웃어넘긴다", fx: { morale: 6 }, result: "\"모르지~\" 하고 웃었다. 별이 많았다. 지금은 그걸로 됐다." },
      { label: "같은 질문을 되묻는다", fx: { rel: { friend: 8 }, s: { "mental.teamwork": 1 } }, result: "{friend}의 꿈 얘기를 처음 들었다. 3년 동안 몰랐던 게 많았다." },
    ] },
  { id: "ski_camp", fixed: true, who: "coach",
    text: "스키캠프 출발 전. {coach}께서 축구부만 따로 부르셨다. \"다치면 동계대회 없다. 알아서들 해라.\"",
    choices: [
      { label: "상급 코스에 도전한다", fx: { morale: 9, s: { "mental.competitive": 1.5, "phys.agility": 0.5 } },
        hurt: { p: 0.14, type: "ankle", cause: "스키캠프 상급 코스에서 넘어지며 발목이 돌아갔다.", result: "세 번째로 내려올 때 넘어졌다. 발목이 돌아갔다. 감독님 얼굴이 떠올랐다." },
        result: "넘어지지 않고 끝까지 내려왔다. 다리가 후들거렸지만 짜릿했다." },
      { label: "초급 코스에서 천천히", fx: { morale: 5 }, result: "친구들과 엉거주춤 내려왔다. 다들 웃느라 정신이 없었다." },
      { label: "숙소에서 쉰다", fx: { fatigue: -10, morale: -2 }, result: "창밖으로 친구들이 스키 타는 걸 봤다. 몸은 편했다." },
    ] },
  { id: "festival", fixed: true, who: "narr",
    text: "봉두예술제. 축구부 장기자랑 무대가 잡혔다. 선배가 나를 가리킨다. \"센터는 너다.\"",
    choices: [
      { label: "춤을 맡는다", fx: { morale: 9, s: { "mental.confidence": 1.5, "mental.teamwork": 1 }, fatigue: 4 }, result: "연습 일주일, 무대 3분. 강당이 떠나가라 함성이 터졌다. 영상이 학교 전체에 돌았다." },
      { label: "뒤에서 소품을 맡는다", fx: { s: { "student.attitude": 1.5, "mental.teamwork": 1 }, teacher: 2 }, result: "조명과 소품을 맡았다. 무대가 끝나고 선배가 제일 먼저 나를 찾았다." },
      { label: "객석에서 본다", fx: { fatigue: -5 }, result: "다른 반 공연을 보며, 한 해가 끝나 간다는 걸 실감했다." },
    ] },
  { id: "graduation", fixed: true, who: "narr",
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
  { id: "graduation_me", fixed: true, who: "teacher",
    text: s => {
      const t = s.relations.teacher ?? 50;
      return t >= 70 ? "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 이름을 부르며 손편지를 주신다. 내 편지는 다른 애들 것보다 두 장이 더 두껍다."
        : t >= 45 ? "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 이름을 부르며 손편지를 주신다."
        : "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 손편지를 주신다. 나한테 주실 때 잠깐 망설이시는 것 같았다.";
    },
    choices: [
      { label: "편지를 펼친다", fx: { morale: 5 }, result: "마지막 줄까지 다 읽었다. 고개를 들 수가 없었다." },
      { label: "집에 가서 읽기로 한다", fx: { morale: 3 }, result: "가방 맨 안쪽에 편지를 넣었다. 운동장을 한 바퀴 돌고 교문을 나섰다." },
    ] },

  // ── 류봉두 선생님 ──────────────────────────────
  { id: "t_diary", fixed: true, who: "teacher",
    text: "생활 일기 첫 장에 {teacher}께서 빨간 펜으로 한 줄을 남기셨다. \"운동장에서 네 목소리가 제일 크더라. 교실에서도 들려줄래?\"",
    choices: [
      { label: "답글을 쓴다", fx: { teacher: 6, s: { "student.attitude": 1 } }, result: "\"수업 시간엔 작게 말할게요.\" 다음 날 일기장에 웃는 얼굴이 그려져 있었다." },
      { label: "그냥 넘긴다", fx: {}, result: "일기장을 덮었다. 선생님은 다음 주에도 한 줄을 남기셨다." },
    ] },
  { id: "t_sixth", who: "teacher", school: true, weight: 1.3, cond: s => s.player.condition.fatigue >= 55,
    text: "6교시 국어 시간. 새벽 훈련 때문에 눈꺼풀이 무겁다. {teacher}께서 시를 읽고 계신다.",
    choices: [
      { label: "허벅지를 꼬집으며 버틴다", fx: { s: { "student.academic": 1, "mental.focus": 0.5 }, fatigue: 2, teacher: 2 }, result: "끝까지 버텼다. 선생님이 지나가며 책상을 톡 두드리셨다. 칭찬인지 경고인지 모르겠다." },
      { label: "엎드린다", fx: { fatigue: -6, teacher: -4, s: { "student.attitude": -1 } }, result: "깨어 보니 종이 울렸다. 칠판에 '피곤해도 국어는 국어다'라고 적혀 있었다." },
      { label: "손을 들고 질문한다", fx: { s: { "student.academic": 1.5, "mental.confidence": 0.5 }, teacher: 5 }, result: "\"이 시는 왜 바다 얘기만 해요?\" 반 아이들이 웃었다. 선생님은 그 질문으로 남은 20분을 쓰셨다." },
    ] },
  { id: "t_presentation", fixed: true, who: "teacher",
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
      { label: "그 주 안에 다 읽는다", fx: { s: { "mental.focus": 1, "student.academic": 1.5, "mental.confidence": 0.5 }, teacher: 6 }, result: "\"남들이 쉴 때 한 번 더 찼다\"에 밑줄을 그었다. 그 문장을 써서 드렸다." },
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
      { label: "고개만 끄덕인다", fx: { teacher: -2 }, result: "\"알겠습니다.\" 교무실을 나오며 한숨을 쉬었다." },
    ] },
  { id: "t_counsel", fixed: true, who: "teacher",
    text: s => {
      const st = s.player.stats.student;
      return st.attitude >= 65 && st.academic >= 55
        ? "3자 진로 상담. 엄마, {teacher}, 그리고 나. 선생님이 생활기록부를 펼치신다. \"3년 동안 성실했어요. 고등학교에서도 이런 건 다 봅니다.\" 엄마 눈가가 빨개진다."
        : "3자 진로 상담. 엄마, {teacher}, 그리고 나. 선생님이 생활기록부를 펼치시더니 잠깐 말을 고르신다. \"운동은 정말 열심히 했어요. 다만…\" 엄마가 내 쪽을 본다.";
    },
    choices: [
      { label: "내 생각을 먼저 말한다", fx: { s: { "mental.confidence": 1.5, "student.attitude": 1 }, teacher: 5, morale: 4 }, result: "가고 싶은 학교와 이유를 말했다. 엄마와 선생님이 동시에 고개를 끄덕였다." },
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
    : `훈련 직전 피로가 ${Math.round(p.condition.fatigue)}이었다. 지친 상태에서는 다칠 확률이 크게 오른다.${p.traits.includes("glassBody") ? " 원래 몸이 약한 편이니 더 조심해야 한다." : ""}`;
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
  if (last != null && state.calendar.turn - last < (ev.afterLoss ? 4 : 12)) return false;
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
  // 경기에서 졌다면 해변 모래 훈련이 먼저 찾아옴
  const beach = EVENTS.find(e => e.afterLoss);
  if (beach && eligible(state, beach, info) && chance(0.6)) { state.pendingEvent = { id: beach.id }; return; }
  if (!chance(EVENT_CHANCE)) return;
  const list = EVENTS.filter(e => !e.afterLoss && !e.fixed && eligible(state, e, info));
  if (!list.length) return;
  const ev = weighted(list.map(e => [e, (e.weight || 1) * (state.seenEvents?.includes(e.id) ? 0.35 : 1)]));
  state.pendingEvent = { id: ev.id };
}

function eventVars(state) {
  return {
    name: state.player.name, coach: STAFF.coach, assistant: STAFF.assistant, teacher: STAFF.teacher,
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
    return run ? "동기들이 하나둘 손을 들었다. 만장일치. 감독님이 주황색 완장을 건넸다." : "다른 친구를 추천했는데, 동기들이 오히려 네 이름을 불렀다. 감독님이 완장을 건넸다.";
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
    story: c => `중1 때는 벤치에서 물통을 날랐다. 경기 명단에 이름이 없는 날이 더 많았다.\n\n중3, ${c.nameEun} 팀에서 가장 먼저 이름이 불리는 선수가 됐다. 3학년 평균 평점 ${c.g3Rating.toFixed(2)}.\n\n늦게 핀 꽃이 가장 오래 간다는 말, 이제는 조금 믿게 됐다. ${c.schoolName}에서도 그럴 것이다.` },

  { id: "captain", grade: "H", title: "주장", img: "ending_captain",
    cond: c => c.captain,
    story: c => `1년 동안 주황색 완장을 찼다.\n\n잘한 날보다, 진 날 라커룸에서 먼저 일어나 박수를 친 날들이 더 기억에 남는다. 후배들은 ${c.nameEul} "형"보다 "주장"이라고 더 많이 불렀다.\n\n졸업식 날, 완장은 ${c.juniorName || "후배"}에게 넘어갔다. ${c.schoolName}에서 또 다른 시작이다.` },

  { id: "model", grade: "H", title: "모범 학생선수", img: "ending_graduate",
    cond: c => c.academic >= 75 && c.attitude >= 75,
    story: c => `졸업식에서 ${c.teacherName}이 ${c.name}의 이름을 한 번 더 불렀다. 학교장상.\n\n훈련 끝나고 도서관, 시험 전날엔 단톡방 대신 문제집. 축구도 공부도 놓지 않은 3년이었다.\n\n${c.schoolName}에서도 그 균형은 계속된다.` },

  { id: "nationalSchool", grade: "A", title: "전국 강호 진학", img: "ending_highschool",
    cond: c => c.tier === "national",
    story: c => `${c.schoolName}. 전국대회 단골 우승 후보.\n\n입학 테스트 날, 운동장에 선 1학년만 서른 명이 넘었다. 고흥에서는 에이스였지만 여기서는 다시 맨 아래부터다.\n\n괜찮다. 중1 때도 그랬으니까.` },

  { id: "regionalBest", grade: "A", title: "지역 최고의 선수", img: "ending_highschool",
    cond: c => c.tier === "regional" && (c.g3Rating >= 7.1 || c.g3LeagueTitle),
    story: c => `전남 권역 주말리그에서 ${c.nameIrane} 이름을 모르는 지도자는 없었다.\n\n3년 통산 ${c.apps}경기 ${c.goals}골 ${c.assists}도움. ${c.schoolEun} 망설이지 않고 손을 내밀었다.\n\n더 큰 무대는 이제부터다.` },

  { id: "academicBan", grade: "D", title: "학업 부진으로 출전 정지", img: "ending_setback",
    cond: c => c.suspended >= 4,
    story: c => `공식 경기에 ${c.suspended}번 나서지 못했다. 이유는 부상이 아니라 성적표였다.\n\n관중석에서 동료들 경기를 보던 날들이 가장 길었다. "공부도 훈련이다." 감독님 말이 그제야 들렸다.\n\n고등학교에서는 다르게 할 수 있다. 아직 늦지 않았다.` },

  { id: "injury", grade: "D", title: "부상으로 좌절", img: "ending_setback",
    cond: c => c.injuryWeeks >= 22 && ["footballHS", "general", "regional", "none"].includes(c.tier),
    story: c => `3년 중 ${c.injuryWeeks}주를 재활실에서 보냈다.\n\n몸이 회복되면 다른 곳이 아팠다. 쉬어야 할 때 쉬지 못했던 날들이 하나씩 떠오른다.\n\n그래도 축구화를 버리지는 않았다. 몸을 아끼는 법을 배운 것도 3년의 결과다.` },

  { id: "bench", grade: "C", title: "만년 후보", img: "ending_bench",
    cond: c => c.g3StartRatio < 0.3,
    story: c => `3학년이 돼서도 선발 명단에 이름이 올라간 날은 손에 꼽았다.\n\n그래도 훈련엔 한 번도 빠지지 않았다. 교체로 들어간 ${c.apps}경기, 그 몇 분들을 위해 3년을 뛰었다.\n\n${c.schoolName}에서 다시 시작한다. 벤치에서 본 것들도 다 실력이 된다.` },

  { id: "dream", grade: "C", title: "벤치의 꿈", img: "ending_bench",
    cond: c => c.apps < 25,
    story: c => `3년 동안 공식 경기에 나선 건 ${c.apps}번.\n\n유니폼은 늘 깨끗했다. 그래도 경기 전날마다 축구화 끈을 새로 묶었다. 언젠가 부를지 모르니까.\n\n꿈은 아직 벤치 위에 그대로 있다.` },

  { id: "study", grade: "B", title: "공부형 학생선수", img: "ending_graduate",
    cond: c => c.tier === "general" && c.academic >= 70,
    story: c => `${c.schoolName}에 진학했다. 축구부가 아니라 일반 진학이다.\n\n후회는 없다. 3년 동안 배운 건 공 차는 법만이 아니었다. 지는 법, 버티는 법, 다시 일어나는 법.\n\n주말이면 여전히 고흥대서중 운동장에 나가 후배들 공을 받아 준다.` },

  { id: "ordinary", grade: "B", title: "평범한 학생선수", img: "ending_graduate",
    cond: () => true,
    story: c => `특별한 기록은 없었다. ${c.apps}경기, ${c.goals}골, 그리고 3년.\n\n그래도 운동장에서 웃던 날이 훨씬 많았다. 친구 ${c.friendName || ""}와 바닷가를 걷던 저녁도, 비 맞으며 찼던 공도 다 남았다.\n\n${c.schoolName}에서도 공은 계속 찬다.` },
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
const BEST_RANK = { "우승": 6, "결승": 5, "4강": 4, "8강": 3, "16강": 2, "토너먼트 진출": 1, "조별리그 탈락": 0, "조별리그": 0 };

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
      `${state.player.name}, 반갑다. 내년 봄부터 같이 운동한다.\n\n중학교에서 했던 대로만 해라. 남은 겨울도 몸 관리 잘하고.`);
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
    mail(state, "coach", `새 특성: ${info.label}`,
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
const {turnInfo, label} = __m["js/engine/calendar.js"];
const {applyGain, expandGains, growBody, weeklyDrift, hasTrait} = __m["js/engine/growth.js"];
const {matchFor} = __m["js/engine/season.js"];
const {prepareMatch, autoPlay, finishMatch} = __m["js/engine/match.js"];
const {previewMail, weeklyAdvice, drillFor} = __m["js/engine/advice.js"];
const {adjustRel, weeklyRelations, relationsNewYear, rivalGap} = __m["js/engine/relations.js"];
const {rollEvent} = __m["js/engine/events.js"];
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
      if (inj.total >= 6) state.flags.comebackReady = true;
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
    `평균 ${Math.round(score)}점, 반에서 28명 중 ${rank}등 정도야.\n\n${comment}\n\n${studied ? "시험 주에 공부한 게 점수에 보였어." : "시험 주에 공부를 한 칸도 안 했더구나. 한 칸만 했어도 5점은 더 나왔을 거야."}${score >= 70 ? "\n\n감독님께도 말씀드렸어. 좋아하시더라." : ""}`);
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
      : gap > 8 ? "앞에 선 형들과는 아직 거리가 있다. 조급해하지 말고, 하루하루 쌓아라."
      : "선발까지 그리 멀지 않다. 한 학기면 충분히 따라잡을 수 있는 거리다.",
    `이번 학기엔 ${josaWord(STAT_LABEL[weak], "을", "를")} 채워 와라. 네 자리에서 지금 제일 아쉬운 부분이다.${drill ? ` ${josaWord(drill.label, "이", "가")} 도움이 될 거다.` : ""}`];
  mail(state, "coach", `이번 학기 역할: ${role.label}`, body.join("\n\n"));
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

  if (leaving.length) mail(state, "group", "선배들이 졸업했습니다",
    `${leaving.join(", ")} 선배가 졸업했다. 고등학교 가서도 잘하실 거다.\n선배들이 남긴 번호와 자리는 이제 우리가 채워야 한다.`);
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
    lg ? "팀으로도 쉽지 않은 한 해였다. 그래도 끝까지 같이 뛰었다." : "",
    oldGrade === 1 ? "이제 후배가 들어온다. 선배가 된다는 건 책임이 생긴다는 뜻이다." : "이제 3학년이다. 진학이 걸린 해다. 고등학교 감독님들이 경기를 보러 오실 거다.",
  ].filter(Boolean).join("\n\n"));
  if (oldGrade === 1 && CAPTAINS?.[2]) {
    mail(state, "group", "새 시즌, 새 주장",
      `${STAFF.coach}: 올해 주장은 ${CAPTAINS[2]}${_bat(CAPTAINS[2]) ? "이다" : "다"}. 다들 박수.\n\n주장 ${CAPTAINS[2]}: 작년 선배들만큼은 못 해도, 우리 학년은 절대 안 무너진다. 2학년들도 이제 선배다. 후배들 잘 챙겨라.`);
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
    const rivals = activeRoster(state).filter(m => m.cohort === "동기").sort((a, b) => b.ovrNow - a.ovrNow);
    const rival = rivals[0];
    if (rival) {
      const tried = state.pending?.tried || [];
      if (tried.includes(n)) return { ok: false, msg: `${n}번은 이미 ${rival.name}에게 넘어갔다.` };
      const pWin = clamp(0.5 + (ovr(p) - rival.ovrNow) / 20 + (state.relations.coach - 50) / 100, 0.15, 0.9);
      if (!chance(pWin)) {
        state.pending = { type: "number", tried: [...tried, n] };
        mail(state, "group", `${n}번 쟁탈전`, `${rival.name}도 ${n}번을 원했다. 감독님은 ${rival.name}의 손을 들어 줬다.`);
        return { ok: false, msg: `${rival.name}도 ${n}번을 원했고, 감독님은 ${rival.name}을 골랐습니다. 다른 번호를 골라 주세요.` };
      }
      mail(state, "group", `${n}번 쟁탈전`, `${rival.name}도 ${n}번을 노렸지만, 감독님은 ${p.name}에게 ${n}번을 맡겼다.`);
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
// 팝업: 행동 고르기, 주간 결과, 메시지, 저장, 등번호, 학년 마무리, 졸업








const root = () => document.getElementById("modal-root");

function openModal(html, mount, { dismissable = true, onClose } = {}) {
  const el = document.createElement("div");
  el.className = "backdrop";
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  root().appendChild(el);
  const close = () => { el.remove(); document.removeEventListener("keydown", onKey); onClose?.(); };
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
      ${ups.slice(0, 8).map(d => `<div class="r"><span>${d.label}</span><span class="num mute">${fl(d.from)} → <b style="color:var(--chalk)">${fl(d.to)}</b></span>
        <span class="num up" style="min-width:44px;text-align:right">${crossed(d) ? "▲ " : ""}${signed(d.d)}</span></div>`).join("")}
      ${downs.slice(0, 3).map(d => `<div class="r"><span>${d.label}</span><span class="num mute">${fl(d.from)} → ${fl(d.to)}</span>
        <span class="num down" style="min-width:44px;text-align:right">${signed(d.d)}</span></div>`).join("")}
      ${Math.abs(rep.coachDelta) >= 0.5 ? `<div class="r"><span>감독 신뢰</span><span></span><span class="num ${rep.coachDelta > 0 ? "up" : "down"}">${signed(rep.coachDelta)}</span></div>` : ""}
    </div>
    ${rep.mails.length ? `<p class="mute" style="font-size:13px">💬 새 메시지 ${rep.mails.length}개</p>` : ""}
    <button class="btn btn-kit btn-wide" data-close>확인</button>`;
  openModal(html, null, { onClose: done });
}

function mailModal(m) {
  openModal(`<button class="close" data-close aria-label="닫기">×</button>
    <p class="sub">${esc(m.from)}</p><h2>${esc(m.title)}</h2>
    <p class="mail-body">${esc(m.body)}</p>
    <button class="btn btn-wide" data-close>닫기</button>`);
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

function graduationModal(app) {
  const s = app.state, p = s.player, r = s.record;
  const avg = r.ratings.length ? (r.ratings.reduce((a, b) => a + b, 0) / r.ratings.length).toFixed(2) : "–";
  openModal(`<h2>졸업</h2>
    <p class="sub">고흥대서중학교에서의 3년이 끝났습니다.</p>
    <dl class="kv" style="margin-bottom:14px">
      <dt>최종 능력치</dt><dd class="num">${fl(ovr(p))}</dd>
      <dt>키</dt><dd class="num">${p.body.height.toFixed(1)}cm</dd>
      <dt>통산 기록</dt><dd class="num">${r.apps}경기 ${r.goals}골 ${r.assists}도움</dd>
      <dt>평균 평점</dt><dd class="num">${avg}</dd>
      <dt>학업</dt><dd class="num">${fl(p.stats.student.academic)}</dd>
      <dt>등번호</dt><dd class="num">${p.numberHistory.map(h => `${h.number}번`).join(" → ")}</dd>
    </dl>
    <div class="alert gold">진학 결정과 엔딩은 다음 업데이트에서 추가됩니다.</div>
    <button class="btn btn-kit btn-wide" data-close style="margin-top:14px">타이틀로</button>`, null, { onClose: () => app.toTitle() });
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
    <div class="vn-choices" id="evc">${v.ev.choices.map((c, i) => `<button class="vn-choice" data-i="${i}">${esc(fillText(c.label, vars))}</button>`).join("")}</div>`;
  openModal(html, (el, close) => {
    el.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => {
      const r = chooseEvent(state, +b.dataset.i);
      app.saveTo("auto");
      const chips = r.changes.map(c => {
        if (c.note) return `<span class="evchip down">${esc(c.label)} ${esc(c.note)}</span>`;
        const good = c.invert ? c.d < 0 : c.d > 0;
        return `<span class="evchip ${good ? "up" : "down"}">${esc(c.label)} ${c.d > 0 ? "+" : ""}${Math.abs(c.d) < 1 ? c.d.toFixed(1) : Math.round(c.d)}</span>`;
      }).join("");
      el.querySelector("#evc").outerHTML = `<p class="ev-result">${esc(fillText(r.result, eventVars(state)))}</p>
        ${chips ? `<div class="evchips">${chips}</div>` : ""}
        <button class="btn btn-kit btn-wide" data-close style="margin-top:14px">확인</button>`;
      el.querySelector("[data-close]").addEventListener("click", close);
      el.querySelector("[data-close]").focus({ preventScroll: true });
    }));
  }, { dismissable: false, onClose: done });
}

return { openModal, ask, actionPicker, weekReport, mailModal, saveModal, numberModal, yearModal, graduationModal, eventModal };
})();
(__fix["js/ui/modals.js"] || []).forEach(f => f());

// ── js/ui/minigames.js
__m["js/ui/minigames.js"] = (function () {
const {openModal} = __m["js/ui/modals.js"];
// 훈련 미니게임 4종. 결과 등급에 따라 그 훈련의 능력치 상승량이 달라집니다.
//   S ×1.5 / A ×1.25 / B ×1.0 / C ×0.8   (건너뛰면 B)
// 해당 능력치가 높을수록 조금씩 쉬워집니다.

const GRADES = { S: 1.5, A: 1.25, B: 1.0, C: 0.8 };
const STAT_FOR = { shooting: "tech.shoot", passing: "tech.pass", dribble: "tech.dribble", weight: "phys.strength" };
const INFO = {
  shooting: { title: "슈팅 훈련", tag: "SHOOTING DRILL", how: "조준점이 골문 위를 움직입니다. 골키퍼를 피해 구석을 노려 누르세요. 다섯 번 찹니다.", btn: "슈팅" },
  passing:  { title: "패스 훈련", tag: "PASSING DRILL", how: "동료 등번호를 1부터 6까지 순서대로 빠르게 누르세요. 흰 유니폼 상대를 누르면 끊깁니다.", btn: null },
  dribble:  { title: "드리블 훈련", tag: "DRIBBLE DRILL", how: "달려드는 수비를 왼쪽·오른쪽으로 피하세요. 12초 버티면 끝입니다. 방향키나 밀기도 됩니다.", btn: null },
  weight:   { title: "웨이트 트레이닝", tag: "STRENGTH", how: "줄어드는 원이 주황 테두리에 닿는 순간 누르세요. 여섯 번 들어 올립니다.", btn: "들어 올리기" },
};
const ease = v => Math.max(0, Math.min(1, (v - 20) / 60));
function statFor(kind) { return STAT_FOR[kind]; }

// 공통 그래픽 조각
const SHIRT = (fill, stroke, num, numFill = "#fff") => `<path d="M-5 -4 L-2 -6 Q0 -4.6 2 -6 L5 -4 L6.5 -0.5 L4 0.6 L4 6 L-4 6 L-4 0.6 L-6.5 -0.5 Z" fill="${fill}" stroke="${stroke}" stroke-width=".6" stroke-linejoin="round"/>
  ${num != null ? `<text y="3.2" text-anchor="middle" class="mg-num" fill="${numFill}">${num}</text>` : ""}`;
const BALL = r => `<g class="mg-ball"><circle r="${r}" fill="#fff" stroke="#111" stroke-width="${r * 0.12}"/><path d="M0 ${-r * 0.42} L${r * 0.4} ${-r * 0.12} L${r * 0.25} ${r * 0.36} L${-r * 0.25} ${r * 0.36} L${-r * 0.4} ${-r * 0.12} Z" fill="#111"/></g>`;
const DEFS = `<defs>
  <linearGradient id="mgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081A"/><stop offset="1" stop-color="#18245E"/></linearGradient>
  <linearGradient id="mgTurf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F8A4C"/><stop offset="1" stop-color="#14663A"/></linearGradient>
  <pattern id="mgNet" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H3 M0 0 V3" stroke="rgba(255,255,255,.35)" stroke-width=".35"/></pattern>
  <pattern id="mgCrowd" width="4" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1.2" r=".7" fill="rgba(255,255,255,.18)"/><circle cx="3" cy="2.2" r=".6" fill="rgba(255,140,60,.22)"/></pattern>
  <radialGradient id="mgLight" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="rgba(255,255,255,.28)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
  <filter id="mgGlow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

function playMinigame(kind, statValue, slotLabel) {
  return new Promise(resolve => {
    const info = INFO[kind];
    let finished = false, stop = () => {};
    const html = `<div class="mg">
      <div class="mg-head"><span class="eyebrow">${info.tag}</span><h2>${info.title}</h2><span class="mute">${slotLabel}</span></div>
      <p class="sub">${info.how}</p>
      <div class="mg-area k-${kind}" id="mga"></div>
      <div class="mg-status" id="mgs" aria-live="polite"></div>
      <div class="ctl-row" id="mgc"><button class="btn btn-ghost" data-skip>건너뛰기 (B등급)</button><button class="btn btn-kit" data-go>시작</button></div>
    </div>`;
    openModal(html, (el, close) => {
      const area = el.querySelector("#mga"), status = el.querySelector("#mgs"), ctl = el.querySelector("#mgc");
      PREVIEW[kind](area);
      const done = grade => {
        if (finished) return; finished = true; stop();
        const mult = GRADES[grade];
        area.insertAdjacentHTML("beforeend", `<div class="mg-result"><span class="mg-bigrade m${grade}">${grade}</span><span>훈련 효과 ×${mult}</span></div>`);
        status.textContent = "";
        ctl.innerHTML = `<button class="btn btn-kit btn-wide" data-ok>확인</button>`;
        ctl.querySelector("[data-ok]").addEventListener("click", () => { close(); resolve({ grade, mult }); });
        ctl.querySelector("[data-ok]").focus({ preventScroll: true });
      };
      ctl.querySelector("[data-skip]").addEventListener("click", () => { finished = true; stop(); close(); resolve({ grade: "B", mult: 1, skipped: true }); });
      ctl.querySelector("[data-go]").addEventListener("click", () => {
        ctl.innerHTML = info.btn ? `<button class="btn btn-kit btn-wide mg-act" data-act>${info.btn}</button>` : "";
        stop = GAMES[kind](area, status, ctl, ease(statValue), done) || (() => {});
      });
    }, { dismissable: false });
  });
}

// 시작 전 미리보기 화면
const PREVIEW = {
  shooting: area => { area.innerHTML = shootScene(); },
  passing: area => { area.innerHTML = `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}${pitch()}<text x="50" y="33" class="mg-cap">준비되면 시작</text></svg>`; },
  dribble: area => { area.innerHTML = `<div class="mg-lanes"><div class="mg-turfscroll"></div><div class="mg-me"><svg viewBox="-8 -8 16 16">${SHIRT("#FF6B1A", "#fff", null)}</svg></div></div>`; },
  weight: area => { area.innerHTML = weightScene(); },
};

// ── 슈팅 ────────────────────────────
function shootScene() {
  return `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}
    <rect width="100" height="60" fill="url(#mgSky)"/>
    <rect y="0" width="100" height="16" fill="url(#mgCrowd)"/>
    <rect width="100" height="60" fill="url(#mgLight)"/>
    <rect y="40" width="100" height="20" fill="url(#mgTurf)"/>
    <path d="M0 40 H100" stroke="rgba(255,255,255,.5)" stroke-width=".4"/>
    <rect x="12" y="14" width="76" height="27" fill="url(#mgNet)"/>
    <path d="M12 41 V14 H88 V41" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
    <g transform="translate(0,40)"><g id="gk" class="mg-gkmove"><g class="mg-keeper">
      <rect x="-5" y="-15" width="10" height="11" rx="2" fill="#2D3FD1" stroke="#fff" stroke-width=".4"/>
      <rect x="-9.5" y="-14" width="5" height="2.4" rx="1.2" fill="#2D3FD1"/><rect x="4.5" y="-14" width="5" height="2.4" rx="1.2" fill="#2D3FD1"/>
      <circle cx="-10" cy="-12.8" r="1.6" fill="#FFC93C"/><circle cx="10" cy="-12.8" r="1.6" fill="#FFC93C"/>
      <circle cy="-18" r="3" fill="#F2C49B"/><rect x="-4" y="-4" width="3" height="4" fill="#111"/><rect x="1" y="-4" width="3" height="4" fill="#111"/></g></g></g>
    <g id="aim" transform="translate(50,26)" filter="url(#mgGlow)"><circle r="3.2" fill="none" stroke="#FFC93C" stroke-width=".7"/><path d="M-5 0 H-2 M2 0 H5 M0 -5 V-2 M0 2 V5" stroke="#FFC93C" stroke-width=".7"/></g>
    <g transform="translate(50,54)"><g id="sball">${BALL(2.2)}</g></g>
    <g id="balls"></g>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(5)}</span><span id="pts" class="num">0점</span></div>`;
}
function shooting(area, status, ctl, e, done) {
  area.innerHTML = shootScene();
  const aim = area.querySelector("#aim"), gk = area.querySelector("#gk"), ball = area.querySelector("#sball"), dots = area.querySelectorAll("#dots i"), pts = area.querySelector("#pts");
  const period = 1500 - e * 650;
  const gkW = 26 - e * 8;
  let shot = 0, score = 0, x = 50, y = 26, t0 = performance.now(), raf, lock = false, gkC = 50;
  const placeGk = () => { gkC = 30 + Math.random() * 40; gk.style.transform = `translateX(${gkC}px)`; };
  placeGk();
  const loop = now => {
    const t = (now - t0) / period;
    x = 50 + Math.sin(t * Math.PI * 2) * 34; y = 27 + Math.sin(t * Math.PI * 3.1) * 8;
    aim.setAttribute("transform", `translate(${x},${y})`);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const fire = () => {
    if (lock) return; lock = true;
    const saved = Math.abs(x - gkC) <= gkW / 2;
    const corner = x < 26 || x > 74;
    const p = saved ? 0 : corner ? 2 : 1;
    score += p;
    // 공이 날아가고 골키퍼가 몸을 날림
    ball.style.transition = "transform .32s cubic-bezier(.2,.7,.3,1)";
    ball.style.transform = `translate(${x - 50}px, ${y - 54}px) scale(.7)`;
    const dive = Math.max(-14, Math.min(14, (x - gkC) * 0.8));
    gk.querySelector(".mg-keeper").style.transform = `translateX(${dive}px) rotate(${dive * 3}deg)`;
    const d = dots[shot]; d.className = saved ? "miss" : corner ? "top" : "hit";
    shot++;
    pts.textContent = `${score}점`;
    status.innerHTML = `<b class="${saved ? "down" : "up"}">${saved ? "막혔다!" : corner ? "구석! +2" : "골! +1"}</b>`;
    setTimeout(() => {
      area.querySelector("#balls").insertAdjacentHTML("beforeend", `<g transform="translate(${x},${y}) scale(.55)" opacity=".75">${BALL(2.2)}</g>`);
      ball.style.transition = "none"; ball.style.transform = "";
      gk.querySelector(".mg-keeper").style.transform = "";
      if (shot >= 5) return done(score >= 8 ? "S" : score >= 6 ? "A" : score >= 4 ? "B" : "C");
      placeGk(); lock = false;
    }, 650);
  };
  ctl.querySelector("[data-act]").addEventListener("click", fire);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); fire(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 패스 ────────────────────────────
function pitch() {
  return `<rect width="100" height="60" fill="url(#mgTurf)"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 16.7}" width="8.35" height="60" fill="rgba(255,255,255,.035)"/>`).join("")}
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".4"><rect x="2" y="2" width="96" height="56"/><path d="M50 2 V58"/><circle cx="50" cy="30" r="8"/><rect x="2" y="17" width="12" height="26"/><rect x="86" y="17" width="12" height="26"/></g>`;
}
function passing(area, status, ctl, e, done) {
  const limit = 6 + e * 3;
  const spots = [];
  const far = (x, y) => spots.every(s => Math.hypot(s.x - x, s.y - y) > 15);
  while (spots.length < 8) { const x = 9 + Math.random() * 82, y = 10 + Math.random() * 40; if (far(x, y)) spots.push({ x, y }); }
  area.innerHTML = `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}${pitch()}
    <g id="lines"></g>
    ${spots.map((s, i) => i < 6
      ? `<g class="mg-mate" data-n="${i + 1}" transform="translate(${s.x},${s.y}) scale(1.15)"><circle r="7.5" fill="transparent"/>${SHIRT("#FF6B1A", "#fff", i + 1)}</g>`
      : `<g class="mg-foe" data-foe transform="translate(${s.x},${s.y}) scale(1.1)"><circle r="7" fill="transparent"/>${SHIRT("#F4F6FF", "#2D3FD1", null)}</g>`).join("")}
    <g id="pball" transform="translate(50,30)">${BALL(1.6)}</g>
  </svg>
  <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="nx" class="num">다음 1</span></div>`;
  const lines = area.querySelector("#lines"), pball = area.querySelector("#pball"), tbar = area.querySelector("#tbar"), nx = area.querySelector("#nx");
  let nextN = 1, mistakes = 0, start = performance.now(), timer, last = { x: 50, y: 30 };
  const tick = () => {
    const left = limit - (performance.now() - start) / 1000;
    tbar.style.width = `${Math.max(0, left / limit) * 100}%`;
    tbar.className = left < limit * 0.3 ? "low" : "";
    status.textContent = mistakes ? `실수 ${mistakes}` : "";
    if (left <= 0) return finish();
    timer = requestAnimationFrame(tick);
  };
  const finish = () => {
    cancelAnimationFrame(timer);
    const used = (performance.now() - start) / 1000, made = nextN - 1;
    done(made === 6 && mistakes === 0 && used < limit * 0.65 ? "S" : made === 6 && mistakes <= 1 ? "A" : made >= 4 ? "B" : "C");
  };
  area.querySelectorAll("[data-n]").forEach(g => g.addEventListener("pointerdown", () => {
    const s = spots[+g.dataset.n - 1];
    if (+g.dataset.n === nextN) {
      g.classList.add("ok");
      lines.insertAdjacentHTML("beforeend", `<line x1="${last.x}" y1="${last.y}" x2="${s.x}" y2="${s.y}" class="mg-pass"/>`);
      pball.setAttribute("transform", `translate(${s.x + 3},${s.y + 5})`);
      last = s; nextN++; nx.textContent = nextN <= 6 ? `다음 ${nextN}` : "완료";
      if (nextN > 6) finish();
    } else if (!g.classList.contains("ok")) { mistakes++; g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 260); }
  }));
  area.querySelectorAll("[data-foe]").forEach(g => g.addEventListener("pointerdown", () => { mistakes += 2; g.classList.add("bad"); setTimeout(() => g.classList.remove("bad"), 260); }));
  timer = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(timer);
}

// ── 드리블 ──────────────────────────
function dribble(area, status, ctl, e, done) {
  const DURATION = 12000;
  const speed = 34 - e * 10;
  const gapMs = 820 - e * 220;
  area.innerHTML = `<div class="mg-lanes" id="lanes"><div class="mg-turfscroll"></div>
      <div class="mg-me" id="me"><svg viewBox="-8 -8 16 16">${SHIRT("#FF6B1A", "#fff", null)}</svg><svg class="mg-dball" viewBox="-3 -3 6 6">${BALL(2.4)}</svg></div></div>
    <div class="mg-hud"><span class="mg-timer"><i id="tbar"></i></span><span id="hits" class="num">부딪힘 0</span></div>`;
  ctl.innerHTML = `<button class="btn mg-dir" data-l>◀ 왼쪽</button><button class="btn mg-dir" data-r>오른쪽 ▶</button>`;
  const lanes = area.querySelector("#lanes"), me = area.querySelector("#me"), tbar = area.querySelector("#tbar"), hitsEl = area.querySelector("#hits");
  let lane = 1, hits = 0, foes = [], start = performance.now(), last = start, spawnAt = start + 400, raf;
  const setLane = n => { lane = Math.max(0, Math.min(2, n)); me.style.left = `${lane * 33.33 + 16.66}%`; };
  setLane(1);
  ctl.querySelector("[data-l]").addEventListener("pointerdown", () => setLane(lane - 1));
  ctl.querySelector("[data-r]").addEventListener("pointerdown", () => setLane(lane + 1));
  const key = ev => { if (ev.key === "ArrowLeft") setLane(lane - 1); if (ev.key === "ArrowRight") setLane(lane + 1); };
  document.addEventListener("keydown", key);
  let sx = null;
  lanes.addEventListener("pointerdown", ev => { sx = ev.clientX; });
  lanes.addEventListener("pointerup", ev => { if (sx != null && Math.abs(ev.clientX - sx) > 30) setLane(lane + (ev.clientX > sx ? 1 : -1)); sx = null; });
  const loop = now => {
    const dt = (now - last) / 1000; last = now;
    if (now >= spawnAt) {
      const l = Math.floor(Math.random() * 3);
      const el = document.createElement("div"); el.className = "mg-foe-d";
      el.innerHTML = Math.random() < 0.25 ? `<svg viewBox="-6 -6 12 12"><path d="M0 -5 L4 5 H-4 Z" fill="#FF8A1F" stroke="#fff" stroke-width=".6"/><rect x="-3" y="1" width="6" height="1.2" fill="#fff"/></svg>`
        : `<svg viewBox="-8 -8 16 16">${SHIRT("#F4F6FF", "#2D3FD1", null)}</svg>`;
      el.style.left = `${l * 33.33 + 16.66}%`; lanes.appendChild(el);
      foes.push({ el, l, y: -10, hit: false });
      spawnAt = now + gapMs * (0.7 + Math.random() * 0.6);
    }
    for (const f of foes) {
      f.y += speed * dt * 3;
      f.el.style.top = `${f.y}%`;
      if (!f.hit && f.y > 74 && f.y < 92 && f.l === lane) { f.hit = true; hits++; f.el.classList.add("hit"); lanes.classList.add("shake"); setTimeout(() => lanes.classList.remove("shake"), 200); hitsEl.textContent = `부딪힘 ${hits}`; }
    }
    foes = foes.filter(f => { if (f.y > 110) { f.el.remove(); return false; } return true; });
    const left = (DURATION - (now - start)) / 1000;
    tbar.style.width = `${Math.max(0, left / 12) * 100}%`;
    if (left <= 0) return done(hits === 0 ? "S" : hits === 1 ? "A" : hits <= 3 ? "B" : "C");
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

// ── 웨이트 ──────────────────────────
function weightScene() {
  return `<svg viewBox="0 0 100 60" class="mg-svg">${DEFS}
    <rect width="100" height="60" fill="#121A44"/>
    <rect width="100" height="60" fill="url(#mgLight)"/>
    <rect y="48" width="100" height="12" fill="#0A0F2A"/><path d="M0 48 H100" stroke="rgba(255,255,255,.12)"/>
    <g transform="translate(50,30)"><g id="bar" class="mg-bar">
      <rect x="-34" y="-.9" width="68" height="1.8" rx=".9" fill="#C9D1DE"/>
      <rect x="-31" y="-8" width="4" height="16" rx="1" fill="#1B1F2E" stroke="#3B4466"/><rect x="-27" y="-6" width="3" height="12" rx="1" fill="#FF6B1A"/>
      <rect x="27" y="-8" width="4" height="16" rx="1" fill="#1B1F2E" stroke="#3B4466"/><rect x="24" y="-6" width="3" height="12" rx="1" fill="#FF6B1A"/>
    </g></g>
    <circle cx="50" cy="30" r="10" class="mg-target"/>
    <circle id="ring" cx="50" cy="30" r="26" class="mg-ring"/>
  </svg>
  <div class="mg-hud"><span class="mg-dots" id="dots">${"<i></i>".repeat(6)}</span><span id="pts" class="num">0점</span></div>`;
}
function weight(area, status, ctl, e, done) {
  area.innerHTML = weightScene();
  const ring = area.querySelector("#ring"), bar = area.querySelector("#bar"), dots = area.querySelectorAll("#dots i"), ptsEl = area.querySelector("#pts");
  const dur = 1300 + e * 300;
  const tol = 1.6 + e * 1.4;
  let rep = 0, score = 0, t0 = performance.now(), raf, lock = false;
  const loop = now => {
    const k = ((now - t0) % dur) / dur;
    ring.setAttribute("r", (26 - k * 22).toFixed(2));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const lift = () => {
    if (lock) return; lock = true;
    const r = +ring.getAttribute("r"), err = Math.abs(r - 10);
    const pts = err <= tol ? 2 : err <= tol * 2.2 ? 1 : 0;
    score += pts;
    dots[rep].className = pts === 2 ? "top" : pts === 1 ? "hit" : "miss";
    rep++;
    ptsEl.textContent = `${score}점`;
    status.innerHTML = `<b class="${pts ? "up" : "down"}">${pts === 2 ? "완벽!" : pts === 1 ? "좋아" : "자세가 무너졌다"}</b>`;
    ring.classList.add(pts === 2 ? "perfect" : pts === 1 ? "good" : "miss");
    bar.classList.add(pts ? "up" : "shake");
    setTimeout(() => {
      ring.classList.remove("perfect", "good", "miss"); bar.classList.remove("up", "shake");
      if (rep >= 6) return done(score >= 10 ? "S" : score >= 7 ? "A" : score >= 4 ? "B" : "C");
      t0 = performance.now(); lock = false;
    }, 480);
  };
  ctl.querySelector("[data-act]").addEventListener("click", lift);
  const key = ev => { if (ev.code === "Space" || ev.key === "Enter") { ev.preventDefault(); lift(); } };
  document.addEventListener("keydown", key);
  return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", key); };
}

const GAMES = { shooting, passing, dribble, weight };

return { GRADES, statFor, playMinigame };
})();
(__fix["js/ui/minigames.js"] || []).forEach(f => f());

// ── js/ui/match.js
__m["js/ui/match.js"] = (function () {
const {next, resolve, autoChoice, autoPlay, finishMatch, STATUS_LABEL} = __m["js/engine/match.js"];
const {tierLabel, TEAM_NAME} = __m["js/engine/season.js"];
const {esc, img, faceOf} = __m["js/ui/util.js"];
const {conditionOf} = __m["js/engine/growth.js"];
// 경기 화면: 전광판 → 22명이 움직이는 경기장 → 문자 중계 → 내 장면 선택지




const SPEED = { normal: 1250, fast: 420 };

// 기본 대형 (우리 팀이 오른쪽으로 공격). 상대는 좌우를 뒤집어 씀
const BASE = {
  GK: [[4, 34]],
  DF: [[18, 10], [16, 26], [16, 42], [18, 58]],
  MF: [[38, 12], [35, 27], [35, 41], [38, 56]],
  FW: [[55, 26], [55, 42]],
};
const MY_SLOT = { FW: 0, MF: 1, DF: 1 };
const LIMIT = { GK: [2, 10], DF: [7, 72], MF: [14, 88], FW: [24, 98] };

// 선수 22명 만들기
function buildPlayers(state, m) {
  const p = state.player;
  const list = [];
  const ours = { GK: [{ name: m.gk.us, number: 1 }], DF: [], MF: [], FW: [] };
  for (const x of m.lineup) ours[x.pos].push(x);
  for (const [pos, spots] of Object.entries(BASE)) {
    spots.forEach((pt, i) => {
      let who = ours[pos][i];
      const me = pos === p.position && i === MY_SLOT[pos] && m.onPitch;
      if (me) { ours[pos].splice(i, 0, { name: p.name, number: p.number }); who = ours[pos][i]; }
      list.push({ id: `u-${pos}-${i}`, team: "us", pos, base: pt, number: who?.number ?? "", me, x: pt[0], y: pt[1] });
      const oy = Math.min(64, Math.max(4, pt[1] + (pos === "GK" ? 0 : 3)));
      const opp = m.oppPlayers.filter(o => o.pos === pos)[i];
      list.push({ id: `t-${pos}-${i}`, team: "them", pos, base: [105 - pt[0], oy], number: pos === "GK" ? 1 : opp?.number ?? "", me: false, x: 105 - pt[0], y: oy });
    });
  }
  return list;
}

// 공 위치와 소유 팀에 맞춰 모두의 목표 위치 계산
function layout(players, ball, poss, holderIsMe) {
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
  if (!poss || bx < 2 || bx > 103) return;
  // 공 가진 선수, 가장 가까운 상대가 따라붙음
  const mates = players.filter(p => p.team === poss && p.pos !== "GK");
  const holder = holderIsMe ? players.find(p => p.me) : mates.sort((a, b) => dist(a, ball) - dist(b, ball))[0];
  if (holder) { holder.x = bx - (poss === "us" ? 1.6 : -1.6); holder.y = by; }
  const foes = players.filter(p => p.team !== poss && p.pos !== "GK").sort((a, b) => dist(a, ball) - dist(b, ball));
  if (foes[0]) { foes[0].x = bx + (poss === "us" ? 3 : -3); foes[0].y = by + (foes[0].y > by ? 2 : -2); }
  if (foes[1] && dist(foes[1], ball) < 14) { foes[1].x = bx + (poss === "us" ? 6 : -6); foes[1].y = by + (foes[1].y > by ? 6 : -6); }
}
const dist = (p, [x, y]) => Math.hypot(p.x - x, p.y - y);

function pitchSvg(players) {
  return `<svg class="pitch" viewBox="0 0 105 68" role="img" aria-label="경기장">
    <rect x="0" y="0" width="105" height="68" class="turf"/>
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${i * 15}" y="0" width="7.5" height="68" class="stripe"/>`).join("")}
    <g class="lines"><rect x="1" y="1" width="103" height="66"/><line x1="52.5" y1="1" x2="52.5" y2="67"/>
      <circle cx="52.5" cy="34" r="9.15"/><rect x="1" y="13.85" width="16.5" height="40.3"/><rect x="87.5" y="13.85" width="16.5" height="40.3"/>
      <rect x="1" y="24.85" width="5.5" height="18.3"/><rect x="98.5" y="24.85" width="5.5" height="18.3"/>
      <rect x="-1" y="30.3" width="2" height="7.4" class="goal"/><rect x="104" y="30.3" width="2" height="7.4" class="goal"/></g>
    ${players.map(p => `<g class="dot ${p.team} ${p.pos === "GK" ? "gk" : ""} ${p.me ? "me" : ""}" data-id="${p.id}" style="transform:translate(${p.x}px,${p.y}px)">
      ${p.me ? `<circle r="3.6" class="ring"/>` : ""}<circle r="2.3" class="body"/><text y="0.75">${p.number}</text></g>`).join("")}
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
        <span class="tm away">${esc(fx.opponent.name)}</span>
      </div>
      <div class="clock num" id="clock">경기 전</div>
    </header>
    <div class="match-body">
      <div class="pitch-wrap" id="pitch">${pitchSvg(players)}<div class="goal-flash" id="flash" hidden>GOAL</div></div>
      <ol class="feed" id="feed" aria-live="polite"></ol>
    </div>
    <footer class="ctl" id="ctl"></footer>
  </div>`;

  const root = app.root;
  const feed = root.querySelector("#feed");
  const ctl = root.querySelector("#ctl");
  const svg = root.querySelector(".pitch");
  const flash = root.querySelector("#flash");
  const dotEls = Object.fromEntries([...svg.querySelectorAll(".dot")].map(el => [el.dataset.id, el]));
  const ballEl = svg.querySelector(".ball");

  function draw(ball, poss, ms, holderIsMe = false) {
    if (ball) layout(players, ball, poss, holderIsMe);
    const dur = `${Math.max(120, ms * 0.85)}ms`;
    for (const pl of players) {
      const el = dotEls[pl.id];
      el.style.transitionDuration = dur;
      el.style.transform = `translate(${pl.x.toFixed(2)}px,${pl.y.toFixed(2)}px)`;
    }
    if (ball) { ballEl.style.transitionDuration = dur; ballEl.style.transform = `translate(${ball[0].toFixed(2)}px,${ball[1].toFixed(2)}px)`; }
  }

  // 경기 전 선발 명단
  const byPos = pos => [...m.lineup.filter(x => x.pos === pos).map(x => `${x.number} ${x.name}`),
    ...(m.status === "start" && p.position === pos ? [`${p.number} ${p.name}`] : [])].join(", ");
  feed.innerHTML = `<li class="lineup"><span class="mn">선발</span><span>
    <b>GK</b> 1 ${esc(m.gk.us)}<br><b>DF</b> ${esc(byPos("DF"))}<br><b>MF</b> ${esc(byPos("MF"))}<br><b>FW</b> ${esc(byPos("FW"))}</span></li>`;

  const updateBoard = () => {
    root.querySelector("#sc").textContent = `${m.score[0]} : ${m.score[1]}`;
    root.querySelector("#clock").textContent = m.done ? "종료" : `${m.minute}'`;
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
    if (l.ball) draw(l.ball, l.poss, ms, !!(l.toMe || l.meHold));
    addLine(l);
    if (l.k?.startsWith("goal")) goalFlash(l.k);
    updateBoard();
    timer = setTimeout(step, l.silent ? ms * 0.7 : (l.k?.startsWith("goal") ? ms * 1.4 : ms));
  }

  // ── 경기 전 ──
  const statusLine = m.onPitch
    ? `${STATUS_LABEL[m.status]}${m.status === "sub" ? ` (후반 ${m.minIn}분쯤 투입 예정)` : ""}`
    : `${STATUS_LABEL[m.status]}${m.reason ? `: ${m.reason}` : ""}`;
  const barPct = v => Math.round(Math.max(5, Math.min(95, 50 + (v - 50) * 3)));
  ctl.innerHTML = `<div class="prematch">
    <div class="pm-me">
      <div class="pm-face">${img(faceOf(p, state.calendar.grade), p.name)}</div>
      <div><div class="pm-name">${p.number}. ${esc(p.name)} <span class="pos-tag ${p.position}">${p.position}</span></div>
        <div class="pm-status ${m.onPitch ? "" : "off"}">${statusLine}</div></div>
    </div>
    ${(() => { const c = conditionOf(p); const mp = Math.round(c.match * 100);
      const role = m.star >= 1 ? "에이스. 상대가 집중 견제합니다" : m.star >= 0.4 ? "핵심 선수" : m.onPitch ? "팀의 일원" : "";
      return `<div class="pm-tags"><span class="cond ${c.cls}">컨디션 ${c.label}</span><span class="mute">선택 성공률 ${mp > 0 ? "+" : ""}${mp}%p</span>
        ${role ? `<span class="chip ${m.star >= 1 ? "kit" : ""}">영향력: ${role}</span>` : ""}</div>`; })()}
    ${fx.school ? `<div class="alert gold">🎓 오늘 ${esc(fx.school.name)}(${tierLabel(fx.school.tier)}) ${esc(fx.school.coach)}이 관전합니다. 상대는 고등학생이라 몸싸움이 버겁습니다.</div>` : ""}
    ${fx.ko ? `<div class="alert gold">지면 탈락입니다. 비기면 승부차기.</div>` : ""}
    <div class="power"><span>우리 전력</span><div class="pw"><i style="width:${barPct(m.ours)}%"></i></div>
      <span>상대 전력</span><div class="pw them"><i style="width:${barPct(m.theirs)}%"></i></div></div>
    <div class="ctl-row"><button class="btn btn-ghost" data-skip>결과만 보기</button><button class="btn btn-kit" data-start>${m.onPitch ? "킥오프" : "경기 지켜보기"}</button></div>
  </div>`;
  ctl.querySelector("[data-start]").addEventListener("click", () => { controls(); tick(); });
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
      if (r.kind === "ht") return showHalftime();
      if (r.kind === "ft") return end();
      timer = setTimeout(tick, r.lines.length ? 120 : 0);
    });
  }

  function showMoment() {
    const pd = m.pending;
    ctl.innerHTML = `<div class="moment" role="group" aria-label="선택">
      <p class="mo-text"><span class="num">${m.minute}'</span> ${esc(pd.text)}</p>
      <div class="mo-choices">${pd.choices.map((c, i) => `<button class="mo-btn" data-c="${i}">
        <span>${c.signature ? `<b class="sigb">★ 특기</b> ` : ""}${esc(c.label)}</span><span class="lv ${c.level === "높음" ? "hi" : c.level === "보통" ? "mid" : "lo"}">${c.level}</span></button>`).join("")}</div>
      <button class="linkbtn" data-autopick>알아서 하기</button>
    </div>`;
    const pickIt = i => {
      const r = resolve(state, m, i);
      controls();
      paused = false;
      play(r.lines, () => { timer = setTimeout(tick, 200); });
    };
    ctl.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => pickIt(+b.dataset.c)));
    ctl.querySelector("[data-autopick]").addEventListener("click", () => pickIt(autoChoice(m)));
    ctl.querySelector("[data-c]").focus({ preventScroll: true });
  }

  function showHalftime() {
    ctl.innerHTML = `<div class="ctl-row"><button class="btn btn-kit btn-wide" data-second>후반 시작</button></div>`;
    ctl.querySelector("[data-second]").addEventListener("click", () => { controls(); tick(); });
  }

  function skipAll() {
    clearTimeout(timer);
    queue.forEach(addLine); queue = []; after = null;
    const before = m.feed.length;
    autoPlay(state, m);
    m.feed.slice(before).forEach(addLine);
    end();
  }

  function end() {
    clearTimeout(timer);
    const before = m.feed.length;
    const res = finishMatch(state, m);
    m.feed.slice(before).forEach(addLine);
    draw([52.5, 34], null, 600);
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
    ctl.querySelector("[data-done]").addEventListener("click", () => onDone(res));
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
  { bg: "bg_sea",   tone: "sea",   big: "전라남도 고흥",          small: "바다가 세 면을 감싸 안은 작은 반도." },
  { bg: "title",    tone: "dawn",  big: "이 바다 위로\n로켓이 날아올랐다", small: "누군가의 꿈은 하늘까지 닿기도 한다." },
  { bg: "bg_field_day", tone: "field", big: "고흥대서중학교",    small: "방과 후면 어김없이 운동장에서 공 차는 소리가 난다." },
  { bg: "bg_locker", tone: "night", big: "고흥FC U-15",          small: "올봄, 신입생 하나가 축구부 문을 두드린다." },
  { bg: null,       tone: "black", big: "3년",                   small: "국가대표가 될 수도, 벤치에서 끝날 수도 있다." },
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
    DF: { say: "뒤에서 막는 게 더 재밌어요.", react: "수비 하겠다는 1학년은 오랜만이네. 수비는 실수 한 번이 실점이다. 집중력 있게." },
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
    { who: "coach", text: "{assistant}, 기초 체력 측정 해." },
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
    { who: "coach", text: "훈련은 평일 방과 후, 주말리그는 격주 토요일이다." },
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
    text.innerHTML = `<h1 class="cine-big">${esc(cut.big).replace(/\n/g, "<br>")}</h1><p class="cine-small">${esc(cut.small)}</p>`;
    timer = setTimeout(() => show(i + 1), AUTO_MS);
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
  const d = { name: "", face: null, position: null, foot: null, growthType: null, rolled: null, rerolls: 0, number: 0 };
  app.root.innerHTML = `<div class="vn" id="vn">
      <div class="vn-stage" id="vbg">${bgLayer("bg_locker", "night", "on")}</div>
      <div class="vn-portrait" id="por" aria-hidden="true"></div>
      <div class="vn-box" id="box">
        <div class="vn-name" id="who"></div>
        <p class="vn-text" id="txt"></p>
        <div class="vn-ui" id="ui"></div>
        <span class="vn-more" id="more" aria-hidden="true">▼</span>
      </div>
      <button class="vn-exit linkbtn" id="exit">처음으로</button>
    </div>`;
  const $ = id => app.root.querySelector(`#${id}`);
  const box = $("box"), txt = $("txt"), who = $("who"), ui = $("ui"), more = $("more"), por = $("por");
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
      const onClick = e => {
        if (e.target.closest("button, input")) return;
        if (typing) { finish(); return; }
        box.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKey);
        resolve();
      };
      const onKey = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick({ target: box }); } };
      box.addEventListener("click", onClick);
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
      for (const t of p.traits) await say("coach", TRAIT_REMARK[t]);
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
    if (alive) app.startGame({ ...d.rolled, name: d.name, number: d.number });
  })();
}

return { renderCreate };
})();
(__fix["js/ui/create.js"] || []).forEach(f => f());

// ── js/ui/views.js
__m["js/ui/views.js"] = (function () {
const {ACTION_MAP} = __m["data/actions.js"];
const {POSITIONS, GROWTH_TYPES, TRAITS, STAT_GROUPS, ROLES, EARNABLE} = __m["data/player.js"];
const {STAFF} = __m["data/roster.js"];
const {PHASES, MONTHS} = __m["data/calendar.js"];
const {turnInfo, upcoming, yearTurns, label} = __m["js/engine/calendar.js"];
const {SLOTS, slotLocked} = __m["js/engine/week.js"];
const {INJURIES} = __m["js/engine/injury.js"];
const {sortTable, US, tierLabel, ensureSeason} = __m["js/engine/season.js"];
const {HIGH_SCHOOLS} = __m["data/world.js"];
const {ovr, depthChart, activeRoster, mateGrade} = __m["js/engine/team.js"];
const {efficiency, conditionOf} = __m["js/engine/growth.js"];
const {SIGNATURE} = __m["data/match.js"];
const {STAT_LABEL} = __m["data/player.js"];
const {esc, img, faceOf, fl, stars, gauge, statLevel, AVATAR} = __m["js/ui/util.js"];
const {getPath} = __m["js/rng.js"];
const {REL_ROLES, rivalGap, captainScore} = __m["js/engine/relations.js"];
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
function stillScheduled(state, i) {
  if (!i.match) return true;
  if ((i.match.comp === "summer" || i.match.comp === "winter") && i.match.stage === "ko") {
    const t = state.tour;
    if (t && t.key === `${i.grade}-${i.match.comp}` && (!t.alive || t.stage !== "ko")) return t.alive && t.stage === "group" ? true : false;
  }
  return true;
}

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
  const list = state.inbox.slice(0, 4);
  return `<section class="panel"><h2>메시지 <button class="linkbtn right" data-go="inbox">전체 보기</button></h2>
    ${list.map(mailRow).join("")}</section>`;
}

function mailRow(m) {
  return `<button class="mail ${m.read ? "" : "unread"}" data-mail="${m.id}">
    <span class="av" aria-hidden="true">${AVATAR[m.kind] || "💬"}</span>
    <span><span class="t">${esc(m.title)}</span><br><span class="f">${esc(m.from)}</span></span></button>`;
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
  return `<p style="margin:0 0 8px"><b>${esc(t.name)}</b> <span class="chip ${t.champion ? "gold" : t.alive ? "turf" : ""}">${t.champion ? "우승" : t.alive ? (t.stage === "ko" ? `${t.best} 진출` : "조별리그 중") : t.best}</span></p>
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
  return `<section class="panel"><h2>주말리그 순위 ${lg ? `<small>${lg.half}${lg.finished ? " 최종" : ` ${lg.played}/7라운드`}</small>` : ""}
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
          <p class="rel-desc">시험 성적, 수업 태도, 학교 행사에서의 선택으로 달라집니다. 졸업식 날 받는 편지가 달라집니다.</p>
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
    ${g === 3 ? `<p class="mute" style="font-size:13px;margin:12px 0 0">${state.flags.captain ? "🟧 주장 완장을 차고 있습니다." : state.flags.captainVoted ? "주장 선거가 끝났습니다." : `3월 2주차에 주장 선거가 있습니다. 지금 지지도 ${Math.round(captainScore(state))} (손을 들면 66 이상이면 당선)`}</p>`
      : `<p class="mute" style="font-size:13px;margin:12px 0 0">중3 3월에 주장 선거가 있습니다. 감독 신뢰, 팀워크, 생활태도, 관계가 모두 반영됩니다.</p>`}`;
  }
  if (tab === "league") {
    const lg = state.league;
    const past = state.record.leagues;
    body = `<h2>주말리그 ${lg ? `<small>${lg.grade}학년 ${lg.half}${lg.finished ? " 최종 순위" : ` ${lg.played}/7라운드`}</small>` : ""}</h2>
      <div style="overflow-x:auto">${leagueTable(state)}</div>
      <p class="mute" style="font-size:12px;margin:8px 0 0">8팀이 한 번씩 맞붙습니다. 이기면 3점, 비기면 1점.</p>
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
        if (info.match) items.push(`<span class="chip ${info.comp.tournament ? "kit" : info.match.comp === "hs" ? "gold" : "turf"}">${info.comp.label}</span>${info.match.round || (info.leagueRound != null ? `${info.leagueRound + 1}라운드` : info.match.hsChance?.[grade] ? "고교 팀일 수도" : "")}`);
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
    ${state.inbox.map(mailRow).join("") || `<p class="mute">아직 받은 메시지가 없습니다.</p>`}</section>`;
}


return { sixStats, cardTier, fcCard, jerseyCard, stillScheduled, mailRow, leagueTable, homeView, playerView, teamView, scheduleView, inboxView, label };
})();
(__fix["js/ui/views.js"] || []).forEach(f => f());

// ── js/ui/career.js
__m["js/ui/career.js"] = (function () {
const {ENDINGS, GRADE_INFO} = __m["data/endings.js"];
const {schoolOptions, chooseSchool, decideEnding, markEnding, seenEndings, teacherLetter} = __m["js/engine/career.js"];
const {openModal} = __m["js/ui/modals.js"];
const {bgLayer} = __m["js/ui/intro.js"];
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
        <span class="eyebrow">DECIDED</span><h2>${esc(r.school.name)}</h2><p class="sub">${esc(r.school.tierLabel)}. 남은 겨울도 고흥FC 선수로 끝까지 뜁니다.</p>
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
          : "끝까지 내렸지만 이름은 없었다. 그래도 고흥에서 여기까지 온 것만으로도 충분히 길었다."}</p>
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
const {initRelations} = __m["js/engine/relations.js"];
const {showMatch} = __m["js/ui/match.js"];
const {ACTION_MAP} = __m["data/actions.js"];
const {renderCreate} = __m["js/ui/create.js"];
const {renderIntro} = __m["js/ui/intro.js"];
const {homeView, playerView, teamView, scheduleView, inboxView} = __m["js/ui/views.js"];
const {ask, eventModal, actionPicker, weekReport, mailModal, saveModal, numberModal, yearModal} = __m["js/ui/modals.js"];
const {esc} = __m["js/ui/util.js"];
const {admissionModal, nationalModal, showEnding, galleryModal} = __m["js/ui/career.js"];
// 진입점: 화면 전환, 저장, 한 주 진행
















// 메뉴 아이콘 (선으로 그린 SVG)
const ICONS = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  player: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/>',
  team: '<circle cx="8.5" cy="8.5" r="3.2"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M2.5 20c.8-3.8 3.4-6 6-6s5.2 2.2 6 6M14.5 14.3c3 0 5.6 1.9 6.5 5.7"/>',
  schedule: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  inbox: '<path d="M4 5h16v11H9l-5 4z"/>',
};
const icon = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const NAV = [["home", "홈"], ["player", "선수"], ["team", "팀"], ["schedule", "일정"], ["inbox", "메시지"]];

const app = {
  root: document.getElementById("app"),
  state: null,
  view: "title",
  sub: { ptab: "stats", sgrade: null, ttab: "rel" },
  draft: null,
  settings: loadSettings(),

  go(view) { this.view = view; this.render(); window.scrollTo(0, 0); },
  toTitle() { this.state = null; this.go("title"); },

  startGame(player) {
    this.state = newGame(player);
    welcomeMails(this.state);
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

  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(this._t); this._t = setTimeout(() => t.classList.remove("show"), 2600);
  },

  render() {
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
    <p class="ft-foot">고흥대서중학교 축구부</p>
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

  app.root.innerHTML = `<div class="shell">
    <header class="topbar">
      <img class="tb-logo" src="assets/img/logo.png" alt="">
      <div class="tb-when"><div class="when">${info ? label(info) : "졸업"}</div><div class="phase">${info ? info.phaseLabel : ""}</div></div>
      <nav class="tabs-top" aria-label="메뉴">${NAV.map(([k, l]) => `<button data-nav="${k}" ${app.view === k ? `aria-current="page"` : ""}>${l}${k === "inbox" && unread ? `<span class="badge num">${unread}</span>` : ""}</button>`).join("")}</nav>
      <span class="spacer"></span>
      <button class="btn btn-sm btn-ghost" data-savemenu>저장</button>
    </header>
    <nav class="nav" aria-label="메뉴">${NAV.map(([k, l]) =>
      `<button data-nav="${k}" ${app.view === k ? `aria-current="page"` : ""}>${icon(k)}<span>${l}</span>${k === "inbox" && unread ? `<span class="dot" aria-label="안 읽은 메시지 ${unread}개"></span>` : ""}</button>`).join("")}</nav>
    <main class="main">${main}</main>
  </div>`;

  const r = app.root;
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
    m.read = true; mailModal(m); app.render();
  }));
  if (app.view === "schedule") r.querySelector(".week.now")?.scrollIntoView({ block: "center" });
}

app.render();
window.gfc = app; // 개발 확인용

return {  };
})();
(__fix["js/main.js"] || []).forEach(f => f());
})();
