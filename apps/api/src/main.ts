import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
