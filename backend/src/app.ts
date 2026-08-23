import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { requestIdPlugin } from './plugins/request-id.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { healthRoutes } from './routes/health.routes.js';
import { intentRoutes } from './routes/intent.routes.js';
import { policyRoutes } from './routes/policy.routes.js';
import { auditRoutes } from './routes/audit.routes.js';
import { attackRoutes } from './routes/attack.routes.js';
import { evaluationRoutes } from './routes/evaluation.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { agentRoutes } from './routes/agent.routes.js';
import { approvalRoutes } from './routes/approval.routes.js';
import { gatewayRoutes } from './routes/gateway.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino/file',
              options: { destination: 1 },
            }
          : undefined,
    },
  });

  // Security & standard plugins
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Custom plugins
  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);

  // Register domain route plugins
  await app.register(healthRoutes);
  await app.register(gatewayRoutes);
  await app.register(intentRoutes);
  await app.register(policyRoutes);
  await app.register(agentRoutes);
  await app.register(approvalRoutes);
  await app.register(auditRoutes);
  await app.register(attackRoutes);
  await app.register(evaluationRoutes);
  await app.register(dashboardRoutes);

  return app;
}
