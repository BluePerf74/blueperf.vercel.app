const { Redis } = require('@upstash/redis');

let redis;
function getRedis() {
  if (!redis) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    redis = new Redis({ url, token });
  }
  return redis;
}

module.exports = async (req, res) => {
  // Empêche Vercel (ou tout intermédiaire) de mettre ces réponses en cache : les données changent
  // à chaque validation de séance, une lecture mise en cache montrerait une ancienne version.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  try {
    const db = getRedis();

    if (req.method === 'GET') {
      const { action, key, prefix } = req.query;

      if (action === 'get') {
        if (!key) return res.status(400).json({ error: 'missing key' });
        const value = await db.get(key);
        return res.status(200).json({ value: value == null ? null : String(value) });
      }

      if (action === 'list') {
        const match = (prefix || '') + '*';
        const keys = [];
        let cursor = '0';
        do {
          const [nextCursor, batch] = await db.scan(cursor, { match, count: 200 });
          keys.push(...batch);
          cursor = nextCursor;
        } while (cursor !== '0');
        return res.status(200).json({ keys });
      }

      return res.status(400).json({ error: 'unknown action' });
    }

    if (req.method === 'POST') {
      const { action, key, value } = req.body || {};
      if (action === 'set') {
        if (!key) return res.status(400).json({ error: 'missing key' });
        await db.set(key, value);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'unknown action' });
    }

    if (req.method === 'DELETE') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'missing key' });
      await db.del(key);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
