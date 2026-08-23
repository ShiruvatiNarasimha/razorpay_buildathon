import { RiskSignal } from '../../contracts/index.js';

const PROMPT_INJECTION_PATTERNS = [
  /system\s+override/i,
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /bypass\s+(safety|security|limits?|policy|checks?)/i,
  /override\s+(spending|transaction|budget|limits?)/i,
  /override/i,
  /system\s+prompt/i,
  /dan\s+mode/i,
  /jailbreak/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /transfer\s+all\s+funds/i,
  /drain\s+(account|wallet)/i,
  /sudo\s+approve/i,
  /secret_key|api_key|private_key/i,
];

export interface PromptInjectionContext {
  rawPrompt?: string;
  intentDetails?: string;
}

export function evaluatePromptInjectionSignal(ctx: PromptInjectionContext): RiskSignal {
  const text = `${ctx.rawPrompt || ''} ${ctx.intentDetails || ''}`;

  const matchedPattern = PROMPT_INJECTION_PATTERNS.find((regex) => regex.test(text));
  const triggered = Boolean(matchedPattern);

  return {
    code: 'PROMPT_INJECTION_DETECTED',
    name: 'Adversarial Prompt Injection Detector',
    scoreContribution: 50,
    triggered,
    details: {
      matchedPattern: matchedPattern ? matchedPattern.source : null,
      description: triggered
        ? `Prompt contains adversarial injection patterns matching rule: ${matchedPattern?.source}`
        : 'Natural language input is clear of known adversarial injection heuristics',
    },
  };
}
