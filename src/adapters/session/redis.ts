import Redis from 'ioredis';

/**
 * Create and configure Redis client for session storage
 * Handles reconnection, error handling, and event logging
 */
export function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(url, {
    // Reconnection strategy: exponential backoff up to 2 seconds
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`[Redis] Reconnection attempt ${times}, delay ${delay}ms`);
      return delay;
    },

    // Connection timeout
    connectTimeout: 10000,

    // Enable offline queue: queue commands while reconnecting
    enableOfflineQueue: true,

    // Maximum retries per request
    maxRetriesPerRequest: 3,
  });

  // Event handlers for logging and monitoring
  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.on('error', (err) => {
    console.error('[Redis] Error:', err);
  });

  client.on('ready', () => {
    console.log('[Redis] Ready');
  });

  client.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
  });

  return client;
}
