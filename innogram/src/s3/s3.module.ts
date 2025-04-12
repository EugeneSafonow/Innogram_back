import { ConfigService } from '@nestjs/config';
import { Module, OnModuleInit } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';

@Module({
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: (configService: ConfigService): S3Client => {
        console.log(configService.get<string>('AWS_REGION'));
        return new S3Client({
          region: configService.get<string>('AWS_REGION'),
          endpoint: configService.get<string>('AWS_S3_ENDPOINT'),
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          },
          forcePathStyle: true,
        });
      },
      inject: [ConfigService],
    },
    S3Service,
  ],
  exports: ['S3_CLIENT', S3Service],
})
export class S3Module implements OnModuleInit {
  constructor(private readonly s3Service: S3Service) {}

  async onModuleInit() {
    await this.s3Service.initialize();
  }
}
