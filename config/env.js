const isProduction = process.env.NODE_ENV === 'production';
// Durante `next build` no hay secretos reales; solo se exigen en tiempo de ejecución.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const DEV_FALLBACKS = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  JWT_SECRET: 'jwt-secret',
};

/**
 * Lee una variable obligatoria. En producción NUNCA cae a un valor por defecto:
 * un secreto conocido (p. ej. 'jwt-secret') permitiría falsificar sesiones.
 */
function requiredEnv(name) {
  const value = process.env[name];
  if (value) return value;
  if (isProduction && !isBuildPhase) {
    throw new Error(`Falta la variable de entorno obligatoria ${name}`);
  }
  return DEV_FALLBACKS[name];
}

// Los secretos se resuelven de forma perezosa (getter) para que importar este
// módulo desde el cliente o durante el build no falle ni exponga nada.
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() { return requiredEnv('NEXT_PUBLIC_SUPABASE_URL'); },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requiredEnv('SUPABASE_SERVICE_ROLE_KEY'); },
  get JWT_SECRET() { return requiredEnv('JWT_SECRET'); },
  SUPABASE_SCHEMA: process.env.SUPABASE_SCHEMA || 'teams',
  NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://nutralab.vercel.app',
  NODE_ENV: process.env.NODE_ENV || 'development',
  OPEN_ROUTER_API: process.env.OPEN_ROUTER_API || process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'openai/gpt-6-luna-pro',
  AI_PLAN_MAX_TOKENS: Number(process.env.AI_PLAN_MAX_TOKENS) || 16000,
  ANALITICA_MAX_TOKENS: Number(process.env.ANALITICA_MAX_TOKENS) || 16000,
  BILLING_SERVICE_URL: process.env.BILLING_SERVICE_URL || 'http://localhost:3005',
  BILLING_API_KEY: process.env.BILLING_API_KEY || process.env.BILLING_TOKEN || '',
};
