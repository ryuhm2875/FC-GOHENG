// Firebase 연결 (SDK 없이 REST로 직접). 로그인(Authentication)과 데이터베이스(Firestore)만 씁니다.
// 이 값들은 공개되어도 괜찮습니다. 누가 무엇을 읽고 쓸 수 있는지는 firestore.rules(보안 규칙)가 막습니다.
export const FB = {
  apiKey: "AIzaSyBtADZsLk0dYmm5ZNmnapoVMHIpj2vtRRA",
  projectId: "fcgoheung",
};
// 관리자(선생님) 계정 이메일. 바꾸면 firestore.rules 의 같은 이메일도 바꿔야 합니다.
export const ADMIN_EMAIL = "ryubongdoo@gmail.com";
// 학생 계정은 '학번.열쇠@fc.goheung' 모양의 가짜 이메일로 만듭니다 (학생은 학번만 입력)
export const STUDENT_DOMAIN = "fc.goheung";
export const studentEmail = (sid, key) => `${sid}.${key}@${STUDENT_DOMAIN}`;
// 학생 비밀번호 앞에 붙이는 글자 (Firebase는 6자 이상만 받아서, 4자리 숫자도 쓸 수 있게)
export const studentPassword = pw => `fcg-${pw}`;

// 시험용 가짜 서버 주소로 바꿀 수 있게 (tools/dev/fbmock.mjs)
const base = () => globalThis.FCG_FB_BASE || {
  auth: "https://identitytoolkit.googleapis.com/v1",
  token: "https://securetoken.googleapis.com/v1",
  store: "https://firestore.googleapis.com/v1",
};
const docsUrl = () => `${base().store}/projects/${FB.projectId}/databases/(default)/documents`;

export const FbError = class extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status; }
};

async function call(url, opts = {}, timeout = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  let res;
  try { res = await fetch(url, { ...opts, signal: ctl.signal }); }
  catch { throw new FbError("NETWORK", 0); }
  finally { clearTimeout(t); }
  let body = null;
  try { body = await res.json(); } catch { /* 빈 응답 */ }
  if (!res.ok) throw new FbError(String(body?.error?.message || body?.error?.status || res.status).split(" ")[0], res.status);
  return body;
}
const post = (url, data) => call(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

// ── 로그인 ─────────────────────────────
const authOut = r => ({ idToken: r.idToken, refreshToken: r.refreshToken, exp: Date.now() + (+r.expiresIn || 3600) * 1000 - 60000, uid: r.localId, email: r.email });
export async function signIn(email, password) {
  return authOut(await post(`${base().auth}/accounts:signInWithPassword?key=${FB.apiKey}`, { email, password, returnSecureToken: true }));
}
// 새 계정 만들기 (관리자 페이지에서 학생 계정을 만들 때). 만든 계정으로 로그인되지는 않음
export async function signUp(email, password) {
  return authOut(await post(`${base().auth}/accounts:signUp?key=${FB.apiKey}`, { email, password, returnSecureToken: true }));
}
export async function refresh(sess) {
  const r = await call(`${base().token}/token?key=${FB.apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(sess.refreshToken)}`,
  });
  return { ...sess, idToken: r.id_token, refreshToken: r.refresh_token, exp: Date.now() + (+r.expires_in || 3600) * 1000 - 60000 };
}
// 로그인 오류를 사람 말로
export function authMessage(e) {
  const c = e?.code || "";
  if (c === "NETWORK") return "인터넷에 연결되어 있지 않습니다.";
  if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_EMAIL/.test(c)) return "학번 또는 비밀번호가 맞지 않습니다.";
  if (/TOO_MANY_ATTEMPTS/.test(c)) return "여러 번 틀려서 잠시 막혔습니다. 몇 분 뒤에 다시 해 보세요.";
  if (/USER_DISABLED/.test(c)) return "사용이 중지된 계정입니다.";
  if (/EMAIL_EXISTS/.test(c)) return "이미 있는 계정입니다.";
  if (/WEAK_PASSWORD/.test(c)) return "비밀번호가 너무 짧습니다.";
  if (/PERMISSION_DENIED|403/.test(c)) return "권한이 없습니다.";
  return `서버 오류 (${c})`;
}

// ── 값 변환 (Firestore 형식 ↔ 보통 객체) ──
export function toFs(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  return { mapValue: { fields: fieldsOf(v) } };
}
const fieldsOf = o => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined).map(([k, x]) => [k, toFs(x)]));
export function fromFs(v) {
  if (!v) return null;
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFs);
  if ("mapValue" in v) return docData(v.mapValue);
  return null;
}
const docData = d => Object.fromEntries(Object.entries(d?.fields || {}).map(([k, x]) => [k, fromFs(x)]));

// ── 데이터베이스 ─────────────────────────
const hdr = tok => tok ? { Authorization: `Bearer ${tok}` } : {};
const idOf = name => name.split("/").pop();

// 문서 하나 읽기. 없으면 null
export async function getDoc(path, tok = null) {
  try { return docData(await call(`${docsUrl()}/${path}`, { headers: hdr(tok) })); }
  catch (e) { if (e.status === 404 || e.code === "NOT_FOUND") return null; throw e; }
}
// 문서 쓰기. fields 를 주면 그 칸만 바꿈 (나머지 칸은 그대로)
export async function setDoc(path, data, tok, fields = null) {
  const mask = (fields || []).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");
  return call(`${docsUrl()}/${path}${mask ? `?${mask}` : ""}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", ...hdr(tok) },
    body: JSON.stringify({ fields: fieldsOf(data) }),
  });
}
export async function delDoc(path, tok) {
  return call(`${docsUrl()}/${path}`, { method: "DELETE", headers: hdr(tok) });
}
// 모음(컬렉션) 전체 읽기 → [{ id, ...data }]
export async function listDocs(coll, tok) {
  const out = [];
  let page = "";
  for (let i = 0; i < 40; i++) {
    const r = await call(`${docsUrl()}/${coll}?pageSize=300${page ? `&pageToken=${encodeURIComponent(page)}` : ""}`, { headers: hdr(tok) });
    for (const d of r?.documents || []) out.push({ id: idOf(d.name), ...docData(d) });
    if (!r?.nextPageToken) break;
    page = r.nextPageToken;
  }
  return out;
}

// 무작위 열쇠 (학생 이메일에 들어감. 비밀번호를 바꿀 때마다 새로)
export function newKey() {
  const a = new Uint8Array(6);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(a);
  else a.forEach((_, i) => { a[i] = Math.random() * 256; });
  return [...a].map(x => (x % 36).toString(36)).join("");
}

// 저장 파일 압축 (gzip → base64). 지원하지 않는 브라우저는 그대로
export async function pack(text) {
  if (typeof CompressionStream === "undefined") return { enc: "raw", data: text };
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { enc: "gz64", data: btoa(s) };
}
export async function unpack({ enc, data }) {
  if (enc !== "gz64") return data;
  const bin = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

// 한국 시간으로 지금이 닫히는 시간대인지 (예: 22:00~07:00)
export function inQuiet(q, at = Date.now()) {
  const toMin = s => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const k = new Date(at + 9 * 3600 * 1000);
  const t = k.getUTCHours() * 60 + k.getUTCMinutes();
  const a = toMin(q.from), b = toMin(q.to);
  if (a === b) return false;
  return a < b ? t >= a && t < b : t >= a || t < b;
}
