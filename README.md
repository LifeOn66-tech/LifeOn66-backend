# LifeOn66-backend

Backend for the LifeOn66 MERN application.

## Tech Stack
- Node.js
- Express
- MongoDB
- JWT Authentication

## Setup
1. Run `npm install` to install dependencies.
2. Create a `.env` file (if not present) with your configuration.
3. Run `npm run dev` to start the development server.

## Google Sign-In

The app uses **server-side Google OAuth redirect** (not the GSI JavaScript button), so you do **not** need to whitelist every frontend origin in Google Cloud.

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 Web client:

1. Add **Authorized redirect URIs**:
   - `http://localhost:5000/api/auth/google/callback` (local backend)
   - `https://lifeon66-backend.onrender.com/api/auth/google/callback` (production)
2. Set in `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `FRONTEND_URL` (optional, e.g. `http://localhost:5173` or `https://lifeon66-frontend.vercel.app`)

Endpoints:
- `GET /api/auth/google/start` — begins Google sign-in
- `GET /api/auth/google/callback` — Google redirects here after login
