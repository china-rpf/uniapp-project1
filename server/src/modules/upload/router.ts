import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { AuthRequest, ApiResponse } from '../../shared/types';
import { authMiddleware } from '../../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/opt/vc/uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created upload directory: ${UPLOAD_DIR}`);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Ensure directory exists before saving
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(16).toString('hex') + ext;
    console.log(`Uploading file: ${file.originalname} -> ${name}`);
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp3|wav|aac|m4a|amr|mp4|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      console.log(`Rejected file type: ${path.extname(file.originalname)}`);
      cb(new Error('不支持的文件格式'));
    }
  },
});

const router = Router();

// POST /upload - 上传文件
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      console.log('Upload request received, file:', req.file);

      if (!req.file) {
        console.log('No file in request');
        res.status(400).json({ code: 400, message: '未选择文件', data: null });
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log(`File uploaded successfully: ${fileUrl}`);

      res.json({
        code: 200,
        message: '上传成功',
        data: {
          url: fileUrl,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (err) {
      console.error('Upload error:', err);
      next(err);
    }
  },
);

export default router;
export { UPLOAD_DIR };
