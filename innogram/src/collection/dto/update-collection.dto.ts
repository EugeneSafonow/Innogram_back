import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class UpdateCollectionDto {
    @IsString()
    @IsOptional()
    name?: string

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean
} 
