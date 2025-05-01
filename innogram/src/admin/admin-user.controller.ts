import { Controller, Get, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminService } from './admin.service';
import { User, UserRole } from '../entities/user.entity';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUserController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: Partial<User>
  ) {
    return this.adminService.updateUser(userId, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }
} 
