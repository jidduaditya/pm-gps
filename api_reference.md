# PM-GPS API Reference

Base URL: `{NEXT_PUBLIC_API_URL}` (e.g. `http://localhost:3000`)

All authenticated endpoints require:
```
Authorization: Bearer {token}
Content-Type: application/json
```

Error response shape (all endpoints):
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## Auth

### POST /api/auth/login
- Auth required: no
- Headers: `Content-Type: application/json`
- Request body: none
- Success response (200):
  ```json
  { "url": "https://accounts.google.com/o/oauth2/..." }
  ```
- Error responses:
  - `400 OAUTH_ERROR` — Supabase OAuth configuration error

---

### GET /api/auth/callback
- Auth required: no
- Headers: none
- Request body: none (query parameter)
- Query params:
  - `code` (string, required) — OAuth authorization code from Google
- Success response: `302` redirect to `{FRONTEND_URL}/auth/callback?token={jwt}`
- Error responses:
  - `400 OAUTH_FAILED` — code exchange failed or no user returned
  - `500 DB_ERROR` — user upsert failed

---

### POST /api/auth/otp/send
- Auth required: no
- Headers: `Content-Type: application/json`
- Request body:
  - `email` (string, optional) — user's email address
  - `phone` (string, optional) — user's phone number
  - At least one of `email` or `phone` is required
- Success response (200):
  ```json
  { "message": "OTP sent successfully" }
  ```
- Error responses:
  - `400 MISSING_FIELD` — neither email nor phone provided
  - `400 OTP_SEND_FAILED` — Supabase OTP delivery failed

---

### POST /api/auth/otp/verify
- Auth required: no
- Headers: `Content-Type: application/json`
- Request body:
  - `email` (string, optional) — must match the one used in `/otp/send`
  - `phone` (string, optional) — must match the one used in `/otp/send`
  - `token` (string, required) — the OTP code
- Success response (200):
  ```json
  { "token": "eyJhbGciOi..." }
  ```
- Error responses:
  - `400 MISSING_FIELD` — neither email nor phone provided
  - `400 OTP_INVALID` — incorrect or expired OTP
  - `500 DB_ERROR` — user upsert failed

---

## Session

### POST /api/session
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Request body: none
- Success response (201):
  ```json
  { "session_id": "uuid" }
  ```
- Error responses:
  - `401 UNAUTHORIZED` — missing or invalid token
  - `500 DB_ERROR` — user sync or session creation failed

---

## Documents

### POST /api/documents/upload
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`
- Request body (multipart):
  - `session_id` (string, required) — the session UUID
  - `files` (file[], required) — 1–5 files, max 10MB each
    - Allowed types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`, `text/plain`
- Success response (201):
  ```json
  {
    "documents": [
      {
        "id": "uuid",
        "session_id": "uuid",
        "type": "cv",
        "storage_url": "https://...",
        "raw_text": "extracted text...",
        "upload_source": "computer",
        "created_at": "ISO8601"
      }
    ]
  }
  ```
- Error responses:
  - `400 MISSING_FIELD` — session_id not provided
  - `400 NO_FILES` — no files attached
  - `400 DOC_LIMIT_REACHED` — session already has 5 documents
  - `401 UNAUTHORIZED` — missing or invalid token
  - `404 SESSION_NOT_FOUND` — session doesn't exist or doesn't belong to user
  - `500 DB_ERROR` — database insert failed
  - `500 UPLOAD_FAILED` — storage upload failed
- Rate limit: 10 requests per 60 seconds

---

### POST /api/documents/text
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Request body:
  - `session_id` (string, required) — the session UUID
  - `text` (string, required) — pasted text content, max 10,000 characters
- Success response (201):
  ```json
  {
    "document": {
      "id": "uuid",
      "session_id": "uuid",
      "type": "text_paste",
      "raw_text": "the pasted text...",
      "upload_source": "text_box",
      "created_at": "ISO8601"
    }
  }
  ```
- Error responses:
  - `400 MISSING_FIELD` — session_id or text not provided
  - `400 TEXT_TOO_LONG` — text exceeds 10,000 characters
  - `401 UNAUTHORIZED` — missing or invalid token
  - `404 SESSION_NOT_FOUND` — session doesn't exist or doesn't belong to user
  - `500 DB_ERROR` — database insert failed

