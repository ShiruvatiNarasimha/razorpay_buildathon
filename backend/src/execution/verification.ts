import {
  VerificationRequest,
  VerificationResult,
  PaymentIntentState,
} from '../contracts/index.js';
import { PaymentGateway } from './gateway.interface.js';

export interface ReconciledPaymentState {
  finalState: PaymentIntentState;
  verification: VerificationResult;
}

export class VerificationEngine {
  /**
   * Affirmatively verifies transaction against payment gateway.
   * Fails closed: Never marks SUCCEEDED on missing, ambiguous or failed verification.
   */
  public static async verifyAndReconcile(
    gateway: PaymentGateway,
    request: VerificationRequest
  ): Promise<ReconciledPaymentState> {
    const verification = await gateway.verifyPayment(request);

    if (verification.isVerified) {
      return {
        finalState: 'SUCCEEDED',
        verification: {
          ...verification,
          status: 'VERIFIED',
        },
      };
    }

    if (
      verification.status === 'AMOUNT_MISMATCH' ||
      verification.status === 'CURRENCY_MISMATCH' ||
      verification.status === 'SIGNATURE_INVALID' ||
      verification.status === 'PROVIDER_FAILED'
    ) {
      return {
        finalState: 'FAILED',
        verification,
      };
    }

    // Ambiguous / timeout states fail closed to REVIEW_REQUIRED
    return {
      finalState: 'REVIEW_REQUIRED',
      verification,
    };
  }
}
