# PM-GPS — Session Update Log

## Date: 2026-03-26

---

## 1. Frontend Pages Wired to Real Backend APIs

### UploadPage (`frontend/src/pages/UploadPage.tsx`)
- Added session creation via `POST /api/session`
- Added document upload via `POST /api/documents/upload` (multipart FormData), `/api/documents/text`, and `/api/documents/gdrive`
- Stores `session_id` in localStorage via `setSessionId()`
- Shows loading spinner and specific backend error messages in toast
- Imports: `apiFetch`, `setSessionId`, `authHeaders` from `@/lib/api`

### QuestionnairePage (`frontend/src/pages/QuestionnairePage.tsx`)
- Submits all form responses to `POST /api/questionnaire` with `{ session_id, responses }`
- Triggers processing via `POST /api/process` with `{ session_id }`
- Session guard: redirects to `/upload` if no session exists
- Shows loading state on submit button
- Imports: `apiFetch`, `getSessionId` from `@/lib/api`, `Loader2`, `toast`

### ProcessingPage (`frontend/src/pages/ProcessingPage.tsx`)
- Replaced all fake `setTimeout` timers with real Socket.IO connection
- Connects to backend via Vite proxy (`/socket.io`)
- Emits `join_session` with `{ session_id }` on connect
- Listens for `results_ready` → navigates to `/results`
- Listens for `processing_failed` → shows error state
- Keeps time-based step animation (0→1→2) for UX, gates completion on real event
- Keeps 120-second timeout safety net
- Session guard: redirects to `/upload` if no session
- Imports: `io` from `socket.io-client`, `getSessionId` from `@/lib/api`

### ResultsPage (`frontend/src/pages/ResultsPage.tsx`)
- Already wired to `GET /api/results/:sessionId` (no changes needed for API)
- Added "What's next?" section with two CTAs:
  - **Build your roadmap** → links to `/roadmap/start?role_id=X&role_name=Y`
  - **Practice with AI Coach** → links to `/coach`

---

## 2. Authentication — Google OAuth Fix

### Problem
Backend-initiated Google OAuth failed because PKCE `code_verifier` is lost between stateless Express requests.

### Solution
Moved OAuth entirely to the frontend Supabase JS client.

### Files Created
- `frontend/src/lib/supabase.ts` — Frontend Supabase client with project URL + anon key
- `frontend/src/pages/AuthCallbackPage.tsx` — Handles OAuth redirect, exchanges PKCE code for session

### AuthCallbackPage Flow
1. Extracts `?code=` from URL params
2. Calls `supabase.auth.exchangeCodeForSession(code)` for PKCE exchange
3. Falls back to `supabase.auth.getSession()` for OTP flows
4. Stores token via `setToken()` and navigates to `/upload`

### LoginPage (`frontend/src/pages/LoginPage.tsx`)
- Google login: `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: origin + "/auth/callback" })`
- Phone OTP: `supabase.auth.signInWithOtp({ phone })` → `supabase.auth.verifyOtp()`

### App.tsx
- Added route: `/auth/callback` → `AuthCallbackPage`

---

## 3. Backend — Session Controller Fix

### Problem
`sessions.user_id` FK references `users(id)`. The old auth flow (backend-initiated) upserted users via `authService`, but with frontend auth, that code never runs.

### Fix (`backend/src/controllers/sessionController.ts`)
- Added user upsert before session creation
- Only includes `email`/`phone` when they have actual values (avoids UNIQUE constraint on null)
- Checks and throws on upsert error with specific message
- Uses `onConflict: 'id'` with `ignoreDuplicates: false`

---

## 4. Supabase Storage Bucket

### Problem
`POST /api/documents/upload` failed with "Storage upload failed" because the `documents` bucket didn't exist.

### Fix
Created the bucket via Supabase Storage API:
```bash
curl -X POST "https://avsjimrirjmxdeuaoveo.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer <service_key>" \
  -d '{"id":"documents","name":"documents","public":true}'
```

---

## 5. LLM Migration: OpenAI → Rule-Based (LLM removed)

### Problem
Both OpenAI and Anthropic API keys had insufficient credits.

### Solution
Replaced all LLM calls with rule-based logic so the pipeline works without any external API.

### Files Modified

#### `backend/src/services/extractionService.ts`
- Removed OpenAI/Anthropic import
- Builds extracted profile directly from questionnaire responses + keyword extraction from CV text
- Skills extracted by matching known keywords against CV content
- No external API calls

#### `backend/src/services/recommendationService.ts`
- Removed OpenAI/Anthropic import
- Rule-based scoring: matches user skills against archetype `must_have_skills` and `good_to_have_skills`
- Scoring formula: `(must_have_match/total × 60) + (good_to_have_match/total × 25) + experience_boost + interest_boost`
- Company suggestions pulled from DB, labeled based on score threshold

#### `backend/src/services/coachService.ts`
- Removed OpenAI/Anthropic import and type imports
- `submitTurn`: Returns template-based feedback with structured `did_well`, `broke_down`, `next_time`
- `endCoachSession`: Returns template-based summary with strength, gap, practice
- `transcribeAudio`: Marked as not implemented (needs dedicated speech-to-text service)

