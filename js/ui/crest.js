// 상대 팀 엠블럼: 팀 색 두 가지(data/world.js) + 팀 이름에서 딴 그림 하나 + 모양(방패·원·육각, 이름으로 정함)
import { LEAGUE_OPPONENTS, NATIONAL_OPPONENTS, ELEMENTARY_OPPONENTS, HIGH_SCHOOLS } from "../../data/world.js";
import { PROVINCES } from "../engine/jn.js";
import { esc } from "./util.js";

const TEAMS = [...LEAGUE_OPPONENTS, ...NATIONAL_OPPONENTS, ...ELEMENTARY_OPPONENTS, ...HIGH_SCHOOLS, ...PROVINCES];
const COLOR = Object.fromEntries(TEAMS.map(t => [t.name, [t.color, t.color2]]));

// 모양 (viewBox 100×110)
const SHAPE = [
  (f, s) => `<path d="M50 3 L94 14 V56 C94 82 74 98 50 107 C26 98 6 82 6 56 V14 Z" fill="${f}" stroke="${s}" stroke-width="5"/>`,
  (f, s) => `<circle cx="50" cy="55" r="45" fill="${f}" stroke="${s}" stroke-width="6"/><circle cx="50" cy="55" r="36" fill="none" stroke="${s}" stroke-width="2" opacity=".55"/>`,
  (f, s) => `<path d="M50 4 L92 28 V80 L50 104 L8 80 V28 Z" fill="${f}" stroke="${s}" stroke-width="5"/>`,
];
const W = (c, w = 4) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
// 그림 (가운데 50,55 근처). c = 그림 색, b = 바탕 색
const MOTIF = {
  gull: (c) => `<path d="M20 58 Q35 38 50 56 Q65 38 80 58 Q65 48 50 64 Q35 48 20 58 Z" fill="${c}"/><path d="M24 80 Q37 74 50 80 Q63 86 76 80" ${W(c)}/>`,
  peak: (c, b) => `<path d="M24 74 L40 46 L48 56 L58 36 L76 74 Z" fill="${c}"/><path d="M54 44 L58 36 L62 44 Z" fill="${b}"/>`,
  peaks: (c) => `<path d="M18 76 L38 40 L50 58 L62 34 L82 76 Z" fill="${c}"/><path d="M18 84 H82" ${W(c, 3)}/>`,
  gear: (c, b) => `<circle cx="50" cy="55" r="20" fill="none" stroke="${c}" stroke-width="12" stroke-dasharray="8 7.7"/><circle cx="50" cy="55" r="15" fill="${c}"/><circle cx="50" cy="55" r="6" fill="${b}"/>`,
  sun: (c) => `<circle cx="50" cy="58" r="13" fill="${c}"/><g ${W(c, 5)}><path d="M50 26V36"/><path d="M50 80V90"/><path d="M18 58H28"/><path d="M72 58H82"/><path d="M28 36L35 43"/><path d="M72 36L65 43"/><path d="M28 80L35 73"/><path d="M72 80L65 73"/></g>`,
  starH: (c) => `<path d="M50 22 L56 40 L75 40 L60 51 L66 69 L50 58 L34 69 L40 51 L25 40 L44 40 Z" fill="${c}"/><path d="M22 80 Q50 66 78 80" ${W(c)}/>`,
  star: (c) => `<path d="M50 24 L57.6 46 L81 46 L62 60 L69 82 L50 68.5 L31 82 L38 60 L19 46 L42.4 46 Z" fill="${c}"/>`,
  compass: (c, b) => `<circle cx="50" cy="55" r="24" ${W(c, 3)}/><path d="M50 27 L57 55 L50 83 L43 55 Z" fill="${c}"/><path d="M50 55 L57 55 L50 83 L43 55 Z" fill="${b}" opacity=".45"/><circle cx="50" cy="55" r="3.5" fill="${b}"/>`,
  tri: (c, b) => `<path d="M26 34 H74 L50 82 Z" fill="${c}"/><path d="M38 42 H62 L50 66 Z" fill="${b}"/>`,
  fish: (c, b) => `<path d="M22 55 Q40 34 64 50 L78 40 L74 55 L78 70 L64 60 Q40 76 22 55 Z" fill="${c}"/><circle cx="34" cy="52" r="3" fill="${b}"/>`,
  pineWave: (c) => `<path d="M50 22 L64 44 H57 L68 60 H32 L43 44 H36 Z" fill="${c}"/><path d="M24 74 Q31 68 37 74 Q44 80 50 74 Q57 68 63 74 Q70 80 76 74" ${W(c)}/>`,
  pine: (c) => `<path d="M50 20 L64 42 H57 L70 62 H58 L72 80 H28 L42 62 H30 L43 42 H36 Z" fill="${c}"/><path d="M50 80 V88" ${W(c, 5)}/>`,
  moon: (c) => `<path d="M60 30 A26 26 0 1 0 60 80 A20 20 0 1 1 60 30 Z" fill="${c}"/><circle cx="66" cy="42" r="3" fill="${c}"/><circle cx="72" cy="58" r="2" fill="${c}"/>`,
  whale: (c) => `<path d="M50 82 C48 70 44 62 30 52 C40 52 46 56 50 62 C54 56 60 52 70 52 C56 62 52 70 50 82 Z" fill="${c}"/><path d="M40 30 Q44 36 42 42" ${W(c, 3)}/><path d="M60 30 Q56 36 58 42" ${W(c, 3)}/>`,
  castle: (c, b) => `<path d="M26 78 V44 H32 V38 H38 V44 H44 V38 H56 V44 H62 V38 H68 V44 H74 V78 Z" fill="${c}"/><path d="M44 78 V64 A6 6 0 0 1 56 64 V78 Z" fill="${b}"/>`,
  bridge: (c) => `<path d="M18 62 Q50 30 82 62" ${W(c, 5)}/><path d="M18 62 H82" ${W(c, 4)}/><path d="M34 50 V62 M50 44 V62 M66 50 V62" ${W(c, 3)}/><path d="M22 78 Q31 72 40 78 Q50 84 60 78 Q69 72 78 78" ${W(c)}/>`,
  galaxy: (c) => `<ellipse cx="50" cy="56" rx="32" ry="11" transform="rotate(-20 50 56)" ${W(c, 3)}/><path d="M50 36 L54 51 L69 55 L54 59 L50 74 L46 59 L31 55 L46 51 Z" fill="${c}"/>`,
  wave: (c) => `<path d="M20 70 C24 46 46 34 62 42 C72 47 70 60 60 60 C52 60 52 50 58 48" ${W(c, 6)}/><path d="M18 82 Q30 74 42 82 Q54 90 66 82 Q74 77 82 80" ${W(c)}/>`,
  shell: (c, b) => `<path d="M50 30 C70 30 82 46 80 64 L50 82 L20 64 C18 46 30 30 50 30 Z" fill="${c}"/><g stroke="${b}" stroke-width="2.5" stroke-linecap="round"><path d="M50 34 V78"/><path d="M38 36 L44 78"/><path d="M62 36 L56 78"/><path d="M27 46 L38 76"/><path d="M73 46 L62 76"/></g>`,
  tree: (c) => `<ellipse cx="50" cy="46" rx="13" ry="24" fill="${c}"/><path d="M50 66 V86" ${W(c, 5)}/><path d="M34 86 H66" ${W(c, 3)}/>`,
  volcano: (c) => `<path d="M18 80 L40 42 H60 L82 80 Z" fill="${c}"/><circle cx="44" cy="32" r="4" fill="${c}"/><circle cx="54" cy="26" r="5" fill="${c}"/><circle cx="62" cy="34" r="3.5" fill="${c}"/>`,
  lake: (c) => `<ellipse cx="50" cy="58" rx="28" ry="16" ${W(c, 4)}/><path d="M34 58 Q42 52 50 58 Q58 64 66 58" ${W(c, 3)}/><path d="M50 26 L56 38 H44 Z" fill="${c}"/>`,
  crown: (c, b) => `<path d="M22 76 L18 40 L36 56 L50 30 L64 56 L82 40 L78 76 Z" fill="${c}"/><path d="M22 84 H78" ${W(c, 5)}/><circle cx="50" cy="62" r="5" fill="${b}"/>`,
  globe: (c) => `<circle cx="50" cy="55" r="24" ${W(c, 4)}/><ellipse cx="50" cy="55" rx="10" ry="24" ${W(c, 3)}/><path d="M26 55 H74 M30 43 H70 M30 67 H70" ${W(c, 2.5)}/>`,
  leaf: (c, b) => `<path d="M28 78 C26 50 44 30 76 30 C76 60 58 80 28 78 Z" fill="${c}"/><path d="M30 76 C44 62 56 50 68 38" fill="none" stroke="${b}" stroke-width="3" stroke-linecap="round"/>`,
  sprout: (c) => `<path d="M50 86 V54" ${W(c, 5)}/><path d="M50 60 C36 60 26 50 26 36 C40 36 50 44 50 56 Z" fill="${c}"/><path d="M50 54 C50 40 60 30 76 30 C76 46 66 54 50 54 Z" fill="${c}"/>`,
  ball: (c, b) => `<circle cx="50" cy="55" r="24" fill="${c}"/><path d="M50 44 L60 51 L56 63 L44 63 L40 51 Z" fill="${b}"/><path d="M50 44 V31 M60 51 L72 47 M56 63 L63 74 M44 63 L37 74 M40 51 L28 47" stroke="${b}" stroke-width="2.5"/>`,
  unknown: (c) => `<text x="50" y="70" text-anchor="middle" font-size="44" font-weight="800" fill="${c}" font-family="Barlow Condensed, sans-serif">?</text>`,
};
// 팀 이름 속 낱말 → 그림 (위에서부터 먼저 맞는 것)
const KEYS = [
  ["갈매기", "gull"], ["유달", "peak"], ["쇠울", "gear"], ["빛고을", "sun"], ["무등빛", "sun"], ["새벽별", "starH"], ["정남진", "compass"], ["땅끝", "tri"],
  ["칠산", "fish"], ["바다솔", "pineWave"], ["한강", "bridge"], ["은하", "galaxy"], ["파도", "wave"], ["달빛", "moon"], ["갯벌", "shell"], ["꼬막", "shell"],
  ["고래", "whale"], ["설악", "peaks"], ["모악산", "peaks"], ["미루나무", "tree"], ["한라", "volcano"], ["한밭별", "star"], ["진주성", "castle"],
  ["솔뫼", "pine"], ["새솔", "pine"], ["호수", "lake"], ["군포", "crown"], ["바닷바람", "wave"], ["남해안", "wave"], ["한누리", "globe"],
  ["늘푸른", "leaf"], ["차밭", "leaf"], ["녹차잎", "leaf"], ["꿈나무", "sprout"], ["대표", "ball"],
];
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const light = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; };

// 엠블럼 SVG. size: 너비(px). 모르는 팀(상대 미정 등)은 회색 방패에 물음표
export function crest(name, { size = 40, cls = "" } = {}) {
  const n = String(name || "");
  const known = COLOR[n];
  let [f, s] = known || [`hsl(${hash(n) % 360} 45% 34%)`, "#E8ECF6"];
  if (!known && !/대표$/.test(n)) [f, s] = ["#2A3247", "#8E97AA"];
  if (light(f) && !light(s)) [f, s] = [s, f];                 // 흰 바탕 팀은 진한 색을 바탕으로 (어두운 화면에서 덜 튐)
  const key = (KEYS.find(([k]) => n.includes(k)) || [null, known || /대표$/.test(n) ? "ball" : "unknown"])[1];
  const shape = known ? hash(n) % 3 : 0;
  return `<svg class="crest-svg ${cls}" width="${size}" height="${Math.round(size * 1.1)}" viewBox="0 0 100 110" role="img" aria-label="${esc(n)} 엠블럼">${SHAPE[shape](f, s)}${MOTIF[key](s, f)}</svg>`;
}
