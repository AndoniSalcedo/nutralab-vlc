
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key',
  SUPABASE_SCHEMA: process.env.SUPABASE_SCHEMA || 'teams',
  JWT_SECRET: process.env.JWT_SECRET || 'jwt-secret',
  NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173',
  NUTRALAB_BACKEND_URL: process.env.NUTRALAB_BACKEND_URL || 'http://localhost:4000/api',
  VLC_FOODS_API_KEY: process.env.VLC_FOODS_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CHAT_MODEL: process.env.CHAT_MODEL || 'claude-opus-4-6',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_PLAN_MAX_TOKENS: Number(process.env.AI_PLAN_MAX_TOKENS) || 8192,
  ANALITICA_MAX_TOKENS: Number(process.env.ANALITICA_MAX_TOKENS) || 16000,
};
