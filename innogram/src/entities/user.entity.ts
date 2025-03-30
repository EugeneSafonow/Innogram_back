import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Photo } from './photo.entity';
import { KeyWord } from './keyWord.entity';
import { Like } from './like.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @OneToMany(() => Photo, (photo) => photo.user, { eager: false })
  photos: Photo[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @ManyToMany(() => KeyWord, (keyWord) => keyWord.users, { cascade: true })
  @JoinTable()
  interests: KeyWord[];

  @CreateDateColumn()
  created_at: Date;
}
