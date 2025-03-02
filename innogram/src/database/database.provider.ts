import { DataSource } from 'typeorm';
import { Photo } from '../entities/photo.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: '1234',
        database: 'db',
        entities: [Photo],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
