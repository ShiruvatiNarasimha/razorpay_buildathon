import { z } from 'zod';

export const AuditEventTypeSchema = z.enum([
  'AGENT_INTENT_CREATED',
  'INTENT_VALIDATED',
  'INTENT_REJECTED',
  'POLICY_EVALUATED',
  'RISK_EVALUATED',
  'PAYMENT_BLOCKED',
  'PAYMENT_REVIEW_REQUIRED',
  'PAYMENT_AUTHORIZED',
  'PAYMENT_EXECUTION_STARTED',
  'PAYMENT_EXECUTION_COMPLETED',
  'PAYMENT_VERIFIED',
  'PAYMENT_FAILED',
  'SUPERVISOR_OVERRIDE_APPROVED',
  'SUPERVISOR_OVERRIDE_REJECTED',
]);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const AuditEventDTOSchema = z.object({
  id: z.string().uuid(),
  paymentIntentId: z.string().uuid().nullable().optional(),
  eventType: AuditEventTypeSchema,
  actor: z.string(),
  agentId: z.string().nullable().optional(),
  requestId: z.string(),
  decision: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  checksum: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type AuditEventDTO = z.infer<typeof AuditEventDTOSchema>;
