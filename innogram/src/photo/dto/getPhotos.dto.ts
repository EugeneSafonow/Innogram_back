import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetPhotosDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
