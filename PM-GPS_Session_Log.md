# PM-GPS — Full Session Log & Handoff Document

**Date:** 25 March 2026
**Project:** PM-GPS — AI career intelligence tool for Indian tech professionals transitioning into Product Manager roles
**Session duration:** Full day build + debug session

---

## 1. What is PM-GPS?

PM-GPS is a web application that takes a user's CV and a short questionnaire, runs it through a two-stage AI pipeline (GPT-4o), and returns a personalised map of:

- Which PM archetypes fit their background (scored 0–100 across 11 PM role types)
- What skills they already have vs. need to build
- Which Indian tech companies are currently hiring for their exact profile

The name is a metaphor: it gives you a GPS for your PM career — not a generic destination, but YOUR destination.

---

## 2. The Three Codebases

### Backend — `~/pm-gps-backend`
- **Language/Framework:** Node.js + Express + TypeScript
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (Google OAuth + Phone OTP)
- **File Storage:** Supabase Storage
- **Queue:** Redis (Upstash) + BullMQ (for background AI jobs)
- **AI:** OpenAI GPT-4o
- **Real-time:** Socket.IO (notifies frontend when results are ready)
- **Port:** 3000

### Frontend — `~/pm-gps-frontend`
- **Framework:** React 18 + React Router v6 + Tailwind CSS + shadcn/ui
- **Originally exported from Lovable** (a no-code React builder)
- **Port:** 8080

### Standalone HTML — `~/PM/index.html`
- A self-contained single HTML file replicating the entire frontend
- Pure vanilla JavaScript, no build step
- Works without the backend (uses mock data)
- Built in a previous session as a prototype

---

## 3. What We Did This Session — Step by Step

---

### STEP 1: Organised files into a clean folder

**What happened:**
Created a folder called `PM-GPS` on the Desktop and copied all three codebases into it:
- `PM-GPS/backend/` — the Node.js backend
- `PM-GPS/frontend/` — the React frontend
- `PM-GPS/standalone-index.html` — the vanilla HTML prototype

**Why:** Having everything in one place makes it easy to hand off, zip, or back up.

---

### STEP 2: Planned two features (Feature Planning Session)

Before writing any code, we did a full planning exercise. Claude explored the entire codebase and designed a detailed plan for two features:

#### Feature 1: Real Supabase Auth (Google OAuth + Phone OTP)
The app previously had **mock authentication** — clicking "Continue with Google" just set a fake token and moved you to the next page. No real login happened.

**Plan:** Replace all mock auth with real Supabase authentication:
- Google OAuth: user clicks button → redirected to Google → comes back logged in
- Phone OTP: user enters +91 number → receives SMS → enters 6-digit code → logged in
- After either method: create a backend "session" (a record of this analysis run) and store its ID

#### Feature 2: Auto-populate Questionnaire from CV
After a user uploads their CV and the AI extracts information from it, the questionnaire page should pre-fill certain fields (current role, years of experience, company types, industries) with the extracted data instead of making the user type them again.

---

### STEP 3: Implemented Feature 1 — Real Auth

**Files created/modified:**

| File | What changed |
|------|-------------|
| `backend/.env.example` | Added `FRONTEND_URL=http://localhost:8080` |
| `backend/src/controllers/authController.ts` | Google OAuth callback now redirects browser to frontend with token in URL instead of returning JSON |
| `frontend/src/lib/api.ts` | Added base URL from env var, added `setSessionId`/`getSessionId` helpers, fixed Content-Type headers |
| `frontend/src/pages/AuthCallbackPage.tsx` | **New file** — landing page after Google login, exchanges OAuth code for session |
| `frontend/src/App.tsx` | Added `/auth/callback` route |
| `frontend/src/pages/LoginPage.tsx` | Replaced all 3 mock handlers with real Supabase API calls |
| `frontend/.env` | **New file** — `VITE_API_BASE_URL=http://localhost:3000` |

**For non-technical readers:**
Think of authentication like a bouncer at a club. Before this change, the app had a fake bouncer who let everyone in without checking ID. After this change, the real bouncer (Supabase + Google) checks your actual Google account and only lets you in if you're a real person.

---

### STEP 4: Implemented Feature 2 — CV Auto-populate

**Files created/modified:**

