// Proxy vers l'API Anthropic pour la reco IA de l'app Académie.
// La clé API reste côté serveur (variable d'environnement ANTHROPIC_API_KEY),
// jamais exposée au navigateur. Modèle par défaut : claude-opus-5
// (surchargéable via ANTHROPIC_MODEL, ex. claude-sonnet-5 ou claude-haiku-4-5
// pour aller plus vite / moins cher).

const https = require('https');

function anthropic(body, apiKey) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-length': Buffer.byteLength(payload)
      }
    }, (r) => {
      let data = '';
      r.on('data', (c) => { data += c; });
      r.on('end', () => resolve({ status: r.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed', code: 'error' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY non configurée', code: 'sampling_disabled' });
  }

  try {
    const prompt = req.body && req.body.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt manquant', code: 'error' });
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5';
    const { status, body } = await anthropic({
      model,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    }, apiKey);

    if (status < 200 || status >= 300) {
      let code = 'error';
      if (status === 429) code = 'rate_limited';
      else if (status === 401 || status === 403) code = 'sampling_disabled';
      let msg = 'Erreur API';
      try { const j = JSON.parse(body); msg = (j.error && j.error.message) || msg; } catch (e) {}
      return res.status(status).json({ error: msg, code });
    }

    const j = JSON.parse(body);
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    const truncated = j.stop_reason === 'max_tokens';
    return res.status(200).json({ text, truncated });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e), code: 'error' });
  }
};

module.exports.config = { maxDuration: 60 };
