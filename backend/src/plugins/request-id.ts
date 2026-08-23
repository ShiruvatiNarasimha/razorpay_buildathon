import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

const requestIdPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const headerId = request.headers['x-request-id'];
    const requestId = (typeof headerId === 'string' && headerId) ? headerId : `req_${randomUUID()}`;
    request.id = requestId;
    reply.header('x-request-id', requestId);
  });
};

export const requestIdPlugin = fp(requestIdPluginAsync, {
  name: 'agentpay-request-id',
});
