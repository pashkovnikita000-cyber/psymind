import type { DbTest, TestResult } from './supabase';

type Answers = Record<string, unknown>;

// ============================================================
// Main calculate function — dispatches to test-specific logic
// ============================================================
export function calculateResult(test: DbTest, answers: Answers): TestResult {
  switch (test.scoring.formula) {
    case 'mbti':
      return calculateMBTI(test, answers);
    case 'bigfive':
      return calculateBigFive(test, answers);
    case 'eysenck':
      return calculateEysenck(test, answers);
    case 'luscher':
      return calculateLuscher(test, answers);
    case 'spielberger':
      return calculateSpielberger(test, answers);
    case 'beck':
      return calculateBeck(test, answers);
    case 'rotter':
      return calculateRotter(test, answers);
    case 'taylor':
      return calculateTaylor(test, answers);
    case 'strelau':
      return calculateStrelau(test, answers);
    case 'belbin':
      return calculateBelbin(test, answers);
    default:
      return { label: 'Результат', description: 'Тест завершён' };
  }
}

// ============================================================
// MBTI
// ============================================================
function calculateMBTI(test: DbTest, answers: Answers): TestResult {
  const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  test.questions.forEach((q) => {
    const answer = answers[q.id] as string;
    if (answer) {
      counts[answer] = (counts[answer] || 0) + 1;
    }
  });

  const type = [
    counts.E >= counts.I ? 'E' : 'I',
    counts.S >= counts.N ? 'S' : 'N',
    counts.T >= counts.F ? 'T' : 'F',
    counts.J >= counts.P ? 'J' : 'P',
  ].join('');

  const resultTypes = test.result_types as Record<
    string,
    { name: string; description: string; strengths: string[] }
  >;
  const typeInfo = resultTypes[type] || { name: type, description: '', strengths: [] };

  return {
    type,
    name: typeInfo.name,
    label: `${type} — ${typeInfo.name}`,
    description: typeInfo.description,
    strengths: typeInfo.strengths,
    scores: {
      E: counts.E,
      I: counts.I,
      S: counts.S,
      N: counts.N,
      T: counts.T,
      F: counts.F,
      J: counts.J,
      P: counts.P,
    },
    dimensions: [
      { name: 'E/I', valueA: counts.E, valueB: counts.I, labelA: 'Э', labelB: 'И' },
      { name: 'S/N', valueA: counts.S, valueB: counts.N, labelA: 'С', labelB: 'Н' },
      { name: 'T/F', valueA: counts.T, valueB: counts.F, labelA: 'Л', labelB: 'Э' },
      { name: 'J/P', valueA: counts.J, valueB: counts.P, labelA: 'Р', labelB: 'И' },
    ],
  };
}

// ============================================================
// Big Five
// ============================================================
function calculateBigFive(test: DbTest, answers: Answers): TestResult {
  const sums: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const counts: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  test.questions.forEach((q) => {
    const rawAnswer = answers[q.id];
    if (rawAnswer === undefined || rawAnswer === null) return;

    let score = Number(rawAnswer);
    if (q.reverse) {
      score = 6 - score; // reverse: 1↔5, 2↔4
    }

    const factor = q.factor as string;
    if (factor && sums[factor] !== undefined) {
      sums[factor] += score;
      counts[factor]++;
    }
  });

  const averages: Record<string, number> = {};
  const percentages: Record<string, number> = {};
  Object.keys(sums).forEach((factor) => {
    averages[factor] = counts[factor] > 0 ? Math.round((sums[factor] / counts[factor]) * 10) / 10 : 0;
    percentages[factor] = Math.round((averages[factor] / 5) * 100);
  });

  const resultTypes = test.result_types as Record<
    string,
    { name: string; low: string; high: string }
  >;

  const chartData = Object.entries(averages).map(([factor, avg]) => ({
    factor,
    name: resultTypes[factor]?.name || factor,
    score: avg,
    percent: percentages[factor],
  }));

  const dominantFactor = Object.entries(averages).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ['O', 0],
  )[0];

  const dominantDesc = resultTypes[dominantFactor];

  return {
    label: `Профиль OCEAN`,
    description: dominantDesc
      ? `Ваша доминирующая черта: ${dominantDesc.name}`
      : 'Сбалансированный профиль',
    scores: averages,
    percentages,
    chartData,
    dominant_factor: dominantFactor,
  };
}

