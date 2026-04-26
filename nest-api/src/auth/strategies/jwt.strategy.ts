import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DbService } from '../../db/db.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly db: DbService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const [rows]: any = await this.db.query(
      'SELECT id, email, role FROM users WHERE id = ?',
      [payload.sub],
    );

    if (!rows.length) {
      throw new UnauthorizedException('User not found');
    }

    return { userId: rows[0].id, email: rows[0].email, role: rows[0].role };
  }
}