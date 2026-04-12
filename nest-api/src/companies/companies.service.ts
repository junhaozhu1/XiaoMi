import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from './dto/company.dto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

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
  constructor(private readonly db: DbService) {}

  async list(query: ListCompaniesQueryDto) {
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

    return { page, pageSize, total, items };
  }

  async getById(id: number) {
    const [rows] = await this.db.query<CompanyRow[]>(
      `SELECT id, company_code, company_name, level, country, city, founded_year, annual_revenue, employees
       FROM companies WHERE id=? LIMIT 1`,
      [id],
    );
    const item = rows?.[0];
    if (!item) throw new NotFoundException('Company not found');
    return item;
  }

  // 备用（可选）
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

      return this.getById(ret.insertId as any);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw new BadRequestException('company_code already exists');
      throw e;
    }
  }

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
    return this.getById(id);
  }

  async remove(id: number) {
    const [ret] = await this.db.query<ResultSetHeader>(`DELETE FROM companies WHERE id=?`, [id]);
    if (ret.affectedRows === 0) throw new NotFoundException('Company not found');
    return { ok: true };
  }
}