/* Programme 12 semaines de Cindy — repris tel quel (contenu d'origine). Exposé en global window.PROG12. */
(function(){
const BASE_A = [
  { name: "Échauffement articulaire + activation fessiers/chevilles", fixed: "6-8 min", note: "Montées de genoux, talons-fesses, pas chassés, montées sur pointes", how: "Enchaîne les mouvements les uns après les autres pendant la durée indiquée : montées de genoux en marchant, talons-fesses, pas chassés sur le côté, puis montées sur la pointe des pieds. L'idée est d'échauffer progressivement les articulations et de réveiller les muscles avant l'effort." },
  { name: "Squat", reps: "10-12", note: "Poids du corps pour commencer, tempo contrôlé, amplitude complète", how: "Pieds écartés largeur d'épaules, pointes légèrement ouvertes. Descends comme pour t'asseoir sur une chaise : dos droit, poids sur les talons, genoux qui suivent la direction des pieds. Remonte en poussant sur les talons." },
  { name: "Fentes marchées", reps: "10 / jambe", note: "Genou aligné, tronc gainé", how: "Fais un grand pas en avant et descends jusqu'à ce que le genou arrière frôle le sol, genou avant aligné avec le pied. Pousse sur la jambe avant pour avancer directement sur l'autre jambe, buste droit." },
  { name: "Extension dorsale (superman)", reps: "12-15", note: "Contraction 2 sec en haut, mouvement lent et contrôlé", how: "Allongée sur le ventre, bras tendus devant toi. Lève en même temps la poitrine, les bras et les jambes en contractant le bas du dos et les fessiers, tiens 1-2 secondes, puis redescends doucement." },
  { name: "Pompes (genoux si besoin)", reps: "8-12", note: "Progression selon niveau", how: "Mains un peu plus larges que les épaules, corps gainé de la tête aux talons (ou genoux au sol). Descends jusqu'à ce que la poitrine frôle le sol, coudes proches du corps, puis repousse le sol." },
  { name: "Équilibre unipodal + variantes", reps: "30-40 sec / côté", note: "Travail cheville — pieds nus si possible", how: "Tiens-toi en équilibre sur une jambe, genou légèrement fléchi, regard devant. Pour complexifier : ferme les yeux ou pose le pied sur une surface instable. Change de jambe à la moitié du temps." },
  { name: "Montées sur pointe unipodales", reps: "12-15 / côté", note: "Mollets / péroniers, prévention cheville", how: "En appui sur une seule jambe, monte le plus haut possible sur la pointe du pied puis redescends lentement sans reposer complètement le talon. Tu peux te tenir légèrement à un support." },
  { name: "Gainage ventral + latéral", reps: "30-40 sec / côté", note: "Respiration continue, pas de blocage", how: "Ventral : appui sur les avant-bras et pointes de pieds, corps aligné, ventre engagé, sans creuser le bas du dos. Latéral : sur le côté, appui sur un avant-bras, hanche décollée. Respire normalement." },
  { name: "Bird-dog / extension lombaire douce", reps: "10 / côté", fixedSeries: 2, note: "Ciblé bas du dos, à faire lentement", how: "À quatre pattes, tends un bras devant toi et la jambe opposée derrière, dos plat et bassin stable. Reviens lentement puis change de côté." },
  { name: "Retour au calme : étirements + respiration", fixed: "5 min", note: "", how: "Étire doucement les muscles sollicités (mollets, ischios, quadriceps, dos) en tenant chaque position 20 à 30 secondes, en respirant calmement." }
];
const BASE_B = [
  { name: "Échauffement", fixed: "5 min", note: "Mobilité hanches + rachis", how: "Mobilise les hanches (rotations, fentes dynamiques) et le dos (rotations du buste, dos rond / dos creux à quatre pattes) pendant la durée indiquée." },
  { name: "Soulevé de terre unijambiste (poids du corps)", reps: "8-10 / jambe", note: "Dos plat, mouvement lent, appui léger si besoin d'équilibre", how: "Debout sur une jambe, penche le buste vers l'avant en tendant l'autre jambe vers l'arrière, dos bien plat, puis reviens debout. Tu peux toucher le sol du bout des doigts ou te tenir à un mur au début." },
  { name: "Hip thrust", reps: "12", note: "Fessiers + protection lombaire", how: "Dos appuyé contre un support stable, pieds à plat. Pousse les hanches vers le haut en contractant les fessiers jusqu'à former une ligne droite épaules-genoux, puis redescends sans reposer complètement." },
  { name: "Y-T-W au sol (activation scapulaire)", reps: "8 par lettre", note: "Mouvement lent, sans forcer sur la nuque", how: "Allongée sur le ventre, front légèrement décollé. Lève les bras en Y, puis en T, puis en W. Petits mouvements : le contrôle compte plus que l'amplitude." },
  { name: "Planche avec touches d'épaule", reps: "10 touches / côté", note: "Hanches stables, elles ne doivent pas basculer", how: "En position de planche bras tendus, touche ton épaule gauche avec la main droite puis l'inverse. Le bassin reste stable sans tourner — c'est ça qui muscle le gainage anti-rotation." },
  { name: "Marche sur pointes puis sur les talons", reps: "20 pas de chaque", fixedSeries: 2, note: "Prévention cheville, pieds nus si possible", how: "Marche en ligne droite sur la pointe des pieds une vingtaine de pas, puis reviens en marchant sur les talons. Ça renforce les muscles autour de la cheville, sans matériel." },
  { name: "Étirements bas du dos + respiration", fixed: "5 min", note: "Idéalement aussi avant le coucher les autres soirs", how: "Position de l'enfant ou genoux ramenés contre la poitrine sur le dos, en respirant profondément et lentement." }
];
const RUN_META = [
  { label: "Sortie 1 — mercredi", note: "Facile, récupération post-entraînement", day: 'mercredi' },
  { label: "Sortie 2 — vendredi", note: "Très facile, avant matchs du week-end", day: 'vendredi' },
  { label: "Sortie 3 — dimanche", note: "Facile à modérée, sortie longue (si pas de match)", day: 'dimanche' }
];
function seanceA(series, opts) {
  opts = opts || {};
  const ex = BASE_A.map(e => Object.assign({}, e, { series: e.fixedSeries || series }));
  if (opts.plyo) ex.splice(ex.length - 1, 0, { name: "Appuis dynamiques / petits sauts bas", reps: "6-8", series: "2-3", note: "Amorce vitesse / explosivité — réception contrôlée", how: "Petits sauts sur place ou faibles bondissements avant/latéraux, en cherchant une réception souple et silencieuse. Reste sur une surface stable et non glissante." });
  if (opts.tests) ex.splice(ex.length - 1, 0, { name: "Tests de fin de bloc (facultatif)", fixed: "10 min", note: "Ex : temps d'équilibre unipodal max, nb de pompes en 1 min — à comparer avec S1", how: "Chronomètre le temps tenu en équilibre sur une jambe, puis compte le nombre de pompes en 1 minute avec une bonne technique. Note les résultats pour comparer la progression." });
  return ex;
}
function seanceB(series, courte) {
  let ex = BASE_B.map(e => Object.assign({}, e, { series: e.fixedSeries || series }));
  if (courte) ex = ex.filter(e => e.name.indexOf("Planche avec touches d'épaule") === -1 && e.name.indexOf("Marche sur pointes") === -1);
  return ex;
}
const WEEK_DEFS = [
  { n: 1, meso: "Mésocycle 1 — Découverte", charge: "Légère", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Très léger — poids du corps, priorité à la technique", ex: () => seanceA(2) }], runKm: [3, 2, 5] },
  { n: 2, meso: "Mésocycle 1 — Découverte", charge: "Légère à modérée", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Charges très légères — travail de la technique", ex: () => seanceA(2) }], runKm: [3.5, 2.5, 6] },
  { n: 3, meso: "Mésocycle 1 — Découverte", charge: "Modérée", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Technique", ex: () => seanceA(2) }, { id: "B", label: "Séance B (courte, ~20 min)", note: "Introduction — sélection resserrée", ex: () => seanceB(2, true) }], runKm: [4, 3, 7] },
  { n: 4, meso: "Décharge", charge: "Décharge", deload: true, renfo: [{ id: "A", label: "Séance A (allégée)", note: "Reprise légère, mobilité / cheville / récupération", ex: () => seanceA(2) }], runKm: [2.5, 2, 3.5] },
  { n: 5, meso: "Mésocycle 2 — Structuration", charge: "Modérée", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Reprise progressive après la décharge", ex: () => seanceA(3) }, { id: "B", label: "Séance B", note: "Version complète", ex: () => seanceB(3) }], runKm: [4, 3, 6] },
  { n: 6, meso: "Mésocycle 2 — Structuration", charge: "Modérée à élevée", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Charges en hausse", ex: () => seanceA(3) }, { id: "B", label: "Séance B", note: "Charges en hausse", ex: () => seanceB(3) }], runKm: [4.5, 3.5, 8] },
  { n: 7, meso: "Mésocycle 2 — Structuration", charge: "Élevée", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Pic du mésocycle", ex: () => seanceA(3) }, { id: "B", label: "Séance B", note: "Pic du mésocycle", ex: () => seanceB(3) }], runKm: [5, 4, 9] },
  { n: 8, meso: "Décharge", charge: "Décharge", deload: true, renfo: [{ id: "A", label: "Séance A (légère)", note: "Décharge — mobilité, cheville, récupération", ex: () => seanceA(2) }], runKm: [3, 2, 5] },
  { n: 9, meso: "Mésocycle 3 — Consolidation", charge: "Modérée à élevée", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Reprise, charges élevées", ex: () => seanceA(3) }, { id: "B", label: "Séance B", note: "Version complète", ex: () => seanceB(3) }], runKm: [4.5, 3.5, 8] },
  { n: 10, meso: "Mésocycle 3 — Consolidation", charge: "Élevée", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Charges les plus élevées du bloc + amorce vitesse", ex: () => seanceA(3, { plyo: true }) }, { id: "B", label: "Séance B", note: "Version complète", ex: () => seanceB(3) }], runKm: [5.5, 4.5, 9] },
  { n: 11, meso: "Mésocycle 3 — Consolidation", charge: "Élevée (objectif atteint)", deload: false, renfo: [{ id: "A", label: "Séance A", note: "Pic du bloc", ex: () => seanceA(3, { plyo: true }) }, { id: "B", label: "Séance B", note: "Pic du bloc", ex: () => seanceB(3) }], runKm: [6, 4.5, 9.5] },
  { n: 12, meso: "Décharge + bilan", charge: "Décharge", deload: true, renfo: [{ id: "A", label: "Séance A (légère) + tests", note: "Décharge et bilan de fin de bloc", ex: () => seanceA(2, { tests: true }) }], runKm: [3, 2.5, 5.5] }
];
function buildProgram(){
  return WEEK_DEFS.map(w => ({
    n: w.n, meso: w.meso, charge: w.charge, deload: w.deload,
    sessions: w.renfo.map(r => ({ id: r.id, kind: 'renfo', label: r.label, note: r.note, day: r.id === 'A' ? 'lundi' : 'jeudi', exercises: r.ex() }))
      .concat(w.runKm.map((km, i) => ({ id: 'R' + (i + 1), kind: 'course', label: RUN_META[i].label, note: RUN_META[i].note, day: RUN_META[i].day, km, exercises: [] })))
  }));
}
function dose(e){ return e.fixed ? e.fixed : (e.series + ' x ' + e.reps); }
window.PROG12 = { buildProgram, dose };
})();
