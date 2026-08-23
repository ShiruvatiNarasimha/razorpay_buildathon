import { z } from 'zod';
import { CurrencyCodeSchema } from './intent.js';

export const AgentRoleSchema = z.enum([
  'e_commerce_assistant',
  'procurement_officer',
  'devops_cloud_finops',
  'customer_support_refund',
  'travel_concierge',
  'custom_autonomous_agent',
]);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AgentPermissionSchema = z.enum([
  'payment:create',
  'payment:read',
  'refund:create',
  'subscription:manage',
  'payout:create',
]);
export type AgentPermission = z.infer<typeof AgentPermissionSchema>;

/**
 * Full Agent Profile with embedded financial boundaries and telemetry
 */
export const AgentModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  role: z.string(),
  isActive: z.boolean().default(true),
  singleTxnLimitPaise: z.number().int().nonnegative().default(400000), // Default ₹4,000.00
  dailyLimitPaise: z.number().int().nonnegative().default(500000), // Default ₹5,000.00
  allowedCurrencies: z.array(CurrencyCodeSchema).default(['INR']),
  allowedMerchants: z.array(z.string()).default(['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart', 'Decathlon']),
  blockedMerchants: z.array(z.string()).default(['Suspicious Casino', 'Darknet Store', 'Untrusted Crypto Exchange']),
  requireApprovalAbovePaise: z.number().int().nonnegative().nullable().default(300000), // ₹3,000.00
  permissions: z.array(z.string()).default(['payment:create', 'payment:read']),
  totalSpentPaise: z.number().int().nonnegative().default(0),
  totalIntentsCount: z.number().int().nonnegative().default(0),
  activeTokensCount: z.number().int().nonnegative().default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AgentModel = z.infer<typeof AgentModelSchema>;

export const CreateAgentRequestSchema = z.object({
  id: z.string().min(2).max(50).regex(/^[a-z0-9-_]+$/, 'Agent ID must contain only lowercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  role: z.string().default('custom_autonomous_agent'),
  singleTxnLimitPaise: z.number().int().positive().default(400000),
  dailyLimitPaise: z.number().int().positive().default(500000),
  allowedCurrencies: z.array(CurrencyCodeSchema).default(['INR']),
  allowedMerchants: z.array(z.string()).default(['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart', 'Decathlon']),
  blockedMerchants: z.array(z.string()).default(['Suspicious Casino', 'Darknet Store', 'Untrusted Crypto Exchange']),
  requireApprovalAbovePaise: z.number().int().positive().optional().nullable().default(300000),
  permissions: z.array(z.string()).default(['payment:create', 'payment:read']),
});
export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;

export const AgentTokenDTOSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string(),
  name: z.string(),
  token: z.string(),
  tokenPrefix: z.string(),
  maxSpendLimitPaise: z.number().int().positive(),
  remainingSpendLimitPaise: z.number().int().nonnegative(),
  allowedCurrencies: z.array(CurrencyCodeSchema).default(['INR']),
  permissions: z.array(z.string()),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  revoked: z.boolean().default(false),
});
export type AgentTokenDTO = z.infer<typeof AgentTokenDTOSchema>;

export const CreateAgentTokenRequestSchema = z.object({
  agentId: z.string().min(1),
  name: z.string().min(1).max(100).default('Default Production Delegation Token'),
  maxSpendLimitPaise: z.number().int().positive().default(1000000), // Default ₹10,000.00
  expiresInDays: z.number().int().min(1).max(365).default(30),
  permissions: z.array(z.string()).default(['payment:create', 'payment:read']),
});
export type CreateAgentTokenRequest = z.infer<typeof CreateAgentTokenRequestSchema>;
