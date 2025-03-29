import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoModule } from './photo/photo.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { KeyWordModule } from './keyWord/keyWordModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PhotoModule,
    UserModule,
    AuthModule,
    KeyWordModule,
  ],
})
export class AppModule {}
