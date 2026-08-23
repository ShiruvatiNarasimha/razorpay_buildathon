import { describe, it, expect } from 'vitest';
import { StructuredAgentIntentSchema, AgentIntentRequestSchema } from '../src/contracts/intent.js';

describe('Contracts Schema Validation', () => {
  it('validates a valid StructuredAgentIntent', () => {
    const valid = {
      action: 'purchase',
      category: 'running_shoes',
      amountPaise: 399900,
      currency: 'INR',
      merchantName: 'Nike',
    };

    const parsed = StructuredAgentIntentSchema.parse(valid);
    expect(parsed.amountPaise).toBe(399900);
    expect(parsed.currency).toBe('INR');
  });

  it('rejects invalid or negative monetary values', () => {
    const invalid = {
      action: 'purchase',
      category: 'running_shoes',
      amountPaise: -500, // Invalid negative paise
      currency: 'INR',
      merchantName: 'Nike',
    };

    expect(() => StructuredAgentIntentSchema.parse(invalid)).toThrow();
  });

  it('validates AgentIntentRequest with default metadata', () => {
    const req = {
      prompt: 'Buy shoes for ₹2,499',
      agentId: 'shopping-agent',
      userId: 'usr_001',
    };

    const parsed = AgentIntentRequestSchema.parse(req);
    expect(parsed.prompt).toBe('Buy shoes for ₹2,499');
    expect(parsed.metadata).toEqual({});
  });
});
