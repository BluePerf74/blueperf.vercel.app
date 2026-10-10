// Authentification côté serveur pour Blueperf.
// - Vérifie les identifiants dans la base (Upstash) — jamais confiance au JS du navigateur.
// - Pose un cookie de session signé (HMAC) ; /api/storage l'exige quand AUTH_SECRET est défini.
// - Tant que AUTH_SECRET n'est PAS défini : mode "hérité" (aucune contrainte) → rien ne casse.
const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

let redis;
function getRedis() {
  if (!redis) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    redis = new Redis({ url, token, automaticDeserialization: false });
  }
  return redis;
}

const SECRET = process.env.AUTH_SECRET || '';
const COACH_USERNAME = 'hugo', COACH_CODE = 'BLUEPERF2026';
const SESSION_HOURS = 12;

const norm = s => (s || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
const slug = s => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const firstName = n => (n || '').trim().split(/\s+/)[0] || '';
const defLogin = name => { const f = slug(firstName(name)); return f ? f + '@aca.com' : ''; };
const defPass = name => { const f = slug(firstName(name)); return f ? f.slice(0, 3) + '123' : ''; };

async function getJSON(db, key) { try { const v = await db.get(key); return v ? JSON.parse(String(v)) : null; } catch (e) { return null; } }

function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function sign(obj) {
  const payload = b64url(JSON.stringify(obj));
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(payload).digest());
  return payload + '.' + sig;
}
function verify(token) {
  if (!token || !SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(parts[0]).digest());
  const a = Buffer.from(parts[1]); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (o.exp && Date.now() > o.exp) return null;
    return o;
  } catch (e) { return null; }
}
function parseCookies(req) {
  const h = req.headers.cookie || ''; const o = {};
  h.split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return o;
}

// Rend un rôle {r:'coach'|'client', s:space} si les identifiants correspondent à un compte, sinon null.
async function matchRole(db, user, pass) {
  const L = (user || '').trim().toLowerCase(), Ls = L.replace(/[^a-z0-9]/g, ''), P = (pass || '').trim();
  const U = norm(user), PN = norm(pass);
  if (!U || !PN) return null;
  // 1. Coach principal (identifiants personnalisés ou défaut)
  const creds = (await getJSON(db, 'coachCredentials')) || { username: COACH_USERNAME, password: COACH_CODE };
  if ((norm(creds.username) === U && norm(creds.password) === PN) || (norm(COACH_USERNAME) === U && norm(COACH_CODE) === PN)) return { r: 'coach', s: 'all' };
  // 2. Gérant·es d'équipe (Football)
  const mgrs = (await getJSON(db, 'aca:managers')) || {};
  for (const x of Object.values(mgrs)) {
    if (!x || x.active === false) continue;
    const su = (x.username || '').trim().toLowerCase(), sus = su.replace(/[^a-z0-9]/g, '');
    const dl = defLogin(x.username || ''), dls = dl.replace(/[^a-z0-9]/g, ''), dp = defPass(x.username || '');
    const lo = (su && (su === L || sus === Ls)) || (dl && (dl === L || dls === Ls));
    const po = (x.password && x.password === P) || (dp && dp === P);
    if (lo && po) return { r: 'coach', s: 'football' };
  }
  // 3. Coachs délégués par espace
  const coaches = (await getJSON(db, 'coaches')) || {};
  for (const c of Object.values(coaches)) {
    if (!c || c.active === false) continue;
    const cu = (c.username || '').trim().toLowerCase();
    if ((c.password || '').trim() === P && (cu === L || cu.replace(/[^a-z0-9]/g, '') === Ls)) return { r: 'coach', s: c.space || 'apa' };
  }
  // 4. Clients programme (base app)
  const clients = await getJSON(db, 'clients');
  if (Array.isArray(clients)) { const m = clients.find(c => c && norm(c.id) === U && c.code && norm(c.code) === PN); if (m) return { r: 'client', s: 'ci' }; }
  // 5. Joueur·ses / client·es Académie (Football, Coaching individuel)
  for (const sp of ['ci', 'aca']) {
    const players = (await getJSON(db, sp + ':players')) || {};
    const m = Object.values(players).find(x => {
      if (!x) return false;
      const sl = (x.login || '').trim().toLowerCase(), sls = sl.replace(/[^a-z0-9]/g, '');
      const dl = defLogin(x.name), dls = dl.replace(/[^a-z0-9]/g, ''), dp = defPass(x.name);
      const lo = (sl && (sl === L || sls === Ls)) || (dl && (dl === L || dls === Ls));
      const po = (x.pass && x.pass === P) || (dp && dp === P);
      return lo && po;
    });
    if (m) return { r: 'client', s: sp };
  }
  return null;
}

function setCookie(res, value, maxAge) {
  res.setHeader('Set-Cookie', 'bp_sess=' + value + '; Path=/; Max-Age=' + maxAge + '; HttpOnly; Secure; SameSite=Lax');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const action = (req.query && req.query.action) || '';

  // Statut de session (le client sait s'il doit afficher la connexion).
  if (req.method === 'GET') {
    const v = verify(parseCookies(req)['bp_sess']);
    return res.status(200).json({ legacy: !SECRET, authed: !!v, role: v ? v.r : null, space: v ? v.s : null });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    if (action === 'logout') { setCookie(res, '', 0); return res.status(200).json({ ok: true }); }

    // Mode hérité : AUTH_SECRET non configuré → on ne bloque rien (compatibilité).
    if (!SECRET) return res.status(200).json({ ok: true, legacy: true });

    try {
      const db = getRedis();
      const role = await matchRole(db, body.username, body.password);
      if (!role) return res.status(401).json({ ok: false });
      const token = sign({ r: role.r, s: role.s, exp: Date.now() + SESSION_HOURS * 3600 * 1000 });
      setCookie(res, token, SESSION_HOURS * 3600);
      return res.status(200).json({ ok: true, role: role.r, space: role.s });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String((e && e.message) || e) });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
};
