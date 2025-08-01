/*
  # Create Users Table for Admin Authentication

  1. New Tables
    - `users`
      - `user_id` (SERIAL, primary key) - Auto-incrementing user identifier
      - `username` (VARCHAR(255), unique, not null) - Unique username for login
      - `hashed_password` (VARCHAR(255), not null) - Securely hashed password using bcrypt
      - `created_at` (TIMESTAMPTZ, default now()) - Account creation timestamp

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Insert initial admin user with securely hashed password

  3. Initial Data
    - Creates admin user with username 'admin' and password 'admin123' (hashed with bcrypt)
*/

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Insert initial admin user with hashed password
-- Password: admin123 (hashed with bcrypt, 12 rounds)
INSERT INTO users (username, hashed_password) 
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9u.')
ON CONFLICT (username) DO NOTHING;