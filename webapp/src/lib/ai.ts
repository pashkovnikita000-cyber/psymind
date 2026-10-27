import { supabase } from './supabase';
import type { DbAiAnalysis } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export async function requestAiAnalysis(telegramId: number): Promise<DbAiAnalysis | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ telegram_id: telegramId }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('AI analysis error:', err);
      return null;
    }

    const data = await response.json();
    return data.analysis as DbAiAnalysis;
  } catch (error) {
    console.error('Failed to request AI analysis:', error);
    return null;
  }
}

export async function getLatestAnalysis(telegramId: number): Promise<DbAiAnalysis | null> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('user_telegram_id', telegramId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as DbAiAnalysis;
}
