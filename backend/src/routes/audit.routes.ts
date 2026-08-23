import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuditService } from '../services/audit.service.js';

export const auditRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/api/v1/audit-events', async (request) => {
    const query = request.query as { limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 100;
    const events = await AuditService.getEvents(limit);
    return {
      total: events.length,
      events,
    };
  });

  fastify.get('/api/v1/audit-events/intent/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const events = await AuditService.getEventsForIntent(id);
    return reply.status(200).send({
      paymentIntentId: id,
      total: events.length,
      events,
    });
  });
};
