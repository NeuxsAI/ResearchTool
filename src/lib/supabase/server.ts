import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = (token?: string) => {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  if (token) {
    supabase.auth.setSession({ access_token: token, refresh_token: '' })
  }
  
  return supabase
}
