# Supabase Database Schema

This directory contains the database schema for the Polling App.

## Schema Overview

The database consists of two main tables:

### `polls` table
- `id` (UUID, Primary Key): Unique identifier for each poll
- `question` (TEXT): The poll question (10-280 characters)
- `options` (TEXT[]): Array of poll options (2-10 options, each 1-80 characters)
- `created_by` (UUID): Foreign key to auth.users table
- `created_at` (TIMESTAMPTZ): When the poll was created
- `expires_at` (TIMESTAMPTZ, nullable): Optional expiration date

### `votes` table
- `id` (UUID, Primary Key): Unique identifier for each vote
- `poll_id` (UUID): Foreign key to polls table
- `option_index` (INTEGER): Index of the selected option (0-based)
- `voter_id` (UUID, nullable): Foreign key to auth.users table (allows anonymous voting)
- `created_at` (TIMESTAMPTZ): When the vote was cast

## Deployment Instructions

### Option 1: Using Supabase CLI (Recommended)

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project (if not already done):
   ```bash
   supabase init
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Run the migration:
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration

### Option 3: Using psql (if you have direct database access)

```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f migrations/001_initial_schema.sql
```

## Features Included

### Security
- **Row Level Security (RLS)** enabled on both tables
- Policies allow:
  - Anyone to read polls and votes
  - Authenticated users to create polls
  - Poll creators to update/delete their polls
  - Anyone to vote (anonymous voting supported)
  - Users to update/delete their own votes

### Performance
- Indexes on frequently queried columns:
  - `polls(created_at DESC)` for listing polls
  - `votes(poll_id)` for vote aggregation
  - Additional indexes for user lookups and expiration checks

### Data Integrity
- Check constraints ensure:
  - Question length is between 10-280 characters
  - Options array has 2-10 items, each 1-80 characters
  - Option index is valid for the poll's options array
  - Expiration date is in the future (if provided)

### Helper Functions
- `get_poll_results(poll_uuid)`: Returns vote counts for each option
- `is_poll_expired(poll_uuid)`: Checks if a poll has expired

## Environment Variables Required

Make sure your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Schema

After deployment, you can test the schema by:

1. Creating a poll through your app
2. Casting votes (both authenticated and anonymous)
3. Viewing poll results
4. Testing expiration functionality

The schema is designed to work seamlessly with the existing Next.js app structure and Server Actions.
