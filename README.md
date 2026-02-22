# Violet (WiNGHacks 2026)

Violet is an Expo + React Native app with an Express/MongoDB backend for authentication, onboarding, profiles, matching, and messaging.

## Stack

- **Frontend:** Expo Router, React Native, TypeScript
- **Backend:** Express, Socket.IO, Mongoose
- **Services:** MongoDB, Cloudinary, Gmail SMTP (via Nodemailer)

## Project Structure

- `app/` - Expo Router screens and navigation
- `components/` - shared UI components
- `hooks/` - custom hooks (including `use-socket`)
- `server/` - backend API and Socket.IO server
- `utils/` - shared helpers/services

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- (Optional) Cloudinary account for image uploads
- (Optional) Gmail app password for email verification

## 1) Install dependencies

From the repository root:

```bash
npm install
```

Install backend-local dependencies too (inside `server/`):

```bash
cd server
npm install
cd ..
```

## 2) Configure environment variables

Create `server/.env`:

```env
MONGO_URI=your_mongodb_uri
MONGO_DB_NAME=violet

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create root `.env` (for Expo app):

```env
EXPO_PUBLIC_API_URL=http://yourIP:3000
```

## 3) Run the backend (port 3000)
cd server
npx tsx index.ts

## 4) Run the frontend
npx expo start -c

## Notes for local device testing

- `localhost` only works on the same machine as the backend.
- For physical phones, set `EXPO_PUBLIC_API_URL` to your PC LAN URL (for example `http://192.168.x.x:3000`) and ensure phone + PC are on the same network.
- Backend CORS is currently open (`origin: "*"`) for local development.
