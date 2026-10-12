# Blueperf — publication sur App Store & Google Play (Capacitor)

Ce dossier enveloppe l'app web **blueperf.vercel.app** dans une app native (via
[Capacitor](https://capacitorjs.com)) pour la publier sur les stores. L'app charge le site en
ligne (`capacitor.config.json → server.url`), donc **tes mises à jour web sont immédiates**, sans
republier sur les stores.

> ⚠️ **Je (Claude) ne peux pas faire ces étapes à ta place** : elles demandent tes comptes
> développeur (payants), un **Mac** pour iOS, et la signature des apps. Suis ce guide sur ta
> machine.

---

## 0. Pré-requis

| Pour quoi | À avoir |
|---|---|
| Les deux | **Node.js 18+**, ce dossier `mobile/` |
| **Android** | **Android Studio** (gratuit) — Windows/Mac/Linux |
| **iOS** | un **Mac** + **Xcode** (gratuit), et un **compte Apple Developer — 99 $/an** |
| **Google Play** | un compte **Google Play Developer — 25 $ une fois** |

---

## 1. Installer et créer les projets natifs

Dans un terminal, depuis ce dossier `mobile/` :

```bash
npm install

# Android (Windows/Mac/Linux)
npx cap add android

# iOS (Mac uniquement)
npx cap add ios

# Synchronise la config dans les projets natifs
npx cap sync
```

Cela crée les dossiers `android/` et `ios/` (ne pas les committer — voir `.gitignore`).

## 2. Icône et écran de démarrage

Mets une image carrée **1024×1024** nommée `assets/icon.png` (et éventuellement
`assets/splash.png` 2732×2732) dans `mobile/assets/`, puis :

```bash
npx @capacitor/assets generate --iconBackgroundColor "#0D1B2A" --splashBackgroundColor "#0D1B2A"
npx cap sync
```

(Tu peux repartir de `../icons/icon-512.png`, mais une version 1024×1024 bien nette est préférable.)

## 3. Ouvrir, tester, compiler

```bash
# Android → Android Studio
npx cap open android

# iOS → Xcode (Mac)
npx cap open ios
```

- **Android Studio** : choisis un appareil/émulateur, clique ▶️ pour tester. Pour publier :
  *Build → Generate Signed Bundle / APK → Android App Bundle (.aab)*.
- **Xcode** : sélectionne ton équipe de signature (Signing & Capabilities), teste sur simulateur
  ou iPhone, puis *Product → Archive* pour envoyer vers App Store Connect.

## 4. Soumettre

- **Google Play** : [Play Console](https://play.google.com/console) → crée l'app → envoie le
  `.aab` → remplis la fiche (titre, description, captures, politique de confidentialité :
  utilise `https://blueperf.vercel.app/confidentialite.html`) → envoie en relecture.
- **App Store** : [App Store Connect](https://appstoreconnect.apple.com) → crée l'app (même
  `appId` que dans `capacitor.config.json`) → sélectionne le build archivé → fiche + captures →
  envoie en relecture.

---

## ⚠️ 2 points importants avant de te lancer

### a) Apple peut refuser un simple « site emballé »
La règle **App Store 4.2 (minimum functionality)** rejette les apps qui ne sont qu'un site web
dans une coque. Pour maximiser les chances d'acceptation, ajoute une **vraie valeur native**, par
ex. les **notifications push natives** via `@capacitor/push-notifications` (en plus du web push
déjà en place). Google Play est beaucoup plus souple sur ce point.

### b) Les programmes à 5 € = achats intégrés obligatoires
Pour du **contenu numérique débloqué dans l'app**, Apple **impose ses achats intégrés (IAP)** et
Google impose **Play Billing** — commission ~15–30 %, un paiement par carte externe (Stripe) y est
**interdit** pour ce cas. Concrètement, pour vendre les programmes **dans** l'app des stores, il
faudra brancher l'IAP (ex. plugin `@capacitor-community/in-app-purchases` ou RevenueCat).
> Astuce courante : garder la vente des programmes **sur le site web** (hors app store), et faire
> de l'app une app de *suivi*. À valider selon ta stratégie.

---

## Fichiers de ce dossier
- `capacitor.config.json` — identité de l'app (`appId`, `appName`) + URL chargée.
  **Change `appId`** (ex. un domaine à toi) avant publication si tu veux.
- `package.json` — dépendances Capacitor + scripts raccourcis (`npm run add:android`, etc.).
- `www/index.html` — court écran de chargement (l'app bascule ensuite sur le site en ligne).
- `assets/` — à créer : `icon.png` (1024×1024) pour générer icônes et splash.
