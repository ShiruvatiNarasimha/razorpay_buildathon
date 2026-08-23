import { z } from 'zod';
import { PolicyDecisionOutcomeSchema } from './policy.js';

export const AttackScenarioTypeSchema = z.enum([
  'NORMAL_PAYMENT',
  'OVER_BUDGET',
  'DUPLICATE_REPLAY',
  'UNAUTHORIZED_AGENT',
  'EXPIRED_AUTHORIZATION',
  'PROMPT_INJECTION',
  'SUSPICIOUS_MERCHANT',
  'VELOCITY_FLOOD',
  'UNSUPPORTED_CURRENCY',
  'TAMPERED_INTENT',
]);
export type AttackScenarioType = z.infer<typeof AttackScenarioTypeSchema>;

export const AttackScenarioResultSchema = z.object({
  id: z.string(),
  scenarioType: AttackScenarioTypeSchema,
  name: z.string(),
  description: z.string(),
  inputPrompt: z.string(),
  expectedDecision: PolicyDecisionOutcomeSchema,
  actualDecision: PolicyDecisionOutcomeSchema,
  passed: z.boolean(),
  reasonCode: z.string(),
  details: z.string(),
  timestamp: z.string().datetime(),
});
export type AttackScenarioResult = z.infer<typeof AttackScenarioResultSchema>;
