# Pims Pocket

![Pims Pocket](docs/banner.svg)

<p align="center">
  <img src="assets/icon.png" width="96" alt="Icône Pims Pocket"/>
</p>

Pims Pocket est une application mobile de gestion d'argent de poche pour toute la famille.

Les parents créent des missions, versent l'argent de poche et suivent les dépenses. Les enfants découvrent leur tirelire, accomplissent des missions et apprennent à épargner.

**📱 Disponible sur Google Play : [play.google.com/store/apps/details?id=com.pimspocket.app](https://play.google.com/store/apps/details?id=com.pimspocket.app)**

[![Licence AGPL v3](https://img.shields.io/badge/Licence-AGPL--3.0-blue.svg)](LICENSE)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-6C5CE7.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28.svg)](https://firebase.google.com)

## Ce que fait l'app

**Côté parent**

- Tableau de bord familial et suivi de chaque enfant
- Missions avec récompenses, validées à distance
- Versements d'argent de poche, récurrents ou ponctuels
- Historique complet des transactions

**Côté enfant**

- Tirelire et solde en temps réel
- Missions à accomplir et badges à collectionner
- Objectifs d'épargne avec progression
- Demandes d'argent aux parents

Les enfants se connectent sans email ni mot de passe, avec un code d'invitation à 6 chiffres et un PIN à 4 chiffres.

L'application est entièrement en français.

## Stack technique

| Couche | Choix |
|---|---|
| Application | Expo SDK 54, React Native, Expo Router |
| État global | Zustand |
| Styling | NativeWind |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Functions |
| Notifications | Firebase Cloud Messaging |
| Suivi d'erreurs | Sentry |
| Builds et mises à jour | EAS Build, EAS Update |

## Architecture

Les données sont centrées sur la famille : `families/{familyId}/children/{childDocId}`. Tous les montants sont stockés en centimes. Les permissions sont appliquées côté serveur dans les règles Firestore puis vérifiées dans chaque Cloud Function.

Les données sont hébergées sur les serveurs Firebase de Google, situés dans l'Union européenne.

## Dépôt du serveur

Le client est entièrement open source, mais la logique serveur vit dans un **dépôt privé** : Cloud Functions, règles Firestore et index Firestore.

Ce choix limite volontairement les risques. Ces fichiers décrivent la mécanique interne de la sécurité : le hachage des codes PIN, les seuils de blocage des tentatives de connexion et le modèle exact des permissions. Les garder privés réduit la surface d'attaque, sans rien cacher du fonctionnement de l'application côté client, qui est ce qui intéresse les familles.

## Développement

```bash
npm install
npx expo start              # Serveur de développement (Expo Go)
npx expo run:android        # Build Android natif
npx expo run:ios            # Build iOS natif
eas build --profile production   # Build de production (EAS)
```

Les variables d'environnement sont préfixées `EXPO_PUBLIC_` (voir `.env.example`).

## Licence

[GNU Affero General Public License v3.0](LICENSE). Les forks et modifications doivent être publiés sous la même licence.
