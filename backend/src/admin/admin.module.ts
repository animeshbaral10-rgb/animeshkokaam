import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { Pet } from '../entities/pet.entity';
import { Device } from '../entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, Pet, Device])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

