import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class CreateCollectionDto {
    @IsString()
    name: string

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean
} 
