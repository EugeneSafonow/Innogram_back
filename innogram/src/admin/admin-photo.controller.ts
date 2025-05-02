import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminService } from './admin.service';
import { PhotoService } from '../photo/photo.service';
import { UserRole } from '../entities/user.entity';
import { PaginatedResponse } from './dto/pagination.dto';
import { Photo } from '../entities/photo.entity';

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

  // Allow admins and moderators to view all photos
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getAllPhotos(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<Photo>> {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (search && search.trim()) {
      return this.adminService.searchPhotos(options, search.trim());
    }

    return this.adminService.getAllPhotos(options);
  }

  // Allow admins and moderators to view photo details
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getPhotoById(@Param('id') photoId: string) {
    return this.adminService.getPhotoById(parseInt(photoId));
  }

  // Allow admins and moderators to update photos
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async updatePhoto(
    @Param('id') photoId: string,
    @Body() updateData: UpdatePhotoDto,
  ) {
    // Verify the photo exists before updating
    await this.adminService.getPhotoById(parseInt(photoId));

    // If keyWordIds are provided, update photo keywords
    if (updateData.keyWordIds) {
      // Handle keywords separately with PhotoService
      await this.photoService.updatePhotoKeyWords(
        photoId,
        updateData.keyWordIds,
      );
      delete updateData.keyWordIds;
    }

    // Update other photo properties
    return this.adminService.updatePhoto(photoId, updateData);
  }

  // Allow admins and moderators to delete photos
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async deletePhoto(@Param('id') photoId: string) {
    return this.adminService.deletePhoto(photoId);
  }

  // Allow admins and moderators to replace photos
  @Post(':id/replace')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseInterceptors(FileInterceptor('file'))
  async replacePhoto(
    @Param('id') photoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Verify the photo exists before replacing
    await this.adminService.getPhotoById(parseInt(photoId));

    // Use the photo service to replace the photo while keeping metadata
    return this.photoService.replacePhoto(photoId, file);
  }
}
