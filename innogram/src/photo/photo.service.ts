import { DeleteResult, Repository } from 'typeorm';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { CreatePhotoDto } from './dto/createPhoto.dto';
import { S3Service } from '../s3/s3.service';
import { EditPhotoDataDto } from './dto/editPhotoData.dto';
import { UserService } from '../user/user.service';
import { KeyWord } from '../entities/keyWord.entity';
import { KeyWordService } from '../keyWord/keyWordService';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
    private userService: UserService,
    private s3Service: S3Service,
    private keyWordService: KeyWordService,
  ) {}
  async findAll(userId: string): Promise<Photo[]> {
    return this.photoRepository.find({ where: { user: { id: userId } } });
  }

  async findOne(id: number): Promise<Photo> {
    return this.photoRepository.findOne({
      where: { id: id },
      relations: ['user', 'keyWords'],
      select: {
        user: { id: true },
      },
    });
  }

  async createPhoto(key: string, photo: CreatePhotoDto): Promise<Photo> {
    const user = await this.userService.findOne(photo.userId);

    if (!user) throw new NotFoundException(`No photo with id ${photo.userId}`);

    const keyWords: KeyWord[] = [];

    if (photo.keyWords && photo.keyWords.length > 0) {
      for (const keyWordName of photo.keyWords) {
        const keyWord =
          await this.keyWordService.findOrCreateKeyWord(keyWordName);
        keyWords.push(keyWord);
      }
    }

    const newPhoto = this.photoRepository.create({
      ...photo,
      key,
      user: { id: user.id },
      keyWords,
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

    if (photoData.keyWords && photoData.keyWords.length > 0) {
      editedPhoto.keyWords = await Promise.all(
        photoData.keyWords.map(async (keyWordName) => {
          return await this.keyWordService.findOrCreateKeyWord(keyWordName);
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
    const result = await this.photoRepository.delete(photoEntity.id);
    return result;
  }
}
