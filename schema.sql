-- Run this once against your Neon (or any Postgres) database
-- to create the table that stores accounts.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Speeds up the most common lookup (login, verification)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
