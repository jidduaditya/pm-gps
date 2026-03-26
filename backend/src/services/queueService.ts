import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { redisOpts } from '../lib/redis';

const conn = () => new IORedis(process.env.REDIS_URL!, redisOpts);
export const extractionQueue = new Queue('extraction', { connection: conn() });
export const recommendationQueue = new Queue('recommendation', { connection: conn() });
