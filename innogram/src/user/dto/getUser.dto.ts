import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetUserdDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
