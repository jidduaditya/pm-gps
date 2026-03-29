import 'dotenv/config';

// Validate required env vars before any module creates connections
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
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

server.listen(PORT, () => {
  console.log(`PM-GPS Backend listening on port ${PORT}`);
});
