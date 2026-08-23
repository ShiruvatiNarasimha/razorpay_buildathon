import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { RazorpayService } from '../src/services/razorpay.service.js';

describe('Razorpay Test Mode Live Integration & Gateway Verifier', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates environment variables and masks key ID without leaking secrets', () => {
    const validation = RazorpayService.validateCredentials();
    expect(validation.isValid).toBe(true);
    expect(validation.isTestMode).toBe(true);
    expect(validation.keyIdMasked).toMatch(/^rzp_test_\.\.\./);
    // Ensure secret is never exposed in validation object
    const valObj = validation as unknown as Record<string, unknown>;
    expect(valObj.secret).toBeUndefined();
    expect(valObj.keySecret).toBeUndefined();
  });

  it('makes a real authenticated request to Razorpay Test Mode API (No Mocks)', async () => {
    const status = await RazorpayService.verifyConnection();
    expect(status.success).toBe(true);
    expect(status.authenticated).toBe(true);
    expect(status.statusCode).toBe(200);
    expect(status.mode).toBe('test');
    expect(status.responseSummary).toBeDefined();
    expect(status.responseSummary?.entity).toBe('collection');
    expect(status.latencyMs).toBeGreaterThan(0);
    expect(status.errorMessage).toBeUndefined();
  });

  it('GET /api/v1/gateway/status returns verified gateway configuration safely', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/gateway/status',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.provider).toBe('razorpay');
    expect(body.configured).toBe(true);
    expect(body.mode).toBe('test');
    expect(body.keyIdMasked).toContain('rzp_test_');
    // Verify secret is NOT in response
    expect(body.keySecret).toBeUndefined();
    expect(body.secret).toBeUndefined();
  });

  it('POST /api/v1/gateway/verify performs live handshake with Razorpay Test Mode', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/gateway/verify',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.authenticated).toBe(true);
    expect(body.statusCode).toBe(200);
    expect(body.mode).toBe('test');
  });

  it('creates and verifies a real test order on Razorpay Test Mode API', async () => {
    const testReceipt = `rcpt_test_${Date.now()}`;
    const orderRes = await RazorpayService.createOrder({
      amountPaise: 199900, // ₹1,999.00
      currency: 'INR',
      receipt: testReceipt,
      notes: {
        agentId: 'shopping-agent',
        purpose: 'AgentPay Autonomous Live Verification',
      },
    });

    expect(orderRes.ok).toBe(true);
    expect(orderRes.statusCode).toBe(200);
    expect(orderRes.data.id).toBeDefined();
    expect((orderRes.data.id as string).startsWith('order_')).toBe(true);
    expect(orderRes.data.amount).toBe(199900);
    expect(orderRes.data.currency).toBe('INR');
    expect(orderRes.data.status).toBe('created');

    // Fetch order back by ID
    const fetchRes = await RazorpayService.getOrder(orderRes.data.id as string);
    expect(fetchRes.ok).toBe(true);
    expect(fetchRes.data.id).toBe(orderRes.data.id);
    expect(fetchRes.data.amount).toBe(199900);
  });
});
