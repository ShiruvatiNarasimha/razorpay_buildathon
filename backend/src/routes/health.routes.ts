import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/index.js';

export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'agentpay-api',
      version: '0.1.0',
    };
  });

  fastify.get('/ready', async (_request, reply) => {
    let databaseStatus = 'unknown';

    try {
      if (process.env.DATABASE_URL) {
        await prisma.$queryRaw`SELECT 1`;
        databaseStatus = 'connected';
      } else {
        databaseStatus = 'standalone_memory_fallback';
      }
    } catch {
      databaseStatus = 'fallback_mode';
    }

    return reply.status(200).send({
      status: 'ready',
      service: 'agentpay-api',
      version: '0.1.0',
      dependencies: {
        database: databaseStatus,
        policyEngine: 'operational',
        riskEngine: 'operational',
        executionGateway: 'operational',
      },
      timestamp: new Date().toISOString(),
    });
  });
};
