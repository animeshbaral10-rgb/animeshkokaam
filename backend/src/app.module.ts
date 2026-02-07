import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { DevicesModule } from './devices/devices.module';
import { LocationsModule } from './locations/locations.module';
import { GeofencesModule } from './geofences/geofences.module';
import { AlertsModule } from './alerts/alerts.module';
import { DatabaseModule } from './database/database.module';
import { RealtimeModule } from './realtime/realtime.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'], // Try .env.local first, then .env
    }),
    DatabaseModule,
    EmailModule,
    AuthModule,
    AdminModule,
    PetsModule,
    DevicesModule,
    LocationsModule,
    GeofencesModule,
    AlertsModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

