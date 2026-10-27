import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getTelegramUser, getMockUser, isInTelegram } from '../lib/telegram';
import type { DbUser } from '../lib/supabase';
import type { TelegramUser } from '../lib/telegram';

export type { TelegramUser };

interface UseUserReturn {
  user: DbUser | null;
  telegramUser: ReturnType<typeof getTelegramUser>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const telegramUser = isInTelegram() ? getTelegramUser() : getMockUser();

  const fetchOrCreateUser = useCallback(async () => {
    if (!telegramUser) {
      setLoading(false);
      setError('Не удалось получить данные пользователя Telegram');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingUser) {
        setUser(existingUser as DbUser);
        return;
      }

      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramUser.id,
          username: telegramUser.username ?? null,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name ?? null,
          photo_url: telegramUser.photo_url ?? null,
          language_code: telegramUser.language_code ?? 'ru',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setUser(newUser as DbUser);
    } catch (err) {
      console.error('useUser error:', err);
      setError('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  }, [telegramUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrCreateUser();
  }, [fetchOrCreateUser]);

  return {
    user,
    telegramUser,
    loading,
    error,
    refetch: fetchOrCreateUser,
  };
}
