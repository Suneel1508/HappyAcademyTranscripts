/*
  # Fix admin user with plain text password for testing

  1. Updates
    - Update admin user password to plain text for testing
    - Ensure the admin user exists with correct credentials
  
  2. Security Note
    - This uses plain text password for development/testing only
    - In production, passwords should be properly hashed
*/

-- First, delete any existing admin user to start fresh
DELETE FROM admin_users WHERE email = 'admin@happyacademy.com';

-- Insert admin user with plain text password for testing
INSERT INTO admin_users (
  id,
  email, 
  password_hash, 
  name,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@happyacademy.com',
  'HappyAcademy',
  'Admin User',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  updated_at = now();