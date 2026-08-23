import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { CreateAgentRequestSchema, CreateAgentTokenRequestSchema } from '../contracts/index.js';
import { AgentStudioService } from '../services/agent-studio.service.js';

export const agentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List all registered agents
  fastify.get('/api/v1/agents', async () => {
    const agents = await AgentStudioService.listAgents();
    return {
      total: agents.length,
      agents,
    };
  });

  // Register a new autonomous agent
  fastify.post('/api/v1/agents', async (request, reply) => {
    const body = CreateAgentRequestSchema.parse(request.body);
    const agent = await AgentStudioService.registerAgent(body);
    return reply.status(201).send(agent);
  });

  // Get single agent by ID
  fastify.get('/api/v1/agents/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const agent = await AgentStudioService.getAgent(id);

    if (!agent) {
      return reply.status(404).send({
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Autonomous agent with id '${id}' not found.`,
          requestId: request.id,
        },
      });
    }

    return reply.status(200).send(agent);
  });

  // List delegation tokens for an agent
  fastify.get('/api/v1/agents/:id/tokens', async (request) => {
    const { id } = request.params as { id: string };
    const tokens = await AgentStudioService.listTokensForAgent(id);
    return {
      agentId: id,
      total: tokens.length,
      tokens,
    };
  });

  // Issue a new scoped delegation token
  fastify.post('/api/v1/agents/:id/tokens', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = CreateAgentTokenRequestSchema.parse({
      ...(request.body as object),
      agentId: id,
    });

    const token = await AgentStudioService.issueToken(parsed);
    return reply.status(201).send(token);
  });

  // Revoke a delegation token
  fastify.delete('/api/v1/agents/tokens/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    const revoked = await AgentStudioService.revokeToken(token);

    if (!revoked) {
      return reply.status(404).send({
        error: {
          code: 'TOKEN_NOT_FOUND',
          message: 'Token not found.',
          requestId: request.id,
        },
      });
    }

    return reply.status(200).send({
      message: 'Token successfully revoked.',
      revoked: true,
    });
  });

  // Get drop-in Tool Definitions (OpenAI, Anthropic, LangChain, MCP)
  fastify.get('/api/v1/agents/:id/tool-definition', async (request) => {
    const { id } = request.params as { id: string };
    const baseUrl = `${request.protocol}://${request.hostname}`;
    const definitions = AgentStudioService.getToolDefinitions(id, baseUrl);
    return definitions;
  });
};
