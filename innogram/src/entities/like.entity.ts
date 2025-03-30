import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.likes, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Photo, (photo) => photo.likes, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'photoId' })
  photo: Photo;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
