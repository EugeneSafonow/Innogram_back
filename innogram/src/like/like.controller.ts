import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/createLike.dto';
import { JwtAuthGuard } from 'src/guards/jwtAuth.guard';
import { RequestWithUser } from 'src/types/request.types';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() createLikeDto: CreateLikeDto) {
    return this.likeService.create(req.user.id, createLikeDto);
  }

  @Delete(':photoId')
  remove(@Req() req: RequestWithUser, @Param('photoId') photoId: string) {
    return this.likeService.remove(req.user.id, +photoId);
  }

  @Get('photo/:photoId/count')
  getPhotoLikes(@Param('photoId') photoId: string) {
    return this.likeService.getPhotoLikes(+photoId);
  }

  @Get('photo/:photoId/status')
  hasUserLiked(@Req() req: RequestWithUser, @Param('photoId') photoId: string) {
    return this.likeService.hasUserLiked(req.user.id, +photoId);
  }
}
