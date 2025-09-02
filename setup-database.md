# Database Setup Instructions

## Step 1: Run the Schema in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Copy and paste the entire contents of `supabase/schema.sql`
5. Click "Run" to execute the SQL

## Step 2: Verify Tables Creation

After running the SQL, verify that the following were created:

### Tables:
- `video_uploads`
- `verification_reports`

### Storage Bucket:
- `videos` bucket

## Step 3: Check RLS Policies

Ensure Row Level Security policies are active:
1. Go to Authentication > Policies
2. Verify policies exist for both tables

## Troubleshooting

If you get errors about tables already existing, you can drop and recreate them:

```sql
-- Drop existing tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS verification_reports CASCADE;
DROP TABLE IF EXISTS video_uploads CASCADE;

-- Then run the schema.sql file again
```

## Storage Bucket Alternative Setup

If the storage bucket creation fails via SQL, create it manually:
1. Go to Storage in Supabase Dashboard
2. Click "New bucket"
3. Name: `videos`
4. Public: Yes
5. Click "Create bucket"
