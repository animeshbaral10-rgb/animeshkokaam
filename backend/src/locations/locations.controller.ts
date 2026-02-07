import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeviceIngestGuard } from './guards/device-ingest.guard';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** Device ingest: no JWT. Use header X-Api-Key: <DEVICE_INGEST_API_KEY>. Body: deviceId, latitude, longitude, ... */
  @Post('ingest')
  @UseGuards(DeviceIngestGuard)
  async ingest(@Body() body: any) {
    const deviceId = body.deviceId ?? body.device_id;
    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestException('deviceId is required');
    }
    const { deviceId: _d, device_id: _d2, ...rest } = body;
    const locationData = {
      ...rest,
      latitude: Number(rest.latitude),
      longitude: Number(rest.longitude),
      altitude: rest.altitude != null ? Number(rest.altitude) : undefined,
      speed: rest.speed != null ? Number(rest.speed) : undefined,
      satelliteCount: rest.satelliteCount != null ? Number(rest.satelliteCount) : undefined,
    };
    if (Number.isNaN(locationData.latitude) || Number.isNaN(locationData.longitude)) {
      throw new BadRequestException('latitude and longitude must be valid numbers');
    }
    try {
      return await this.locationsService.create(deviceId, locationData);
    } catch (err: any) {
      const message = err?.message || String(err);
      console.error('[locations/ingest]', message, err?.stack);
      throw err;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createLocationDto: any) {
    const deviceId = createLocationDto.device_id || createLocationDto.deviceId;
    return this.locationsService.create(deviceId, createLocationDto);
  }

  @Get('device/:deviceId')
  @UseGuards(JwtAuthGuard)
  findByDevice(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit != null ? parseInt(String(limit), 10) : undefined;
    const safeLimit = limitNum != null && !isNaN(limitNum) && limitNum > 0 ? Math.min(limitNum, 1000) : 100;
    return this.locationsService.findByDevice(deviceId, req.user.id, safeLimit);
  }

  @Get('pet/:petId')
  @UseGuards(JwtAuthGuard)
  findByPet(
    @Request() req,
    @Param('petId') petId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.locationsService.findByPet(petId, req.user.id, startTime, endTime);
  }

  @Get('device/:deviceId/latest')
  @UseGuards(JwtAuthGuard)
  getLatestLocation(@Request() req, @Param('deviceId') deviceId: string) {
    return this.locationsService.getLatestLocation(deviceId, req.user.id);
  }
}







