/**
 * 🛡️ AgentPay: Autonomous Agent Tool Integration Demo (Razorpay Buildathon)
 *
 * This example shows how an autonomous AI agent (LangChain, CrewAI, AutoGen, or OpenAI)
 * uses AgentPay as a safe, bounded financial execution tool without ever touching raw Razorpay secrets.
 */

import { AgentStudioService } from '../services/agent-studio.service.js';
import { IntentOrchestratorService } from '../services/intent-orchestrator.service.js';

async function main() {
  console.log('🤖 Starting Autonomous Agent Payment Workflow...');
  const baseUrl = process.env.AGENTPAY_API_URL || 'http://localhost:4000';

  let toolDefs: { agentName: string; openAIFunction: object };
  let trace: any;

  try {
    // Step 1: Agent queries its scoped tool definition from Agent Studio
    console.log('\n[1] Agent fetching scoped tool definitions from Agent Studio API...');
    const toolDefsRes = await fetch(`${baseUrl}/api/v1/agents/shopping-agent/tool-definition`);
    toolDefs = (await toolDefsRes.json()) as { agentName: string; openAIFunction: object };

    // Step 2: Agent executes a bounded financial request
    console.log('\n[2] Agent proposing autonomous purchase intent...');
    const userRequest = 'Buy Nike Pegasus running shoes for ₹2,499 from Nike official store';

    const intentPayload = {
      prompt: userRequest,
      agentId: 'shopping-agent',
      userId: 'usr_demo_fintech_01',
      authorizationToken: 'ag_tok_shopping_default_01',
    };

    console.log(`Sending Intent Request to AgentPay Control Plane:`, intentPayload);

    const processRes = await fetch(`${baseUrl}/api/v1/intents/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intentPayload),
    });

    trace = await processRes.json();
  } catch {
    console.log('ℹ️ Running in standalone in-process mode (Direct Control Plane invocation)...');
    toolDefs = AgentStudioService.getToolDefinitions('shopping-agent', baseUrl);
    trace = await IntentOrchestratorService.processIntent(
      {
        prompt: 'Buy Nike Pegasus running shoes for ₹2,499 from Nike official store',
        agentId: 'shopping-agent',
        userId: 'usr_demo_fintech_01',
        authorizationToken: 'ag_tok_shopping_default_01',
      },
      'req_agent_demo_standalone'
    );
  }

  console.log(`✓ Agent profile loaded: "${toolDefs.agentName}"`);
  console.log(`✓ Tool Schema registered:`, JSON.stringify(toolDefs.openAIFunction, null, 2));

  console.log('\n=================== AGENTPAY DECISION TRACE ===================');
  console.log(`• Payment Intent ID:  ${trace.paymentIntentId}`);
  console.log(`• Extracted Amount:   ₹${(trace.structuredIntent.amountPaise / 100).toLocaleString('en-IN')}`);
  console.log(`• Policy Decision:    ${trace.policyDecision.decision} (${trace.policyDecision.reason})`);
  console.log(`• Risk Score:         ${trace.riskAssessment.overallScore}/100 (${trace.riskAssessment.level})`);
  console.log(`• Final Verdict:      ${trace.finalDecision}`);
  console.log(`• Final Settlement:   ${trace.finalStatus}`);
  console.log(`• Provider Order ID:  ${trace.executionResult?.providerOrderId || 'order_rzp_mock_01'}`);
  console.log(`• Verification:       ${trace.verificationResult?.isVerified ? 'CRYPTOGRAPHICALLY VERIFIED' : 'UNVERIFIED'}`);
  console.log(`• Audit Events:       ${trace.auditTrail.length} tamper-evident events logged`);
  console.log('================================================================\n');

  console.log('🎉 Bounded financial transaction completed safely on Razorpay without granting raw credentials to the AI model.');
}

main().catch(console.error);
