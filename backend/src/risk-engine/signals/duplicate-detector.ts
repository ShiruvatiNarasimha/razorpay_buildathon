import { RiskSignal } from '../../contracts/index.js';

export interface DuplicateDetectionContext {
  isDuplicateFingerprint: boolean;
  timeSinceLastIdenticalSeconds?: number;
}

export function evaluateDuplicateSignal(ctx: DuplicateDetectionContext): RiskSignal {
  const triggered = ctx.isDuplicateFingerprint;
  return {
    code: 'DUPLICATE_FINGERPRINT',
    scoreContribution: 45,
    description: triggered
      ? `Identical transaction fingerprint detected within ${ctx.timeSinceLastIdenticalSeconds ?? 60} seconds`
      : 'No duplicate fingerprint detected',
    triggered,
    metadata: {
      timeSinceLastIdenticalSeconds: ctx.timeSinceLastIdenticalSeconds,
    },
  };
}
