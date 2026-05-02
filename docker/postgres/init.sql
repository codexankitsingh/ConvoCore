-- PostgreSQL initialization script
-- Runs once when container is first created

-- Enable UUID extension (we'll use UUIDs as primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search (future feature)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully with extensions';
END $$;
