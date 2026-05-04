import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import {
  CreateCompanyDto,
  ListCompaniesQueryDto,
  UpdateCompanyDto,
} from './dto/company.dto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import Redis from 'ioredis';

function toInt(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

type CompanyRow = RowDataPacket & {
  id: number;
  company_code: string;
  company_name: string;
  level: number;
  country: string;
  city: string;
  founded_year: number;
  annual_revenue: number;
  employees: number;
};

@Injectable()
export class CompaniesService {
  private readonly redis: Redis;
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private readonly db: DbService) {
    // 🚀 初始化 Redis 客户端（不使用 Docker，本地连接）
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
    });
  }

  private getCacheKeyForList(query: ListCompaniesQueryDto) {
    return `companies:list:${JSON.stringify(query)}`;
  }

  private getCacheKeyForId(id: number) {
    return `companies:id:${id}`;
  }

  /** 获取公司列表（带缓存） */
  async list(query: ListCompaniesQueryDto) {
    const cacheKey = this.getCacheKeyForList(query);

    // 1️⃣ Redis 读取缓存
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (e) {
      this.logger.warn(`Redis get failed (${cacheKey}): ${e.message}`);
    }

    // 没有缓存则查数据库
    const page = Math.max(1, toInt(query.page, 1));
    const MAX_PAGE_SIZE = 5000;
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(query.pageSize, 10)));
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];

    if (query.q) {
      where.push(`(company_name LIKE ? OR company_code LIKE ?)`);
      params.push(`%${query.q}%`, `%${query.q}%`);
    }
    if (query.level) {
      where.push(`level = ?`);
      params.push(Number(query.level));
    }
    if (query.country) {
      where.push(`country = ?`);
      params.push(query.country);
    }
    if (query.city) {
      where.push(`city = ?`);
      params.push(query.city);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await this.db.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM companies ${whereSql}`,
      params,
    );
    const total = Number(countRows?.[0]?.total ?? 0);

    const [items] = await this.db.query<CompanyRow[]>(
      `SELECT id, company_code, company_name, level, country, city, founded_year, annual_revenue, employees
       FROM companies
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    const result = { page, pageSize, total, items };

    // 2️⃣ 写入缓存（300 秒）
    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    } catch (e) {
      this.logger.warn(`Redis set failed (${cacheKey}): ${e.message}`);
    }

    return result;
  }

  /** 获取单个公司（带缓存） */
  async getById(id: number) {
    const cacheKey = this.getCacheKeyForId(id);

    // 1️⃣ Cache lookup
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (e) {
      this.logger.warn(`Redis get failed (${cacheKey}): ${e.message}`);
    }

    // 2️⃣ Query DB
    const [rows] = await this.db.query<CompanyRow[]>(
      `SELECT id, company_code, company_name, level, country, city, founded_year, annual_revenue, employees
       FROM companies WHERE id=? LIMIT 1`,
      [id],
    );
    const item = rows?.[0];
    if (!item) throw new NotFoundException('Company not found');

    // 3️⃣ Cache set
    try {
      await this.redis.set(cacheKey, JSON.stringify(item), 'EX', 300);
    } catch (e) {
      this.logger.warn(`Redis set failed (${cacheKey}): ${e.message}`);
    }

    return item;
  }

  // 备用：通过 company_code 获取
  async getByCode(code: string) {
    const [rows] = await this.db.query<CompanyRow[]>(
      `SELECT id, company_code, company_name, level, country, city, founded_year, annual_revenue, employees
       FROM companies WHERE company_code=? LIMIT 1`,
      [code],
    );
    const item = rows?.[0];
    if (!item) throw new NotFoundException('Company not found');
    return item;
  }

  /** 创建公司（清除缓存） */
  async create(dto: CreateCompanyDto) {
    try {
      const [ret] = await this.db.query<ResultSetHeader>(
        `INSERT INTO companies
         (company_code, company_name, level, country, city, founded_year, annual_revenue, employees)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.company_code,
          dto.company_name,
          dto.level,
          dto.country,
          dto.city,
          dto.founded_year,
          dto.annual_revenue,
          dto.employees,
        ],
      );

      const created = await this.getById(ret.insertId as any);

      // 🔁 清除所有列表缓存
      await this.redis.keys('companies:list:*').then(keys => {
        if (keys.length) this.redis.del(keys);
      });

      return created;
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY')
        throw new BadRequestException('company_code already exists');
      throw e;
    }
  }

  /** 更新公司（清除对应缓存） */
  async update(id: number, dto: UpdateCompanyDto) {
    const entries = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (!entries.length) throw new BadRequestException('No fields to update');

    const setSql = entries.map(([k]) => `${k}=?`).join(', ');
    const params = entries.map(([, v]) => v);

    const [ret] = await this.db.query<ResultSetHeader>(
      `UPDATE companies SET ${setSql} WHERE id=?`,
      [...params, id],
    );

    if (ret.affectedRows === 0) throw new NotFoundException('Company not found');
    const updated = await this.getById(id);

    // 清除此公司与所有列表缓存
    await Promise.all([
      this.redis.del(this.getCacheKeyForId(id)),
      this.redis.keys('companies:list:*').then(keys => {
        if (keys.length) this.redis.del(keys);
      }),
    ]);

    return updated;
  }

  /** 删除公司（清除缓存） */
  async remove(id: number) {
    const [ret] = await this.db.query<ResultSetHeader>(
      `DELETE FROM companies WHERE id=?`,
      [id],
    );
    if (ret.affectedRows === 0)
      throw new NotFoundException('Company not found');

    // 清除缓存
    await Promise.all([
      this.redis.del(this.getCacheKeyForId(id)),
      this.redis.keys('companies:list:*').then(keys => {
        if (keys.length) this.redis.del(keys);
      }),
    ]);

    return { ok: true };
  }
}