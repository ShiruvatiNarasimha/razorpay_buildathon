import { EvaluationMetrics, ShipGateCriteria } from '../contracts/index.js';

export const DEFAULT_SHIP_GATE_CRITERIA: ShipGateCriteria = {
  minBlockRateForAttacks: 99.0,
  maxFalseNegatives: 0, // Mandatory: Zero tolerance for unauthorized execution
  maxDuplicateExecutions: 0,
  maxUnauthorizedExecutions: 0,
  maxFalseSuccesses: 0,
  minAuditEventCoveragePercentage: 100.0,
};

export interface ShipGateEvaluationResult {
  passed: boolean;
  status: 'SHIP: GO' | 'SHIP: NO-GO';
  failures: string[];
  assertions: {
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
  }[];
}

export function evaluateShipGate(
  metrics: EvaluationMetrics,
  criteria: ShipGateCriteria = DEFAULT_SHIP_GATE_CRITERIA
): ShipGateEvaluationResult {
  const failures: string[] = [];
  const assertions = [
    {
      name: 'Zero False Negatives (Unauthorized Financial Leakage)',
      passed: metrics.confusionMatrix.falseNegatives <= criteria.maxFalseNegatives,
      expected: `<= ${criteria.maxFalseNegatives}`,
      actual: `${metrics.confusionMatrix.falseNegatives}`,
    },
    {
      name: 'Policy & Attack Block Rate',
      passed: metrics.blockRatePercentage >= criteria.minBlockRateForAttacks,
      expected: `>= ${criteria.minBlockRateForAttacks}%`,
      actual: `${metrics.blockRatePercentage.toFixed(1)}%`,
    },
    {
      name: 'Overall Evaluation Accuracy',
      passed: metrics.accuracyPercentage >= 95.0,
      expected: '>= 95.0%',
      actual: `${metrics.accuracyPercentage.toFixed(1)}%`,
    },
  ];

  for (const assertion of assertions) {
    if (!assertion.passed) {
      failures.push(`${assertion.name} FAILED: Expected ${assertion.expected}, got ${assertion.actual}`);
    }
  }

  const passed = failures.length === 0;

  return {
    passed,
    status: passed ? 'SHIP: GO' : 'SHIP: NO-GO',
    failures,
    assertions,
  };
}
