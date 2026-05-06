# Readovo Mobile

Readovo Mobile is an Expo React Native app with a NestJS backend and PostgreSQL
database for local development.

## Prerequisites

- Node.js and npm
- Docker Desktop
- Expo Go on your phone, or an Android/iOS simulator

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

Create or update `frontend/.env`.

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
