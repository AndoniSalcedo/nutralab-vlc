
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key',
  APP_ADMIN_USER: process.env.APP_ADMIN_USER || 'admin',
  APP_ADMIN_PASS: process.env.APP_ADMIN_PASS || 'password',
  SESSION_SECRET: process.env.SESSION_SECRET || 'session-secret',
};
