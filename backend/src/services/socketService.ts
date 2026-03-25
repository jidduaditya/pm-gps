import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join_session', ({ session_id }: { session_id: string }) => {
      socket.join(session_id);
    });
  });

  console.log('Socket.IO initialised');
}

export function getSocketIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}
