// Telegram WebApp integration

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: TelegramInitData;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: TelegramMainButton;
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (ok: boolean) => void) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  sendData: (data: string) => void;
  version: string;
  platform: string;
}

interface TelegramInitData {
  user?: TelegramUser;
  start_param?: string;
  auth_date: number;
  hash: string;
  chat_type?: string;
  chat_instance?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  setText: (text: string) => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
}

interface TelegramBackButton {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
}

interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

// Get Telegram WebApp instance
export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

// Check if running inside Telegram
export function isInTelegram(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
}

// Get current user from Telegram init data
export function getTelegramUser(): TelegramUser | null {
  const twa = getTelegramWebApp();
  if (!twa) return null;

  const user = twa.initDataUnsafe?.user;
  if (!user) return null;

  return user;
}

// Get mock user for development/browser testing
export function getMockUser(): TelegramUser {
  return {
    id: 123456789,
    first_name: 'Тестовый',
    last_name: 'Пользователь',
    username: 'test_user',
    language_code: 'ru',
  };
}

// Initialize Telegram WebApp
export function initTelegramWebApp(): void {
  const twa = getTelegramWebApp();
  if (!twa) return;

  twa.ready();
  twa.expand();

  // Apply Telegram theme to CSS vars
  const tp = twa.themeParams;
  const root = document.documentElement;

  if (tp.bg_color) root.style.setProperty('--tg-theme-bg-color', tp.bg_color);
  if (tp.text_color) root.style.setProperty('--tg-theme-text-color', tp.text_color);
  if (tp.hint_color) root.style.setProperty('--tg-theme-hint-color', tp.hint_color);
  if (tp.link_color) root.style.setProperty('--tg-theme-link-color', tp.link_color);
  if (tp.button_color) root.style.setProperty('--tg-theme-button-color', tp.button_color);
  if (tp.button_text_color)
    root.style.setProperty('--tg-theme-button-text-color', tp.button_text_color);
  if (tp.secondary_bg_color)
    root.style.setProperty('--tg-theme-secondary-bg-color', tp.secondary_bg_color);
  if (tp.header_bg_color)
    root.style.setProperty('--tg-theme-header-bg-color', tp.header_bg_color);
  if (tp.accent_text_color)
    root.style.setProperty('--tg-theme-accent-text-color', tp.accent_text_color);
  if (tp.section_bg_color)
    root.style.setProperty('--tg-theme-section-bg-color', tp.section_bg_color);
  if (tp.subtitle_text_color)
    root.style.setProperty('--tg-theme-subtitle-text-color', tp.subtitle_text_color);
  if (tp.destructive_text_color)
    root.style.setProperty('--tg-theme-destructive-text-color', tp.destructive_text_color);

  // Dark mode
  if (twa.colorScheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

// Haptic feedback helpers
export const haptic = {
  light: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('light'),
  medium: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium'),
  success: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success'),
  error: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error'),
  selection: () => getTelegramWebApp()?.HapticFeedback?.selectionChanged(),
};
