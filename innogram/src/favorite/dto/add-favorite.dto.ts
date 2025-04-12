import { IsNotEmpty, IsPositive } from 'class-validator'

export class AddFavoriteDto {
    @IsPositive()
    @IsNotEmpty()
    photoId: number
} 
