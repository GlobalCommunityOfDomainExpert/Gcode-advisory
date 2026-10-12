/**
 * Dev-only stand-in for the ORDS backend (auth + `gcode.profiles.v1`), so the app runs end to end before those
 * modules exist. In memory: everything is lost on restart. Never point production at this.
 *
 *   node dev/mock-ords.mjs            (listens on :9100)
 *   ORDS_BASE_URL=http://127.0.0.1:9100/ords/v1
 *
 * Magic values: the email code is always ABC123. Passwords are compared as the SHA-256 hex the BFF sends.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_ORDS_PORT ?? 9100);
const users = new Map(); // id -> { id, email, name, phone, pwd, verified, role }
const byEmail = new Map();
const profiles = new Map(); // id -> doc
const resetTokens = new Set();
let nextId = 252718407731520981746035218894106000n; // sys_guid-sized, to prove ids survive as strings

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (u) => `${b64({ alg: "HS256" })}.${b64({ sub: u.id, role: u.role ?? "NONE", full_name: u.name, email: u.email, exp: Math.floor(Date.now() / 1000) + 3600 })}.mock`;
const subOf = (req) => {
  const t = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  try {
    return JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString()).sub;
  } catch {
    return null;
  }
};

const ROLE_KEY = { EXPERT: "expert", FRESHER: "intern", STARTUP: "startup", INSTITUTION: "institute" };
const emptyDoc = (u) => ({
  role: ROLE_KEY[u.role],
  fields: { fullName: u.name },
  lists: { domains: [], skills: [], career: [], education: [], projects: [], contacts: [] },
  services: [],
  daysOff: [],
  files: {},
  published: false,
  payoutSet: false,
  paymentsEnabled: false,
});

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
};
const err = (res, message) => send(res, 200, { error: message });

createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const path = req.url.replace(/^.*\/v1/, "").split("?")[0];
    let body = {};
    try {
      // Quote 15+ digit integers so ids keep every digit (real ORDS reads them as NUMBER).
      body = raw ? JSON.parse(raw.replace(/("user_id"\s*:\s*)(\d{15,})/g, '$1"$2"')) : {};
    } catch {
      /* ignore */
    }
    const log = process.env.MOCK_LOG;
    if (log) console.log(req.method, path, JSON.stringify(body).slice(0, 200));

    // ---- auth ----
    if (path === "/auth/sign-up") {
      if (byEmail.has(body.email)) return err(res, "An account with this email already exists");
      const id = String((nextId += 7n));
      const u = { id, email: body.email, name: body.full_name, phone: body.phone, pwd: body.password, verified: false, role: null };
      users.set(id, u);
      byEmail.set(u.email, id);
      return send(res, 201, { message: "OTP sent to email" }); // like AUTH_PKG: no user_id until a role is chosen
    }
    if (path === "/auth/verify-otp") {
      const u = users.get(byEmail.get(body.email));
      if (!u || body.otp_code !== "ABC123") return err(res, "Invalid OTP");
      u.verified = true;
      return send(res, 200, { message: "ok" });
    }
    if (path === "/auth/select-stakeholder") {
      const u = users.get(byEmail.get(body.email));
      if (!u || !u.verified || !ROLE_KEY[String(body.role_name).toUpperCase()]) return err(res, "Cannot select role");
      u.role = String(body.role_name).toUpperCase();
      profiles.set(u.id, emptyDoc(u));
      return send(res, 200, { message: "ok", token: jwt(u) });
    }
    if (path === "/auth/sign-in") {
      const u = users.get(byEmail.get(body.email));
      if (!u || !u.verified || u.pwd !== body.password) return err(res, "Invalid credentials");
      return send(res, 200, `{"user_id":${u.id},"role_name":"${u.role ?? "NONE"}","token":"${jwt(u)}"}`);
    }
    if (path === "/auth/forgot-password") {
      const t = `mock-reset-${Math.random().toString(36).slice(2)}-${Date.now()}`;
      resetTokens.add(t);
      if (log) console.log("reset link token:", t, "origin:", body.origin);
      return send(res, 200, { message: "ok" });
    }
    if (path === "/auth/reset-password") {
      // Any well-formed token is accepted so tests can use a fixed one.
      const u = [...users.values()][0];
      if (u) u.pwd = body.new_password;
      return send(res, 200, { message: "ok" });
    }

    // ---- profiles ----
    const m = path.match(/^\/profiles\/me(?:\/(.+))?$/);
    if (m) {
      const id = subOf(req);
      const doc = id && profiles.get(String(id));
      if (!doc) return send(res, 401, { error: "Unauthorized" });
      const sub = m[1];

      if (!sub && req.method === "GET") return send(res, 200, doc);

      if (sub === "publish") {
        doc.published = req.method === "POST";
        return send(res, 200, { message: "ok" });
      }

      const file = sub?.match(/^files\/(photo|banner|logo|deck)$/);
      if (file && req.method === "PUT") {
        doc.files[file[1]] = { name: body.name, url: `data:${body.contentType};base64,${body.data}` };
        return send(res, 200, { message: "ok" });
      }

      if (sub && req.method === "PUT") {
        if (body.fields) Object.assign(doc.fields, body.fields);
        if (body.lists) Object.assign(doc.lists, body.lists);
        if (body.services) doc.services = body.services;
        if (body.daysOff) doc.daysOff = body.daysOff;
        return send(res, 200, { message: "ok" });
      }
    }
    send(res, 404, { error: "not found" });
  });
}).listen(PORT, () => console.log(`mock ORDS on :${PORT}`));
