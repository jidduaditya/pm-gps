import { Worker } from 'bullmq';
import { createRedisConnection } from '../lib/redis';
import { runExtractionJob } from './extractionService';
import { runRecommendationJob } from './recommendationService';

export function startWorkers() {
  try {
    const w1 = new Worker('extraction', runExtractionJob, { connection: createRedisConnection() });
    const w2 = new Worker('recommendation', runRecommendationJob, { connection: createRedisConnection() });
    w1.on('error', (err) => console.error('Extraction worker error:', err.message));
    w2.on('error', (err) => console.error('Recommendation worker error:', err.message));
    console.log('BullMQ workers started');
  } catch (err) {
    console.error('Failed to start workers (server continues without job processing):', err);
  }
}
