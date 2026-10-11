/*
  Boutique de programmes « prêts à l'emploi » (Coaching individuel).
  Chaque programme dure 30 jours (4 semaines de progression), coûte 5 € et peut être
  débloqué par un·e client·e, qui le réalise dans l'app avec suivi des séances.

  Structure volontairement identique au modèle de programme de l'app :
    programme : { id, title, emoji, color, goal, level, price, durationDays, desc, equipment, weeks:[...] }
    semaine   : { n, meso, charge, sessions:[...] }
    séance    : { id, kind:'renfo', label, day, note, exercises:[...] }
    exercice  : { name, series, reps  (ou fixed:"30 sec"),  note?, how? }

  C'est une base pensée pour être MODIFIÉE facilement : change les exercices, séries,
  répétitions ou ajoute des explications « how » quand tu veux.
*/
(function(){
  // Raccourcis pour écrire les exercices de façon compacte.
  const ex  = (name, series, reps, note, how) => ({ name, series, reps, note, how });
  const fix = (name, fixed, note, how) => ({ name, fixed, note, how });
  const WARMUP = fix('Échauffement (cardio doux + mobilité)', '5-6 min', 'Monte progressivement en température : articulations, muscles ciblés du jour.');
  const COOL   = fix('Retour au calme + étirements', '5 min', 'Étire les muscles travaillés, 20-30 s par position, respiration lente.');
  // Charge indicative par semaine (progression).
  const CH = ['Découverte', 'Volume', 'Intensité', 'Consolidation'];

  /* Construit une semaine à partir de 3 séances (lundi / mercredi / vendredi). */
  function week(n, pid, s1, s2, s3){
    return { n, meso: CH[n-1] || '', charge: CH[n-1] || '',
      sessions: [
        { id: pid+'-s'+n+'a', kind:'renfo', label:'Séance 1', day:'lundi',     note:s1.note||'', exercises:[WARMUP, ...s1.ex, COOL] },
        { id: pid+'-s'+n+'b', kind:'renfo', label:'Séance 2', day:'mercredi',  note:s2.note||'', exercises:[WARMUP, ...s2.ex, COOL] },
        { id: pid+'-s'+n+'c', kind:'renfo', label:'Séance 3', day:'vendredi',  note:s3.note||'', exercises:[WARMUP, ...s3.ex, COOL] },
      ] };
  }

  /* ===================== 1. BRAS ===================== */
  const BRAS = {
    id:'bras', title:'Bras', emoji:'💪', color:'#3DA9FC',
    goal:'Renforcer et dessiner biceps, triceps et épaules', level:'Tous niveaux',
    price:5, durationDays:30,
    desc:"4 semaines pour des bras plus toniques : biceps, triceps et épaules, avec haltères ou bouteilles d'eau.",
    equipment:"Haltères (ou bouteilles d'eau), un banc ou une chaise, un élastique (optionnel).",
    weeks:[
      week(1,'bras',
        {ex:[ex('Curl biceps haltères',3,12,'Coudes collés au corps, mouvement contrôlé.'),ex('Extension triceps nuque',3,12,'Coude vers le plafond, descends l’haltère derrière la tête.'),ex('Développé épaules',3,10,'Pousse au-dessus de la tête sans cambrer.'),ex('Pompes genoux',3,8,'Gainage, descente contrôlée.'),ex('Curl marteau',3,12,'Prise neutre, paumes face à face.')]},
        {ex:[ex('Dips sur chaise',3,10,'Coudes vers l’arrière, épaules basses.'),ex('Élévations latérales',3,12,'Monte à hauteur d’épaules, léger.'),ex('Curl concentré',3,10,'Un bras à la fois, coude calé sur la cuisse.'),ex('Kickback triceps',3,12,'Buste penché, bras tendu vers l’arrière.'),fix('Gainage planche','3 x 30 sec','Corps aligné, ventre engagé.')]},
        {ex:[ex('Curl biceps',3,12),ex('Extension triceps nuque',3,12),ex('Élévations frontales',3,10,'Monte les bras devant jusqu’aux épaules.'),ex('Pompes prise serrée',3,8,'Mains sous les épaules, ciblent les triceps.'),ex('Curl marteau',3,12)]}),
      week(2,'bras',
        {ex:[ex('Curl biceps haltères',4,12),ex('Extension triceps nuque',4,12),ex('Développé épaules',4,10),ex('Pompes',3,10),ex('Curl marteau',3,14)]},
        {ex:[ex('Dips sur chaise',4,10),ex('Élévations latérales',4,12),ex('Curl concentré',3,12),ex('Kickback triceps',4,12),fix('Gainage planche','3 x 40 sec')]},
        {ex:[ex('Curl biceps',4,12),ex('Extension triceps nuque',4,12),ex('Élévations frontales',3,12),ex('Pompes prise serrée',3,10),ex('Curl marteau',3,14)]}),
      week(3,'bras',
        {ex:[ex('Curl biceps haltères',4,10,'Charge un peu plus lourde, tempo lent.'),ex('Extension triceps nuque',4,10),ex('Développé épaules',4,8),ex('Pompes',4,10),ex('Curl marteau',4,12)]},
        {ex:[ex('Dips sur chaise',4,12),ex('Élévations latérales',4,14),ex('Curl concentré',4,10),ex('Kickback triceps',4,14),fix('Gainage planche','3 x 45 sec')]},
        {ex:[ex('Curl 21 (7+7+7)',3,21,'7 bas, 7 haut, 7 complets — biceps en feu.'),ex('Extension triceps nuque',4,12),ex('Élévations frontales',4,12),ex('Pompes prise serrée',4,10),ex('Curl marteau',4,12)]}),
      week(4,'bras',
        {ex:[ex('Curl biceps haltères',4,12,'Semaine de consolidation : technique parfaite.'),ex('Extension triceps nuque',4,12),ex('Développé épaules',4,10),ex('Pompes',4,12),ex('Curl marteau',4,12)]},
        {ex:[ex('Dips sur chaise',4,12),ex('Élévations latérales',4,12),ex('Curl concentré',4,12),ex('Kickback triceps',4,12),fix('Gainage planche','3 x 45 sec')]},
        {ex:[ex('Curl 21 (7+7+7)',3,21),ex('Extension triceps nuque',4,12),ex('Élévations frontales',4,12),ex('Pompes prise serrée',4,12),ex('Curl marteau',4,12)]}),
    ]
  };

  /* ===================== 2. PECTORAUX ===================== */
  const PECS = {
    id:'pectoraux', title:'Pectoraux', emoji:'🦾', color:'#8FCBFF',
    goal:'Développer et renforcer les pectoraux', level:'Tous niveaux',
    price:5, durationDays:30,
    desc:"4 semaines centrées sur le haut du corps : pectoraux, avec pompes et haltères, du débutant au confirmé.",
    equipment:"Haltères (ou bouteilles), un banc ou un lit ferme, un tapis.",
    weeks:[
      week(1,'pecs',
        {ex:[ex('Pompes genoux',3,8,'Descente lente, poitrine vers le sol.'),ex('Développé couché haltères',3,10,'Coudes à 45°, pousse vers le haut.'),ex('Écarté haltères',3,12,'Bras légèrement fléchis, ouvre puis resserre.'),ex('Pompes inclinées (mains surélevées)',3,10),fix('Gainage planche','3 x 30 sec')]},
        {ex:[ex('Pompes classiques',3,6),ex('Développé incliné haltères',3,10,'Buste incliné, cible le haut des pecs.'),ex('Pull-over haltère',3,12,'Allongé, descends l’haltère derrière la tête.'),ex('Pompes diamant',3,6,'Mains en triangle, triceps + pecs internes.'),fix('Gainage latéral','2 x 25 sec / côté')]},
        {ex:[ex('Pompes genoux',3,10),ex('Développé couché haltères',3,12),ex('Écarté haltères',3,12),ex('Pompes inclinées',3,10),fix('Gainage planche','3 x 35 sec')]}),
      week(2,'pecs',
        {ex:[ex('Pompes classiques',4,8),ex('Développé couché haltères',4,10),ex('Écarté haltères',4,12),ex('Pompes inclinées',4,10),fix('Gainage planche','3 x 40 sec')]},
        {ex:[ex('Pompes classiques',4,8),ex('Développé incliné haltères',4,10),ex('Pull-over haltère',4,12),ex('Pompes diamant',3,8),fix('Gainage latéral','3 x 30 sec / côté')]},
        {ex:[ex('Pompes',4,10),ex('Développé couché haltères',4,12),ex('Écarté haltères',4,14),ex('Pompes inclinées',4,12),fix('Gainage planche','3 x 40 sec')]}),
      week(3,'pecs',
        {ex:[ex('Pompes',4,10,'Tempo 3 s à la descente.'),ex('Développé couché haltères',4,8,'Un peu plus lourd.'),ex('Écarté haltères',4,12),ex('Pompes déclinées (pieds surélevés)',3,8,'Cible le haut des pecs.'),fix('Gainage planche','3 x 45 sec')]},
        {ex:[ex('Pompes',4,12),ex('Développé incliné haltères',4,10),ex('Pull-over haltère',4,12),ex('Pompes diamant',4,8),fix('Gainage latéral','3 x 35 sec / côté')]},
        {ex:[ex('Pompes en pyramide (10-8-6-8-10)',1,42,'Sans repos long entre les séries.'),ex('Développé couché haltères',4,12),ex('Écarté haltères',4,14),ex('Pompes déclinées',3,10),fix('Gainage planche','3 x 45 sec')]}),
      week(4,'pecs',
        {ex:[ex('Pompes',4,12),ex('Développé couché haltères',4,12),ex('Écarté haltères',4,14),ex('Pompes déclinées',4,10),fix('Gainage planche','3 x 45 sec')]},
        {ex:[ex('Pompes',4,12),ex('Développé incliné haltères',4,12),ex('Pull-over haltère',4,14),ex('Pompes diamant',4,10),fix('Gainage latéral','3 x 40 sec / côté')]},
        {ex:[ex('Pompes en pyramide (10-8-6-8-10)',1,42),ex('Développé couché haltères',4,12),ex('Écarté haltères',4,14),ex('Pompes déclinées',4,12),fix('Gainage planche','3 x 50 sec')]}),
    ]
  };

  /* ===================== 3. JAMBES ===================== */
  const JAMBES = {
    id:'jambes', title:'Jambes', emoji:'🦵', color:'#1E9E6A',
    goal:'Renforcer cuisses, ischios et mollets', level:'Tous niveaux',
    price:5, durationDays:30,
    desc:"4 semaines pour des jambes puissantes : quadriceps, ischios, fessiers et mollets, au poids du corps + haltères.",
    equipment:"Haltères (optionnel), une chaise, un step ou une marche.",
    weeks:[
      week(1,'jambes',
        {ex:[ex('Squat poids du corps',3,15,'Dos droit, descends sous la parallèle si possible.'),ex('Fentes avant',3,10,'10 par jambe, genou aligné.'),ex('Pont fessier',3,15,'Serre les fessiers en haut 1 s.'),ex('Mollets debout',3,20,'Monte haut sur la pointe.'),fix('Chaise contre le mur','3 x 30 sec')]},
        {ex:[ex('Squat sumo',3,15,'Pieds larges, pointes ouvertes.'),ex('Fentes arrière',3,10),ex('Soulevé de terre jambes tendues',3,12,'Dos plat, descends le long des jambes.'),ex('Montées sur step',3,12,'12 par jambe.'),ex('Mollets',3,20)]},
        {ex:[ex('Squat poids du corps',3,15),ex('Fentes marchées',3,12),ex('Pont fessier une jambe',3,10,'10 par jambe.'),ex('Mollets',3,20),fix('Chaise contre le mur','3 x 35 sec')]}),
      week(2,'jambes',
        {ex:[ex('Squat (haltères)',4,15),ex('Fentes avant',4,10),ex('Pont fessier',4,15),ex('Mollets',4,20),fix('Chaise contre le mur','3 x 40 sec')]},
        {ex:[ex('Squat sumo',4,15),ex('Fentes arrière',4,12),ex('Soulevé de terre jambes tendues',4,12),ex('Montées sur step',4,12),ex('Mollets',4,22)]},
        {ex:[ex('Squat sauté',4,12,'Explosif, réception amortie.'),ex('Fentes marchées',4,12),ex('Pont fessier une jambe',4,10),ex('Mollets',4,22),fix('Chaise contre le mur','3 x 45 sec')]}),
      week(3,'jambes',
        {ex:[ex('Squat (haltères)',4,12,'Plus lourd, tempo lent.'),ex('Fentes bulgares',4,10,'Pied arrière surélevé, 10/jambe.'),ex('Pont fessier',4,15),ex('Mollets',4,22),fix('Chaise contre le mur','3 x 45 sec')]},
        {ex:[ex('Squat sumo (haltère)',4,15),ex('Fentes arrière',4,12),ex('Soulevé de terre jambes tendues',4,12),ex('Montées sur step',4,14),ex('Mollets',4,25)]},
        {ex:[ex('Squat sauté',4,15),ex('Fentes sautées',4,10,'10 par jambe, explosif.'),ex('Pont fessier une jambe',4,12),ex('Mollets',4,25),fix('Chaise contre le mur','3 x 50 sec')]}),
      week(4,'jambes',
        {ex:[ex('Squat (haltères)',4,15),ex('Fentes bulgares',4,12),ex('Pont fessier',4,15),ex('Mollets',4,25),fix('Chaise contre le mur','3 x 50 sec')]},
        {ex:[ex('Squat sumo (haltère)',4,15),ex('Fentes arrière',4,12),ex('Soulevé de terre jambes tendues',4,14),ex('Montées sur step',4,14),ex('Mollets',4,25)]},
        {ex:[ex('Squat sauté',4,15),ex('Fentes sautées',4,12),ex('Pont fessier une jambe',4,12),ex('Mollets',4,25),fix('Chaise contre le mur','3 x 60 sec')]}),
    ]
  };

  /* ===================== 4. ABDOMINAUX ===================== */
  const ABDOS = {
    id:'abdominaux', title:'Abdominaux', emoji:'🔥', color:'#E08A0B',
    goal:'Gainer et renforcer la sangle abdominale', level:'Tous niveaux',
    price:5, durationDays:30,
    desc:"4 semaines pour un ventre plus tonique et un gainage solide : grands droits, obliques et transverse.",
    equipment:"Un tapis. Aucun matériel nécessaire.",
    weeks:[
      week(1,'abdos',
        {ex:[fix('Gainage planche','3 x 30 sec'),ex('Crunch',3,15,'Décolle les omoplates, souffle en montant.'),ex('Relevé de jambes',3,12,'Jambes tendues ou genoux fléchis, bas-ventre.'),ex('Russian twist',3,20,'20 touches, buste incliné.'),fix('Gainage latéral','2 x 25 sec / côté')]},
        {ex:[fix('Gainage planche','3 x 30 sec'),ex('Mountain climbers',3,20,'20 par jambe, rythme soutenu.'),ex('Crunch vélo',3,20,'Coude vers genou opposé.'),ex('Hollow hold',3,20,'20 s, bas du dos plaqué au sol.'),ex('Superman',3,12,'Gainage lombaire.')]},
        {ex:[fix('Gainage planche','3 x 35 sec'),ex('Crunch',3,18),ex('Relevé de jambes',3,14),ex('Russian twist',3,24),fix('Gainage latéral','3 x 25 sec / côté')]}),
      week(2,'abdos',
        {ex:[fix('Gainage planche','3 x 40 sec'),ex('Crunch',4,18),ex('Relevé de jambes',4,14),ex('Russian twist',4,24),fix('Gainage latéral','3 x 30 sec / côté')]},
        {ex:[fix('Gainage planche','3 x 40 sec'),ex('Mountain climbers',4,24),ex('Crunch vélo',4,24),ex('Hollow hold',4,25),ex('Superman',4,14)]},
        {ex:[fix('Gainage planche','3 x 45 sec'),ex('Crunch',4,20),ex('Relevé de jambes',4,15),ex('Russian twist',4,28),fix('Gainage latéral','3 x 30 sec / côté')]}),
      week(3,'abdos',
        {ex:[fix('Gainage planche','3 x 45 sec'),ex('Crunch lesté',4,15,'Un haltère/bouteille sur la poitrine.'),ex('Relevé de jambes',4,16),ex('Russian twist lesté',4,24),fix('Gainage latéral','3 x 35 sec / côté')]},
        {ex:[fix('Gainage planche dynamique (épaules)','3 x 40 sec'),ex('Mountain climbers',4,30),ex('Crunch vélo',4,30),ex('Hollow rock',4,25,'Balancement contrôlé.'),ex('Superman',4,16)]},
        {ex:[fix('Circuit gainage (planche+côté+côté)','3 x 60 sec'),ex('Crunch',4,22),ex('Relevé de jambes',4,16),ex('Russian twist lesté',4,30),ex('Hollow hold',4,30)]}),
      week(4,'abdos',
        {ex:[fix('Gainage planche','3 x 50 sec'),ex('Crunch lesté',4,16),ex('Relevé de jambes',4,16),ex('Russian twist lesté',4,28),fix('Gainage latéral','3 x 35 sec / côté')]},
        {ex:[fix('Gainage planche dynamique','3 x 45 sec'),ex('Mountain climbers',4,30),ex('Crunch vélo',4,30),ex('Hollow rock',4,30),ex('Superman',4,16)]},
        {ex:[fix('Circuit gainage','3 x 60 sec'),ex('Crunch',4,24),ex('Relevé de jambes',4,18),ex('Russian twist lesté',4,30),ex('Hollow hold',4,35)]}),
    ]
  };

  /* ===================== 5. PERTE DE POIDS ===================== */
  const PERTE = {
    id:'perte-de-poids', title:'Perte de poids', emoji:'⚖️', color:'#C0392B',
    goal:'Brûler des calories et tonifier tout le corps', level:'Tous niveaux',
    price:5, durationDays:30,
    desc:"4 semaines de circuits full-body à intensité progressive pour dépenser un maximum et tonifier. Associe-les à une alimentation équilibrée.",
    equipment:"Un tapis, une paire d'haltères légers (optionnel), de la place pour sauter.",
    weeks:[
      week(1,'perte',
        {ex:[fix('Marche rapide / cardio','8 min','Pour démarrer la dépense.'),ex('Squat',3,15),ex('Pompes genoux',3,10),ex('Mountain climbers',3,20),fix('Gainage planche','3 x 30 sec'),ex('Jumping jacks',3,30)]},
        {ex:[fix('Corde à sauter (ou saut sur place)','3 x 40 sec'),ex('Fentes alternées',3,12),ex('Crunch',3,15),ex('Pont fessier',3,15),ex('Montées de genoux',3,30,'Rythme soutenu.')]},
        {ex:[ex('Burpees (sans saut si besoin)',3,8),ex('Squat',3,15),ex('Pompes',3,8),ex('Russian twist',3,20),fix('Gainage planche','3 x 30 sec'),ex('Jumping jacks',3,30)]}),
      week(2,'perte',
        {ex:[fix('Cardio continu','10 min'),ex('Squat sauté',3,12),ex('Pompes',3,10),ex('Mountain climbers',4,24),fix('Gainage planche','3 x 40 sec'),ex('Jumping jacks',4,35)]},
        {ex:[fix('Corde à sauter','4 x 40 sec'),ex('Fentes sautées',3,10),ex('Crunch vélo',3,20),ex('Pont fessier',4,15),ex('Montées de genoux',4,35)]},
        {ex:[ex('Burpees',3,10),ex('Squat sauté',3,12),ex('Pompes',3,10),ex('Russian twist',4,24),fix('Gainage planche','3 x 40 sec'),ex('Jumping jacks',4,40)]}),
      week(3,'perte',
        {ex:[fix('Cardio (fractionné 30/30)','10 min','Alterne 30 s rapide / 30 s lent.'),ex('Squat sauté',4,15),ex('Pompes',4,10),ex('Mountain climbers',4,30),fix('Gainage planche','3 x 45 sec'),ex('Jumping jacks',4,40)]},
        {ex:[fix('Corde à sauter','5 x 45 sec'),ex('Fentes sautées',4,12),ex('Crunch vélo',4,24),ex('Pont fessier',4,18),ex('Montées de genoux',4,40)]},
        {ex:[ex('Burpees',4,10),ex('Squat sauté',4,15),ex('Pompes',4,10),ex('Russian twist',4,28),fix('Gainage planche','3 x 45 sec'),ex('Jumping jacks',4,45)]}),
      week(4,'perte',
        {ex:[fix('Cardio (fractionné 30/30)','12 min'),ex('Squat sauté',4,15),ex('Pompes',4,12),ex('Mountain climbers',4,30),fix('Gainage planche','3 x 50 sec'),ex('Jumping jacks',4,45)]},
        {ex:[fix('Corde à sauter','5 x 50 sec'),ex('Fentes sautées',4,12),ex('Crunch vélo',4,28),ex('Pont fessier',4,18),ex('Montées de genoux',4,45)]},
        {ex:[ex('Burpees',4,12),ex('Squat sauté',4,15),ex('Pompes',4,12),ex('Russian twist',4,30),fix('Gainage planche','3 x 50 sec'),ex('Jumping jacks',4,50)]}),
    ]
  };

  window.PROGRAM_CATALOG = [BRAS, PECS, JAMBES, ABDOS, PERTE];
})();
