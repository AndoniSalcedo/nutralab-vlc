import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/config/env';

export const aiClient = new Anthropic({ apiKey: env.AI_API_KEY });

export function getMaxTokens() {
  const parsed = env.AI_PLAN_MAX_TOKENS;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 32000;
}
