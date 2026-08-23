import { PaymentIntentState } from '../contracts/index.js';

/**
 * Strict state transition table for PaymentIntent.
 * No arbitrary state jumps permitted.
 */
const LEGAL_TRANSITIONS: Record<PaymentIntentState, PaymentIntentState[]> = {
  PENDING: ['POLICY_CHECK', 'BLOCKED'],
  POLICY_CHECK: ['RISK_CHECK', 'BLOCKED'],
  RISK_CHECK: ['AUTHORIZED', 'REVIEW_REQUIRED', 'BLOCKED'],
  REVIEW_REQUIRED: ['AUTHORIZED', 'BLOCKED'],
  AUTHORIZED: ['EXECUTING', 'FAILED', 'BLOCKED'],
  EXECUTING: ['SUCCEEDED', 'FAILED', 'REQUIRES_REVIEW' as unknown as PaymentIntentState],
  SUCCEEDED: [],
  FAILED: [],
  BLOCKED: [],
};

export class IllegalStateTransitionError extends Error {
  constructor(
    public readonly currentState: PaymentIntentState,
    public readonly targetState: PaymentIntentState,
    message?: string
  ) {
    super(
      message ||
        `Illegal state transition from ${currentState} to ${targetState}. This transition is forbidden.`
    );
    this.name = 'IllegalStateTransitionError';
  }
}

export function validateStateTransition(
  currentState: PaymentIntentState,
  targetState: PaymentIntentState
): void {
  const allowed = LEGAL_TRANSITIONS[currentState] || [];
  if (!allowed.includes(targetState)) {
    throw new IllegalStateTransitionError(currentState, targetState);
  }
}

export function canTransition(
  currentState: PaymentIntentState,
  targetState: PaymentIntentState
): boolean {
  const allowed = LEGAL_TRANSITIONS[currentState] || [];
  return allowed.includes(targetState);
}
