import { PolicyRuleResult } from '../../contracts/index.js';

export interface AuthValidityContext {
  authorizationToken?: string;
  isTokenExpired?: boolean;
  isTokenSignatureValid?: boolean;
  requireAuthToken?: boolean;
}

export function evaluateAuthValidity(ctx: AuthValidityContext): PolicyRuleResult {
  const {
    authorizationToken,
    isTokenExpired = false,
    isTokenSignatureValid = true,
    requireAuthToken = false,
  } = ctx;

  if (requireAuthToken && !authorizationToken) {
    return {
      rule: 'AUTH_VALIDITY',
      result: 'FAIL',
      reasonCode: 'MISSING_AUTHORIZATION_TOKEN',
      message: 'Mandatory user delegation authorization token is missing',
    };
  }

  if (authorizationToken) {
    if (isTokenExpired) {
      return {
        rule: 'AUTH_VALIDITY',
        result: 'FAIL',
        reasonCode: 'EXPIRED_AUTHORIZATION_TOKEN',
        message: 'The provided delegation authorization token has expired',
      };
    }

    if (!isTokenSignatureValid) {
      return {
        rule: 'AUTH_VALIDITY',
        result: 'FAIL',
        reasonCode: 'INVALID_AUTHORIZATION_SIGNATURE',
        message: 'The authorization token cryptographic signature is invalid or forged',
      };
    }
  }

  return {
    rule: 'AUTH_VALIDITY',
    result: 'PASS',
    reasonCode: 'AUTH_VERIFIED',
    message: 'User authorization delegation is verified and active',
  };
}
