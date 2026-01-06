import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Client for API operations (uses anon key, respects RLS)
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY
);

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
);
