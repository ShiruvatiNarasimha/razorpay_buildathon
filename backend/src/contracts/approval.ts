import { z } from 'zod';
import { CurrencyCodeSchema } from './intent.js';
import { RiskLevelSchema } from './risk.js';

export const PendingApprovalDTOSchema = z.object({
  paymentIntentId: z.string().uuid(),
  agentId: z.string(),
  agentName: z.string(),
  userId: z.string(),
  amountPaise: z.number().int().positive(),
  currency: CurrencyCodeSchema,
  merchantName: z.string(),
  merchantCategory: z.string().nullable().optional(),
  rawPrompt: z.string(),
  reviewReason: z.string(),
  riskScore: z.number().int().min(0).max(100),
  riskLevel: RiskLevelSchema,
  policyViolations: z.array(z.string()).default([]),
  idempotencyKey: z.string(),
  createdAt: z.string().datetime(),
});
export type PendingApprovalDTO = z.infer<typeof PendingApprovalDTOSchema>;

export const SupervisorActionRequestSchema = z.object({
  supervisorId: z.string().default('supervisor_admin_fintech'),
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().max(500).optional(),
});
export type SupervisorActionRequest = z.infer<typeof SupervisorActionRequestSchema>;

export const SupervisorActionResultSchema = z.object({
  paymentIntentId: z.string().uuid(),
  decision: z.enum(['ALLOW', 'BLOCK']),
  finalStatus: z.string(),
  providerOrderId: z.string().nullable().optional(),
  providerPaymentId: z.string().nullable().optional(),
  message: z.string(),
  executedAt: z.string().datetime(),
});
export type SupervisorActionResult = z.infer<typeof SupervisorActionResultSchema>;
