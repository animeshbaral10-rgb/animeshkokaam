import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @IsEnum(['dog', 'cat', 'bird', 'other'])
  species?: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsNumber()
  @IsOptional()
  ageYears?: number;

  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  microchipId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

