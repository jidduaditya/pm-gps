import { Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { runExtractionJob } from './extractionService';
import { runRecommendationJob } from './recommendationService';

export function startWorkers() {
  new Worker('extraction', runExtractionJob, { connection: redis });
  new Worker('recommendation', runRecommendationJob, { connection: redis });
  console.log('BullMQ workers started');
}
