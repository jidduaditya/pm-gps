# PM-GPS Iteration 2 — Database Schema

**Run this in Supabase SQL Editor** (Dashboard → SQL Editor → New query → paste → Run)

> Prerequisite: `create_tables.sql` must already be applied (tables `users` and `pm_role_archetypes` must exist).

---

## Step 1: Create all tables, indexes, and RLS policies

Paste the entire block below into a single SQL Editor query and hit **Run**.

```sql
-- ============================================================
-- PM-GPS Iteration 2 Schema: Quiz, Roadmap, Coach
-- Run in Supabase SQL Editor AFTER create_tables.sql
-- Depends on: users, pm_role_archetypes
-- ============================================================

-- --------------------------------------------------------
-- 1. quiz_questions — MCQ questions per PM role
-- --------------------------------------------------------
CREATE TABLE quiz_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_role_id      UUID NOT NULL REFERENCES pm_role_archetypes(id) ON DELETE CASCADE,
  topic           TEXT NOT NULL,
  question_number INT NOT NULL,
  question_text   TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',
  correct_answer  VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_pm_role_id ON quiz_questions(pm_role_id);
CREATE UNIQUE INDEX idx_quiz_questions_role_number ON quiz_questions(pm_role_id, question_number);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_questions_select" ON quiz_questions
  FOR SELECT TO authenticated USING (true);


-- --------------------------------------------------------
-- 2. quiz_sessions — user quiz attempts and scores
-- --------------------------------------------------------
CREATE TABLE quiz_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pm_role_id      UUID NOT NULL REFERENCES pm_role_archetypes(id),
  answers         JSONB NOT NULL DEFAULT '{}',
  score           INT,
  topic_scores    JSONB NOT NULL DEFAULT '[]',
  strengths       JSONB NOT NULL DEFAULT '[]',
  weaknesses      JSONB NOT NULL DEFAULT '[]',
  status          VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_pm_role_id ON quiz_sessions(pm_role_id);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_sessions_select" ON quiz_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "quiz_sessions_insert" ON quiz_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_sessions_update" ON quiz_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- --------------------------------------------------------
-- 3. roadmaps — generated learning roadmaps per user
-- --------------------------------------------------------
CREATE TABLE roadmaps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_session_id  UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  pm_role_id       UUID NOT NULL REFERENCES pm_role_archetypes(id),
  role_name        TEXT NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_quiz_session_id ON roadmaps(quiz_session_id);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmaps_select" ON roadmaps
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "roadmaps_insert" ON roadmaps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "roadmaps_update" ON roadmaps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- --------------------------------------------------------
-- 4a. roadmap_stages — individual stages within a roadmap
-- --------------------------------------------------------
CREATE TABLE roadmap_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id      UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  stage_number    INT NOT NULL,
  name            TEXT NOT NULL,
  duration        TEXT,
  goal            TEXT,
  practice        TEXT,
  checkpoint      TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','complete')),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_stages_roadmap_id ON roadmap_stages(roadmap_id);
CREATE UNIQUE INDEX idx_roadmap_stages_number ON roadmap_stages(roadmap_id, stage_number);

ALTER TABLE roadmap_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_stages_select" ON roadmap_stages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM roadmaps WHERE roadmaps.id = roadmap_stages.roadmap_id AND roadmaps.user_id = auth.uid()
  ));

CREATE POLICY "roadmap_stages_insert" ON roadmap_stages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM roadmaps WHERE roadmaps.id = roadmap_stages.roadmap_id AND roadmaps.user_id = auth.uid()
  ));

CREATE POLICY "roadmap_stages_update" ON roadmap_stages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM roadmaps WHERE roadmaps.id = roadmap_stages.roadmap_id AND roadmaps.user_id = auth.uid()
  ));


-- --------------------------------------------------------
-- 4b. roadmap_resources — verified learning resources per stage
-- --------------------------------------------------------
CREATE TABLE roadmap_resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id        UUID NOT NULL REFERENCES roadmap_stages(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('Article','Book','Framework','Course','Video')),
  url             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmap_resources_stage_id ON roadmap_resources(stage_id);

ALTER TABLE roadmap_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_resources_select" ON roadmap_resources
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM roadmap_stages
    JOIN roadmaps ON roadmaps.id = roadmap_stages.roadmap_id
    WHERE roadmap_stages.id = roadmap_resources.stage_id AND roadmaps.user_id = auth.uid()
  ));

CREATE POLICY "roadmap_resources_insert" ON roadmap_resources
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM roadmap_stages
    JOIN roadmaps ON roadmaps.id = roadmap_stages.roadmap_id
    WHERE roadmap_stages.id = roadmap_resources.stage_id AND roadmaps.user_id = auth.uid()
  ));


-- --------------------------------------------------------
-- 5a. coach_sessions — coaching conversation sessions
-- --------------------------------------------------------
CREATE TABLE coach_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pm_role_id        UUID NOT NULL REFERENCES pm_role_archetypes(id),
  mode              VARCHAR(30) NOT NULL CHECK (mode IN ('case_study','product_decision','feature_brief')),
  input_method      VARCHAR(10) CHECK (input_method IN ('type','voice')),
  title             TEXT,
  turns_used        INT NOT NULL DEFAULT 0,
  max_turns         INT NOT NULL DEFAULT 5,
  status            VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  main_gap          TEXT,
  strength_summary  TEXT,
  gap_summary       TEXT,
  practice_summary  TEXT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coach_sessions_user_id ON coach_sessions(user_id);
CREATE INDEX idx_coach_sessions_created_at ON coach_sessions(created_at DESC);

ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_sessions_select" ON coach_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "coach_sessions_insert" ON coach_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_sessions_update" ON coach_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- --------------------------------------------------------
-- 5b. coach_turns — individual turns within a coaching session
-- --------------------------------------------------------
CREATE TABLE coach_turns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_session_id  UUID NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  turn_number       INT NOT NULL,
  user_message      TEXT NOT NULL,
  coach_feedback    JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coach_turns_session_id ON coach_turns(coach_session_id);
CREATE UNIQUE INDEX idx_coach_turns_number ON coach_turns(coach_session_id, turn_number);

ALTER TABLE coach_turns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_turns_select" ON coach_turns
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_sessions WHERE coach_sessions.id = coach_turns.coach_session_id AND coach_sessions.user_id = auth.uid()
  ));

CREATE POLICY "coach_turns_insert" ON coach_turns
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM coach_sessions WHERE coach_sessions.id = coach_turns.coach_session_id AND coach_sessions.user_id = auth.uid()
  ));
```

---

## Step 2: Verify

After running, paste this to confirm all 7 tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'quiz_questions','quiz_sessions',
    'roadmaps','roadmap_stages','roadmap_resources',
    'coach_sessions','coach_turns'
  )
ORDER BY table_name;
```

Expected output: 7 rows.

---

## Step 3: Verify RLS is enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'quiz_questions','quiz_sessions',
    'roadmaps','roadmap_stages','roadmap_resources',
    'coach_sessions','coach_turns'
  )
ORDER BY tablename;
```

All rows should show `rowsecurity = true`.

---

## Quick reference: foreign key chain

```
users
 ├── quiz_sessions.user_id
 ├── roadmaps.user_id
 └── coach_sessions.user_id

pm_role_archetypes
 ├── quiz_questions.pm_role_id
 ├── quiz_sessions.pm_role_id
 ├── roadmaps.pm_role_id
 └── coach_sessions.pm_role_id

quiz_sessions
 └── roadmaps.quiz_session_id

roadmaps
 └── roadmap_stages.roadmap_id
      └── roadmap_resources.stage_id

coach_sessions
 └── coach_turns.coach_session_id
```
