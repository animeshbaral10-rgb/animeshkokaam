import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geofence, GeofenceType } from '../entities/geofence.entity';
import { GeofencingService } from './geofencing.service';

@Injectable()
export class GeofencesService {
  constructor(
    @InjectRepository(Geofence)
    private geofenceRepository: Repository<Geofence>,
    private geofencingService: GeofencingService,
  ) {}

  async findAll(userId: string) {
    return this.geofenceRepository.find({
      where: { userId },
      relations: ['pet'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const geofence = await this.geofenceRepository.findOne({
      where: { id, userId },
    });

    if (!geofence) {
      throw new NotFoundException('Geofence not found');
    }

    return geofence;
  }

  async create(userId: string, geofenceData: any) {
    const geofence = this.geofenceRepository.create({
      ...geofenceData,
      userId,
      type: geofenceData.type || GeofenceType.CIRCLE,
    });

    return this.geofenceRepository.save(geofence);
  }

  async update(id: string, userId: string, geofenceData: any) {
    const geofence = await this.findOne(id, userId);
    Object.assign(geofence, geofenceData);
    return this.geofenceRepository.save(geofence);
  }

  async remove(id: string, userId: string) {
    const geofence = await this.findOne(id, userId);
    await this.geofenceRepository.remove(geofence);
    return { success: true };
  }

  async checkLocation(geofenceId: string, userId: string, latitude: number, longitude: number) {
    const geofence = await this.findOne(geofenceId, userId);
    const isInside = this.geofencingService.isLocationInGeofence(
      { latitude, longitude },
      {
        id: geofence.id,
        centerLatitude: geofence.centerLatitude,
        centerLongitude: geofence.centerLongitude,
        radiusMeters: geofence.radiusMeters,
      },
    );

    return {
      geofenceId,
      isInside,
      distance: this.geofencingService.getDistanceToGeofence(
        { latitude, longitude },
        {
          id: geofence.id,
          centerLatitude: geofence.centerLatitude,
          centerLongitude: geofence.centerLongitude,
          radiusMeters: geofence.radiusMeters,
        },
      ),
    };
  }
}
