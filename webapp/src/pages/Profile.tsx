import React, { useEffect, useState } from 'react';
import { User, Calendar, BarChart2, Sparkles, RefreshCw } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useSessions } from '../hooks/useSessions';
import { requestAiAnalysis, getLatestAnalysis } from '../lib/ai';
import { haptic } from '../lib/telegram';
import type { DbAiAnalysis } from '../lib/supabase';

export const Profile: React.FC = () => {
  const { user, telegramUser } = useUser();
  const { sessions, getCompletedCount } = useSessions(user?.telegram_id);
  const [analysis, setAnalysis] = useState<DbAiAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const completedCount = getCompletedCount();

  useEffect(() => {
    if (user?.telegram_id) {
      getLatestAnalysis(user.telegram_id).then(setAnalysis);
    }
  }, [user?.telegram_id, sessions.length]);

  const handleRefreshAnalysis = async () => {
    if (!user || loadingAnalysis) return;
    haptic.medium();
    setLoadingAnalysis(true);
    try {
      const result = await requestAiAnalysis(user.telegram_id);
      if (result) setAnalysis(result);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const displayName = [telegramUser?.first_name, telegramUser?.last_name]
    .filter(Boolean)
    .join(' ') || user?.first_name || 'Пользователь';

  const registeredDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="page-scroll pb-20">
      <div className="px-4 pt-6">
        {/* Avatar & name */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-20 h-20 rounded-full mb-3 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: 'rgba(108,99,255,0.12)' }}
          >
            {telegramUser?.photo_url ? (
              <img
                src={telegramUser.photo_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={36} color="var(--psymind-accent)" />
            )}
          </div>
          <h1 className="text-xl font-bold">{displayName}</h1>
          {telegramUser?.username && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
              @{telegramUser.username}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <BarChart2 size={20} className="mx-auto mb-1" style={{ color: 'var(--psymind-accent)' }} />
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>тестов пройдено</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <Calendar size={20} className="mx-auto mb-1" style={{ color: 'var(--psymind-accent)' }} />
            <p className="text-sm font-semibold mt-1">{registeredDate}</p>
            <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>дата регистрации</p>
          </div>
        </div>

        {/* Traits */}
        {analysis && analysis.portrait_traits.length > 0 && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <h2 className="font-semibold mb-3">Черты характера</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.portrait_traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: 'rgba(108,99,255,0.12)', color: 'var(--psymind-accent)' }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} color="var(--psymind-accent)" />
              <h2 className="font-semibold">AI Психологический портрет</h2>
            </div>
            {completedCount >= 2 && (
              <button
                onClick={handleRefreshAnalysis}
                className="p-1.5 rounded-lg transition-opacity"
                style={{ backgroundColor: 'rgba(108,99,255,0.1)' }}
                disabled={loadingAnalysis}
              >
                <RefreshCw
                  size={14}
                  color="var(--psymind-accent)"
                  className={loadingAnalysis ? 'animate-spin' : ''}
                />
              </button>
            )}
          </div>

          {loadingAnalysis ? (
            <div className="flex items-center gap-2 py-2">
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: 'var(--psymind-accent)', borderTopColor: 'transparent' }}
              />
              <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Анализируем результаты...
              </p>
            </div>
          ) : analysis ? (
            <div>
              {analysis.analysis_text.split('\n').map(
                (paragraph, idx) =>
                  paragraph.trim() && (
                    <p key={idx} className="text-sm leading-relaxed mb-3" style={{ color: 'var(--tg-theme-text-color)' }}>
                      {paragraph.trim()}
                    </p>
                  ),
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Обновлено:{' '}
                {new Date(analysis.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          ) : completedCount >= 2 ? (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--tg-theme-hint-color)' }}>
                AI-анализ ещё не готов. Нажмите кнопку обновления, чтобы запустить.
              </p>
              <button onClick={handleRefreshAnalysis} className="btn-primary" disabled={loadingAnalysis}>
                Создать портрет
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Для AI-анализа необходимо пройти минимум 2 теста. Пройдено: {completedCount} из 2.
            </p>
          )}
        </div>

        {/* Test sessions summary */}
        {sessions.length > 0 && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <h2 className="font-semibold mb-3">Последние прохождения</h2>
            {sessions.slice(0, 5).map((session) => {
              const test = session.tests;
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-2 py-2 border-b last:border-0"
                  style={{ borderColor: 'rgba(0,0,0,0.05)' }}
                >
                  <span className="text-sm flex-1 truncate">{test?.title || 'Тест'}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--tg-theme-hint-color)' }}>
                    {session.completed_at
                      ? new Date(session.completed_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
