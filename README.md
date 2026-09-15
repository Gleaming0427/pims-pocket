# Pims Pocket 🐷

**L'argent de poche en famille.**

Pims Pocket est une application mobile de gestion d'argent de poche familial, pensée pour les parents et leurs enfants. Les parents créent des missions, versent l'argent de poche et valident les dépenses ; les enfants voient leur tirelire, accomplissent des missions et apprennent à épargner.

![Logo](assets/icon.png)

[![AGPL v3](https://img.shields.io/badge/Licence-AGPL--3.0-blue.svg)](LICENSE)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-6C5CE7.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth%20%2B%20Functions-FFCA28.svg)](https://firebase.google.com)

## L'app

- **Côté parent** : tableau de bord familial, gestion des enfants, missions et récompenses, versements d'argent de poche, validations, historique.
- **Côté enfant** : tirelire et solde, missions à accomplir, objectifs d'épargne, badges, demandes d'argent aux parents.
- Connexion enfant **sans email ni mot de passe** : code d'invitation à 6 chiffres + code PIN à 4 chiffres.
- 100 % en français, pensé pour les familles.

## Stack technique

- **Expo SDK 54** (React Native, Expo Router, EAS Build & Update)
- **Firebase** : Authentication, Cloud Firestore, Cloud Functions, Cloud Messaging
- **Zustand** pour l'état global, **NativeWind** pour le styling
- **Sentry** pour le suivi des erreurs

## Architecture

- Données centrées sur la **famille** : `families/{familyId}/children/{childDocId}`.
- Les montants sont stockés en **centimes** (entiers).
- Les permissions sont appliquées côté serveur via les règles Firestore et validées dans chaque Cloud Function.

## Stockage des données

Les données sont hébergées sur les serveurs Firebase de Google, situés dans l'Union européenne. La politique de confidentialité complète est disponible dans l'application.

## Dépôt du serveur

Le serveur (Cloud Functions, règles Firestore et index) vit dans un **dépôt privé** afin de préserver la défense en profondeur de la logique d'authentification. Ce dépôt contient le client complet de l'application.

## Développement

```bash
npm install
npx expo start              # Dev server (Expo Go)
npx expo run:android        # Android natif
npx expo run:ios            # iOS natif
eas build --profile production   # Builds de production (EAS)
```

Les variables d'environnement sont préfixées `EXPO_PUBLIC_` (voir `.env.example`).

## Licence

[GNU Affero General Public License v3.0](LICENSE) — les forks et modifications doivent être publiés sous la même licence.
