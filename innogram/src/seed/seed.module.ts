import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { DatabaseModule } from '../database/database.module';
import { S3Module } from '../s3/s3.module';
import { entitiesProviders } from '../providers/entities.providers';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    S3Module,
    ConfigModule,
  ],
  providers: [
    ...entitiesProviders,
    SeedService,
  ],
  exports: [SeedService],
})
export class SeedModule {} 
