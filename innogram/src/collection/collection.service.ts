import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Photo } from '../entities/photo.entity';

@Injectable()
export class CollectionService {
  constructor(
    @Inject('COLLECTION_REPOSITORY')
    private collectionRepository: Repository<Collection>,
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}

  async create(userId: string, createCollectionDto: CreateCollectionDto) {
    const collection = this.collectionRepository.create({
      ...createCollectionDto,
      user: { id: userId },
      photoOrder: {},
    });
    return this.collectionRepository.save(collection);
  }

  async findAll(userId: string) {
    const collections = await this.collectionRepository.find({
      where: { user: { id: userId } },
      relations: ['photos'],
    });

    return collections.map((collection) => {
      if (collection.photoOrder) {
        collection.photos.sort((a, b) => {
          const orderA = collection.photoOrder[a.id] || 0;
          const orderB = collection.photoOrder[b.id] || 0;
          return orderA - orderB;
        });
      }
      return collection;
    });
  }

  async findOne(id: string, userId: string) {
    const collection = await this.collectionRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['photos'],
    });
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.photoOrder) {
      collection.photos.sort((a, b) => {
        const orderA = collection.photoOrder[a.id] || 0;
        const orderB = collection.photoOrder[b.id] || 0;
        return orderA - orderB;
      });
    }

    return collection;
  }

  async update(
    id: string,
    userId: string,
    updateCollectionDto: UpdateCollectionDto,
  ) {
    const collection = await this.findOne(id, userId);
    Object.assign(collection, updateCollectionDto);
    return this.collectionRepository.save(collection);
  }

  async remove(id: string, userId: string) {
    const collection = await this.findOne(id, userId);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return this.collectionRepository.delete(collection.id);
  }

  async addPhoto(collectionId: string, photoId: number, userId: string) {
    const collection = await this.findOne(collectionId, userId);
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
    });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    collection.photos = [...(collection.photos || []), photo];

    // Update photo order
    const currentOrder = collection.photoOrder || {};
    const maxOrder = Math.max(...Object.values(currentOrder), 0);
    currentOrder[photoId] = maxOrder + 1;

    collection.photoOrder = currentOrder;

    return this.collectionRepository.save(collection);
  }

  async removePhoto(collectionId: string, photoId: number, userId: string) {
    const collection = await this.findOne(collectionId, userId);
    collection.photos = collection.photos.filter(
      (photo) => photo.id !== photoId,
    );

    // Update photo order
    const currentOrder = { ...collection.photoOrder };
    delete currentOrder[photoId];

    collection.photoOrder = currentOrder;

    return this.collectionRepository.save(collection);
  }

  async updatePhotoOrder(
    collectionId: string,
    photoOrder: { [key: string]: number },
    userId: string,
  ) {
    const collection = await this.findOne(collectionId, userId);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Validate that all photo IDs in the order exist in the collection
    const photoIds = collection.photos.map((photo) => photo.id.toString());
    const invalidPhotoIds = Object.keys(photoOrder).filter(
      (id) => !photoIds.includes(id),
    );

    if (invalidPhotoIds.length > 0) {
      throw new NotFoundException(
        `Photos with IDs ${invalidPhotoIds.join(', ')} not found in collection`,
      );
    }

    collection.photoOrder = photoOrder;
    return this.collectionRepository.save(collection);
  }

  async findUserCollections(userId: string) {
    const collections = await this.collectionRepository.find({
      where: { 
        user: { id: userId },
        isPublic: true
      },
      relations: ['photos'],
    });

    return collections.map((collection) => {
      if (collection.photoOrder) {
        collection.photos.sort((a, b) => {
          const orderA = collection.photoOrder[a.id] || 0;
          const orderB = collection.photoOrder[b.id] || 0;
          return orderA - orderB;
        });
      }
      return collection;
    });
  }

  async findAllPaginated(userId: string, page: number = 1, limit: number = 6) {
    const skip = (page - 1) * limit;

    const [collections, total] = await this.collectionRepository
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.photos', 'photos')
      .where({user: { id: userId },
        isPublic: true})
      .orderBy('collection.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Сортировка фотографий по порядку
    const sortedCollections = collections.map((collection) => {
      if (collection.photoOrder) {
        collection.photos.sort((a, b) => {
          const orderA = collection.photoOrder[a.id] || 0;
          const orderB = collection.photoOrder[b.id] || 0;
          return orderA - orderB;
        });
      }
      return collection;
    });

    return {
      collections: sortedCollections,
      hasMore: skip + collections.length < total,
    };
  }

  async findUserCollectionsPaginated(userId: string, page: number = 1, limit: number = 6) {
    const skip = (page - 1) * limit;

    const [collections, total] = await this.collectionRepository
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.photos', 'photos')
      .where('collection.user.id = :userId', { userId })
      .andWhere('collection.isPublic = :isPublic', { isPublic: true })
      .orderBy('collection.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const sortedCollections = collections.map((collection) => {
      if (collection.photoOrder) {
        collection.photos.sort((a, b) => {
          const orderA = collection.photoOrder[a.id] || 0;
          const orderB = collection.photoOrder[b.id] || 0;
          return orderA - orderB;
        });
      }
      return collection;
    });

    return {
      collections: sortedCollections,
      hasMore: skip + collections.length < total,
    };
  }
}
