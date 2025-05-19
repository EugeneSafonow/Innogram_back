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
  Query,
  Request,
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
import { GetRecommendedPhotosDto } from './dto/getRecommendedPhotos.dto';
import { GenerateDownloadLinkDto } from './dto/generate-download-link.dto';
import { DownloadLinkResponseDto } from './dto/download-link-response.dto';
import { UserRole } from 'src/entities/user.entity';

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

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  getRecommendedPhotos(@Req() req, @Query() dto: any) {
    return this.photoService.getRecommendedPhotos(req.user.id, dto);
  }

  @Get('private')
  @UseGuards(JwtAuthGuard)
  async getUserPrivatePhotos(
    @Request() req, 
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.photoService.getUserPrivatePhotos(req.user.id, page, limit);
  }

  @Post('generate-download-link')
  @UseGuards(AuthGuard('jwt'))
  async generateDownloadLink(
    @Req() req,
    @Body() dto: GenerateDownloadLinkDto
  ): Promise<DownloadLinkResponseDto> {
    return this.photoService.generateDownloadLink(dto.photoId, req.user.id);
  }

  @Get('download/:id')
  async downloadPhoto(
    @Param('id') id: number,
    @Res() res: Response,
    @Query('token') token?: string,
  ): Promise<void> {
    const photo = await this.photoService.verifyDownloadToken(id, token);
    
    try {
      const fileData = await this.s3Service.getFile(photo.key);
      
      res.set({
        'Content-Type': fileData.contentType,
        'Content-Disposition': `attachment; filename=${photo.key}`
      });
      
      fileData.stream.pipe(res);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
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

  @Patch(':id/privacy')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePhotoPrivacy(
    @Param('id') id: number,
    @Body() data: { is_public: boolean },
    @Req() req,
  ): Promise<Photo> {
    return this.photoService.updatePhotoPrivacy(
      id,
      data.is_public,
      req.user.id,
    );
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
    @Req() req
  ): Promise<void> {
    const photoEntity = await this.photoService.findOne(id);
    if (!photoEntity) {
      throw new NotFoundException(`No photo with id ${id}`);
    }

    if ((req.user.id !== photoEntity.user.id ) && req.user.role == UserRole.USER) {
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
    const photo = await this.photoService.findOne(id);
    if (!photo) {
      throw new NotFoundException(`No photo with id ${id}`);
    }
    if (photo.user.id !== getPhotosDto.userId) {
      throw new ForbiddenException('No permission to photo');
    }
    await this.photoService.deletePhoto(id);
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  getUserPhotos(
    @Param('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.photoService.findAllPaginated(userId, page, limit);
  }

  @Get('search/keywords')
  @UseGuards(JwtAuthGuard)
  async searchByKeywords(
    @Query('term') searchTerm: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12
  ) {
    if (!searchTerm || searchTerm.trim() === '') {
      return { photos: [], hasMore: false };
    }
    
    return this.photoService.searchPhotosByKeywords(searchTerm, page, limit);
  }
}
