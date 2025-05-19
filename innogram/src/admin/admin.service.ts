import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { Repository, Like, ILike } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { PaginationOptions, PaginatedResponse } from './dto/pagination.dto';
import { S3Service } from '../s3/s3.service';
import { Comment } from '../entities/comment.entity';
import { UpdateCommentDto } from '../comment/dto/updateComment.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,

    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,

    @Inject('COMMENT_REPOSITORY')
    private commentRepository: Repository<Comment>,

    private readonly s3Service: S3Service,
  ) {}

  // User-related methods
  async getAllUsers(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<User>> {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'email', 'username', 'avatarKey', 'role', 'created_at'],
      order: { created_at: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });

    return {
      data: users,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async searchUsers(
    options: PaginationOptions,
    searchTerm: string,
  ): Promise<PaginatedResponse<User>> {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'email', 'username', 'avatarKey', 'role', 'created_at'],
      where: [
        { username: Like(`%${searchTerm}%`) },
        { email: Like(`%${searchTerm}%`) },
      ],
      order: { created_at: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });

    return {
      data: users,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'avatarKey', 'role', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  // Helper methods for role validation
  validateRequesterCanModifyUser(
    requesterRole: UserRole,
    targetUserRole: UserRole,
  ) {
    // Admins can modify any user
    if (requesterRole === UserRole.ADMIN) {
      return true;
    }

    // Moderators can only modify regular users
    if (
      requesterRole === UserRole.MODERATOR &&
      targetUserRole === UserRole.USER
    ) {
      return true;
    }

    // No other combinations are allowed
    throw new ForbiddenException(
      'You do not have permission to modify users with this role',
    );
  }

  validateRoleChange(requesterRole: UserRole) {
    // Only admins can change roles
    if (requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles');
    }

    return true;
  }

  async updateUser(
    userId: string,
    updateData: Partial<User>,
    requesterRole: UserRole,
    avatar?: Express.Multer.File,
  ) {
    const user = await this.getUserById(userId);

    // Check if the requester can modify this user
    this.validateRequesterCanModifyUser(requesterRole, user.role);

    // If trying to change role, validate the role change
    if (updateData.role && updateData.role !== user.role) {
      this.validateRoleChange(requesterRole);
    }

    // Prevent changing role to admin through this endpoint
    if (updateData.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
      throw new BadRequestException(
        'Cannot set user role to admin through this endpoint',
      );
    }

    // Handle avatar upload if provided
    if (avatar) {
      // Delete old avatar if exists
      if (user.avatarKey) {
        await this.s3Service.deleteFile(user.avatarKey);
      }
      
      // Upload new avatar
      const uniqueKey = await this.s3Service.uploadFile(avatar);
      updateData.avatarKey = uniqueKey;
    }

    // Update user properties
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async deleteUser(userId: string, requesterRole: UserRole) {
    const user = await this.getUserById(userId);

    // Check if the requester can modify this user
    this.validateRequesterCanModifyUser(requesterRole, user.role);

    await this.userRepository.remove(user);
    return { success: true, message: 'User deleted successfully' };
  }

  // Photo-related methods
  async getAllPhotos(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Photo>> {
    const [photos, total] = await this.photoRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: ['user', 'keyWords'],
    });

    return {
      data: photos,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async searchPhotos(
    options: PaginationOptions,
    searchTerm: string,
  ): Promise<PaginatedResponse<Photo>> {
    const [photos, total] = await this.photoRepository.findAndCount({
      where: [
        { description: Like(`%${searchTerm}%`) },
        { user: { username: Like(`%${searchTerm}%`) } },
        { keyWords: { name: Like(`%${searchTerm}%`) } },
      ],
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: ['user', 'keyWords'],
    });

    return {
      data: photos,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getPhotoById(photoId: number) {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      relations: ['user', 'keyWords'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    return photo;
  }

  async updatePhoto(photoId: string, updateData: Partial<Photo>) {
    const photo = await this.getPhotoById(parseInt(photoId));

    // Update photo properties
    Object.assign(photo, updateData);
    return this.photoRepository.save(photo);
  }

  // Comment-related methods
  async getAllComments(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Comment>> {
    const [comments, total] = await this.commentRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: ['user', 'photo'],
    });

    return {
      data: comments,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async searchComments(
    options: PaginationOptions,
    searchTerm: string,
  ): Promise<PaginatedResponse<Comment>> {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: [
        { text: ILike(`%${searchTerm}%`) },
        { user: { username: ILike(`%${searchTerm}%`) } },
      ],
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: ['user', 'photo'],
    });

    return {
      data: comments,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getCommentsByPhotoId(
    photoId: number,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Comment>> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { photo: { id: photoId } },
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: ['user', 'photo'],
    });

    return {
      data: comments,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getCommentById(commentId: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'photo'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    return comment;
  }

  async updateComment(
    commentId: number,
    updateData: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.getCommentById(commentId);
    
    // Update the comment text
    comment.text = updateData.text;
    
    return this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string | number): Promise<void> {
    const id = typeof commentId === 'string' ? parseInt(commentId) : commentId;
    const comment = await this.getCommentById(id);
    
    await this.commentRepository.remove(comment);
  }
}
