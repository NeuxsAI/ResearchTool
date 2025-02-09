import { createServerClient } from '@supabase/ssr';
import type { Database } from './db';
import type { CookieStore } from '@supabase/ssr/dist/shared-types';

// Server-side client creation - this is fine as it's per-request
export const createClient = (cookieStore?: CookieStore) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore ? {
        get(name: string) {
          return cookieStore.get(name)?.value;
        }
      } : undefined
    }
  );
};
