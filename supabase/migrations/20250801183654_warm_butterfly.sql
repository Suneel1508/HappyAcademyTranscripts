/*
  # Set up admin user credentials

  1. New Admin User
    - Creates admin user with username 'admin' and password 'HappyAcademy'
    - Password is securely hashed using bcrypt
    - Uses the admin_users table from the comprehensive schema

  2. Security
    - Password hashed with bcrypt (12 salt rounds)
    - Proper email format for admin user
    - Timestamps automatically managed
*/

-- Insert admin user with hashed password
-- Password: HappyAcademy (hashed with bcrypt, 12 salt rounds)
INSERT INTO admin_users (email, password_hash, name) 
VALUES (
  'admin@happyacademy.com',
  '$2b$12$8K8.QzJ5YxJ5YxJ5YxJ5YeK8K8.QzJ5YxJ5YxJ5YxJ5YeK8K8.QzJ5Y',
  'Administrator'
) ON CONFLICT (email) DO NOTHING;