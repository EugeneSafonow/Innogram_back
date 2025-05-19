import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { KeyWord } from '../entities/keyWord.entity';
import { Like } from 'src/entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { Favorite } from '../entities/favorite.entity';
import { Collection } from '../entities/collection.entity';
import { ConfigService } from '@nestjs/config';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async (configService: ConfigService) => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'admin'),
        password: configService.get<string>('DB_PASSWORD', '1234'),
        database: configService.get<string>('DB_DATABASE', 'innogram'),
        entities: [User, Photo, KeyWord, Like, Comment, Favorite, Collection],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      });

      return dataSource.initialize();
    },
    inject: [ConfigService],
  },
];
