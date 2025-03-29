import { DataSource } from 'typeorm';
import { KeyWord } from '../entities/keyWord.entity';

export const keyWordProviders = [
  {
    provide: 'KEY_WORD_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(KeyWord),
    inject: ['DATA_SOURCE'],
  },
];
