import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ChevronRight } from 'lucide-react';
import type { DbTest, DbTestSession } from '../lib/supabase';
import { haptic } from '../lib/telegram';

interface TestCardProps {
  test: DbTest;
  session?: DbTestSession | null;
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  personality: '#6C63FF',
  emotion: '#f59e0b',
  temperament: '#22c55e',
  cognitive: '#3b82f6',
};

const categoryLabels: Record<string, string> = {
  personality: 'Личность',
  emotion: 'Эмоции',
  temperament: 'Темперамент',
  cognitive: 'Когнитивный',
};

export const TestCard: React.FC<TestCardProps> = ({ test, session, compact = false }) => {
  const navigate = useNavigate();
  const isCompleted = !!session?.is_completed;
  const accentColor = categoryColors[test.category] || '#6C63FF';

  const handleClick = () => {
    haptic.light();
    navigate(`/test/${test.id}`);
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-opacity active:opacity-70"
        style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: accentColor }}
        >
          {test.title.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{test.title}</p>
          {session?.result && (
            <p className="text-xs text-hint truncate">
              {String((session.result as Record<string, unknown>).label || 'Пройден')}
            </p>
          )}
        </div>
        {isCompleted && <CheckCircle size={16} color="#22c55e" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-opacity active:opacity-75"
      style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
    >
      {/* Color accent strip */}
      <div className="h-1.5" style={{ backgroundColor: accentColor }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: accentColor }}
              >
                {categoryLabels[test.category] || test.category}
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                  <CheckCircle size={12} />
                  Пройден
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base leading-tight">{test.title}</h3>
          </div>
          <ChevronRight size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }} />
        </div>

        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--tg-theme-hint-color)' }}>
          {test.description.length > 80 ? test.description.substring(0, 80) + '...' : test.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
            <Clock size={12} />
            <span>{test.estimated_minutes} мин</span>
            <span className="mx-1">·</span>
            <span>{test.questions.length} вопросов</span>
          </div>

          {isCompleted && session?.completed_at && (
            <span className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
              {new Date(session.completed_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
