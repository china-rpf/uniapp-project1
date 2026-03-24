import { Router, Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../../shared/types';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createClassSchema, updateClassSchema, joinClassSchema, classListQuerySchema } from './schema';
import * as classService from './service';

const router = Router();

// POST /classes — 创建班级
router.post(
  '/',
  authMiddleware,
  validate(createClassSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const cls = await classService.createClass(req.body, req.user!.userId);
      res.status(201).json({ code: 200, message: '创建成功', data: cls });
    } catch (err) {
      next(err);
    }
  },
);

// GET /classes — 班级列表
router.get(
  '/',
  authMiddleware,
  validate(classListQuerySchema, 'query'),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { status, page, limit } = req.query as any;
      const result = await classService.listClasses(status, page, limit);
      res.json({ code: 200, message: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },
);

// GET /my/classes — 我的班级
router.get(
  '/my',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const classes = await classService.listMyClasses(req.user!.userId);
      res.json({ code: 200, message: 'ok', data: classes });
    } catch (err) {
      next(err);
    }
  },
);

// GET /classes/:id — 班级详情
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const cls = await classService.getClassDetail(req.params.id);
      res.json({ code: 200, message: 'ok', data: cls });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /classes/:id — 修改班级信息
router.put(
  '/:id',
  authMiddleware,
  validate(updateClassSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const cls = await classService.updateClass(req.params.id, req.body, req.user!.userId);
      res.json({ code: 200, message: '修改成功', data: cls });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /classes/:id — 删除班级
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      await classService.deleteClass(req.params.id, req.user!.userId);
      res.json({ code: 200, message: '删除成功', data: null });
    } catch (err) {
      next(err);
    }
  },
);

// POST /classes/join — 通过邀请码加入班级
router.post(
  '/join',
  authMiddleware,
  validate(joinClassSchema),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const cls = await classService.joinClass(req.body.invite_code, req.user!.userId);
      res.json({ code: 200, message: '加入成功', data: cls });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
