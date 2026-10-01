// 능력치 성장과 신체 성장
import { GROWTH_TYPES, POSITIONS } from "../../data/player.js";
import { getPath, setPath, range, clamp, chance, normal } from "../rng.js";

export const TUNE = { gain: 1.0 };   // 밸런스 조절용 전체 배율

export function hasTrait(p, id) { return p.traits.includes(id); }

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
export const CONDITION_LEVELS = [
  { min: 85, label: "최상", cls: "hi" },
  { min: 70, label: "좋음", cls: "hi" },
  { min: 50, label: "보통", cls: "mid" },
  { min: 30, label: "나쁨", cls: "lo" },
  { min: -1, label: "최악", cls: "lo" },
];
export function conditionOf(p) {
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
export function efficiency(state) { return conditionOf(state.player).train; }

// 능력치 하나에 기본 상승량을 적용하고 실제 변화량을 돌려줍니다
export function applyGain(state, path, base, opts = {}) {
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
export function expandGains(state, gains) {
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
export function weightFor(height, grade, strength) {
  const bmi = 17.8 + grade * 0.55 + (strength - 30) * 0.02;
  return Math.round(bmi * (height / 100) ** 2 * 10) / 10;
}

// 신체 측정: 성장 단계 k(0~4)
export function growBody(state, k) {
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
export function weeklyDrift(state, didSchool) {
  const p = state.player;
  const s = p.stats.student;
  s.academic = clamp(s.academic - (didSchool ? 0.2 : 0.55), 0, 100);
  if (hasTrait(p, "diligent")) s.attitude = clamp(s.attitude + 0.15, 0, 100);
  if (hasTrait(p, "lazy")) s.attitude = clamp(s.attitude - 0.2, 0, 100);
  // 사기는 55 쪽으로 천천히 돌아감
  const m = p.condition.morale;
  p.condition.morale = clamp(m + (55 - m) * 0.08, 0, 100);
}
