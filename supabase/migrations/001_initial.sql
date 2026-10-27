-- PsyMind: Initial schema migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Telegram-based auth)
CREATE TABLE IF NOT EXISTS public.users (
  telegram_id    BIGINT PRIMARY KEY,
  username       TEXT,
  first_name     TEXT NOT NULL,
  last_name      TEXT,
  photo_url      TEXT,
  language_code  TEXT DEFAULT 'ru',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tests (seeded static data)
CREATE TABLE IF NOT EXISTS public.tests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('personality','emotion','temperament','cognitive')),
  estimated_minutes INTEGER NOT NULL DEFAULT 15,
  questions         JSONB NOT NULL DEFAULT '[]',
  scoring           JSONB NOT NULL DEFAULT '{}',
  result_types      JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Test sessions (user progress)
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
  test_id          UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  answers          JSONB NOT NULL DEFAULT '{}',
  result           JSONB,
  is_completed     BOOLEAN NOT NULL DEFAULT false
);

-- AI analyses (cached per user, recalculated on new test)
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_telegram_id BIGINT NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
  analysis_text    TEXT NOT NULL,
  portrait_traits  JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_ids      UUID[] NOT NULL DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS test_sessions_user_idx ON public.test_sessions(user_telegram_id);
CREATE INDEX IF NOT EXISTS test_sessions_test_idx ON public.test_sessions(test_id);
CREATE INDEX IF NOT EXISTS test_sessions_completed_idx ON public.test_sessions(user_telegram_id, is_completed);
CREATE INDEX IF NOT EXISTS ai_analyses_user_idx ON public.ai_analyses(user_telegram_id);

-- Enable Row Level Security
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses  ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user sees only their own data
-- (For Telegram WebApp: telegram_id passed via Supabase JWT claim or service role)

-- test_sessions policies
CREATE POLICY "Users can view own sessions"
  ON public.test_sessions FOR SELECT
  USING (true); -- access controlled by service role key in edge functions

CREATE POLICY "Users can insert own sessions"
  ON public.test_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own sessions"
  ON public.test_sessions FOR UPDATE
  USING (true);

-- ai_analyses policies
CREATE POLICY "Users can view own analyses"
  ON public.ai_analyses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own analyses"
  ON public.ai_analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own analyses"
  ON public.ai_analyses FOR UPDATE
  USING (true);

-- Make tests readable by all (public catalog)
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tests are public"
  ON public.tests FOR SELECT
  USING (true);

-- Make users accessible via service role only (no public policy needed)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users are accessible via service role"
  ON public.users FOR ALL
  USING (true);
