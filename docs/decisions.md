# Architecture Decision Records (ADRs)

## ADR-001: Integer Minor Units for Monetary Values

### Context
Floating-point arithmetic in JavaScript/Node.js (`0.1 + 0.2 !== 0.3`) introduces non-deterministic rounding errors. In financial infrastructure, fractional precision loss causes ledger reconciliation mismatches and potential exploits.

### Decision
All monetary values across the backend, contracts, database, and risk calculations must strictly use integer minor units:
- Indian Rupee (INR) is represented in **Paise** (1 INR = 100 paise).
- Example: `₹3,999.00` is represented as integer `399900`.
- Floating-point numbers are prohibited in all internal financial calculations.

### Consequences
- Positive: Zero floating-point rounding bugs; exact precision matching Razorpay's native amount format (which also takes amount in paise).
- Negative: Formatting required when displaying amounts in the frontend UI.

---

## ADR-002: Deterministic Policy Engine vs. Probabilistic LLM Deciders

### Context
Some AI-agent architectures attempt to use the LLM to decide whether a transaction is "safe" or "within budget". This is inherently dangerous because LLMs are vulnerable to prompt injection, jailbreaks, and hallucinations.

### Decision
The Policy Engine and Decision Gate are 100% deterministic TypeScript logic with zero LLM dependency. The LLM's only role is converting natural language into a structured intent DTO.

### Consequences
- Positive: Guaranteed policy enforcement regardless of prompt injection attacks or model behavior.
- Negative: Rules must be explicitly modeled in code or database policies.

---

## ADR-003: Idempotency Enforcement at the Gateway Layer

### Context
Network retries, duplicate agent tool calls, or client retries can cause duplicate payment captures.

### Decision
Every execution request requires a unique `idempotencyKey`. The system checks whether a transaction with this key exists before invoking the gateway. If already processed, it returns the cached result without creating a duplicate payment.

### Consequences
- Positive: Exactly-once financial execution guarantees.
- Negative: Requires key persistence and atomic status tracking.

---

## ADR-004: Fail-Closed Provider Verification

### Context
Payment gateway calls can time out or return ambiguous network errors. Optimistically marking an unverified transaction as `SUCCEEDED` leads to ghost payments and ledger discrepancy.

### Decision
A payment intent transitions to `SUCCEEDED` only if cryptographic verification and active gateway status checks affirmatively confirm capture. Any ambiguous state is marked `REQUIRES_REVIEW` or `FAILED`.

### Consequences
- Positive: Zero false positive successes.
- Negative: Requires reconciliation retry logic for intermittent provider outages.
