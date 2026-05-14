# StockPilot AI

Vite + React + Tailwind + Firebase demo for a stock-analysis SaaS prototype.

## Local setup

```bash
npm install
npm run dev
```

If PowerShell blocks npm, use:

```bash
npm.cmd install
npm.cmd run dev
```

## Environment variables

Copy `.env.example` to `.env` and fill in your Firebase Web App config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Firebase services used

1. Authentication
   - Enable Google sign-in.
2. Firestore Database
   - Start in test mode for local prototyping.
   - The app will automatically create a user document after Google login.

## Firestore collection structure

```txt
users/{uid}
  uid
  email
  displayName
  photoURL
  plan: free
  role: user
  watchlistLimit: 3
  notifications:
    line: false
    discord: false
  createdAt
  lastLoginAt
```

## Deploy to Vercel

Vercel settings:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | npm run build |
| Output Directory | dist |
| Install Command | npm install |

Add the same Firebase variables in Vercel Project Settings → Environment Variables.
