-- Maintenance Management System
-- Safe to run multiple times (uses IF NOT EXISTS + ALTERs).

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'portal_user',
    department VARCHAR(80),
    company VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backward-compatible ALTERs (for older DBs created with earlier schema)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(80),
    serial_number VARCHAR(60) UNIQUE NOT NULL,
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(80),
    company VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS technician_id INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category VARCHAR(80);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS company VARCHAR(120);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS maintenance_requests (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    requested_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    maintenance_type VARCHAR(20) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'New Request',
    work_center VARCHAR(120),
    notes TEXT,
    instructions TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS requested_by_id INTEGER;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS assigned_technician_id INTEGER;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(20);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS work_center VARCHAR(120);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Rename earlier columns if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='maintenance_requests' AND column_name='request_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='maintenance_requests' AND column_name='maintenance_type'
    ) THEN
        EXECUTE 'ALTER TABLE maintenance_requests RENAME COLUMN request_type TO maintenance_type';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='maintenance_requests' AND column_name='description'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='maintenance_requests' AND column_name='notes'
    ) THEN
        EXECUTE 'ALTER TABLE maintenance_requests RENAME COLUMN description TO notes';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='maintenance_requests' AND column_name='request_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='maintenance_requests' AND column_name='created_at'
    ) THEN
        EXECUTE 'ALTER TABLE maintenance_requests RENAME COLUMN request_date TO created_at';
    END IF;
END $$;

-- Basic performance
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment (name);
CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment (serial_number);
CREATE INDEX IF NOT EXISTS idx_requests_equipment ON maintenance_requests (equipment_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON maintenance_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_start ON maintenance_requests (scheduled_start);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_maintenance_requests_updated_at'
    ) THEN
        CREATE TRIGGER trg_maintenance_requests_updated_at
        BEFORE UPDATE ON maintenance_requests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;
