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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from 'src/guards/jwtAuth.guard';
import { RequestWithUser } from 'src/types/request.types';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('photo/:photoId')
  create(
    @Req() req: RequestWithUser,
    @Param('photoId') photoId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.create(req.user.id, +photoId, createCommentDto);
  }

  @Get('photo/:photoId')
  findAll(@Param('photoId') photoId: string) {
    return this.commentService.findAll(+photoId);
  }

  @Delete(':commentId')
  remove(@Req() req: RequestWithUser, @Param('commentId') commentId: number) {
    return this.commentService.remove(req.user.id, commentId);
  }
}
