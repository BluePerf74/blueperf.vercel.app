# Blueperf — app fusionnée (Vercel)

Application déployée sur **blueperf.vercel.app**.

- `index.html` — app Blueperf (base) : connexion coach/client, sections **Programme Perso**, **Nutrition**, et **Football**.
- `academie/index.html` — app **Blueperf Académie** (perf/club), affichée dans l'onglet Football (iframe). Adaptée à Vercel : sa base de données passe par `/api/storage` (Upstash) et sa reco IA par `/api/reco`.
- `api/storage.js` — base de données partagée (Upstash Redis). Clés de l'Académie préfixées `aca:`.
- `api/reco.js` — proxy vers l'API Anthropic pour la reco IA (clé serveur `ANTHROPIC_API_KEY`).
- `vercel.json` — durées max des fonctions.

## Variables d'environnement (Vercel → Settings → Environment Variables)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` / `_TOKEN`) — déjà configurées.
- `ANTHROPIC_API_KEY` — à ajouter pour activer la reco IA (onglet Football → Recommandations).
- `ANTHROPIC_MODEL` (optionnel) — ex. `claude-sonnet-5` ou `claude-haiku-4-5` pour aller plus vite / moins cher. Défaut : `claude-opus-5`.
