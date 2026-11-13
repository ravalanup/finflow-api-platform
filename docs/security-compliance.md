# FinFlow API - Security & Compliance Architecture

This document defines the security controls required to evolve FinFlow from a developer sandbox prototype into a PCI-DSS, SOC 2 Type II, and NACHA-compliant production payments platform.

---

## 1. PCI-DSS Scope Minimization (Card Tokenization)

FinFlow is designed around **SAQ-A / SAQ-A-EP** scope minimization so raw Primary Account Numbers (PAN), CVV/CVC codes, and magnetic-stripe data never enter FinFlow application servers or databases.

### Tokenization Flow
1. **Client-Side Tokenization**: End-user card details are collected via an isolated hosted iframe / SDK fields served directly by a PCI Level 1 vault/processor (e.g., Basis Theory, VGS, or Stripe Elements).
2. **Opaque Payment Method Tokens**: Only tokenized identifiers (e.g., `pm_card_visa_4242`, `pm_card_insufficient_funds`) are transmitted to `POST /api/v1/payments`.
3. **Storage Restrictions**:
   - **Prohibited**: Storing PAN, CVV, or raw track data in Aurora PostgreSQL, Redis, CloudWatch logs, or LLM prompts.
   - **Permitted**: Token ID (`pm_*`), card brand, last 4 digits, expiration month/year, and fingerprint hash.

---

## 2. Pre-LLM PII Redaction (`POST /api/ai/analyze`)

`AiAssistantModal.tsx` sends `transactions`, `invoices`, and `metricSummary` to `/api/ai/analyze`, which forwards context to Google Gemini (`gemini-3.7-flash`). Before sending any production payload to an external LLM, an automated **PII Redaction Middleware** must scrub sensitive attributes:

| Field / Pattern | Current Prototype Behavior | Production Redaction Rule |
| --- | --- | --- |
| `customerEmail` / `clientEmail` | Passed in JSON slice | Replace with deterministic hash or domain-only mask (e.g., `billing@***logistics.com` or `cust_hash_8f2a`) |
| `customer` / `clientName` | Passed in raw form | Map to anonymized entity alias (`Client_A`, `Client_B`) for the prompt, then optionally re-hydrate on the server |
| `description` / `notes` | Free text | Run regex + NER scrubber to strip SSNs, EINs, bank account numbers, routing numbers, phone numbers, and street addresses |
| `ApiKey` / Bearer tokens | Not sent | Hard blocklist middleware rejecting any payload matching `ff_live_`, `ff_test_`, `whsec_`, or `AIza*` |

Additionally, enterprise production deployments should enable zero-data-retention (ZDR) / enterprise API terms with Gemini so prompt payloads are not used for model training.

---

## 3. Server-Side RBAC & Multi-Tenant Isolation

Currently, `AuthModal.tsx` simulates OAuth 2.0 persona switching (`Anup Raval`, `Sarah Lin`, `Marcus Vance`) on the client. Production requires strict server-side enforcement:

### Authentication Layers
1. **Dashboard Users (OIDC + PKCE)**:
   - Authenticate via Google Workspace / GitHub OAuth through Amazon Cognito or Auth0 using Authorization Code + PKCE.
   - Sessions stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies (or short-lived JWTs with refresh rotation).
2. **Programmatic API Clients (Scoped API Keys)**:
   - Bearer keys (`ff_live_*` / `ff_test_*`) are hashed at rest using `HMAC-SHA256` with a KMS-backed pepper. Only the key prefix (`ff_live_51M2K...`) and last 4 characters are stored for UI display.
   - Strict environment isolation: `ff_test_*` keys can never access or mutate `livemode = true` ledger records.

### Tenant Isolation & RBAC Matrix
Every database table (`transactions`, `invoices`, `api_keys`, `webhook_events`) carries an `organization_id` column enforced by **PostgreSQL Row-Level Security (RLS)** and middleware claims.

| Role | Dashboard & Ledger | Invoices | API Keys (`ff_live_*`) | AI Analyst | Settings / Bank Bridge |
| --- | --- | --- | --- | --- | --- |
| `owner` / `admin` | Read / Refund / Export | Create / Remind / Mark Paid | Create / Reveal / Rotate / Revoke | Full Access | Full Access |
| `developer` | Read / Sandbox | Read Only | Manage `ff_test_*` keys; read masked `ff_live_*` | API Diagnostics | Webhook Endpoints Only |
| `finance_analyst` | Read / Export CSV & PDF | Create / Remind / Mark Paid | No Access | Full Access | View Settlement Summary |
| `auditor` | Read-Only + Export | Read-Only | Audit Logs Only | Read-Only | Read-Only |

---

## 4. Webhook Integrity (`HMAC-SHA256`) & Replay Protection

Every outbound webhook (modeled in `EventLogsView.tsx`) must be signed with the endpoint's signing secret (`whsec_*`):

```http
FinFlow-Signature: t=1788289200,v1=98a1f3e4c2b7...
```

- **Signature Calculation**: `HMAC_SHA256(whsec, "${timestamp}.${raw_json_body}")`
- **Replay Window**: Receivers must reject requests whose `t` timestamp differs from current UTC time by more than **300 seconds (5 minutes)**.
- **Constant-Time Verification**: Use `crypto.timingSafeEqual` in Node.js (or equivalent) to prevent timing side-channel attacks.

---

## 5. Audit Logging, NACHA/ACH & Data Retention

- **Immutable Financial Ledger**: Never `UPDATE` or `DELETE` settled financial rows; represent corrections via compensating entries (e.g., `refund` transactions).
- **SOC 2 Type II Audit Trail**: Record every API key creation/rotation, role change, invoice status override, and manual refund with `{ actor_id, org_id, ip_address, request_id, timestamp }` in append-only S3 Object Lock (WORM) storage retained for **7 years** (aligned with US IRS/accounting retention standards).
- **NACHA / ACH Compliance**: Encrypt bank routing/account numbers (`021000021` custody rail) via AWS KMS envelope encryption, verify micro-deposits or Plaid/Finicity account ownership before enabling `Direct ACH Rail` payouts, and enforce velocity caps on new merchants.