// ============================================================
// Eysenck EPI
// ============================================================
function calculateEysenck(test: DbTest, answers: Answers): TestResult {
  let eScore = 0;
  let nScore = 0;
  let lScore = 0;

  test.questions.forEach((q) => {
    const answer = answers[q.id];
    const given = answer === 'yes' || answer === true || answer === 1;
    const keyYes = q.key === 'yes';

    const isCorrect = keyYes ? given : !given;
    if (!isCorrect) return;

    if (q.scale === 'E') eScore++;
    else if (q.scale === 'N') nScore++;
    else if (q.scale === 'L') lScore++;
  });

  const highE = eScore > 12;
  const highN = nScore > 12;

  let temperament: string;
  let temperamentKey: string;
  if (highE && highN) {
    temperament = 'Холерик';
    temperamentKey = 'EH_NH';
  } else if (highE && !highN) {
    temperament = 'Сангвиник';
    temperamentKey = 'EH_NL';
  } else if (!highE && highN) {
    temperament = 'Меланхолик';
    temperamentKey = 'EL_NH';
  } else {
    temperament = 'Флегматик';
    temperamentKey = 'EL_NL';
  }

  const resultTypes = test.result_types as Record<string, { name: string; description: string }>;
  const typeInfo = resultTypes[temperamentKey];

  return {
    type: temperamentKey,
    label: temperament,
    name: temperament,
    description: typeInfo?.description || '',
    scores: { E: eScore, N: nScore, L: lScore },
    chartData: [
      { name: 'Экстраверсия', score: eScore, max: 24 },
      { name: 'Нейротизм', score: nScore, max: 24 },
      { name: 'Искренность', score: lScore, max: 9 },
    ],
    is_valid: lScore < 5,
    validity_note: lScore >= 5 ? 'Высокий показатель лжи — результаты могут быть неточными' : null,
  };
}

// ============================================================
// Luscher
// ============================================================
function calculateLuscher(test: DbTest, answers: Answers): TestResult {
  // answers = { 1: ['blue','green','red',...], 2: [...] }
  const round1 = (answers['1'] as string[]) || [];
  const round2 = (answers['2'] as string[]) || [];

  // Use round 2 as primary (more reliable)
  const order = round2.length > 0 ? round2 : round1;

  const resultTypes = test.result_types as Record<
    string,
    { need: string; high: string; low: string }
  >;

  const interpretations = order.map((colorId, index) => {
    const info = resultTypes[colorId];
    let position: string;
    if (index < 2) position = 'Явное предпочтение';
    else if (index < 4) position = 'Предпочтение';
    else if (index < 6) position = 'Безразличие';
    else position = 'Неприятие';

    return {
      color: colorId,
      position: index + 1,
      positionLabel: position,
      meaning: index < 4 ? info?.high : info?.low,
      need: info?.need,
    };
  });

  // Analyze dominant colors (positions 1-2)
  const preferred = order.slice(0, 2);
  const rejected = order.slice(6);

  let summary = '';
  if (preferred.includes('blue')) summary += 'Стремление к покою и стабильности. ';
  if (preferred.includes('green')) summary += 'Потребность в самоутверждении. ';
  if (preferred.includes('red')) summary += 'Высокая активность и энергия. ';
  if (preferred.includes('yellow')) summary += 'Оптимизм и поиск новизны. ';
  if (rejected.includes('black') || rejected.includes('gray'))
    summary += 'Стремление к контролю над ситуацией. ';

  if (!summary) summary = 'Сбалансированный профиль цветовых предпочтений.';

  return {
    label: 'Цветовой профиль',
    description: summary.trim(),
    order,
    interpretations,
    preferred_colors: preferred,
    rejected_colors: rejected,
  };
}

