-- Migration: add minimum_package_count column to ingredients table if it does not exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='minimum_package_count') THEN
        ALTER TABLE ingredients ADD COLUMN minimum_package_count integer NOT NULL DEFAULT 0;
    END IF;
END $$;
