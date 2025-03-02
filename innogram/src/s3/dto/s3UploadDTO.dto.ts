import { IsMimeType, IsOptional, IsString } from 'class-validator';

export class S3UploadDTO {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsMimeType()
  contentType: string;
}
