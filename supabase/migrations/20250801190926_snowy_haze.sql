/*
  # Create admin user with credentials

  1. New Data
    - Insert admin user with email `admin@happyacademy.com`
    - Password hash for `HappyAcademy`
    - Name set to `Admin User`

  2. Security
    - Uses bcrypt hash for password security
    - Follows existing RLS policies on admin_users table

  3. Notes
    - This creates the initial admin user for the system
    - Password is securely hashed using bcrypt
*/

-- Insert the admin user with hashed password
-- Password: HappyAcademy
-- Hash generated using bcrypt with salt rounds 10
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'admin@happyacademy.com',
  '$2a$10$8K1p/a0dclxvihoX3nb.Oe4.WXsm9V.kfzEKHqKM5Y1J8YQBtAg1.',
  'Admin User'
)
ON CONFLICT (email) DO NOTHING;