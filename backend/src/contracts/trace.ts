import { z } from 'zod';
import { PaymentIntentDTOSchema, StructuredAgentIntentSchema } from './intent.js';
import { PolicyDecisionResultSchema } from './policy.js';
import { RiskAssessmentResultSchema } from './risk.js';
import { ExecutionResultSchema } from './execution.js';
import { VerificationResultSchema } from './verification.js';
import { AuditEventDTOSchema } from './audit.js';

export const DecisionTraceDTOSchema = z.object({
  paymentIntentId: z.string().uuid(),
  rawPrompt: z.string(),
  structuredIntent: StructuredAgentIntentSchema.nullable().optional(),
  paymentIntent: PaymentIntentDTOSchema,
  policyDecision: PolicyDecisionResultSchema.nullable().optional(),
  riskAssessment: RiskAssessmentResultSchema.nullable().optional(),
  executionResult: ExecutionResultSchema.nullable().optional(),
  verificationResult: VerificationResultSchema.nullable().optional(),
  auditTrail: z.array(AuditEventDTOSchema),
  finalDecision: z.enum(['ALLOW', 'REVIEW', 'BLOCK']),
  finalStatus: z.string(),
  durationMs: z.number().int().nonnegative().optional(),
});
export type DecisionTraceDTO = z.infer<typeof DecisionTraceDTOSchema>;
