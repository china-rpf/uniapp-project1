import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';
import { ApiResponse } from '../shared/types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      code: 400,
      message: '请求参数验证失败',
    });
  }

  return res.status(500).json({
    code: 500,
    message: '服务器内部错误',
  });
}
