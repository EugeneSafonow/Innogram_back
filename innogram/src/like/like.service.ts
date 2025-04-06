import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Like } from '../entities/like.entity';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { CreateLikeDto } from './dto/createLike.dto';

@Injectable()
export class LikeService {
  constructor(
    @Inject('LIKE_REPOSITORY')
    private likeRepository: Repository<Like>,
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}

  async create(userId: string, createLikeDto: CreateLikeDto): Promise<Like> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !userId) {
      throw new NotFoundException('User is not found');
    }

    const photo = await this.photoRepository.findOne({
      where: { id: createLikeDto.photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo is not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: {
        user: { id: userId },
        photo: { id: createLikeDto.photoId },
      },
    });

    if (existingLike) {
      throw new ConflictException('Like is already made');
    }

    const like = this.likeRepository.create({
      user,
      photo,
    });

    return this.likeRepository.save(like);
  }

  async remove(userId: string, photoId: number): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: {
        user: { id: userId },
        photo: { id: photoId },
      },
    });

    if (!like) {
      throw new NotFoundException('Like is not found');
    }

    await this.likeRepository.remove(like);
  }

  async getPhotoLikes(photoId: number): Promise<number> {
    return this.likeRepository.count({
      where: {
        photo: { id: photoId },
      },
    });
  }

  async hasUserLiked(userId: string, photoId: number): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: {
        user: { id: userId },
        photo: { id: photoId },
      },
    });

    return !!like;
  }
}
