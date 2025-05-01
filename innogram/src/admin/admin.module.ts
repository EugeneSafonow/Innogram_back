import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserController } from './admin-user.controller';
import { AdminPhotoController } from './admin-photo.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { KeyWord } from '../entities/keyWord.entity';
import { PhotoService } from '../photo/photo.service';
import { KeyWordModule } from 'src/keyWord/keyWordModule';
import { PhotoModule } from 'src/photo/photo.module';
import { UserModule } from 'src/user/user.module';
import { photoProviders } from 'src/photo/photo.provider';
import { userProviders } from 'src/user/user.provider';
import { DatabaseModule } from 'src/database/database.module';
import { S3Module } from 'src/s3/s3.module';
import { S3Service } from 'src/s3/s3.service';
import { InterestModule } from 'src/interest/interest.module';
import { InterestService } from 'src/interest/interest.service';
@Module({
  imports: [
    KeyWordModule,
    PhotoModule,
    UserModule,
    DatabaseModule,
    S3Module,
    InterestModule
  ],
  controllers: [AdminUserController, AdminPhotoController],
  providers: [AdminService, PhotoService, S3Service, InterestService,  ...photoProviders, ...userProviders]
})
export class AdminModule {}
