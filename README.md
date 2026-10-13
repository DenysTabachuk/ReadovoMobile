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

Commands below assume you are starting from the repository root.

## Install Dependencies

Install dependencies in each package:

```bash
cd backend
npm install

cd ../frontend
npm install
```

The root package currently only contains helper scripts, but you can also install
it if needed:

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

The backend creates the `users` table automatically on startup.

## Backend Setup

Create `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgres://readovo:readovo_password@localhost:5432/readovo
PORT=3000
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
JWT_SECRET=change-this-to-a-long-random-secret
GOOGLE_WEB_CLIENT_ID=
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

`SMTP_*` and `EMAIL_FROM` are used to send email verification codes. If they are
empty in local development, the backend logs the verification code.

For Gmail, use an app password instead of your normal account password:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_google_app_password
EMAIL_FROM=Readovo <your.email@gmail.com>
```

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

Create `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

For Expo Go on a physical phone, use your computer's Wi-Fi IPv4 address:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.102:3000
```

To find the current IP on Windows:

```bash
ipconfig
```

Look for the Wi-Fi adapter's `IPv4 Address`. The phone and computer must be on
the same Wi-Fi network. If the IP changes, update `EXPO_PUBLIC_API_URL` and
restart Expo.

For Android emulator:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

For web or iOS simulator:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Start Expo:

```bash
cd frontend
npm start -- --clear
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

### `Network Request Failed` in Expo Go

Do not use `localhost` from a physical phone. Use the computer's Wi-Fi IP in
`frontend/.env`, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.102:3000
```

Then restart Expo:

```bash
npm start -- --clear
```

Also check that Windows Firewall allows Node.js or port `3000`.

### Docker cannot connect

Start Docker Desktop first, then run:

```bash
npm run db:up
```

### `npm.ps1 cannot be loaded` on Windows

If PowerShell blocks `npm` because script execution is disabled, use `npm.cmd`
for that command:

```bash
npm.cmd install
npm.cmd run start:dev
```
