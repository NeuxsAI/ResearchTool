import type { User } from '@supabase/supabase-js';

export function useUser(): {
  user: User | null;
  loading: boolean;
}; 