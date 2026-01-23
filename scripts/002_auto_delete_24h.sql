-- ============================================
-- Automatic 24-Hour Data Deletion Policy
-- ============================================
-- 
-- This script sets up automatic deletion of all user data after 24 hours.
-- This is a core privacy feature of Bondly - no data is stored permanently.
--
-- IMPORTANT: Run this AFTER 001_create_tables.sql
-- ============================================

-- 1. Enable the pg_cron extension (may need superuser/admin)
-- Note: On Supabase, this is enabled by default on paid plans
-- For free plans, you may need to use an external scheduler

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create a function to delete old data
CREATE OR REPLACE FUNCTION delete_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete advice older than 24 hours
  DELETE FROM public.advice
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete responses older than 24 hours
  DELETE FROM public.responses
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete sessions older than 24 hours
  DELETE FROM public.sessions
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Log the cleanup (optional - for monitoring)
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$;

-- 3. Schedule the function to run every hour
-- Uncomment the following if you have pg_cron enabled:

-- SELECT cron.schedule(
--   'delete-old-sessions',  -- job name
--   '0 * * * *',            -- every hour at minute 0
--   'SELECT delete_old_sessions();'
-- );

-- 4. Alternative: Create a trigger-based approach for immediate deletion
-- This deletes data as soon as it's 24 hours old when any query runs

-- Option A: Use Supabase Edge Functions with a scheduled job
-- See: https://supabase.com/docs/guides/functions/schedule-functions

-- Option B: Use an external service like GitHub Actions, cron jobs, etc.
-- Create a simple API endpoint that calls delete_old_sessions()

-- ============================================
-- Manual Cleanup (run periodically if no cron)
-- ============================================
-- 
-- If you don't have pg_cron, you can manually run:
-- SELECT delete_old_sessions();
--
-- Or set up a cron job (e.g., via Vercel, Railway, etc.):
-- See vercel.json for configuration
-- ============================================

-- 5. Add index for faster deletion queries
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.responses(created_at);
CREATE INDEX IF NOT EXISTS idx_advice_created_at ON public.advice(created_at);

-- 6. Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION delete_old_sessions() TO service_role;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to check what would be deleted:
--
-- SELECT 
--   (SELECT COUNT(*) FROM sessions WHERE created_at < NOW() - INTERVAL '24 hours') as old_sessions,
--   (SELECT COUNT(*) FROM responses WHERE created_at < NOW() - INTERVAL '24 hours') as old_responses,
--   (SELECT COUNT(*) FROM advice WHERE created_at < NOW() - INTERVAL '24 hours') as old_advice;

