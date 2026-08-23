import { describe, it, expect } from 'vitest';
import { PolicyEngine } from '../src/policy-engine/engine.js';
import { StructuredAgentIntent, PolicyConfig } from '../src/contracts/index.js';
import { validateStateTransition, IllegalStateTransitionError } from '../src/policy-engine/state-machine.js';

describe('PolicyEngine (Deterministic)', () => {
  const basePolicy: PolicyConfig = {
    userId: 'usr_test_1',
    maxTransactionAmountPaise: 400000, // ₹4,000.00
    dailyLimitPaise: 500000, // ₹5,000.00
    allowedCurrencies: ['INR'],
    allowedMerchants: ['Nike', 'Adidas', 'Amazon', 'Flipkart'],
    blockedMerchants: ['Darknet Store', 'Suspicious Casino'],
    requireReviewAboveAmountPaise: 300000, // ₹3,000.00
    maxVelocityPerMinute: 5,
    autoApproveWhitelistMerchants: false,
  };

  const validIntent: StructuredAgentIntent = {
    action: 'purchase',
    category: 'running_shoes',
    amountPaise: 250000, // ₹2,500.00 (< ₹3,000 review threshold)
    currency: 'INR',
    merchantName: 'Nike',
    rawPrompt: 'Buy Nike shoes for ₹2,500',
  };

  it('allows valid purchase within limits', () => {
    const result = PolicyEngine.evaluate({
      intent: validIntent,
      policy: basePolicy,
      agentId: 'shopping-agent',
      agentPermissions: ['payment:create'],
      dailySpentPaise: 0,
      recentTxnCount: 1,
      idempotencyKey: 'idemp_001',
      isDuplicateKey: false,
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.evaluatedRules.length).toBeGreaterThan(0);
    expect(result.evaluatedRules.every((r) => r.result === 'PASS')).toBe(true);
  });

  it('blocks purchase exceeding single-transaction limit', () => {
    const overBudgetIntent: StructuredAgentIntent = {
      ...validIntent,
      amountPaise: 450000, // ₹4,500 > ₹4,000
    };

    const result = PolicyEngine.evaluate({
      intent: overBudgetIntent,
      policy: basePolicy,
      agentId: 'shopping-agent',
      agentPermissions: ['payment:create'],
      dailySpentPaise: 0,
      recentTxnCount: 1,
      idempotencyKey: 'idemp_002',
      isDuplicateKey: false,
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('SPENDING_LIMIT');
  });

  it('blocks purchase exceeding daily cumulative limit', () => {
    const result = PolicyEngine.evaluate({
      intent: validIntent, // ₹2,500
      policy: basePolicy, // Daily limit: ₹5,000
      agentId: 'shopping-agent',
      agentPermissions: ['payment:create'],
      dailySpentPaise: 300000, // Already spent ₹3,000 -> 2500 + 3000 = 5500 > 5000
      recentTxnCount: 1,
      idempotencyKey: 'idemp_003',
      isDuplicateKey: false,
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('SPENDING_LIMIT');
  });

  it('blocks unauthorized agent action', () => {
    const result = PolicyEngine.evaluate({
      intent: validIntent,
      policy: basePolicy,
      agentId: 'unauthorized-agent',
      agentPermissions: ['payment:read'], // lacks payment:create
      dailySpentPaise: 0,
      recentTxnCount: 1,
      idempotencyKey: 'idemp_004',
      isDuplicateKey: false,
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('AGENT_PERMISSION');
  });

  it('blocks blacklisted merchant', () => {
    const blacklistedIntent: StructuredAgentIntent = {
      ...validIntent,
      merchantName: 'Darknet Store',
    };

    const result = PolicyEngine.evaluate({
      intent: blacklistedIntent,
      policy: basePolicy,
      agentId: 'shopping-agent',
      agentPermissions: ['payment:create'],
      dailySpentPaise: 0,
      recentTxnCount: 1,
      idempotencyKey: 'idemp_005',
      isDuplicateKey: false,
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('MERCHANT_RESTRICTION');
  });

  it('blocks unsupported currency', () => {
    const usdIntent: StructuredAgentIntent = {
      ...validIntent,
      currency: 'USD',
    };

    const result = PolicyEngine.evaluate({
      intent: usdIntent,
      policy: basePolicy,
      agentId: 'shopping-agent',
      agentPermissions: ['payment:create'],
      dailySpentPaise: 0,
      recentTxnCount: 1,
      idempotencyKey: 'idemp_006',
      isDuplicateKey: false,
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('CURRENCY_RESTRICTION');
  });

  it('blocks velocity flood (> maxVelocityPerMinute)', () => {
    const result = PolicyEngine.evaluate({
      intent: validIntent,
      policy: basePolicy,
      agentId: 'shopping-agent',
      agentPermissions: ['payment:create'],
      dailySpentPaise: 0,
      recentTxnCount: 6, // > 5
      idempotencyKey: 'idemp_007',
      isDuplicateKey: false,
    });

    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('VELOCITY_LIMIT');
  });

  it('enforces strict state transitions and rejects illegal jumps', () => {
    // Valid: PENDING -> POLICY_CHECK
    expect(() => validateStateTransition('PENDING', 'POLICY_CHECK')).not.toThrow();

    // Valid: AUTHORIZED -> EXECUTING
    expect(() => validateStateTransition('AUTHORIZED', 'EXECUTING')).not.toThrow();

    // Illegal: PENDING -> EXECUTING (Bypass check)
    expect(() => validateStateTransition('PENDING', 'EXECUTING')).toThrow(IllegalStateTransitionError);

    // Illegal: BLOCKED -> SUCCEEDED (Cannot succeed from blocked)
    expect(() => validateStateTransition('BLOCKED', 'SUCCEEDED')).toThrow(IllegalStateTransitionError);
  });
});
