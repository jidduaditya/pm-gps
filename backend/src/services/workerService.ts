import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { redisOpts } from '../lib/redis';
import { runExtractionJob } from './extractionService';
import { runRecommendationJob } from './recommendationService';

export function startWorkers() {
  const conn = () => new IORedis(process.env.REDIS_URL!, redisOpts);
  new Worker('extraction', runExtractionJob, { connection: conn() });
  new Worker('recommendation', runRecommendationJob, { connection: conn() });
  console.log('BullMQ workers started');
}
