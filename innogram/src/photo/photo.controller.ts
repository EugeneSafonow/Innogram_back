import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { PhotoService } from './photo.service';
import { CreatePhotoDto } from './dto/createPhoto.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { EditPhotoDataDto } from './dto/editPhotoData.dto';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { GetPhotosDto } from './dto/getPhotos.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('photo')
export class PhotoController {
  constructor(
    private photoService: PhotoService,
    private s3Service: S3Service,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getPhotos(@Body() getPhotosDto: GetPhotosDto): Promise<Photo[]> {
    return this.photoService.findAll(getPhotosDto.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPhoto(@Req() req, @Param('id') id: number): Promise<Photo> {
    const photo: Photo = await this.photoService.findOne(id);
    if (!photo.is_public && photo.user.id !== req.user.id)
      throw new NotFoundException();
    return photo;
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async createPhoto(
    @Req() req,
    @Body('data') photoData: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Photo> {
    const parsedPhotoData = plainToInstance(
      CreatePhotoDto,
      JSON.parse(photoData),
    );

    parsedPhotoData.userId = req.user.id;

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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true })) //TODO CHECK USER
  async editPhoto(
    @Param('id') id: number,
    @Body() photoData: EditPhotoDataDto,
  ): Promise<Photo> {
    return this.photoService.editPhotoData(id, photoData);
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

    if (!photoEntity.is_public) {
      throw new ForbiddenException('No permission to photo');
    }

    const s3Respone = await this.s3Service.getFile(photoEntity.key);
    res.setHeader('Content-Type', s3Respone.contentType);
    s3Respone.stream.pipe(res);
  }

  @Get('/private/link/:id')
  @UseGuards(JwtAuthGuard)
  async getPhotoLinkViaAuth(
    @Param('id') id: number,
    @Res() res: Response,
    @Body() getPhotosDto: GetPhotosDto,
  ): Promise<void> {
    const photoEntity = await this.photoService.findOne(id);
    if (!photoEntity) {
      throw new NotFoundException(`No photo with id ${id}`);
    }

    if (getPhotosDto.userId !== photoEntity.user.id) {
      throw new ForbiddenException('No permission to photo');
    }
    const s3Respone = await this.s3Service.getFile(photoEntity.key);
    res.setHeader('Content-Type', s3Respone.contentType);
    s3Respone.stream.pipe(res);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(
    @Param('id') id: number,
    @Body() getPhotosDto: GetPhotosDto,
  ): Promise<void> {
    // TODO STATUS CODE
    await this.photoService.deletePhoto(id, getPhotosDto.userId);
  }
}
