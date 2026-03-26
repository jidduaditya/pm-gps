import 'dotenv/config';
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

try {
  startWorkers();
} catch (err) {
  console.error('Worker startup failed (server continues):', err);
}

server.listen(PORT, () => {
  console.log(`PM-GPS Backend running on port ${PORT}`);
});
