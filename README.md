# Blueperf — app fusionnée (Vercel)

Application déployée sur **blueperf.vercel.app**.

- `index.html` — app Blueperf (base) : connexion coach/client, sections **Programme Perso**, **Nutrition**, et **Football**. Le JavaScript n'est plus en ligne dans le HTML : il est chargé minifié depuis `app.min.js`.
- `app.js` — **fichier source** du JavaScript de l'app de base. C'est ici qu'on modifie le code.
- `app.min.js` — version **minifiée générée** depuis `app.js` (ne pas éditer à la main). C'est ce fichier que charge `index.html`.
- `build.js` — régénère `app.min.js` depuis `app.js` et met à jour le numéro de version (`?v=…`) dans `index.html`.
- `academie/index.html` — app **Blueperf Académie** (perf/club), affichée dans l'onglet Football (iframe). Adaptée à Vercel : sa base de données passe par `/api/storage` (Upstash) et sa reco IA par `/api/reco`.
- `api/storage.js` — base de données partagée (Upstash Redis). Clés de l'Académie préfixées `aca:`. Protégée par l'authentification serveur (voir `AUTH_SECRET`).
- `api/auth.js` — authentification côté serveur : vérifie les identifiants et pose un cookie de session signé exigé par `/api/storage`.
- `api/reco.js` — proxy vers l'API Anthropic pour la reco IA (clé serveur `ANTHROPIC_API_KEY`).
- `vercel.json` — durées max des fonctions + en-têtes de cache (`app.min.js` est mis en cache longue durée, le HTML jamais).

## Modifier le JavaScript de l'app de base
1. Éditer **`app.js`** (jamais `app.min.js`).
2. Lancer `npm install` (une seule fois, pour installer `terser`) puis `npm run build`.
3. `build.js` régénère `app.min.js` et met à jour `?v=…` dans `index.html`. Committer `app.js`, `app.min.js` et `index.html`.

## Variables d'environnement (Vercel → Settings → Environment Variables)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` / `_TOKEN`) — déjà configurées.
- `AUTH_SECRET` — **active la sécurité du stockage** : tant qu'elle est définie, `/api/storage` exige une session valide (connexion vérifiée côté serveur). Chaîne aléatoire longue. Configurée.
- `ANTHROPIC_API_KEY` — à ajouter pour activer la reco IA (onglet Football → Recommandations).
- `ANTHROPIC_MODEL` (optionnel) — ex. `claude-sonnet-5` ou `claude-haiku-4-5` pour aller plus vite / moins cher. Défaut : `claude-opus-5`.
