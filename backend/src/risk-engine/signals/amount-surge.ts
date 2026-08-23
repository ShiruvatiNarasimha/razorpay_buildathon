import { RiskSignal } from '../../contracts/index.js';

export interface AmountSurgeContext {
  amountPaise: number;
  userAverageTransactionPaise?: number;
}

export function evaluateAmountSurgeSignal(ctx: AmountSurgeContext): RiskSignal {
  const { amountPaise, userAverageTransactionPaise = 200000 } = ctx; // default avg ₹2,000

  const ratio = amountPaise / Math.max(userAverageTransactionPaise, 10000);
  const triggered = ratio >= 3.5;

  return {
    code: 'UNUSUAL_AMOUNT_SURGE',
    scoreContribution: 35,
    description: triggered
      ? `Transaction amount (₹${(amountPaise / 100).toFixed(2)}) is ${ratio.toFixed(1)}x higher than user's historical average`
      : 'Transaction amount is consistent with baseline profile',
    triggered,
    metadata: {
      amountPaise,
      averagePaise: userAverageTransactionPaise,
      surgeRatio: ratio,
    },
  };
}
