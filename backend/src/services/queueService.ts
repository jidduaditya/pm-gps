import { Queue } from 'bullmq';
import { createRedisConnection } from '../lib/redis';

let _extractionQueue: Queue | null = null;
let _recommendationQueue: Queue | null = null;

export function getExtractionQueue(): Queue {
  if (!_extractionQueue) {
    _extractionQueue = new Queue('extraction', { connection: createRedisConnection() });
    _extractionQueue.on('error', (err) => console.error('Extraction queue error:', err.message));
  }
  return _extractionQueue;
}

export function getRecommendationQueue(): Queue {
  if (!_recommendationQueue) {
    _recommendationQueue = new Queue('recommendation', { connection: createRedisConnection() });
    _recommendationQueue.on('error', (err) => console.error('Recommendation queue error:', err.message));
  }
  return _recommendationQueue;
}
