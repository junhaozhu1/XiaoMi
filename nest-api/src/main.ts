import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // cookie
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // DTO 校验 + 类型转换（query string -> number）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const cookieName = process.env.COOKIE_NAME || 'uid';
  const config = new DocumentBuilder()
    .setTitle('Backend Service API')
    .setDescription('Auth + Companies APIs')
    .setVersion('1.0.0')
    .addCookieAuth(cookieName, { type: 'apiKey', in: 'cookie', name: cookieName })
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 4100;
  await app.listen(port);
}
bootstrap();