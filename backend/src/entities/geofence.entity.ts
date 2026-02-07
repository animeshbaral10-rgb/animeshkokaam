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
import { Pet } from './pet.entity';
import { Alert } from './alert.entity';

export enum GeofenceType {
  CIRCLE = 'circle',
  POLYGON = 'polygon',
}

@Entity('geofences', { schema: 'public' })
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'pet_id', nullable: true })
  petId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({
    type: 'text',
    default: GeofenceType.CIRCLE,
  })
  type: GeofenceType;

  @Column({ type: 'decimal', precision: 10, scale: 8, name: 'center_latitude', nullable: true })
  centerLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, name: 'center_longitude', nullable: true })
  centerLongitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'radius_meters', nullable: true })
  radiusMeters: number;

  @Column({ type: 'jsonb', name: 'polygon_coordinates', nullable: true })
  polygonCoordinates: any;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', name: 'alert_on_entry', default: false })
  alertOnEntry: boolean;

  @Column({ type: 'boolean', name: 'alert_on_exit', default: true })
  alertOnExit: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Pet, (pet) => pet.geofences, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @OneToMany(() => Alert, (alert) => alert.geofence)
  alerts: Alert[];
}