| File | What changed |
|------|-------------|
| `backend/src/controllers/profileController.ts` | **New file** — endpoint that reads AI-extracted CV data and returns it for pre-filling |
| `backend/src/routes/profile.ts` | **New file** — connects the URL `/api/profile/prefill/:session_id` to the controller |
| `backend/src/app.ts` | Registered the new `/api/profile` route |
| `frontend/src/pages/QuestionnairePage.tsx` | Added pre-fill logic — fetches extracted data, populates fields, shows "Auto-filled from your CV" badges |

**For non-technical readers:**
Imagine filling out a job application form. Normally you'd type your job title, years of experience, industry etc. With this feature, the app reads your CV first, figures out those answers, and fills them in for you. You can still change any of them — they're just suggestions.

---

### STEP 5: Installed backend dependencies

When we tried to start the backend for the first time, it failed because:
1. Dependencies weren't installed (`npm install` hadn't been run)
2. A package called `@types/mammoth` was listed in `package.json` but doesn't exist on npm — we removed it

**Fix:** Removed the bad package, ran `npm install`, backend started successfully.

---

### STEP 6: Created the database schema

The Supabase database was empty — no tables existed. We created a complete SQL script (`create_tables.sql`) that defines all 8 tables:

| Table | Purpose |
|-------|---------|
| `users` | One row per person who signs up |
| `sessions` | One row per analysis run (one user can have multiple sessions) |
| `documents` | CV files and pasted text |
| `questionnaire_responses` | The user's answers to the 3-step form |
| `user_profiles` | AI Stage 1 output — what the AI extracted from the CV |
| `results` | AI Stage 2 output — the PM archetype scores and company matches |
| `pm_role_archetypes` | The 11 PM role types the system scores against (reference data) |
| `companies` | 30 Indian tech companies with their PM archetype fit (reference data) |

We also seeded the `pm_role_archetypes` and `companies` tables with real data.

**For non-technical readers:**
A database is like a collection of spreadsheets. Before you can store anything, you need to create the spreadsheets (tables) and define what columns they have. This step created all those spreadsheets and filled in the reference data (the 11 PM types and 30 companies) that the AI needs to do its scoring.

**Files created:**
- `backend/create_tables.sql` — run this in Supabase SQL Editor
- `Desktop/create_tables.docx` — same content as a Word document
- `Desktop/restart.md` — clean copy with Step 1 (tables) and Step 2 (reload schema) separated clearly

---

### STEP 7: Connected all third-party services

We updated `~/pm-gps-backend/.env` with real credentials:

| Variable | Value | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | `https://avsjimrirjmxdeuaoveo.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `sb_publishable_Ck0oDsI...` | Public Supabase key (frontend) |
| `SUPABASE_SERVICE_KEY` | `sb_secret_724PTxGx...` | Secret Supabase key (backend, bypasses security rules) |
| `REDIS_URL` | `rediss://default:gQAAA...@skilled-ox-84070.upstash.io:6379` | Upstash Redis for background job queue |
| `FRONTEND_URL` | `http://localhost:8080` | Where to redirect after Google login |

**Still needs to be filled in:**
- `OPENAI_API_KEY` — needed for the AI pipeline to work
- `DATABASE_URL` — PostgreSQL direct connection (optional, backend currently uses Supabase JS client)

---

### STEP 8: Configured Google OAuth

Multiple configuration steps across three systems:

**Google Cloud Console:**
- Created OAuth 2.0 client for project `pm-gps`
- Google Client ID: `299469146895-p5q74b83cd91vt1tgb8rivfnt2se6m6h.apps.googleusercontent.com`
- Authorised JavaScript origins: `http://localhost:8080`
- Authorised redirect URI: `https://avsjimrirjmxdeuaoveo.supabase.co/auth/v1/callback`

**Supabase Authentication → Providers → Google:**
- Enabled Google provider
- Entered the Google Client ID and Secret

**Supabase Authentication → URL Configuration:**
- Site URL: `http://localhost:8080`
- Redirect URLs: `http://localhost:8080/auth/callback`

**For non-technical readers:**
Google OAuth is like using your Google account as a passport. For this to work, three systems need to agree on the rules: (1) Google needs to know which website is allowed to use your Google account, (2) Supabase (our auth middleman) needs the Google credentials, and (3) our app needs to know where to send people after login.

---

### STEP 9: Debugging the OAuth flow — the big challenge

This took several iterations. Here is what went wrong and how it was fixed:

#### Problem 1: "Unsupported provider"
**What it meant:** Google provider wasn't enabled in Supabase yet.
**Fix:** Enabled Google provider in Supabase dashboard and entered Google credentials.

