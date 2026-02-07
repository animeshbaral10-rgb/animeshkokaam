-- Migration script to add admin and lockout columns to users table
-- Run this in your PostgreSQL database

-- Add admin and lockout columns to auth.users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL;

-- Create index on is_admin for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON auth.users(is_admin);

-- Create index on is_locked for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_locked ON auth.users(is_locked);

-- Update existing rows to have default values
UPDATE auth.users 
SET 
  is_admin = COALESCE(is_admin, false),
  is_locked = COALESCE(is_locked, false),
  failed_login_attempts = COALESCE(failed_login_attempts, 0)
WHERE is_admin IS NULL OR is_locked IS NULL OR failed_login_attempts IS NULL;

