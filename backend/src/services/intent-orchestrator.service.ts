import {
  AgentIntentRequest,
  DecisionTraceDTO,
  ExecutionResult,
  PaymentIntentDTO,
  PaymentIntentState,
  PolicyConfig,
  PolicyDecisionOutcome,
  PolicyDecisionResult,
  RiskAssessmentResult,
  StructuredAgentIntent,
  VerificationResult,
} from '../contracts/index.js';
import { randomUUID } from 'node:crypto';
import { PolicyEngine } from '../policy-engine/index.js';
import { RiskEngine } from '../risk-engine/index.js';
import {
  IdempotencyManager,
  MockPaymentGateway,
  PaymentGateway,
  RazorpayPaymentGateway,
  VerificationEngine,
} from '../execution/index.js';
import { AIIntentParserService } from './ai-parser.service.js';
import { AuditService } from './audit.service.js';
import { AgentStudioService } from './agent-studio.service.js';
import { env } from '../config/env.js';
import { prisma } from '../db/index.js';

export class IntentOrchestratorService {
  private static mockGateway = new MockPaymentGateway();
  private static razorpayGateway = new RazorpayPaymentGateway({
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
  });

  private static inMemoryIntents: Map<string, PaymentIntentDTO> = new Map();
  private static inMemoryTraces: Map<string, DecisionTraceDTO> = new Map();

  // Active runtime policy configuration (can be updated via API or synced with DB)
  public static runtimePolicy: PolicyConfig = {
    userId: env.DEFAULT_USER_ID,
    maxTransactionAmountPaise: 400000, // ₹4,000.00
    dailyLimitPaise: 500000, // ₹5,000.00
    allowedCurrencies: ['INR'],
    allowedMerchants: ['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart', 'Decathlon'],
    blockedMerchants: ['Darknet Store', 'Suspicious Casino', 'Untrusted Crypto Exchange'],
    requireReviewAboveAmountPaise: 300000, // ₹3,000.00
    maxVelocityPerMinute: 5,
    autoApproveWhitelistMerchants: false,
  };

  private static getGateway(preferred?: 'mock' | 'razorpay'): PaymentGateway {
    if (preferred === 'razorpay' || this.razorpayGateway.isConfigured()) {
      return this.razorpayGateway;
    }
    return this.mockGateway;
  }

