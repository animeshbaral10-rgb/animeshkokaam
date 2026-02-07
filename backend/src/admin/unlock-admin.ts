/**
 * Script to unlock admin account
 * Run with: npm run unlock-admin
 * 
 * This script will unlock the admin account if it's locked
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';

// Load .env file from backend directory
try {
  config({ path: join(process.cwd(), '.env') });
} catch (error) {
  console.log('Note: Using environment variables from system or .env file');
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@petracking.com';

async function unlockAdmin() {
  // Get database credentials from environment
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbUsername = process.env.DB_USERNAME || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbDatabase = process.env.DB_DATABASE || 'pet_tracking_db';

  console.log(`\n🔌 Connecting to database...`);
  console.log(`   Host: ${dbHost}`);
  console.log(`   Port: ${dbPort}`);
  console.log(`   Database: ${dbDatabase}`);
  console.log(`   Username: ${dbUsername}\n`);

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: dbDatabase,
    entities: [User, Profile],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully\n');

    const userRepository = dataSource.getRepository(User);

    // Find admin user
    const adminUser = await userRepository.findOne({
      where: { email: ADMIN_EMAIL },
    });

    if (!adminUser) {
      console.error(`❌ Admin user not found: ${ADMIN_EMAIL}`);
      console.log(`\n💡 Create admin user first with: npm run create-admin\n`);
      await dataSource.destroy();
      process.exit(1);
    }

    if (!adminUser.isAdmin) {
      console.warn(`⚠️  User ${ADMIN_EMAIL} exists but is not marked as admin`);
      console.log(`   Setting isAdmin = true...`);
      adminUser.isAdmin = true;
    }

    // Unlock the account
    const wasLocked = adminUser.isLocked;
    adminUser.isLocked = false;
    adminUser.failedLoginAttempts = 0;
    adminUser.lockedUntil = null;

    await userRepository.save(adminUser);

    if (wasLocked) {
      console.log(`✅ Admin account unlocked: ${ADMIN_EMAIL}`);
    } else {
      console.log(`✅ Admin account is already unlocked: ${ADMIN_EMAIL}`);
    }
    console.log(`   - isLocked: false`);
    console.log(`   - failedLoginAttempts: 0`);
    console.log(`   - isAdmin: true`);

    await dataSource.destroy();
    console.log(`\n✅ Done! You can now login with the admin account.\n`);
  } catch (error) {
    console.error('❌ Error unlocking admin account:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

unlockAdmin();

