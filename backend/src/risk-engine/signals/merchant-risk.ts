import { RiskSignal } from '../../contracts/index.js';

export interface MerchantRiskContext {
  merchantName: string;
  merchantCategory?: string;
  isKnownMerchant?: boolean;
}

const HIGH_RISK_CATEGORIES = [
  'gambling',
  'casino',
  'crypto',
  'gift_cards',
  'wire_transfer',
  'adult',
  'darknet',
];

export function evaluateMerchantRiskSignals(ctx: MerchantRiskContext): RiskSignal[] {
  const { merchantName, merchantCategory = '', isKnownMerchant = true } = ctx;
  const signals: RiskSignal[] = [];

  // 1. High risk category check
  const cat = merchantCategory.toLowerCase();
  const name = merchantName.toLowerCase();
  const isHighRiskCat =
    HIGH_RISK_CATEGORIES.some((c) => cat.includes(c) || name.includes(c));

  signals.push({
    code: 'HIGH_RISK_MERCHANT_CATEGORY',
    scoreContribution: 40,
    description: isHighRiskCat
      ? `Merchant category '${merchantCategory || merchantName}' is flagged as high-risk`
      : 'Merchant category is standard retail / commerce',
    triggered: isHighRiskCat,
    metadata: { merchantCategory, merchantName },
  });

  // 2. Unrecognized merchant check
  signals.push({
    code: 'UNRECOGNIZED_MERCHANT',
    scoreContribution: 20,
    description: !isKnownMerchant
      ? `Merchant '${merchantName}' has never been transacted with previously by this user`
      : `Merchant '${merchantName}' is a recognized vendor in user history`,
    triggered: !isKnownMerchant,
    metadata: { merchantName, isKnownMerchant },
  });

  return signals;
}
