import { Injectable, NotFoundException, Inject } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Favorite } from '../entities/favorite.entity'
import { Photo } from '../entities/photo.entity'
import { User } from '../entities/user.entity'
import { AddFavoriteDto } from './dto/add-favorite.dto'
import { InterestService } from '../interest/interest.service'

@Injectable()
export class FavoriteService {
    constructor(
        @Inject('FAVORITE_REPOSITORY')
        private readonly favoriteRepository: Repository<Favorite>,
        @Inject('PHOTO_REPOSITORY')
        private readonly photoRepository: Repository<Photo>,
        private readonly interestService: InterestService,
    ) {}

    async addToFavorites(user: User, dto: AddFavoriteDto): Promise<Favorite> {
        const photo = await this.photoRepository.findOne({
            where: { id: dto.photoId, is_public: true },  
            relations: ['keyWords'],
        })

        if (!photo) {
            throw new NotFoundException('Photo not found')
        }

        const existingFavorite = await this.favoriteRepository.findOne({
            where: {
                user: { id: user.id },
                photo: { id: dto.photoId },
            },
        })

        if (existingFavorite) {
            return existingFavorite
        }

        const favorite = this.favoriteRepository.create({
            user,
            photo,
        })

        if (photo.keyWords && photo.keyWords.length > 0) {
            const keyWordNames = photo.keyWords.map(keyword => keyword.name);
            await this.interestService.updateInterestsFromFavorite(user.id, keyWordNames);
        }

        return this.favoriteRepository.save(favorite)
    }

    async removeFromFavorites(user: User, photoId: number): Promise<void> {
        const favorite = await this.favoriteRepository.findOne({
            where: {
                user: { id: user.id },
                photo: { id: photoId },
            },
        })

        if (favorite) {
            await this.favoriteRepository.remove(favorite)
        }
    }

    async getUserFavorites(userId: string): Promise<Favorite[]> {
        return this.favoriteRepository.find({
            where: { user: { id: userId } },
            relations: ['photo', 'photo.user'],
            order: { createdAt: 'DESC' },
        })
    }

    async getUserFavoritesPaginated(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [favorites, total] = await this.favoriteRepository
            .createQueryBuilder('favorite')
            .leftJoinAndSelect('favorite.photo', 'photo')
            .leftJoinAndSelect('photo.user', 'user')
            .where('favorite.user.id = :userId', { userId })
            .orderBy('favorite.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            favorites,
            hasMore: skip + favorites.length < total,
        };
    }

    async isPhotoInFavorites(userId: string, photoId: number): Promise<boolean> {
        const favorite = await this.favoriteRepository.findOne({
            where: {
                user: { id: userId },
                photo: { id: photoId },
            },
        })

        return !!favorite
    }
} 