// ============================================================
// Spielberger-Hanin
// ============================================================
function calculateSpielberger(test: DbTest, answers: Answers): TestResult {
  const scoringCfg = test.scoring as { formula: string; scales: string[] };
  let stateScore = 0;
  let traitScore = 0;

  test.questions.forEach((q) => {
    const rawAnswer = answers[q.id];
    if (rawAnswer === undefined || rawAnswer === null) return;

    let score = Number(rawAnswer);
    if (q.reverse) {
      score = 5 - score; // reverse scoring for Spielberger
    }

    if (q.scale === 'state') stateScore += score;
    else if (q.scale === 'trait') traitScore += score;
  });

  void scoringCfg;

  const getLevel = (score: number) => {
    if (score <= 30) return { level: 'low', label: 'Низкая', color: '#22c55e' };
    if (score <= 44) return { level: 'medium', label: 'Умеренная', color: '#f59e0b' };
    return { level: 'high', label: 'Высокая', color: '#ef4444' };
  };

  const stateLvl = getLevel(stateScore);
  const traitLvl = getLevel(traitScore);

  return {
    label: `Тревожность: ${stateLvl.label}/${traitLvl.label}`,
    description: `Ситуативная тревожность: ${stateLvl.label} (${stateScore})\nЛичностная тревожность: ${traitLvl.label} (${traitScore})`,
    scores: { state: stateScore, trait: traitScore },
    state_level: stateLvl.level,
    trait_level: traitLvl.level,
    chartData: [
      { name: 'Ситуативная', score: stateScore, level: stateLvl.label, max: 80 },
      { name: 'Личностная', score: traitScore, level: traitLvl.label, max: 80 },
    ],
  };
}

// ============================================================
// Beck Depression Inventory
// ============================================================
function calculateBeck(test: DbTest, answers: Answers): TestResult {
  let total = 0;

  test.questions.forEach((q) => {
    const rawAnswer = answers[q.id];
    if (rawAnswer !== undefined && rawAnswer !== null) {
      total += Number(rawAnswer);
    }
  });

  void test;

  let level: string;
  let label: string;
  let description: string;
  let color: string;

  if (total <= 13) {
    level = 'minimal';
    label = 'Минимальная депрессия';
    description = 'Ваше состояние в норме. Незначительные колебания настроения являются естественными.';
    color = '#22c55e';
  } else if (total <= 19) {
    level = 'mild';
    label = 'Лёгкая депрессия';
    description = 'Мягкое подавленное состояние. Рекомендуется уделить внимание своему эмоциональному благополучию.';
    color = '#84cc16';
  } else if (total <= 28) {
    level = 'moderate';
    label = 'Умеренная депрессия';
    description = 'Умеренная депрессия. Рекомендуется консультация специалиста.';
    color = '#f59e0b';
  } else {
    level = 'severe';
    label = 'Тяжёлая депрессия';
    description = 'Выраженная депрессия. Рекомендуется незамедлительная помощь специалиста.';
    color = '#ef4444';
  }

  return {
    label,
    level,
    description,
    total_score: total,
    scores: { total },
    color,
    chartData: [{ name: 'Депрессия', score: total, max: 63 }],
  };
}

// ============================================================
// Rotter Locus of Control
// ============================================================
function calculateRotter(test: DbTest, answers: Answers): TestResult {
  let externalCount = 0;
  let internalCount = 0;

  test.questions.forEach((q) => {
    const answer = answers[q.id];
    if (answer === 'E') externalCount++;
    else if (answer === 'I') internalCount++;
  });

  void test;

  const externalPct = Math.round((externalCount / 29) * 100);

  let level: string;
  let label: string;
  let description: string;

  if (externalCount <= 10) {
    level = 'internal';
    label = 'Интернальный локус контроля';
    description = 'Вы убеждены, что сами управляете своей жизнью и несёте ответственность за происходящее.';
  } else if (externalCount <= 16) {
    level = 'mixed';
    label = 'Смешанный локус контроля';
    description = 'Вы сочетаете принятие ответственности с признанием роли внешних обстоятельств.';
  } else {
    level = 'external';
    label = 'Экстернальный локус контроля';
    description = 'Вы склонны объяснять события жизни внешними причинами — судьбой, случаем, другими людьми.';
  }

  return {
    label,
    level,
    description,
    scores: { external: externalCount, internal: internalCount },
    external_pct: externalPct,
    internal_pct: 100 - externalPct,
    chartData: [
      { name: 'Внешний', score: externalCount },
      { name: 'Внутренний', score: internalCount },
    ],
  };
}

