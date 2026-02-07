import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Pet } from './pet.entity';
import { Device } from './device.entity';
import { Geofence } from './geofence.entity';

export enum AlertType {
  GEOFENCE_EXIT = 'geofence_exit',
  GEOFENCE_ENTRY = 'geofence_entry',
  LOW_BATTERY = 'low_battery',
  DEVICE_OFFLINE = 'device_offline',
  INACTIVITY = 'inactivity',
  CUSTOM = 'custom',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('alerts', { schema: 'public' })
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'pet_id', nullable: true })
  petId: string;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string;

  @Column({ type: 'uuid', name: 'geofence_id', nullable: true })
  geofenceId: string;

  @Column({
    type: 'text',
    name: 'alert_type',
  })
  alertType: AlertType;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'text',
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 8, name: 'location_latitude', nullable: true })
  locationLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, name: 'location_longitude', nullable: true })
  locationLongitude: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Pet, (pet) => pet.alerts, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Device, (device) => device.alerts, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @ManyToOne(() => Geofence, (geofence) => geofence.alerts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'geofence_id' })
  geofence: Geofence;
}

