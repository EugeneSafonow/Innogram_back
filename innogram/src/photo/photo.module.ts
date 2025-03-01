import { Module } from '@nestjs/common';
import { photoProviders } from './photo.provider';
import { PhotoController } from './photo.controller';
import { DatabaseModule } from '../database/database.module';
import { PhotoService } from './photo.service';
import { S3Service } from '../s3/s3.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [DatabaseModule, S3Module],
  controllers: [PhotoController],
  providers: [...photoProviders, PhotoService, S3Service],
})
export class PhotoModule {}
