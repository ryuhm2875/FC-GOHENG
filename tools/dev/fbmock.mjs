// 시험용 가짜 Firebase (로그인 + Firestore REST 일부 + firestore.rules 와 같은 권한 검사)
// node tools/dev/fbmock.mjs [포트]   → 브라우저에서 globalThis.FCG_FB_BASE = { auth: "http://localhost:8790/auth", token: "http://localhost:8790/token", store: "http://localhost:8790/store" }
import http from "node:http";

const PORT = +(process.argv[2] || 8790);
const ADMIN = "ryubongdoo@gmail.com";
const users = new Map();          // email → { pw, uid }
const tokens = new Map();         // token → email
const docs = new Map();           // "coll/id" → { fields, updateTime }
let seq = 0;
const stats = { reads: 0, writes: 0, denied: 0 };

users.set(ADMIN, { pw: "admin123", uid: "u_admin" });

const send = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS" });
  res.end(body === undefined ? "" : JSON.stringify(body));
};
const err = (res, code, message) => send(res, code, { error: { code, message, status: message } });
const issue = email => { const t = `tok${++seq}_${Math.random().toString(36).slice(2)}`; tokens.set(t, email); return t; };
const authResp = email => ({ idToken: issue(email), refreshToken: `r_${issue(email)}`, expiresIn: "3600", localId: users.get(email).uid, email });

// Firestore 값 → JS (규칙 검사용)
const val = v => v == null ? null : "stringValue" in v ? v.stringValue : "booleanValue" in v ? v.booleanValue : "integerValue" in v ? +v.integerValue : "doubleValue" in v ? v.doubleValue
  : "mapValue" in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)])) : "arrayValue" in v ? (v.arrayValue.values || []).map(val) : null;

// firestore.rules 를 그대로 옮김
function allowed(op, coll, id, email, before, after) {
  const isAdmin = email === ADMIN;
  const isMe = () => { const lg = docs.get(`fcg_login/${id}`); if (!lg || !email) return false; const key = val(lg.fields.key); const blk = val(lg.fields.blocked); return email === `${id}.${key}@fc.goheung` && blk !== true; };
  if (coll === "fcg_config" || coll === "fcg_login") return op === "read" || op === "list" ? true : isAdmin;
  if (coll === "fcg_students") {
    if (op === "list") return isAdmin;
    if (op === "read") return isAdmin || isMe();
    if (op === "create" || op === "delete") return isAdmin;
    if (op === "update") {
      if (isAdmin) return true;
      if (!isMe()) return false;
      const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
      const changed = [...keys].filter(k => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]));
      return changed.every(k => ["play", "now", "lastSeen"].includes(k));
    }
  }
  if (coll === "fcg_saves") return op === "list" ? isAdmin : isAdmin || isMe();
  return false;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204);
  let raw = "";
  for await (const c of req) raw += c;
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  try {
    if (p === "/__stats") return send(res, 200, { ...stats, users: [...users.keys()], docs: Object.fromEntries([...docs].map(([k, v]) => [k, Object.fromEntries(Object.entries(v.fields).map(([a, b]) => [a, val(b)]))])) });
    if (p === "/__reset") { docs.clear(); [...users.keys()].filter(e => e !== ADMIN).forEach(e => users.delete(e)); return send(res, 200, {}); }
    if (p.startsWith("/auth/accounts:")) {
      const b = JSON.parse(raw || "{}");
      if (p.endsWith(":signUp")) {
        if (users.has(b.email)) return err(res, 400, "EMAIL_EXISTS");
        if (String(b.password).length < 6) return err(res, 400, "WEAK_PASSWORD : Password should be at least 6 characters");
        users.set(b.email, { pw: b.password, uid: `u${++seq}` });
        return send(res, 200, authResp(b.email));
      }
      if (p.endsWith(":signInWithPassword")) {
        const u = users.get(b.email);
        if (!u || u.pw !== b.password) return err(res, 400, "INVALID_LOGIN_CREDENTIALS");
        return send(res, 200, authResp(b.email));
      }
    }
    if (p === "/token/token") {
      const rt = new URLSearchParams(raw).get("refresh_token") || "";
      const email = tokens.get(rt.replace(/^r_/, ""));
      if (!email) return err(res, 400, "INVALID_REFRESH_TOKEN");
      const a = authResp(email);
      return send(res, 200, { id_token: a.idToken, refresh_token: a.refreshToken, expires_in: "3600", user_id: a.localId });
    }
    const m = p.match(/^\/store\/projects\/[^/]+\/databases\/\(default\)\/documents\/(.+)$/);
    if (m) {
      const parts = decodeURIComponent(m[1]).split("/");
      const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
      const email = tok ? tokens.get(tok) : null;
      if (tok && !email) return err(res, 401, "UNAUTHENTICATED");
      if (parts.length === 1) {                                   // 목록
        if (!allowed("list", parts[0], null, email)) { stats.denied++; return err(res, 403, "PERMISSION_DENIED"); }
        const out = [...docs].filter(([k]) => k.startsWith(parts[0] + "/")).map(([k, d]) => ({ name: `projects/p/databases/(default)/documents/${k}`, fields: d.fields }));
        stats.reads += out.length || 1;
        return send(res, 200, out.length ? { documents: out } : {});
      }
      const [coll, id] = parts, key = `${coll}/${id}`, cur = docs.get(key);
      const curData = cur ? val({ mapValue: { fields: cur.fields } }) : null;
      if (req.method === "GET") {
        if (!allowed("read", coll, id, email, curData)) { stats.denied++; return err(res, 403, "PERMISSION_DENIED"); }
        stats.reads++;
        if (!cur) return err(res, 404, "NOT_FOUND");
        return send(res, 200, { name: key, fields: cur.fields });
      }
      if (req.method === "PATCH") {
        const body = JSON.parse(raw || "{}");
        const mask = url.searchParams.getAll("updateMask.fieldPaths");
        const fields = mask.length ? { ...(cur?.fields || {}) } : {};
        if (mask.length) for (const f of mask) { if (body.fields?.[f] !== undefined) fields[f] = body.fields[f]; else delete fields[f]; }
        else Object.assign(fields, body.fields || {});
        const after = val({ mapValue: { fields } });
        if (!allowed(cur ? "update" : "create", coll, id, email, curData, after)) { stats.denied++; return err(res, 403, "PERMISSION_DENIED"); }
        stats.writes++;
        docs.set(key, { fields });
        return send(res, 200, { name: key, fields });
      }
      if (req.method === "DELETE") {
        if (!allowed("delete", coll, id, email, curData)) { stats.denied++; return err(res, 403, "PERMISSION_DENIED"); }
        docs.delete(key); stats.writes++;
        return send(res, 200, {});
      }
    }
    err(res, 404, "NO_ROUTE " + p);
  } catch (e) { err(res, 500, String(e)); }
});
server.listen(PORT, () => console.log(`가짜 Firebase: http://localhost:${PORT}`));
