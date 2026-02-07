/**
 * Script to reset admin password
 * Run with: npm run reset-admin-password
 * 
 * Usage:
 *   npm run reset-admin-password
 *   ADMIN_PASSWORD=YourNewPassword npm run reset-admin-password
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';

// Load .env file from backend directory
try {
  config({ path: join(process.cwd(), '.env') });
} catch (error) {
  console.log('Note: Using environment variables from system or .env file');
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@petracking.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

async function resetAdminPassword() {
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Update password and unlock account
    adminUser.encryptedPassword = hashedPassword;
    adminUser.isLocked = false;
    adminUser.failedLoginAttempts = 0;
    adminUser.lockedUntil = null;
    
    // Ensure user is marked as admin
    if (!adminUser.isAdmin) {
      console.log(`⚠️  User ${ADMIN_EMAIL} was not marked as admin. Setting isAdmin = true...`);
      adminUser.isAdmin = true;
    }

    await userRepository.save(adminUser);

    console.log(`✅ Admin password reset successfully!`);
    console.log(`\n📧 Admin Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 New Password: ${ADMIN_PASSWORD}`);
    console.log(`\n✅ Account status:`);
    console.log(`   - isLocked: false`);
    console.log(`   - failedLoginAttempts: 0`);
    console.log(`   - isAdmin: true`);
    console.log(`\n💡 You can now login with the new password.\n`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

resetAdminPassword();

