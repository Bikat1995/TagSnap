-- Enable UUID extension for user and estate IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estates table
CREATE TABLE IF NOT EXISTS estates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TYPE item_status AS ENUM ('draft', 'printed', 'sold');

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estate_id UUID REFERENCES estates(id) ON DELETE CASCADE,
    image_url TEXT,
    ai_title TEXT,
    ai_description TEXT,
    estimated_min_price DECIMAL(10, 2),
    estimated_max_price DECIMAL(10, 2),
    actual_price DECIMAL(10, 2),
    status item_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_estates_user_id ON estates(user_id);
CREATE INDEX idx_items_estate_id ON items(estate_id);
CREATE INDEX idx_items_status ON items(status);
