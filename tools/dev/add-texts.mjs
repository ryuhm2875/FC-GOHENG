// 장면·결과 문장을 더 넣는 도구. 새 문장이 원래 문장과 같은 정규식(엔진 actOf·textOk, 검사기)에 걸리는지, 새 이름표({opp} 등)를 쓰지 않는지 확인한 뒤 data/match.js에 덧붙임
// node tools/dev/add-texts.mjs [write] [문장.json]   형식: { sit: { 장면id: [문장…] }, res: { 장면id: [[선택지1 성공, 실패], …] } }
import fs from "fs";
const R = new URL("../../", import.meta.url).pathname;
const { SITUATIONS } = await import(R + "data/match.js");
const T = JSON.parse(fs.readFileSync(process.argv[3] || R + "tools/dev/add-texts.sample.json", "utf8"));
// 엔진·검사기의 한글 정규식을 모두 모아, 새 문장이 원래 문장과 같은 것에 걸리는지 확인
const grab = (f, lo = 1, hi = 1e9) => { const out = [], L = fs.readFileSync(R + f, "utf8").split("\n").slice(lo - 1, hi).join("\n");
  for (const mm of L.matchAll(/\/((?:[^\/\\\n]|\\.)+)\/([gimsuy]*)/g)) if (/[가-힣]/.test(mm[1]) && !/["]|\} /.test(mm[1])) { try { out.push(new RegExp(mm[1], mm[2].replace("g", ""))); } catch {} } return out; };
const RS = { sit: [...grab("js/engine/match.js", 1005, 1052), ...grab("js/engine/match.js", 1400, 1425), ...grab("tools/dev/deep-audit.mjs")], res: [...grab("js/engine/match.js", 1660, 1790), ...grab("js/engine/match.js", 1880, 2000), ...grab("tools/dev/sync-audit.mjs")] };
let res = RS.sit;
const sig = t => res.map(r => r.test(t) ? 1 : 0);
const diff = (a, b) => { const A = sig(a), B = sig(b), d = []; A.forEach((v, i) => { if (v !== B[i]) d.push((v ? "−" : "+") + res[i].source.slice(0, 50)); }); return d; };
let src = fs.readFileSync(R + "data/match.js", "utf8"), bad = 0; const WRITE = process.argv[2] === "write";
const q = s => JSON.stringify(s);
const block = id => { const a = src.indexOf(`id: "${id}"`); if (a < 0) throw new Error(id); let b = src.indexOf(`  { id: "`, a + 5); if (b < 0) b = src.length; return [a, b]; };
const append = (id, last, add) => { const [a, b] = block(id), seg = src.slice(a, b), k = q(last) + "]"; if (seg.split(k).length !== 2) { console.log("위치 못 찾음", id, last.slice(0, 20)); bad++; return; } src = src.slice(0, a) + seg.replace(k, q(last) + ", " + add.map(q).join(", ") + "]") + src.slice(b); };
for (const [id, add] of Object.entries(T.sit)) { const s = SITUATIONS.find(x => x.id === id), old = s.text.join(" ");
  const d = diff(old, old + " " + add.join(" ")).filter(x => x[0] === "+"); if (d.length) { console.log("장면", id, d); bad++; }
  for (const t of add) for (const ph of t.match(/\{\w+/g) || []) if (!old.includes(ph)) { console.log("새 이름표", id, ph); bad++; }
  append(id, s.text.at(-1), add); }
res = RS.res;
for (const [id, list] of Object.entries(T.res)) { const s = SITUATIONS.find(x => x.id === id);
  list.forEach(([w, l], i) => { const c = s.choices[i];
    for (const [k, nw] of [["winText", w], ["loseText", l]]) { const o = c[k][0], d = diff(o, nw); if (d.length) { console.log("결과", id, i, k, d); bad++; }
      for (const ph of nw.match(/\{\w+/g) || []) if (!o.includes(ph)) { console.log("새 이름표", id, i, ph); bad++; }
      append(id, c[k].at(-1), [nw]); } }); }
console.log("정규식", RS.sit.length, RS.res.length, "문제", bad);
if (WRITE && !bad) { fs.writeFileSync(R + "data/match.js", src); console.log("저장"); }
