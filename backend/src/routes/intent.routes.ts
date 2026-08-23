import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AgentIntentRequestSchema } from '../contracts/index.js';
import { IntentOrchestratorService } from '../services/intent-orchestrator.service.js';

export const intentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Process Intent through AI + Policy + Risk + Gateway + Verification + Audit
  fastify.post('/api/v1/intents/process', async (request, reply) => {
    const validatedRequest = AgentIntentRequestSchema.parse(request.body);
    const trace = await IntentOrchestratorService.processIntent(
      validatedRequest,
      request.id || 'req_unknown'
    );
    return reply.status(200).send(trace);
  });

  // Get complete Decision Trace for a payment intent
  fastify.get('/api/v1/intents/:id/trace', async (request, reply) => {
    const { id } = request.params as { id: string };
    const trace = IntentOrchestratorService.getTrace(id);

    if (!trace) {
      return reply.status(404).send({
        error: {
          code: 'PAYMENT_INTENT_NOT_FOUND',
          message: `No payment intent or decision trace found for id '${id}'`,
          requestId: request.id,
        },
      });
    }

    return reply.status(200).send(trace);
  });

  // List recent traces
  fastify.get('/api/v1/intents', async () => {
    const traces = IntentOrchestratorService.getAllTraces();
    return {
      total: traces.length,
      intents: traces,
    };
  });
};
