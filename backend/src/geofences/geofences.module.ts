import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeofencesController } from './geofences.controller';
import { GeofencesService } from './geofences.service';
import { GeofencingService } from './geofencing.service';
import { Geofence } from '../entities/geofence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Geofence])],
  controllers: [GeofencesController],
  providers: [GeofencesService, GeofencingService],
  exports: [GeofencingService, GeofencesService],
})
export class GeofencesModule {}







