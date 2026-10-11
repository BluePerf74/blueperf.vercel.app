#!/usr/bin/env node
/*
  build.js — régénère app.min.js à partir de app.js, puis met à jour le numéro de
  version (?v=...) dans index.html pour forcer le rechargement côté navigateur.

  app.js est LE fichier source à modifier. app.min.js est généré, ne pas l'éditer.

  Utilisation :  node build.js
  (nécessite terser en devDependency : npm install)
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify } = require('terser');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'app.js');
const OUT = path.join(ROOT, 'app.min.js');
const HTML = path.join(ROOT, 'index.html');

(async () => {
  const code = fs.readFileSync(SRC, 'utf8');
  const result = await minify(code, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (result.error) { console.error(result.error); process.exit(1); }

  fs.writeFileSync(OUT, result.code);
  const ver = crypto.createHash('sha256').update(result.code).digest('hex').slice(0, 8);

  let html = fs.readFileSync(HTML, 'utf8');
  const before = html;
  html = html.replace(/src="\/app\.min\.js\?v=[^"]*"/, 'src="/app.min.js?v=' + ver + '"');
  if (html === before) {
    console.error('ERREUR : balise <script src="/app.min.js?v=..."> introuvable dans index.html');
    process.exit(1);
  }
  fs.writeFileSync(HTML, html);

  const kb = n => (n / 1024).toFixed(1) + ' Ko';
  console.log('app.js     :', kb(Buffer.byteLength(code)));
  console.log('app.min.js :', kb(Buffer.byteLength(result.code)), '(version ' + ver + ')');
})();
