// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { CompaniesModule } from './companies/companies.module';

import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    CompaniesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}