import { Controller, Get, Put, Delete, Post, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminService } from './admin.service';
import { PhotoService } from '../photo/photo.service';
import { UserRole } from '../entities/user.entity';

interface UpdatePhotoDto {
  description?: string;
  is_public?: boolean;
  keyWordIds?: number[];
}

@Controller('admin/photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminPhotoController {
  constructor(
    private readonly adminService: AdminService,
    private readonly photoService: PhotoService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getAllPhotos() {
    return this.adminService.getAllPhotos();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getPhotoById(@Param('id') photoId: string) {
    return this.adminService.getPhotoById(parseInt(photoId));
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async updatePhoto(
    @Param('id') photoId: string,
    @Body() updateData: UpdatePhotoDto,
  ) {
    const photo = await this.adminService.getPhotoById(parseInt(photoId));
    
    // If keyWordIds are provided, update photo keywords
    if (updateData.keyWordIds) {
      // Handle keywords separately with PhotoService
      await this.photoService.updatePhotoKeyWords(photoId, updateData.keyWordIds);
      delete updateData.keyWordIds;
    }
    
    // Update other photo properties
    return this.adminService.updatePhoto(photoId, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async deletePhoto(@Param('id') photoId: string) {
    return this.adminService.deletePhoto(photoId);
  }

  @Post(':id/replace')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseInterceptors(FileInterceptor('file'))
  async replacePhoto(
    @Param('id') photoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const photo = await this.adminService.getPhotoById(parseInt(photoId));
    
    // Use the photo service to replace the photo while keeping metadata
    return this.photoService.replacePhoto(photoId, file);
  }
} 
