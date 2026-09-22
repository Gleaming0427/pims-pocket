# Pims Pocket

![Pims Pocket](docs/banner.svg)

<p align="center">
  <img src="assets/icon.png" width="96" alt="Pims Pocket icon"/>
</p>

Pims Pocket is a mobile pocket-money app for the whole family.

Parents create missions, send pocket money, and track spending. Kids see their piggy bank, complete missions, and learn to save.

**📱 Available on Google Play: [play.google.com/store/apps/details?id=com.pimspocket.app](https://play.google.com/store/apps/details?id=com.pimspocket.app)**

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-lightgrey.svg)](LICENSE)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-6C5CE7.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28.svg)](https://firebase.google.com)

## What the app does

**Parent side**

- Family dashboard with an overview of each child
- Missions with rewards, validated remotely
- Pocket money transfers, recurring or one-off
- Full transaction history

**Child side**

- Piggy bank with a real-time balance
- Missions to complete and badges to collect
- Savings goals with progress tracking
- Money requests to parents

Kids sign in without an email or password, using a 6-digit invite code and a 4-digit PIN.

The app is entirely in French.

## Tech stack

| Layer | Choice |
|---|---|
| App | Expo SDK 54, React Native, Expo Router |
| Global state | Zustand |
| Styling | NativeWind |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Functions |
| Notifications | Firebase Cloud Messaging |
| Error tracking | Sentry |
| Builds and updates | EAS Build, EAS Update |

## Architecture

Data is family-centric: `families/{familyId}/children/{childDocId}`. All amounts are stored in cents. Permissions are enforced server-side in Firestore rules and re-checked in every Cloud Function.

Data is hosted on Google's Firebase servers, located in the European Union.

## Server repository

This repository contains the client app. The server-side logic — Cloud Functions, Firestore rules, and Firestore indexes — lives in a separate private repository.

## Development

```bash
npm install
npx expo start              # Dev server (Expo Go)
npx expo run:android        # Native Android build
npx expo run:ios            # Native iOS build
eas build --profile production   # Production build (EAS)
```

Environment variables are prefixed with `EXPO_PUBLIC_` (see `.env.example`).

## License

Proprietary — All rights reserved. See [LICENSE](LICENSE).
