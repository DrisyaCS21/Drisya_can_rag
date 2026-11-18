
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector
  `);

  // User accounts
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Uploaded PDF metadata
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploaded_documents (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL
        REFERENCES app_users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Keep your existing chunks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      embedding VECTOR(3072)
    )
  `);

  // Link each chunk to its uploaded PDF
  await pool.query(`
    ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS document_id UUID
    REFERENCES uploaded_documents(id) ON DELETE CASCADE
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user
    ON uploaded_documents(user_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_document
    ON documents(document_id)
  `);

  console.log('Database ready');
}

module.exports = { pool, initDb };
