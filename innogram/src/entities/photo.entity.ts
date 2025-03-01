import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column({ unique: true })
  image_url: string;

  @Column({ unique: true })
  key: string;

  @Column()
  is_public: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