  private static async withTimeout<T>(promise: Promise<T>, timeoutMs = 400): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timed out')), timeoutMs)
      ),
    ]);
  }

  public static async getActivePolicyForUser(userId?: string): Promise<PolicyConfig> {
    const targetUserId = userId || env.DEFAULT_USER_ID;
    try {
      const dbPolicy = await this.withTimeout(
        prisma.policy.findFirst({
          where: { userId: targetUserId },
          orderBy: { updatedAt: 'desc' },
        })
      );
      if (dbPolicy) {
        return {
          userId: dbPolicy.userId,
          maxTransactionAmountPaise: dbPolicy.maxTransactionAmountPaise,
          dailyLimitPaise: dbPolicy.dailyLimitPaise,
          allowedCurrencies: dbPolicy.allowedCurrencies,
          allowedMerchants: dbPolicy.allowedMerchants,
          blockedMerchants: dbPolicy.blockedMerchants,
          requireReviewAboveAmountPaise: dbPolicy.requireReviewAboveAmountPaise ?? undefined,
          maxVelocityPerMinute: dbPolicy.maxVelocityPerMinute,
          autoApproveWhitelistMerchants: dbPolicy.autoApproveWhitelistMerchants,
        };
      }
    } catch {
      // Fall back to runtime policy
    }
    return this.runtimePolicy;
  }

  public static async getAgentPermissions(agentId: string): Promise<string[]> {
    try {
      const perms = await this.withTimeout(
        prisma.agentPermission.findMany({
          where: { agentId },
        })
      );
      if (perms && perms.length > 0) {
        return perms.map((p) => p.permission);
      }
      // Check if agent exists in DB with role
      const agent = await this.withTimeout(
        prisma.agent.findUnique({
          where: { id: agentId },
        })
      );
      if (agent) {
        return agent.role === 'untrusted_guest' ? [] : ['payment:create', 'payment:read'];
      }
    } catch {
      // Fallback
    }

    // Dynamic heuristic fallback for testing/standalone
    if (agentId.includes('unauthorized') || agentId.includes('rogue') || agentId.includes('untrusted')) {
      return ['payment:read'];
    }
    return ['payment:create', 'payment:read'];
  }

  public static async processIntent(
    request: AgentIntentRequest,
    requestId: string
  ): Promise<DecisionTraceDTO> {
    const startTime = Date.now();
    const paymentIntentId = randomUUID();
    const idempotencyKey = request.idempotencyKey || `idemp_${paymentIntentId.substring(0, 8)}`;

    // 1. AI Intent Parsing (Untrusted Reasoning Layer)
    let structuredIntent: StructuredAgentIntent;
    try {
      structuredIntent = await AIIntentParserService.parseIntent(request.prompt);
    } catch (err) {
      await AuditService.recordEvent({
        eventType: 'INTENT_REJECTED',
        actor: request.userId,
        agentId: request.agentId,
        requestId,
        reason: (err as Error).message,
        metadata: { prompt: request.prompt },
      });
      throw err;
    }

    // 2. Ingest Initial Payment Intent
    const initialIntentDTO: PaymentIntentDTO = {
      id: paymentIntentId,
      userId: request.userId,
      agentId: request.agentId,
      state: 'PENDING',
      amountPaise: structuredIntent.amountPaise,
      currency: structuredIntent.currency,
      merchantName: structuredIntent.merchantName,
      merchantCategory: structuredIntent.merchantCategory,
      rawPrompt: request.prompt,
      idempotencyKey,
      authorizationToken: request.authorizationToken || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryIntents.set(paymentIntentId, initialIntentDTO);

    await AuditService.recordEvent({
      eventType: 'AGENT_INTENT_CREATED',
      actor: request.userId,
      agentId: request.agentId,
      paymentIntentId,
      requestId,
      metadata: { structuredIntent },
    });

    await AuditService.recordEvent({
      eventType: 'INTENT_VALIDATED',
      actor: 'SYSTEM',
      paymentIntentId,
      requestId,
      metadata: { schema: 'StructuredAgentIntentSchema', status: 'VALID' },
    });

    // 3. Deterministic Policy Evaluation with Agent Studio Integration
    const agentProfile = await AgentStudioService.getAgent(request.agentId);
    let agentPermissions = await this.getAgentPermissions(request.agentId);
    if (agentProfile && agentProfile.permissions && agentProfile.permissions.length > 0) {
      agentPermissions = agentProfile.permissions;
    }

    let activePolicy = await this.getActivePolicyForUser(request.userId);
    if (agentProfile) {
      activePolicy = {
        ...activePolicy,
        maxTransactionAmountPaise: agentProfile.singleTxnLimitPaise,
        dailyLimitPaise: agentProfile.dailyLimitPaise,
        allowedMerchants: agentProfile.allowedMerchants.length > 0 ? agentProfile.allowedMerchants : activePolicy.allowedMerchants,
        blockedMerchants: agentProfile.blockedMerchants.length > 0 ? agentProfile.blockedMerchants : activePolicy.blockedMerchants,
        requireReviewAboveAmountPaise:
          agentProfile.requireApprovalAbovePaise !== undefined && agentProfile.requireApprovalAbovePaise !== null
            ? agentProfile.requireApprovalAbovePaise
            : activePolicy.requireReviewAboveAmountPaise,
      };
    }

    // Token validation if token is presented
    let isTokenExpired = false;
    let isTokenSignatureValid = true;
    if (request.authorizationToken) {
      const tokenCheck = AgentStudioService.validateToken(request.authorizationToken, structuredIntent.amountPaise);
      if (!tokenCheck.isValid) {
        if (tokenCheck.reason?.includes('expired')) {
          isTokenExpired = true;
        } else {
          isTokenSignatureValid = false;
        }
      }
    }

    const policyDecision: PolicyDecisionResult = PolicyEngine.evaluate({
      intent: structuredIntent,
      policy: activePolicy,
      agentId: request.agentId,
      agentIsActive: agentProfile ? agentProfile.isActive : true,
      agentPermissions,
      idempotencyKey,
      authorizationToken: request.authorizationToken,
      isTokenExpired,
      isTokenSignatureValid,
    });

    await AuditService.recordEvent({
      eventType: 'POLICY_EVALUATED',
      actor: 'POLICY_ENGINE',
      paymentIntentId,
      requestId,
      decision: policyDecision.decision,
      reason: policyDecision.reason,
      metadata: { evaluatedRules: policyDecision.evaluatedRules },
    });

    // 4. Deterministic Risk Evaluation
    const riskAssessment: RiskAssessmentResult = RiskEngine.evaluate({
      intent: structuredIntent,
      userId: request.userId,
    });

    await AuditService.recordEvent({
      eventType: 'RISK_EVALUATED',
      actor: 'RISK_ENGINE',
      paymentIntentId,
      requestId,
      decision: riskAssessment.level,
      reason: riskAssessment.explanation,
      metadata: { score: riskAssessment.overallScore, signals: riskAssessment.signals },
    });

    // 5. Consolidated Decision Synthesis
    let finalDecision: PolicyDecisionOutcome = policyDecision.decision;
    if (finalDecision === 'ALLOW' && riskAssessment.level === 'HIGH') {
      finalDecision = 'BLOCK';
    } else if (finalDecision === 'ALLOW' && riskAssessment.level === 'REVIEW') {
      finalDecision = 'REVIEW';
    }

    let finalState: PaymentIntentState = 'PENDING';
    let executionResult: ExecutionResult | undefined = undefined;
    let verificationResult: VerificationResult | undefined = undefined;
    const gateway = this.getGateway();

    if (finalDecision === 'BLOCK') {
      finalState = 'BLOCKED';
      await AuditService.recordEvent({
        eventType: 'PAYMENT_BLOCKED',
        actor: 'DECISION_ENGINE',
        paymentIntentId,
        requestId,
        decision: 'BLOCK',
        reason: policyDecision.reason,
      });
    } else if (finalDecision === 'REVIEW') {
      finalState = 'REVIEW_REQUIRED';
      await AuditService.recordEvent({
        eventType: 'PAYMENT_REVIEW_REQUIRED',
        actor: 'DECISION_ENGINE',
        paymentIntentId,
        requestId,
        decision: 'REVIEW',
        reason: 'Flagged for human supervisor review before authorization',
      });
    } else {
      // Final Decision is ALLOW -> proceed to Authorization & Gateway Execution
      finalState = 'AUTHORIZED';
      await AuditService.recordEvent({
        eventType: 'PAYMENT_AUTHORIZED',
        actor: 'DECISION_ENGINE',
        paymentIntentId,
        requestId,
        decision: 'ALLOW',
        reason: 'Authorized for gateway dispatch',
      });

      // 6. Gateway Execution Subsystem
      finalState = 'EXECUTING';
      await AuditService.recordEvent({
        eventType: 'PAYMENT_EXECUTION_STARTED',
        actor: 'EXECUTION_GATEWAY',
        paymentIntentId,
        requestId,
      });

      try {
        const { result: execRes } = await IdempotencyManager.executeWithIdempotency(gateway, {
          paymentIntentId,
          amountPaise: structuredIntent.amountPaise,
          currency: structuredIntent.currency,
          merchantName: structuredIntent.merchantName,
          idempotencyKey,
          gateway: gateway.providerName,
        });

        executionResult = execRes;

        await AuditService.recordEvent({
          eventType: 'PAYMENT_EXECUTION_COMPLETED',
          actor: 'EXECUTION_GATEWAY',
          paymentIntentId,
          requestId,
          decision: execRes.status,
          metadata: { providerPaymentId: execRes.providerPaymentId },
        });

        // 7. Gateway Verification Subsystem
        const providerRef = execRes.providerPaymentId || execRes.providerOrderId;
        if (providerRef) {
          const { finalState: reconciledState, verification } =
            await VerificationEngine.verifyAndReconcile(gateway, {
              paymentIntentId,
              providerPaymentId: providerRef,
              providerOrderId: execRes.providerOrderId || undefined,
              expectedAmountPaise: structuredIntent.amountPaise,
              expectedCurrency: structuredIntent.currency,
            });

          finalState = reconciledState;
          verificationResult = verification;

          await AuditService.recordEvent({
            eventType: reconciledState === 'SUCCEEDED' ? 'PAYMENT_VERIFIED' : 'PAYMENT_FAILED',
            actor: 'VERIFICATION_ENGINE',
            paymentIntentId,
            requestId,
            decision: reconciledState,
            reason: verification.reconciliationNotes,
          });

          if (reconciledState === 'SUCCEEDED') {
            AgentStudioService.recordExpenditure(
              request.agentId,
              structuredIntent.amountPaise,
              request.authorizationToken
            );
          }
        } else {
          finalState = 'FAILED';
          await AuditService.recordEvent({
            eventType: 'PAYMENT_FAILED',
            actor: 'EXECUTION_GATEWAY',
            paymentIntentId,
            requestId,
            decision: 'FAILED',
            reason: execRes.errorMessage || 'No provider payment ID returned',
          });
        }
      } catch (err) {
        finalState = 'FAILED';
        await AuditService.recordEvent({
          eventType: 'PAYMENT_FAILED',
          actor: 'EXECUTION_GATEWAY',
          paymentIntentId,
          requestId,
          decision: 'FAILED',
          reason: (err as Error).message,
        });
      }
    }

    // 8. Build Full Decision Trace
    const updatedIntent: PaymentIntentDTO = {
      ...initialIntentDTO,
      state: finalState,
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryIntents.set(paymentIntentId, updatedIntent);

    // Persist full state graph to PostgreSQL if database is online
    try {
      await this.withTimeout(
        (async () => {
          await prisma.user.upsert({
            where: { id: request.userId },
            update: {},
            create: {
              id: request.userId,
              email: `${request.userId}@agentpay.internal`,
              name: `User ${request.userId}`,
              singleTxnLimitPaise: activePolicy.maxTransactionAmountPaise,
              dailyLimitPaise: activePolicy.dailyLimitPaise,
              allowedCurrencies: activePolicy.allowedCurrencies,
            },
          });

          await prisma.agent.upsert({
            where: { id: request.agentId },
            update: {},
            create: {
              id: request.agentId,
              name: request.agentId,
              description: `Autonomous agent ${request.agentId}`,
              role: 'autonomous_agent',
              isActive: true,
            },
          });

          await prisma.paymentIntent.create({
            data: {
              id: paymentIntentId,
              userId: request.userId,
              agentId: request.agentId,
              state: finalState,
              amountPaise: structuredIntent.amountPaise,
              currency: structuredIntent.currency,
              merchantName: structuredIntent.merchantName,
              merchantCategory: structuredIntent.merchantCategory,
              rawPrompt: request.prompt,
              idempotencyKey,
              authorizationToken: request.authorizationToken || null,
            },
          });

          await prisma.policyDecision.create({
            data: {
              paymentIntentId,
              decision: policyDecision.decision,
              reason: policyDecision.reason,
              evaluatedRules: policyDecision.evaluatedRules as unknown as object,
            },
          });

          await prisma.riskAssessment.create({
            data: {
              paymentIntentId,
              overallScore: riskAssessment.overallScore,
              level: riskAssessment.level,
              signals: riskAssessment.signals as unknown as object,
              explanation: riskAssessment.explanation,
            },
          });

          if (executionResult) {
            await prisma.transaction.create({
              data: {
                paymentIntentId,
                gateway: gateway.providerName,
                providerPaymentId: executionResult.providerPaymentId || null,
                providerOrderId: executionResult.providerOrderId || null,
                status: finalState,
                amountPaise: structuredIntent.amountPaise,
                currency: structuredIntent.currency,
                idempotencyKey,
                rawProviderResponse: (executionResult.rawProviderResponse as unknown as object) || {},
                errorMessage: executionResult.errorMessage || null,
              },
            });
          }
        })(),
        2500
      );
    } catch {
      // Degrades gracefully to in-memory trace map
    }

    const auditTrail = await AuditService.getEventsForIntent(paymentIntentId);

    const trace: DecisionTraceDTO = {
      paymentIntentId,
      rawPrompt: request.prompt,
      structuredIntent,
      paymentIntent: updatedIntent,
      policyDecision,
      riskAssessment,
      executionResult: executionResult || null,
      verificationResult: verificationResult || null,
      auditTrail,
      finalDecision,
      finalStatus: finalState,
      durationMs: Date.now() - startTime,
    };

    this.inMemoryTraces.set(paymentIntentId, trace);
    return trace;
  }

  public static getTrace(paymentIntentId: string): DecisionTraceDTO | undefined {
    return this.inMemoryTraces.get(paymentIntentId);
  }

  public static getAllTraces(): DecisionTraceDTO[] {
    return Array.from(this.inMemoryTraces.values()).reverse();
  }
}
