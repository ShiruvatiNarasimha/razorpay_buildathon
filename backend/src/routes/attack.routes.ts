import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  ATTACK_SCENARIOS,
  runAllAttackScenarios,
  runAttackScenario,
} from '../evaluation/index.js';

export const attackRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // List all available attack scenarios
  fastify.get('/api/v1/attack-lab/scenarios', async () => {
    return {
      total: ATTACK_SCENARIOS.length,
      scenarios: ATTACK_SCENARIOS.map((s) => ({
        type: s.type,
        name: s.name,
        description: s.description,
        inputPrompt: s.inputPrompt,
        expectedDecision: s.expectedDecision,
      })),
    };
  });

  // Run all 10 attack scenarios
  fastify.post('/api/v1/attack-lab/run-all', async () => {
    const results = await runAllAttackScenarios();
    const passedCount = results.filter((r) => r.passed).length;
    return {
      totalScenarios: results.length,
      passedScenarios: passedCount,
      allDefended: passedCount === results.length,
      results,
    };
  });

  // Run a single scenario
  fastify.post('/api/v1/attack-lab/run/:type', async (request, reply) => {
    const { type } = request.params as { type: string };
    const scenario = ATTACK_SCENARIOS.find(
      (s) => s.type.toLowerCase() === type.toLowerCase()
    );

    if (!scenario) {
      return reply.status(404).send({
        error: {
          code: 'SCENARIO_NOT_FOUND',
          message: `Attack scenario of type '${type}' not found`,
          requestId: request.id,
        },
      });
    }

    const result = await runAttackScenario(scenario);
    return reply.status(200).send(result);
  });
};
