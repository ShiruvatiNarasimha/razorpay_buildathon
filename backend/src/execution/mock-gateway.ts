import {
  ExecutionRequest,
  ExecutionResult,
  VerificationRequest,
  VerificationResult,
} from '../contracts/index.js';
import { PaymentGateway } from './gateway.interface.js';
import { randomUUID } from 'node:crypto';

export interface MockGatewayOptions {
  simulateFailure?: boolean;
  simulateTimeout?: boolean;
  simulateAmountMismatch?: boolean;
}

export class MockPaymentGateway implements PaymentGateway {
  public readonly providerName = 'mock';
  private recordedTransactions: Map<string, ExecutionResult> = new Map();

  constructor(private options: MockGatewayOptions = {}) {}

  public setOptions(options: MockGatewayOptions): void {
    this.options = { ...this.options, ...options };
  }

  public async createOrder(request: ExecutionRequest): Promise<ExecutionResult> {
    if (this.options.simulateTimeout) {
      return {
        executionId: randomUUID(),
        paymentIntentId: request.paymentIntentId,
        gateway: 'mock',
        status: 'UNKNOWN',
        amountPaise: request.amountPaise,
        currency: request.currency,
        errorMessage: 'Mock provider gateway timed out waiting for upstream bank response',
        idempotencyKey: request.idempotencyKey,
        executedAt: new Date().toISOString(),
      };
    }

    if (this.options.simulateFailure) {
      return {
        executionId: randomUUID(),
        paymentIntentId: request.paymentIntentId,
        gateway: 'mock',
        status: 'FAILED',
        amountPaise: request.amountPaise,
        currency: request.currency,
        errorMessage: 'Mock bank declined the transaction: INSUFFICIENT_FUNDS_OR_CARD_ERROR',
        idempotencyKey: request.idempotencyKey,
        executedAt: new Date().toISOString(),
      };
    }

    const providerOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
    const providerPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;

    const result: ExecutionResult = {
      executionId: randomUUID(),
      paymentIntentId: request.paymentIntentId,
      gateway: 'mock',
      providerPaymentId,
      providerOrderId,
      status: 'SUCCEEDED',
      amountPaise: request.amountPaise,
      currency: request.currency,
      rawProviderResponse: {
        id: providerOrderId,
        entity: 'order',
        amount: request.amountPaise,
        currency: request.currency,
        status: 'created',
        payment_id: providerPaymentId,
        captured: true,
        merchant_name: request.merchantName,
      },
      idempotencyKey: request.idempotencyKey,
      executedAt: new Date().toISOString(),
    };

    this.recordedTransactions.set(providerPaymentId, result);
    return result;
  }

  public async capturePayment(paymentId: string, amountPaise: number): Promise<ExecutionResult> {
    const existing = this.recordedTransactions.get(paymentId);
    if (!existing) {
      return {
        executionId: randomUUID(),
        paymentIntentId: randomUUID(),
        gateway: 'mock',
        providerPaymentId: paymentId,
        status: 'FAILED',
        amountPaise,
        currency: 'INR',
        errorMessage: `Payment '${paymentId}' not found in mock ledger`,
        idempotencyKey: randomUUID(),
        executedAt: new Date().toISOString(),
      };
    }

    return {
      ...existing,
      status: 'SUCCEEDED',
    };
  }

  public async verifyPayment(request: VerificationRequest): Promise<VerificationResult> {
    const recorded = this.recordedTransactions.get(request.providerPaymentId);

    if (this.options.simulateAmountMismatch) {
      return {
        status: 'AMOUNT_MISMATCH',
        isVerified: false,
        providerPaymentId: request.providerPaymentId,
        providerStatus: 'captured',
        amountMatched: false,
        currencyMatched: true,
        signatureValid: true,
        reconciliationNotes: 'Recorded gateway amount does not match requested payment intent amount',
        verifiedAt: new Date().toISOString(),
      };
    }

    const amountMatched = recorded
      ? recorded.amountPaise === request.expectedAmountPaise
      : false;
    const currencyMatched = recorded
      ? recorded.currency === request.expectedCurrency
      : false;

    const isVerified = Boolean(recorded) && amountMatched && currencyMatched;

    return {
      status: isVerified ? 'VERIFIED' : 'AMOUNT_MISMATCH',
      isVerified,
      providerPaymentId: request.providerPaymentId,
      providerStatus: recorded ? 'captured' : 'unknown',
      amountMatched,
      currencyMatched,
      signatureValid: true,
      reconciliationNotes: isVerified
        ? 'Mock gateway payment verified and matched exactly against provider ledger'
        : 'Mock gateway payment mismatch or not found in provider ledger',
      verifiedAt: new Date().toISOString(),
    };
  }
}
