const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

// Authentification : quand AUTH_SECRET est défini, chaque requête doit présenter un cookie de
// session valide (posé par /api/auth après vérification serveur des identifiants). Sans ce secret,
// comportement historique (ouvert) pour ne rien casser avant activation.
const SECRET = process.env.AUTH_SECRET || '';
function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function verifySession(token) {
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
function sessionCookie(req) {
  const h = req.headers.cookie || '';
  for (const p of h.split(';')) { const i = p.indexOf('='); if (i > 0 && p.slice(0, i).trim() === 'bp_sess') return decodeURIComponent(p.slice(i + 1).trim()); }
  return null;
}

let redis;
function getRedis() {
  if (!redis) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    // automaticDeserialization: false -> Upstash garde le texte tel quel au lieu d'essayer
    // de le réinterpréter comme un objet, ce qui cassait la relecture des séances/ressentis.
    redis = new Redis({ url, token, automaticDeserialization: false });
  }
  return redis;
}

// Cloisonnement multi-locataire (enseignants APA) : quand la session porte un tenant (t), TOUTES
// les clés sont automatiquement préfixées par "T:<tenant>:". L'enseignant ne peut donc PHYSIQUEMENT
// pas lire/écrire les données d'un autre tenant ni celles du propriétaire. Le propriétaire (sans t)
// garde l'accès complet (comportement historique).
function tenantPrefix(session) {
  return (session && session.t) ? ('T:' + session.t + ':') : '';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  let session = null;
  // Barrière d'authentification (active uniquement si AUTH_SECRET est configuré).
  if (SECRET) {
    session = verifySession(sessionCookie(req));
    if (!session) return res.status(401).json({ error: 'unauthorized' });
  }
  const PFX = tenantPrefix(session);

  try {
    const db = getRedis();

    if (req.method === 'GET') {
      const { action, key, prefix } = req.query;

      if (action === 'get') {
        if (!key) return res.status(400).json({ error: 'missing key' });
        const value = await db.get(PFX + key);
        return res.status(200).json({ value: value == null ? null : String(value) });
      }

      if (action === 'list') {
        const match = PFX + (prefix || '') + '*';
        const keys = [];
        let cursor = '0';
        do {
          const [nextCursor, batch] = await db.scan(cursor, { match, count: 200 });
          keys.push(...batch);
          cursor = nextCursor;
        } while (cursor !== '0');
        // On renvoie les clés SANS le préfixe de tenant (le client ne connaît que son espace).
        const out = PFX ? keys.map(k => (k.startsWith(PFX) ? k.slice(PFX.length) : k)) : keys;
        return res.status(200).json({ keys: out });
      }

      return res.status(400).json({ error: 'unknown action' });
    }

    if (req.method === 'POST') {
      const { action, key, value } = req.body || {};
      if (action === 'set') {
        if (!key) return res.status(400).json({ error: 'missing key' });
        await db.set(PFX + key, value);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'unknown action' });
    }

    if (req.method === 'DELETE') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'missing key' });
      await db.del(PFX + key);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
