import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { collectionProviders } from './collection.provider';
import { photoProviders } from '../photo/photo.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [CollectionService, ...collectionProviders, ...photoProviders],
  controllers: [CollectionController],
  exports: [CollectionService],
})
export class CollectionModule {}
