# FinFlow API - Webhooks & Event Streaming

FinFlow uses webhooks to notify your backend asynchronously when payment intents succeed, refunds are issued, or invoices become overdue. You can inspect, simulate, and redeliver events inside the **Event Logs** tab (`EventLogsView.tsx`).

---

## 1. Event Catalog

| `eventType` | `objectType` | Trigger Source in FinFlow |
| --- | --- | --- |
| `payment_intent.succeeded` | `payment_intent` | Emitted when a charge succeeds via `NewPaymentModal`, `ApiSandboxView`, or simulated trigger |
| `charge.refunded` | `refund` | Emitted when a refund is triggered via `PaymentsView`, `TransactionDetailModal`, or `/api/v1/refunds` |
| `charge.refund.pending` | `refund` | Emitted when an asynchronous partial refund enters `pending` state |
| `invoice.payment_overdue` | `invoice` | Emitted when a Net-30 invoice passes its `dueDate` |
| `invoice.payment_reminder_sent` | `invoice` | Emitted when **Remind** or **Remind All** is clicked in `InvoicesView` |

### Sample Payload (`payment_intent.succeeded`)
```json
{
  "id": "evt_1Qp987391",
  "eventType": "payment_intent.succeeded",
  "objectType": "payment_intent",
  "status": "delivered",
  "statusCode": 200,
  "latencyMs": 142,
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

---

## 2. Verifying `HMAC-SHA256` Webhook Signatures

Production webhook deliveries include a `FinFlow-Signature` header signed with your endpoint signing secret (`whsec_*`, displayed in `ApiKeysView.tsx` as `whsec_99182aK`):

```http
FinFlow-Signature: t=1788289200,v1=98a1f3e4c2b7...
```

Always verify the signature against the **raw request body** and reject timestamps older than 5 minutes (`300s`).

### Node.js / Express Example
```ts
import crypto from "crypto";
import express from "express";

const WEBHOOK_SECRET = process.env.FINFLOW_WEBHOOK_SECRET!; // e.g., whsec_...

app.post("/webhooks/finflow", express.raw({ type: "application/json" }), (req, res) => {
  const sigHeader = req.headers["finflow-signature"] as string;
  if (!sigHeader) return res.status(400).send("Missing signature");

  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
  const timestamp = Number(parts.t);
  const signature = parts.v1;

  if (Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return res.status(400).send("Webhook timestamp outside tolerance window");
  }

  const signedPayload = `${timestamp}.${req.body.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) return res.status(401).send("Invalid signature");

  const event = JSON.parse(req.body.toString("utf8"));
  // Process event idempotently using event.id
  res.status(200).json({ received: true });
});
```

### Python Example
```python
import hmac
import hashlib
import time

def verify_finflow_signature(raw_body: bytes, sig_header: str, secret: str) -> bool:
    parts = dict(item.split("=", 1) for item in sig_header.split(","))
    timestamp = int(parts["t"])
    if abs(time.time() - timestamp) > 300:
        return False

    signed_payload = f"{timestamp}.".encode() + raw_body
    expected = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(parts["v1"], expected)
```

---

## 3. Delivery Guarantees & Retry Schedule

- **Response Requirement**: Return any `2xx` HTTP status code within **5 seconds** before performing slow downstream DB/email work.
- **Idempotent Consumers**: Deduplicate by `event.id` (`evt_*`) because at-least-once delivery may send an event more than once during network retries or manual **Redeliver Webhook** actions.
- **Exponential Backoff Policy** (5 attempts modeled in `EventLogsView.tsx`):
  1. Attempt 1: Immediate (`0s`)
  2. Attempt 2: `+30s`
  3. Attempt 3: `+5m`
  4. Attempt 4: `+30m`
  5. Attempt 5: `+2h` -> Moves to Dead-Letter Queue (DLQ) for manual replay.
