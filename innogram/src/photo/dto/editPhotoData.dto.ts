import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class EditPhotoDataDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description: string;

  @IsBoolean()
  is_public: boolean;
}
