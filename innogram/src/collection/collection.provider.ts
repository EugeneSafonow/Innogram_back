import { DataSource } from 'typeorm';
import { Collection } from '../entities/collection.entity';

export const collectionProviders = [
  {
    provide: 'COLLECTION_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Collection),
    inject: ['DATA_SOURCE'],
  },
];
