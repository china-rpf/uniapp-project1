import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../shared/types';
import { redisClient } from '../db/redis';
import * as messageService from '../modules/message/service';
import * as messageRepo from '../modules/message/repository';

interface AuthSocket extends Socket {
  userId: string;
}

let io: Server;

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('未提供认证令牌'));
    }
    try {
      const payload = jwt.verify(token as string, config.jwt.secret) as JwtPayload;
      (socket as AuthSocket).userId = payload.userId;
      next();
    } catch {
      next(new Error('认证令牌无效'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthSocket;
    const userId = authSocket.userId;
    console.log(`User connected: ${userId}`);

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // Mark user online
    redisClient.set(`online:${userId}`, socket.id, { EX: 86400 }).catch(() => {});

    // Join class rooms
    socket.on('class:join_room', (classId: string) => {
      socket.join(`class:${classId}`);
      console.log(`User ${userId} joined room class:${classId}`);
    });

    socket.on('class:leave_room', (classId: string) => {
      socket.leave(`class:${classId}`);
    });

    // Join conversation room
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Chat: send message
    socket.on('chat:send', async (data: { conversation_id: string; type: string; content: string; reply_to_id?: string }) => {
      try {
        const message = await messageService.sendMessage(
          userId,
          data.conversation_id,
          data.type || 'text',
          data.content,
          data.reply_to_id,
        );

        // Broadcast to conversation room
        io.to(`conversation:${data.conversation_id}`).emit('chat:message', message);
      } catch (err: any) {
        socket.emit('error', { event: 'chat:send', message: err.message });
      }
    });

    // Chat: typing indicator
    socket.on('chat:typing', (data: { conversation_id: string }) => {
      socket.to(`conversation:${data.conversation_id}`).emit('chat:typing', {
        user_id: userId,
        conversation_id: data.conversation_id,
      });
    });

    // Chat: recall message
    socket.on('chat:recall', async (data: { message_id: string; conversation_id: string }) => {
      try {
        const message = await messageService.recallMessage(userId, data.message_id);
        io.to(`conversation:${data.conversation_id}`).emit('chat:recalled', {
          message_id: data.message_id,
          conversation_id: data.conversation_id,
        });
      } catch (err: any) {
        socket.emit('error', { event: 'chat:recall', message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      redisClient.del(`online:${userId}`).catch(() => {});
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Emit helpers
export function emitToClass(classId: string, event: string, data: any) {
  getIO().to(`class:${classId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: any) {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToConversation(conversationId: string, event: string, data: any) {
  getIO().to(`conversation:${conversationId}`).emit(event, data);
}
