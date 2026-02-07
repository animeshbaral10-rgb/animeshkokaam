import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Pet } from './pet.entity';
import { Device } from './device.entity';

export enum RuleType {
  GEOFENCE = 'geofence',
  BATTERY = 'battery',
  INACTIVITY = 'inactivity',
  CUSTOM = 'custom',
}

@Entity('alert_rules', { schema: 'public' })
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'pet_id', nullable: true })
  petId: string;

  @Column({ type: 'uuid', name: 'device_id', nullable: true })
  deviceId: string;

  @Column({
    type: 'text',
    name: 'rule_type',
  })
  ruleType: RuleType;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  conditions: any;

  @Column({ type: 'jsonb', nullable: true })
  actions: any;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Device, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}

