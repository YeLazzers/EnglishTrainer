/**
 * Типы запросов для трекинга использования лимитов
 */
export enum RequestType {
  /** Запрос теории грамматики (лимит: не более 50% от общего лимита) */
  THEORY = 'THEORY',
  /** Практическое упражнение */
  PRACTICE = 'PRACTICE',
  /** Свободное письмо */
  FREE_WRITING = 'FREE_WRITING',
}

/**
 * Дневные лимиты пользователя
 */
export interface DailyLimits {
  /** Общий лимит запросов в день */
  total: number;
  /** Максимум запросов теории (обычно 50% от total) */
  maxTheory: number;
}

/**
 * Статистика использования за день
 */
export interface UsageStats {
  /** ID пользователя */
  userId: number;
  /** Дата (YYYY-MM-DD) */
  date: string;
  /** Всего использовано запросов */
  totalUsed: number;
  /** Использовано запросов теории */
  theoryUsed: number;
  /** Использовано запросов практики */
  practiceUsed: number;
  /** Использовано запросов свободного письма */
  freeWritingUsed: number;
}

/**
 * Результат проверки лимита
 */
export interface LimitCheckResult {
  /** Разрешён ли запрос */
  allowed: boolean;
  /** Причина отказа (если allowed = false) */
  reason?: 'TOTAL_LIMIT_REACHED' | 'THEORY_LIMIT_REACHED';
  /** Текущая статистика использования */
  currentUsage: UsageStats;
  /** Лимиты пользователя */
  limits: DailyLimits;
}
