# FinFlow API - Operational Runbook

On-call playbooks for diagnosing and mitigating production incidents across the FinFlow API Gateway, Gemini AI Analyst, Webhook Dispatcher, and ACH Settlement Rails.

---

## Playbook 1: Gemini 429 Quota Exceeded / Upstream LLM Outage

### Symptoms
- Elevated `500` responses from `POST /api/ai/analyze` with `"Quota exceeded"` or `429 RESOURCE_EXHAUSTED` in server logs.
- Users opening **FinFlow AI** (`AiAssistantModal.tsx`) receive error states or slow responses (`> 10s`).

### Immediate Mitigation
1. **Verify Graceful Fallback**:
   - Confirm whether `server.ts` is falling back cleanly to the deterministic financial summary. (Note: Currently `server.ts` only falls back when `!ai`; update the `catch` block in production to return the deterministic `insights` payload with `degraded: true` when Gemini returns `429` or `503`.)
2. **Isolate Critical Path**:
   - Confirm `/api/v1/payments` and `/api/v1/refunds` latency remains unaffected (`p99 < 48ms`). AI services must never share worker pools or rate limits with payment capture.
3. **Check Token & Request Quotas**:
   - Inspect GCP / AI Studio quota dashboard for `gemini-3.7-flash` RPM/TPM saturation.
   - Verify request payload size: confirm `transactions.slice(0, 8)` and `invoices.slice(0, 5)` slicing is intact so runaway arrays are not bloating token usage.
4. **Apply Short-Term Throttling**:
   - Enable Redis per-organization rate limit on `/api/ai/analyze` (e.g., 10 requests/minute/org) and cache identical `metricSummary` responses for 120 seconds.

---

## Playbook 2: API Gateway Latency Spike (`p99 > 48ms`)

### Symptoms
- Dashboard `API Success Rate` SLA warning or APM alerts showing `/api/v1/payments` `p99` exceeding `48ms` (or `500ms` end-to-end with external processor).
- Increased `x-ledger-lock-latency` header values.

### Triage Steps
1. **Segment Gateway vs. Downstream Latency**:
   - Check CloudWatch/X-Ray traces by `x-finflow-request-id` across:
     - Edge/WAF -> ECS Gateway
     - Redis Idempotency lookup
     - Aurora PostgreSQL ledger lock wait (`x-ledger-lock-latency`)
     - External Card/ACH Acquirer call
2. **Diagnose Ledger Lock Contention**:
   - Query `pg_stat_activity` for blocked `ledger_entries` transactions (commonly caused by hot merchant accounts receiving high concurrent writes to a single balance row).
   - Mitigation: Enable sharded sub-ledger balance buckets or asynchronous balance materialization while keeping authorization checks atomic.
3. **Check Redis / DB Connection Pools**:
   - Verify PgBouncer / RDS Proxy pool saturation and ECS task CPU/memory utilization; trigger horizontal scale-out if CPU > 65%.

---

## Playbook 3: Webhook Delivery Failure & DLQ Backlog

### Symptoms
- Surge of `status: "failed"` or `status: "retrying"` records in **Event Logs** (`EventLogsView.tsx`).
- Merchants reporting missed `payment_intent.succeeded` or `invoice.payment_overdue` notifications.
- SQS Webhook Dead-Letter Queue (DLQ) depth > 0.

### Triage & Recovery
1. **Classify Failure Cause**:
   - **Merchant Endpoint `4xx/5xx` or Timeout (`> 5s`)**: Inspect HTTP status code and response latency in `webhook_events`.
   - **Signature Mismatch**: Confirm merchant is verifying `FinFlow-Signature` against the raw request body using the active `whsec_*` secret (and hasn't rotated secrets without updating their server).
2. **Protect Healthy Tenants**:
   - Ensure per-endpoint circuit breaker is active so one down merchant endpoint does not exhaust worker concurrency for other tenants.
3. **Replay from DLQ**:
   - Once the merchant confirms their endpoint is healthy (`200 OK`), trigger batch redelivery via SQS DLQ Redrive or via the UI **Redeliver Webhook** action. Verify idempotency on the merchant side using `evt_*` IDs.

---

## Playbook 4: Suspected API Key Compromise (`ff_live_*`)

### Symptoms
- Unexpected spike in `usageCount` on an `ApiKey` card in **API Keys** (`ApiKeysView.tsx`).
- Surge of `POST /api/v1/payments` or `POST /api/v1/refunds` calls from unknown ASNs/IPs, or a burst of `402 card_declined` probes (card-testing abuse).

### Containment (Execute Within 5 Minutes)
1. **Rotate & Revoke Immediately**:
   - Rotate the compromised `ff_live_*` key in **API Keys** (or revoke the key hash in Redis/Aurora so cached tokens are invalidated within `< 1s`).
2. **Block Source IPs at AWS WAF**:
   - Add offending CIDR blocks / ASNs to the WAF blocklist and enable strict burst rate-limiting on `402` responses (`> 20` declines/min/IP).
3. **Audit & Reconcile**:
   - Query all `transactions` and `refunds` created with the compromised `key_id` since the anomaly start time.
   - Notify the affected organization owner and issue reversing entries or processor voids where unauthorized charges occurred.

---

## Playbook 5: Chase NA / ACH Settlement Reconciliation Lag

### Symptoms
- Operating balance in **Header** (`user.accountBalance`) diverges from Chase NA Custody Bridge statements (`PrintStatementModal.tsx`), or `invoice_payout` entries remain `pending` beyond T+1.

### Triage Steps
1. **Check NACHA Batch Window**: Verify whether the payout was submitted before the 17:00 ET FedACH cutoff.
2. **Inspect Return Codes**: Check bank SFTP return files for `R01` (Insufficient Funds), `R02` (Account Closed), or `R03` (No Account).
3. **Reconcile Double-Entry Ledger**: Compare `SUM(amount - fee)` for `succeeded` transactions against settled bank batch totals; never manually edit settled rows-post a reconciling `deposit` or `adjustment` entry with audit reference.
