import { z } from 'zod';

export const RiskLevelSchema = z.enum(['LOW', 'REVIEW', 'HIGH']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RiskSignalCodeSchema = z.enum([
  'DUPLICATE_FINGERPRINT',
  'UNUSUAL_AMOUNT_SURGE',
  'VELOCITY_SPIKE',
  'UNRECOGNIZED_MERCHANT',
  'HIGH_RISK_MERCHANT_CATEGORY',
  'ANOMALOUS_OFF_HOURS',
  'SUSPICIOUS_PROMPT_INJECTION_FLAG',
  'PROMPT_INJECTION_DETECTED',
  'RAPID_RETRY_ATTEMPT',
]);
export type RiskSignalCode = z.infer<typeof RiskSignalCodeSchema>;

export const RiskSignalSchema = z.object({
  code: RiskSignalCodeSchema,
  scoreContribution: z.number().int().min(0).max(100),
  description: z.string().optional(),
  name: z.string().optional(),
  triggered: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
  details: z.record(z.unknown()).optional(),
});
export type RiskSignal = z.infer<typeof RiskSignalSchema>;

export const RiskAssessmentResultSchema = z.object({
  level: RiskLevelSchema,
  overallScore: z.number().int().min(0).max(100),
  signals: z.array(RiskSignalSchema),
  explanation: z.string(),
  assessedAt: z.string().optional(),
  timestamp: z.string().optional(),
});
export type RiskAssessmentResult = z.infer<typeof RiskAssessmentResultSchema>;
