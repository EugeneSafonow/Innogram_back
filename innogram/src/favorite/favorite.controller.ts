import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';

import { FavoriteService } from './favorite.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { JwtAuthGuard } from 'src/guards/jwtAuth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  async addToFavorites(@Request() req, @Body() dto: AddFavoriteDto) {
    return this.favoriteService.addToFavorites(req.user, dto);
  }

  @Delete(':photoId')
  async removeFromFavorites(@Request() req, @Param('photoId') photoId: number) {
    return this.favoriteService.removeFromFavorites(req.user, photoId);
  }

  @Get()
  async getUserFavorites(@Request() req) {
    return this.favoriteService.getUserFavorites(req.user.id);
  }

  @Get(':photoId/status')
  async isPhotoInFavorites(@Request() req, @Param('photoId') photoId: number) {
    return this.favoriteService.isPhotoInFavorites(req.user.id, photoId);
  }
}
