/**
 * Script to create admin user
 * Run with: npm run create-admin
 * 
 * Make sure you have a .env file in the backend directory with:
 * DB_HOST=localhost
 * DB_PORT=5432
 * DB_USERNAME=your_username
 * DB_PASSWORD=your_password
 * DB_DATABASE=pet_tracking_db
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { join } from 'path';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';

// Load .env file from backend directory (if not already loaded by -r dotenv/config)
try {
  config({ path: join(process.cwd(), '.env') });
} catch (error) {
  // .env might already be loaded or doesn't exist
  console.log('Note: Using environment variables from system or .env file');
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@petracking.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

async function createAdmin() {
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
    const profileRepository = dataSource.getRepository(Profile);

    // Check if admin already exists
    let adminUser = await userRepository.findOne({
      where: { email: ADMIN_EMAIL },
    });

    if (adminUser) {
      // Update existing user to admin
      adminUser.isAdmin = true;
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      adminUser.encryptedPassword = hashedPassword;
      await userRepository.save(adminUser);
      console.log(`✅ Admin user updated: ${ADMIN_EMAIL}`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      adminUser = userRepository.create({
        email: ADMIN_EMAIL,
        encryptedPassword: hashedPassword,
        isAdmin: true,
        emailConfirmedAt: new Date(),
      });

      adminUser = await userRepository.save(adminUser);

      // Create profile
      const profile = profileRepository.create({
        id: adminUser.id,
        fullName: 'Administrator',
      });

      await profileRepository.save(profile);
      console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
    }

    console.log(`\n📧 Admin Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`\n⚠️  Please change the default password after first login!`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

