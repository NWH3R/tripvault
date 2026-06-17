import { createClient } from '@supabase/supabase-js';

// Placeholders let the module load during `next build` without env vars.
// At runtime, requests will fail loudly if the real values aren't set.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
);
