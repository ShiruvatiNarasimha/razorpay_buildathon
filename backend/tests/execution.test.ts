import { describe, it, expect, beforeEach } from 'vitest';
import { MockPaymentGateway } from '../src/execution/mock-gateway.js';
import { IdempotencyManager } from '../src/execution/idempotency.js';
import { VerificationEngine } from '../src/execution/verification.js';
import { ExecutionRequest } from '../src/contracts/index.js';
import { randomUUID } from 'node:crypto';

describe('Execution Gateway & Idempotency Subsystem', () => {
  let gateway: MockPaymentGateway;

  beforeEach(() => {
    gateway = new MockPaymentGateway();
    IdempotencyManager.clear();
  });

  it('successfully creates an order via MockPaymentGateway', async () => {
    const request: ExecutionRequest = {
      paymentIntentId: randomUUID(),
      amountPaise: 399900, // ₹3,999.00
      currency: 'INR',
      merchantName: 'Nike',
      idempotencyKey: 'idemp_key_001',
      gateway: 'mock',
    };

    const result = await gateway.createOrder(request);
    expect(result.status).toBe('SUCCEEDED');
    expect(result.providerPaymentId).toBeDefined();
    expect(result.amountPaise).toBe(399900);
  });

  it('guarantees idempotency: same request twice yields 1 financial execution and returns identical cached result', async () => {
    const request: ExecutionRequest = {
      paymentIntentId: randomUUID(),
      amountPaise: 250000,
      currency: 'INR',
      merchantName: 'Adidas',
      idempotencyKey: 'unique_idempotency_key_42',
      gateway: 'mock',
    };

    // First Execution
    const firstRun = await IdempotencyManager.executeWithIdempotency(gateway, request);
    expect(firstRun.isReplay).toBe(false);
    expect(firstRun.result.status).toBe('SUCCEEDED');
    const originalPaymentId = firstRun.result.providerPaymentId;

    // Second Execution (Replay)
    const secondRun = await IdempotencyManager.executeWithIdempotency(gateway, request);
    expect(secondRun.isReplay).toBe(true);
    expect(secondRun.result.status).toBe('SUCCEEDED');
    expect(secondRun.result.providerPaymentId).toBe(originalPaymentId);
    expect(secondRun.result.executionId).toBe(firstRun.result.executionId);
  });

  it('verifies successfully reconciled transaction', async () => {
    const request: ExecutionRequest = {
      paymentIntentId: randomUUID(),
      amountPaise: 150000,
      currency: 'INR',
      merchantName: 'Decathlon',
      idempotencyKey: 'idemp_verify_001',
      gateway: 'mock',
    };

    const execResult = await gateway.createOrder(request);
    expect(execResult.providerPaymentId).toBeDefined();

    const { finalState, verification } = await VerificationEngine.verifyAndReconcile(gateway, {
      paymentIntentId: request.paymentIntentId,
      providerPaymentId: execResult.providerPaymentId!,
      expectedAmountPaise: 150000,
      expectedCurrency: 'INR',
    });

    expect(finalState).toBe('SUCCEEDED');
    expect(verification.isVerified).toBe(true);
    expect(verification.amountMatched).toBe(true);
  });

  it('fails closed when provider amount does not match expected amount', async () => {
    const paymentIntentId = randomUUID();
    const { finalState, verification } = await VerificationEngine.verifyAndReconcile(gateway, {
      paymentIntentId,
      providerPaymentId: 'pay_mock_mismatched',
      expectedAmountPaise: 999999, // Intent expected ₹9,999.99, but mock returned default ₹2,500.00
      expectedCurrency: 'INR',
    });

    expect(finalState).toBe('FAILED');
    expect(verification.isVerified).toBe(false);
    expect(verification.status).toBe('AMOUNT_MISMATCH');
  });
});
