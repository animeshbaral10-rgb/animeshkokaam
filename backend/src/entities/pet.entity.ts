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
import { Geofence } from './geofence.entity';
import { Alert } from './alert.entity';

@Entity('pets', { schema: 'public' })
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', default: 'dog' })
  species: string;

  @Column({ type: 'text', nullable: true })
  breed: string;

  @Column({ type: 'integer', name: 'age_years', nullable: true })
  ageYears: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'weight_kg', nullable: true })
  weightKg: number;

  @Column({ type: 'text', name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ type: 'text', name: 'microchip_id', nullable: true })
  microchipId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PetDeviceLink, (link) => link.pet)
  deviceLinks: PetDeviceLink[];

  @OneToMany(() => Geofence, (geofence) => geofence.pet)
  geofences: Geofence[];

  @OneToMany(() => Alert, (alert) => alert.pet)
  alerts: Alert[];
}

