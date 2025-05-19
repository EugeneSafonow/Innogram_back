import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { JwtAuthGuard } from 'src/guards/jwtAuth.guard';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  create(@Body() createCollectionDto: CreateCollectionDto, @Req() req) {
    return this.collectionService.create(req.user.id, createCollectionDto);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (page !== undefined && limit !== undefined) {
      return this.collectionService.findAllPaginated(req.user.id, page, limit);
    }
    return this.collectionService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.collectionService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ) {
    return this.collectionService.update(id, req.user.id, updateCollectionDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.collectionService.remove(id, req.user.id);
  }

  @Post(':id/photos/:photoId')
  addPhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: number,
    @Req() req,
  ) {
    return this.collectionService.addPhoto(id, photoId, req.user.id);
  }

  @Delete(':id/photos/:photoId')
  removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: number,
    @Req() req,
  ) {
    return this.collectionService.removePhoto(id, photoId, req.user.id);
  }

  @Patch(':id/photo-order')
  updatePhotoOrder(
    @Param('id') id: string,
    @Body() photoOrder: { [key: string]: number },
    @Req() req,
  ) {
    const { userId, ...cleanPhotoOrder } = photoOrder;

    return this.collectionService.updatePhotoOrder(
      id,
      cleanPhotoOrder,
      req.user.id,
    );
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  getUserCollections(
    @Param('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (page !== undefined && limit !== undefined) {
      return this.collectionService.findUserCollectionsPaginated(
        userId,
        page,
        limit,
      );
    }
    return this.collectionService.findUserCollections(userId);
  }

  @Get('paginated')
  @UseGuards(JwtAuthGuard)
  async getAllPaginated(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
  ) {
    return this.collectionService.findAllPaginated(req.user.id, page, limit);
  }

  @Patch(':id/toggle-visibility')
  updateVisibility(@Req() req, @Param('id') id: string) {
    return this.collectionService.toggleVisibility(id, req.user.id);
  }
}
