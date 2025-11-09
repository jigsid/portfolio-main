# Supabase Database Setup Guide

This guide will help you set up the required database tables and Row Level Security (RLS) policies for the guestbook feature with likes and comments.

## Required Tables

### 1. `messages` table (if not already exists)
```sql
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_image TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  msg TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
```

### 2. `message_likes` table
```sql
CREATE TABLE IF NOT EXISTS message_likes (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- For anonymous users: "name_email", for authenticated: user_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_identifier)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON message_likes(message_id);
CREATE INDEX IF NOT EXISTS idx_message_likes_user_identifier ON message_likes(user_identifier);
```

### 3. `message_comments` table
```sql
CREATE TABLE IF NOT EXISTS message_comments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_image TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_comments_message_id ON message_comments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_comments_created_at ON message_comments(created_at);
```

## Row Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_comments ENABLE ROW LEVEL SECURITY;
```

### Messages Table Policies

**Allow public read access:**
```sql
CREATE POLICY "Allow public read access to messages"
ON messages FOR SELECT
USING (true);
```

**Allow public insert:**
```sql
CREATE POLICY "Allow public insert to messages"
ON messages FOR INSERT
WITH CHECK (true);
```

**Allow users to delete their own messages:**
```sql
CREATE POLICY "Allow users to delete own messages"
ON messages FOR DELETE
USING (
  auth.uid() = user_id OR 
  auth.uid() = 'YOUR_ADMIN_USER_ID'::uuid
);
```

### Message Likes Table Policies

**Allow public read access:**
```sql
CREATE POLICY "Allow public read access to message_likes"
ON message_likes FOR SELECT
USING (true);
```

**Allow public insert:**
```sql
CREATE POLICY "Allow public insert to message_likes"
ON message_likes FOR INSERT
WITH CHECK (true);
```

**Allow users to delete their own likes:**
```sql
CREATE POLICY "Allow users to delete own likes"
ON message_likes FOR DELETE
USING (
  auth.uid() = user_id OR 
  user_identifier LIKE '%' || COALESCE(auth.email(), '') || '%'
);
```

### Message Comments Table Policies

**Allow public read access:**
```sql
CREATE POLICY "Allow public read access to message_comments"
ON message_comments FOR SELECT
USING (true);
```

**Allow public insert:**
```sql
CREATE POLICY "Allow public insert to message_comments"
ON message_comments FOR INSERT
WITH CHECK (true);
```

**Allow users to delete their own comments:**
```sql
CREATE POLICY "Allow users to delete own comments"
ON message_comments FOR DELETE
USING (
  auth.uid() = user_id OR 
  auth.uid() = 'YOUR_ADMIN_USER_ID'::uuid
);
```

## Important Notes

1. **Replace `YOUR_ADMIN_USER_ID`** with your actual admin user ID from the `site.config.tsx` file (`DATA.adminUserId`).

2. **Anonymous Users**: The policies allow anonymous users to read and write. The `user_identifier` field in `message_likes` is used to track anonymous users using a combination of name and email.

3. **Cascade Deletes**: When a message is deleted, all associated likes and comments are automatically deleted due to the `ON DELETE CASCADE` constraint.

4. **Unique Constraint**: The `UNIQUE(message_id, user_identifier)` constraint on `message_likes` prevents duplicate likes from the same user.

## Testing

After setting up the tables and policies, test:
1. Post a message as an anonymous user
2. Like a message as an anonymous user
3. Comment on a message as an anonymous user
4. Post a message as an authenticated user
5. Like and comment as an authenticated user
6. Delete your own messages/comments

## Troubleshooting

If you see "Failed to fetch" errors:
1. Check that RLS policies are correctly set up
2. Verify that the tables exist
3. Check Supabase logs for detailed error messages
4. Ensure your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables are set correctly

