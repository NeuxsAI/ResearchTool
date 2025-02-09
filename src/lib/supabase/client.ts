import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton instance
let supabase: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export const createClient = () => {
  if (!supabase) {
    supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

// Export the singleton instance directly
export { supabase as supabaseClient };