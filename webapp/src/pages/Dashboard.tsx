import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, Sparkles } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useTests } from '../hooks/useTests';
import { useSessions } from '../hooks/useSessions';
import { TestCard } from '../components/TestCard';
import { getLatestAnalysis } from '../lib/ai';
import { haptic } from '../lib/telegram';
import type { DbAiAnalysis } from '../lib/supabase';

const TOTAL_TESTS = 10;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, telegramUser } = useUser();
  const { tests } = useTests();
  const { sessions, getCompletedCount, getLatestSession } = useSessions(user?.telegram_id);
  const [analysis, setAnalysis] = useState<DbAiAnalysis | null>(null);

  const completedCount = getCompletedCount();
  const progressPct = Math.round((completedCount / TOTAL_TESTS) * 100);

  useEffect(() => {
    if (user?.telegram_id) {
      getLatestAnalysis(user.telegram_id).then(setAnalysis);
    }
  }, [user?.telegram_id, sessions.length]);

  const recentSessions = sessions.slice(0, 3);

  const firstName = telegramUser?.first_name || user?.first_name || 'Пользователь';

  // SVG ring
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (progressPct / 100) * circumference;

  return (
    <div className="page-scroll pb-20">
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Привет, {firstName}! 👋</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Познай себя глубже
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(108,99,255,0.12)' }}
          >
            <Brain size={24} color="var(--psymind-accent)" />
          </div>
        </div>

        {/* Progress card */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-4"
          style={{ backgroundColor: 'var(--psymind-accent)' }}
        >
          <div className="flex-shrink-0 relative w-16 h-16">
            <svg width="64" height="64" className="progress-ring">
              <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r={r}
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{completedCount}</span>
            </div>
          </div>
          <div className="flex-1 text-white">
            <p className="font-semibold">Пройдено тестов</p>
            <p className="text-sm opacity-80">
              {completedCount} из {TOTAL_TESTS} · {progressPct}%
            </p>
          </div>
          <button
            onClick={() => {
              haptic.medium();
              navigate('/catalog');
            }}
            className="flex-shrink-0 bg-white/20 rounded-xl px-3 py-2 text-white text-sm font-semibold"
          >
            Пройти
          </button>
        </div>

        {/* AI Portrait */}
        {analysis ? (
          <div
            className="rounded-2xl p-4 mb-4 cursor-pointer active:opacity-75 transition-opacity"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
            onClick={() => {
              haptic.light();
              navigate('/profile');
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} color="var(--psymind-accent)" />
              <span className="font-semibold text-sm">AI Психологический портрет</span>
              <ChevronRight size={14} className="ml-auto" style={{ color: 'var(--tg-theme-hint-color)' }} />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--tg-theme-hint-color)' }}>
              {analysis.analysis_text.substring(0, 120)}...
            </p>
            {analysis.portrait_traits.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.portrait_traits.slice(0, 4).map((trait) => (
                  <span
                    key={trait}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(108,99,255,0.12)', color: 'var(--psymind-accent)' }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : completedCount >= 2 ? (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} color="var(--psymind-accent)" />
              <span className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
                AI анализирует ваши результаты...
              </span>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} color="var(--psymind-accent)" />
              <span className="font-semibold text-sm">AI Психологический портрет</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Пройдите 2 теста, чтобы получить AI-анализ
            </p>
          </div>
        )}

        {/* Recent tests */}
        {recentSessions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Последние тесты</h2>
              <button
                onClick={() => {
                  haptic.light();
                  navigate('/history');
                }}
                className="text-sm"
                style={{ color: 'var(--psymind-accent)' }}
              >
                Все
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recentSessions.map((session) => {
                const test = tests.find((t) => t.id === session.test_id);
                if (!test) return null;
                const latest = getLatestSession(test.id);
                return (
                  <TestCard key={session.id} test={test} session={latest} compact />
                );
              })}
            </div>
          </div>
        )}

        {/* CTA if no tests */}
        {completedCount === 0 && (
          <div className="text-center py-6">
            <p className="text-base font-medium mb-2">Ещё нет пройденных тестов</p>
            <p className="text-sm mb-4" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Начни своё психологическое путешествие
            </p>
            <button
              onClick={() => {
                haptic.medium();
                navigate('/catalog');
              }}
              className="btn-primary"
            >
              Начать первый тест
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
