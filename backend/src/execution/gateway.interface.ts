import {
  ExecutionRequest,
  ExecutionResult,
  VerificationRequest,
  VerificationResult,
} from '../contracts/index.js';

export interface PaymentGateway {
  readonly providerName: 'mock' | 'razorpay';

  /**
   * Create an order or initialize a payment authorization.
   */
  createOrder(request: ExecutionRequest): Promise<ExecutionResult>;

  /**
   * Execute or capture an authorized payment.
   */
  capturePayment(paymentId: string, amountPaise: number): Promise<ExecutionResult>;

  /**
   * Verify provider state and cryptographic signatures.
   */
  verifyPayment(request: VerificationRequest): Promise<VerificationResult>;
}
