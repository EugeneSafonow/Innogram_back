import { Injectable, NotFoundException, Inject } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Favorite } from '../entities/favorite.entity'
import { Photo } from '../entities/photo.entity'
import { User } from '../entities/user.entity'
import { AddFavoriteDto } from './dto/add-favorite.dto'

@Injectable()
export class FavoriteService {
    constructor(
        @Inject('FAVORITE_REPOSITORY')
        private readonly favoriteRepository: Repository<Favorite>,
        @Inject('PHOTO_REPOSITORY')
        private readonly photoRepository: Repository<Photo>,
    ) {}

    async addToFavorites(user: User, dto: AddFavoriteDto): Promise<Favorite> {
        const photo = await this.photoRepository.findOne({
            where: { id: dto.photoId },
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
