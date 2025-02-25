import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PublicationsModule } from './publications/publications.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './entities/publication.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PublicationsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: '1234',
      database: 'db',
      entities: [Publication],
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
