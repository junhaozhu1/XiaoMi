import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4100);
}
bootstrap();