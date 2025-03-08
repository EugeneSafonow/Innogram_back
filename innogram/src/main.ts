import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const port = config.get('PORT') || 4000;

  app.use(
    cors({
      origin: ['http://localhost:3000', 'https://your-production-site.com'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    }),
  );

  await app.listen(port, () => {
    console.log(`[Server started on port ${port}]`);
  });
}
bootstrap();
