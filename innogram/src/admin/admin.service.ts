import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { Repository, Like } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { PaginationOptions, PaginatedResponse } from './dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,

    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
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

  async deletePhoto(photoId: string) {
    const photo = await this.getPhotoById(parseInt(photoId));
    await this.photoRepository.remove(photo);
    return { success: true, message: 'Photo deleted successfully' };
  }
}
