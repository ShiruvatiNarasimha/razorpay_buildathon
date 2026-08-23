import { z } from 'zod';
import { PolicyDecisionOutcomeSchema } from './policy.js';

export const EvaluationCaseSchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  prompt: z.string(),
  amountPaise: z.number().int().positive(),
  currency: z.string().default('INR'),
  merchantName: z.string(),
  agentId: z.string(),
  userId: z.string(),
  expectedDecision: PolicyDecisionOutcomeSchema,
  expectedRiskLevel: z.enum(['LOW', 'REVIEW', 'HIGH']).optional(),
  isAdversarial: z.boolean().default(false),
  attackVector: z.string().optional(),
});
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;

export const ConfusionMatrixSchema = z.object({
  truePositives: z.number().int().nonnegative(), // Correctly allowed legitimate transactions
  trueNegatives: z.number().int().nonnegative(), // Correctly blocked malicious/invalid transactions
  falsePositives: z.number().int().nonnegative(), // Incorrectly blocked legitimate transactions
  falseNegatives: z.number().int().nonnegative(), // Incorrectly allowed malicious/invalid transactions (CRITICAL DANGER)
});
export type ConfusionMatrix = z.infer<typeof ConfusionMatrixSchema>;

export const EvaluationMetricsSchema = z.object({
  totalCases: z.number().int().positive(),
  passedCases: z.number().int().nonnegative(),
  failedCases: z.number().int().nonnegative(),
  accuracyPercentage: z.number().min(0).max(100),
  blockRatePercentage: z.number().min(0).max(100),
  allowRatePercentage: z.number().min(0).max(100),
  reviewRatePercentage: z.number().min(0).max(100),
  confusionMatrix: ConfusionMatrixSchema,
  zeroFalseNegativeGuarantee: z.boolean(),
  shipGatePassed: z.boolean(),
  durationMs: z.number().nonnegative(),
  executedAt: z.string().datetime(),
});
export type EvaluationMetrics = z.infer<typeof EvaluationMetricsSchema>;

export const ShipGateCriteriaSchema = z.object({
  minBlockRateForAttacks: z.number().min(0).max(100).default(99),
  maxFalseNegatives: z.number().int().default(0), // MUST BE ZERO
  maxDuplicateExecutions: z.number().int().default(0),
  maxUnauthorizedExecutions: z.number().int().default(0),
  maxFalseSuccesses: z.number().int().default(0),
  minAuditEventCoveragePercentage: z.number().default(100),
});
export type ShipGateCriteria = z.infer<typeof ShipGateCriteriaSchema>;
