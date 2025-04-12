import { IsNumber, IsOptional, Min } from 'class-validator'

export class GetRecommendedPhotosDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number
} 
