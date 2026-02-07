import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Profile,
  Pet,
  Device,
  PetDeviceLink,
  Location,
  Geofence,
  Alert,
  AlertRule,
} from '../entities';

// Array of entity classes only (no enums)
const entities = [
  User,
  Profile,
  Pet,
  Device,
  PetDeviceLink,
  Location,
  Geofence,
  Alert,
  AlertRule,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // Prefer DATABASE_URL (recommended for Neon DB)
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities,
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            logging: configService.get<string>('NODE_ENV') === 'development',
            schema: 'public',
            ssl: { rejectUnauthorized: false },
          };
        }

        // Fallback to individual connection parameters
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'pet_tracking_db'),
          entities,
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
          schema: 'public',
          ssl: configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}







