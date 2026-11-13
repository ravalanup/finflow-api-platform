# FinFlow API - Testing & Verification Strategy

This document provides smoke-test `curl` commands for the live Express gateway, along with our unit, contract, end-to-end (Playwright), ledger reconciliation, and latency benchmark strategy.

---

## 1. Smoke Test `curl` Commands (Local / Staging)

Start the server first with `npm run dev` (listens on `http://localhost:3000`).

### 1.1 Health Check
```bash
curl -s http://localhost:3000/api/health | jq
```
Expected: `200 OK` with `"status": "healthy"` and `"version": "1.4.0"`.

### 1.2 Create Payment Intent (`200 OK` Sandbox)
```bash
curl -s -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 450.00,
    "currency": "USD",
    "customer_id": "cus_apex_logistics_99",
    "payment_method": "pm_card_visa_4242"
  }' | jq
```
Expected: `200 OK`, `"object": "payment_intent"`, `"status": "succeeded"`, `"livemode": false`.

### 1.3 Live Mode Flag Verification (`ff_live_`)
```bash
curl -s -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer ff_live_51M2KhJ891Lka09sD7721Nzp9xAz2" \
  -H "Content-Type: application/json" \
  -d '{"amount": 120.00, "currency": "USD"}' | jq '.livemode'
```
Expected: `true`.

### 1.4 Deterministic `402 Card Declined` Fixture (`amount: 99.00`)
```bash
curl -i -s -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1" \
  -H "Content-Type: application/json" \
  -d '{"amount": 99.00, "currency": "USD"}'
```
Expected: `HTTP/1.1 402 Payment Required` with `"code": "card_declined"` and `"decline_code": "insufficient_funds"`.

### 1.5 Auth & Validation Negative Tests (`401` and `400`)
```bash
# Missing Bearer ff_ prefix -> 401
curl -i -s -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 10}'

# Invalid amount -> 400
curl -i -s -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1" \
  -H "Content-Type: application/json" \
  -d '{"amount": -5}'
```

### 1.6 Issue Refund (`200 OK`)
```bash
curl -s -X POST http://localhost:3000/api/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{"payment_id": "pi_3M2K9182390aZ", "amount": 12.50, "reason": "requested_by_customer"}' | jq
```

### 1.7 AI Financial Analysis (`POST /api/ai/analyze`)
```bash
curl -s -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Evaluate overdue invoice risk", "metricSummary": {"volumeMTD": 842500}}' | jq
```
Expected: `200 OK` with `"analysis"` markdown (uses `gemini-3.7-flash` when `GEMINI_API_KEY` is set, or `"gemini-3.7-flash (fallback preview)"` otherwise).

---

## 2. Multi-Layer Automated Testing Strategy

### Layer 1: Type Safety & Static Analysis
- Run `npm run lint` (`tsc --noEmit`) on every commit and PR to guarantee strict interface compliance across `src/types.ts`, components, and `server.ts`.

### Layer 2: Unit & Utility Tests (Recommended: Vitest)
Target pure logic and edge cases:
- **CSV Escaping (`src/lib/exportUtils.ts`)**: Verify commas, double quotes, and empty descriptions/notes in `exportTransactionsToCsv` and `exportInvoicesToCsv` produce RFC 4180-valid CSV rows.
- **Fee & Net Payout Math**: Validate standard `0.30 + amount * 0.029` fee calculation and `PrintStatementModal` net payout (`totalCollected - totalFees`).
- **Debug Tracker (`src/lib/debugTracker.ts`)**: Verify `localStorage` initialization (`>= 1242`), increment, reset, and `#debug-stats` DOM attributes.
- **Webhook HMAC Signing (Production Target)**: Verify `HMAC-SHA256` signature generation, constant-time comparison, and 300-second replay timestamp rejection.

### Layer 3: API Contract & Idempotency Tests (Supertest + Express)
- Assert request/response JSON schemas against OpenAPI definitions for `/api/health`, `/api/v1/payments`, `/api/v1/refunds`, and `/api/ai/analyze`.
- Test **idempotency guarantees** (target production middleware): sending two identical `POST /api/v1/payments` requests with the same `Idempotency-Key` must return the exact same `pi_*` ID without creating duplicate ledger entries.
- Test **double-entry ledger invariants** (target PostgreSQL layer): every payment, fee, and refund batch must satisfy `SUM(debits) === SUM(credits)`.

### Layer 4: End-to-End Browser Tests (Playwright)
Key user journeys to automate against `http://localhost:3000`:
1. **Sandbox Payment -> Ledger & Webhook Sync**:
   - Navigate to `#nav-btn-sandbox`, click `#send-api-request-btn`, assert `200 OK` response panel updates, then switch to `#nav-btn-payments` and `#nav-btn-eventlogs` to verify the new transaction and `payment_intent.succeeded` event appear.
2. **402 Declined Fixture**:
   - Click `402 Declined Card` preset in Sandbox, execute, assert `402` badge and `insufficient_funds` JSON.
3. **Environment Toggle**:
   - Click `#toggle-sandbox-btn`, verify header badge switches between `Test Mode` and `Live Mode`.
4. **Invoice Dunning & Settlement**:
   - Open `#nav-btn-invoices`, click **Remind** on an overdue invoice, verify `invoice.payment_reminder_sent` appears in Event Logs; click **Mark Paid**, verify overdue badge count decreases in Sidebar.
5. **OAuth Persona Switch & Low-Balance Alert Resolution**:
   - Open `#user-profile-menu-btn` -> Switch to `Sarah Lin` via GitHub OAuth -> verify header displays `Studio Vertex LLC`.
   - Open `#alerts-notification-bell` -> click **Take Action** on low-balance alert -> verify balance increases by `$5,000.00`.
6. **CSV & Printable Statement Export**:
   - Click `#export-pdf-statement-btn` and assert `#printable-statement` renders gross volume, fees, and Chase routing `021000021`.
7. **Invisible Telemetry Tag**:
   - Assert `#debug-stats` exists in the DOM with `data-visits` >= `1243` and `window.__FINFLOW_DEBUG__.getPlatformState().apiSuccessRate === '99.98%'`.

---

## 3. API Gateway Latency Benchmarks

Target SLOs for the Payments Gateway (`k6` / `autocannon` load profile at 500 RPS sustained):

| Metric / Endpoint | Target p50 | Target p95 | Target p99 | Error Budget |
| --- | --- | --- | --- | --- |
| `GET /api/health` | `< 3ms` | `< 8ms` | `< 15ms` | `0.00%` |
| `POST /api/v1/payments` (Gateway + Ledger Lock) | `< 18ms` | `< 35ms` | `< 48ms` | `< 0.02%` (`99.98%` SLA) |
| `POST /api/v1/refunds` | `< 22ms` | `< 42ms` | `< 65ms` | `< 0.02%` |
| `POST /api/ai/analyze` (Gemini upstream) | `< 850ms` | `< 2200ms` | `< 4000ms` | Fallback on `429/5xx` |

Example `autocannon` local benchmark against the Express gateway:
```bash
npx autocannon -c 25 -d 15 -m POST \
  -H "Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1" \
  -H "Content-Type: application/json" \
  -b '{"amount":450,"currency":"USD"}' \
  http://localhost:3000/api/v1/payments
```
