import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DbService } from '../db/db.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly jwtService: JwtService,
  ) {}

  async validateLogin(email: string, password: string) {
    const [rows]: any = await this.db.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email],
    );

    if (!rows.length) return { ok: false, status: 404, message: '用户邮箱不存在' };

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return { ok: false, status: 401, message: '密码错误' };

    return { 
      ok: true, 
      user: { 
        id: user.id, 
        email: user.email,
        role: user.role 
      } 
    };
  }

  generateToken(user: { id: number; email: string; role: string }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return this.jwtService.sign(payload);
  }

  // 验证并解析JWT token
  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }

  async signup(body: any) {
    const { email, password, name, title } = body || {};

    const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isValidPassword = (pw: string) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);

    if (!email || !password) return { ok: false, status: 400, message: 'Email/Password 不能为空' };
    if (!isValidEmail(email)) return { ok: false, status: 400, message: 'Email 格式不正确' };
    if (!isValidPassword(password)) return { ok: false, status: 400, message: '密码至少8位，且包含字母和数字' };

    const [exists]: any = await this.db.query('SELECT id FROM users WHERE email=?', [email]);
    if (exists.length) return { ok: false, status: 409, message: '该邮箱已注册' };

    const safeName = typeof name === 'string' ? name.trim().slice(0, 100) : null;
    const safeTitle = typeof title === 'string' ? title.trim().slice(0, 100) : null;

    const hash = await bcrypt.hash(password, 10);

    await this.db.query(
      `INSERT INTO users (email, password_hash, name, title, role, status)
       VALUES (?, ?, ?, ?, 'user', 'active')`,
      [email, hash, safeName, safeTitle],
    );

    return { ok: true, status: 201, message: '注册成功' };
  }
}