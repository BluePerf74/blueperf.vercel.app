// Notifications push (Web Push / VAPID) pour rappeler aux joueur·ses / client·es de remplir
// leur wellness et leurs RPE. Les clés VAPID et les abonnements sont stockés dans Redis (Upstash).
const { Redis } = require('@upstash/redis');
const webpush = require('web-push');

let redis;
function getRedis() {
  if (!redis) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    redis = new Redis({ url, token, automaticDeserialization: false });
  }
  return redis;
}
function parse(v){ if (v == null) return null; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch(e){ return null; } }

async function getVapid(db){
  let v = parse(await db.get('push:vapid'));
  if (!v || !v.publicKey || !v.privateKey) {
    v = webpush.generateVAPIDKeys();
    await db.set('push:vapid', JSON.stringify(v));
  }
  return v;
}
async function readBody(req){
  if (req.body) return typeof req.body === 'string' ? (()=>{try{return JSON.parse(req.body);}catch(e){return {};}})() : req.body;
  return await new Promise((resolve)=>{ let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{resolve(JSON.parse(d||'{}'));}catch(e){resolve({});} }); });
}
const SPACES = ['aca','ci'];
const todayISO = () => new Date().toISOString().slice(0,10);

// Envoie une notif à un·e joueur·se ; nettoie les abonnements périmés.
async function sendTo(db, space, pid, payload){
  const sub = parse(await db.get(`push:sub:${space}:${pid}`));
  if (!sub) return false;
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return true;
  } catch(err){
    if (err && (err.statusCode === 404 || err.statusCode === 410)) { try { await db.del(`push:sub:${space}:${pid}`); } catch(e){} }
    return false;
  }
}
async function listSubbedPids(db, space){
  const pids = []; let cursor = '0';
  do {
    const [next, batch] = await db.scan(cursor, { match: `push:sub:${space}:*`, count: 200 });
    batch.forEach(k => pids.push(String(k).split(':').pop()));
    cursor = next;
  } while (cursor !== '0');
  return pids;
}
// Joueur·ses en retard aujourd'hui : pas de wellness OU une séance du jour sans RPE.
async function latePids(db, space){
  const day = todayISO();
  const players = parse(await db.get(`${space}:players`)) || {};
  const sessions = parse(await db.get(`${space}:sessions`)) || {};
  const wellness = parse(await db.get(`${space}:wellness`)) || {};
  const wToday = (wellness[day] && wellness[day].entries) || {};
  const late = [];
  Object.values(players).forEach(p => {
    if (!p || p.active === false) return;
    const noWell = !wToday[p.id];
    const noRpe = Object.values(sessions).some(s => s && s.date === day && s.players && s.players[p.id] && s.players[p.id].rpe == null);
    if (noWell || noRpe) late.push(p.id);
  });
  return late;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const db = getRedis();
  try {
    const action = (req.query && req.query.action) || (req.method === 'GET' ? 'vapid' : '');

    if (req.method === 'GET' && action === 'vapid') {
      const v = await getVapid(db);
      return res.status(200).json({ publicKey: v.publicKey });
    }

    // Cron quotidien : rappel aux abonné·es des espaces où les rappels sont activés.
    if (action === 'cron') {
      const v = await getVapid(db);
      webpush.setVapidDetails('mailto:coach@blueperf.app', v.publicKey, v.privateKey);
      let sent = 0;
      for (const space of SPACES) {
        const cfg = parse(await db.get(`${space}:config`)) || {};
        const on = cfg.settings && cfg.settings.reminders;
        if (!on) continue;
        const late = await latePids(db, space);
        const subbed = await listSubbedPids(db, space);
        const targets = late.filter(p => subbed.includes(p));
        for (const pid of targets) {
          if (await sendTo(db, space, pid, { title: 'Blueperf — rappel', body: 'Pense à remplir ton wellness et tes RPE du jour 💪', url: '/academie/espace.html' })) sent++;
        }
      }
      return res.status(200).json({ ok: true, sent });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const space = body.space === 'ci' ? 'ci' : 'aca';

      if (action === 'subscribe') {
        if (!body.pid || !body.subscription) return res.status(400).json({ error: 'missing pid/subscription' });
        await db.set(`push:sub:${space}:${body.pid}`, JSON.stringify(body.subscription));
        return res.status(200).json({ ok: true });
      }
      if (action === 'unsubscribe') {
        if (body.pid) await db.del(`push:sub:${space}:${body.pid}`);
        return res.status(200).json({ ok: true });
      }
      if (action === 'send') {
        const v = await getVapid(db);
        webpush.setVapidDetails('mailto:coach@blueperf.app', v.publicKey, v.privateKey);
        const title = body.title || 'Blueperf — rappel';
        const bodyTxt = body.body || 'Pense à remplir ton wellness et tes RPE du jour 💪';
        const url = body.url || '/academie/espace.html';
        let pids = Array.isArray(body.pids) ? body.pids : null;
        if (!pids) pids = await latePids(db, space); // par défaut : les retardataires du jour
        const subbed = await listSubbedPids(db, space);
        const targets = pids.filter(p => subbed.includes(p));
        let sent = 0;
        for (const pid of targets) { if (await sendTo(db, space, pid, { title, body: bodyTxt, url })) sent++; }
        return res.status(200).json({ ok: true, sent, eligible: targets.length, subscribed: subbed.length });
      }
      // statut : qui est abonné
      if (action === 'status') {
        const subbed = await listSubbedPids(db, space);
        return res.status(200).json({ subscribed: subbed });
      }
    }
    return res.status(400).json({ error: 'bad request' });
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message || err) });
  }
};
