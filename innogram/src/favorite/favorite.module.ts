import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { favoriteProviders } from './favorite.providers';
import { FavoriteController } from './favorite.controller';
import { DatabaseModule } from '../database/database.module';
import { InterestModule } from '../interest/interest.module';

@Module({
  imports: [DatabaseModule, InterestModule],
  controllers: [FavoriteController],
  providers: [FavoriteService, ...favoriteProviders],
  exports: [FavoriteService],
})
export class FavoriteModule {}
