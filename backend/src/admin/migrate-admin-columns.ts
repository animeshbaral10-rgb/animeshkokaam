/**
 * Migration script to add admin and lockout columns
 * Run with: npm run migrate-admin
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

// Load .env file
try {
  config({ path: join(process.cwd(), '.env') });
} catch (error) {
  console.log('Note: Using environment variables from system or .env file');
}

async function migrateAdminColumns() {
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
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully\n');

    // Read and execute SQL migration
    const sqlPath = join(__dirname, 'add-admin-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Running migration...\n');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await dataSource.query(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`ℹ️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Added columns:');
    console.log('   - is_admin (boolean)');
    console.log('   - is_locked (boolean)');
    console.log('   - failed_login_attempts (integer)');
    console.log('   - locked_until (timestamptz)');
    console.log('\n🚀 You can now run: npm run create-admin\n');

    await dataSource.destroy();
  } catch (error: any) {
    console.error('\n❌ Error running migration:', error.message);
    if (error.driverError) {
      console.error('   Database error:', error.driverError.message);
    }
    process.exit(1);
  }
}

migrateAdminColumns();

