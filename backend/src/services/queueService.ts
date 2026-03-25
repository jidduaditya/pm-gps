import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export const extractionQueue = new Queue('extraction', { connection: redis });
export const recommendationQueue = new Queue('recommendation', { connection: redis });
