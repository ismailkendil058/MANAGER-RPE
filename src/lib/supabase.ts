import { createClient } from '@supabase/supabase-js';

// NOTE: Keep secrets out of source in production. Use environment variables instead.
export const SUPABASE_URL = 'https://pvssckygpatanopdatrf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c3Nja3lncGF0YW5vcGRhdHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODgyNjgsImV4cCI6MjA5MDM2NDI2OH0.8LjyOxzui-yjtrBOC64uR1Y7BKuy0s_peeGfJ9TxnBw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
