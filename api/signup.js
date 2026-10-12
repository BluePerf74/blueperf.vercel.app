// Auto-inscription des enseignants APA (endpoint PUBLIC, sans authentification).
// Crée un compte enseignant « en attente » (active:false) dans le registre apaTeachers.
// Le propriétaire doit l'activer manuellement (abonnement) depuis sa console avant toute connexion.
const { Redis } = require('@upstash/redis');

let redis;
function getRedis() {
  if (!redis) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    redis = new Redis({ url, token, automaticDeserialization: false });
  }
  return redis;
}

async function getJSON(db, key) { try { const v = await db.get(key); return v ? JSON.parse(String(v)) : null; } catch (e) { return null; } }
const clean = (s, max) => (s == null ? '' : String(s)).trim().slice(0, max || 120);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method not allowed' }); }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const name = clean(body.name, 80);
  const email = clean(body.email, 120);
  const login = clean(body.login, 80);
  const pass = clean(body.pass, 80);

  if (!login || !pass) return res.status(400).json({ ok: false, error: 'missing' });
  if (login.length < 3 || pass.length < 4) return res.status(400).json({ ok: false, error: 'tooshort' });

  try {
    const db = getRedis();
    const teachers = (await getJSON(db, 'apaTeachers')) || {};
    // Garde-fou anti-spam : nombre total de comptes borné.
    if (Object.keys(teachers).length >= 500) return res.status(429).json({ ok: false, error: 'full' });
    // Unicité de l'identifiant (insensible à la casse).
    const L = login.toLowerCase();
    const clash = Object.values(teachers).find(x => x && (x.login || '').trim().toLowerCase() === L);
    if (clash) return res.status(409).json({ ok: false, error: 'exists' });

    const id = 'ap' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    teachers[id] = { id, name: name || login, email, login, pass, active: false, source: 'signup', createdAt: new Date().toISOString() };
    await db.set('apaTeachers', JSON.stringify(teachers));
    return res.status(200).json({ ok: true, pending: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  }
};
