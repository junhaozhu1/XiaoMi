import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import type { QueryResult } from 'mysql2/promise';

@Injectable()
export class DbService {
  private pool: mysql.Pool | null = null;

  private getPool() {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
      });
    }
    return this.pool;
  }

  query<T extends QueryResult = QueryResult>(sql: string, params?: any[]) {
    return this.getPool().query<T>(sql, params);
  }
}