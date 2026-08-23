import { RiskSignal } from '../../contracts/index.js';

export interface VelocitySignalContext {
  transactionsInLast60Seconds: number;
}

export function evaluateVelocitySignal(ctx: VelocitySignalContext): RiskSignal {
  const { transactionsInLast60Seconds } = ctx;
  const triggered = transactionsInLast60Seconds >= 3;

  return {
    code: 'VELOCITY_SPIKE',
    scoreContribution: 30,
    description: triggered
      ? `High-frequency velocity detected: ${transactionsInLast60Seconds} transactions within 60 seconds`
      : 'Transaction frequency is within normal baseline',
    triggered,
    metadata: {
      transactionsInLast60Seconds,
    },
  };
}
