-- Run this on an existing pettracker database that already has tables (from create_pettracker_full.sql).
-- Safe to run multiple times. Does nothing if tables/schema are missing.

-- Indexes (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pet_device_link') THEN
    CREATE INDEX IF NOT EXISTS idx_pet_device_link_pet_active ON public.pet_device_link(pet_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_pet_device_link_device_active ON public.pet_device_link(device_id, is_active);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devices') THEN
    CREATE INDEX IF NOT EXISTS idx_devices_last_contact ON public.devices(last_contact);
  END IF;
END $$;

-- Function and trigger for auth.users updated_at (only if auth schema and users table exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth.users;
    CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;
