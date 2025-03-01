import { Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { CreatePhotoDto } from './dto/createPhoto.dto';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}
  async findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
  async createPhoto(key: string, photo: CreatePhotoDto): Promise<Photo> {
    const newPhoto = this.photoRepository.create(photo);
    newPhoto.image_url = 'https://picsum.photos/200/300';
    newPhoto.key = key;
    return this.photoRepository.save(newPhoto);
  }
}
