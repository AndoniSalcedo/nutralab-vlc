import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

export function getSupabaseAdmin() {
  const schema = env.SUPABASE_SCHEMA;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema },
  });
}
