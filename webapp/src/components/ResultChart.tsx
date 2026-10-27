import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { TestResult } from '../lib/supabase';

interface ResultChartProps {
  result: TestResult;
  formula: string;
}

const ACCENT = '#6C63FF';
const COLORS = ['#6C63FF', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#f97316', '#06b6d4', '#8b5cf6'];

export const ResultChart: React.FC<ResultChartProps> = ({ result, formula }) => {
  if (formula === 'bigfive') {
    const chartData = (result.chartData as Array<{ factor: string; name: string; score: number }>) || [];
    const radarData = chartData.map((d) => ({
      subject: d.name,
      value: d.score,
      fullMark: 5,
    }));

    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="rgba(108,99,255,0.2)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--tg-theme-text-color)', fontSize: 11 }} />
            <Radar
              name="Результат"
              dataKey="value"
              stroke={ACCENT}
              fill={ACCENT}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 mt-2">
          {chartData.map((d) => (
            <div key={d.factor}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--tg-theme-hint-color)' }}>{d.name}</span>
                <span className="font-semibold">{d.score.toFixed(1)} / 5</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(d.score / 5) * 100}%`, backgroundColor: ACCENT }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (formula === 'eysenck') {
    const chartData = (result.chartData as Array<{ name: string; score: number; max: number }>) || [];
    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: 'var(--tg-theme-text-color)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--tg-theme-hint-color)', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                border: 'none',
                borderRadius: 8,
                color: 'var(--tg-theme-text-color)',
              }}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {chartData.map((_entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (formula === 'spielberger') {
    const chartData = (result.chartData as Array<{ name: string; score: number; level: string; max: number }>) || [];
    return (
      <div className="flex flex-col gap-3 mt-2">
        {chartData.map((d, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{d.name}</span>
              <span style={{ color: 'var(--tg-theme-hint-color)' }}>
                {d.score} — {d.level}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(d.score / 80) * 100}%`,
                  backgroundColor: d.score <= 30 ? '#22c55e' : d.score <= 44 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (formula === 'beck' || formula === 'taylor') {
    const total = (result.total_score as number) || 0;
    const max = formula === 'beck' ? 63 : 50;
    const pct = Math.round((total / max) * 100);
    const color = (result.color as string) || ACCENT;

    return (
      <div className="flex flex-col items-center py-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--tg-theme-secondary-bg-color)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={`${(pct / 100) * 326.7} 326.7`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
              из {max}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (formula === 'strelau') {
    const chartData = (result.chartData as Array<{ name: string; score: number; max: number }>) || [];
    const radarData = chartData.map((d) => ({
      subject: d.name,
      value: d.score,
      fullMark: d.max || 24,
    }));

    return (
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="rgba(108,99,255,0.2)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--tg-theme-text-color)', fontSize: 11 }} />
          <Radar name="Темперамент" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (formula === 'belbin') {
    const chartData = (result.chartData as Array<{ name: string; score: number; abbr: string }>) || [];
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis dataKey="abbr" tick={{ fill: 'var(--tg-theme-text-color)', fontSize: 10 }} />
          <YAxis tick={{ fill: 'var(--tg-theme-hint-color)', fontSize: 10 }} />
          <Tooltip
            formatter={(value, _name, props) => [value, props.payload.name]}
            contentStyle={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color)',
              border: 'none',
              borderRadius: 8,
              color: 'var(--tg-theme-text-color)',
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {chartData.map((_entry, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (formula === 'rotter') {
    const ext = (result.external_pct as number) || 0;
    const int_ = 100 - ext;
    return (
      <div className="flex flex-col gap-3 mt-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Внутренний</span>
            <span className="font-semibold">{int_}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div className="h-full rounded-full" style={{ width: `${int_}%`, backgroundColor: '#22c55e' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Внешний</span>
            <span className="font-semibold">{ext}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div className="h-full rounded-full" style={{ width: `${ext}%`, backgroundColor: '#f59e0b' }} />
          </div>
        </div>
      </div>
    );
  }

  if (formula === 'mbti' && result.dimensions) {
    const dims = result.dimensions as Array<{
      name: string;
      valueA: number;
      valueB: number;
      labelA: string;
      labelB: string;
    }>;
    return (
      <div className="flex flex-col gap-3 mt-2">
        {dims.map((d) => {
          const total = d.valueA + d.valueB;
          const pctA = total > 0 ? Math.round((d.valueA / total) * 100) : 50;
          return (
            <div key={d.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: ACCENT }}>{d.labelA} {d.valueA}</span>
                <span className="text-hint">{d.name}</span>
                <span className="font-semibold" style={{ color: 'var(--tg-theme-hint-color)' }}>{d.valueB} {d.labelB}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pctA}%`, backgroundColor: ACCENT }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};
