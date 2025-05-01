import { Module } from '@nestjs/common';
import { InterestService } from './interest.service';
import { KeyWordModule } from '../keyWord/keyWordModule';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from '../database/database.module';
import { userProviders } from '../user/user.provider';
import { InterestController } from './interest.controller';

@Module({
  imports: [
    DatabaseModule,
    KeyWordModule,
    UserModule,
  ],
  providers: [
    ...userProviders,
    InterestService,
  ],
  controllers: [InterestController],
  exports: [InterestService],
})
export class InterestModule {} 
 