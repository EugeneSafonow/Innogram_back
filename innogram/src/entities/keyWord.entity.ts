import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Photo } from './photo.entity';
import { User } from './user.entity';

@Entity("keywords")
export class KeyWord {
  @PrimaryGeneratedColumn()
  id: number; //TODO TO UUID

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Photo, (photo) => photo.keyWords)
  @JoinTable()
  photos: Photo[];

  @ManyToMany(() => User, (user) => user.interests)
  users: User[];
}
