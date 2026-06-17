import { createClient } from '@supabase/supabase-js';

// Fallbacks keep the module from throwing during `next build` when env vars
// haven't been set yet. Real requests will fail at runtime until .env.local
// is configured.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
