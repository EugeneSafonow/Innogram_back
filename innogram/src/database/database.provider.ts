import { DataSource } from 'typeorm';
import { Photo } from '../entities/photo.entity';
import { User } from '../entities/user.entity';

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
        entities: [User, Photo],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
