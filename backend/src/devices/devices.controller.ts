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
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Request() req, @Body() createDeviceDto: any) {
    return this.devicesService.create(req.user.id, createDeviceDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.devicesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.devicesService.findOne(id, req.user.id);
  }

  @Post(':id/link-pet')
  linkToPet(@Request() req, @Param('id') id: string, @Body() body: { petId: string }) {
    return this.devicesService.linkToPet(id, body.petId, req.user.id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDeviceDto: any) {
    return this.devicesService.update(id, req.user.id, updateDeviceDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.devicesService.remove(id, req.user.id);
  }
}







