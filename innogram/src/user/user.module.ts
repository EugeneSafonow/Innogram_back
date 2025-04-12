import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { userProviders } from './user.provider';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KeyWordModule } from '../keyWord/keyWordModule';
import { S3Module } from '../s3/s3.module';
import { S3Service } from 'src/s3/s3.service';
@Module({
  imports: [DatabaseModule, KeyWordModule, S3Module],
  providers: [...userProviders, UserService, S3Service],
  exports: ['USER_REPOSITORY', UserService],
  controllers: [UserController],
})
export class UserModule {}
