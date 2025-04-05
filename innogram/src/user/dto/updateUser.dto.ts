import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateUserDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests: string[];

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be either user or admin' })
  role?: UserRole;
}
