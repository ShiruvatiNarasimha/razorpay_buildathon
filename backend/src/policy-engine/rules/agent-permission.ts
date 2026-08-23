import { PolicyRuleResult, StructuredAgentIntent } from '../../contracts/index.js';

export interface AgentPermissionContext {
  intent: StructuredAgentIntent;
  agentId: string;
  agentIsActive: boolean;
  agentPermissions: string[];
}

export function evaluateAgentPermission(ctx: AgentPermissionContext): PolicyRuleResult {
  const { intent, agentId, agentIsActive, agentPermissions } = ctx;

  if (!agentIsActive) {
    return {
      rule: 'AGENT_PERMISSION',
      result: 'FAIL',
      reasonCode: 'AGENT_DEACTIVATED',
      message: `Agent '${agentId}' is deactivated or disabled`,
      metadata: { agentId, agentIsActive },
    };
  }

  // Map requested action to required permission
  let requiredPermission = 'payment:create';
  if (intent.action === 'refund') {
    requiredPermission = 'refund:create';
  } else if (intent.action === 'payout') {
    requiredPermission = 'payout:create';
  } else if (intent.action === 'query') {
    requiredPermission = 'payment:read';
  }

  const hasPermission = agentPermissions.includes(requiredPermission);

  if (!hasPermission) {
    return {
      rule: 'AGENT_PERMISSION',
      result: 'FAIL',
      reasonCode: 'AGENT_PERMISSION_DENIED',
      message: `Agent '${agentId}' lacks required permission '${requiredPermission}' to execute '${intent.action}'`,
      metadata: {
        agentId,
        requiredPermission,
        heldPermissions: agentPermissions,
      },
    };
  }

  return {
    rule: 'AGENT_PERMISSION',
    result: 'PASS',
    reasonCode: 'AGENT_PERMISSION_GRANTED',
    message: `Agent '${agentId}' possesses verified permission '${requiredPermission}'`,
    metadata: {
      agentId,
      permission: requiredPermission,
    },
  };
}
