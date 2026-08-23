import { PolicyRuleResult, StructuredAgentIntent, PolicyConfig } from '../../contracts/index.js';

export interface MerchantRestrictionContext {
  intent: StructuredAgentIntent;
  policy: PolicyConfig;
}

export function evaluateMerchantRestriction(ctx: MerchantRestrictionContext): PolicyRuleResult {
  const { intent, policy } = ctx;
  const merchant = intent.merchantName.trim().toLowerCase();

  // 1. Blacklist check (Strict Block)
  const isBlacklisted = policy.blockedMerchants.some((b) => {
    const bLower = b.trim().toLowerCase();
    if (merchant === bLower || merchant.includes(bLower) || bLower.includes(merchant)) {
      return true;
    }
    const keywords = bLower.split(/\s+/).filter((w) => w.length > 3);
    return keywords.some((k) => merchant.includes(k));
  });

  if (isBlacklisted) {
    return {
      rule: 'MERCHANT_RESTRICTION',
      result: 'FAIL',
      reasonCode: 'MERCHANT_BLACKLISTED',
      message: `Merchant '${intent.merchantName}' is on the restricted blacklist`,
      metadata: {
        merchantName: intent.merchantName,
        blockedMerchants: policy.blockedMerchants,
      },
    };
  }

  // 2. Whitelist check (if whitelist configured)
  if (policy.allowedMerchants && policy.allowedMerchants.length > 0) {
    const isWhitelisted = policy.allowedMerchants.some(
      (w) => w.trim().toLowerCase() === merchant || merchant.includes(w.trim().toLowerCase())
    );

    if (!isWhitelisted) {
      return {
        rule: 'MERCHANT_RESTRICTION',
        result: 'REVIEW',
        reasonCode: 'MERCHANT_NOT_WHITELISTED',
        message: `Merchant '${intent.merchantName}' is not in the pre-approved whitelist and requires review`,
        metadata: {
          merchantName: intent.merchantName,
          allowedMerchants: policy.allowedMerchants,
        },
      };
    }
  }

  return {
    rule: 'MERCHANT_RESTRICTION',
    result: 'PASS',
    reasonCode: 'MERCHANT_PERMITTED',
    message: `Merchant '${intent.merchantName}' is permitted for transactions`,
    metadata: {
      merchantName: intent.merchantName,
    },
  };
}
