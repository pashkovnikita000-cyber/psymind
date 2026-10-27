import { Bot, webhookCallback, InlineKeyboard } from 'grammy';
import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

// Environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://psymind.vercel.app';

const bot = new Bot(BOT_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// /start command — sends WebApp button
bot.command('start', async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  // Upsert user in database
  await supabase.from('users').upsert(
    {
      telegram_id: user.id,
      username: user.username ?? null,
      first_name: user.first_name,
      last_name: user.last_name ?? null,
      language_code: user.language_code ?? 'ru',
    },
    { onConflict: 'telegram_id' },
  );

  const keyboard = new InlineKeyboard().webApp('🧠 Открыть PsyMind', WEBAPP_URL);

  await ctx.reply(
    `Привет, ${user.first_name}! 👋\n\nДобро пожаловать в *PsyMind* — приложение для психологического самопознания.\n\n` +
      `Пройди научно обоснованные психологические тесты и получи AI-анализ своего психологического портрета.\n\n` +
      `✅ 10 профессиональных тестов\n` +
      `🤖 AI-анализ на основе всех результатов\n` +
      `📊 Визуализация данных\n\n` +
      `Нажми кнопку ниже, чтобы начать:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    },
  );
});

// /results command — text summary of latest results
bot.command('results', async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  const { data: sessions, error } = await supabase
    .from('test_sessions')
    .select(`
      completed_at,
      result,
      tests (title)
    `)
    .eq('user_telegram_id', user.id)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(5);

  if (error || !sessions || sessions.length === 0) {
    await ctx.reply(
      'У тебя пока нет завершённых тестов. Открой PsyMind и пройди первый тест!',
      {
        reply_markup: new InlineKeyboard().webApp('🧠 Открыть PsyMind', WEBAPP_URL),
      },
    );
    return;
  }

  let message = `📊 *Твои последние результаты:*\n\n`;

  for (const session of sessions) {
    const test = session.tests as { title: string } | null;
    const result = session.result as {
      label?: string;
      type?: string;
      name?: string;
    } | null;
    const date = session.completed_at
      ? new Date(session.completed_at).toLocaleDateString('ru-RU')
      : '—';

    const resultLabel = result?.label || result?.name || result?.type || 'Результат сохранён';

    message += `• *${test?.title || 'Тест'}* (${date})\n  ${resultLabel}\n\n`;
  }

  const { data: analysis } = await supabase
    .from('ai_analyses')
    .select('analysis_text')
    .eq('user_telegram_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (analysis) {
    const shortAnalysis = analysis.analysis_text.substring(0, 300);
    message += `\n🤖 *AI-портрет (краткое):*\n${shortAnalysis}...\n\n`;
    message += `Открой PsyMind для полного анализа.`;
  }

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: new InlineKeyboard().webApp('🧠 Открыть PsyMind', WEBAPP_URL),
  });
});

// /help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `*PsyMind — Команды:*\n\n` +
      `/start — открыть приложение\n` +
      `/results — посмотреть последние результаты\n` +
      `/help — справка\n\n` +
      `По всем вопросам: @psymind_support`,
    { parse_mode: 'Markdown' },
  );
});

// Handle unknown messages
bot.on('message', async (ctx) => {
  await ctx.reply('Используй кнопку ниже для открытия PsyMind 👇', {
    reply_markup: new InlineKeyboard().webApp('🧠 Открыть PsyMind', WEBAPP_URL),
  });
});

// Vercel serverless handler
const handleUpdate = webhookCallback(bot, 'http');

module.exports = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'POST') {
    try {
      await handleUpdate(req, res);
    } catch (err) {
      console.error('Webhook error:', err);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'PsyMind bot is running' }));
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
};
