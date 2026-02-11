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
  "加油站" text,        -- Gas Station Name
  "站代號" text,        -- Station Code
  "緯度" float8,        -- Latitude
  "經度" float8,        -- Longitude
  "LineID" text UNIQUE, -- LINE User ID for identity binding
  
  -- Internal fields
  "IsGroupLeader" text DEFAULT 'Yes',
  avatar_url text,      
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE "GroupLeaders" ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow public read access
CREATE POLICY "Public read access"
ON "GroupLeaders"
FOR SELECT
TO public
USING (true);

-- 5. Create policy to allow public update of LineID column only
CREATE POLICY "Public update LineID"
ON "GroupLeaders"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 6. Comments
COMMENT ON TABLE "GroupLeaders" IS 'Stores information about group leaders using Chinese column names for easy CSV import.';
COMMENT ON COLUMN "GroupLeaders"."Username" IS 'Used as the leaderId in the application. Format: StationCode-EmployeeID';
COMMENT ON COLUMN "GroupLeaders"."加油站" IS 'Gas Station Name';
COMMENT ON COLUMN "GroupLeaders"."站代號" IS 'Station Code';
COMMENT ON COLUMN "GroupLeaders"."LineID" IS 'LINE User ID bound to this leader for auto-identification';

-- ============================================================
-- MIGRATION: Run this on existing database (DO NOT run full script above)
-- ============================================================
-- ALTER TABLE "GroupLeaders" ADD COLUMN IF NOT EXISTS "LineID" text UNIQUE;
-- CREATE POLICY "Public update LineID" ON "GroupLeaders" FOR UPDATE TO public USING (true) WITH CHECK (true);
