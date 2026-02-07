/**
 * Creates a pet "dog" and device "ESP32-GPS-01", then links them.
 * Uses existing user or creates a default one.
 * Run from backend: npx ts-node -r dotenv/config scripts/seed-dog-and-tracker.ts
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { join } from 'path';
import { User } from '../src/entities/user.entity';
import { Profile } from '../src/entities/profile.entity';
import { Pet } from '../src/entities/pet.entity';
import { Device, DeviceStatus } from '../src/entities/device.entity';
import { PetDeviceLink } from '../src/entities/pet-device-link.entity';
import { Location } from '../src/entities/location.entity';
import { Geofence } from '../src/entities/geofence.entity';
import { Alert } from '../src/entities/alert.entity';
import { AlertRule } from '../src/entities/alert-rule.entity';

config({ path: join(__dirname, '..', '.env') });

const SEED_EMAIL = process.env.SEED_USER_EMAIL || 'user@petracker.com';
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD || 'PetTracker123';
const PET_NAME = 'dog';
const DEVICE_ID_STR = 'ESP32-GPS-01';

async function run() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'pettracker',
    entities: [User, Profile, Pet, Device, PetDeviceLink, Location, Geofence, Alert, AlertRule],
    synchronize: false,
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const profileRepo = dataSource.getRepository(Profile);
  const petRepo = dataSource.getRepository(Pet);
  const deviceRepo = dataSource.getRepository(Device);
  const linkRepo = dataSource.getRepository(PetDeviceLink);

  let user = await userRepo.findOne({ where: { email: SEED_EMAIL } });
  if (!user) {
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
    user = userRepo.create({
      email: SEED_EMAIL,
      encryptedPassword: hashedPassword,
      emailConfirmedAt: new Date(),
    });
    user = await userRepo.save(user);
    const profile = profileRepo.create({ id: user.id, fullName: 'Pet Owner' });
    await profileRepo.save(profile);
    console.log('Created user:', SEED_EMAIL);
  }

  let pet = await petRepo.findOne({ where: { userId: user.id, name: PET_NAME } });
  if (!pet) {
    pet = petRepo.create({ userId: user.id, name: PET_NAME, species: 'dog' });
    pet = await petRepo.save(pet);
    console.log('Created pet:', PET_NAME);
  } else {
    console.log('Pet already exists:', PET_NAME);
  }

  let device = await deviceRepo.findOne({ where: { deviceId: DEVICE_ID_STR } });
  if (!device) {
    device = deviceRepo.create({
      userId: user.id,
      deviceId: DEVICE_ID_STR,
      name: 'GPS Tracker',
      status: DeviceStatus.ACTIVE,
    });
    device = await deviceRepo.save(device);
    console.log('Created device:', DEVICE_ID_STR);
  } else {
    if (device.userId !== user.id) {
      device.userId = user.id;
      await deviceRepo.save(device);
    }
    console.log('Device already exists:', DEVICE_ID_STR);
  }

  let link = await linkRepo.findOne({
    where: { petId: pet.id, deviceId: device.id, isActive: true },
  });
  if (!link) {
    await linkRepo.update(
      { deviceId: device.id, isActive: true },
      { isActive: false, unlinkedAt: new Date() },
    );
    link = linkRepo.create({
      petId: pet.id,
      deviceId: device.id,
      isActive: true,
    });
    await linkRepo.save(link);
    console.log('Linked device to pet:', PET_NAME);
  } else {
    console.log('Device already linked to pet');
  }

  await dataSource.destroy();
  console.log('\nDone. You can log in with', SEED_EMAIL, 'and password', SEED_PASSWORD);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
