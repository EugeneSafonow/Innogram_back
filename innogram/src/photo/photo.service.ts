import { DeleteResult, Repository } from 'typeorm';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Photo } from '../entities/photo.entity';
import { CreatePhotoDto } from './dto/createPhoto.dto';
import { S3Service } from '../s3/s3.service';
import { EditPhotoDataDto } from './dto/editPhotoData.dto';
import { UserService } from '../user/user.service';
import { KeyWord } from '../entities/keyWord.entity';
import { KeyWordService } from '../keyWord/keyWordService';
import { GetRecommendedPhotosDto } from './dto/getRecommendedPhotos.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InterestService } from '../interest/interest.service';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
    private userService: UserService,
    private s3Service: S3Service,
    private keyWordService: KeyWordService,
    private interestService: InterestService,
  ) {}
  async findAll(userId: string): Promise<Photo[]> {
    return this.photoRepository.find({ where: { user: { id: userId } } });
  }

  async findAllPaginated(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    console.log(userId);

    const [photos, total] = await this.photoRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.user', 'user')
      .leftJoinAndSelect('photo.keyWords', 'keyWords')
      .select([
        'photo.id',
        'photo.description',
        'photo.is_public',
        'photo.key',
        'photo.createdAt',
        'user.id',
        'user.username',
        'user.avatarKey',
        'keyWords',
      ])
      .where('user.id = :userId', { userId })
      .andWhere('photo.is_public = :isPublic', { isPublic: true })
      .orderBy('photo.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      photos,
      hasMore: skip + photos.length < total,
    };
  }

  async findOne(id: number): Promise<Photo> {
    return this.photoRepository.findOne({
      where: { id: id },
      relations: ['user', 'keyWords'],
      select: {
        user: { id: true, username: true, avatarKey: true },
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

  async getRecommendedPhotos(userId: string, dto: GetRecommendedPhotosDto) {
    const { page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const userInterests = await this.interestService.getUserInterests(userId);
    const hasUserInterests = userInterests && userInterests.length > 0;
    
    const query = this.photoRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.user', 'user')
      .leftJoinAndSelect('photo.keyWords', 'keyWords')
      .leftJoinAndSelect('photo.likes', 'likes')
      .select([
        'photo.id',
        'photo.description',
        'photo.is_public',
        'photo.key',
        'photo.createdAt',
        'user.id',
        'user.username',
        'user.avatarKey',
        'likes.id',
        'likes.user',
        'keyWords',
      ])
      .where('photo.is_public = true');
    
    if (hasUserInterests) {
      query
        .andWhere('LOWER(keyWords.name) IN (:...userInterests)')
        .setParameter('userInterests', userInterests.map(interest => interest.toLowerCase()))
        .orderBy('photo.createdAt', 'DESC');
    } else {
      query.orderBy('photo.createdAt', 'DESC');
    }

    const [photos, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      photos,
      hasMore: skip + photos.length < total,
    };
  }

  async updatePhotoPrivacy(
    id: number,
    isPublic: boolean,
    userId: string,
  ): Promise<Photo> {
    const photo = await this.findOne(id);

    if (!photo || photo.user.id !== userId) {
      throw new NotFoundException(
        `No photo with id ${id} found or you don't have permission`,
      );
    }

    photo.is_public = isPublic;

    return this.photoRepository.save(photo);
  }

  async getUserPrivatePhotos(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [photos, total] = await this.photoRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.user', 'user')
      .select([
        'photo.id',
        'photo.description',
        'photo.key',
        'photo.createdAt',
        'user.id',
        'user.username',
        'user.avatarKey',
      ])
      .where('photo.is_public = false')
      .andWhere('user.id = :userId', { userId })
      .orderBy('photo.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      photos,
      hasMore: skip + photos.length < total,
    };
  }

  async searchPhotosByKeywords(searchTerm: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;
    const term = `%${searchTerm.toLowerCase()}%`;

    const [photos, total] = await this.photoRepository
      .createQueryBuilder('photo')
      .leftJoinAndSelect('photo.user', 'user')
      .leftJoinAndSelect('photo.keyWords', 'keyWords')
      .select([
        'photo.id',
        'photo.description',
        'photo.is_public',
        'photo.key',
        'photo.createdAt',
        'user.id',
        'user.username',
        'user.avatarKey',
        'keyWords',
      ])
      .where('photo.is_public = true')
      .andWhere(
        '(LOWER(photo.description) LIKE :term OR LOWER(keyWords.name) LIKE :term)',
        { term }
      )
      .orderBy('photo.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      photos,
      hasMore: skip + photos.length < total,
    };
  }
}
