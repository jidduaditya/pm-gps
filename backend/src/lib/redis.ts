import IORedis from 'ioredis';

const url = process.env.REDIS_URL!;
const useTls = url.startsWith('rediss://');

/** Shared connection config — each consumer creates its own IORedis instance */
export const redisOpts = {
  maxRetriesPerRequest: null,
  tls: useTls ? { rejectUnauthorized: false } : undefined,
} as const;

/** Create a new IORedis connection with error handling */
export function createRedisConnection(): IORedis {
  const conn = new IORedis(url, redisOpts);
  conn.on('error', (err) => console.error('Redis connection error:', err.message));
  return conn;
}
