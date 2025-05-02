import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminService } from './admin.service';
import { User, UserRole } from '../entities/user.entity';
import { PaginatedResponse } from './dto/pagination.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUserController {
  constructor(private readonly adminService: AdminService) {}

  // Allow admins and moderators to view users list
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ): Promise<PaginatedResponse<User>> {
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (search && search.trim()) {
      return this.adminService.searchUsers(options, search.trim());
    }

    return this.adminService.getAllUsers(options);
  }

  // Allow admins and moderators to view user details
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  // Update user with role-based restrictions implemented in service
  // Moderators cannot edit admin users or change user roles
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: Partial<User>,
    @Request() req,
  ) {
    return this.adminService.updateUser(userId, updateData, req.user.role);
  }

  // Delete user with role-based restrictions implemented in service
  // Moderators cannot delete admin users
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async deleteUser(
    @Param('id') userId: string,
    @Request() req,
  ) {
    return this.adminService.deleteUser(userId, req.user.role);
  }
}