#### Problem 2: `OAUTH_FAILED` from backend
**What it meant:** The backend was trying to exchange the OAuth code for a session, but it was failing.
**Root cause:** This is a technical concept called **PKCE (Proof Key for Code Exchange)**. When Google OAuth runs, it creates a secret "code verifier" that must live in the same browser that started the login. Our old code was trying to do this exchange on the server (backend), which doesn't have access to the browser's storage.
**Fix:** Moved the entire Google OAuth initiation to the frontend (browser) using the Supabase JS client directly. The backend no longer handles Google OAuth at all — it just receives the final token.

**For non-technical readers:**
Imagine you start a combination lock sequence on your phone, but then ask someone else to finish it on their phone — it won't work because only your phone knows the combination. PKCE is similar. The browser that starts the Google login must also be the one to complete it.

#### Problem 3: Site URL still pointing to backend
**What it meant:** Supabase's "Site URL" was set to `http://localhost:3000` (the backend port), so after login it was trying to redirect to the backend instead of the frontend.
**Fix:** Changed Site URL to `http://localhost:8080` in Supabase dashboard.

#### Problem 4: JavaScript origins missing in Google Cloud
**What it meant:** Google didn't know `http://localhost:8080` was allowed to initiate OAuth.
**Fix:** Added `http://localhost:8080` as an Authorised JavaScript origin in Google Cloud Console.

#### Problem 5: 400 error on code exchange
**What it meant:** We were passing the wrong format to `exchangeCodeForSession` — passing the full URL query string (`?code=xxx`) instead of just the code value.
**Fix:** Used `new URLSearchParams(window.location.search).get('code')` to extract just the code.

#### Problem 6: Double code exchange (code already used)
**What it meant:** The Supabase JS client automatically tries to exchange the OAuth code when it detects `?code=` in the URL. Our code was also trying to exchange it manually — causing a conflict where the code was used twice (codes can only be used once).
**Fix:** Removed manual exchange. Instead, we now let Supabase handle it automatically and just listen for the `SIGNED_IN` event.

#### Problem 7: "Could not start session" — the final bug
**What it meant:** The Google login worked, but creating the backend session failed.
**Root cause:** Our `sessions` table has a rule: every session must belong to a user in our `users` table. In the old flow, when Google OAuth completed on the backend, it would automatically add the user to our `users` table. When we moved OAuth to the frontend, that step no longer happened. So when the frontend tried to create a session, the database rejected it because the user didn't exist in our `users` table (even though they existed in Supabase's internal auth system).
**Fix:** Modified `sessionController.ts` to upsert (insert or update) the user into our `users` table automatically whenever a new session is created. This works for both Google and OTP auth.

**For non-technical readers:**
Think of it like a hotel. The hotel (sessions table) requires guests to be registered at the front desk (users table) before they can get a room key. When we changed the check-in process, we accidentally removed the front desk registration step. The fix was to make the room key machine (session controller) also handle registration automatically.

---

## 4. Current State of the App

### What's working ✅
- Backend starts cleanly on port 3000 (Supabase + Redis connected)
- Frontend starts on port 8080
- All 8 database tables created with seed data
- Google OAuth flow: click → Google → redirected back → session created → upload page
- Phone OTP flow: enter number → SMS → verify → session created (requires Supabase SMS provider setup)
- All auth is real — no more mock tokens

### What still needs to be done ⚠️
- `OPENAI_API_KEY` needs to be added to `.env` for the AI pipeline to work
- Phone OTP requires an SMS provider (Twilio/Vonage) configured in Supabase (paid plan)
- The full flow (upload → questionnaire → processing → results) hasn't been tested end-to-end yet
- `DATABASE_URL` placeholder in `.env` (not blocking — backend uses Supabase JS client)

### To start the app locally
```bash
# Terminal 1 — Backend
cd ~/pm-gps-backend
npm run dev

# Terminal 2 — Frontend
cd ~/pm-gps-frontend
npm run dev
```

Then open: **http://localhost:8080**

---

## 5. Architecture Diagram (Text Version)

