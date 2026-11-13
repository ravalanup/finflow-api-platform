# FinFlow API - Developer SDK Quickstart

Go from API key to your first payment intent in under 12 minutes. This quickstart mirrors the 4 code generators available in the **API Sandbox** tab (`ApiSandboxView.tsx`).

---

## 1. Prerequisites & Keys

- **Sandbox Key**: `ff_test_99aK8812Nvb44991OpqLk28zQp1` (Safe test fixture mode, `livemode: false`)
- **Production Key**: `ff_live_51M2KhJ891Lka09sD7721Nzp9xAz2` (`livemode: true`)
- **Local Base URL**: `http://localhost:3000/api`
- **Cloud Sandbox Base URL**: `https://api.finflow.io` (conceptual production endpoint shown in Sandbox code generator)

> Note: When running locally against `server.ts`, use `http://localhost:3000/api/v1/payments` and `http://localhost:3000/api/v1/refunds`.

---

## 2. Create a Payment Intent

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 450.00,
    "currency": "USD",
    "customer_id": "cus_apex_logistics_99",
    "payment_method": "pm_card_visa_4242",
    "description": "API Subscription Tier 3 - Q3 Invoice",
    "metadata": { "order_id": "ord_2026_881" }
  }'
```

### Node.js / TypeScript (Zero-Dependency `fetch` against Local Server)
```ts
const response = await fetch("http://localhost:3000/api/v1/payments", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.FINFLOW_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 450.0,
    currency: "USD",
    customer_id: "cus_apex_logistics_99",
    payment_method: "pm_card_visa_4242",
    description: "API Subscription Tier 3 - Q3 Invoice",
    metadata: { order_id: "ord_2026_881" },
  }),
});

const paymentIntent = await response.json();
console.log("Charge ID:", paymentIntent.id);
```

### Node.js (Target `@finflow/node-sdk` Pattern from Sandbox)
```ts
import { FinFlow } from "@finflow/node-sdk";

const finflow = new FinFlow(process.env.FINFLOW_SECRET_KEY!);

const paymentIntent = await finflow.payments.create({
  amount: 450.0,
  currency: "USD",
  customer_id: "cus_apex_logistics_99",
  payment_method: "pm_card_visa_4242",
  metadata: { order_id: "ord_2026_881" },
});

console.log("Charge ID:", paymentIntent.id);
```

### Python (`requests` against Local Server)
```python
import os
import requests

res = requests.post(
    "http://localhost:3000/api/v1/payments",
    headers={
        "Authorization": f"Bearer {os.environ['FINFLOW_SECRET_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "amount": 450.00,
        "currency": "USD",
        "customer_id": "cus_apex_logistics_99",
        "payment_method": "pm_card_visa_4242",
    },
    timeout=5,
)
intent = res.json()
print(f"Charge ID: {intent['id']}")
```

### Go (`net/http` against Local Server)
```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	payload := []byte(`{"amount":450.00,"currency":"USD","customer_id":"cus_apex_logistics_99","payment_method":"pm_card_visa_4242"}`)
	req, _ := http.NewRequest("POST", "http://localhost:3000/api/v1/payments", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("FINFLOW_SECRET_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
```

---

## 3. Sandbox Test Fixtures

Use these deterministic inputs when integrating error handling:

| Scenario | Endpoint | Key Input | Expected Result |
| --- | --- | --- | --- |
| Standard Payment | `POST /api/v1/payments` | `amount: 450.00` + `Bearer ff_test_*` | `200 OK`, `status: "succeeded"`, `livemode: false` |
| Insufficient Funds | `POST /api/v1/payments` | `amount: 99.00` | `402 Payment Required`, `code: "card_declined"` |
| Invalid Amount | `POST /api/v1/payments` | `amount: 0` or `-10` | `400 Bad Request`, `code: "invalid_amount"` |
| Invalid API Key | `POST /api/v1/payments` | Missing or non-`ff_` Bearer token | `401 Unauthorized`, `code: "unauthorized"` |
| Full / Partial Refund | `POST /api/v1/refunds` | `{ payment_id, amount, reason }` | `200 OK`, `object: "refund"` |
