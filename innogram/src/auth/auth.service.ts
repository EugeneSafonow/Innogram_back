import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtPayloadDto } from './dto/jwtPayload.dto';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/createUser.dto';
import { LoginUserDto } from '../user/dto/loginUser.dto';
import { LoginStatusDto } from './dto/loginStatus.dto';
import { randomBytes } from 'crypto';

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
    const tokens = this._createTokens(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<LoginStatusDto> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_KEY'),
      });

      const user = await this.usersService.findByPayload(payload);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        ...this._createTokens(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validate(payload: JwtPayloadDto): Promise<User> {
    const user = await this.usersService.findByPayload(payload);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private _createTokens({ username, email }: User) {
    const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES');
    const refreshTokenExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
    );

    const user: JwtPayloadDto = { username, email };
    const accessToken = this.jwtService.sign(user, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { ...user, tokenId: randomBytes(16).toString('hex') },
      {
        expiresIn: refreshTokenExpiresIn,
        secret: this.configService.get<string>('JWT_REFRESH_KEY'),
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 60 * 15, // 15 minutes in seconds
      refreshTokenExpiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    };
  }
}
