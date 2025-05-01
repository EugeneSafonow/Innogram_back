import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ type: 'jsonb', nullable: true })
  photoOrder: { [key: string]: number };

  @ManyToOne(() => User, (user) => user.collections, { onDelete: 'CASCADE'})
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => Photo, (photo) => photo.collections)
  @JoinTable({
    name: 'collection_photos',
    joinColumn: {
      name: 'collection_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'photo_id',
      referencedColumnName: 'id',
    },
  })
  photos: Photo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
