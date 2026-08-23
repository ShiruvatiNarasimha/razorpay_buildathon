import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { runEvaluationBenchmark, BenchmarkRunResult } from '../evaluation/index.js';

let latestBenchmarkResult: BenchmarkRunResult | null = null;

export const evaluationRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/api/v1/evaluation/run', async () => {
    const result = await runEvaluationBenchmark();
    latestBenchmarkResult = result;
    return result;
  });

  fastify.get('/api/v1/evaluation/latest', async () => {
    if (!latestBenchmarkResult) {
      latestBenchmarkResult = await runEvaluationBenchmark();
    }
    return latestBenchmarkResult;
  });
};
