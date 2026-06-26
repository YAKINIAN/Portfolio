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
    screenshots TEXT[],             -- array of file paths
    created_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Default admin: username=admin password=admin123  (change after first login)
-- Generate hash with: node -e "const b=require('bcryptjs');b.hash('admin123',10).then(console.log)"
-- Then: INSERT INTO admin (username, password) VALUES ('admin', '<hash>');
