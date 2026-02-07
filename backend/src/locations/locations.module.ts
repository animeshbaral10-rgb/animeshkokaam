import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { DeviceIngestGuard } from './guards/device-ingest.guard';
import { Location } from '../entities/location.entity';
import { Device } from '../entities/device.entity';
import { PetDeviceLink } from '../entities/pet-device-link.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, Device, PetDeviceLink]),
    AlertsModule,
    RealtimeModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService, DeviceIngestGuard],
  exports: [LocationsService],
})
export class LocationsModule {}
