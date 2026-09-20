import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('PalmPay Design Hub API')
      .setVersion('1.0')
      .addApiKey(
        { type: 'apiKey', in: 'header', name: 'x-dev-user-email' },
        'development-user-email',
      )
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(Number(process.env.PORT ?? 3001), process.env.AUTH_MODE === 'ppcb' ? '127.0.0.1' : '0.0.0.0');
}

void bootstrap();
