# FinFlow API Reference

Base URL (Local / AI Studio Dev): `http://localhost:3000`
Gateway Version: `1.4.0`

> Note: This reference covers all live endpoints implemented in `server.ts` (`GET /api/health`, `POST /api/ai/analyze`, `POST /api/v1/payments`, `POST /api/v1/refunds`), deterministic AI fallback behavior, error/webhook patterns, and the planned `/v1/subscriptions` and `/v1/customers` contracts exposed in `ApiSandboxView.tsx`.

---

## Authentication

Endpoints under `/api/v1/payments` require an `Authorization` Bearer header prefixed with `ff_test_` (Sandbox) or `ff_live_` (Production):

```http
Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1
```

- Keys prefixed with `ff_live_` set `livemode: true` in the response payload.
- Keys prefixed with `ff_test_` set `livemode: false`.
- Missing or malformed headers return `401 Unauthorized`.

---

## 1. `GET /api/health`

Returns gateway liveness, timestamp, service identifier, and current API version.

### Request
```http
GET /api/health HTTP/1.1
```

### Response `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-11-13T22:45:00.000Z",
  "service": "finflow-api-gateway",
  "version": "1.4.0"
}
```

---

## 2. `POST /api/v1/payments`

Creates a payment intent in either Test (`ff_test_*`) or Live (`ff_live_*`) mode.

### Request Headers
| Header | Required | Description |
| --- | --- | --- |
| `Authorization` | Yes | `Bearer ff_test_...` or `Bearer ff_live_...` |
| `Content-Type` | Yes | `application/json` |

### Request Body Schema
```json
{
  "amount": 450.00,
  "currency": "USD",
  "customer_id": "cus_apex_logistics_99",
  "payment_method": "pm_card_visa_4242",
  "description": "API Subscription Tier 3 - Q3 Invoice",
  "metadata": {
    "order_id": "ord_2026_881",
    "platform": "finflow_api_v1"
  }
}
```

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `amount` | `number` | Yes | - | Positive decimal amount (`> 0`). Value `99` / `99.00` triggers the `402` test fixture |
| `currency` | `string` | No | `"USD"` | Three-letter ISO currency code (uppercased in response) |
| `customer_id` | `string` | No | Generated `cus_demo_*` | Customer identifier |
| `payment_method` | `string` | No | `"pm_card_visa"` | Tokenized payment method ID |
| `metadata` | `object` | No | `{"platform":"finflow_api"}` | Arbitrary key-value pairs |

### Response `200 OK`
```json
{
  "id": "pi_3m2k91823",
  "object": "payment_intent",
  "amount": 450,
  "currency": "USD",
  "status": "succeeded",
  "customer": "cus_apex_logistics_99",
  "payment_method": "pm_card_visa_4242",
  "created": 1788289200,
  "livemode": false,
  "metadata": {
    "order_id": "ord_2026_881",
    "platform": "finflow_api_v1"
  }
}
```

### Error Responses & Test Fixtures

| HTTP Status | `error.code` | Trigger Condition | Example Response |
| --- | --- | --- | --- |
| `401` | `unauthorized` | Missing `Authorization` header or token does not start with `Bearer ff_` | `{"error":{"code":"unauthorized","message":"Invalid or missing FinFlow API Key. Use Bearer ff_test_... or ff_live_..."}}` |
| `400` | `invalid_amount` | `amount` is missing or `<= 0` | `{"error":{"code":"invalid_amount","message":"Payment amount must be greater than 0."}}` |
| `402` | `card_declined` | Test fixture: `amount === 99` or `99.00` | `{"error":{"code":"card_declined","decline_code":"insufficient_funds","message":"Your card has insufficient funds for this transaction.","charge_id":"ch_err_8a1f2c9"}}` |

---

## 3. `POST /api/v1/refunds`

Issues a simulated full or partial refund against an existing payment intent.

### Request Body Schema
```json
{
  "payment_id": "pi_3M2K9182390aZ",
  "amount": 12.50,
  "reason": "requested_by_customer"
}
```

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `payment_id` | `string` | No | `"pi_mock_123"` | Target PaymentIntent ID |
| `amount` | `number` | No | `45.00` | Refund amount |
| `reason` | `string` | No | `"requested_by_customer"` | Refund reason (`requested_by_customer`, `duplicate`, `fraudulent`) |

### Response `200 OK`
```json
{
  "id": "ref_9a2b3c4d5",
  "object": "refund",
  "payment_id": "pi_3M2K9182390aZ",
  "amount": 12.5,
  "currency": "USD",
  "status": "succeeded",
  "reason": "requested_by_customer",
  "created": 1788289255
}
```

---

## 4. `POST /api/ai/analyze`

Server-side AI financial analyst powered by `@google/genai` (`gemini-3.7-flash`). Analyzes user questions alongside recent transactions, invoices, and platform KPIs.

### Request Body Schema
```json
{
  "prompt": "Analyze overdue invoice risk & cash flow projection",
  "transactions": [],
  "invoices": [],
  "metricSummary": {
    "volumeMTD": 842500.00,
    "apiSuccessRate": "99.98%",
    "retention": "76.2%",
    "activeSdks": 1242
  }
}
```

- `server.ts` slices the top 8 `transactions` and top 5 `invoices` into the Gemini prompt context.
- If `prompt` is omitted, defaults to `"Analyze our current financial health, cash flow risks, and developer API adoption."`

### Live Gemini Response `200 OK`
```json
{
  "analysis": "**Cash Flow Assessment**\n\n- Current MTD volume is **$842,500.00**...",
  "model": "gemini-3.7-flash",
  "timestamp": "2026-11-13T22:46:00.000Z"
}
```

### Deterministic Fallback Behavior (No `GEMINI_API_KEY`)
When `process.env.GEMINI_API_KEY` is unset, `server.ts` deterministically returns `200 OK` with pre-computed FinFlow Intelligence insights so the UI and automated tests never fail:

```json
{
  "analysis": "**Financial Assessment (FinFlow Intelligence):**\n\n...",
  "insights": [
    { "type": "warning", "message": "2 invoices overdue by > 14 days ($7,450.00 total)" },
    { "type": "success", "message": "API success rate at 99.98% across 1,242 active SDK integrations" },
    { "type": "info", "message": "Estimated quarterly tax deduction savings: $3,820.00" }
  ],
  "model": "gemini-3.7-flash (fallback preview)"
}
```

### Error Response `500 Internal Server Error`
```json
{
  "error": "Failed to generate financial analysis",
  "details": "Upstream error message"
}
```

---

## 5. Planned Sandbox Endpoints (UI Presets in `ApiSandboxView.tsx`)

`ApiSandboxView.tsx` currently includes presets for `/v1/subscriptions` and `/v1/customers` (which currently post to `/api/v1/payments` in the prototype). Target backend schemas for Phase 1 implementation:

- **`POST /api/v1/subscriptions`**: `{ customer_id, plan_id, billing_cycle, currency, amount }` -> returns `{ id: "sub_*", object: "subscription", status: "active", current_period_end }`
- **`GET /api/v1/customers`**: returns `{ object: "list", data: [{ id: "cus_*", email, payment_methods }] }`

---

## 6. Error & Webhook Envelope Patterns

### Standard API Error Format
```json
{
  "error": {
    "code": "card_declined",
    "decline_code": "insufficient_funds",
    "message": "Your card has insufficient funds for this transaction.",
    "charge_id": "ch_err_..."
  }
}
```

### Outbound Webhook Envelope
Every payment, refund, or invoice reminder emits an event visible in **Event Logs** (`WebhookEvent`):
```json
{
  "id": "evt_1Qp987391",
  "eventType": "payment_intent.succeeded",
  "objectType": "payment_intent",
  "status": "delivered",
  "statusCode": 200,
  "latencyMs": 142,
  "timestamp": "2 mins ago",
  "endpointUrl": "https://api.merchant.com/webhooks/finflow",
  "payload": {
    "id": "pi_3M2K91823",
    "amount": 45000,
    "currency": "usd",
    "customer": "cus_apex_logistics",
    "status": "succeeded",
    "livemode": true
  }
}
```
See [docs/webhooks-and-events.md](./webhooks-and-events.md) for signature verification and retry policies.
