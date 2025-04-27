import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { Collection } from '../entities/collection.entity';
import { KeyWord } from '../entities/keyWord.entity';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { Favorite } from '../entities/favorite.entity';

export const entitiesProviders = [
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'PHOTO_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Photo),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'COLLECTION_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Collection),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'KEYWORD_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(KeyWord),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'LIKE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Like),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'COMMENT_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Comment),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'FAVORITE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Favorite),
    inject: ['DATA_SOURCE'],
  },
]; 
