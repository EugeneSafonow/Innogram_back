import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { DatabaseModule } from 'src/database/database.module';
import { likeProviders } from './like.provider';
import { InterestModule } from '../interest/interest.module';

@Module({
  imports: [DatabaseModule, InterestModule],
  controllers: [LikeController],
  providers: [...likeProviders, LikeService],
  exports: [LikeService],
})
export class LikeModule {}
