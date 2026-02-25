// ============================================================
// Supabase Client — initialized from VITE_ env variables
// Keys live in .env (gitignored), never in source code
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials.\n' +
    'Copy .env.example → .env and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
