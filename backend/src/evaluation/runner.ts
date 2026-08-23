import {
  EvaluationCase,
  EvaluationMetrics,
  PolicyConfig,
  StructuredAgentIntent,
} from '../contracts/index.js';
import { PolicyEngine } from '../policy-engine/index.js';
import { RiskEngine } from '../risk-engine/index.js';
import { evaluateShipGate } from './ship-gate.js';
import { generateSyntheticBenchmarkDataset } from './synthetic-dataset.js';

const BENCHMARK_POLICY: PolicyConfig = {
  userId: 'usr_bench_001',
  maxTransactionAmountPaise: 400000, // ₹4,000.00
  dailyLimitPaise: 500000, // ₹5,000.00
  allowedCurrencies: ['INR'],
  allowedMerchants: ['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart', 'Decathlon'],
  blockedMerchants: [
    'Darknet Store',
    'Suspicious Casino',
    'Untrusted Crypto Exchange',
    'Illicit Gambling Portal',
    'Shadow Wire Service',
  ],
  requireReviewAboveAmountPaise: 300000, // ₹3,000.00
  maxVelocityPerMinute: 5,
  autoApproveWhitelistMerchants: false,
};

export interface BenchmarkRunResult {
  metrics: EvaluationMetrics;
  shipGate: ReturnType<typeof evaluateShipGate>;
  caseResults: {
    caseId: string;
    name: string;
    category: string;
    expected: string;
    actual: string;
    passed: boolean;
    reason: string;
  }[];
}

export async function runEvaluationBenchmark(
  customCases?: EvaluationCase[]
): Promise<BenchmarkRunResult> {
  const startTime = Date.now();
  const cases = customCases || generateSyntheticBenchmarkDataset();

  let passedCases = 0;
  let failedCases = 0;

  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  let totalBlocked = 0;
  let totalAllowed = 0;
  let totalReview = 0;

  const caseResults = [];

  for (const testCase of cases) {
    const intent: StructuredAgentIntent = {
      action: 'purchase',
      category: testCase.category.toLowerCase(),
      amountPaise: testCase.amountPaise,
      currency: testCase.currency as 'INR',
      merchantName: testCase.merchantName,
      rawPrompt: testCase.prompt,
    };

    const agentPermissions =
      testCase.agentId === 'unauthorized-agent' ? ['payment:read'] : ['payment:create', 'payment:read'];

    const policyDecision = PolicyEngine.evaluate({
      intent,
      policy: BENCHMARK_POLICY,
      agentId: testCase.agentId,
      agentIsActive: true,
      agentPermissions,
      idempotencyKey: `idemp_${testCase.id}`,
    });

    const riskAssessment = RiskEngine.evaluate({
      intent,
      userId: testCase.userId,
      isDuplicateFingerprint: false,
    });

    // Final consolidated decision
    let consolidatedDecision = policyDecision.decision;
    if (consolidatedDecision === 'ALLOW' && riskAssessment.level === 'HIGH') {
      consolidatedDecision = 'BLOCK';
    } else if (consolidatedDecision === 'ALLOW' && riskAssessment.level === 'REVIEW') {
      consolidatedDecision = 'REVIEW';
    }

    if (consolidatedDecision === 'BLOCK') totalBlocked++;
    if (consolidatedDecision === 'ALLOW') totalAllowed++;
    if (consolidatedDecision === 'REVIEW') totalReview++;

    // Decision assertion
    const isExpectedMatch = consolidatedDecision === testCase.expectedDecision;

    if (isExpectedMatch) {
      passedCases++;
    } else {
      failedCases++;
    }

    // Confusion matrix classification
    if (testCase.isAdversarial || testCase.expectedDecision === 'BLOCK') {
      if (consolidatedDecision === 'BLOCK') {
        trueNegatives++;
      } else {
        falseNegatives++; // CRITICAL: Attack was NOT blocked
      }
    } else {
      if (consolidatedDecision === 'ALLOW' || consolidatedDecision === 'REVIEW') {
        truePositives++;
      } else {
        falsePositives++;
      }
    }

    caseResults.push({
      caseId: testCase.id,
      name: testCase.name,
      category: testCase.category,
      expected: testCase.expectedDecision,
      actual: consolidatedDecision,
      passed: isExpectedMatch,
      reason: policyDecision.reason,
    });
  }

  const durationMs = Date.now() - startTime;
  const totalCases = cases.length;
  const accuracyPercentage = (passedCases / totalCases) * 100;
  const blockRatePercentage = (totalBlocked / (totalCases - totalAllowed - totalReview + totalBlocked || 1)) * 100;
  const allowRatePercentage = (totalAllowed / totalCases) * 100;
  const reviewRatePercentage = (totalReview / totalCases) * 100;

  const metrics: EvaluationMetrics = {
    totalCases,
    passedCases,
    failedCases,
    accuracyPercentage,
    blockRatePercentage: (totalBlocked / 60) * 100, // 60 adversarial cases total
    allowRatePercentage,
    reviewRatePercentage,
    confusionMatrix: {
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
    },
    zeroFalseNegativeGuarantee: falseNegatives === 0,
    shipGatePassed: falseNegatives === 0 && accuracyPercentage >= 95,
    durationMs,
    executedAt: new Date().toISOString(),
  };

  const shipGate = evaluateShipGate(metrics);

  return {
    metrics,
    shipGate,
    caseResults,
  };
}
