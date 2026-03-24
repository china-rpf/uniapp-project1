import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { JwtPayload, UserRow } from '../../shared/types';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import * as authRepo from './repository';
import { UpdateProfileInput } from './schema';

interface WxSessionResponse {
  openid: string;
  session_key: string;
  errcode?: number;
  errmsg?: string;
}

export async function wxLogin(code: string): Promise<{ token: string; user: UserRow; isNew: boolean }> {
  let openid: string;

  // Development mode: bypass WeChat API
  if (config.nodeEnv === 'development' && !config.wx.appId) {
    // uni.login() returns a different code each time, so we can't use it as openid.
    // Instead, use a stable default dev openid. For multi-user testing, use /auth/test-login.
    console.log('[DEV MODE] Bypassing WeChat login, code:', code);
    openid = 'dev_wx_user';
  } else {
    // Production: Call WeChat API to exchange code for openid
    const wxUrl = 'https://api.weixin.qq.com/sns/jscode2session';
    const { data } = await axios.get<WxSessionResponse>(wxUrl, {
      params: {
        appid: config.wx.appId,
        secret: config.wx.secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    if (data.errcode) {
      throw new BadRequestError(`微信登录失败: ${data.errmsg}`);
    }

    openid = data.openid;
  }

  // Find or create user
  let user = await authRepo.findByOpenid(openid);
  let isNew = false;

  if (!user) {
    user = await authRepo.createUser(openid);
    isNew = true;
  }

  // Generate JWT
  const payload: JwtPayload = { userId: user.id, openid: user.wx_openid };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);

  return { token, user, isNew };
}

// H5 测试登录（仅开发环境）
export async function testLogin(username: string): Promise<{ token: string; user: UserRow; isNew: boolean }> {
  if (config.nodeEnv !== 'development') {
    throw new BadRequestError('测试登录仅在开发环境可用');
  }

  // 使用用户名生成唯一的 openid
  const openid = `test_${username}`;

  // 查找或创建用户
  let user = await authRepo.findByOpenid(openid);
  let isNew = false;

  if (!user) {
    user = await authRepo.createUser(openid);
    // 设置默认昵称
    await authRepo.updateProfile(user.id, { nickname: username });
    user = await authRepo.findById(user.id) as UserRow;
    isNew = true;
  }

  // 生成 JWT
  const payload: JwtPayload = { userId: user.id, openid: user.wx_openid };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);

  return { token, user, isNew };
}

export async function getMe(userId: string): Promise<UserRow> {
  const user = await authRepo.findById(userId);
  if (!user) throw new NotFoundError('用户不存在');
  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<UserRow> {
  const user = await authRepo.updateProfile(userId, data);
  if (!user) throw new NotFoundError('用户不存在');
  return user;
}
