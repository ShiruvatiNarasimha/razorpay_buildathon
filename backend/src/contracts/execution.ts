import { z } from 'zod';
import { CurrencyCodeSchema } from './intent.js';

export const GatewayProviderSchema = z.enum(['mock', 'razorpay']);
export type GatewayProvider = z.infer<typeof GatewayProviderSchema>;

export const ExecutionStatusSchema = z.enum([
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REQUIRES_REVIEW',
  'UNKNOWN',
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const ExecutionRequestSchema = z.object({
  paymentIntentId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  currency: CurrencyCodeSchema,
  merchantName: z.string(),
  idempotencyKey: z.string().min(1),
  gateway: GatewayProviderSchema.default('mock'),
  notes: z.record(z.unknown()).optional(),
});
export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;

export const ExecutionResultSchema = z.object({
  executionId: z.string().uuid(),
  paymentIntentId: z.string().uuid(),
  gateway: GatewayProviderSchema,
  providerPaymentId: z.string().nullable().optional(),
  providerOrderId: z.string().nullable().optional(),
  status: ExecutionStatusSchema,
  amountPaise: z.number().int().positive(),
  currency: CurrencyCodeSchema,
  rawProviderResponse: z.record(z.unknown()).optional(),
  errorMessage: z.string().nullable().optional(),
  idempotencyKey: z.string(),
  executedAt: z.string().datetime(),
});
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;
