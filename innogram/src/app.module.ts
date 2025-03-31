import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PhotoModule } from './photo/photo.module';
import { S3Module } from './s3/s3.module';
import { AuthModule } from './auth/auth.module';
import { KeyWordModule } from './keyWord/keyWordModule';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    PhotoModule,
    S3Module,
    AuthModule,
    KeyWordModule,
    LikeModule,
    CommentModule,
  ],
})
export class AppModule {}
