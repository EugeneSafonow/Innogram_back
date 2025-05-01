import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwtAuth.guard';
import { InterestService } from './interest.service';

@Controller('interests')
@UseGuards(JwtAuthGuard)
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  @Get()
  async getUserInterests(@Request() req) {
    return this.interestService.getUserInterests(req.user.id);
  }
} 
