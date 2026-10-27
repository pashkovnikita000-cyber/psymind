import React, { useState } from 'react';
import type { Question } from '../lib/supabase';
import { haptic } from '../lib/telegram';

interface QuestionStepProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  currentAnswer: unknown;
  onAnswer: (value: unknown) => void;
}

const SCALE_LABELS = ['Совсем не согласен', 'Не согласен', 'Нейтрально', 'Согласен', 'Полностью согласен'];
const SCALE4_LABELS = ['Совсем нет', 'Немного', 'Умеренно', 'Очень сильно'];

export const QuestionStep: React.FC<QuestionStepProps> = ({
  question,
  questionNumber,
  totalQuestions,
  currentAnswer,
  onAnswer,
}) => {
  const [colorOrder, setColorOrder] = useState<string[]>([]);
  const [distribute, setDistribute] = useState<Record<string, number>>({});

  const progress = ((questionNumber - 1) / totalQuestions) * 100;

  // Bipolar (MBTI)
  if (question.type === 'bipolar') {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {questionNumber} / {totalQuestions}
          </p>
          <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
          <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>
        </div>
        <div className="flex flex-col gap-3">
          {question.options.map((opt) => {
            const isSelected = currentAnswer === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  haptic.light();
                  onAnswer(opt.value);
                }}
                className={`w-full p-4 rounded-2xl text-left font-medium transition-all duration-150 active:scale-98 ${
                  isSelected ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: isSelected
                    ? 'var(--psymind-accent)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  border: `2px solid ${isSelected ? 'var(--psymind-accent)' : 'transparent'}`,
                }}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Scale 1-5 (Big Five)
  if (question.type === 'scale') {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {questionNumber} / {totalQuestions}
          </p>
          <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
          <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((val) => {
            const isSelected = currentAnswer === val;
            return (
              <button
                key={val}
                onClick={() => {
                  haptic.light();
                  onAnswer(val);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-98"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--psymind-accent)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: isSelected ? 'white' : 'inherit',
                }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(108,99,255,0.1)',
                    color: isSelected ? 'white' : 'var(--psymind-accent)',
                  }}
                >
                  {val}
                </span>
                <span className="text-sm">{SCALE_LABELS[val - 1]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Scale 1-4 (Spielberger)
  if (question.type === 'scale4') {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {questionNumber} / {totalQuestions}
          </p>
          <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
          <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((val) => {
            const isSelected = currentAnswer === val;
            return (
              <button
                key={val}
                onClick={() => {
                  haptic.light();
                  onAnswer(val);
                }}
                className="p-4 rounded-2xl text-center transition-all active:scale-95"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--psymind-accent)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: isSelected ? 'white' : 'inherit',
                }}
              >
                <span className="block text-xl font-bold mb-1">{val}</span>
                <span className="block text-xs">{SCALE4_LABELS[val - 1]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Yes/No
  if (question.type === 'yesno') {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {questionNumber} / {totalQuestions}
          </p>
          <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
          <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>
        </div>
        <div className="flex gap-3">
          {(['yes', 'no'] as const).map((val) => {
            const isSelected = currentAnswer === val;
            const label = val === 'yes' ? 'Да' : 'Нет';
            return (
              <button
                key={val}
                onClick={() => {
                  haptic.light();
                  onAnswer(val);
                }}
                className="flex-1 py-4 rounded-2xl text-center font-semibold text-lg transition-all active:scale-95"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--psymind-accent)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: isSelected ? 'white' : 'inherit',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Multichoice (Beck)
  if (question.type === 'multichoice') {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {questionNumber} / {totalQuestions}
          </p>
          <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
          <h2 className="text-lg font-semibold leading-snug mb-1">{question.text}</h2>
          <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>Выберите утверждение</p>
        </div>
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const isSelected = currentAnswer === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  haptic.light();
                  onAnswer(opt.value);
                }}
                className="flex items-start gap-3 p-3 rounded-2xl text-left transition-all active:opacity-75"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--psymind-accent)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: isSelected ? 'white' : 'inherit',
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(108,99,255,0.1)',
                    color: isSelected ? 'white' : 'var(--psymind-accent)',
                  }}
                >
                  {Number(opt.value)}
                </span>
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Pair (Rotter)
  if (question.type === 'pair') {
    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {questionNumber} / {totalQuestions}
          </p>
          <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
          <h2 className="text-lg font-semibold">Выберите утверждение, с которым вы больше согласны:</h2>
        </div>
        <div className="flex flex-col gap-3">
          {question.options.map((opt, idx) => {
            const isSelected = currentAnswer === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  haptic.light();
                  onAnswer(opt.value);
                }}
                className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all active:opacity-75"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--psymind-accent)'
                    : 'var(--tg-theme-secondary-bg-color)',
                  color: isSelected ? 'white' : 'inherit',
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(108,99,255,0.1)',
                    color: isSelected ? 'white' : 'var(--psymind-accent)',
                  }}
                >
                  {idx === 0 ? 'А' : 'Б'}
                </span>
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Color sort (Luscher)
  if (question.type === 'color_sort') {
    const remaining = question.options.filter(
      (c) => !colorOrder.includes(c.id as string),
    );

    return (
      <div className="animate-fade-up">
        <div className="mb-6">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Раунд {question.round} из 2
          </p>
          <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Нажимайте цвета в порядке предпочтения. Выбрано: {colorOrder.length}/8
          </p>
        </div>

        {colorOrder.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>Ваш выбор:</p>
            <div className="flex flex-wrap gap-2">
              {colorOrder.map((cid, idx) => {
                const colorInfo = question.options.find((c) => c.id === cid);
                return (
                  <div key={cid} className="relative">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: colorInfo?.hex as string }}
                    >
                      {idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          {remaining.map((color) => (
            <button
              key={color.id as string}
              onClick={() => {
                haptic.light();
                const newOrder = [...colorOrder, color.id as string];
                setColorOrder(newOrder);
                if (newOrder.length === 8) {
                  onAnswer(newOrder);
                }
              }}
              className="color-btn"
              style={{ backgroundColor: color.hex as string }}
              title={color.name as string}
            />
          ))}
        </div>

        {colorOrder.length > 0 && (
          <button
            onClick={() => {
              setColorOrder([]);
            }}
            className="mt-4 text-sm w-full text-center py-2"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            Начать заново
          </button>
        )}
      </div>
    );
  }

  // Distribute 10 points (Belbin)
  if (question.type === 'distribute10') {
    const currentDistribute = (currentAnswer as Record<string, number>) || distribute;
    const total = Object.values(currentDistribute).reduce((a, b) => a + b, 0);
    const remaining_points = 10 - total;

    const updatePoints = (letter: string, delta: number) => {
      haptic.selection();
      const newDist = { ...currentDistribute };
      const current = newDist[letter] || 0;
      const newVal = Math.max(0, current + delta);
      newDist[letter] = newVal;
      const newTotal = Object.values(newDist).reduce((a, b) => a + b, 0);
      if (newTotal <= 10) {
        setDistribute(newDist);
        if (newTotal === 10) onAnswer(newDist);
      }
    };

    return (
      <div className="animate-fade-up">
        <div className="mb-4">
          <p className="text-sm mb-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Раздел {question.section} / 7
          </p>
          <div className="h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: 'var(--psymind-accent)' }}
            />
          </div>
          <h2 className="text-base font-semibold">{question.section_title}</h2>
          <p className="text-sm mt-1" style={{ color: remaining_points > 0 ? 'var(--psymind-accent)' : '#22c55e' }}>
            {remaining_points > 0
              ? `Осталось распределить: ${remaining_points} баллов`
              : 'Все 10 баллов распределены ✓'}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const letter = opt.letter as string;
            const pts = currentDistribute[letter] || 0;
            return (
              <div
                key={letter}
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: 'rgba(108,99,255,0.15)', color: 'var(--psymind-accent)' }}
                >
                  {letter.toUpperCase()}
                </span>
                <span className="flex-1 text-xs leading-relaxed">{opt.text}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => updatePoints(letter, -1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
                    disabled={pts === 0}
                  >
                    −
                  </button>
                  <span className="w-5 text-center font-semibold text-sm">{pts}</span>
                  <button
                    onClick={() => updatePoints(letter, 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      backgroundColor: remaining_points > 0 ? 'var(--psymind-accent)' : 'rgba(0,0,0,0.08)',
                      color: remaining_points > 0 ? 'white' : 'inherit',
                    }}
                    disabled={remaining_points === 0}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-center" style={{ color: 'var(--tg-theme-hint-color)' }}>
      Неподдерживаемый тип вопроса: {question.type}
    </div>
  );
};
