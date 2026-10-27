import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { telegram_id } = await req.json();

    if (!telegram_id) {
      return new Response(JSON.stringify({ error: 'telegram_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch all completed sessions for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_sessions')
      .select(`
        id,
        completed_at,
        result,
        tests (slug, title, category)
      `)
      .eq('user_telegram_id', telegram_id)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    if (!sessions || sessions.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Need at least 2 completed tests for analysis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const sessionIds = sessions.map((s) => s.id);

    // Check if we already have a cached analysis for exactly these sessions
    const { data: existingAnalysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('user_telegram_id', telegram_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingAnalysis) {
      const existingIds = [...existingAnalysis.session_ids].sort();
      const currentIds = [...sessionIds].sort();
      if (JSON.stringify(existingIds) === JSON.stringify(currentIds)) {
        return new Response(JSON.stringify({ analysis: existingAnalysis }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch user info
    const { data: user } = await supabase
      .from('users')
      .select('first_name')
      .eq('telegram_id', telegram_id)
      .single();

    // Prepare results summary for Claude
    const resultsSummary = sessions
      .map((s) => {
        const test = s.tests as { slug: string; title: string; category: string };
        return `Тест: ${test?.title} (категория: ${test?.category})\nРезультат: ${JSON.stringify(s.result)}`;
      })
      .join('\n\n');

    const prompt = `Ты опытный психолог-диагност. Проанализируй результаты психологических тестов пользователя ${user?.first_name || 'пользователя'} и составь психологический портрет.

РЕЗУЛЬТАТЫ ТЕСТОВ:
${resultsSummary}

ЗАДАЧА:
1. Найди общие паттерны и согласования между результатами разных тестов
2. Выяви возможные противоречия между тестами и дай им объяснение
3. Составь целостный психологический портрет в 4-5 абзацах
4. Выдели 5-7 ключевых черт личности

ФОРМАТ ОТВЕТА (строго JSON):
{
  "analysis_text": "Полный психологический портрет в 4-5 абзацах, написанный тепло и профессионально, без жаргона. Каждый абзац на новой строке.",
  "portrait_traits": ["черта 1", "черта 2", "черта 3", "черта 4", "черта 5"]
}

Отвечай только JSON, без markdown-блоков, без пояснений.`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const anthropicData = await anthropicResponse.json();
    const rawContent = anthropicData.content[0].text;

    let parsed: { analysis_text: string; portrait_traits: string[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        analysis_text: rawContent,
        portrait_traits: [],
      };
    }

    // Save to database
    const { data: newAnalysis, error: insertError } = await supabase
      .from('ai_analyses')
      .upsert(
        {
          user_telegram_id: telegram_id,
          analysis_text: parsed.analysis_text,
          portrait_traits: parsed.portrait_traits,
          session_ids: sessionIds,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_telegram_id' },
      )
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ analysis: newAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-analysis function:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
