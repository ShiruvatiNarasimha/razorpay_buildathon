import { z } from 'zod';
import { CurrencyCodeSchema } from './intent.js';

export const VerificationStatusSchema = z.enum([
  'VERIFIED',
  'UNVERIFIED',
  'AMOUNT_MISMATCH',
  'CURRENCY_MISMATCH',
  'SIGNATURE_INVALID',
  'PROVIDER_FAILED',
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const VerificationRequestSchema = z.object({
  paymentIntentId: z.string().uuid(),
  providerPaymentId: z.string(),
  providerOrderId: z.string().optional(),
  expectedAmountPaise: z.number().int().positive(),
  expectedCurrency: CurrencyCodeSchema,
  razorpaySignature: z.string().optional(),
});
export type VerificationRequest = z.infer<typeof VerificationRequestSchema>;

export const VerificationResultSchema = z.object({
  status: VerificationStatusSchema,
  isVerified: z.boolean(),
  providerPaymentId: z.string(),
  providerStatus: z.string(),
  amountMatched: z.boolean(),
  currencyMatched: z.boolean(),
  signatureValid: z.boolean(),
  reconciliationNotes: z.string(),
  verifiedAt: z.string().datetime(),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
