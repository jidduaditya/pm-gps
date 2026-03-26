import 'dotenv/config';

// Validate required env vars before any module creates connections
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'REDIS_URL'];
for (const key of required) {
  if (!process.env[key]?.trim()) {
    console.error(`FATAL: Missing or empty env var: ${key}`);
    process.exit(1);
  }
}
console.log('ENV check passed');

import http from 'http';
import { app } from './app';
import { initSocket } from './services/socketService';
import { startWorkers } from './services/workerService';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);
console.log('Routes and Socket.IO registered');

try {
  startWorkers();
} catch (err) {
  console.error('Worker startup failed (server continues):', err);
}

server.listen(PORT, () => {
  console.log(`PM-GPS Backend listening on port ${PORT}`);
});
