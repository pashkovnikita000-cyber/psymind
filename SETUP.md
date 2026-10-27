# PsyMind — Руководство по развёртыванию

## Предварительные требования

- Node.js 18+
- Supabase CLI (`npm i -g supabase`)
- Vercel CLI (`npm i -g vercel`)
- Аккаунт Supabase: https://supabase.com
- Аккаунт Vercel: https://vercel.com
- Telegram Bot Token (получен через @BotFather)

## 1. База данных Supabase

### 1.1 Применить миграцию

```bash
# Войти в Supabase
supabase login

# Линковать проект (projectRef берётся из URL: murqfqctsmvqzoytlbpk)
supabase link --project-ref murqfqctsmvqzoytlbpk

# Применить миграцию
supabase db push
# ИЛИ вручную в Supabase Dashboard → SQL Editor:
# Скопировать содержимое supabase/migrations/001_initial.sql и выполнить
```

### 1.2 Заполнить тестами

```bash
# В Supabase Dashboard → SQL Editor:
# Скопировать содержимое supabase/seed.sql и выполнить
```

### 1.3 Задеплоить Edge Function

```bash
# Установить ANTHROPIC_API_KEY в Supabase secrets:
supabase secrets set ANTHROPIC_API_KEY=ваш_ключ

# Деплой функции:
supabase functions deploy ai-analysis
```

## 2. Веб-приложение (Webapp)

### 2.1 Установить зависимости

```bash
cd webapp
npm install
```

### 2.2 Настроить переменные окружения

Файл `webapp/.env` уже содержит credentials. При деплое на Vercel добавить те же переменные.

### 2.3 Деплой на Vercel

```bash
cd webapp
vercel --prod
```

При запросе — выбрать Vite preset.

Vercel настройки:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 2.4 Переменные окружения на Vercel

Добавить в Vercel Dashboard → Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://murqfqctsmvqzoytlbpk.supabase.co
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
VITE_APP_URL=https://ваш-домен.vercel.app
```

## 3. Telegram Bot

### 3.1 Установить зависимости

```bash
cd bot
npm install
```

### 3.2 Настроить переменные окружения

Файл `bot/.env` уже содержит credentials. Обновить `WEBAPP_URL` на реальный URL после деплоя webapp.

### 3.3 Деплой на Vercel

```bash
cd bot
vercel --prod
```

Vercel настройки для bot:
- Framework: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3.4 Переменные окружения бота на Vercel

```
TELEGRAM_BOT_TOKEN=<your_telegram_bot_token>
SUPABASE_URL=https://murqfqctsmvqzoytlbpk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
WEBAPP_URL=https://psymind.vercel.app
```

### 3.5 Установить Webhook

После деплоя бота на Vercel (URL = https://psymind-bot.vercel.app):

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://psymind-bot.vercel.app/webhook"}'
```

## 4. Настройка Telegram Bot

### 4.1 Установить кнопку Menu (опционально)

Через @BotFather:
```
/setmenubutton
@psymind_bot
ваш-webapp-url
```

### 4.2 Команды бота

Через @BotFather → /setcommands:
```
start - Открыть PsyMind
results - Последние результаты
help - Помощь
```

## 5. Проверка работы

1. Открыть бота в Telegram
2. Отправить /start — должна появиться кнопка «Открыть PsyMind»
3. Нажать кнопку — должно открыться веб-приложение
4. Пройти тест — результаты сохраняются в Supabase
5. После 2 тестов — запрашивается AI-анализ

## Структура проекта

```
psymind/
├── supabase/
│   ├── migrations/001_initial.sql   # Структура БД
│   ├── seed.sql                      # Данные тестов
│   └── functions/ai-analysis/       # Edge Function для AI
│       └── index.ts
├── bot/                              # Grammy Telegram bot
│   ├── src/index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json
│   └── .env
├── webapp/                           # React Vite приложение
│   ├── src/
│   │   ├── lib/          # supabase, telegram, scoring, ai
│   │   ├── hooks/        # useUser, useTests, useSessions
│   │   ├── pages/        # Dashboard, TestCatalog, TestRunner, TestResult, History, Profile
│   │   ├── components/   # BottomNav, TestCard, QuestionStep, ResultChart
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
└── SETUP.md
```
