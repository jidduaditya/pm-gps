import IORedis from 'ioredis';

const url = process.env.REDIS_URL!;

export const redis = new IORedis(url, {
  maxRetriesPerRequest: null,
  tls: url.startsWith('rediss://') ? {} : undefined,
});
