import { Repository } from 'typeorm';
import { Like } from '../entities/like.entity';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';

export const likeProviders = [
  {
    provide: 'LIKE_REPOSITORY',
    useFactory: (dataSource) => dataSource.getRepository(Like),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'PHOTO_REPOSITORY',
    useFactory: (dataSource) => dataSource.getRepository(Photo),
    inject: ['DATA_SOURCE'],
  },
];
