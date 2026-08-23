import {
  RiskAssessmentResult,
  RiskSignal,
  RiskLevel,
  StructuredAgentIntent,
} from '../contracts/index.js';
import { evaluateDuplicateSignal } from './signals/duplicate-detector.js';
import { evaluateAmountSurgeSignal } from './signals/amount-surge.js';
import { evaluateVelocitySignal } from './signals/velocity-detector.js';
import { evaluateMerchantRiskSignals } from './signals/merchant-risk.js';
import { evaluatePromptInjectionSignal } from './signals/prompt-injection-detector.js';

export interface RiskEvaluationContext {
  intent: StructuredAgentIntent;
  userId: string;
  isDuplicateFingerprint?: boolean;
  timeSinceLastIdenticalSeconds?: number;
  userAverageTransactionPaise?: number;
  transactionsInLast60Seconds?: number;
  isKnownMerchant?: boolean;
}

export class RiskEngine {
  /**
   * Evaluates transparent multi-signal risk metrics.
   * Score 0-30 = LOW, 31-60 = REVIEW, 61-100 = HIGH.
   */
  public static evaluate(ctx: RiskEvaluationContext): RiskAssessmentResult {
    const signals: RiskSignal[] = [];

    // 1. Duplicate detection
    signals.push(
      evaluateDuplicateSignal({
        isDuplicateFingerprint: ctx.isDuplicateFingerprint ?? false,
        timeSinceLastIdenticalSeconds: ctx.timeSinceLastIdenticalSeconds,
      })
    );

    // 2. Amount surge detection
    signals.push(
      evaluateAmountSurgeSignal({
        amountPaise: ctx.intent.amountPaise,
        userAverageTransactionPaise: ctx.userAverageTransactionPaise,
      })
    );

    // 3. Velocity detector
    signals.push(
      evaluateVelocitySignal({
        transactionsInLast60Seconds: ctx.transactionsInLast60Seconds ?? 0,
      })
    );

    // 4. Merchant risk signals
    signals.push(
      ...evaluateMerchantRiskSignals({
        merchantName: ctx.intent.merchantName,
        merchantCategory: ctx.intent.merchantCategory,
        isKnownMerchant: ctx.isKnownMerchant ?? true,
      })
    );

    // 5. Prompt injection signal
    signals.push(
      evaluatePromptInjectionSignal({
        rawPrompt: ctx.intent.rawPrompt,
        intentDetails: ctx.intent.intentDetails,
      })
    );

    // Compute aggregate risk score
    const rawScore = signals
      .filter((s) => s.triggered)
      .reduce((sum, s) => sum + s.scoreContribution, 0);

    const overallScore = Math.min(100, Math.max(0, rawScore));

    let level: RiskLevel = 'LOW';
    if (overallScore >= 61) {
      level = 'HIGH';
    } else if (overallScore >= 31) {
      level = 'REVIEW';
    }

    const triggeredSignals = signals.filter((s) => s.triggered);
    const explanation =
      triggeredSignals.length === 0
        ? 'Risk score is nominal (0/100). No anomalous behavior detected.'
        : `Risk score is ${overallScore}/100 (${level}). Flagged ${triggeredSignals.length} risk signal(s): ${triggeredSignals.map((s) => s.code).join(', ')}.`;

    return {
      overallScore,
      level,
      signals,
      explanation,
      timestamp: new Date().toISOString(),
    };
  }
}
