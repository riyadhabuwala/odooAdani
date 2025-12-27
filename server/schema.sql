-- Database Schema for Maintenance Management System

-- Users Table (Technicians and Employees)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'portal_user', -- 'portal_user', 'technician', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Table (Assets)
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(50),
    employee_id INTEGER REFERENCES users(id),
    technician_id INTEGER REFERENCES users(id),
    category VARCHAR(50),
    company VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Down', 'Scrap'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Requests Table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id) NOT NULL,
    request_type VARCHAR(20) NOT NULL, -- 'Corrective', 'Preventive'
    priority INTEGER DEFAULT 1, -- 1-3 (Diamond/Star shapes)
    status VARCHAR(20) DEFAULT 'New Request', -- 'New Request', 'In Progress', 'Repaired', 'Scrap'
    description TEXT,
    instructions TEXT,
    technician_id INTEGER REFERENCES users(id),
    work_center VARCHAR(100),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP WITH TIME ZONE
);
