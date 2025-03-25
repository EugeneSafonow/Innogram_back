import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class ChangePasswordDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Old password must be at least 6 characters long' })
  oldPassword: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
