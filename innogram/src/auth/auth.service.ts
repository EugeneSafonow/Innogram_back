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
import { TokenService } from './redis/token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  async register(user: CreateUserDto): Promise<User> {
    return this.usersService.create(user);
  }

  async login(loginUser: LoginUserDto): Promise<LoginStatusDto> {
    const user = await this.usersService.findByLogin(loginUser);
    const tokens = this._createTokens(user);

    // Store refresh token in Redis
    await this.tokenService.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresIn
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarKey: user.avatarKey,
      ...tokens,
    };
  }

  async logout(token: string, userId: string): Promise<boolean> {
    try {
      // Extract token expiration from payload
      const payload = this.jwtService.decode(token);
      const expiry = typeof payload === 'object' && payload ? 
        (payload.exp as number) - Math.floor(Date.now() / 1000) : 
        60 * 15; // Default to 15 minutes if token is invalid
      
      // Blacklist the token
      await this.tokenService.blacklistToken(token, expiry > 0 ? expiry : 60);
      
      // Delete refresh token
      await this.tokenService.deleteRefreshToken(userId);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<LoginStatusDto> {
    if (!refreshToken || refreshToken.trim() === '') {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Verify the token signature and expiration
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_KEY'),
      });

      // Verify the payload structure
      if (!payload || !payload.username || !payload.email || !payload.userId) {
        throw new UnauthorizedException('Invalid refresh token structure');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Check if token matches the one stored in Redis
      const storedToken = await this.tokenService.getRefreshToken(payload.userId);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      }

      // Find the user associated with the token
      const user = await this.usersService.findByPayload(payload);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Blacklist old refresh token
      const tokenExpiry = typeof payload === 'object' && payload.exp ? 
        payload.exp - Math.floor(Date.now() / 1000) : 
        60 * 60 * 24 * 7; // 7 days
      await this.tokenService.blacklistToken(refreshToken, tokenExpiry > 0 ? tokenExpiry : 60);

      // Generate new tokens
      const tokens = this._createTokens(user);
      
      // Store new refresh token
      await this.tokenService.storeRefreshToken(
        user.id,
        tokens.refreshToken,
        tokens.refreshTokenExpiresIn
      );

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarKey: user.avatarKey,
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validate(payload: JwtPayloadDto): Promise<User> {
    if (!payload || !payload.username || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      const user = await this.usersService.findByPayload(payload);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    if (!token || token.trim() === '') {
      return false;
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return false;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_KEY'),
      });

      // Validate payload structure
      if (!payload || !payload.username || !payload.email) {
        return false;
      }

      // Validate that the user exists
      const user = await this.usersService.findByPayload(payload);
      if (!user) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private _createTokens({ username, email, id }: User) {
    // Получаем настройки из конфига или используем значения по умолчанию
    const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES') || '24h';
    const refreshTokenExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
    ) || '7d';

    const user: JwtPayloadDto = { username, email, userId: id };
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

    // В секундах для фронтенда (по умолчанию 24 часа и 7 дней)
    const expiresInSeconds = 60 * 60 * 24; // 24 часа
    const refreshExpiresInSeconds = 60 * 60 * 24 * 7; // 7 дней

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      refreshTokenExpiresIn: refreshExpiresInSeconds,
    };
  }
}
