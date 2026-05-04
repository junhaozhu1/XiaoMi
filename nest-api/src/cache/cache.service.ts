import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger('CacheService');

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cache.get<T>(key);
      return value;
    } catch (err: any) {
      this.logger.warn(`Redis GET error: ${err?.message || err}`);
      return undefined;
    }
  }

  async set<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
    try {
      // cache-manager v5 用 ms 表示 TTL
      await this.cache.set(key, data, ttlSeconds * 1000);
    } catch (err: any) {
      this.logger.warn(`Redis SET error: ${err?.message || err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis DEL error: ${err?.message || err}`);
    }
  }

  /**
   * 清空所有缓存
   * 有些 driver 没有提供 reset()，做存在性判断
   */
  async reset(): Promise<void> {
    try {
      // 类型声明中没有 reset，需要用索引访问避免 TS 报错
      const maybeReset = (this.cache as any).reset;
      if (typeof maybeReset === 'function') {
        await maybeReset.call(this.cache);
      } else {
        this.logger.warn('reset() not supported by current cache store');
      }
    } catch (err: any) {
      this.logger.warn(`Redis RESET error: ${err?.message || err}`);
    }
  }
}