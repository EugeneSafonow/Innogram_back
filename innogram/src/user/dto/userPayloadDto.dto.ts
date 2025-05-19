import { IsUUID, IsEmail, IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { UserRole } from '../../entities/user.entity';
import { KeyWord } from '../../entities/keyWord.entity';

export class UserPayloadDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsArray()
  interests?: KeyWord[];

  created_at: Date;
}
