# PocketKids

Application mobile d'argent de poche pour enfants. Les parents gèrent l'argent de poche, les missions et les versements. Les enfants visualisent leur tirelire, accomplissent des missions et épargnent pour des objectifs.


## Stack technique

- **Frontend** : React Native + Expo SDK 54, Expo Router
- **Backend** : Firebase (Auth, Firestore, Cloud Functions)
- **Styling** : NativeWind (TailwindCSS)
- **State** : Zustand
- **Animations** : React Native Reanimated
- **Langue** : Français

## Prérequis

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Un projet Firebase configuré
- Firebase CLI (`npm install -g firebase-tools`)

## Installation

```bash
# Cloner le projet
git clone <repo-url>
cd wallet-jr

# Installer les dépendances
npm install

# Copier la config Firebase
cp .env.example .env
# Remplir les valeurs Firebase dans .env

# Lancer l'app
npx expo start
```

## Configuration Firebase

1. Créer un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer **Authentication** (email/password)
3. Activer **Cloud Firestore**
4. Copier les clés de configuration dans `.env`
5. Déployer les règles Firestore : `firebase deploy --only firestore:rules`
6. Déployer les Cloud Functions :

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Structure du projet

```
app/          # Screens (Expo Router file-based routing)
  (auth)/     # Authentification (welcome, login, register)
  (parent)/   # Interface parent (dashboard, enfants, missions, historique)
  (child)/    # Interface enfant (tirelire, missions, objectifs, badges)
components/   # Composants réutilisables (ui/, parent/, child/, shared/)
lib/          # Firebase config, auth, firestore, notifications
stores/       # Zustand stores (auth, child, mission, transaction)
hooks/        # Custom hooks
types/        # Types TypeScript
constants/    # Couleurs, badges, avatars
utils/        # Formatters, validators
functions/    # Firebase Cloud Functions
```

## Cloud Functions

- **processRecurringAllowances** : versement automatique hebdomadaire (cron 8h)
- **checkBadges** : attribution de badges sur création de transaction
- **onMissionUpdate** : notifications quand une mission change de statut
- **onMoneyRequestUpdate** : notifications sur les demandes d'argent
- **onGoalUpdate** : notification quand un objectif est atteint

## Commandes

```bash
npx expo start          # Lancer le dev server
npx expo start --ios    # Lancer sur iOS
npx expo start --android # Lancer sur Android
firebase deploy         # Déployer rules + functions
```