```
User's Browser (localhost:8080)
        │
        │ Click "Continue with Google"
        ▼
Supabase Auth → Google → back to Supabase → back to localhost:8080/auth/callback
        │
        │ access_token stored in localStorage (pmgps_token)
        ▼
Backend API (localhost:3000)
        │
        │ POST /api/session  (Authorization: Bearer <token>)
        │   → validates token with Supabase
        │   → upserts user into users table
        │   → creates session record
        │   → returns session_id (stored in localStorage as pmgps_session_id)
        ▼
Upload Page → Questionnaire → POST /api/process
        │
        │ BullMQ job queued in Redis (Upstash)
        ▼
Background Worker
        │
        ├─ Stage 1: GPT-4o reads CV → extracts structured profile → stores in user_profiles
        └─ Stage 2: GPT-4o scores 11 PM archetypes → matches companies → stores in results
                │
                └─ Socket.IO event fires → frontend updates → Results page shown
```

---

## 6. Key Files Reference

### Backend (`~/pm-gps-backend/src/`)
| File | Purpose |
|------|---------|
| `index.ts` | Entry point, starts server on port 3000 |
| `app.ts` | Express app setup, registers all routes |
| `middleware/auth.ts` | Validates Bearer token on every protected route |
| `controllers/authController.ts` | Google OAuth callback, OTP send/verify |
| `controllers/sessionController.ts` | Creates session + upserts user |
| `controllers/profileController.ts` | Returns CV-extracted data for questionnaire prefill |
| `services/extractionService.ts` | BullMQ worker — Stage 1 AI (CV extraction) |
| `services/recommendationService.ts` | BullMQ worker — Stage 2 AI (PM scoring) |
| `prompts/extractionPrompt.ts` | GPT-4o prompt for CV extraction |
| `prompts/recommendationPrompt.ts` | GPT-4o prompt for PM archetype scoring |
| `.env` | All secrets and config (never commit this to git) |
| `create_tables.sql` | Run once in Supabase SQL Editor to create all tables |

### Frontend (`~/pm-gps-frontend/src/`)
| File | Purpose |
|------|---------|
| `App.tsx` | Route definitions |
| `lib/api.ts` | All API fetch helpers, token/session storage |
| `lib/supabase.ts` | Supabase browser client (for OAuth) |
| `pages/LoginPage.tsx` | Google OAuth + Phone OTP login |
| `pages/AuthCallbackPage.tsx` | Handles return from Google OAuth |
| `pages/UploadPage.tsx` | CV upload (file, Google Drive, paste text) |
| `pages/QuestionnairePage.tsx` | 3-step form with CV auto-fill |
| `pages/ProcessingPage.tsx` | Waiting screen with Socket.IO listener |
| `pages/ResultsPage.tsx` | Final PM archetype scores + companies |
| `.env` | Frontend env vars (VITE_ prefix) |

---

## 7. Third-Party Services Summary

| Service | What it does | Where configured |
|---------|-------------|-----------------|
| **Supabase** | Database, Auth, File Storage | supabase.com/dashboard → project avsjimrirjmxdeuaoveo |
| **Google Cloud** | Google OAuth provider | console.cloud.google.com → project pm-gps |
| **Upstash** | Redis for background job queue | console.upstash.com |
| **OpenAI** | GPT-4o for CV extraction + PM scoring | platform.openai.com |

---

## 8. Decisions Made & Why

| Decision | Why |
|----------|-----|
| Move Google OAuth entirely to frontend | PKCE security model requires code exchange in the same browser that initiated login — backend can't do it |
| Upsert user in sessionController instead of authController | After moving OAuth to frontend, backend never sees the Google callback — session creation is the first backend call, so it's the right place to ensure the user exists in our DB |
| Use `onAuthStateChange` + `getSession()` fallback in callback page | Supabase may auto-exchange the code before our listener is set up — dual approach handles both timing scenarios |
| `sb_publishable_` key format | New Supabase key format (2026), supported by Supabase JS v2.100.0 |
| Service key on backend only | Service key bypasses Row Level Security — never expose it to the frontend |

---

## 9. What to Do in the Next Session

1. **Add OpenAI API key** to `~/pm-gps-backend/.env`: `OPENAI_API_KEY=sk-...`
2. **Test the full flow** end-to-end: login → upload CV → fill questionnaire → trigger processing → see results
3. **Set up SMS provider** in Supabase (Twilio) if phone OTP is needed
4. **Test OTP auth** with a real phone number
5. **Update Desktop/PM-GPS folder** with latest code: `rsync -a ~/pm-gps-backend/ ~/Desktop/PM-GPS/backend/` and same for frontend

---

*This document was generated at the end of the session on 25 March 2026.*
