import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DbTestSession, TestResult } from '../lib/supabase';

interface UseSessionsReturn {
  sessions: DbTestSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  startSession: (testId: string, telegramId: number) => Promise<DbTestSession | null>;
  saveProgress: (sessionId: string, answers: Record<string, unknown>) => Promise<void>;
  completeSession: (
    sessionId: string,
    answers: Record<string, unknown>,
    result: TestResult,
  ) => Promise<DbTestSession | null>;
  getSessionsByTest: (testId: string) => DbTestSession[];
  getCompletedCount: () => number;
  hasCompletedTest: (testId: string) => boolean;
  getLatestSession: (testId: string) => DbTestSession | undefined;
}

export function useSessions(telegramId: number | undefined): UseSessionsReturn {
  const [sessions, setSessions] = useState<DbTestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!telegramId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('test_sessions')
        .select(`
          *,
          tests (id, slug, title, category, estimated_minutes)
        `)
        .eq('user_telegram_id', telegramId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSessions((data || []) as DbTestSession[]);
    } catch (err) {
      console.error('useSessions error:', err);
      setError('Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = async (testId: string, tgId: number): Promise<DbTestSession | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('test_sessions')
        .insert({
          user_telegram_id: tgId,
          test_id: testId,
          answers: {},
          is_completed: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data as DbTestSession;
    } catch (err) {
      console.error('startSession error:', err);
      return null;
    }
  };

  const saveProgress = async (
    sessionId: string,
    answers: Record<string, unknown>,
  ): Promise<void> => {
    try {
      await supabase.from('test_sessions').update({ answers }).eq('id', sessionId);
    } catch (err) {
      console.error('saveProgress error:', err);
    }
  };

  const completeSession = async (
    sessionId: string,
    answers: Record<string, unknown>,
    result: TestResult,
  ): Promise<DbTestSession | null> => {
    try {
      const { data, error: updateError } = await supabase
        .from('test_sessions')
        .update({
          answers,
          result,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Refresh sessions list
      await fetchSessions();
      return data as DbTestSession;
    } catch (err) {
      console.error('completeSession error:', err);
      return null;
    }
  };

  const getSessionsByTest = (testId: string) =>
    sessions.filter((s) => s.test_id === testId);

  const getCompletedCount = () => {
    const uniqueTestIds = new Set(sessions.map((s) => s.test_id));
    return uniqueTestIds.size;
  };

  const hasCompletedTest = (testId: string) =>
    sessions.some((s) => s.test_id === testId && s.is_completed);

  const getLatestSession = (testId: string) =>
    sessions.find((s) => s.test_id === testId && s.is_completed);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    startSession,
    saveProgress,
    completeSession,
    getSessionsByTest,
    getCompletedCount,
    hasCompletedTest,
    getLatestSession,
  };
}
