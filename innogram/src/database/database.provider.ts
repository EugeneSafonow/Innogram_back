import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { KeyWord } from '../entities/keyWord.entity';
import { Like } from 'src/entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { Favorite } from '../entities/favorite.entity';
import { Collection } from '../entities/collection.entity';
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
        entities: [User, Photo, KeyWord, Like, Comment, Favorite, Collection],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
