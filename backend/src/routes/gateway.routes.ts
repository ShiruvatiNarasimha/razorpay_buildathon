import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { RazorpayService } from '../services/razorpay.service.js';

export const gatewayRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/v1/gateway/status
   * Returns current gateway configuration and validation status without leaking secrets.
   */
  fastify.get('/api/v1/gateway/status', async (_request, reply) => {
    const validation = RazorpayService.validateCredentials();
    return reply.status(200).send({
      provider: 'razorpay',
      configured: validation.isValid,
      mode: validation.isTestMode ? 'test' : validation.isValid ? 'live' : 'unconfigured',
      keyIdMasked: validation.keyIdMasked,
      error: validation.error,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * POST /api/v1/gateway/verify
   * Performs real authenticated API handshake with Razorpay Test Mode.
   */
  fastify.post('/api/v1/gateway/verify', async (_request, reply) => {
    const status = await RazorpayService.verifyConnection();
    return reply.status(status.success ? 200 : 502).send(status);
  });

  /**
   * GET /api/v1/gateway/health
   * Lightweight connection probe for health monitors and dashboards.
   */
  fastify.get('/api/v1/gateway/health', async (_request, reply) => {
    const status = await RazorpayService.verifyConnection();
    return reply.status(status.success ? 200 : 503).send(status);
  });
};
