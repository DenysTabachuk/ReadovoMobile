# Readovo Mobile

Readovo Mobile is an Expo React Native app with a NestJS backend and PostgreSQL
database for local development.

## Prerequisites

- Node.js and npm
- Docker Desktop
- Expo Go for limited UI development, or Android Studio for a native Android build
- JDK 17 and Android SDK 36 for native Android builds

Expo Go is not sufficient for testing Google Sign-In or Firebase Cloud
Messaging. Use a native development build for those features.
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

The database schema is managed by versioned Prisma migrations. After starting
PostgreSQL, apply all pending migrations:

```bash
npm run db:migrate
```

Application startup no longer creates or alters tables.

## Backend Setup

Create `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgres://readovo:readovo_password@localhost:5432/readovo
PORT=3000
GOOGLE_TRANSLATE_API_KEY=
GROQ_API_KEY=
GROQ_TPM_LIMIT=8000
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
JWT_SECRET=change-this-to-a-long-random-secret
GOOGLE_WEB_CLIENT_ID=
GROQ_MODEL=openai/gpt-oss-120b
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
`GROQ_TPM_LIMIT` must match the token-per-minute limit shown by Groq for the
configured model and service tier. The backend defaults to the free-tier-safe
value of `8000` and reserves a safety margin when planning requests.
`GOOGLE_TRANSLATE_API_KEY` is used for translations.

Firebase credentials are used for push notifications. For local development,
prefer `FIREBASE_SERVICE_ACCOUNT_PATH` and keep the service account file out of
git.

If SMTP is not configured, the backend does not send an email. It prints the
verification code in the backend terminal instead.

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

This starts Metro and is useful for Expo Go. For the native Android application,
complete the configuration below and use `npm run android:local` instead.

## Native Android and Google Sign-In Setup

The Android application ID is:

```text
com.readovo.mobile
```

In the Firebase project:

1. Register an Android app with that package name.
2. Add the SHA-1 fingerprint of the certificate used to sign the APK.
3. Download `google-services.json` to
   `frontend/android/app/google-services.json`.

To print the SHA-1 of the repository's debug keystore on Windows:

```powershell
keytool -list -v `
  -alias androiddebugkey `
  -keystore frontend/android/app/debug.keystore `
  -storepass android `
  -keypass android
```

Google Sign-In needs two OAuth clients:

| Client type | Purpose |
| --- | --- |
| Android | Authorizes the package name and signing-certificate SHA-1 |
| Web application | Provides the audience used for frontend ID tokens and backend verification |

Create a Web application OAuth client in the same Google Cloud project. Put its
client ID in both locations:

```env
# frontend/.env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# backend/.env
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Do not use the Android client ID for these variables, and do not put an OAuth
client secret in either file.

Build, install, and start the native development application on a running
emulator or USB-connected Android device:

```bash
cd frontend
npm run android:local
```

The first build can take several minutes while Gradle downloads dependencies.
The emulator also needs enough free space to stage and unpack the APK.

Additional root-level Android commands are available for each backend:

```bash
# Start Expo and open Android with the local backend
npm run frontend:start:android:local

# Start Expo and open Android against the Render backend
npm run frontend:start:android:render

# Build and install the native app with the local backend
npm run android:local

# Build and install the native app against the Render backend
npm run android:render
```

The scripts default to the first non-virtual local IPv4 address, preferring a
`192.168.*` address. Set `READOVO_DEV_HOST` to override the detected host, or
set `EXPO_PUBLIC_API_URL` to override the complete API URL.

## Firebase Push Notification Setup

`google-services.json` configures the Android client to receive Firebase Cloud
Messaging notifications. The backend needs separate Firebase Admin credentials
to send them.

From Firebase Console, open **Project settings > Service accounts > Firebase
Admin SDK**, generate a private key, and save the downloaded file as:

```text
backend/secrets/firebase-service-account.json
```

Then configure:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
```

The service-account file, `google-services.json`, and `.env` files are ignored
by Git and must never be committed. If backend-sent push notifications are not
needed, Firebase Admin configuration can remain empty; local notifications and
the rest of the application can still run.

## Registration Flow

The app supports registration with:

- email
- password
- repeated password

The frontend first calls:

```text
POST /auth/register
```

The backend stores the registration in `pending_user_registrations`, sends a
6-digit code that expires in 15 minutes, and only creates a user after:

```text
POST /auth/verify-email
```

Users can request a new code with:

```text
POST /auth/resend-verification-code
```

Passwords are not stored as plain text. The backend stores `passwordHash` and
`passwordSalt` in PostgreSQL.

## Useful Checks

Backend:

```bash
cd backend
npm run build
npm run lint
npm test -- --runInBand
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run lint
```

## Common Issues

### `Network Request Failed` on a physical device

A physical phone cannot reach the development computer through `localhost`.
The local scripts normally detect the computer's Wi-Fi address automatically.
If detection selects the wrong interface, set `READOVO_DEV_HOST` to the
computer's Wi-Fi IPv4 address and restart Expo.

Also confirm that the phone and computer are on the same Wi-Fi network and that
Windows Firewall allows Node.js and port `3000`.

### Android installation reports insufficient storage

The emulator needs enough free space to stage and unpack the APK. Remove unused
apps or wipe the emulator data from Android Studio's Device Manager, then retry
the native build command.

### Docker cannot connect

Start Docker Desktop first, then run:

```bash
npm run db:up
```

If another PostgreSQL instance already uses port `5432`, stop it or change the
published port and update `DATABASE_URL` accordingly.

### `npm.ps1 cannot be loaded` on Windows

If PowerShell blocks `npm` because script execution is disabled, use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run start:dev
```
