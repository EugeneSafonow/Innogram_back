import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class UpdateCollectionDto {
    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    description?: string

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean
} 
