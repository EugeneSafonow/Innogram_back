import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { PhotoService } from './photo.service';
import { CreatePhotoDto } from './dto/createPhoto.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

@Controller('photo')
export class PhotoController {
  constructor(
    private photoService: PhotoService,
    private s3Service: S3Service,
  ) {}

  @Get()
  getPhoto(): Promise<Photo[]> {
    return this.photoService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createPhoto(
    @Body('data') photoData: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Photo> {
    const parsedPhotoData = plainToInstance(
      CreatePhotoDto,
      JSON.parse(photoData),
    );
    const errors = await new ValidationPipe({ transform: true }).transform(
      parsedPhotoData,
      {
        type: 'body',
        metatype: CreatePhotoDto,
      },
    );

    if (errors instanceof Error) {
      throw errors;
    }

    const key = await this.s3Service.uploadFile(file);
    return this.photoService.createPhoto(key, parsedPhotoData);
  }

  @Get('/link/:id')
  async getPhotoLink(
    @Param('id') id: number,
    @Res() res: Response,
  ): Promise<void> {
    const photoEntity = await this.photoService.findOne(id);
    if (!photoEntity) {
      throw new NotFoundException(`No photo with id ${id}`);
    }

    if (photoEntity.is_public) {
      const s3Respone = await this.s3Service.getFile(photoEntity.key);
      res.setHeader('Content-Type', s3Respone.contentType);
      s3Respone.stream.pipe(res);
    } else {
      throw new ForbiddenException('No permission to photo');
    }
  }

  @Delete(':id')
  async deletePhoto(@Param('id') id: number): Promise<void> {
    console.log(await this.photoService.deletePhoto(id));
  }
}
