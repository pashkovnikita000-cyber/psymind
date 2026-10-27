import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useTests } from '../hooks/useTests';
import { useSessions } from '../hooks/useSessions';
import { QuestionStep } from '../components/QuestionStep';
import { calculateResult } from '../lib/scoring';
import { requestAiAnalysis } from '../lib/ai';
import { haptic } from '../lib/telegram';
import type { Question } from '../lib/supabase';

export const TestRunner: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getTest } = useTests();
  const { startSession, saveProgress, completeSession, getCompletedCount } = useSessions(
    user?.telegram_id,
  );

  const test = testId ? getTest(testId) : null;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [animDirection, setAnimDirection] = useState<'right' | 'left'>('right');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (test && user && !sessionId) {
      startSession(test.id, user.telegram_id).then((session) => {
        if (session) setSessionId(session.id);
      });
    }
  }, [test?.id, user?.telegram_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!test) {
    return (
      <div className="page-scroll pb-20 px-4 pt-6 flex items-center justify-center">
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>Тест не найден</p>
      </div>
    );
  }

  // Handle Luscher special: it has only 2 "questions" but each requires full color sort
  const questions: Question[] = test.questions;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / totalQuestions) * 100;

  const handleAnswer = async (value: unknown) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Debounce save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (sessionId) {
      saveTimerRef.current = setTimeout(() => {
        saveProgress(sessionId, newAnswers);
      }, 1000);
    }

    if (currentIndex < totalQuestions - 1) {
      haptic.selection();
      setAnimDirection('right');
      setTimeout(() => setCurrentIndex((i) => i + 1), 50);
    } else {
      // Last question answered — complete test
      haptic.success();
      await handleComplete(newAnswers);
    }
  };

  const handleComplete = async (finalAnswers: Record<string, unknown>) => {
    if (!sessionId || !user || completing) return;
    setCompleting(true);

    try {
      const result = calculateResult(test, finalAnswers);
      const completedSession = await completeSession(sessionId, finalAnswers, result);

      if (!completedSession) {
        haptic.error();
        navigate('/catalog');
        return;
      }

      // Trigger AI analysis if user has 2+ completed tests
      const completedCount = getCompletedCount();
      if (completedCount >= 2) {
        requestAiAnalysis(user.telegram_id).catch(console.error);
      }

      navigate(`/result/${completedSession.id}`, { state: { result, test } });
    } catch (err) {
      console.error('Complete error:', err);
      navigate('/catalog');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      haptic.light();
      setAnimDirection('left');
      setCurrentIndex((i) => i - 1);
    } else {
      navigate(-1);
    }
  };

  const handleExit = () => {
    haptic.light();
    navigate('/catalog');
  };

  if (!started) {
    return (
      <div className="page-scroll pb-6 px-4 pt-6 flex flex-col">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm mb-6"
          style={{ color: 'var(--tg-theme-hint-color)' }}
        >
          <ArrowLeft size={16} />
          Назад
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {test.description}
          </p>

          <div
            className="rounded-2xl p-4 mb-6"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalQuestions}</p>
                <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>вопросов</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">~{test.estimated_minutes}</p>
                <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>минут</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.medium();
              setStarted(true);
            }}
            className="btn-primary"
          >
            Начать тест
          </button>
        </div>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="page-scroll flex items-center justify-center">
        <div className="text-center p-6">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(108,99,255,0.12)' }}
          >
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{
                borderColor: 'var(--psymind-accent)',
                borderTopColor: 'transparent',
              }}
            />
          </div>
          <p className="font-semibold">Обрабатываем результаты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-scroll pb-6 flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <button onClick={handleBack} className="p-1 rounded-lg">
          <ArrowLeft size={20} style={{ color: 'var(--tg-theme-hint-color)' }} />
        </button>

        <div className="flex-1">
          <p className="text-xs font-medium truncate">{test.title}</p>
          <div className="h-1 rounded-full mt-1" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
        </div>

        <button onClick={handleExit} className="p-1 rounded-lg">
          <X size={20} style={{ color: 'var(--tg-theme-hint-color)' }} />
        </button>
      </div>

      {/* Question */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6"
        key={`q-${currentIndex}-${animDirection}`}
        style={{ animation: `${animDirection === 'right' ? 'slideInRight' : 'slideInLeft'} 0.25s ease-out` }}
      >
        <QuestionStep
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
          currentAnswer={answers[currentQuestion.id]}
          onAnswer={handleAnswer}
        />
      </div>

      {/* Skip / next for long-answer types */}
      {answers[currentQuestion.id] !== undefined &&
        currentQuestion.type !== 'bipolar' &&
        currentQuestion.type !== 'yesno' &&
        currentQuestion.type !== 'color_sort' && (
          <div className="px-4 pb-4">
            <button
              onClick={() => {
                haptic.medium();
                handleAnswer(answers[currentQuestion.id]);
              }}
              className="btn-primary"
            >
              {currentIndex < totalQuestions - 1 ? 'Следующий вопрос →' : 'Завершить тест'}
            </button>
          </div>
        )}
    </div>
  );
};
