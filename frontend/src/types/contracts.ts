export type AgentAction = 'purchase' | 'refund' | 'payout' | 'query';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type PaymentIntentState =
  | 'PENDING'
  | 'POLICY_CHECK'
  | 'RISK_CHECK'
  | 'REVIEW_REQUIRED'
  | 'AUTHORIZED'
  | 'EXECUTING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'BLOCKED';

export interface AgentIntentRequest {
  prompt: string;
  agentId: string;
  userId: string;
  authorizationToken?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface StructuredAgentIntent {
  action: AgentAction;
  category: string;
  amountPaise: number;
  currency: CurrencyCode;
  merchantName: string;
  merchantCategory?: string;
  intentDetails?: string;
  rawPrompt?: string;
  confidence?: number;
}

export interface PaymentIntentDTO {
  id: string;
  userId: string;
  agentId: string;
  state: PaymentIntentState;
  amountPaise: number;
  currency: CurrencyCode;
  merchantName: string;
  merchantCategory?: string | null;
  rawPrompt: string;
  idempotencyKey: string;
  authorizationToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PolicyDecisionOutcome = 'ALLOW' | 'REVIEW' | 'BLOCK';

export interface PolicyRuleResult {
  rule: string;
  result: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  message: string;
  reasonCode?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyDecisionResult {
  decision: PolicyDecisionOutcome;
  evaluatedRules: PolicyRuleResult[];
  reason: string;
  requiredApprovals?: string[];
  evaluatedAt?: string;
  timestamp?: string;
}

export interface PolicyConfig {
  userId: string;
  maxTransactionAmountPaise: number;
  dailyLimitPaise: number;
  allowedCurrencies: string[];
  allowedMerchants: string[];
  blockedMerchants: string[];
  requireReviewAboveAmountPaise?: number;
  maxVelocityPerMinute?: number;
  autoApproveWhitelistMerchants?: boolean;
}

export interface RiskSignal {
  code: string;
  name?: string;
  scoreContribution: number;
  triggered: boolean;
  description?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RiskAssessmentResult {
  level: 'LOW' | 'REVIEW' | 'HIGH';
  overallScore: number;
  signals: RiskSignal[];
  explanation: string;
  assessedAt?: string;
  timestamp?: string;
}

export interface ExecutionResult {
  executionId: string;
  paymentIntentId: string;
  gateway: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  status: 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';
  amountPaise: number;
  currency: string;
  rawProviderResponse?: Record<string, unknown>;
  errorMessage?: string;
  idempotencyKey: string;
  executedAt: string;
}

export interface VerificationResult {
  status:
    | 'VERIFIED'
    | 'AMOUNT_MISMATCH'
    | 'CURRENCY_MISMATCH'
    | 'SIGNATURE_INVALID'
    | 'PROVIDER_FAILED'
    | 'UNVERIFIED';
  isVerified: boolean;
  providerPaymentId: string;
  providerStatus: string;
  amountMatched: boolean;
  currencyMatched: boolean;
  signatureValid: boolean;
  reconciliationNotes: string;
  verifiedAt: string;
}

export type AuditEventType =
  | 'AGENT_INTENT_CREATED'
  | 'INTENT_VALIDATED'
  | 'INTENT_VALIDATION_FAILED'
  | 'POLICY_EVALUATED'
  | 'RISK_EVALUATED'
  | 'PAYMENT_REVIEW_REQUIRED'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_BLOCKED'
  | 'PAYMENT_EXECUTION_STARTED'
  | 'PAYMENT_EXECUTION_COMPLETED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_FAILED'
  | 'POLICY_UPDATED'
  | 'SECURITY_ALERT';

export interface AuditEventDTO {
  id: string;
  eventType: AuditEventType;
  actor: string;
  paymentIntentId?: string | null;
  requestId: string;
  agentId?: string | null;
  decision?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  checksum?: string;
  timestamp: string;
}

export interface DecisionTraceDTO {
  paymentIntentId: string;
  requestId: string;
  rawPrompt: string;
  structuredIntent: StructuredAgentIntent;
  policyDecision?: PolicyDecisionResult;
  riskAssessment?: RiskAssessmentResult;
  finalDecision: PolicyDecisionOutcome;
  finalStatus: PaymentIntentState;
  executionResult?: ExecutionResult;
  verificationResult?: VerificationResult;
  auditTrail: AuditEventDTO[];
  durationMs?: number;
  paymentIntent: PaymentIntentDTO;
}

export interface AttackScenarioResult {
  id?: string;
  scenarioType: string;
  name: string;
  description: string;
  inputPrompt: string;
  expectedDecision: PolicyDecisionOutcome;
  actualDecision: PolicyDecisionOutcome;
  passed: boolean;
  reasonCode: string;
  durationMs?: number;
  details?: string;
  timestamp?: string;
}

export interface EvaluationMetrics {
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
}

export interface ShipGateCriteria {
  maxAllowedFalseNegatives: number;
  minAccuracyPercentage: number;
  minAttackBlockRatePercentage: number;
}

export interface AgentModel {
  id: string;
  name: string;
  description: string;
  role: string;
  isActive: boolean;
  singleTxnLimitPaise: number;
  dailyLimitPaise: number;
  allowedCurrencies: CurrencyCode[];
  allowedMerchants: string[];
  blockedMerchants: string[];
  requireApprovalAbovePaise: number | null;
  permissions: string[];
  totalSpentPaise: number;
  totalIntentsCount: number;
  activeTokensCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRequest {
  id: string;
  name: string;
  description: string;
  role?: string;
  singleTxnLimitPaise: number;
  dailyLimitPaise: number;
  allowedCurrencies?: CurrencyCode[];
  allowedMerchants?: string[];
  blockedMerchants?: string[];
  requireApprovalAbovePaise?: number | null;
  permissions?: string[];
}

export interface AgentTokenDTO {
  id: string;
  agentId: string;
  name: string;
  token: string;
  tokenPrefix: string;
  maxSpendLimitPaise: number;
  remainingSpendLimitPaise: number;
  allowedCurrencies: CurrencyCode[];
  permissions: string[];
  expiresAt: string;
  createdAt: string;
  revoked: boolean;
}

export interface CreateAgentTokenRequest {
  agentId: string;
  name: string;
  maxSpendLimitPaise: number;
  expiresInDays: number;
  permissions?: string[];
}

export interface PendingApprovalDTO {
  paymentIntentId: string;
  agentId: string;
  agentName: string;
  userId: string;
  amountPaise: number;
  currency: CurrencyCode;
  merchantName: string;
  merchantCategory?: string;
  rawPrompt: string;
  reviewReason: string;
  riskScore: number;
  riskLevel: 'LOW' | 'REVIEW' | 'HIGH';
  policyViolations: string[];
  idempotencyKey: string;
  createdAt: string;
}

export interface SupervisorActionRequest {
  supervisorId?: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface SupervisorActionResult {
  paymentIntentId: string;
  decision: 'ALLOW' | 'BLOCK';
  finalStatus: string;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  message: string;
  executedAt: string;
}

export interface AgentToolDefinitionsResponse {
  agentId: string;
  agentName: string;
  openAIFunction: Record<string, unknown>;
  anthropicTool: Record<string, unknown>;
  modelContextProtocolMCP: Record<string, unknown>;
  pythonLangChainSnippet: string;
  typeScriptSnippet: string;
}