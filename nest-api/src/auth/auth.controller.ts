import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DbService } from '../db/db.service';
import { getUidFromRequest } from './auth.util';
import { LoginDto, SignupDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: DbService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login (sets httpOnly cookie uid)' })
  @ApiOkResponse({
    schema: { example: { message: '登录成功', user: { id: 1, email: 'test@example.com' } } },
  })
  @ApiBadRequestResponse({ description: 'Email/Password 不能为空' })
  @ApiNotFoundResponse({ description: '用户邮箱不存在' })
  @ApiUnauthorizedResponse({ description: '密码错误' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: any) {
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
  @ApiOperation({ summary: 'Signup' })
  @ApiCreatedResponse({ schema: { example: { message: '注册成功' } } })
  @ApiBadRequestResponse({ description: 'Email 格式/密码规则/缺字段等' })
  @ApiConflictResponse({ description: '该邮箱已注册' })
  async signup(@Body() body: SignupDto, @Res({ passthrough: true }) res: any) {
    const ret = await this.auth.signup(body);
    res.status(ret.status);
    return { message: ret.message };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (clear cookie)' })
  @ApiOkResponse({ schema: { example: { message: '已退出' } } })
  async logout(@Res({ passthrough: true }) res: any) {
    const cookieName = process.env.COOKIE_NAME || 'uid';
    res.cookie(cookieName, '', { path: '/', maxAge: 0 });
    return { message: '已退出' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user (by cookie uid)' })
  @ApiCookieAuth()
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: 1,
          email: 'a@b.com',
          name: 'Alice',
          role: 'user',
          title: 'Engineer',
          status: 'active',
          location: 'Beijing',
          company: 'OpenAI',
          bio: '...',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: '未登录' })
  @ApiNotFoundResponse({ description: '用户不存在' })
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
  @ApiOperation({ summary: 'Update current user profile (email not allowed)' })
  @ApiCookieAuth()
  @ApiOkResponse({
    schema: {
      example: {
        user: {
          id: 1,
          email: 'a@b.com',
          name: 'New Name',
          role: 'user',
          title: 'SDE',
          status: 'active',
          location: 'Beijing',
          company: 'OpenAI',
          bio: 'hi',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: '未登录' })
  @ApiBadRequestResponse({ description: 'email 不允许修改' })
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