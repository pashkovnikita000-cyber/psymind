import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://murqfqctsmvqzoytlbpk.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_8TXUkO_T7qh_aQTTec9lbg_HL2pPyJL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching our DB schema
export interface DbUser {
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  language_code: string;
  created_at: string;
}

export interface DbTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'personality' | 'emotion' | 'temperament' | 'cognitive';
  estimated_minutes: number;
  questions: Question[];
  scoring: ScoringConfig;
  result_types: Record<string, unknown>;
  created_at: string;
}

export interface DbTestSession {
  id: string;
  user_telegram_id: number;
  test_id: string;
  started_at: string;
  completed_at: string | null;
  answers: Record<string, unknown>;
  result: TestResult | null;
  is_completed: boolean;
  tests?: Partial<DbTest>;
}

export interface DbAiAnalysis {
  id: string;
  user_telegram_id: number;
  analysis_text: string;
  portrait_traits: string[];
  created_at: string;
  session_ids: string[];
}

export interface Question {
  id: number;
  text: string;
  type: 'bipolar' | 'scale' | 'yesno' | 'multichoice' | 'pair' | 'color_sort' | 'distribute10' | 'scale4';
  dimension?: string;
  factor?: string;
  scale?: string;
  section?: number;
  section_title?: string;
  round?: number;
  reverse?: boolean;
  key?: string;
  role?: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  text: string;
  value: string | number;
  role?: string;
  letter?: string;
  id?: string;
  hex?: string;
  name?: string;
}

export interface ScoringConfig {
  formula: string;
  [key: string]: unknown;
}

export interface TestResult {
  label?: string;
  type?: string;
  name?: string;
  scores?: Record<string, number>;
  description?: string;
  level?: string;
  [key: string]: unknown;
}
