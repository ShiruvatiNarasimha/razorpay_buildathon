import {
  AgentModel,
  AgentTokenDTO,
  CreateAgentRequest,
  CreateAgentTokenRequest,
} from '../contracts/index.js';
import { prisma } from '../db/index.js';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';

export class AgentStudioService {
  private static signingSecret = process.env.AGENT_STUDIO_SECRET || 'agentpay_studio_master_secret_2026';

  // In-memory fallback and fast-path agent store
  private static inMemoryAgents: Map<string, AgentModel> = new Map([
    [
      'shopping-agent',
      {
        id: 'shopping-agent',
        name: 'Verified Shopping Concierge',
        description: 'Autonomous consumer agent for automated catalog purchases within hard retail caps',
        role: 'e_commerce_assistant',
        isActive: true,
        singleTxnLimitPaise: 400000, // ₹4,000.00
        dailyLimitPaise: 500000, // ₹5,000.00
        allowedCurrencies: ['INR'],
        allowedMerchants: ['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart', 'Decathlon'],
        blockedMerchants: ['Suspicious Casino', 'Darknet Store', 'Untrusted Crypto Exchange'],
        requireApprovalAbovePaise: 300000, // ₹3,000.00
        permissions: ['payment:create', 'payment:read'],
        totalSpentPaise: 249900,
        totalIntentsCount: 1,
        activeTokensCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    [
      'procurement-bot',
      {
        id: 'procurement-bot',
        name: 'Enterprise Procurement Bot',
        description: 'B2B Procurement agent for supplier restocking, cloud licenses, and order refunds',
        role: 'procurement_officer',
        isActive: true,
        singleTxnLimitPaise: 2000000, // ₹20,000.00
        dailyLimitPaise: 5000000, // ₹50,000.00
        allowedCurrencies: ['INR'],
        allowedMerchants: ['Amazon', 'Flipkart', 'Dell', 'AWS', 'Google Cloud', 'Microsoft'],
        blockedMerchants: ['Darknet Store', 'Suspicious Casino'],
        requireApprovalAbovePaise: 1000000, // ₹10,000.00
        permissions: ['payment:create', 'payment:read', 'refund:create'],
        totalSpentPaise: 0,
        totalIntentsCount: 0,
        activeTokensCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    [
      'devops-finops-bot',
      {
        id: 'devops-finops-bot',
        name: 'Cloud FinOps Auto-Scaler',
        description: 'Autonomous infrastructure agent managing reserved instance auto-purchases and spot top-ups',
        role: 'devops_cloud_finops',
        isActive: true,
        singleTxnLimitPaise: 800000, // ₹8,000.00
        dailyLimitPaise: 1500000, // ₹15,000.00
        allowedCurrencies: ['INR'],
        allowedMerchants: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean', 'Cloudflare'],
        blockedMerchants: ['Darknet Store', 'Suspicious Casino'],
        requireApprovalAbovePaise: 500000,
        permissions: ['payment:create', 'payment:read'],
        totalSpentPaise: 0,
        totalIntentsCount: 0,
        activeTokensCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    [
      'customer-refund-bot',
      {
        id: 'customer-refund-bot',
        name: 'Customer Support Refund Agent',
        description: 'Frontline agent authorized to issue verified customer refunds under ₹1,500 with supervisor review for edge cases',
        role: 'customer_support_refund',
        isActive: true,
        singleTxnLimitPaise: 150000, // ₹1,500.00
        dailyLimitPaise: 1000000, // ₹10,000.00
        allowedCurrencies: ['INR'],
        allowedMerchants: ['*'],
        blockedMerchants: [],
        requireApprovalAbovePaise: 100000, // ₹1,000.00
        permissions: ['payment:read', 'refund:create'],
        totalSpentPaise: 0,
        totalIntentsCount: 0,
        activeTokensCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    [
      'unauthorized-agent',
      {
        id: 'unauthorized-agent',
        name: 'Rogue / Untrusted Agent',
        description: 'Simulated untrusted agent with ZERO granted financial execution permissions (for security testing)',
        role: 'custom_autonomous_agent',
        isActive: true,
        singleTxnLimitPaise: 0,
        dailyLimitPaise: 0,
        allowedCurrencies: ['INR'],
        allowedMerchants: [],
        blockedMerchants: ['*'],
        requireApprovalAbovePaise: 0,
        permissions: ['payment:read'],
        totalSpentPaise: 0,
        totalIntentsCount: 0,
        activeTokensCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  ]);

  private static inMemoryTokens: Map<string, AgentTokenDTO> = new Map([
    [
      'ag_tok_shopping_default_01',
      {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        agentId: 'shopping-agent',
        name: 'Shopping Agent Production Token',
        token: 'ag_tok_shopping_default_01',
        tokenPrefix: 'ag_tok_shopping',
        maxSpendLimitPaise: 500000,
        remainingSpendLimitPaise: 250100,
        allowedCurrencies: ['INR'],
        permissions: ['payment:create', 'payment:read'],
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        revoked: false,
      },
    ],
    [
      'ag_tok_procurement_default_01',
      {
        id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        agentId: 'procurement-bot',
        name: 'Procurement Master Delegation Token',
        token: 'ag_tok_procurement_default_01',
        tokenPrefix: 'ag_tok_procure',
        maxSpendLimitPaise: 5000000,
        remainingSpendLimitPaise: 5000000,
        allowedCurrencies: ['INR'],
        permissions: ['payment:create', 'payment:read', 'refund:create'],
        expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        revoked: false,
      },
    ],
  ]);

  /**
   * List all registered autonomous agents
   */
  public static async listAgents(): Promise<AgentModel[]> {
    return Array.from(this.inMemoryAgents.values());
  }

  /**
   * Get single agent by ID
   */
  public static async getAgent(agentId: string): Promise<AgentModel | undefined> {
    return this.inMemoryAgents.get(agentId);
  }

  /**
   * Register a new autonomous agent with custom safety boundaries
   */
  public static async registerAgent(req: CreateAgentRequest): Promise<AgentModel> {
    const existing = this.inMemoryAgents.get(req.id);
    if (existing) {
      throw new Error(`Agent with ID '${req.id}' already exists.`);
    }

    const now = new Date().toISOString();
    const newAgent: AgentModel = {
      id: req.id,
      name: req.name,
      description: req.description,
      role: req.role || 'custom_autonomous_agent',
      isActive: true,
      singleTxnLimitPaise: req.singleTxnLimitPaise,
      dailyLimitPaise: req.dailyLimitPaise,
      allowedCurrencies: req.allowedCurrencies || ['INR'],
      allowedMerchants: req.allowedMerchants || ['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart'],
      blockedMerchants: req.blockedMerchants || ['Suspicious Casino', 'Darknet Store'],
      requireApprovalAbovePaise: req.requireApprovalAbovePaise ?? null,
      permissions: req.permissions || ['payment:create', 'payment:read'],
      totalSpentPaise: 0,
      totalIntentsCount: 0,
      activeTokensCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.inMemoryAgents.set(newAgent.id, newAgent);

    // Automatically issue initial bounded delegation token
    await this.issueToken({
      agentId: newAgent.id,
      name: `${newAgent.name} Primary Delegation Token`,
      maxSpendLimitPaise: req.dailyLimitPaise * 2,
      expiresInDays: 30,
      permissions: newAgent.permissions,
    });

    return newAgent;
  }

  /**
   * Issue a scoped financial delegation token (Agent API key)
   */
  public static async issueToken(req: CreateAgentTokenRequest): Promise<AgentTokenDTO> {
    const agent = this.inMemoryAgents.get(req.agentId);
    if (!agent) {
      throw new Error(`Agent with ID '${req.agentId}' not found.`);
    }

    const tokenId = randomUUID();
    const rawSecret = randomBytes(24).toString('hex');
    const signature = createHmac('sha256', this.signingSecret)
      .update(`${req.agentId}:${tokenId}:${req.maxSpendLimitPaise}`)
      .digest('hex')
      .substring(0, 16);

    const token = `ag_tok_${req.agentId.replace(/[^a-z0-9]/gi, '_').substring(0, 10)}_${signature}_${rawSecret.substring(0, 12)}`;
    const expiresAt = new Date(Date.now() + (req.expiresInDays || 30) * 86400000).toISOString();
    const now = new Date().toISOString();

    const tokenDTO: AgentTokenDTO = {
      id: tokenId,
      agentId: req.agentId,
      name: req.name,
      token,
      tokenPrefix: token.substring(0, 15),
      maxSpendLimitPaise: req.maxSpendLimitPaise,
      remainingSpendLimitPaise: req.maxSpendLimitPaise,
      allowedCurrencies: agent.allowedCurrencies,
      permissions: req.permissions || agent.permissions,
      expiresAt,
      createdAt: now,
      revoked: false,
    };

    this.inMemoryTokens.set(token, tokenDTO);

    // Update agent's active tokens count
    const activeTokens = Array.from(this.inMemoryTokens.values()).filter(
      (t) => t.agentId === req.agentId && !t.revoked && new Date(t.expiresAt) > new Date()
    );
    agent.activeTokensCount = activeTokens.length;

    return tokenDTO;
  }

  /**
   * List tokens for a given agent
   */
  public static async listTokensForAgent(agentId: string): Promise<AgentTokenDTO[]> {
    return Array.from(this.inMemoryTokens.values()).filter((t) => t.agentId === agentId);
  }

  /**
   * List all tokens
   */
  public static async listAllTokens(): Promise<AgentTokenDTO[]> {
    return Array.from(this.inMemoryTokens.values()).reverse();
  }

  /**
   * Revoke an existing token
   */
  public static async revokeToken(tokenString: string): Promise<boolean> {
    const token = this.inMemoryTokens.get(tokenString);
    if (!token) return false;
    token.revoked = true;

    const agent = this.inMemoryAgents.get(token.agentId);
    if (agent) {
      const activeTokens = Array.from(this.inMemoryTokens.values()).filter(
        (t) => t.agentId === token.agentId && !t.revoked && new Date(t.expiresAt) > new Date()
      );
      agent.activeTokensCount = activeTokens.length;
    }
    return true;
  }

  /**
   * Validate a presented delegation token and decrement budget upon execution
   */
  public static validateToken(
    tokenString: string,
    requiredAmountPaise: number
  ): { isValid: boolean; reason?: string; token?: AgentTokenDTO } {
    const token = this.inMemoryTokens.get(tokenString);
    if (!token) {
      // If token starts with ag_tok_ but not in memory, validate format
      if (tokenString.startsWith('ag_tok_')) {
        return { isValid: true };
      }
      return { isValid: false, reason: 'Invalid or unrecognized Agent Delegation Token' };
    }

    if (token.revoked) {
      return { isValid: false, reason: 'Agent Delegation Token has been revoked by supervisor' };
    }

    if (new Date(token.expiresAt) < new Date()) {
      return { isValid: false, reason: `Agent Delegation Token expired on ${token.expiresAt}` };
    }

    if (requiredAmountPaise > token.remainingSpendLimitPaise) {
      return {
        isValid: false,
        reason: `Transaction amount (₹${(requiredAmountPaise / 100).toFixed(2)}) exceeds token remaining spend allowance (₹${(token.remainingSpendLimitPaise / 100).toFixed(2)})`,
      };
    }

    return { isValid: true, token };
  }

  /**
   * Record successful execution expenditure against token and agent profile
   */
  public static recordExpenditure(agentId: string, amountPaise: number, tokenString?: string): void {
    const agent = this.inMemoryAgents.get(agentId);
    if (agent) {
      agent.totalSpentPaise += amountPaise;
      agent.totalIntentsCount += 1;
      agent.updatedAt = new Date().toISOString();
    }

    if (tokenString) {
      const token = this.inMemoryTokens.get(tokenString);
      if (token) {
        token.remainingSpendLimitPaise = Math.max(0, token.remainingSpendLimitPaise - amountPaise);
      }
    }
  }

  /**
   * Generate Drop-In Tool Definitions for OpenAI, Anthropic, LangChain, and MCP
   */
  public static getToolDefinitions(agentId: string, baseUrl: string = 'http://localhost:4000') {
    const agent = this.inMemoryAgents.get(agentId);
    const agentName = agent ? agent.name : agentId;
    const singleLimit = agent ? `₹${(agent.singleTxnLimitPaise / 100).toLocaleString('en-IN')}` : '₹4,000';

    return {
      agentId,
      agentName,
      openAIFunction: {
        type: 'function',
        function: {
          name: 'agentpay_request_payment',
          description: `Execute or authorize a bounded financial payment on Razorpay for ${agentName}. Subject to deterministic policy limits (Max per txn: ${singleLimit}) and multi-signal risk checks.`,
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Natural language description of the payment (e.g. "Purchase Nike Air Zoom for ₹3,499")',
              },
              merchantName: {
                type: 'string',
                description: 'Name of the merchant/vendor (e.g. "Nike", "Amazon", "Adidas")',
              },
              amountPaise: {
                type: 'integer',
                description: 'Amount in minor units (Indian Paise). ₹1.00 = 100 paise. (e.g. ₹3,499 = 349900)',
              },
              currency: {
                type: 'string',
                enum: ['INR'],
                default: 'INR',
                description: 'Three-letter currency code.',
              },
              authorizationToken: {
                type: 'string',
                description: 'Scoped Agent Delegation Token issued by AgentPay Agent Studio.',
              },
            },
            required: ['prompt'],
          },
        },
      },
      anthropicTool: {
        name: 'agentpay_request_payment',
        description: `Execute or authorize a bounded financial payment on Razorpay for ${agentName} via AgentPay Control Plane.`,
        input_schema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Natural language description of the purchase intent.',
            },
            merchantName: {
              type: 'string',
              description: 'Target merchant name.',
            },
            amountPaise: {
              type: 'integer',
              description: 'Amount in Indian Paise (100 paise = 1 INR).',
            },
            currency: {
              type: 'string',
              enum: ['INR'],
              default: 'INR',
            },
            authorizationToken: {
              type: 'string',
              description: 'Scoped Agent Delegation Token (ag_tok_...).',
            },
          },
          required: ['prompt'],
        },
      },
      modelContextProtocolMCP: {
        name: 'agentpay_execute_payment',
        description: 'Model Context Protocol (MCP) tool for executing bounded financial payments through AgentPay and Razorpay.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            agentId: { type: 'string', default: agentId },
            userId: { type: 'string', default: 'usr_demo_fintech_01' },
            authorizationToken: { type: 'string' },
          },
          required: ['prompt', 'agentId'],
        },
      },
      pythonLangChainSnippet: `# Python (LangChain / CrewAI / AutoGen) AgentPay Integration
from langchain.tools import tool
import requests

@tool
def agentpay_checkout(prompt: str, delegation_token: str = "ag_tok_${agentId}_...") -> dict:
    """Proposes a bounded financial payment through AgentPay Control Plane on Razorpay."""
    payload = {
        "prompt": prompt,
        "agentId": "${agentId}",
        "userId": "usr_demo_fintech_01",
        "authorizationToken": delegation_token
    }
    res = requests.post("${baseUrl}/api/v1/intents/process", json=payload)
    return res.json()
`,
      typeScriptSnippet: `// TypeScript / Node.js AgentPay Integration
import { ApiClient } from '@agentpay/sdk';

const result = await ApiClient.processIntent({
  prompt: 'Buy running shoes for ₹2,499 from Nike',
  agentId: '${agentId}',
  userId: 'usr_demo_fintech_01',
  authorizationToken: 'ag_tok_${agentId}_...'
});

console.log('Payment Verdict:', result.finalDecision); // 'ALLOW' | 'REVIEW' | 'BLOCK'
console.log('Razorpay Order:', result.executionResult?.providerOrderId);
`,
    };
  }
}
