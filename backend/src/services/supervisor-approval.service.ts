import {
  PendingApprovalDTO,
  SupervisorActionRequest,
  SupervisorActionResult,
} from '../contracts/index.js';
import { IntentOrchestratorService } from './intent-orchestrator.service.js';
import { AuditService } from './audit.service.js';
import {
  IdempotencyManager,
  MockPaymentGateway,
  RazorpayPaymentGateway,
  VerificationEngine,
} from '../execution/index.js';
import { AgentStudioService } from './agent-studio.service.js';
import { env } from '../config/env.js';

export class SupervisorApprovalService {
  private static mockGateway = new MockPaymentGateway();
  private static razorpayGateway = new RazorpayPaymentGateway({
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
  });

  /**
   * Get all payment intents currently waiting for human supervisor approval
   */
  public static async getPendingApprovals(): Promise<PendingApprovalDTO[]> {
    const traces = IntentOrchestratorService.getAllTraces();
    const pendingTraces = traces.filter(
      (t) => t.paymentIntent.state === 'REVIEW_REQUIRED' || t.finalDecision === 'REVIEW'
    );

    const pendingList: PendingApprovalDTO[] = [];

    for (const trace of pendingTraces) {
      const intent = trace.paymentIntent;
      const agent = await AgentStudioService.getAgent(intent.agentId);

      const policyViolations =
        trace.policyDecision?.evaluatedRules
          .filter((r) => r.result === 'REVIEW' || r.result === 'FAIL')
          .map((r) => `${r.rule}: ${r.message}`) || [];

      pendingList.push({
        paymentIntentId: trace.paymentIntentId,
        agentId: intent.agentId,
        agentName: agent ? agent.name : intent.agentId,
        userId: intent.userId,
        amountPaise: intent.amountPaise,
        currency: intent.currency,
        merchantName: intent.merchantName,
        merchantCategory: intent.merchantCategory || undefined,
        rawPrompt: trace.rawPrompt,
        reviewReason: trace.policyDecision?.reason || trace.riskAssessment?.explanation || 'Supervisor review required',
        riskScore: trace.riskAssessment?.overallScore ?? 0,
        riskLevel: trace.riskAssessment?.level ?? 'REVIEW',
        policyViolations,
        idempotencyKey: intent.idempotencyKey,
        createdAt: intent.createdAt,
      });
    }

    return pendingList;
  }

