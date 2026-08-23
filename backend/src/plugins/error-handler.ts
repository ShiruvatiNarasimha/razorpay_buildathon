import { FastifyError, FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { IllegalStateTransitionError } from '../policy-engine/index.js';

const errorHandlerPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = request.id || 'unknown';

    // 1. Zod Validation Errors
    if (error instanceof ZodError) {
      request.log.warn({ requestId, issues: error.issues }, 'Schema validation error');
      return reply.status(400).send({
        error: {
          code: 'SCHEMA_VALIDATION_ERROR',
          message: 'Request payload failed schema validation',
          requestId,
          context: {
            issues: error.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
              code: i.code,
            })),
          },
        },
      });
    }

    // 2. Illegal State Transition Errors
    if (error instanceof IllegalStateTransitionError) {
      request.log.warn({ requestId, err: error.message }, 'Illegal state transition attempt');
      return reply.status(422).send({
        error: {
          code: 'ILLEGAL_STATE_TRANSITION',
          message: error.message,
          requestId,
          context: {
            currentState: error.currentState,
            targetState: error.targetState,
          },
        },
      });
    }

    // 3. Fastify Validation Errors
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_REQUEST_PARAMETERS',
          message: error.message,
          requestId,
          context: { validation: error.validation },
        },
      });
    }

    // 4. Generic Internal Errors
    const statusCode = error.statusCode || 500;
    request.log.error({ requestId, err: error }, 'Internal server error occurred');

    return reply.status(statusCode).send({
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: statusCode === 500 ? 'An unexpected error occurred in financial control plane' : error.message,
        requestId,
        context: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      },
    });
  });
};

export const errorHandlerPlugin = fp(errorHandlerPluginAsync, {
  name: 'agentpay-error-handler',
});
