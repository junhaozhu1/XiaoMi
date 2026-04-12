import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DbService } from '../db/db.service';
import { getUidFromRequest } from './auth.util';

@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DbService,
  ) {}

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: any) {
    const { email, password } = body || {};
    if (!email || !password) {
      res.status(400);
      return { message: 'Email/Password 不能为空' };
    }

    const result = await this.auth.validateLogin(email, password);
    if (!result.ok) {
        res.status(result.status);
        return { message: result.message };
    }

    const cookieName = process.env.COOKIE_NAME || 'uid';
    const maxAgeSec = Number(process.env.COOKIE_MAX_AGE || 60 * 60 * 24 * 7);

    if (!result.user) {
    res.status(500);
        return { message: '服务器错误：登录结果缺少用户信息' };
    }
    res.cookie(cookieName, String(result.user.id), {
    httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: maxAgeSec * 1000,
    });

    return { message: '登录成功', user: result.user };
  }

  @Post('signup')
  async signup(@Body() body: any, @Res({ passthrough: true }) res: any) {
    const ret = await this.auth.signup(body);
    res.status(ret.status);
    return { message: ret.message };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    const cookieName = process.env.COOKIE_NAME || 'uid';
    res.cookie(cookieName, '', { path: '/', maxAge: 0 });
    return { message: '已退出' };
  }

  @Get('me')
  async me(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const uid = getUidFromRequest(req);
    if (!uid) {
      res.status(401);
      return { message: '未登录' };
    }

    const [rows]: any = await this.db.query(
      `SELECT id, email, name, role, title, status, location, company, bio
       FROM users WHERE id=?`,
      [uid],
    );

    if (!rows.length) {
      res.status(404);
      return { message: '用户不存在' };
    }

    return { user: rows[0] };
  }

  @Patch('me')
  async patchMe(@Req() req: any, @Body() body: any, @Res({ passthrough: true }) res: any) {
    const uid = getUidFromRequest(req);
    if (!uid) {
      res.status(401);
      return { message: '未登录' };
    }

    if (body?.email && String(body.email).trim() !== '') {
      res.status(400);
      return { message: 'email 不允许修改' };
    }

    await this.db.query(
      `UPDATE users SET name=?, title=?, location=?, company=?, bio=? WHERE id=?`,
      [body?.name ?? null, body?.title ?? null, body?.location ?? null, body?.company ?? null, body?.bio ?? null, uid],
    );

    const [rows]: any = await this.db.query(
      `SELECT id, email, name, role, title, status, location, company, bio
       FROM users WHERE id=?`,
      [uid],
    );

    return { user: rows[0] };
  }
}