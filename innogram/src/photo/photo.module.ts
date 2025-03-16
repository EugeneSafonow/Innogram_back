import { Module } from '@nestjs/common';
import { photoProviders } from './photo.provider';
import { PhotoController } from './photo.controller';
import { DatabaseModule } from '../database/database.module';
import { PhotoService } from './photo.service';
import { S3Service } from '../s3/s3.service';
import { S3Module } from '../s3/s3.module';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [DatabaseModule, S3Module, UserModule],
  controllers: [PhotoController],
  providers: [...photoProviders, PhotoService, S3Service, UserService],
})
export class PhotoModule {}
