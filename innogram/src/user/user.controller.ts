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
  Post,
  Request,
  UseInterceptors,
  UploadedFile,
  Req,
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
    @UploadedFile() avatar?: Express.Multer.File
  ) {
    return this.userService.updateUser(req.user.id, {
      ...updateUserDto,
      avatar
    });
  }
}
