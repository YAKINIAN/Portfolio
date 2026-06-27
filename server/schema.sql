-- Run this once to set up your database

CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- web, app, design, engineering
    description TEXT,
    technologies VARCHAR(255),
    role VARCHAR(100),
    live_url VARCHAR(500),
    screenshots TEXT[],             -- array of Cloudinary secure_urls
    screenshot_ids TEXT[],          -- array of Cloudinary public_ids (for deletion)
    created_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add screenshot_ids column if upgrading existing DB
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS screenshot_ids TEXT[];

-- Generate hash with: node -e "const b=require('bcryptjs');b.hash('admin123',10).then(console.log)"
-- Then: INSERT INTO admin (username, password) VALUES ('admin', '<hash>');
