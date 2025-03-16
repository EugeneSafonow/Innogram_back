import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtPayloadDto } from './dto/jwtPayload.dto';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/createUser.dto';
import { LoginUserDto } from '../user/dto/loginUser.dto';
import { LoginStatusDto } from './dto/loginStatus.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}
  async register(user: CreateUserDto): Promise<User> {
    return this.usersService.create(user);
  }

  async login(loginUser: LoginUserDto): Promise<LoginStatusDto> {
    const user = await this.usersService.findByLogin(loginUser);
    const token = this._createToken(user);

    return {
      username: user.username,
      email: user.email,
      ...token,
    };
  }

  async validate(payload: JwtPayloadDto): Promise<User> {
    console.log('Validating payload:', payload);
    const user = await this.usersService.findByPayload(payload); // TODO EXTEND FIND BY PAYLOAD

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private _createToken({ username, email }: User) {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES');
    const user: JwtPayloadDto = { username, email };
    const accessToken = this.jwtService.sign(user);

    return {
      accessToken,
      expiresIn,
    };
  }
}
