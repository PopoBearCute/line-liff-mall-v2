-- Create GroupLeaders table with updated schema (based on user image)
-- This script will DROP the existing table first to prevent errors.

-- 1. Drop existing table (and cascade to dependent policies)
DROP TABLE IF EXISTS "GroupLeaders" CASCADE;

-- 2. Create GroupLeaders table
CREATE TABLE "GroupLeaders" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "卡號" text,
  "Username" text UNIQUE NOT NULL,
  "團主名稱" text NOT NULL,
  "暱稱" text,
  "電話" text,
  "電子信箱" text,
  "指定地址" text,
  "加油站" text,        -- New: Gas Station Name (replaces Store Name conceptually)
  "站代號" text,        -- New: Station Code
  "緯度" float8,        -- Latitude
  "經度" float8,        -- Longitude
  
  -- Internal fields
  "IsGroupLeader" text DEFAULT 'Yes', -- Default to Yes for CSV imports
  avatar_url text,      
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE "GroupLeaders" ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow public read access (This will be recreated after the Drop Table)
CREATE POLICY "Public read access"
ON "GroupLeaders"
FOR SELECT
TO public
USING (true);

-- 5. Comment on table and columns
COMMENT ON TABLE "GroupLeaders" IS 'Stores information about group leaders using Chinese column names for easy CSV import.';
COMMENT ON COLUMN "GroupLeaders"."Username" IS 'Used as the leaderId in the application.';
COMMENT ON COLUMN "GroupLeaders"."加油站" IS 'Gas Station Name';
COMMENT ON COLUMN "GroupLeaders"."站代號" IS 'Station Code';
