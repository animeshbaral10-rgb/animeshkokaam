/**
 * Creates database "pettracker" and runs migrations.
 * Run from backend folder: node scripts/setup-database.js
 * Requires PostgreSQL running and .env with DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD.
 */
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_DATABASE || 'pettracker';
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function run() {
  console.log('PostgreSQL setup for Pet Tracker');
  console.log('Connecting to', config.host + ':' + config.port, 'as', config.user);

  const adminClient = new Client({ ...config, database: 'postgres' });
  try {
    await adminClient.connect();
  } catch (err) {
    console.error('Cannot connect to PostgreSQL.');
    if (err.message.includes('password')) {
      console.error('Check DB_PASSWORD in backend/.env (must match your PostgreSQL postgres user).');
    } else {
      console.error('Is PostgreSQL running? Check DB_HOST, DB_PORT in backend/.env');
    }
    console.error(err.message);
    process.exit(1);
  }

  try {
    const res = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    if (res.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
      console.log('Created database:', DB_NAME);
    } else {
      console.log('Database already exists:', DB_NAME);
    }
  } finally {
    await adminClient.end();
  }

  const dbClient = new Client({ ...config, database: DB_NAME });
  await dbClient.connect();

  const runSqlFile = async (filePath) => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.error('File not found:', fullPath);
      throw new Error('Migration file not found');
    }
    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log('Running', filePath, '...');
    await dbClient.query(sql);
    console.log('Done:', filePath);
  };

  try {
    await runSqlFile('migrations/001_create_tables_local.sql');
    await runSqlFile('src/admin/add-admin-columns.sql');
    console.log('All migrations completed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

run();
