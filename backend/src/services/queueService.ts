import { Queue } from 'bullmq';
import { createRedisConnection } from '../lib/redis';

export const extractionQueue = new Queue('extraction', { connection: createRedisConnection() });
export const recommendationQueue = new Queue('recommendation', { connection: createRedisConnection() });

extractionQueue.on('error', (err) => console.error('Extraction queue error:', err.message));
recommendationQueue.on('error', (err) => console.error('Recommendation queue error:', err.message));
