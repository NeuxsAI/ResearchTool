import { createServerClient } from '@supabase/ssr';
import type { Database } from './db';
import type { CookieStore } from '@supabase/ssr/dist/shared-types';

// Server-side client creation - supports both cookie store and token
export const createClient = (cookieStoreOrToken?: CookieStore | string) => {
  const options: any = {};

  if (typeof cookieStoreOrToken === 'string') {
    // Token-based auth
    options.auth = {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    };
    options.global = {
      headers: {
        Authorization: `Bearer ${cookieStoreOrToken}`
      }
    };
  } else if (cookieStoreOrToken) {
    // Cookie-based auth
    options.cookies = {
      async get(name: string) {
        const cookie = await cookieStoreOrToken.get(name);
        return cookie?.value;
      },
      async set(name: string, value: string, options: { path: string; maxAge?: number }) {
        await cookieStoreOrToken.set({ name, value, ...options });
      },
      async remove(name: string, options: { path: string }) {
        await cookieStoreOrToken.set({ name, value: '', ...options });
      }
    };
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
};
