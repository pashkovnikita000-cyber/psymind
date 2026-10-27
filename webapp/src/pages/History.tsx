import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useSessions } from '../hooks/useSessions';
import { haptic } from '../lib/telegram';
import type { TestResult } from '../lib/supabase';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { sessions, loading } = useSessions(user?.telegram_id);

  if (loading) {
    return (
      <div className="page-scroll pb-20 px-4 pt-6">
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl animate-pulse"
              style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-scroll pb-20">
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold mb-1">История</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--tg-theme-hint-color)' }}>
          {sessions.length > 0
            ? `${sessions.length} ${sessions.length === 1 ? 'прохождение' : sessions.length < 5 ? 'прохождения' : 'прохождений'}`
            : 'Пока пусто'}
        </p>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base font-medium mb-2">История пуста</p>
            <p className="text-sm mb-4" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Пройди первый тест, чтобы здесь появились результаты
            </p>
            <button
              onClick={() => {
                haptic.medium();
                navigate('/catalog');
              }}
              className="btn-primary"
            >
              Перейти к тестам
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => {
              const test = session.tests;
              const result = session.result as TestResult | null;
              const date = session.completed_at
                ? new Date(session.completed_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—';

              return (
                <button
                  key={session.id}
                  onClick={() => {
                    haptic.light();
                    navigate(`/result/${session.id}`);
                  }}
                  className="w-full text-left rounded-2xl p-4 flex items-center gap-3 active:opacity-70 transition-opacity"
                  style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--psymind-accent)' }}
                  >
                    {String(test?.title || 'T').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{test?.title || 'Тест'}</p>
                    {result && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--psymind-accent)' }}>
                        {String(result.label || result.name || result.type || '')}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      <Clock size={11} />
                      <span className="text-xs">{date}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--tg-theme-hint-color)' }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
