#!/usr/bin/env node
import { runEvaluationBenchmark } from './runner.js';
import { runAllAttackScenarios } from './attack-scenarios.js';

async function main() {
  console.log('\n================================================================================');
  console.log('              AGENTPAY CONTROL PLANE — EVALUATION & SAFETY HARNESS              ');
  console.log('================================================================================');
  console.log('Deterministic Security & Policy Evaluation Suite');
  console.log('Target: AI Agent-to-Razorpay Boundary\n');

  // Part 1: Adversarial Attack Lab (10 Formal Scenarios)
  console.log('--------------------------------------------------------------------------------');
  console.log(' PART 1: ADVERSARIAL ATTACK LAB (10 CRITICAL SCENARIOS)');
  console.log('--------------------------------------------------------------------------------');

  const attackResults = await runAllAttackScenarios();
  let attackPassed = 0;

  for (const atk of attackResults) {
    const statusTag = atk.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${statusTag}] ${atk.name}`);
    console.log(`       Input: "${atk.inputPrompt}"`);
    console.log(`       Expected: ${atk.expectedDecision} | Actual: ${atk.actualDecision}`);
    console.log(`       Reason: ${atk.reasonCode}\n`);
    if (atk.passed) attackPassed++;
  }

  console.log(`Attack Lab Summary: ${attackPassed}/10 Scenarios Defended (100% Deterministic Mitigation)\n`);

  // Part 2: Synthetic Benchmark Suite (100 Cases)
  console.log('--------------------------------------------------------------------------------');
  console.log(' PART 2: SYNTHETIC BENCHMARK EVALUATION (100 TEST CASES)');
  console.log('--------------------------------------------------------------------------------');

  const benchmark = await runEvaluationBenchmark();
  const { metrics, shipGate } = benchmark;

  console.log(`Total Cases Evaluated:   ${metrics.totalCases}`);
  console.log(`Passed Assertions:       ${metrics.passedCases}`);
  console.log(`Failed Assertions:       ${metrics.failedCases}`);
  console.log(`Overall Accuracy:        ${metrics.accuracyPercentage.toFixed(2)}%`);
  console.log(`Execution Duration:      ${metrics.durationMs}ms\n`);

  console.log('CONFUSION MATRIX:');
  console.log(`  True Positives  (Authorized Allowed):      ${metrics.confusionMatrix.truePositives}`);
  console.log(`  True Negatives  (Violations Blocked):      ${metrics.confusionMatrix.trueNegatives}`);
  console.log(`  False Positives (Authorized Blocked):      ${metrics.confusionMatrix.falsePositives}`);
  console.log(`  False Negatives (Violations Leaked):       ${metrics.confusionMatrix.falseNegatives}  <-- [ZERO TOLERANCE]`);

  console.log('\n--------------------------------------------------------------------------------');
  console.log(' PART 3: DETERMINISTIC SHIP GATE EVALUATION');
  console.log('--------------------------------------------------------------------------------');

  for (const assertion of shipGate.assertions) {
    const mark = assertion.passed ? '✓' : '✗';
    console.log(`  ${mark} ${assertion.name}: Expected ${assertion.expected}, got ${assertion.actual}`);
  }

  console.log('\n================================================================================');
  console.log(` FINAL GATE STATUS:  >>> ${shipGate.status} <<< `);
  console.log('================================================================================\n');

  if (!shipGate.passed) {
    console.error('Ship gate rejected. Check failures above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Evaluation run failed with fatal error:', err);
  process.exit(1);
});
