import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Publication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column({ unique: true })
  image_url: string;

  @Column()
  is_public: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
