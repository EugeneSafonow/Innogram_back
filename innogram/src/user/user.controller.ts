import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { UserPayloadDto } from './dto/userPayloadDto.dto';
import { GetUserdDto } from './dto/getUser.dto';

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

  @Patch('update')
  @UsePipes(new ValidationPipe())
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserPayloadDto> {
    const { password, ...result } =
      await this.userService.updateUser(updateUserDto);
    return result;
  }

  @Patch('changePassword')
  @UsePipes(new ValidationPipe())
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<UserPayloadDto> {
    return await this.userService.changePassword(changePasswordDto);
  }
}
