import { DataSource } from 'typeorm';
import { Tag } from '../entities/tag.entity';

export const tagProviders = [
  {
    provide: 'TAGS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Tag),
    inject: ['DATA_SOURCE'],
  },
];
