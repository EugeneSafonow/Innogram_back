import { DeleteResult, Repository } from 'typeorm';
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { randomBytes } from 'crypto';
import { DownloadLinkResponseDto } from './dto/download-link-response.dto';

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

  async deletePhoto(id: number): Promise<DeleteResult> {
    const photoEntity = await this.findOne(id);
    await this.s3Service.deleteFile(photoEntity.key);
    const result = await this.photoRepository.delete(photoEntity.id);
    return result;
  }

  async getRecommendedPhotos(userId: string, dto: GetRecommendedPhotosDto) {
    const { page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const userInterests = await this.interestService.getUserInterests(userId);
    const hasUserInterests = userInterests && userInterests.length > 0;
    
    // Сначала получаем рекомендованные фотографии
    const recommendedQuery = this.photoRepository
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
      .where('photo.is_public = true')
      .andWhere('photo.user.id != :userId', { userId });

    if (hasUserInterests) {
      recommendedQuery
        .andWhere('LOWER(keyWords.name) IN (:...userInterests)')
        .setParameter('userInterests', userInterests.map(interest => interest.toLowerCase()));
    }

    // Получаем остальные фотографии
    const otherPhotosQuery = this.photoRepository
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
      .where('photo.is_public = true')
      .andWhere('photo.user.id != :userId', { userId });

    if (hasUserInterests) {
      otherPhotosQuery
        .andWhere('NOT EXISTS (SELECT 1 FROM key_word kw WHERE kw.photoId = photo.id AND LOWER(kw.name) IN (:...userInterests))')
        .setParameter('userInterests', userInterests.map(interest => interest.toLowerCase()));
    }

    // Получаем все фотографии
    const [recommendedPhotos, recommendedTotal] = await recommendedQuery
      .orderBy('photo.createdAt', 'DESC')
      .getManyAndCount();

    const [otherPhotos, otherTotal] = await otherPhotosQuery
      .orderBy('photo.createdAt', 'DESC')
      .getManyAndCount();

    // Объединяем результаты
    const allPhotos = [...recommendedPhotos, ...otherPhotos];
    const total = recommendedTotal + otherTotal;

    // Применяем пагинацию к объединенному результату
    const paginatedPhotos = allPhotos.slice(skip, skip + limit);

    return {
      photos: paginatedPhotos,
      hasMore: skip + paginatedPhotos.length < total,
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

  async generateDownloadLink(photoId: number, userId: string): Promise<DownloadLinkResponseDto> {
    const photo = await this.findOne(photoId);
    
    if (!photo) {
      throw new NotFoundException(`Photo with id ${photoId} not found`);
    }

    if(photo.is_public){
      return {downloadUrl: `/photo/download/${photoId}`};
    }
    
    if (photo.user.id !== userId) {
      throw new NotFoundException(`Photo with id ${photoId} not found or not accessible`);
    }
    
    const downloadToken = randomBytes(32).toString('hex');
    
    await this.photoRepository.update(photoId, {
      downloadToken,
    });

    
    const downloadUrl = `/photo/download/${photoId}?token=${downloadToken}`;
    
    return {
      downloadUrl,
    };
  }
  
  async verifyDownloadToken(photoId: number, token: string): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      relations: ['user']
    });
    
    if (!photo) {
      throw new NotFoundException(`Photo with id ${photoId} not found`);
    }

    if(photo.is_public){
      return photo;
    }
    
    if (photo.downloadToken !== token) {
      throw new NotFoundException('Invalid download token');
    }
    
    return photo;
  }

  async updatePhotoKeyWords(photoId: string, keyWordIds: number[]) {
    const photo = await this.photoRepository.findOne({
      where: { id: parseInt(photoId) },
      relations: ['keyWords'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    // Find keywords by IDs
    const keyWords = [];
    for (const id of keyWordIds) {
      try {
        // Find keyword by ID - this is a workaround since we don't have a direct findById method
        const keyWordById = await this.photoRepository
          .createQueryBuilder('photo')
          .leftJoinAndSelect('photo.keyWords', 'keyWord')
          .where('keyWord.id = :id', { id })
          .getOne();
        
        if (keyWordById && keyWordById.keyWords && keyWordById.keyWords.length > 0) {
          const keyword = keyWordById.keyWords.find(kw => kw.id === id);
          if (keyword) {
            keyWords.push(keyword);
          }
        }
      } catch (error) {
        console.error(`Error finding keyword with ID ${id}:`, error);
      }
    }
    
    if (keyWords.length !== keyWordIds.length) {
      throw new BadRequestException('One or more keyword IDs are invalid');
    }

    photo.keyWords = keyWords;
    return this.photoRepository.save(photo);
  }

  async replacePhoto(photoId: string, file: Express.Multer.File) {
    const photo = await this.photoRepository.findOne({
      where: { id: parseInt(photoId) },
      relations: ['keyWords', 'user'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    // Delete old photo from S3
    try {
      await this.s3Service.deleteFile(photo.key);
    } catch (error) {
      console.error('Error deleting old photo file:', error);
      // Continue even if delete fails
    }

    // Upload new photo to S3
    const key = await this.s3Service.uploadFile(file);

    // Update the photo record with new S3 key but keep other metadata
    photo.key = key;

    return this.photoRepository.save(photo);
  }
}
