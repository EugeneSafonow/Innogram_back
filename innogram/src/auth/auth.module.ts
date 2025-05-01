import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { KeyWordModule } from '../keyWord/keyWordModule';
import { ThrottlerModule } from '@nestjs/throttler';
import { S3Module } from 'src/s3/s3.module';
import { AuthRedisModule } from './redis/redis.module';

@Module({
  imports: [
    UserModule,
    KeyWordModule,
    AuthRedisModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_KEY'),
          signOptions: {
            expiresIn: config.get<string>('JWT_EXPIRES', '24h'),
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 5,
      },
    ]),
    S3Module
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserService],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