#### `backend/src/services/roadmapService.ts`
- Removed OpenAI/Anthropic import
- Generates stages directly from weak topics with template resources and practice prompts

#### `backend/src/lib/anthropic.ts` (created, currently unused)
- Anthropic SDK client setup, ready to re-enable when API credits are available

#### `backend/.env`
- `OPENAI_API_KEY` replaced with `ANTHROPIC_API_KEY`
- Key: `sk-ant-api03--_1Yi-DHTv_...` (needs credits to activate)

---

## 6. Vite Configuration

### `frontend/vite.config.ts`
- Added `/api` proxy → `http://localhost:3000`
- Added `/socket.io` proxy → `http://localhost:3000` with `ws: true` for WebSocket

---

## 7. Navigation Updates

### Navbar (`frontend/src/components/Navbar.tsx`)
- Added dropdown menu items: **Roadmap & Quiz**, **AI Coach**

### ResultsPage
- Added "What's next?" section with roadmap and coach CTAs

---

## 8. Dependencies Added

### Frontend (`frontend/package.json`)
- `socket.io-client` — Real-time processing status via WebSocket

### Backend (`backend/package.json`)
- `@anthropic-ai/sdk` — Anthropic client (ready for when credits are added)

---

## 9. Environment Configuration

### `backend/.env`
```
SUPABASE_URL=https://avsjimrirjmxdeuaoveo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_STORAGE_BUCKET=documents
ANTHROPIC_API_KEY=sk-ant-api03--_1Yi-DHTv_...
REDIS_URL=rediss://default:...@skilled-ox-84070.upstash.io:6379
PORT=3000
FRONTEND_URL=http://localhost:8080
```

---

## 10. Complete Data Flow (Working)

```
Login (Google OAuth / Phone OTP)
  ↓ Supabase JS client → stores JWT in localStorage
  ↓
AuthCallbackPage → exchangeCodeForSession(code) → setToken()
  ↓
UploadPage
  ↓ POST /api/session → upserts user → creates session → returns session_id
  ↓ POST /api/documents/upload → multer → extract text → store in Supabase Storage + DB
  ↓
QuestionnairePage
  ↓ POST /api/questionnaire → saves responses
  ↓ POST /api/process → queues BullMQ extraction job
  ↓
ProcessingPage (Socket.IO listener)
  ↓ BullMQ Worker: extraction → recommendation → results insert
  ↓ Socket.IO: emit('results_ready')
  ↓
ResultsPage
  ↓ GET /api/results/:session_id → display scores, skills, companies
  ↓ CTAs: Build Roadmap → /roadmap/start | AI Coach → /coach
```

---

## 11. Known Limitations

1. **LLM-powered features disabled** — Extraction, recommendation, coaching, and roadmap generation use rule-based logic. Re-enable by adding credits to the Anthropic API key and restoring the LLM calls.
2. **Audio transcription not implemented** — Needs a separate speech-to-text service (Deepgram, AssemblyAI, etc.)
3. **Google Drive import not implemented** — Backend throws 501; needs Google Drive API + OAuth setup.
4. **Quiz questions table is empty** — The roadmap quiz flow (`/roadmap/start`) requires `quiz_questions` to be seeded in Supabase.
5. **Rule-based scores are low** — Without LLM, skill matching is keyword-based and produces lower scores than AI scoring would.

---

## 12. Files Modified (Complete List)

### Frontend
| File | Change |
|------|--------|
| `src/pages/UploadPage.tsx` | Session creation + document upload API calls |
| `src/pages/QuestionnairePage.tsx` | Questionnaire submission + process trigger |
| `src/pages/ProcessingPage.tsx` | Socket.IO real-time events (replaced fake timers) |
| `src/pages/ResultsPage.tsx` | Added roadmap + coach CTAs |
| `src/pages/LoginPage.tsx` | Rewired to Supabase JS client (Google + OTP) |
| `src/pages/AuthCallbackPage.tsx` | **Created** — OAuth PKCE code exchange |
| `src/lib/supabase.ts` | **Created** — Frontend Supabase client |
| `src/lib/api.ts` | No changes (already had token/session utilities) |
| `src/components/Navbar.tsx` | Added Roadmap & Coach nav links |
| `src/App.tsx` | Added `/auth/callback` route |
| `vite.config.ts` | Added `/api` and `/socket.io` proxies |
| `package.json` | Added `socket.io-client` |

### Backend
| File | Change |
|------|--------|
| `src/controllers/sessionController.ts` | User upsert before session creation |
| `src/services/extractionService.ts` | Replaced LLM with rule-based extraction |
| `src/services/recommendationService.ts` | Replaced LLM with rule-based scoring |
| `src/services/coachService.ts` | Replaced LLM with template feedback |
| `src/services/roadmapService.ts` | Replaced LLM with template roadmap |
| `src/lib/anthropic.ts` | **Created** — Anthropic SDK client |
| `.env` | Updated with real credentials, swapped OpenAI → Anthropic key |
| `package.json` | Added `@anthropic-ai/sdk`, removed `@types/mammoth` |
