import type { RequestType, UsageStats, DailyLimits, LimitCheckResult } from './types';

/**
 * Порт для управления лимитами запросов пользователей
 *
 * Реализация: Redis с TTL до конца дня (автоматический сброс в 00:00 UTC)
 */
export interface LimitRepository {
  /**
   * Проверить, разрешён ли запрос для пользователя
   *
   * @param userId - ID пользователя
   * @param requestType - Тип запроса (THEORY, PRACTICE, FREE_WRITING)
   * @returns Результат проверки с причиной отказа и текущей статистикой
   */
  checkLimit(
    userId: number,
    requestType: RequestType
  ): Promise<LimitCheckResult>;

  /**
   * Инкрементировать счётчик использования для типа запроса
   *
   * @param userId - ID пользователя
   * @param requestType - Тип запроса
   * @returns Обновлённая статистика использования
   */
  incrementUsage(userId: number, requestType: RequestType): Promise<UsageStats>;

  /**
   * Получить текущую статистику использования за день
   *
   * @param userId - ID пользователя
   * @returns Статистика использования (или нули, если пользователь ещё не делал запросы)
   */
  getUsage(userId: number): Promise<UsageStats>;

  /**
   * Сбросить лимиты пользователя (для тестирования или manual reset)
   *
   * @param userId - ID пользователя
   */
  resetUsage(userId: number): Promise<void>;
}
