import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';

export const commentProviders = [
  {
    provide: 'COMMENT_REPOSITORY',
    useFactory: (dataSource) => dataSource.getRepository(Comment),
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
