import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DbTest } from '../lib/supabase';

interface UseTestsReturn {
  tests: DbTest[];
  loading: boolean;
  error: string | null;
  getTest: (id: string) => DbTest | undefined;
  getTestBySlug: (slug: string) => DbTest | undefined;
}

export function useTests(): UseTestsReturn {
  const [tests, setTests] = useState<DbTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('tests')
          .select('*')
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setTests((data || []) as DbTest[]);
      } catch (err) {
        console.error('useTests error:', err);
        setError('Ошибка загрузки тестов');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const getTest = (id: string) => tests.find((t) => t.id === id);
  const getTestBySlug = (slug: string) => tests.find((t) => t.slug === slug);

  return { tests, loading, error, getTest, getTestBySlug };
}
