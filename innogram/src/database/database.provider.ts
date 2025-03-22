import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { Tag } from '../entities/tag.entity';

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
        entities: [User, Photo, Tag],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
