import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { KeyWordService } from './keyWordService';
import { keyWordProviders } from './keyWord.provider';

@Module({
  imports: [DatabaseModule],
  providers: [...keyWordProviders, KeyWordService],
  exports: ['KEY_WORD_REPOSITORY', KeyWordService],
})
export class KeyWordModule {}
