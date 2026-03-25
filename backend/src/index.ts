import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { initSocket } from './services/socketService';
import { startWorkers } from './services/workerService';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);
startWorkers();

server.listen(PORT, () => {
  console.log(`PM-GPS Backend running on port ${PORT}`);
});
