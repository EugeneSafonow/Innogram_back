import { DeleteResult, Repository } from 'typeorm';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { CreatePhotoDto } from './dto/createPhoto.dto';
import { S3Service } from '../s3/s3.service';

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
    newPhoto.image_url = 'https://picsum.photos/200/300';
    newPhoto.key = key;
    return this.photoRepository.save(newPhoto);
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
