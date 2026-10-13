# Readovo Mobile

Readovo Mobile is an Expo React Native app with a NestJS backend and PostgreSQL
database for local development.

## Prerequisites

- Node.js and npm
- Docker Desktop
- Android Studio / Android SDK for native Android builds
- A physical Android device or Android emulator

Commands below assume you are starting from the repository root.

## Install Dependencies

Install dependencies in each package:

```bash
cd backend
npm install

cd ../frontend
npm install
```

The root package contains helper scripts. Install it as well if you want to use
the root-level commands:

```bash
cd ..
npm install
```

## Database

PostgreSQL runs through Docker Compose.

Start the database:

```bash
npm run db:up
```

Stop the database:

```bash
npm run db:down
```

The local database settings are:

```text
Host: localhost
Port: 5432
Database: readovo
User: readovo
Password: readovo_password
```

The backend initializes the required local tables on startup, including auth,
dictionary, articles, achievements, mascot, streak, and notification tables.

## Backend Setup

Create `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgres://readovo:readovo_password@localhost:5432/readovo
PORT=3000
GOOGLE_TRANSLATE_API_KEY=
GROQ_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
JWT_SECRET=change-this-to-a-long-random-secret
GOOGLE_WEB_CLIENT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
# FIREBASE_SERVICE_ACCOUNT_JSON=
```

`SMTP_*` and `EMAIL_FROM` are used to send email verification and password reset
codes. If SMTP is empty in local development, the backend logs the verification
code.

`GROQ_API_KEY` is used for AI-generated article and dictionary quiz content.
`GOOGLE_TRANSLATE_API_KEY` is used for translations.

Firebase credentials are used for push notifications. For local development,
prefer `FIREBASE_SERVICE_ACCOUNT_PATH` and keep the service account file out of
git.

Start the backend:

```bash
cd backend
npm run start:dev
```

The backend runs on:

```text
http://localhost:3000
```

For phone testing, the backend listens on `0.0.0.0`, so devices on the same
Wi-Fi can reach it through your computer's local IP address.

## Frontend Setup

Create `frontend/.env` from `frontend/.env.example`:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_RENDER_API_URL=https://readovomobile.onrender.com
```

The frontend scripts set `EXPO_PUBLIC_API_URL`,
`REACT_NATIVE_PACKAGER_HOSTNAME`, and `EXPO_PUBLIC_REACTOTRON_HOST`
automatically for local runs. You usually do not need to hard-code your local IP
in `.env`.

Start Expo with the local backend:

```bash
npm run frontend:start:local
```

Start Expo against the Render backend:

```bash
npm run frontend:start:render
```

Start Expo and open Android with the local backend:

```bash
npm run frontend:start:android:local
```

Start Expo and open Android against the Render backend:

```bash
npm run frontend:start:android:render
```

Build and install the native Android development build with the local backend:

```bash
npm run android:local
```

Build and install the native Android development build against the Render
backend:

```bash
npm run android:render
```

The scripts default to the first non-virtual local IPv4 address, preferring a
`192.168.*` address. To override the detected development host:

```bash
READOVO_DEV_HOST=192.168.0.102 npm run frontend:start:local
```

To override the API URL directly:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.102:3000 npm run frontend:start:local
```
