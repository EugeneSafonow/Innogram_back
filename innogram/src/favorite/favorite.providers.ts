import { DataSource } from 'typeorm'
import { Favorite } from '../entities/favorite.entity'
import { Photo } from '../entities/photo.entity'

export const favoriteProviders = [
    {
        provide: 'FAVORITE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Favorite),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'PHOTO_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Photo),
        inject: ['DATA_SOURCE'],
    },
] 
