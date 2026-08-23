import { PolicyRuleResult, PolicyConfig } from '../../contracts/index.js';

export interface VelocityLimitContext {
  recentTransactionsCountLastMinute: number;
  policy: PolicyConfig;
}

export function evaluateVelocityLimit(ctx: VelocityLimitContext): PolicyRuleResult {
  const { recentTransactionsCountLastMinute, policy } = ctx;

  if (recentTransactionsCountLastMinute >= policy.maxVelocityPerMinute) {
    return {
      rule: 'VELOCITY_LIMIT',
      result: 'FAIL',
      reasonCode: 'VELOCITY_RATE_LIMIT_EXCEEDED',
      message: `Transaction velocity of ${recentTransactionsCountLastMinute} req/min exceeds maximum allowed rate of ${policy.maxVelocityPerMinute} req/min`,
      metadata: {
        recentCount: recentTransactionsCountLastMinute,
        maxVelocity: policy.maxVelocityPerMinute,
      },
    };
  }

  return {
    rule: 'VELOCITY_LIMIT',
    result: 'PASS',
    reasonCode: 'VELOCITY_WITHIN_BOUNDS',
    message: `Transaction velocity (${recentTransactionsCountLastMinute} req/min) is within safe operational limits`,
    metadata: {
      recentCount: recentTransactionsCountLastMinute,
      maxVelocity: policy.maxVelocityPerMinute,
    },
  };
}
