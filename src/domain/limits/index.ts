/**
 * Доменный модуль для управления лимитами запросов
 *
 * Экспортирует типы и порт репозитория.
 */

export { RequestType } from './types';
export type { DailyLimits, UsageStats, LimitCheckResult } from './types';
export type { LimitRepository } from './repository';
