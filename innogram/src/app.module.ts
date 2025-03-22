import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoModule } from './photo/photo.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PhotoModule,
    UserModule,
    AuthModule,
    TagModule,
  ],
})
export class AppModule {}
