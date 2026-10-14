/* Détecteur de nouvelle version Blueperf.
   Interroge /api/version (jeton qui change à chaque déploiement). Quand le jeton diffère de
   celui chargé au démarrage, affiche un bandeau « Recharger » — l'utilisateur met à jour
   l'application sans la fermer ni la rouvrir. 100 % local : aucune donnée envoyée. */
(function () {
  'use strict';
  // Ne tourne que dans la fenêtre principale (pas dans les iframes des modules).
  try { if (window.top !== window.self) return; } catch (e) { return; }

  var ENDPOINT = '/api/version';
  var POLL_MS = 60000;      // vérification périodique
  var MIN_GAP_MS = 20000;   // anti-rafale sur focus/visibilité
  var current = null;       // jeton chargé au démarrage (référence)
  var dismissed = null;     // jeton dont l'utilisateur a fermé le bandeau
  var lastCheck = 0;
  var checking = false;

  function fetchVersion() {
    return fetch(ENDPOINT + '?_=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { return r && r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.v) || null; })
      .catch(function () { return null; });
  }

  function check() {
    if (checking) return;
    checking = true;
    lastCheck = Date.now();
    fetchVersion().then(function (v) {
      checking = false;
      if (!v) return;
      if (current === null) { current = v; return; } // 1re réponse = version de référence
      if (v !== current && v !== dismissed) showBar(v);
    });
  }

  function showBar(v) {
    if (document.getElementById('bp-update-bar') || !document.body) return;
    var bar = document.createElement('div');
    bar.id = 'bp-update-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText =
      'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:2147483647;' +
      'display:flex;align-items:center;gap:12px;max-width:calc(100vw - 24px);' +
      'background:#0e1a2c;color:#fff;border:1px solid rgba(255,255,255,.18);' +
      'box-shadow:0 8px 30px rgba(0,0,0,.35);border-radius:12px;padding:11px 14px;' +
      'font:600 13px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
    bar.innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:8px">' +
      '<span style="width:9px;height:9px;border-radius:50%;background:#3DA9FC;box-shadow:0 0 0 4px rgba(61,169,252,.25);flex:0 0 auto"></span>' +
      'Une nouvelle version est disponible</span>' +
      '<button type="button" id="bp-update-reload" style="appearance:none;cursor:pointer;border:0;border-radius:8px;padding:8px 14px;font:700 13px inherit;background:#3DA9FC;color:#04121f">Recharger</button>' +
      '<button type="button" id="bp-update-later" aria-label="Plus tard" title="Plus tard" style="appearance:none;cursor:pointer;border:0;background:transparent;color:#9fb4d2;font-size:18px;line-height:1;padding:2px 6px">×</button>';
    document.body.appendChild(bar);
    document.getElementById('bp-update-reload').addEventListener('click', function () {
      try { location.reload(); } catch (e) { location.href = location.href; }
    });
    document.getElementById('bp-update-later').addEventListener('click', function () {
      dismissed = v;              // on ne re-signale pas CETTE version
      var el = document.getElementById('bp-update-bar');
      if (el) el.remove();
    });
  }

  function maybeCheckOnWake() {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck > MIN_GAP_MS) check();
  }

  // Démarrage : première lecture (référence), puis vérifications régulières + au réveil de l'onglet.
  check();
  setInterval(check, POLL_MS);
  document.addEventListener('visibilitychange', maybeCheckOnWake);
  window.addEventListener('focus', maybeCheckOnWake);
})();
