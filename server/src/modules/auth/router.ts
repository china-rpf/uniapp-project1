import { Router, Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../../shared/types';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { wxLoginSchema, updateProfileSchema } from './schema';
import * as authService from './service';

const router = Router();

// POST /auth/wx-login
router.post(
  '/wx-login',
  validate(wxLoginSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { code } = req.body;
      const result = await authService.wxLogin(code);
      res.json({
        code: 200,
        message: '登录成功',
        data: {
          token: result.token,
          user: result.user,
          isNew: result.isNew,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /auth/test-login (H5 测试登录，仅开发环境)
router.post(
  '/test-login',
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { username } = req.body;
      if (!username || typeof username !== 'string') {
        res.status(400).json({ code: 400, message: '请输入用户名' });
        return;
      }
      const result = await authService.testLogin(username);
      res.json({
        code: 200,
        message: '登录成功',
        data: {
          token: result.token,
          user: result.user,
          isNew: result.isNew,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /auth/me
router.get(
  '/me',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({
        code: 200,
        message: 'ok',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /auth/profile
router.put(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      res.json({
        code: 200,
        message: '更新成功',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
