import { env } from '../config/env.js';

export interface RazorpayConnectionStatus {
  success: boolean;
  authenticated: boolean;
  statusCode: number;
  mode: 'test' | 'live' | 'unconfigured';
  keyIdMasked: string;
  latencyMs: number;
  responseSummary?: {
    entity?: string;
    count?: number;
    sampleOrderId?: string;
  };
  errorMessage?: string;
  timestamp: string;
}

export interface RazorpayCredentialsValidation {
  isValid: boolean;
  isTestMode: boolean;
  keyIdMasked: string;
  error?: string;
}

export class RazorpayService {
  private static readonly BASE_URL = 'https://api.razorpay.com/v1';

  /**
   * Validate that Razorpay environment variables are present and format is valid.
   * Ensures Key ID starts with 'rzp_test_' for Test Mode.
   * Never prints or exposes secret.
   */
  public static validateCredentials(): RazorpayCredentialsValidation {
    const keyId = env.RAZORPAY_KEY_ID?.trim();
    const keySecret = env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      return {
        isValid: false,
        isTestMode: false,
        keyIdMasked: 'NOT_CONFIGURED',
        error: 'Razorpay credentials missing in environment (.env)',
      };
    }

    if (keyId.includes('placeholder') || keySecret.includes('placeholder')) {
      return {
        isValid: false,
        isTestMode: false,
        keyIdMasked: 'PLACEHOLDER_KEY',
        error: 'Placeholder credentials detected in environment (.env)',
      };
    }

    const isTestMode = keyId.startsWith('rzp_test_');
    const isLiveMode = keyId.startsWith('rzp_live_');

    if (!isTestMode && !isLiveMode) {
      return {
        isValid: false,
        isTestMode: false,
        keyIdMasked: `${keyId.substring(0, 4)}...`,
        error: 'Invalid Razorpay Key ID format (must start with rzp_test_ or rzp_live_)',
      };
    }

    // Mask key ID safely for logging/UI display (e.g. rzp_test_...XXXX)
    const keyIdMasked = keyId.length > 8
      ? `${keyId.substring(0, 9)}...${keyId.substring(keyId.length - 4)}`
      : `${keyId.substring(0, 4)}...`;

    return {
      isValid: true,
      isTestMode,
      keyIdMasked,
    };
  }

  /**
   * Build official HTTP Basic Auth header using server-side key ID & secret.
   * Secret stays strictly server-side and is never returned in any response.
   */
  private static getAuthHeader(): string {
    const keyId = env.RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = env.RAZORPAY_KEY_SECRET?.trim() || '';
    const creds = `${keyId}:${keySecret}`;
    return `Basic ${Buffer.from(creds).toString('base64')}`;
  }

  /**
   * Performs a real authenticated HTTP request to Razorpay Test Mode API.
   * No mocks. No hardcoded fake successes.
   */
  public static async verifyConnection(): Promise<RazorpayConnectionStatus> {
    const validation = this.validateCredentials();
    const timestamp = new Date().toISOString();

    if (!validation.isValid) {
      return {
        success: false,
        authenticated: false,
        statusCode: 0,
        mode: 'unconfigured',
        keyIdMasked: validation.keyIdMasked,
        latencyMs: 0,
        errorMessage: validation.error,
        timestamp,
      };
    }

    const startTime = Date.now();
    try {
      // Official Razorpay API: Query orders collection with count=1 to authenticate and test connection
      const response = await fetch(`${this.BASE_URL}/orders?count=1`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          'Accept': 'application/json',
          'User-Agent': 'AgentPay-ControlPlane/1.0',
        },
      });

      const latencyMs = Date.now() - startTime;
      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        const errorObj = data.error as { description?: string; code?: string } | undefined;
        return {
          success: false,
          authenticated: false,
          statusCode: response.status,
          mode: validation.isTestMode ? 'test' : 'live',
          keyIdMasked: validation.keyIdMasked,
          latencyMs,
          errorMessage: errorObj?.description || `Razorpay API returned HTTP ${response.status}`,
          timestamp,
        };
      }

      const items = Array.isArray(data.items) ? (data.items as Array<{ id?: string }>) : [];
      const sampleOrderId = items.length > 0 ? items[0].id : undefined;

      return {
        success: true,
        authenticated: true,
        statusCode: response.status,
        mode: validation.isTestMode ? 'test' : 'live',
        keyIdMasked: validation.keyIdMasked,
        latencyMs,
        responseSummary: {
          entity: data.entity as string,
          count: typeof data.count === 'number' ? data.count : items.length,
          sampleOrderId,
        },
        timestamp,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        authenticated: false,
        statusCode: 500,
        mode: validation.isTestMode ? 'test' : 'live',
        keyIdMasked: validation.keyIdMasked,
        latencyMs,
        errorMessage: (err as Error).message || 'Network error reaching Razorpay API',
        timestamp,
      };
    }
  }

  /**
   * Create a genuine order on Razorpay Test Mode.
   */
  public static async createOrder(params: {
    amountPaise: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ ok: boolean; statusCode: number; data: Record<string, unknown> }> {
    const currency = params.currency || 'INR';
    const response = await fetch(`${this.BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
        'User-Agent': 'AgentPay-ControlPlane/1.0',
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency,
        receipt: params.receipt,
        notes: params.notes || {},
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;
    return {
      ok: response.ok,
      statusCode: response.status,
      data,
    };
  }

  /**
   * Fetch a genuine order by ID from Razorpay.
   */
  public static async getOrder(orderId: string): Promise<{ ok: boolean; statusCode: number; data: Record<string, unknown> }> {
    const response = await fetch(`${this.BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    const data = (await response.json()) as Record<string, unknown>;
    return {
      ok: response.ok,
      statusCode: response.status,
      data,
    };
  }

  /**
   * Fetch payment details by payment ID from Razorpay.
   */
  public static async getPayment(paymentId: string): Promise<{ ok: boolean; statusCode: number; data: Record<string, unknown> }> {
    const response = await fetch(`${this.BASE_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    const data = (await response.json()) as Record<string, unknown>;
    return {
      ok: response.ok,
      statusCode: response.status,
      data,
    };
  }
}
