import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useTests } from '../hooks/useTests';
import { useSessions } from '../hooks/useSessions';
import { TestCard } from '../components/TestCard';
import type { DbTest } from '../lib/supabase';

type Category = 'all' | 'personality' | 'emotion' | 'temperament' | 'cognitive';

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'Все',
  personality: 'Личность',
  emotion: 'Эмоции',
  temperament: 'Темперамент',
  cognitive: 'Когнитивный',
};

export const TestCatalog: React.FC = () => {
  const { user } = useUser();
  const { tests, loading } = useTests();
  const { getLatestSession, hasCompletedTest } = useSessions(user?.telegram_id);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');

  const filtered = tests
    .filter((t) => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || t.category === category;
      return matchSearch && matchCat;
    })
    .sort((a: DbTest, b: DbTest) => {
      // Not completed first
      const aCompleted = hasCompletedTest(a.id);
      const bCompleted = hasCompletedTest(b.id);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <div className="page-scroll pb-20 px-4 pt-6">
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl animate-pulse"
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
        <h1 className="text-2xl font-bold mb-4">Каталог тестов</h1>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          <Search size={16} style={{ color: 'var(--tg-theme-hint-color)' }} />
          <input
            type="text"
            placeholder="Поиск тестов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--tg-theme-text-color)' }}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  category === cat ? 'var(--psymind-accent)' : 'var(--tg-theme-secondary-bg-color)',
                color: category === cat ? 'white' : 'var(--tg-theme-hint-color)',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Tests count */}
        <p className="text-sm mb-3" style={{ color: 'var(--tg-theme-hint-color)' }}>
          {filtered.length} {filtered.length === 1 ? 'тест' : filtered.length < 5 ? 'теста' : 'тестов'}
        </p>

        {/* Test list */}
        <div className="flex flex-col gap-3">
          {filtered.map((test) => (
            <TestCard key={test.id} test={test} session={getLatestSession(test.id)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-hint">Тесты не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};
