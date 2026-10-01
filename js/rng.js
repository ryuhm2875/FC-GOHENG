// 난수와 작은 계산 도구들. 테스트할 때는 setSeed로 결과를 고정할 수 있습니다.

let seed = null;

export function setSeed(s) { seed = s >>> 0; }

export function rand() {
  if (seed === null) return Math.random();
  // mulberry32
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const range = (a, b) => a + rand() * (b - a);
export const int = (a, b) => Math.floor(range(a, b + 1));
export const chance = p => rand() < p;
export const pick = arr => arr[Math.floor(rand() * arr.length)];
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function normal(mean = 0, sd = 1) {
  const u = 1 - rand(), v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function weighted(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of pairs) { if ((r -= w) <= 0) return item; }
  return pairs[pairs.length - 1][0];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// "tech.shoot" 같은 경로로 값 읽기/쓰기
export function getPath(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}
export function setPath(obj, path, val) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = val;
}
