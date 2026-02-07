import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Location } from '../entities/location.entity';
import { Device } from '../entities/device.entity';
import { PetDeviceLink } from '../entities/pet-device-link.entity';
import { AlertService } from '../alerts/alert.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(PetDeviceLink)
    private petDeviceLinkRepository: Repository<PetDeviceLink>,
    private alertService: AlertService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async create(deviceIdOrDeviceIdString: string, locationData: CreateLocationDto) {
    // UUID format: 8-4-4-4-12 hex. If not a UUID, treat as device_id string (e.g. ESP32-GPS-01)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceIdOrDeviceIdString);
    let device = await this.deviceRepository.findOne({
      where: isUuid ? { id: deviceIdOrDeviceIdString } : { deviceId: deviceIdOrDeviceIdString },
      relations: ['petLinks', 'petLinks.pet'],
    });
    if (!device && isUuid) {
      device = await this.deviceRepository.findOne({
        where: { deviceId: deviceIdOrDeviceIdString },
        relations: ['petLinks', 'petLinks.pet'],
      });
    } else if (!device) {
      device = await this.deviceRepository.findOne({
        where: { id: deviceIdOrDeviceIdString },
        relations: ['petLinks', 'petLinks.pet'],
      });
    }

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Get active pet link
    const activeLink = await this.petDeviceLinkRepository.findOne({
      where: { deviceId: device.id, isActive: true },
      relations: ['pet'],
    });

    // Create location
    const location = this.locationRepository.create({
      ...locationData,
      deviceId: device.id,
      recordedAt: locationData.recordedAt ? new Date(locationData.recordedAt) : new Date(),
    });

    const savedLocation = await this.locationRepository.save(location);

    // Update device last_contact
    device.lastContact = savedLocation.recordedAt;
    await this.deviceRepository.save(device);

    // Process geofence alerts (don't fail the request if this throws)
    this.alertService.processLocationAlerts(
      device.id,
      { latitude: locationData.latitude, longitude: locationData.longitude },
      locationData.speed,
    ).catch(() => {});

    // Broadcast real-time update (don't fail the request if this throws)
    try {
      this.realtimeGateway.broadcastLocationUpdate(device.userId, {
        ...savedLocation,
        device,
        pet: activeLink?.pet || null,
      });
    } catch (_) {
      // ignore
    }

    return savedLocation;
  }

  async findByDevice(deviceId: string, userId: string, limit = 100) {
    // Verify device belongs to user
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.locationRepository.find({
      where: { deviceId },
      order: { recordedAt: 'DESC' },
      take: limit,
    });
  }

  async findByPet(petId: string, userId: string, startTime?: string, endTime?: string) {
    // Get device IDs linked to this pet
    const links = await this.petDeviceLinkRepository.find({
      where: { petId, isActive: true },
      relations: ['device'],
    });

    const deviceIds = links.map(link => link.deviceId);

    if (deviceIds.length === 0) {
      return [];
    }

    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .where('location.deviceId IN (:...deviceIds)', { deviceIds })
      .orderBy('location.recordedAt', 'DESC');

    if (startTime) {
      queryBuilder.andWhere('location.recordedAt >= :startTime', { startTime });
    }
    if (endTime) {
      queryBuilder.andWhere('location.recordedAt <= :endTime', { endTime });
    }

    return queryBuilder.getMany();
  }

  async getLatestLocation(deviceId: string, userId: string) {
    // Verify device belongs to user
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.locationRepository.findOne({
      where: { deviceId },
      order: { recordedAt: 'DESC' },
    });
  }
}
