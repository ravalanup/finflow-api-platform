# FinFlow API - Engineering Delivery Roadmap

This document tracks the gap between the current FinFlow prototype and a multi-tenant production payments platform, structured into a 4-phase engineering delivery roadmap.

---

## 1. Prototype-to-Production Gap Matrix

| Capability | Current Prototype (`v1.4.0` Demo) | Production Target | Priority |
| --- | --- | --- | --- |
| **Ledger & Persistence** | In-memory React state seeded from `src/data/mockData.ts` | Multi-AZ Aurora PostgreSQL double-entry ledger + Transactional Outbox | P0 |
| **API Auth & Keys** | String prefix check (`Bearer ff_`) in `server.ts`; plaintext `fullKey` in `mockData.ts` | KMS-peppered SHA-256 key hashes in DB + Redis cache + per-key rate limits | P0 |
| **Idempotency** | Static `x-idempotency-key: valid` header in UI | Redis-backed `Idempotency-Key` lock + cached response replay (24-48h TTL) | P0 |
| **User Authentication** | Simulated Google/GitHub persona switcher (`AuthModal.tsx`) | Real OAuth 2.0 / OIDC + PKCE (Cognito/Auth0), server-side sessions, RBAC | P0 |
| **API Endpoint Coverage** | `/api/health`, `/api/ai/analyze`, `/api/v1/payments`, `/api/v1/refunds` | Full `/v1/payments`, `/v1/refunds`, `/v1/subscriptions`, `/v1/customers`, `/v1/invoices` | P1 |
| **Webhook Engine** | Local state append + UI simulation in `EventLogsView.tsx` | Outbox relay -> SQS -> Lambda/Fargate dispatcher with real `HMAC-SHA256`, backoff & DLQ | P1 |
| **Card & ACH Settlement** | Simulated responses & static Chase NA text | PCI Level 1 tokenized vault (`pm_*`) + FedNow / Chase ACH NACHA integration | P1 |
| **AI Financial Analyst** | Direct `gemini-3.7-flash` call with raw context + `!ai` fallback | Pre-LLM PII redaction filter, `429` catch-block fallback, per-org quota & response cache | P1 |
| **Analytics & Telemetry** | Static `dauHistoryData` / `retentionHeatmapCells` + `localStorage` counter | Event-sourced ClickHouse/Athena analytics pipeline fed by real API gateway logs | P2 |
| **Automated Test Suite** | `tsc --noEmit` (`npm run lint`) | Vitest unit tests, Supertest contract tests, Playwright E2E suite, `k6` load tests in CI | P1 |

---

## 2. Four-Phase Engineering Delivery Roadmap

### Phase 1: Durable Core & API Parity (Weeks 1-4)
**Goal**: Eliminate mock state for core payment/invoice workflows and establish CI testing.
- Provision Aurora PostgreSQL and Redis via Terraform/CDK; implement schema from `docs/data-model.md`.
- Implement real backend routes for `POST /api/v1/subscriptions`, `GET/POST /api/v1/customers`, and `/api/v1/invoices` so all `ApiSandboxView.tsx` dropdowns hit dedicated handlers.
- Add `Idempotency-Key` middleware backed by Redis (`24h` TTL).
- Replace plaintext `fullKey` storage with hashed secrets (`ff_live_` / `ff_test_` shown once at creation).
- Establish CI pipeline running `tsc --noEmit`, Vitest unit tests, Supertest contract tests, and Playwright smoke tests.

### Phase 2: Identity, Security Hardening & AI Guardrails (Weeks 5-8)
**Goal**: Enforce multi-tenant isolation, RBAC, and pre-LLM privacy controls.
- Replace `AuthModal.tsx` mock switcher with real OAuth 2.0 + PKCE (Google & GitHub SSO) and PostgreSQL Row-Level Security (`organization_id`).
- Implement server-side RBAC roles (`owner`, `developer`, `finance_analyst`, `auditor`).
- Add Pre-LLM PII Redaction middleware in `/api/ai/analyze` and move fallback logic into the `try/catch` error handler for Gemini `429`/`5xx` resilience.
- Deploy AWS WAF rate-limiting and `402` burst protection rules.

### Phase 3: Asynchronous Webhooks & Real Settlement Rails (Weeks 9-14)
**Goal**: Deliver production-grade event streaming and real-money movement.
- Build Transactional Outbox -> EventBridge/SQS -> Lambda Webhook Dispatcher with real `HMAC-SHA256` (`FinFlow-Signature`) signing, 5-attempt exponential backoff, and DLQ replay API.
- Integrate PCI-DSS Level 1 tokenization vault for `pm_*` card methods (maintaining SAQ-A scope).
- Connect Chase NA / FedNow / NACHA ACH settlement rail with automated daily reconciliation jobs and WORM audit storage in S3.
- Add scheduled invoice overdue scanner to trigger real `invoice.payment_overdue` webhooks and email notifications.

### Phase 4: Production Analytics, SDK Publishing & Scale (Weeks 15-18)
**Goal**: Close the loop on developer adoption metrics and publish official SDK packages.
- Replace static `dauHistoryData` and `retentionHeatmapCells` with live aggregated telemetry from API Gateway access logs.
- Publish versioned `@finflow/node-sdk`, `finflow` (PyPI), and `finflow-go` packages matching the Sandbox code generator.
- Execute chaos/failover drills (Gemini 429 simulation, Aurora Multi-AZ failover, SQS DLQ redrive) and complete SOC 2 Type II readiness audit.
