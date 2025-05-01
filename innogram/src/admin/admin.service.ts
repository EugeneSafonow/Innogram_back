import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';

@Injectable()
export class AdminService {
  constructor(
    @Inject("USER_REPOSITORY")
    private userRepository: Repository<User>,
    
    @Inject("PHOTO_REPOSITORY")
    private photoRepository: Repository<Photo>,
  ) {}

  // User-related methods
  async getAllUsers() {
    return this.userRepository.find({
      select: ['id', 'email', 'username', 'avatarKey', 'role', 'created_at'],
      order: { created_at: 'DESC' },
    });
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

  async updateUser(userId: string, updateData: Partial<User>) {
    const user = await this.getUserById(userId);
    
    // Prevent changing role to admin through this endpoint
    if (updateData.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Cannot set user role to admin through this endpoint');
    }
    
    // Update user properties
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async deleteUser(userId: string) {
    const user = await this.getUserById(userId);
    await this.userRepository.remove(user);
    return { success: true, message: 'User deleted successfully' };
  }

  // Photo-related methods
  async getAllPhotos() {
    return this.photoRepository.find({
      relations: ['user', 'keyWords'],
      order: { createdAt: 'DESC' },
    });
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
