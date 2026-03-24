import { Router, Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../../shared/types';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { friendRequestSchema, respondFriendSchema, listFriendsQuerySchema } from './schema';
import * as friendshipService from './service';

const router = Router();

// GET /friends — List friends
router.get(
  '/',
  authMiddleware,
  validate(listFriendsQuerySchema, 'query'),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { type, status } = req.query as any;
      const friends = await friendshipService.listFriends(req.user!.userId, type, status);
      res.json({ code: 200, message: 'ok', data: friends });
    } catch (err) {
      next(err);
    }
  },
);

// GET /friends/pending — Get pending received requests
router.get(
  '/pending',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const pending = await friendshipService.getPendingReceived(req.user!.userId);
      res.json({ code: 200, message: 'ok', data: pending });
    } catch (err) {
      next(err);
    }
  },
);

// POST /friends/request — Send friend request
router.post(
  '/request',
  authMiddleware,
  validate(friendRequestSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { user_id, type } = req.body;
      const friendship = await friendshipService.sendFriendRequest(
        req.user!.userId,
        user_id,
        type,
      );
      res.status(201).json({ code: 200, message: '好友请求已发送', data: friendship });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /friends/:userId/respond — Accept/reject friend request
router.put(
  '/:userId/respond',
  authMiddleware,
  validate(respondFriendSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { accept } = req.body;
      const friendship = await friendshipService.respondFriendRequest(
        req.user!.userId,
        req.params.userId,
        accept,
      );
      res.json({
        code: 200,
        message: accept ? '已成为好友' : '已拒绝',
        data: friendship,
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /friends/:userId — Delete friend
router.delete(
  '/:userId',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await friendshipService.deleteFriend(req.user!.userId, req.params.userId);
      res.json({ code: 200, message: '已删除好友' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
