import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { KeyWord } from './keyWord.entity';
import { Like } from './like.entity';
import { Comment } from './comment.entity';
import { Favorite } from './favorite.entity';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number; //TODO TO UUID

  @Column()
  description: string;

  @Column({ unique: true })
  key: string;

  @Column()
  is_public: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.photos, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToMany(() => KeyWord, (keyWord) => keyWord.photos, {
    onDelete: 'CASCADE',
  })
  keyWords: KeyWord[];

  @OneToMany(() => Like, (like: Like) => like.photo, {
    onDelete: 'CASCADE',
  })
  likes: Like[];

  @OneToMany(() => Comment, (comment) => comment.photo, {
    onDelete: 'CASCADE',
  })
  comments: Comment[];

  @OneToMany(() => Favorite, (favorite) => favorite.photo, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  favorites: Favorite[];
}
