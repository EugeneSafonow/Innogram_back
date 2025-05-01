import { IsNotEmpty, IsNumber } from 'class-validator';

export class GenerateDownloadLinkDto {
  @IsNotEmpty()
  @IsNumber()
  photoId: number;
} 
