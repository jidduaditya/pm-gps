# PM-GPS Backend

AI-native career intelligence backend for matching tech professionals to PM roles.

## Tech Stack
- Node.js + Express + TypeScript
- PostgreSQL (Supabase) + Supabase JS client
- Redis (Upstash) + BullMQ workers
- OpenAI GPT-4o
- Socket.IO
- Supabase Auth + Storage

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Start dev server
```bash
npm run dev
```

## Auth

Supabase Auth tokens are used directly. The backend validates tokens via `supabase.auth.getUser(token)`. Pass the Supabase session `access_token` as a Bearer token in the `Authorization` header.

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | No | Google OAuth — returns redirect URL |
| GET | /api/auth/callback | No | Google OAuth callback |
| POST | /api/auth/otp/send | No | Send OTP to email or phone |
| POST | /api/auth/otp/verify | No | Verify OTP, returns Supabase access token |
| POST | /api/session | Yes | Create new session |
| POST | /api/documents/upload | Yes | Upload files (PDF/DOCX/TXT, max 10MB, max 5) |
| POST | /api/documents/text | Yes | Paste text (max 10,000 chars) |
| POST | /api/documents/gdrive | Yes | Import from Google Drive |
| POST | /api/questionnaire | Yes | Submit questionnaire responses |
| POST | /api/process | Yes | Trigger LLM processing pipeline |
| GET | /api/results/:session_id | Yes | Get results or processing status |
| DELETE | /api/user/data | Yes | GDPR: delete all user data |

## WebSocket Events

Connect to the server with Socket.IO. On connection, emit:
```js
socket.emit('join_session', { session_id: 'your-session-id' })
```

Listen for:
- `results_ready` — LLM processing complete, fetch results
- `processing_failed` — Pipeline failed, user should retry

## Rate Limits
- Document upload: 10 req/min per user
- Process trigger: 3 req/hour per user

## Error Format
All errors return:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```
