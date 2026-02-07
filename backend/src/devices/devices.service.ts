import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from '../entities/device.entity';
import { PetDeviceLink } from '../entities/pet-device-link.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(PetDeviceLink)
    private petDeviceLinkRepository: Repository<PetDeviceLink>,
  ) {}

  async findAll(userId: string) {
    return this.deviceRepository.find({
      where: { userId },
      relations: ['petLinks', 'petLinks.pet'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const device = await this.deviceRepository.findOne({
      where: { id, userId },
      relations: ['petLinks', 'petLinks.pet'],
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  async findByDeviceId(deviceId: string) {
    return this.deviceRepository.findOne({
      where: { deviceId },
    });
  }

  async create(userId: string, deviceData: any) {
    // Check if device_id already exists
    const existing = await this.deviceRepository.findOne({
      where: { deviceId: deviceData.deviceId },
    });

    if (existing) {
      throw new ConflictException('Device with this device_id already exists');
    }

    const device = this.deviceRepository.create({
      ...deviceData,
      userId,
      status: deviceData.status || DeviceStatus.ACTIVE,
    });

    return this.deviceRepository.save(device);
  }

  async linkToPet(deviceId: string, petId: string, userId: string) {
    // Verify device belongs to user
    const device = await this.findOne(deviceId, userId);

    // Check if link already exists
    const existingLink = await this.petDeviceLinkRepository.findOne({
      where: { deviceId: device.id, petId, isActive: true },
    });

    if (existingLink) {
      throw new ConflictException('Device is already linked to this pet');
    }

    // Deactivate any existing links for this device
    await this.petDeviceLinkRepository.update(
      { deviceId: device.id, isActive: true },
      { isActive: false, unlinkedAt: new Date() },
    );

    // Create new link
    const link = this.petDeviceLinkRepository.create({
      deviceId: device.id,
      petId,
      isActive: true,
    });

    return this.petDeviceLinkRepository.save(link);
  }

  async update(id: string, userId: string, deviceData: any) {
    const device = await this.findOne(id, userId);
    Object.assign(device, deviceData);
    return this.deviceRepository.save(device);
  }

  async remove(id: string, userId: string) {
    const device = await this.findOne(id, userId);
    await this.deviceRepository.remove(device);
    return { success: true };
  }
}
