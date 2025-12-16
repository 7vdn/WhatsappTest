-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "accessToken" TEXT UNIQUE NOT NULL,
  "messageCount" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on accessToken for faster API authentication
CREATE INDEX IF NOT EXISTS idx_users_access_token ON users("accessToken");

-- Create function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET "messageCount" = "messageCount" + 1 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can customize this later)
CREATE POLICY "Allow all operations" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
