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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { GeofencesService } from './geofences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('geofences')
@UseGuards(JwtAuthGuard)
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @Post()
  create(@Request() req, @Body() createGeofenceDto: any) {
    return this.geofencesService.create(req.user.id, createGeofenceDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.geofencesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.geofencesService.findOne(id, req.user.id);
  }

  @Get(':id/check')
  checkLocation(
    @Request() req,
    @Param('id') id: string,
    @Query('latitude') latitude: string | number,
    @Query('longitude') longitude: string | number,
  ) {
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : Number(latitude);
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new BadRequestException('latitude and longitude must be valid numbers');
    }
    return this.geofencesService.checkLocation(id, req.user.id, lat, lng);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateGeofenceDto: any) {
    return this.geofencesService.update(id, req.user.id, updateGeofenceDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.geofencesService.remove(id, req.user.id);
  }
}

