const { Pool } = require('pg');

// DATABASE_URL comes from Neon (or Supabase/Railway Postgres) — see README.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required by Neon/Supabase
});

module.exports = pool;
