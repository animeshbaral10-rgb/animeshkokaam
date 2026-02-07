import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertService } from './alert.service';
import { GeofencesModule } from '../geofences/geofences.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Alert } from '../entities/alert.entity';
import { AlertRule } from '../entities/alert-rule.entity';
import { Device } from '../entities/device.entity';
import { Geofence } from '../entities/geofence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, AlertRule, Device, Geofence]),
    GeofencesModule,
    RealtimeModule,
  ],
  controllers: [AlertsController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertsModule {}







