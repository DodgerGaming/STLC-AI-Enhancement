-- SQL to create auth_custom_user table
CREATE TABLE IF NOT EXISTS auth_Employee (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(30),
    middle_name VARCHAR(30),
    last_name VARCHAR(30),
    suffix VARCHAR(10),
    role VARCHAR(50) NOT NULL,
    email VARCHAR(254),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_authuser_employee_id ON auth_custom_user(employee_id);
CREATE INDEX IF NOT EXISTS idx_authuser_username ON auth_custom_user(username);
