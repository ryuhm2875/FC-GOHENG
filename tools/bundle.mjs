// 내 컴퓨터에서 index.html을 더블클릭해도 열리도록, 모든 js를 js/game.bundle.js 한 파일로 묶습니다.
// 사용: node tools/bundle.mjs   (data/ 파일을 고친 뒤 다시 실행)
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const order = [], seen = new Map();
const IMPORT = /^import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?\s*$/gm;

function visit(abs, stack = []) {
  const id = relative(ROOT, abs).replaceAll("\\", "/");
  if (seen.get(id) === "done") return id;
  if (seen.get(id) === "visiting") return { cyclic: id }; // 순환: 나중에 채움
  seen.set(id, "visiting");
  const src = readFileSync(abs, "utf8");
  const deps = [];
  for (const m of src.matchAll(IMPORT)) {
    const r = visit(resolve(dirname(abs), m[2]), [...stack, id]);
    deps.push(typeof r === "string" ? { names: m[1], dep: r } : { names: m[1], dep: r.cyclic, late: true });
  }
  let body = src.replace(IMPORT, "");
  const exported = [];
  body = body.replace(/^export\s+(const|function|let)\s+([A-Za-z_$][\w$]*)/gm, (_, kw, name) => { exported.push(name); return `${kw} ${name}`; });
  body = body.replace(/^export\s*\{([^}]*)\};?\s*$/gm, (_, list) => { list.split(",").map(s => s.trim()).filter(Boolean).forEach(n => exported.push(n)); return ""; });
  if (/^\s*(import|export)\s/m.test(body)) throw new Error("처리 못한 import/export: " + id);
  const head = deps.map(d => {
    const pairs = d.names.split(",").map(x => x.trim()).filter(Boolean).map(x => { const [a, b] = x.split(/\s+as\s+/); return [a, b || a]; });
    if (!d.late) return `const {${pairs.map(([a, b]) => a === b ? a : `${a}: ${b}`).join(", ")}} = __m[${JSON.stringify(d.dep)}];`;
    return `let ${pairs.map(p => p[1]).join(", ")}; (__fix[${JSON.stringify(d.dep)}] ||= []).push(() => { ${pairs.map(([a, b]) => `${b} = __m[${JSON.stringify(d.dep)}].${a};`).join(" ")} });`;
  }).join("\n");
  order.push(`// ── ${id}\n__m[${JSON.stringify(id)}] = (function () {\n${head}\n${body}\nreturn { ${exported.join(", ")} };\n})();\n(__fix[${JSON.stringify(id)}] || []).forEach(f => f());`);
  seen.set(id, "done");
  return id;
}

visit(join(ROOT, "js/main.js"));
const out = `// 자동 생성 파일입니다. 직접 고치지 말고 node tools/bundle.mjs 로 다시 만드세요.\n(function () {\n"use strict";\nconst __m = {}, __fix = {};\n${order.join("\n\n")}\n})();\n`;
writeFileSync(join(ROOT, "js/game.bundle.js"), out);
console.log(`js/game.bundle.js: ${order.length}개 파일, ${(out.length / 1024).toFixed(0)}KB`);

// 오프라인 모드에서 미리 받아 둘 파일 목록 (sw.js 가 읽음). 인터넷 주소로 열 때만 쓰므로 game.bundle.js 는 뺌
const list = ["index.html", "manifest.webmanifest"];
const walk = d => readdirSync(join(ROOT, d)).sort().forEach(f => {
  const rel = `${d}/${f}`;
  if (statSync(join(ROOT, rel)).isDirectory()) return walk(rel);
  if (/\.(js|css|webp|png|jpe?g)$/i.test(f) && rel !== "js/game.bundle.js") list.push(rel);
});
["css", "js", "data", "assets"].forEach(walk);
// 파일마다 내용 지문(해시)을 붙여, 바뀐 파일만 다시 받게 함
const hashOf = f => createHash("sha1").update(readFileSync(join(ROOT, f))).digest("hex").slice(0, 10);
const entries = list.map(f => [f, hashOf(f)]);
writeFileSync(join(ROOT, "offline-files.js"), `// 자동 생성 파일입니다 (node tools/bundle.mjs). 오프라인 모드에서 미리 받아 둘 파일 목록과 내용 지문\nself.OFFLINE_FILES = [\n${entries.map(e => "  " + JSON.stringify(e)).join(",\n")}\n];\n`);
// sw.js 의 BUILD 값을 바꿔 두어야 브라우저가 새 버전을 알아챔
const build = createHash("sha1").update(entries.map(e => e.join(":")).join("|")).digest("hex").slice(0, 12);
const swPath = join(ROOT, "sw.js");
writeFileSync(swPath, readFileSync(swPath, "utf8").replace(/^const BUILD = ".*?";/m, `const BUILD = "${build}";`));
console.log(`offline-files.js: ${list.length}개 파일`);
