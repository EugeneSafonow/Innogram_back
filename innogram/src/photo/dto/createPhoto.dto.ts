import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  @MaxLength(496)
  @IsOptional()
  description: string;

  @IsBoolean()
  is_public: boolean;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  keyWords: string[];
}
