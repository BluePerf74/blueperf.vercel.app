/*
  Bannière « Installer l'app » (PWA) — partagée par l'app de base et l'espace client.
  - Android / Chrome : capte l'événement beforeinstallprompt et propose un bouton « Installer »
    qui déclenche l'installation native.
  - iPhone / Safari : pas d'installation programmée possible → on affiche le mode d'emploi
    (Partager → Sur l'écran d'accueil).
  - Ne s'affiche jamais si l'app est déjà installée (mode standalone) ou si l'utilisateur a fermé
    la bannière (mémorisé 30 jours).
*/
(function () {
  try {
    var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) return;

    var KEY = 'bp_install_dismissed';
    try {
      var until = +localStorage.getItem(KEY);
      if (until && Date.now() < until) return;
    } catch (e) {}

    var ua = navigator.userAgent || '';
    var isIOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
    var isAndroid = /android/i.test(ua);
    var deferred = null;
    var shown = false;

    function dismiss() {
      var b = document.getElementById('bp-install-banner');
      if (b) b.remove();
      try { localStorage.setItem(KEY, String(Date.now() + 30 * 24 * 3600 * 1000)); } catch (e) {}
    }

    function banner(innerHTML) {
      if (shown || document.getElementById('bp-install-banner')) return;
      shown = true;
      var d = document.createElement('div');
      d.id = 'bp-install-banner';
      d.setAttribute('role', 'dialog');
      d.setAttribute('aria-label', "Installer l'application Blueperf");
      d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;background:#0D1B2A;color:#E6ECF4;border:1px solid #27405f;border-radius:14px;padding:13px 14px;box-shadow:0 12px 34px rgba(0,0,0,.45);font:14px/1.45 system-ui,-apple-system,sans-serif;max-width:460px;margin:0 auto;display:flex;align-items:center;gap:12px';
      d.innerHTML = innerHTML;
      document.body.appendChild(d);
      var close = d.querySelector('[data-bp-close]');
      if (close) close.addEventListener('click', dismiss);
      var act = d.querySelector('[data-bp-install]');
      if (act) act.addEventListener('click', doInstall);
    }

    function logoAndText(text) {
      return '<div style="flex:none;width:34px;height:34px;border-radius:9px;background:#15283f;display:flex;align-items:center;justify-content:center;font-weight:800;color:#3DA9FC;font-size:13px">BP</div>' +
        '<div style="flex:1;min-width:0">' + text + '</div>';
    }
    function closeBtn() {
      return '<button data-bp-close aria-label="Fermer" style="flex:none;appearance:none;background:none;border:0;color:#8aa0bd;font-size:20px;line-height:1;cursor:pointer;padding:4px">×</button>';
    }

    function showAndroidBanner() {
      banner(
        logoAndText('<b>Installer Blueperf</b><div style="color:#aebacd;font-size:12.5px;margin-top:1px">Accès rapide depuis ton écran d\'accueil.</div>') +
        '<button data-bp-install style="flex:none;appearance:none;cursor:pointer;background:#3DA9FC;color:#04121f;border:0;border-radius:10px;padding:10px 15px;font-weight:800;font-size:13.5px">Installer</button>' +
        closeBtn()
      );
    }

    function showIOSBanner() {
      banner(
        logoAndText('<b>Installer Blueperf</b><div style="color:#aebacd;font-size:12.5px;margin-top:2px">Appuie sur le bouton <span style="color:#E6ECF4">Partager</span> de Safari, puis « <span style="color:#E6ECF4">Sur l\'écran d\'accueil</span> ».</div>') +
        closeBtn()
      );
    }

    function doInstall() {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { dismiss(); }).catch(function () {});
      deferred = null;
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      // petit délai pour ne pas gêner le chargement
      setTimeout(showAndroidBanner, 2500);
    });

    window.addEventListener('appinstalled', dismiss);

    // iOS : pas d'événement d'install → on montre le mode d'emploi, une fois la page prête.
    if (isIOS && !isAndroid) {
      setTimeout(function () { if (!deferred) showIOSBanner(); }, 3000);
    }
  } catch (e) {}
})();
