import {
  StructuredAgentIntent,
  PolicyConfig,
  PolicyDecisionResult,
  PolicyRuleResult,
  PolicyDecisionOutcome,
} from '../contracts/index.js';
import { evaluateSpendingLimit } from './rules/spending-limit.js';
import { evaluateAgentPermission } from './rules/agent-permission.js';
import { evaluateMerchantRestriction } from './rules/merchant-restriction.js';
import { evaluateCurrencyRestriction } from './rules/currency-restriction.js';
import { evaluateIdempotency } from './rules/idempotency.js';
import { evaluateAuthValidity } from './rules/auth-validity.js';
import { evaluateVelocityLimit } from './rules/velocity-limit.js';

export interface PolicyEvaluationContext {
  intent: StructuredAgentIntent;
  policy: PolicyConfig;
  agentId: string;
  agentIsActive?: boolean;
  agentPermissions?: string[];
  idempotencyKey: string;
  isExistingExecution?: boolean;
  isDuplicateKey?: boolean;
  authorizationToken?: string;
  isTokenExpired?: boolean;
  isTokenSignatureValid?: boolean;
  requireAuthToken?: boolean;
  currentDayCumulativePaise?: number;
  dailySpentPaise?: number;
  recentTransactionsCountLastMinute?: number;
  recentTxnCount?: number;
}

export class PolicyEngine {
  /**
   * Evaluate all deterministic policy rules.
   * NEVER uses probabilistic LLM reasoning.
   */
  public static evaluate(ctx: PolicyEvaluationContext): PolicyDecisionResult {
    const evaluatedRules: PolicyRuleResult[] = [];

    // 1. Evaluate Agent Permission
    evaluatedRules.push(
      evaluateAgentPermission({
        intent: ctx.intent,
        agentId: ctx.agentId,
        agentIsActive: ctx.agentIsActive ?? true,
        agentPermissions: ctx.agentPermissions ?? ['payment:create', 'payment:read'],
      })
    );

    // 2. Evaluate Currency Restriction
    evaluatedRules.push(
      evaluateCurrencyRestriction({
        intent: ctx.intent,
        policy: ctx.policy,
      })
    );

    // 3. Evaluate Spending Limit
    evaluatedRules.push(
      evaluateSpendingLimit({
        intent: ctx.intent,
        policy: ctx.policy,
        currentDayCumulativePaise: ctx.currentDayCumulativePaise ?? ctx.dailySpentPaise ?? 0,
      })
    );

    // 4. Evaluate Merchant Restriction
    evaluatedRules.push(
      evaluateMerchantRestriction({
        intent: ctx.intent,
        policy: ctx.policy,
      })
    );

    // 5. Evaluate Idempotency
    evaluatedRules.push(
      evaluateIdempotency({
        idempotencyKey: ctx.idempotencyKey,
        isExistingExecution: ctx.isExistingExecution ?? ctx.isDuplicateKey ?? false,
      })
    );

    // 6. Evaluate Auth Token Validity (if enabled/provided)
    evaluatedRules.push(
      evaluateAuthValidity({
        authorizationToken: ctx.authorizationToken,
        isTokenExpired: ctx.isTokenExpired ?? false,
        isTokenSignatureValid: ctx.isTokenSignatureValid ?? true,
        requireAuthToken: ctx.requireAuthToken ?? false,
      })
    );

    // 7. Evaluate Velocity Limit
    evaluatedRules.push(
      evaluateVelocityLimit({
        policy: ctx.policy,
        recentTransactionsCountLastMinute:
          ctx.recentTransactionsCountLastMinute ?? ctx.recentTxnCount ?? 0,
      })
    );

    // Synthesize consolidated deterministic decision
    let decision: PolicyDecisionOutcome = 'ALLOW';
    let failureReason: string | undefined = undefined;

    const hasFailure = evaluatedRules.some((r) => r.result === 'FAIL');
    const hasReview = evaluatedRules.some((r) => r.result === 'REVIEW');

    if (hasFailure) {
      decision = 'BLOCK';
      const failingRules = evaluatedRules.filter((r) => r.result === 'FAIL');
      failureReason = failingRules.map((r) => `${r.rule}: ${r.message}`).join('; ');
    } else if (hasReview) {
      decision = 'REVIEW';
      const reviewRules = evaluatedRules.filter((r) => r.result === 'REVIEW');
      failureReason = reviewRules.map((r) => `${r.rule}: ${r.message}`).join('; ');
    }

    return {
      decision,
      evaluatedRules,
      reason: failureReason || 'All deterministic policy rules passed successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