---

## Questionnaire

### POST /api/questionnaire
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Request body:
  - `session_id` (string, required) — the session UUID
  - `responses` (object, required) — questionnaire answers (shape defined by frontend)
- Success response (200):
  ```json
  { "message": "Questionnaire submitted successfully" }
  ```
- Error responses:
  - `400 MISSING_FIELD` — session_id or responses not provided
  - `401 UNAUTHORIZED` — missing or invalid token
  - `404 SESSION_NOT_FOUND` — session doesn't exist or doesn't belong to user
  - `500 DB_ERROR` — database insert failed

---

## Process

### POST /api/process
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Request body:
  - `session_id` (string, required) — the session UUID
- Success response (202):
  ```json
  { "message": "Processing started", "session_id": "uuid" }
  ```
- Error responses:
  - `400 MISSING_FIELD` — session_id not provided
  - `400 NO_DOCUMENTS` — no documents uploaded for this session
  - `400 NO_QUESTIONNAIRE` — questionnaire not submitted for this session
  - `401 UNAUTHORIZED` — missing or invalid token
  - `404 SESSION_NOT_FOUND` — session doesn't exist or doesn't belong to user
  - `500 DB_ERROR` — database query failed
- Rate limit: 3 requests per 60 minutes

---

## Results

### GET /api/results/:session_id
- Auth required: yes
- Headers: `Authorization: Bearer {token}`
- Request body: none
- URL params:
  - `session_id` (string, required) — the session UUID
- Success response (200) — processing complete:
  ```json
  {
    "status": "completed",
    "result": {
      "id": "uuid",
      "session_id": "uuid",
      "generated_at": "ISO8601",
      "...": "full result object from results table"
    }
  }
  ```
- Success response (200) — still processing:
  ```json
  { "status": "processing" }
  ```
- Success response (200) — processing failed:
  ```json
  { "status": "failed", "message": "Processing failed. Please try again." }
  ```
- Error responses:
  - `401 UNAUTHORIZED` — missing or invalid token
  - `404 NOT_FOUND` — session not found
  - `404 SESSION_NOT_FOUND` — session doesn't belong to user
  - `500 DB_ERROR` — database query failed

---

## Profile

### GET /api/profile/prefill/:session_id
- Auth required: yes
- Headers: `Authorization: Bearer {token}`
- Request body: none
- URL params:
  - `session_id` (string, required) — the session UUID
- Success response (200) — profile ready:
  ```json
  {
    "current_role": "Senior PM" | null,
    "total_years_experience": 5 | null,
    "company_types": ["Startup", "Mid-size"] | null,
    "industries": ["Fintech", "SaaS"] | null
  }
  ```
- Success response (200) — profile not yet extracted:
  ```json
  { "status": "not_ready" }
  ```
- Error responses:
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — session belongs to a different user
  - `404 SESSION_NOT_FOUND` — session not found

---

## User

### DELETE /api/user/data
- Auth required: yes
- Headers: `Authorization: Bearer {token}`
- Request body: none
- Success response (200):
  ```json
  { "message": "All data deleted successfully" }
  ```
- Error responses:
  - `401 UNAUTHORIZED` — missing or invalid token
  - `500 DB_ERROR` — deletion failed

---

## Quiz

### POST /api/quiz/start
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Request body:
  - `pm_role_id` (string, required) — UUID of the PM role archetype
- Success response (201):
  ```json
  {
    "quiz_id": "uuid",
    "role_name": "Growth PM",
    "questions": [
      {
        "id": "uuid",
        "topic": "Metrics & Analytics",
        "question_number": 3,
        "question_text": "Which metric best measures...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."]
      }
    ]
  }
  ```
- Error responses:
  - `400 VALIDATION_ERROR` — pm_role_id not provided
  - `401 UNAUTHORIZED` — missing or invalid token
  - `404 ROLE_NOT_FOUND` — PM role doesn't exist
  - `404 NO_QUESTIONS` — no questions available for this role
  - `500 DB_ERROR` — database error
- Rate limit: 5 requests per 24 hours (per user)

---

### POST /api/quiz/:quiz_id/submit
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- URL params:
  - `quiz_id` (string, required) — the quiz session UUID
- Request body:
  - `answers` (object, required) — map of question_id to answer letter
    - Keys: question UUID strings
    - Values: `"A"`, `"B"`, `"C"`, or `"D"` (case-insensitive)
    - Must not be empty
