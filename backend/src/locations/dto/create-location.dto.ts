import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @IsOptional()
  altitude?: number;

  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @IsNumber()
  @IsOptional()
  speed?: number;

  @IsNumber()
  @IsOptional()
  heading?: number;

  @IsNumber()
  @IsOptional()
  satelliteCount?: number;

  @IsNumber()
  @IsOptional()
  batteryLevel?: number;

  @IsNumber()
  @IsOptional()
  signalStrength?: number;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;
}

