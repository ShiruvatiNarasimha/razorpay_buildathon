import { PolicyRuleResult, StructuredAgentIntent, PolicyConfig } from '../../contracts/index.js';

export interface CurrencyRestrictionContext {
  intent: StructuredAgentIntent;
  policy: PolicyConfig;
}

export function evaluateCurrencyRestriction(ctx: CurrencyRestrictionContext): PolicyRuleResult {
  const { intent, policy } = ctx;
  const currency = intent.currency.toUpperCase();

  const isAllowed = policy.allowedCurrencies.includes(currency);

  if (!isAllowed) {
    return {
      rule: 'CURRENCY_RESTRICTION',
      result: 'FAIL',
      reasonCode: 'CURRENCY_UNSUPPORTED',
      message: `Currency '${currency}' is not permitted by user policy. Allowed currencies: ${policy.allowedCurrencies.join(', ')}`,
      metadata: {
        requestedCurrency: currency,
        allowedCurrencies: policy.allowedCurrencies,
      },
    };
  }

  return {
    rule: 'CURRENCY_RESTRICTION',
    result: 'PASS',
    reasonCode: 'CURRENCY_PERMITTED',
    message: `Currency '${currency}' is supported and authorized`,
    metadata: { currency },
  };
}
