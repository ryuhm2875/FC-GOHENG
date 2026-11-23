// 장면·결과 문장, 선택지 다른 이름을 더 넣는 도구.
// 새 글이 원래 글과 똑같은 정규식(엔진·검사기에 있는 한글 정규식 전부)에 걸리는지, 원래 없던 이름표({opp} 등)를 쓰지 않는지 확인한 뒤에만 data/match.js에 씀
// node tools/dev/add-texts.mjs [write] [문장.json]
// 형식: { sit: { 장면id: [장면 문장…] },
//         res: { 장면id: [[선택지1 성공 문장 또는 [여러 개], 실패 문장 또는 [여러 개]], …] },   (선택지 순서대로, 건너뛸 선택지는 null)
//         by: { 장면id: [{ trail|lead|rain|wind: [보이는 이름, 성공 문장 앞말] }, …] } }   (선택지 순서대로, 건너뛸 선택지는 null. 엔진은 원래 이름을 읽음)
import fs from "fs";
const R = new URL("../../", import.meta.url).pathname;
const { SITUATIONS } = await import(R + "data/match.js");
const T = JSON.parse(fs.readFileSync(process.argv[3] || R + "tools/dev/add-texts.sample.json", "utf8"));
const grab = (f, keep = () => true) => { const out = [], L = fs.readFileSync(R + f, "utf8").split("\n").filter((l, i) => keep(l, i + 1)).join("\n");
  for (const mm of L.matchAll(/\/((?:[^\/\\\n]|\\.)+)\/([gimsuy]*)/g)) if (/[가-힣]/.test(mm[1]) && !/["]|\} /.test(mm[1])) { try { out.push(new RegExp(mm[1], mm[2].replace("g", ""))); } catch {} }
  return out; };
// 줄 번호 대신 함수 이름으로 범위를 찾음 (코드가 움직여도 빠지지 않게)
const MJ = fs.readFileSync(R + "js/engine/match.js", "utf8").split("\n"), at = re => MJ.findIndex(l => re.test(l)) + 1;
const RES0 = at(/^const CARRY_RE/) - 20, RES1 = at(/^function soResolve/), TIM0 = at(/^export function choiceTag/), TIM1 = at(/^const TIMING_RULES/) + 40;
const SETS = {
  // 장면 문장: 장면을 고르는 쪽(textOk 둘레)과 검사기
  sit: [...grab("js/engine/match.js", (l, i) => i < RES0), ...grab("tools/dev/deep-audit.mjs"), ...grab("tools/dev/moment-audit.mjs")],
  // 결과 문장: 결과 문장을 읽어 동작을 고르는 쪽(resolve·actOf·scriptSteps)과 검사기
  res: [...grab("js/engine/match.js", (l, i) => i >= RES0 && i < RES1), ...grab("tools/dev/sync-audit.mjs")],
  // 선택지 이름: 엔진은 원래 이름을 읽으므로, 다른 이름도 원래 이름과 같은 동작으로 읽히는지만 (말뜻이 같아야 화면과 맞음)
  lab: [...grab("js/engine/match.js", (l, i) => (i >= TIM0 && i < TIM1) || (i >= RES0 && i < RES0 + 40) || /label/.test(l))],
};
let ALL = SETS.sit;
const sig = t => ALL.map(r => r.test(t) ? 1 : 0);
const diff = (a, b) => { const A = sig(a), B = sig(b), d = []; A.forEach((v, i) => { if (v !== B[i]) d.push((v ? "−" : "+") + ALL[i].source.slice(0, 50)); }); return d; };
let src = fs.readFileSync(R + "data/match.js", "utf8"), bad = 0, n = 0; const WRITE = process.argv[2] === "write";
const q = s => JSON.stringify(s);
const block = id => { const a = src.indexOf(`id: "${id}"`); if (a < 0) throw new Error(id); let b = src.indexOf(`  { id: "`, a + 5); if (b < 0) b = src.length; return [a, b]; };
const edit = (id, from, to) => { const [a, b] = block(id), seg = src.slice(a, b); if (seg.split(from).length !== 2) { console.log("위치 못 찾음", id, from.slice(0, 30)); bad++; return; }
  src = src.slice(0, a) + seg.replace(from, to) + src.slice(b); };
const tags = (old, nw, where) => { for (const ph of nw.match(/\{\w+/g) || []) if (!old.includes(ph)) { console.log("새 이름표", where, ph); bad++; } };
for (const [id, add] of Object.entries(T.sit || {})) { const s = SITUATIONS.find(x => x.id === id), old = s.text.join(" ");
  // 장면 문장: 원래 문장들이 걸리는 정규식 밖의 것에 새로 걸리면 안 됨 (원래 문장끼리도 조금씩 달라서 합집합으로)
  const d = diff(old, old + " " + add.join(" ")).filter(x => x[0] === "+"); if (d.length) { console.log("장면", id, d); bad++; }
  for (const t of add) tags(old, t, id);
  edit(id, q(s.text.at(-1)) + "]", q(s.text.at(-1)) + ", " + add.map(q).join(", ") + "]"); n += add.length; }
ALL = SETS.res;
for (const [id, list] of Object.entries(T.res || {})) { const s = SITUATIONS.find(x => x.id === id);
  list.forEach((pair, i) => { if (!pair) return; const c = s.choices[i];
    for (const [k, nw0] of [["winText", pair[0]], ["loseText", pair[1]]]) { if (!nw0) continue; const nws = [].concat(nw0), o = c[k][0];
      for (const nw of nws) { const d = diff(o, nw); if (d.length) { console.log("결과", id, i, k, nw.slice(0, 20), d); bad++; } tags(c[k].join(" "), nw, id + " " + i); }
      edit(id, q(c[k].at(-1)) + "]", q(c[k].at(-1)) + ", " + nws.map(q).join(", ") + "]"); n += nws.length; } }); }
ALL = SETS.lab;
// 상황별 선택지 이름과 성공 문장 앞말: by: { 장면id: [{ trail: [이름, 앞말], lead: …, rain: …, wind: … } 또는 null, …] }
const MOODS = ["trail", "lead", "rain", "wind"];
for (const [id, list] of Object.entries(T.by || {})) { const s = SITUATIONS.find(x => x.id === id);
  list.forEach((by, i) => { if (!by) return; const c = s.choices[i];
    if (c.by) { console.log("이미 있음", id, i); bad++; return; }
    for (const [k, v] of Object.entries(by)) { if (!MOODS.includes(k)) { console.log("모르는 상황", id, i, k); bad++; continue; }
      const [lab, pre] = v; ALL = SETS.lab; const d = diff(c.label, lab); if (d.length) { console.log("이름", id, i, k, lab, d); bad++; }
      if (/[{}"]/.test(lab + (pre || ""))) { console.log("이름표·따옴표", id, i, k); bad++; }
      if (s.choices.some(x => x.label === lab)) { console.log("다른 선택지와 같은 이름", id, lab); bad++; }
      if (pre) { ALL = SETS.res; const w = c.winText[0], d2 = diff(w, pre + " " + w); if (d2.length) { console.log("앞말", id, i, k, pre, d2); bad++; } }   // 엔진은 앞말을 첫 성공 문장에만 붙임
      n++; }
    edit(id, `label: ${q(c.label)},`, `label: ${q(c.label)}, by: { ${Object.entries(by).map(([k, v]) => `${k}: ${q(v.filter(Boolean)).replace(/","/g, '", "')}`).join(", ")} },`); }); }
console.log("정규식", SETS.sit.length, SETS.res.length, SETS.lab.length, "새 글", n, "문제", bad);
if (WRITE && !bad) { fs.writeFileSync(R + "data/match.js", src); console.log("저장"); }
