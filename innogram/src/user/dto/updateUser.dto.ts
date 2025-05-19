import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateUserDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  @MinLength(3)
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  email?: string;

  @IsOptional()
  avatar?: Express.Multer.File;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests: string[];
}
