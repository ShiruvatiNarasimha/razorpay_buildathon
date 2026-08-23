import { z } from 'zod';

export const PolicyRuleNameSchema = z.enum([
  'SPENDING_LIMIT',
  'AGENT_PERMISSION',
  'MERCHANT_RESTRICTION',
  'CURRENCY_RESTRICTION',
  'IDEMPOTENCY',
  'AUTH_VALIDITY',
  'VELOCITY_LIMIT',
]);
export type PolicyRuleName = z.infer<typeof PolicyRuleNameSchema>;

export const RuleResultStatusSchema = z.enum(['PASS', 'FAIL', 'REVIEW']);
export type RuleResultStatus = z.infer<typeof RuleResultStatusSchema>;

export const PolicyDecisionOutcomeSchema = z.enum(['ALLOW', 'REVIEW', 'BLOCK']);
export type PolicyDecisionOutcome = z.infer<typeof PolicyDecisionOutcomeSchema>;

export const PolicyRuleResultSchema = z.object({
  rule: PolicyRuleNameSchema,
  result: RuleResultStatusSchema,
  reasonCode: z.string(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type PolicyRuleResult = z.infer<typeof PolicyRuleResultSchema>;

export const PolicyDecisionResultSchema = z.object({
  decision: PolicyDecisionOutcomeSchema,
  reason: z.string(),
  evaluatedRules: z.array(PolicyRuleResultSchema),
  timestamp: z.string().datetime(),
});
export type PolicyDecisionResult = z.infer<typeof PolicyDecisionResultSchema>;

/**
 * Domain policy configuration for a user or agent.
 */
export const PolicyConfigSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  maxTransactionAmountPaise: z.number().int().nonnegative(),
  dailyLimitPaise: z.number().int().nonnegative(),
  allowedCurrencies: z.array(z.string()).default(['INR']),
  allowedMerchants: z.array(z.string()).default([]),
  blockedMerchants: z.array(z.string()).default([]),
  requireReviewAboveAmountPaise: z.number().int().nonnegative().optional(),
  maxVelocityPerMinute: z.number().int().positive().default(5),
  autoApproveWhitelistMerchants: z.boolean().default(false),
});
export type PolicyConfig = z.infer<typeof PolicyConfigSchema>;
