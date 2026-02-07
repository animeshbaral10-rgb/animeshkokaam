import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { PetDeviceLink } from './pet-device-link.entity';
import { Location } from './location.entity';
import { Alert } from './alert.entity';

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('devices', { schema: 'public' })
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', name: 'device_id', unique: true })
  deviceId: string;

  @Column({ type: 'text', name: 'sim_number', nullable: true })
  simNumber: string;

  @Column({ type: 'text', nullable: true })
  imei: string;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  model: string;

  @Column({ type: 'text', name: 'firmware_version', nullable: true })
  firmwareVersion: string;

  @Column({ type: 'integer', name: 'battery_level', nullable: true })
  batteryLevel: number;

  @Column({ type: 'timestamptz', name: 'last_contact', nullable: true })
  lastContact: Date;

  @Column({
    type: 'text',
    default: DeviceStatus.ACTIVE,
  })
  status: DeviceStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PetDeviceLink, (link) => link.device)
  petLinks: PetDeviceLink[];

  @OneToMany(() => Location, (location) => location.device)
  locations: Location[];

  @OneToMany(() => Alert, (alert) => alert.device)
  alerts: Alert[];
}