- Success response (200):
  ```json
  {
    "quiz_id": "uuid",
    "score": 7,
    "total": 10,
    "topic_scores": [
      { "topic": "Metrics & Analytics", "score": 80 }
    ],
    "strengths": [
      { "topic": "Metrics & Analytics", "explanation": "Scored 80% — solid understanding..." }
    ],
    "weaknesses": [
      { "topic": "Strategy", "specific_gap": "Needs improvement in Strategy..." }
    ],
    "questions_review": [
      {
        "id": "uuid",
        "text": "Which metric...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correct": "B",
        "user_answer": "A",
        "explanation": "The correct answer is B because..."
      }
    ]
  }
  ```
- Error responses:
  - `400 VALIDATION_ERROR` — answers missing, empty, or contains invalid values
  - `400 ALREADY_SUBMITTED` — quiz already completed
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — quiz belongs to a different user
  - `404 QUIZ_NOT_FOUND` — quiz session not found
  - `500 DB_ERROR` — database error
- Rate limit: 10 requests per 24 hours (per user)

---

## Roadmap

### POST /api/roadmap/generate
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Request body:
  - `quiz_session_id` (string, required) — UUID of a completed quiz session
- Success response (201):
  ```json
  {
    "roadmap_id": "uuid",
    "role_name": "Growth PM",
    "role_id": "uuid",
    "status": "active",
    "stages": [
      {
        "stage_number": 1,
        "name": "Master Metrics & Analytics",
        "duration": "1–2 weeks",
        "status": "not_started",
        "goal": "Close the gap in...",
        "resources": [
          { "title": "Resource Name", "type": "Article", "url": "https://..." }
        ],
        "practice": "Find a real-world scenario...",
        "checkpoint": "Can you explain..."
      }
    ]
  }
  ```
- Error responses:
  - `400 VALIDATION_ERROR` — quiz_session_id not provided
  - `400 QUIZ_NOT_COMPLETED` — quiz not yet submitted
  - `400 NO_WEAKNESSES` — no weaknesses found (roadmap not needed)
  - `400 NO_STAGES` — stages could not be generated
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — quiz belongs to a different user
  - `404 QUIZ_NOT_FOUND` — quiz session not found
  - `404 ROLE_NOT_FOUND` — PM role not found
  - `500 DB_ERROR` — database error
- Rate limit: 5 requests per 24 hours (per user)

---

### GET /api/roadmap/:roadmap_id
- Auth required: yes
- Headers: `Authorization: Bearer {token}`
- Request body: none
- URL params:
  - `roadmap_id` (string, required) — the roadmap UUID
- Success response (200):
  ```json
  {
    "roadmap_id": "uuid",
    "role_name": "Growth PM",
    "role_id": "uuid",
    "status": "active" | "completed",
    "stages": [
      {
        "stage_number": 1,
        "name": "Master Metrics & Analytics",
        "duration": "1–2 weeks",
        "status": "not_started" | "complete",
        "goal": "Close the gap in...",
        "resources": [
          { "title": "Resource Name", "type": "Article", "url": "https://..." }
        ],
        "practice": "Find a real-world scenario...",
        "checkpoint": "Can you explain..."
      }
    ]
  }
  ```
- Error responses:
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — roadmap belongs to a different user
  - `404 ROADMAP_NOT_FOUND` — roadmap not found
  - `500 DB_ERROR` — database error

---

### PATCH /api/roadmap/:roadmap_id/stage
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- URL params:
  - `roadmap_id` (string, required) — the roadmap UUID
- Request body:
  - `stage_number` (number, required) — the stage to mark as complete
- Success response (200):
  ```json
  { "stage_number": 1, "status": "complete" }
  ```
- Error responses:
  - `400 VALIDATION_ERROR` — stage_number missing or not a number
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — roadmap belongs to a different user
  - `404 ROADMAP_NOT_FOUND` — roadmap not found
  - `404 STAGE_NOT_FOUND` — stage number doesn't exist
  - `500 DB_ERROR` — database error

---

## Coach

### POST /api/coach/session
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Request body:
  - `pm_role_id` (string, required) — UUID or name of the PM role archetype
  - `mode` (string, required) — one of: `"case_study"`, `"product_decision"`, `"feature_brief"`
  - `input_method` (string, optional) — `"type"` (default) or `"voice"`
