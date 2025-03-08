import { DeleteResult, Repository } from 'typeorm';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { CreatePhotoDto } from './dto/createPhoto.dto';
import { S3Service } from '../s3/s3.service';
import { EditPhotoDataDto } from './dto/editPhotoData.dto';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
    private s3Service: S3Service,
  ) {}
  async findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
  async findOne(id: number): Promise<Photo> {
    return this.photoRepository.findOne({ where: { id: id } });
  }
  async createPhoto(key: string, photo: CreatePhotoDto): Promise<Photo> {
    const newPhoto = this.photoRepository.create(photo);
    newPhoto.key = key;
    return this.photoRepository.save(newPhoto);
  }
  async editPhotoData(id: number, photoData: EditPhotoDataDto): Promise<Photo> {
    const editedPhoto = await this.findOne(id);
    if (!editedPhoto) {
      throw new NotFoundException();
    }
    editedPhoto.description = photoData.description;
    editedPhoto.is_public = photoData.is_public;
    const respones = await this.photoRepository.save(editedPhoto);
    return respones;
  }
  async deletePhoto(id: number): Promise<DeleteResult> {
    const photoEntity = await this.findOne(id);
    if (!photoEntity) {
      throw new NotFoundException(`No photo with id ${id}`);
    }
    await this.s3Service.deleteFile(photoEntity.key);
    return this.photoRepository.delete(photoEntity.id);
  }
}
