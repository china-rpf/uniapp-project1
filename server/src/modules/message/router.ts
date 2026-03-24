import { Router, Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../../shared/types';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendMessageSchema, getMessagesQuerySchema, createConversationSchema } from './schema';
import * as messageService from './service';

const router = Router();

// ============ Conversation Routes ============

// GET /conversations — List user's conversations
router.get(
  '/',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const conversations = await messageService.listConversations(req.user!.userId);
      res.json({ code: 200, message: 'ok', data: conversations });
    } catch (err) {
      next(err);
    }
  },
);

// POST /conversations — Create private conversation
router.post(
  '/',
  authMiddleware,
  validate(createConversationSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { type, user_id } = req.body;

      if (type === 'private' && user_id) {
        const conversation = await messageService.getOrCreatePrivateConversation(
          req.user!.userId,
          user_id,
        );
        res.json({ code: 200, message: 'ok', data: conversation });
      } else {
        res.status(400).json({ code: 400, message: '不支持的会话类型' });
      }
    } catch (err) {
      next(err);
    }
  },
);

// GET /conversations/:id — Get conversation detail
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const conversation = await messageService.getConversationDetail(
        req.user!.userId,
        req.params.id,
      );
      res.json({ code: 200, message: 'ok', data: conversation });
    } catch (err) {
      next(err);
    }
  },
);

// GET /conversations/:id/messages — Get messages (cursor pagination)
router.get(
  '/:id/messages',
  authMiddleware,
  validate(getMessagesQuerySchema, 'query'),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { cursor, limit } = req.query as any;
      const messages = await messageService.getMessages(
        req.user!.userId,
        req.params.id,
        cursor,
        limit,
      );
      res.json({ code: 200, message: 'ok', data: messages });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /conversations/:id/read — Mark as read
router.put(
  '/:id/read',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await messageService.markAsRead(req.user!.userId, req.params.id);
      res.json({ code: 200, message: '已标记为已读' });
    } catch (err) {
      next(err);
    }
  },
);

// ============ Message Routes (for /messages mount) ============

// POST /messages — Send message
router.post(
  '/send',
  authMiddleware,
  validate(sendMessageSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { conversation_id, type, content, reply_to_id, metadata } = req.body;
      const message = await messageService.sendMessage(
        req.user!.userId,
        conversation_id,
        type,
        content,
        reply_to_id,
        metadata,
      );
      res.status(201).json({ code: 200, message: '发送成功', data: message });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /messages/:id — Recall message
router.delete(
  '/recall/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const message = await messageService.recallMessage(req.user!.userId, req.params.id);
      res.json({ code: 200, message: '已撤回', data: message });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
