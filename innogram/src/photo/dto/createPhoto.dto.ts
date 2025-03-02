import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description: string;

  @IsBoolean()
  is_public: boolean;
}
