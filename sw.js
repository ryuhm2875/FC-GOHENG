// 오프라인 모드 (서비스 워커)
// 인터넷이 될 때 한 번 접속하면 게임 파일·그림·글꼴을 휴대폰(브라우저)에 저장해 두고,
// 비행기 모드처럼 인터넷이 없을 때는 저장해 둔 파일로 게임을 엽니다.
//
// 고치는 사람을 위한 메모
// - 코드·데이터(html, css, js)는 "인터넷 먼저": 인터넷이 되면 항상 최신 파일을 받고, 안 되면 저장본을 씀.
//   그래서 data/ 파일을 고쳐 올리기만 해도 학생들 화면에 바로 반영됩니다. (이 파일은 고칠 필요 없음)
// - 그림·글꼴은 "저장본 먼저": 저장본을 바로 보여 주고, 인터넷이 되면 뒤에서 새 파일로 바꿔 둠.
// - 미리 받아 둘 파일 목록은 offline-files.js (node tools/bundle.mjs 가 자동으로 만듦)

const BUILD = "531131807a4d";                // node tools/bundle.mjs 가 자동으로 바꿈 (바뀌면 새 버전으로 인식)
importScripts("offline-files.js?b=" + BUILD);   // 빌드마다 주소가 달라 예전 목록이 캐시에서 나오지 않음
const CACHE = "gfc-files";          // 게임 파일
const FONT_CACHE = "gfc-fonts-v1";  // 인터넷 글꼴
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdn.jsdelivr.net"];
const FONT_CSS = [
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700;1,800&display=swap",
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
];
const FONT_FILES = [
  "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff",
  "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff",
];
const NET_TIMEOUT = 4000;           // 인터넷이 느리면 4초 뒤 저장본으로

const settle = ps => Promise.allSettled(ps);

async function put(cache, url, opts = {}) {
  const res = await fetch(url, { cache: "reload", ...opts });
  if (res.ok || res.type === "opaque") await cache.put(url, res.clone());
  return res;
}

// 글꼴: CSS를 받아 그 안에 적힌 글꼴 파일까지 모두 저장 (하나가 실패해도 나머지는 계속)
async function saveFonts() {
  const cache = await caches.open(FONT_CACHE);
  await settle(FONT_FILES.map(u => put(cache, u, { mode: "cors" })));
  await settle(FONT_CSS.map(async css => {
    const res = await put(cache, css, { mode: "cors" });
    const text = await res.text();
    const urls = [...text.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => new URL(m[1], css).href);
    for (let i = 0; i < urls.length; i += 8) await settle(urls.slice(i, i + 8).map(u => put(cache, u, { mode: "cors" })));
  }));
}

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const base = self.registration.scope;
    // 지난번에 받은 지문과 비교해 바뀌었거나 없는 파일만 받음 (매번 전부 다시 받지 않게)
    const MANI = new URL("__offline_manifest__", base).href;
    let old = {};
    try { old = await (await cache.match(MANI)).json(); } catch {}
    const now = {};
    await settle(OFFLINE_FILES.map(async ([f, h]) => {
      const url = new URL(f, base).href;
      if (old[f] === h && await cache.match(url)) { now[f] = h; return; }
      const res = await put(cache, url);
      if (res.ok) now[f] = h;
    }));
    await cache.put(MANI, new Response(JSON.stringify(now), { headers: { "Content-Type": "application/json" } }));
    try { const idx = await cache.match(new URL("index.html", base).href); if (idx) await cache.put(base, idx); } catch {}
    await saveFonts().catch(() => {});
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== FONT_CACHE && k.startsWith("gfc-")) await caches.delete(k);
    await self.clients.claim();
  })());
});

function withTimeout(p, ms) {
  return new Promise((ok, no) => { const t = setTimeout(() => no(new Error("timeout")), ms); p.then(v => { clearTimeout(t); ok(v); }, err => { clearTimeout(t); no(err); }); });
}

// 인터넷 먼저 (코드·데이터·페이지)
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(req, { cache: "no-cache" }), NET_TIMEOUT);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const idx = await cache.match(new URL("index.html", self.registration.scope).href);
      if (idx) return idx;
    }
    return Response.error();
  }
}

// 저장본 먼저 (그림·글꼴): 저장본을 바로 주고, 뒤에서 새로 받아 바꿔 둠
async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreSearch: name === CACHE });
  const fresh = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => null);
  if (hit) return hit;
  return (await fresh) || Response.error();
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith("/sw.js") || url.pathname.endsWith("/offline-files.js")) return;
    const isAsset = /\.(webp|png|jpg|jpeg|gif|svg|woff2?|mp3|ogg)$/i.test(url.pathname);
    e.respondWith(isAsset ? cacheFirst(req, CACHE) : networkFirst(req));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(cacheFirst(req, FONT_CACHE));
  }
});
