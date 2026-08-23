import {
  AgentIntentRequest,
  DecisionTraceDTO,
  PolicyConfig,
  AuditEventDTO,
  AttackScenarioResult,
  AgentModel,
  CreateAgentRequest,
  AgentTokenDTO,
  CreateAgentTokenRequest,
  PendingApprovalDTO,
  SupervisorActionRequest,
  SupervisorActionResult,
  AgentToolDefinitionsResponse,
} from '@/types/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface DashboardMetricsResponse {
  summary: {
    totalIntents: number;
    allowedCount: number;
    blockedCount: number;
    reviewCount: number;
    succeededCount: number;
    failedCount: number;
    totalVolumePaise: number;
    totalVolumeFormatted: string;
  };
  rates: {
    allowRatePercentage: number;
    blockRatePercentage: number;
    reviewRatePercentage: number;
  };
  riskDistribution: {
    low: number;
    review: number;
    high: number;
  };
  activePolicy: PolicyConfig;
  recentTraces: DecisionTraceDTO[];
}

export interface AttackLabResponse {
  totalScenarios: number;
  passedScenarios: number;
  allDefended: boolean;
  results: AttackScenarioResult[];
}

export interface EvaluationBenchmarkResponse {
  metrics: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
    accuracyPercentage: number;
    blockRatePercentage: number;
    allowRatePercentage: number;
    reviewRatePercentage: number;
    confusionMatrix: {
      truePositives: number;
      trueNegatives: number;
      falsePositives: number;
      falseNegatives: number;
    };
    zeroFalseNegativeGuarantee: boolean;
    shipGatePassed: boolean;
    durationMs: number;
    executedAt: string;
  };
  shipGate: {
    passed: boolean;
    status: 'SHIP: GO' | 'SHIP: NO-GO';
    failures: string[];
    assertions: {
      name: string;
      passed: boolean;
      expected: string;
      actual: string;
    }[];
  };
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

export class ApiClient {
  public static async checkHealth(): Promise<{ status: string; service: string; version: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return res.json();
  }

  public static async checkReadiness(): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/ready`);
    if (!res.ok) throw new Error(`Readiness check failed (${res.status})`);
    return res.json();
  }

  public static async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    const res = await fetch(`${API_BASE}/api/v1/dashboard/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch dashboard metrics (${res.status})`);
    return res.json();
  }

  public static async processIntent(req: AgentIntentRequest): Promise<DecisionTraceDTO> {
    const res = await fetch(`${API_BASE}/api/v1/intents/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Intent processing failed (${res.status})`);
    }
    return res.json();
  }

  public static async getTrace(id: string): Promise<DecisionTraceDTO> {
    const res = await fetch(`${API_BASE}/api/v1/intents/${id}/trace`);
    if (!res.ok) throw new Error(`Failed to fetch trace for ${id}`);
    return res.json();
  }

  public static async getPolicies(): Promise<{ policy: PolicyConfig }> {
    const res = await fetch(`${API_BASE}/api/v1/policies`);
    if (!res.ok) throw new Error(`Failed to fetch policy (${res.status})`);
    return res.json();
  }

  public static async updatePolicies(policy: PolicyConfig): Promise<{ message: string; policy: PolicyConfig }> {
    const res = await fetch(`${API_BASE}/api/v1/policies`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    if (!res.ok) throw new Error(`Failed to update policy (${res.status})`);
    return res.json();
  }

  public static async getAuditEvents(limit: number = 100): Promise<{ total: number; events: AuditEventDTO[] }> {
    const res = await fetch(`${API_BASE}/api/v1/audit-events?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch audit events (${res.status})`);
    return res.json();
  }

  public static async runAllAttacks(): Promise<AttackLabResponse> {
    const res = await fetch(`${API_BASE}/api/v1/attack-lab/run-all`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to run attack scenarios (${res.status})`);
    return res.json();
  }

  public static async runSingleAttack(scenarioType: string): Promise<AttackScenarioResult> {
    const res = await fetch(`${API_BASE}/api/v1/attack-lab/run/${scenarioType}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to run attack scenario ${scenarioType} (${res.status})`);
    return res.json();
  }

  public static async runEvaluationBenchmark(): Promise<EvaluationBenchmarkResponse> {
    const res = await fetch(`${API_BASE}/api/v1/evaluation/run`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to run evaluation benchmark (${res.status})`);
    return res.json();
  }

  // ── Agent Studio & Delegation Tokens ────────────────────────────────────
  public static async getAgents(): Promise<{ total: number; agents: AgentModel[] }> {
    const res = await fetch(`${API_BASE}/api/v1/agents`);
    if (!res.ok) throw new Error(`Failed to fetch agents (${res.status})`);
    return res.json();
  }

  public static async createAgent(req: CreateAgentRequest): Promise<AgentModel> {
    const res = await fetch(`${API_BASE}/api/v1/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Failed to create agent (${res.status})`);
    }
    return res.json();
  }

  public static async getAgentTokens(agentId: string): Promise<{ agentId: string; total: number; tokens: AgentTokenDTO[] }> {
    const res = await fetch(`${API_BASE}/api/v1/agents/${agentId}/tokens`);
    if (!res.ok) throw new Error(`Failed to fetch tokens for agent (${res.status})`);
    return res.json();
  }

  public static async issueAgentToken(agentId: string, req: CreateAgentTokenRequest): Promise<AgentTokenDTO> {
    const res = await fetch(`${API_BASE}/api/v1/agents/${agentId}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Failed to issue token (${res.status})`);
    }
    return res.json();
  }

  public static async revokeAgentToken(token: string): Promise<{ message: string; revoked: boolean }> {
    const res = await fetch(`${API_BASE}/api/v1/agents/tokens/${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to revoke token (${res.status})`);
    return res.json();
  }

  public static async getAgentToolDefinitions(agentId: string): Promise<AgentToolDefinitionsResponse> {
    const res = await fetch(`${API_BASE}/api/v1/agents/${agentId}/tool-definition`);
    if (!res.ok) throw new Error(`Failed to fetch tool definitions for agent (${res.status})`);
    return res.json();
  }

  // ── Supervisor Approvals (Human-In-The-Loop) ─────────────────────────────
  public static async getPendingApprovals(): Promise<{ total: number; pending: PendingApprovalDTO[] }> {
    const res = await fetch(`${API_BASE}/api/v1/approvals/pending`);
    if (!res.ok) throw new Error(`Failed to fetch pending approvals (${res.status})`);
    return res.json();
  }

  public static async resolveApproval(intentId: string, req: SupervisorActionRequest): Promise<SupervisorActionResult> {
    const res = await fetch(`${API_BASE}/api/v1/approvals/${intentId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Failed to resolve approval (${res.status})`);
    }
    return res.json();
  }
}
