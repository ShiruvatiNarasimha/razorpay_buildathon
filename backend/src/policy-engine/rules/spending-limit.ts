import { PolicyRuleResult, StructuredAgentIntent, PolicyConfig } from '../../contracts/index.js';

export interface SpendingLimitContext {
  intent: StructuredAgentIntent;
  policy: PolicyConfig;
  currentDayCumulativePaise?: number;
}

export function evaluateSpendingLimit(ctx: SpendingLimitContext): PolicyRuleResult {
  const { intent, policy, currentDayCumulativePaise = 0 } = ctx;

  // Single transaction limit check
  if (intent.amountPaise > policy.maxTransactionAmountPaise) {
    return {
      rule: 'SPENDING_LIMIT',
      result: 'FAIL',
      reasonCode: 'AMOUNT_EXCEEDS_SINGLE_TXN_LIMIT',
      message: `Requested amount ₹${(intent.amountPaise / 100).toFixed(2)} exceeds maximum per-transaction limit of ₹${(policy.maxTransactionAmountPaise / 100).toFixed(2)}`,
      metadata: {
        requestedPaise: intent.amountPaise,
        maxSinglePaise: policy.maxTransactionAmountPaise,
      },
    };
  }

  // Daily cumulative limit check
  const projectedDailyTotal = currentDayCumulativePaise + intent.amountPaise;
  if (projectedDailyTotal > policy.dailyLimitPaise) {
    return {
      rule: 'SPENDING_LIMIT',
      result: 'FAIL',
      reasonCode: 'AMOUNT_EXCEEDS_DAILY_LIMIT',
      message: `Projected daily spending ₹${(projectedDailyTotal / 100).toFixed(2)} exceeds daily limit of ₹${(policy.dailyLimitPaise / 100).toFixed(2)}`,
      metadata: {
        currentDayPaise: currentDayCumulativePaise,
        requestedPaise: intent.amountPaise,
        dailyLimitPaise: policy.dailyLimitPaise,
      },
    };
  }

  // Soft review threshold check
  if (
    policy.requireReviewAboveAmountPaise &&
    intent.amountPaise > policy.requireReviewAboveAmountPaise
  ) {
    return {
      rule: 'SPENDING_LIMIT',
      result: 'REVIEW',
      reasonCode: 'AMOUNT_REQUIRES_MANUAL_REVIEW',
      message: `Amount ₹${(intent.amountPaise / 100).toFixed(2)} exceeds auto-approval threshold of ₹${(policy.requireReviewAboveAmountPaise / 100).toFixed(2)} and requires supervisor review`,
      metadata: {
        requestedPaise: intent.amountPaise,
        reviewThresholdPaise: policy.requireReviewAboveAmountPaise,
      },
    };
  }

  return {
    rule: 'SPENDING_LIMIT',
    result: 'PASS',
    reasonCode: 'AMOUNT_WITHIN_LIMIT',
    message: `Amount ₹${(intent.amountPaise / 100).toFixed(2)} is within authorized spending limits`,
    metadata: {
      requestedPaise: intent.amountPaise,
      maxSinglePaise: policy.maxTransactionAmountPaise,
    },
  };
}
