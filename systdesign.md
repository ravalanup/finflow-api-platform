# FinFlow API - System Design & Production AWS Architecture

This document explains FinFlow's current application architecture as implemented in the repository and provides a blueprint for deploying FinFlow as a multi-tenant, PCI-DSS-scoped, production payments platform on AWS.

---

## 1. Current Prototype Architecture

Today, FinFlow runs as a unified Node.js + Express + Vite full-stack application on port `3000`.

```text
+-------------------------------------------------------------------+
| Browser Client (React 19 + Tailwind CSS v4 + TypeScript)          |
|  - State in App.tsx (transactions, invoices, apiKeys, events)     |
|  - Seeded from src/data/mockData.ts                               |
|  - Session telemetry via localStorage + #debug-stats              |
|  - CSV export & print-to-PDF via src/lib/exportUtils.ts           |
+-----------------------------+-------------------------------------+
                              | HTTP / JSON (same-origin :3000)
                              v
+-------------------------------------------------------------------+
| Express Gateway (server.ts)                                       |
|  - GET  /api/health          -> Gateway health & version 1.4.0    |
|  - POST /api/ai/analyze      -> Gemini 3.7 Flash or fallback JSON |
|  - POST /api/v1/payments     -> Bearer ff_* check + 402 fixture   |
|  - POST /api/v1/refunds      -> Simulated refund response         |
|  - Dev: Vite middlewareMode  | Prod: Express static dist/         |
+-----------------------------+-------------------------------------+
                              | HTTPS (when GEMINI_API_KEY is set)
                              v
+-------------------------------------------------------------------+
| Google Gemini API (@google/genai - gemini-3.7-flash)              |
+-------------------------------------------------------------------+
```

### Key Characteristics of Current Implementation
- **Single-process serving**: Express serves both the REST endpoints and the Vite SPA (`vite.middlewares` in dev, `dist/` static assets in production).
- **Client-side ledger state**: Transactions, invoices, alerts, API keys, and webhook events live in React component state (`src/App.tsx`) initialized from `src/data/mockData.ts`.
- **Stateless sandbox endpoints**: `/api/v1/payments` and `/api/v1/refunds` validate headers/payloads and return deterministic or randomized JSON objects without database persistence.
- **Server-side AI boundary**: `GEMINI_API_KEY` stays strictly on the server (`server.ts`); the browser never receives LLM credentials.

---

## 2. Target Production Architecture on AWS

Moving beyond mock/in-memory state requires durable ACID double-entry ledger storage, strict idempotency, asynchronous webhook delivery, real OAuth 2.0/OIDC authentication, card-data isolation, and horizontal scalability.

### High-Level AWS Topology

```text
                         +-------------------------+
                         |   Route 53 + AWS WAF    |
                         |  (Rate Limit & Geo/IP)  |
                         +------------+------------+
                                      |
              +-----------------------+-----------------------+
              |                                               |
              v                                               v
+---------------------------+                   +---------------------------+
| CloudFront + S3           |                   | Amazon API Gateway / ALB  |
| (React SPA Static Bundle) |                   | (TLS 1.3 + Custom Domain) |
+---------------------------+                   +-------------+-------------+
                                                              |
                                  +---------------------------+---------------------------+
                                  |                                                       |
                                  v                                                       v
                    +---------------------------+                           +---------------------------+
                    | ECS Fargate: Core API     |                           | ECS Fargate: AI Service   |
                    | - /v1/payments            |                           | - /api/ai/analyze         |
                    | - /v1/refunds             |                           | - PII Redaction Filter    |
                    | - /v1/subscriptions       |                           | - Gemini API + Fallback   |
                    | - /v1/customers           |                           +-------------+-------------+
                    | - /v1/invoices            |                                         |
                    +------+------+------+------+                                         v
                           |      |      |                                  +---------------------------+
         +-----------------+      |      +------------------+               | Gemini API / Secret Mgr   |
         |                        |                         |               +---------------------------+
         v                        v                         v
+------------------+   +--------------------+   +------------------------+
| ElastiCache      |   | Aurora PostgreSQL  |   | Amazon SQS / EventBridge|
| (Redis Cluster)  |   | (Multi-AZ Ledger)  |   | (Async Webhook Queue)  |
| - Idempotency    |   | - Double-entry tx  |   +-----------+------------+
| - Key rate limit |   | - Invoices & Keys  |               |
| - API key cache  |   | - Outbox table     |               v
+------------------+   +--------------------+   +------------------------+
                                                | AWS Lambda / Fargate   |
                                                | Webhook Dispatcher     |
                                                | - HMAC-SHA256 signing  |
                                                | - Exponential backoff  |
                                                | - DLQ + Replay         |
                                                +-----------+------------+
                                                            |
                                                            v
                                                Merchant Webhook Endpoints
```

### AWS Service Mapping & Responsibilities

