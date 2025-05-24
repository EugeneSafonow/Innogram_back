import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cors from 'cors';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const port = config.get('PORT') || 4000;

  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    }),
  );

  await app.listen(port, async () => {
    console.log(`[Server started on port ${port}]`);

    if (config.get('SEED_DB') === 'true') {
      const seedService = app.get(SeedService);
      await seedService.seed();
    }
  });
}
bootstrap();
