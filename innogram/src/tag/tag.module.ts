import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TagService } from './tag.service.';
import { tagProviders } from './tag.provider';

@Module({
  imports: [DatabaseModule],
  providers: [...tagProviders, TagService],
  exports: ['TAGS_REPOSITORY', TagService],
})
export class TagModule {}
