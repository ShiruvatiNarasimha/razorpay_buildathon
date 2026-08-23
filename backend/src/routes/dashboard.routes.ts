import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { IntentOrchestratorService } from '../services/intent-orchestrator.service.js';

export const dashboardRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/api/v1/dashboard/metrics', async () => {
    const traces = IntentOrchestratorService.getAllTraces();
    const activePolicy = await IntentOrchestratorService.getActivePolicyForUser();

    let totalVolumePaise = 0;
    let allowedCount = 0;
    let blockedCount = 0;
    let reviewCount = 0;
    let succeededCount = 0;
    let failedCount = 0;

    let lowRiskCount = 0;
    let moderateRiskCount = 0;
    let highRiskCount = 0;

    for (const t of traces) {
      totalVolumePaise += t.paymentIntent.amountPaise;

      if (t.finalDecision === 'ALLOW') allowedCount++;
      else if (t.finalDecision === 'BLOCK') blockedCount++;
      else if (t.finalDecision === 'REVIEW') reviewCount++;

      if (t.finalStatus === 'SUCCEEDED') succeededCount++;
      else if (t.finalStatus === 'FAILED') failedCount++;

      const riskLevel = t.riskAssessment?.level;
      if (riskLevel === 'LOW') lowRiskCount++;
      else if (riskLevel === 'REVIEW') moderateRiskCount++;
      else if (riskLevel === 'HIGH') highRiskCount++;
    }

    return {
      summary: {
        totalIntents: traces.length,
        allowedCount,
        blockedCount,
        reviewCount,
        succeededCount,
        failedCount,
        totalVolumePaise,
        totalVolumeFormatted: `₹${(totalVolumePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      },
      rates: {
        allowRatePercentage: traces.length > 0 ? (allowedCount / traces.length) * 100 : 0,
        blockRatePercentage: traces.length > 0 ? (blockedCount / traces.length) * 100 : 0,
        reviewRatePercentage: traces.length > 0 ? (reviewCount / traces.length) * 100 : 0,
      },
      riskDistribution: {
        low: lowRiskCount,
        review: moderateRiskCount,
        high: highRiskCount,
      },
      activePolicy,
      recentTraces: traces.slice(0, 10),
    };
  });
};
