import { describe, it, expect } from 'vitest';
import { runEvaluationBenchmark } from '../src/evaluation/runner.js';
import { runAllAttackScenarios } from '../src/evaluation/attack-scenarios.js';

describe('Evaluation & Adversarial Defense Suite', () => {
  it('successfully mitigates all 10 formal attack scenarios', async () => {
    const attackResults = await runAllAttackScenarios();
    expect(attackResults.length).toBe(10);
    for (const atk of attackResults) {
      expect(atk.passed).toBe(true);
    }
  });

  it('runs 100-case synthetic benchmark with ZERO false negatives and passes Ship Gate', async () => {
    const benchmark = await runEvaluationBenchmark();
    expect(benchmark.metrics.totalCases).toBe(100);
    expect(benchmark.metrics.confusionMatrix.falseNegatives).toBe(0);
    expect(benchmark.metrics.accuracyPercentage).toBeGreaterThanOrEqual(95);
    expect(benchmark.shipGate.passed).toBe(true);
    expect(benchmark.shipGate.status).toBe('SHIP: GO');
  });
});
