# FinFlow API - Data Model & Ledger Schema

This document maps FinFlow's TypeScript domain models (`src/types.ts`) to a production-ready relational PostgreSQL double-entry ledger schema.

---

## 1. Domain Entities (`src/types.ts`)

| Interface | Primary Key | Description |
| --- | --- | --- |
| `UserProfile` | `id` (`usr_*`) | Authenticated merchant/developer identity, organization, OAuth provider, operating balance, and low-balance threshold |
| `Transaction` | `id` (`tx_*` / `pi_*` / `re_*`) | API call & financial settlement record (`payment`, `refund`, `subscription`, `invoice_payout`, `deposit`) with latency and fee |
| `Invoice` | `id` (`inv_*`) | Accounts receivable invoice with `invoiceNumber`, line `items` (`InvoiceItem[]`), `status`, and `daysOverdue` |
| `ApiKey` | `id` (`key_*`) | Environment-scoped (`live` / `test`) credential with `keyPrefix`, `maskedKey`, `usageCount`, and `monthlyLimit` |
| `WebhookEvent` | `id` (`evt_*`) | Event delivery record with `eventType`, `statusCode`, `latencyMs`, `endpointUrl`, and JSON `payload` |
| `AlertNotification` | `id` (`alt_*`) | Proactive monitor (`overdue_invoice`, `low_balance`, `api_anomaly`, `security`) with resolution state |
| `DauMetric` & `RetentionDay` | `date` / `dayIndex` | Telemetry series powering `DashboardView` and `AnalyticsView` |

---

## 2. Production PostgreSQL Schema (Double-Entry Ledger)

To guarantee zero drift between operating balances and settled transactions in production, every money movement writes balanced debit and credit rows inside a single ACID transaction.

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Multi-tenant Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  low_balance_threshold_cents BIGINT NOT NULL DEFAULT 1500000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger Accounts (Asset / Liability / Revenue / Fee)
CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  account_type TEXT NOT NULL CHECK (account_type IN ('operating_cash', 'merchant_payable', 'gateway_fee_revenue', 'clearing_ach')),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment Intents & Gateway Calls
CREATE TABLE transactions (
  id TEXT PRIMARY KEY, -- e.g., pi_3M2K91823
  organization_id UUID NOT NULL REFERENCES organizations(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  fee_cents BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  customer_id TEXT NOT NULL,
  description TEXT,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('payment', 'refund', 'subscription', 'invoice_payout', 'deposit')),
  livemode BOOLEAN NOT NULL DEFAULT false,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

-- Immutable Double-Entry Journal Entries
CREATE TABLE ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices & Line Items
CREATE TABLE invoices (
  id TEXT PRIMARY KEY, -- e.g., inv_88201
  organization_id UUID NOT NULL REFERENCES organizations(id),
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue', 'draft')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, invoice_number)
);

-- Hashed API Keys (Plaintext secret never persisted)
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL CHECK (mode IN ('live', 'test')),
  usage_count BIGINT NOT NULL DEFAULT 0,
  monthly_limit BIGINT NOT NULL DEFAULT 100000,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactional Outbox & Webhook Delivery Logs
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY, -- e.g., evt_1Qp987391
  organization_id UUID NOT NULL REFERENCES organizations(id),
  event_type TEXT NOT NULL,
  object_type TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('delivered', 'failed', 'retrying')),
  status_code INTEGER,
  latency_ms INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. Double-Entry Accounting Rule Example

For a `$450.00` (`45000` cents) card payment with `$13.05` (`1305` cents) gateway fee:

| Entry | Ledger Account | Direction | Amount (Cents) |
| --- | --- | --- | --- |
| 1 | `clearing_ach` / Processor Receivable | `debit` | `45000` |
| 2 | `merchant_payable` | `credit` | `43695` |
| 3 | `gateway_fee_revenue` | `credit` | `1305` |

Invariant: `SUM(debit) = 45000` equals `SUM(credit) = 43695 + 1305 = 45000`.