// ============================================================
// Taylor Manifest Anxiety Scale
// ============================================================
function calculateTaylor(test: DbTest, answers: Answers): TestResult {
  let score = 0;

  test.questions.forEach((q) => {
    const answer = answers[q.id];
    const given = answer === 'yes' || answer === true || answer === 1;
    const keyYes = q.key === 'yes';

    if (keyYes && given) score++;
    if (!keyYes && !given) score++;
  });

  void test;

  let level: string;
  let label: string;
  let description: string;
  let color: string;

  if (score <= 5) {
    level = 'very_low';
    label = 'Очень низкая тревожность';
    description = 'Возможна недостаточная мотивация к достижению результатов.';
    color = '#6366f1';
  } else if (score <= 10) {
    level = 'low';
    label = 'Низкая тревожность';
    description = 'Спокойное и уверенное состояние. Хороший эмоциональный баланс.';
    color = '#22c55e';
  } else if (score <= 25) {
    level = 'medium';
    label = 'Средняя тревожность';
    description = 'Нормальный уровень. Позволяет эффективно справляться с задачами.';
    color = '#84cc16';
  } else if (score <= 40) {
    level = 'high';
    label = 'Высокая тревожность';
    description = 'Выраженная тревожность. Рекомендуется работа над эмоциональной регуляцией.';
    color = '#f59e0b';
  } else {
    level = 'very_high';
    label = 'Очень высокая тревожность';
    description = 'Сильная тревожность. Рекомендуется консультация специалиста.';
    color = '#ef4444';
  }

  return {
    label,
    level,
    description,
    total_score: score,
    scores: { total: score },
    color,
    chartData: [{ name: 'Тревожность', score, max: 50 }],
  };
}

// ============================================================
// Strelau Temperament
// ============================================================
function calculateStrelau(test: DbTest, answers: Answers): TestResult {
  const scores: Record<string, number> = { SE: 0, SI: 0, SM: 0 };

  test.questions.forEach((q) => {
    const answer = answers[q.id];
    const given = answer === 'yes' || answer === true;
    const keyYes = q.key === 'yes';
    const scale = q.scale as string;

    if (scale && (keyYes ? given : !given)) {
      scores[scale] = (scores[scale] || 0) + 1;
    }
  });

  const resultTypes = test.result_types as Record<
    string,
    { name: string; low: string; high: string }
  >;

  const maxScores: Record<string, number> = { SE: 24, SI: 24, SM: 24 };

  const chartData = Object.entries(scores).map(([scale, score]) => ({
    name: resultTypes[scale]?.name || scale,
    score,
    max: maxScores[scale] || 24,
    percent: Math.round((score / (maxScores[scale] || 24)) * 100),
  }));

  const balanced = Math.abs(scores.SE - scores.SI) <= 4;

  let label = '';
  if (scores.SE > 16 && scores.SI > 16 && scores.SM > 16) label = 'Сильный, уравновешенный, подвижный';
  else if (scores.SE > 16 && scores.SI > 16) label = 'Сильный, уравновешенный';
  else if (scores.SE > 16) label = 'Сильный, неуравновешенный';
  else label = 'Слабый тип нервной системы';

  return {
    label,
    description: balanced
      ? 'Уравновешенная нервная система. Хороший баланс возбуждения и торможения.'
      : 'Нервная система с преобладанием одного из процессов.',
    scores,
    chartData,
    balanced,
  };
}

// ============================================================
// Belbin Team Roles
// ============================================================
function calculateBelbin(test: DbTest, answers: Answers): TestResult {
  const roleTotals: Record<string, number> = {
    PL: 0,
    RI: 0,
    CO: 0,
    SH: 0,
    ME: 0,
    IMP: 0,
    TW: 0,
    CF: 0,
  };

  // answers format: { questionId: { 'a': 3, 'b': 5, 'c': 2, ... } }
  test.questions.forEach((q) => {
    const sectionAnswers = answers[q.id] as Record<string, number> | undefined;
    if (!sectionAnswers) return;

    q.options.forEach((opt) => {
      const role = opt.role;
      const letter = opt.letter;
      if (role && letter && sectionAnswers[letter]) {
        roleTotals[role] = (roleTotals[role] || 0) + (sectionAnswers[letter] || 0);
      }
    });
  });

  const resultTypes = test.result_types as Record<
    string,
    { name: string; abbr: string; description: string }
  >;

  const chartData = Object.entries(roleTotals).map(([role, score]) => ({
    role,
    name: resultTypes[role]?.name || role,
    abbr: resultTypes[role]?.abbr || role,
    score,
  }));

  chartData.sort((a, b) => b.score - a.score);

  const primaryRole = chartData[0];
  const secondaryRole = chartData[1];

  return {
    label: `${primaryRole?.name || 'Роль'} + ${secondaryRole?.name || 'Роль'}`,
    description: resultTypes[primaryRole?.role]?.description || '',
    primary_role: primaryRole?.role,
    secondary_role: secondaryRole?.role,
    scores: roleTotals,
    chartData,
  };
}
