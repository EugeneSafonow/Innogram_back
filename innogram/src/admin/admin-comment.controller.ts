import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CommentService } from '../comment/comment.service';
import { UserRole } from '../entities/user.entity';
import { PaginatedResponse } from './dto/pagination.dto';
import { Comment } from '../entities/comment.entity';
import { UpdateCommentDto } from '../comment/dto/updateComment.dto';

@Controller('admin/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminCommentController {
  constructor(
    private readonly adminService: AdminService,
    private readonly commentService: CommentService,
  ) {}

  // Get all comments with pagination and search
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getAllComments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<Comment>> {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (search && search.trim()) {
      return this.adminService.searchComments(options, search.trim());
    }

    return this.adminService.getAllComments(options);
  }

  // Get comments for a specific photo
  @Get('photo/:photoId')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getCommentsByPhotoId(
    @Param('photoId') photoId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<PaginatedResponse<Comment>> {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    return this.adminService.getCommentsByPhotoId(parseInt(photoId), options);
  }

  // Get a specific comment by ID
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getCommentById(@Param('id') commentId: string) {
    return this.adminService.getCommentById(parseInt(commentId));
  }

  // Update a comment
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async updateComment(
    @Param('id') commentId: string,
    @Body() updateData: UpdateCommentDto,
  ) {
    return this.adminService.updateComment(parseInt(commentId), updateData);
  }

  // Delete a comment
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async deleteComment(@Param('id') commentId: string) {
    return this.adminService.deleteComment(parseInt(commentId));
  }
} 
