import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SupervisorActionRequestSchema } from '../contracts/index.js';
import { SupervisorApprovalService } from '../services/supervisor-approval.service.js';

export const approvalRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List all pending approvals
  fastify.get('/api/v1/approvals/pending', async () => {
    const pending = await SupervisorApprovalService.getPendingApprovals();
    return {
      total: pending.length,
      pending,
    };
  });

  // Resolve pending intent approval (APPROVE or REJECT)
  fastify.post('/api/v1/approvals/:id/resolve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = SupervisorActionRequestSchema.parse(request.body || {});

    try {
      const result = await SupervisorApprovalService.resolveApproval(
        id,
        body,
        request.id || 'req_supervisor'
      );
      return reply.status(200).send(result);
    } catch (err) {
      return reply.status(400).send({
        error: {
          code: 'APPROVAL_RESOLUTION_FAILED',
          message: (err as Error).message,
          requestId: request.id,
        },
      });
    }
  });
};
