import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Pet } from './pet.entity';
import { Device } from './device.entity';

@Entity('pet_device_link', { schema: 'public' })
@Unique(['petId', 'deviceId'])
export class PetDeviceLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId: string;

  @Column({ type: 'uuid', name: 'device_id' })
  deviceId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'linked_at' })
  linkedAt: Date;

  @Column({ type: 'timestamptz', name: 'unlinked_at', nullable: true })
  unlinkedAt: Date;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Pet, (pet) => pet.deviceLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Device, (device) => device.petLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}

