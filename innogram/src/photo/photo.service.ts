import { DeleteResult, Repository } from 'typeorm';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { CreatePhotoDto } from './dto/createPhoto.dto';
import { S3Service } from '../s3/s3.service';
import { EditPhotoDataDto } from './dto/editPhotoData.dto';
import { UserService } from '../user/user.service';
import { Tag } from '../entities/tag.entity';
import { TagService } from '../tag/tag.service.';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
    private userService: UserService,
    private s3Service: S3Service,
    private tagService: TagService,
  ) {}
  async findAll(userId: string): Promise<Photo[]> {
    return this.photoRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(id: number): Promise<Photo> {
    return this.photoRepository.findOne({
      where: { id: id },
      relations: ['user', 'tags'],
      select: {
        user: { id: true },
      },
    });
  }

  async createPhoto(key: string, photo: CreatePhotoDto): Promise<Photo> {
    const user = await this.userService.findOne(photo.userId);

    if (!user) throw new NotFoundException(`No photo with id ${photo.userId}`);

    const tags: Tag[] = [];

    if (photo.tags && photo.tags.length > 0) {
      for (const tagName of photo.tags) {
        const tag = await this.tagService.findOrCreateTag(tagName);
        tags.push(tag);
      }
    }

    const newPhoto = this.photoRepository.create({
      ...photo,
      key,
      user: { id: user.id },
      tags,
    });

    return this.photoRepository.save(newPhoto);
  }
  async editPhotoData(id: number, photoData: EditPhotoDataDto): Promise<Photo> {
    const editedPhoto = await this.findOne(id);

    if (!editedPhoto || editedPhoto.user.id !== photoData.userId) {
      throw new NotFoundException();
    }

    editedPhoto.description = photoData.description;
    editedPhoto.is_public = photoData.is_public;

    if (photoData.tags && photoData.tags.length > 0) {
      editedPhoto.tags = await Promise.all(
        photoData.tags.map(async (tagName) => {
          return await this.tagService.findOrCreateTag(tagName);
        }),
      );
    }

    const respones = await this.photoRepository.save(editedPhoto);
    return respones;
  }
  async deletePhoto(id: number, userId: string): Promise<DeleteResult> {
    const photoEntity = await this.findOne(id);
    if (!photoEntity || photoEntity.user.id !== userId) {
      throw new NotFoundException(`No photo with id ${id}`);
    }
    await this.s3Service.deleteFile(photoEntity.key);
    return this.photoRepository.delete(photoEntity.id);
  }
}
