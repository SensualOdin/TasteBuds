import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { setupSessionHandlers } from './sessionHandler';

interface SocketData {
  userId: string;
  sessionId?: string;
  groupId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.data = { userId: decoded.userId } as SocketData;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User ${socket.data.userId} connected`);

    // Setup session handlers
    setupSessionHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.userId} disconnected`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}; 