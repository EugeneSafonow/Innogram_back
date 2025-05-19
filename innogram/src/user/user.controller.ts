import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { UserPayloadDto } from './dto/userPayloadDto.dto';
import { GetUserdDto } from './dto/getUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getCurrentUser(
    @Body() getUserdDto: GetUserdDto,
  ): Promise<UserPayloadDto> {
    const { password, ...result } = await this.userService.findOne(
      getUserdDto.userId,
    );
    return result;
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserPayloadDto> {
    const { password, ...result } = await this.userService.findOne(id);
    return result;
  }

  @Get('search/users')
  async searchUsers(
    @Query('term') searchTerm: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    if (!searchTerm || searchTerm.trim() === '') {
      return { users: [], hasMore: false, total: 0 };
    }
    
    return this.userService.searchUsers(searchTerm, page, limit);
  }

  @Patch('changePassword')
  @UsePipes(new ValidationPipe())
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<UserPayloadDto> {
    return await this.userService.changePassword(changePasswordDto);
  }

  @Patch('update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  updateUser(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.userService.updateUser(req.user.id, {
      ...updateUserDto,
      avatar,
    });
  }

  @Delete()
  async deleteAccount(@Req() req) {
    await this.userService.deleteProfile(req.user.id);
    return { message: 'Account deleted successfully' };
  }
}
