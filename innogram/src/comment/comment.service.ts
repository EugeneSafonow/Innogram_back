import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';

@Injectable()
export class CommentService {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private commentRepository: Repository<Comment>,
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}

  async create(
    userId: string,
    photoId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
    });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const comment = this.commentRepository.create({
      text: createCommentDto.text,
      user,
      photo,
    });

    return this.commentRepository.save(comment);
  }

  async findAll(photoId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { photo: { id: photoId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(userId: string, commentId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: {
        id: commentId,
        user: { id: userId },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.commentRepository.remove(comment);
  }

  async updateComment(commentId: number, userId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user']
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new NotFoundException('You can only update your own comments');
    }

    comment.text = updateCommentDto.text;
    return this.commentRepository.save(comment);
  }
}
