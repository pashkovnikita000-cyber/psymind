import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Home } from 'lucide-react';
import { ResultChart } from '../components/ResultChart';
import { haptic } from '../lib/telegram';
import type { DbTest, TestResult as TestResultType } from '../lib/supabase';
import { useTests } from '../hooks/useTests';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

interface LocationState {
  result?: TestResultType;
  test?: DbTest;
}

export const TestResult: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getTest } = useTests();

  const [result, setResult] = useState<TestResultType | null>(
    (location.state as LocationState)?.result ?? null,
  );
  const [test, setTest] = useState<DbTest | null>(
    (location.state as LocationState)?.test ?? null,
  );
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result && sessionId) {
      supabase
        .from('test_sessions')
        .select('*, tests(*)')
        .eq('id', sessionId)
        .single()
        .then(({ data }) => {
          if (data) {
            setResult(data.result as TestResultType);
            setTest(data.tests as DbTest);
          }
          setLoading(false);
        });
    }
  }, [sessionId, result]);

  if (loading) {
    return (
      <div className="page-scroll flex items-center justify-center">
        <div className="text-center p-6">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--psymind-accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--tg-theme-hint-color)' }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!result || !test) {
    return (
      <div className="page-scroll px-4 pt-6">
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>Результат не найден</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>
          На главную
        </button>
      </div>
    );
  }

  const testInCatalog = getTest(test.id);
  const formula = (test.scoring?.formula as string | undefined) || '';

  return (
    <div className="page-scroll pb-24">
      <div className="px-4 pt-4">
        <button
          onClick={() => {
            haptic.light();
            navigate('/');
          }}
          className="flex items-center gap-1 text-sm mb-4"
          style={{ color: 'var(--tg-theme-hint-color)' }}
        >
          <ArrowLeft size={16} />
          Назад
        </button>

        {/* Result header */}
        <div
          className="rounded-2xl p-5 mb-4 text-white"
          style={{ backgroundColor: 'var(--psymind-accent)' }}
        >
          <p className="text-sm opacity-80 mb-1">{test.title}</p>
          <h1 className="text-2xl font-bold leading-tight mb-2">
            {String(result.label || result.name || result.type || 'Тест пройден')}
          </h1>
          {result.description && (
            <p className="text-sm opacity-90 leading-relaxed">{String(result.description)}</p>
          )}
        </div>

        {/* Chart */}
        {formula && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <h2 className="font-semibold mb-3">Визуализация результата</h2>
            <ResultChart result={result} formula={formula} />
          </div>
        )}

        {/* MBTI: strengths */}
        {formula === 'mbti' && !!(result.strengths) && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <h2 className="font-semibold mb-3">Сильные стороны</h2>
            <div className="flex flex-col gap-2">
              {(result.strengths as string[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span style={{ color: 'var(--psymind-accent)' }}>✓</span>
                  <span className="text-sm">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Big Five: factors breakdown */}
        {formula === 'bigfive' && !!(result.chartData) && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <h2 className="font-semibold mb-3">Детали профиля</h2>
            {(result.chartData as Array<{ name: string; score: number; percent: number }>).map((d) => (
              <div key={d.name} className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.name}</span>
                  <span className="font-semibold">{d.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Luscher interpretations */}
        {formula === 'luscher' && !!(result.interpretations) && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <h2 className="font-semibold mb-3">Интерпретация</h2>
            {(
              result.interpretations as Array<{
                color: string;
                position: number;
                positionLabel: string;
                meaning: string;
              }>
            ).map((item) => (
              <div key={item.color} className="flex items-start gap-2 mb-2">
                <span className="text-xs font-semibold w-5 flex-shrink-0 mt-0.5">{item.position}</span>
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--tg-theme-hint-color)' }}>
                    {item.positionLabel}:
                  </span>
                  <p className="text-sm">{item.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Validity warning */}
        {formula === 'eysenck' && !!(result.validity_note) && (
          <div
            className="rounded-2xl p-4 mb-4 border"
            style={{ borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' }}
          >
            <p className="text-sm text-yellow-600">{String(result.validity_note)}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => {
              haptic.light();
              navigate('/');
            }}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Главная
          </button>
          {testInCatalog && (
            <button
              onClick={() => {
                haptic.medium();
                navigate(`/test/${test.id}`);
              }}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Повторить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
