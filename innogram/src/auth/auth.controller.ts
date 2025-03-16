import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/createUser.dto';
import { LoginUserDto } from '../user/dto/loginUser.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDto } from './dto/jwtPayload.dto';
import { UserRole } from '../entities/user.entity';
import { LoginStatusDto } from './dto/loginStatus.dto';

//TODO REFRESH TOKEN
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  public async register(@Body() createUser: CreateUserDto) {
    createUser.role = UserRole.USER;
    const user = await this.authService.register(createUser);

    if (!user) {
      throw new BadRequestException(); // TODO EXCEPTION JUST FOR EXCEPTION
    }
  }

  @Post('login')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  public async login(@Body() loginUser: LoginUserDto): Promise<LoginStatusDto> {
    return await this.authService.login(loginUser);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  public async testAuth(@Req() req): Promise<JwtPayloadDto> {
    const { password, ...result } = req.user;
    return result;
  }
}
