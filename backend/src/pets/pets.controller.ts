import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePetDto } from './dto/create-pet.dto';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  create(@Request() req, @Body() createPetDto: CreatePetDto) {
    return this.petsService.create(req.user.id, createPetDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.petsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.petsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updatePetDto: any) {
    return this.petsService.update(id, req.user.id, updatePetDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.petsService.remove(id, req.user.id);
  }
}







