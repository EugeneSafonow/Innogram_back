import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { JwtPayloadDto } from './dto/jwtPayload.dto';
import { AuthService } from './auth.service';
import { TokenService } from './redis/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
      secretOrKey: configService.get<string>('JWT_KEY'),
      ignoreExpiration: true, // Временно игнорируем срок действия токена
      passReqToCallback: true, // Pass request to callback
    });
  }

  async validate(request: any, payload: JwtPayloadDto): Promise<User> {
    try {
      // Extract the token from the request
      const token = ExtractJwt.fromAuthHeaderWithScheme('Bearer')(request);
      
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
      
      // Validate payload structure
      if (!payload || !payload.username || !payload.email) {
        throw new UnauthorizedException('Invalid token structure');
      }

      const user = await this.authService.validate(payload);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      return user;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
