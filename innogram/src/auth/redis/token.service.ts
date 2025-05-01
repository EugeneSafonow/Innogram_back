import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class TokenService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  // Save token to blacklist (for logged out or revoked tokens)
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.redis.set(`blacklist:${token}`, '1', 'EX', expiresIn);
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${token}`);
    return !!result;
  }

  // Store user's refresh token
  async storeRefreshToken(userId: string, token: string, expiresIn: number): Promise<void> {
    await this.redis.set(`refresh:${userId}`, token, 'EX', expiresIn);
  }

  // Get user's refresh token
  async getRefreshToken(userId: string): Promise<string> {
    return this.redis.get(`refresh:${userId}`);
  }

  // Delete user's refresh token (on logout or token revocation)
  async deleteRefreshToken(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`);
  }
} 
