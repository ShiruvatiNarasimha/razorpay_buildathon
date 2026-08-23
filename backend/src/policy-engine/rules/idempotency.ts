import { PolicyRuleResult } from '../../contracts/index.js';

export interface IdempotencyContext {
  idempotencyKey: string;
  isExistingExecution: boolean;
}

export function evaluateIdempotency(ctx: IdempotencyContext): PolicyRuleResult {
  const { idempotencyKey, isExistingExecution } = ctx;

  if (!idempotencyKey || idempotencyKey.trim().length === 0) {
    return {
      rule: 'IDEMPOTENCY',
      result: 'FAIL',
      reasonCode: 'MISSING_IDEMPOTENCY_KEY',
      message: 'Idempotency key is required to guarantee exactly-once financial execution',
    };
  }

  if (isExistingExecution) {
    return {
      rule: 'IDEMPOTENCY',
      result: 'REVIEW',
      reasonCode: 'DUPLICATE_IDEMPOTENCY_KEY_REPLAY',
      message: 'Request with this idempotency key has already been executed; replaying cached financial response',
      metadata: { idempotencyKey },
    };
  }

  return {
    rule: 'IDEMPOTENCY',
    result: 'PASS',
    reasonCode: 'IDEMPOTENCY_UNIQUE',
    message: 'Idempotency key is valid and unique',
    metadata: { idempotencyKey },
  };
}
