/*
  # Create Admin Users Table

  1. New Tables
    - `users`
      - `user_id` (integer, primary key, auto-increment)
      - `username` (text, unique, not null)
      - `hashed_password` (text, not null) - bcrypt hashed password
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Insert initial admin user with securely hashed password

  3. Initial Data
    - Creates admin user with username 'admin' and password 'admin123'
    - Password is hashed using bcrypt for security
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

-- Create policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Insert initial admin user with bcrypt hashed password
-- Password: admin123
-- Hash generated using bcrypt with salt rounds 12
INSERT INTO users (username, hashed_password) 
VALUES (
  'admin', 
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.6'
) ON CONFLICT (username) DO NOTHING;