  /**
   * Supervisor resolves a pending review (APPROVE or REJECT)
   */
  public static async resolveApproval(
    paymentIntentId: string,
    req: SupervisorActionRequest,
    requestId: string = 'req_supervisor_approval'
  ): Promise<SupervisorActionResult> {
    const trace = IntentOrchestratorService.getTrace(paymentIntentId);
    if (!trace) {
      throw new Error(`Payment intent '${paymentIntentId}' not found.`);
    }

    if (trace.paymentIntent.state !== 'REVIEW_REQUIRED' && trace.finalDecision !== 'REVIEW') {
      throw new Error(`Payment intent '${paymentIntentId}' is in state '${trace.paymentIntent.state}', not REVIEW_REQUIRED.`);
    }

    const now = new Date().toISOString();

    if (req.action === 'REJECT') {
      // 1. Record Audit Log
      await AuditService.recordEvent({
        eventType: 'SUPERVISOR_OVERRIDE_REJECTED',
        actor: req.supervisorId,
        paymentIntentId,
        agentId: trace.paymentIntent.agentId,
        requestId,
        decision: 'BLOCK',
        reason: req.reason || 'Rejected by supervisor',
        metadata: { supervisorId: req.supervisorId, notes: req.reason },
      });

      // 2. Update Trace & State
      trace.finalDecision = 'BLOCK';
      trace.finalStatus = 'BLOCKED';
      trace.paymentIntent.state = 'BLOCKED';
      trace.paymentIntent.updatedAt = now;

      return {
        paymentIntentId,
        decision: 'BLOCK',
        finalStatus: 'BLOCKED',
        message: req.reason || 'Transaction rejected by human supervisor.',
        executedAt: now,
      };
    }

    // --- Case: APPROVE ---
    // 1. Record Supervisor Approval Event
    await AuditService.recordEvent({
      eventType: 'SUPERVISOR_OVERRIDE_APPROVED',
      actor: req.supervisorId,
      paymentIntentId,
      agentId: trace.paymentIntent.agentId,
      requestId,
      decision: 'ALLOW',
      reason: req.reason || 'Supervisor authorized execution',
      metadata: { supervisorId: req.supervisorId, notes: req.reason },
    });

    await AuditService.recordEvent({
      eventType: 'PAYMENT_AUTHORIZED',
      actor: 'DECISION_ENGINE',
      paymentIntentId,
      requestId,
      decision: 'ALLOW',
      reason: 'Supervisor override granted full authorization',
    });

    // 2. Dispatch to Payment Gateway with Idempotency
    const gateway = this.razorpayGateway.isConfigured() ? this.razorpayGateway : this.mockGateway;

    await AuditService.recordEvent({
      eventType: 'PAYMENT_EXECUTION_STARTED',
      actor: 'EXECUTION_GATEWAY',
      paymentIntentId,
      requestId,
    });

    try {
      const { result: execRes } = await IdempotencyManager.executeWithIdempotency(gateway, {
        paymentIntentId,
        amountPaise: trace.paymentIntent.amountPaise,
        currency: trace.paymentIntent.currency,
        merchantName: trace.paymentIntent.merchantName,
        idempotencyKey: trace.paymentIntent.idempotencyKey,
        gateway: gateway.providerName,
      });

      trace.executionResult = execRes;

      await AuditService.recordEvent({
        eventType: 'PAYMENT_EXECUTION_COMPLETED',
        actor: 'EXECUTION_GATEWAY',
        paymentIntentId,
        requestId,
        decision: execRes.status,
        metadata: { providerPaymentId: execRes.providerPaymentId, providerOrderId: execRes.providerOrderId },
      });

      // 3. Verification & Reconciliation
      const providerRef = execRes.providerPaymentId || execRes.providerOrderId;
      if (providerRef) {
        const { finalState: reconciledState, verification } = await VerificationEngine.verifyAndReconcile(
          gateway,
          {
            paymentIntentId,
            providerPaymentId: providerRef,
            providerOrderId: execRes.providerOrderId || undefined,
            expectedAmountPaise: trace.paymentIntent.amountPaise,
            expectedCurrency: trace.paymentIntent.currency,
          }
        );

        trace.finalStatus = reconciledState;
        trace.finalDecision = 'ALLOW';
        trace.paymentIntent.state = reconciledState;
        trace.verificationResult = verification;

        await AuditService.recordEvent({
          eventType: reconciledState === 'SUCCEEDED' ? 'PAYMENT_VERIFIED' : 'PAYMENT_FAILED',
          actor: 'VERIFICATION_ENGINE',
          paymentIntentId,
          requestId,
          decision: reconciledState,
          reason: verification.reconciliationNotes,
        });

        // Record expenditure in Agent Studio
        AgentStudioService.recordExpenditure(trace.paymentIntent.agentId, trace.paymentIntent.amountPaise);

        return {
          paymentIntentId,
          decision: 'ALLOW',
          finalStatus: reconciledState,
          providerOrderId: execRes.providerOrderId || null,
          providerPaymentId: execRes.providerPaymentId || null,
          message: 'Supervisor approved. Payment successfully executed and verified on Razorpay.',
          executedAt: now,
        };
      } else {
        trace.finalStatus = 'FAILED';
        trace.paymentIntent.state = 'FAILED';
        return {
          paymentIntentId,
          decision: 'ALLOW',
          finalStatus: 'FAILED',
          message: 'Execution failed: No provider reference returned from gateway.',
          executedAt: now,
        };
      }
    } catch (err) {
      trace.finalStatus = 'FAILED';
      trace.paymentIntent.state = 'FAILED';

      await AuditService.recordEvent({
        eventType: 'PAYMENT_FAILED',
        actor: 'EXECUTION_GATEWAY',
        paymentIntentId,
        requestId,
        decision: 'FAILED',
        reason: (err as Error).message,
      });

      return {
        paymentIntentId,
        decision: 'ALLOW',
        finalStatus: 'FAILED',
        message: `Execution failed: ${(err as Error).message}`,
        executedAt: now,
      };
    }
  }
}
