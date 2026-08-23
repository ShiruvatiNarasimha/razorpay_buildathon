import { ExecutionRequest, ExecutionResult } from '../contracts/index.js';
import { PaymentGateway } from './gateway.interface.js';

export interface IdempotencyEntry {
  key: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: ExecutionResult;
  createdAt: number;
}

export class IdempotencyManager {
  private static store: Map<string, IdempotencyEntry> = new Map();

  public static clear(): void {
    this.store.clear();
  }

  /**
   * Executes a payment gateway request with guaranteed idempotency.
   * Duplicate requests return the exact same execution result without calling the gateway twice.
   */
  public static async executeWithIdempotency(
    gateway: PaymentGateway,
    request: ExecutionRequest
  ): Promise<{ result: ExecutionResult; isReplay: boolean }> {
    const key = request.idempotencyKey;

    const existing = this.store.get(key);
    if (existing) {
      if (existing.status === 'COMPLETED' && existing.result) {
        return {
          result: existing.result,
          isReplay: true,
        };
      }
      if (existing.status === 'PROCESSING') {
        throw new Error(
          `Concurrent execution in progress for idempotency key: ${key}. Please wait.`
        );
      }
    }

    // Acquire lock
    this.store.set(key, {
      key,
      status: 'PROCESSING',
      createdAt: Date.now(),
    });

    try {
      const result = await gateway.createOrder(request);

      this.store.set(key, {
        key,
        status: 'COMPLETED',
        result,
        createdAt: Date.now(),
      });

      return {
        result,
        isReplay: false,
      };
    } catch (err) {
      this.store.set(key, {
        key,
        status: 'FAILED',
        createdAt: Date.now(),
      });
      throw err;
    }
  }

  public static getEntry(key: string): IdempotencyEntry | undefined {
    return this.store.get(key);
  }
}
