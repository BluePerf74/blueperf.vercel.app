// Jeton de version du déploiement courant.
// Vercel injecte automatiquement VERCEL_GIT_COMMIT_SHA / VERCEL_URL à chaque déploiement :
// le jeton change donc tout seul à chaque mise en ligne, sans intervention manuelle.
// On renvoie un HASH tronqué (et non le SHA du commit) pour ne rien divulguer d'identifiant ;
// il suffit pour détecter « la version a changé ». Endpoint public, aucune donnée sensible.
const crypto = require('crypto');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  const raw =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_URL ||
    '';
  const v = raw ? crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12) : 'dev';
  return res.status(200).json({ v });
};