- Success response (201):
  ```json
  { "session_id": "uuid" }
  ```
- Error responses:
  - `400 VALIDATION_ERROR` — pm_role_id or mode missing, or invalid mode value
  - `401 UNAUTHORIZED` — missing or invalid token
  - `404 ROLE_NOT_FOUND` — PM role not found
  - `500 DB_ERROR` — database error
- Rate limit: 10 requests per 24 hours (per user)

---

### POST /api/coach/session/:id/turn
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- URL params:
  - `id` (string, required) — the coaching session UUID
- Request body:
  - `content` (string, required) — user's message, minimum 50 characters
- Success response (200):
  ```json
  {
    "turn_number": 1,
    "turns_remaining": 9,
    "feedback": {
      "did_well": [
        { "point": "What the user did well", "reference": "Direct quote..." }
      ],
      "broke_down": [
        { "point": "Where thinking broke down", "why_it_matters": "Why...", "reference": "..." }
      ],
      "next_time": ["Specific advice..."]
    }
  }
  ```
- Error responses:
  - `400 VALIDATION_ERROR` — content missing, not a string, or under 50 characters
  - `400 SESSION_ENDED` — session is no longer active
  - `400 MAX_TURNS_EXCEEDED` — 10-turn limit reached
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — session belongs to a different user
  - `404 SESSION_NOT_FOUND` — session not found
  - `500 DB_ERROR` — database error
- Rate limit: 50 requests per 24 hours (per user)

---

### GET /api/coach/session/:id
- Auth required: yes
- Headers: `Authorization: Bearer {token}`
- URL params:
  - `id` (string, required) — the coaching session UUID
- Request body: none
- Success response (200):
  ```json
  {
    "session_id": "uuid",
    "title": "Session title...",
    "mode": "case_study",
    "role": "Growth PM",
    "input_method": "type",
    "turns_used": 3,
    "turns_remaining": 7,
    "status": "active" | "completed",
    "messages": [
      { "id": "u_1", "role": "user", "content": "User message..." },
      { "id": "c_1", "role": "coach", "feedback": { "did_well": [], "broke_down": [], "next_time": [] } }
    ],
    "summary": null | {
      "strength": "...",
      "gap": "...",
      "practice": "..."
    }
  }
  ```
- Error responses:
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — session belongs to a different user
  - `404 SESSION_NOT_FOUND` — session not found

---

### POST /api/coach/session/:id/end
- Auth required: yes
- Headers: `Authorization: Bearer {token}`
- URL params:
  - `id` (string, required) — the coaching session UUID
- Request body: none
- Success response (200):
  ```json
  {
    "strength": "You showed strong analytical thinking...",
    "gap": "Consider going deeper into...",
    "practice": "Pick a real product..."
  }
  ```
- Error responses:
  - `400 ALREADY_ENDED` — session already completed
  - `401 UNAUTHORIZED` — missing or invalid token
  - `403 FORBIDDEN` — session belongs to a different user
  - `404 SESSION_NOT_FOUND` — session not found
  - `500 DB_ERROR` — database error

---

### GET /api/coach/history
- Auth required: yes
- Headers: `Authorization: Bearer {token}`
- Request body: none
- Success response (200):
  ```json
  [
    {
      "id": "uuid",
      "title": "Session title...",
      "mode": "Case Study",
      "role": "Growth PM",
      "date": "2026-03-20",
      "main_gap": "Quantitative depth"
    }
  ]
  ```
  Returns up to 20 most recent completed sessions, ordered newest first.
- Error responses:
  - `401 UNAUTHORIZED` — missing or invalid token
  - `500 DB_ERROR` — database error

---

### POST /api/coach/transcribe
- Auth required: yes
- Headers: `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`
- Request body (multipart):
  - `audio` (file, required) — audio file, max 10MB, must have `audio/*` mimetype
- Success response: `501 NOT_IMPLEMENTED` (audio transcription not yet configured)
- Error responses:
  - `400 VALIDATION_ERROR` — no audio file attached
  - `401 UNAUTHORIZED` — missing or invalid token
  - `501 NOT_IMPLEMENTED` — transcription service not configured
- Rate limit: 20 requests per 24 hours (per user)
