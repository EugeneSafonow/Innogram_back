import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { userProviders } from './user.provider';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KeyWordModule } from '../keyWord/keyWordModule';

@Module({
  imports: [DatabaseModule, KeyWordModule],
  providers: [...userProviders, UserService],
  exports: ['USER_REPOSITORY', UserService],
  controllers: [UserController],
})
export class UserModule {}
