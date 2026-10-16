/* Blueperf — couche de traduction d'affichage (FR → EN).
 *
 * Objectif : quand l'utilisateur choisit « English » (localStorage bp_lang === 'en'),
 * toute l'interface des modules s'affiche en anglais, SANS toucher au code métier :
 * on ne traduit que le TEXTE AFFICHÉ (nœuds texte + quelques attributs visibles).
 *
 * Principe de sécurité :
 *  - Le français reste la source de vérité. Toute chaîne absente du dictionnaire
 *    reste en français → la version FR ne peut jamais casser.
 *  - On ne modifie jamais les valeurs de données (value des <input>, value des <option>,
 *    contenu des <textarea>), donc la logique (comparaisons, enregistrements) est intacte.
 *  - On ne traduit que si bp_lang === 'en'. En français, ce script ne fait rien.
 */
(function(){
  'use strict';
  function lang(){ try { return localStorage.getItem('bp_lang') || 'fr'; } catch(e){ return 'fr'; } }

  // Normalisation pour la recherche : apostrophes/guillemets courbes → droits, espaces
  // insécables → espace normal. Permet de matcher quel que soit le style typographique.
  function norm(x){
    return x.replace(/ /g,' ')
            .replace(/[’‘]/g,"'")
            .replace(/[“”]/g,'"')
            .replace(/…/g,'...');
  }

  var DICT = window.BP_I18N_DICT || {};
  // Index normalisé (clé normalisée → valeur EN)
  var NDICT = {};
  Object.keys(DICT).forEach(function(k){ NDICT[norm(k)] = DICT[k]; });

  // Motifs dynamiques (sur le cœur normalisé). Chaque entrée : [regex, fn(match)=>string]
  var PATTERNS = window.BP_I18N_PATTERNS || [];

  // Traduit une chaîne en préservant les espaces de début/fin.
  function tr(s){
    if (s == null) return s;
    var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m) return s;
    var lead = m[1], core = m[2], trail = m[3];
    if (!core) return s;
    var k = norm(core);
    var v = NDICT[k];
    if (v != null) return lead + v + trail;
    for (var i=0;i<PATTERNS.length;i++){
      var mm = k.match(PATTERNS[i][0]);
      if (mm){ try { return lead + PATTERNS[i][1](mm) + trail; } catch(e){ return s; } }
    }
    return s;
  }

  var SKIP = { SCRIPT:1, STYLE:1, TEXTAREA:1, NOSCRIPT:1, CODE:1 };

  function translateTextNodes(root){
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, jobs = [];
    while ((n = w.nextNode())){
      var p = n.parentNode;
      if (!p) continue;
      if (SKIP[p.nodeName]) continue;
      // Ne pas traduire le texte d'une <option> sans attribut value (le texte EST la valeur lue)
      if (p.nodeName === 'OPTION' && !p.hasAttribute('value')) continue;
      var cur = n.nodeValue;
      if (!cur || !/[A-Za-zÀ-ÿ]/.test(cur)) continue;
      var t = tr(cur);
      if (t !== cur) jobs.push([n, t]);
    }
    for (var i=0;i<jobs.length;i++){ jobs[i][0].nodeValue = jobs[i][1]; }
  }

  function translateAttrs(root){
    var sel = '[placeholder],[title],[aria-label],[data-tip],[alt]';
    var els = root.querySelectorAll ? root.querySelectorAll(sel) : [];
    for (var i=0;i<els.length;i++){
      var el = els[i];
      ['placeholder','title','aria-label','data-tip','alt'].forEach(function(a){
        if (!el.hasAttribute(a)) return;
        var v = el.getAttribute(a);
        if (!v) return;
        var t = tr(v);
        if (t !== v) el.setAttribute(a, t);
      });
    }
    // Boutons de type input (value est le libellé affiché)
    var btns = root.querySelectorAll ? root.querySelectorAll('input[type="button"],input[type="submit"],input[type="reset"]') : [];
    for (var j=0;j<btns.length;j++){
      var b = btns[j], bv = b.value;
      if (!bv) continue;
      var bt = tr(bv);
      if (bt !== bv) b.value = bt;
    }
  }

  function pass(){
    if (lang() !== 'en') return;
    try { translateTextNodes(document.body); } catch(e){}
    try { translateAttrs(document.body); } catch(e){}
    // Titre de l'onglet navigateur
    try { if (document.title){ var dt = tr(document.title); if (dt !== document.title) document.title = dt; } } catch(e){}
  }

  var scheduled = false;
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || function(f){ setTimeout(f,16); })(function(){
      scheduled = false;
      pass();
    });
  }

  function start(){
    if (lang() === 'en') pass();
    try {
      var mo = new MutationObserver(function(){ if (lang() === 'en') schedule(); });
      mo.observe(document.body, { childList:true, subtree:true, characterData:true });
    } catch(e){}
    // Quelques passes différées pour rattraper un rendu tardif au chargement.
    setTimeout(pass, 120);
    setTimeout(pass, 500);
    setTimeout(pass, 1500);
  }

  // Changement de langue dans un autre document de la même origine (ex. l'app parente
  // change bp_lang pendant que ce module est ouvert dans une iframe) → on recharge pour
  // repartir d'un rendu propre dans la nouvelle langue (gère aussi le retour EN → FR).
  var cur = lang();
  try {
    window.addEventListener('storage', function(e){
      if (!e || e.key === 'bp_lang' || e.key === null){
        var nl = lang();
        if (nl !== cur){ cur = nl; try { location.reload(); } catch(x){} }
      }
    });
  } catch(e){}

  if (document.body){ start(); }
  else document.addEventListener('DOMContentLoaded', start);
})();
