import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { PolicyConfigSchema } from '../contracts/index.js';
import { IntentOrchestratorService } from '../services/intent-orchestrator.service.js';
import { prisma } from '../db/index.js';

export const policyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/api/v1/policies', async (request) => {
    const query = request.query as { userId?: string };
    const userId = query.userId || IntentOrchestratorService.runtimePolicy.userId;

    try {
      const dbPolicy = await prisma.policy.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      if (dbPolicy) {
        return {
          policy: {
            userId: dbPolicy.userId,
            maxTransactionAmountPaise: dbPolicy.maxTransactionAmountPaise,
            dailyLimitPaise: dbPolicy.dailyLimitPaise,
            allowedCurrencies: dbPolicy.allowedCurrencies,
            allowedMerchants: dbPolicy.allowedMerchants,
            blockedMerchants: dbPolicy.blockedMerchants,
            requireReviewAboveAmountPaise: dbPolicy.requireReviewAboveAmountPaise ?? undefined,
            maxVelocityPerMinute: dbPolicy.maxVelocityPerMinute,
            autoApproveWhitelistMerchants: dbPolicy.autoApproveWhitelistMerchants,
          },
        };
      }
    } catch {
      // Degrades gracefully
    }

    return {
      policy: IntentOrchestratorService.runtimePolicy,
    };
  });

  fastify.put('/api/v1/policies', async (request, reply) => {
    const updatedPolicy = PolicyConfigSchema.parse(request.body);
    IntentOrchestratorService.runtimePolicy = updatedPolicy;

    try {
      // Ensure user exists first
      await prisma.user.upsert({
        where: { id: updatedPolicy.userId },
        update: {
          singleTxnLimitPaise: updatedPolicy.maxTransactionAmountPaise,
          dailyLimitPaise: updatedPolicy.dailyLimitPaise,
          allowedCurrencies: updatedPolicy.allowedCurrencies,
        },
        create: {
          id: updatedPolicy.userId,
          email: `${updatedPolicy.userId}@agentpay.internal`,
          name: `User ${updatedPolicy.userId}`,
          singleTxnLimitPaise: updatedPolicy.maxTransactionAmountPaise,
          dailyLimitPaise: updatedPolicy.dailyLimitPaise,
          allowedCurrencies: updatedPolicy.allowedCurrencies,
        },
      });

      const existingPolicy = await prisma.policy.findFirst({
        where: { userId: updatedPolicy.userId },
      });

      if (existingPolicy) {
        await prisma.policy.update({
          where: { id: existingPolicy.id },
          data: {
            maxTransactionAmountPaise: updatedPolicy.maxTransactionAmountPaise,
            dailyLimitPaise: updatedPolicy.dailyLimitPaise,
            allowedCurrencies: updatedPolicy.allowedCurrencies,
            allowedMerchants: updatedPolicy.allowedMerchants,
            blockedMerchants: updatedPolicy.blockedMerchants,
            requireReviewAboveAmountPaise: updatedPolicy.requireReviewAboveAmountPaise || null,
            maxVelocityPerMinute: updatedPolicy.maxVelocityPerMinute,
            autoApproveWhitelistMerchants: updatedPolicy.autoApproveWhitelistMerchants,
          },
        });
      } else {
        await prisma.policy.create({
          data: {
            userId: updatedPolicy.userId,
            maxTransactionAmountPaise: updatedPolicy.maxTransactionAmountPaise,
            dailyLimitPaise: updatedPolicy.dailyLimitPaise,
            allowedCurrencies: updatedPolicy.allowedCurrencies,
            allowedMerchants: updatedPolicy.allowedMerchants,
            blockedMerchants: updatedPolicy.blockedMerchants,
            requireReviewAboveAmountPaise: updatedPolicy.requireReviewAboveAmountPaise || null,
            maxVelocityPerMinute: updatedPolicy.maxVelocityPerMinute,
            autoApproveWhitelistMerchants: updatedPolicy.autoApproveWhitelistMerchants,
          },
        });
      }
    } catch {
      // Degrades gracefully
    }

    return reply.status(200).send({
      message: 'Policy configuration updated successfully',
      policy: IntentOrchestratorService.runtimePolicy,
    });
  });
};