1. **Edge, CDN & Perimeter Security**
   - **Amazon CloudFront + S3**: Hosts the compiled Vite SPA (`dist/`), eliminating server load for static assets and enforcing strict CSP/HSTS headers.
   - **AWS WAF + Shield Standard**: Protects `/api/v1/*` and `/api/ai/*` from DDoS, credential stuffing, and automated card-testing floods via IP reputation and rate-based rules.
   - **Application Load Balancer (ALB) / API Gateway**: Terminates TLS 1.3 and routes `/v1/*` API traffic separately from dashboard BFF (Backend-for-Frontend) routes.

2. **Compute Layer (ECS Fargate)**
   - **Payments Core Service**: Stateless Node.js/TypeScript containers running in private subnets across 2+ Availability Zones. Scales horizontally on CPU/RPS targets to maintain `p99 < 48ms` gateway overhead.
   - **AI Analyst Service**: Isolates Gemini calls from the payment critical path so LLM latency or 429 rate limits never degrade checkout or payment capture latency.
   - **Scheduled Billing Workers (EventBridge Scheduler + Fargate/Lambda)**: Evaluates overdue invoices daily, emits `invoice.payment_overdue` events, and triggers dunning workflows.

3. **Persistence & Ledger Consistency**
   - **Amazon Aurora PostgreSQL (Multi-AZ)**:
     - Implements an immutable **double-entry accounting ledger** (`ledger_accounts`, `ledger_entries`, `transactions`, `invoices`, `api_keys`, `webhook_events`).
     - Uses a **Transactional Outbox** table written in the same DB transaction as `payment_intent` creation so webhook events are guaranteed never to be lost even if downstream brokers hiccup.
   - **Amazon ElastiCache for Redis**:
     - Stores **Idempotency-Key** results (24-48h TTL) to guarantee safe retries without double-charging customers.
     - Enforces sliding-window rate limits per API key (`monthlyLimit` + per-second burst caps) and caches `SHA-256` hashed API key metadata for sub-millisecond auth.
   - **Amazon S3 (Object Lock / WORM)**: Archives monthly reconciliation PDFs, CSV exports, and immutable audit logs.

4. **Asynchronous Webhook Engine & Settlement Integrations**
   - **Amazon EventBridge + SQS (Standard/FIFO + DLQ)**:
     - Decouples payment capture from outbound merchant HTTP delivery.
     - Lambda/Fargate dispatcher signs payloads with per-endpoint `whsec_*` secrets (`HMAC-SHA256` with timestamp tolerance), enforces 5s delivery timeouts, and retries with exponential backoff + jitter up to 5-10 attempts before moving events to a Dead-Letter Queue (DLQ).
   - **Banking & Card Processor Bridges**:
     - **Card Acquiring / Tokenization**: Integrates with a PCI-DSS Level 1 vault/processor (e.g., Stripe/Adyen/Basis Theory/VGS) so raw PANs never touch FinFlow ECS tasks.
     - **ACH & Instant Settlement**: Connects via private AWS Direct Connect / mTLS VPN to banking partners (e.g., JPMorgan Chase Access / FedNow / NACHA batch SFTP over AWS Transfer Family).

5. **Identity, Secrets & Observability**
   - **Amazon Cognito / Auth0 (OIDC + PKCE)**: Replaces `AuthModal` simulation with real Google/GitHub SSO, issuing short-lived JWTs mapped to `organization_id` and RBAC roles (`admin`, `developer`, `finance_viewer`).
   - **AWS Secrets Manager & KMS**: Stores `GEMINI_API_KEY`, DB credentials, `whsec_*` master encryption keys, and bank mTLS certificates with automatic rotation. API keys (`ff_live_*` / `ff_test_*`) are hashed with HMAC-SHA256/Argon2 before storage; only the prefix (`ff_live_51M2K...`) is stored in plaintext for display.
   - **Observability (CloudWatch + OpenTelemetry + X-Ray)**: Emits structured JSON logs with `x-finflow-request-id` correlation IDs across ALB -> ECS -> Aurora -> SQS -> Webhook Lambda.

---

## 3. Data Flow: End-to-End Payment Request (Production)

1. Client calls `POST /v1/payments` with `Authorization: Bearer ff_live_...` and `Idempotency-Key: <uuid>`.
2. Gateway hashes the Bearer token, checks ElastiCache Redis for tenant/mode permissions and rate limits, and validates idempotency key status.
3. Payment service verifies the tokenized `payment_method` (`pm_*`) with the PCI-vaulted acquirer.
4. On authorization, a single PostgreSQL `SERIALIZABLE` or row-locked transaction inserts:
   - `payment_intents` row
   - Balanced debit/credit rows in `ledger_entries` (merchant receivable, processing fee, net payable)
   - `outbox_events` row (`payment_intent.succeeded`)
5. Gateway caches the JSON response in Redis under the idempotency key and returns `200 OK` with `x-finflow-request-id` and `x-ledger-lock-latency`.
6. Outbox relay publishes the event to SQS; the Webhook Dispatcher signs and POSTs the payload to the merchant's configured URL and records the delivery attempt in `webhook_events`.
