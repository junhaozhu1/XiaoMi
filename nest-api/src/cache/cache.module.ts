import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: '127.0.0.1',  // 本地 Redis
            port: 6379,
          },
          ttl: 60 * 5,  // 默认缓存 5 分钟
        }),
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class GlobalCacheModule {}