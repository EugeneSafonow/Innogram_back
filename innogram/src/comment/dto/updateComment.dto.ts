import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';


export class UpdateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(1000)
    text: string
} 
