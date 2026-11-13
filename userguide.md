# FinFlow API - User Guide

This guide explains who uses FinFlow API, how each persona operates inside the platform, and how to perform every workflow visually through the dashboard and programmatically via the REST API and browser debug utilities.

## 1. User Personas

FinFlow ships with three pre-configured personas (accessible via the top-right **Profile Menu -> Switch Account / OAuth Provider** in `AuthModal`).

### Persona 1: Anup Raval - Principal Platform Architect
- **Organization**: `FinFlow Core Infrastructure` (Default: `Default Organization`)
- **Project**: `Production Cluster US-East` (Default: `Main Project`)
- **Operating Balance**: `$12,450.00` initial demo state (`$842,500.00` in full Google SSO profile)
- **Primary Goals**:
  - Monitor platform-wide MTD volume (`$842,500.00`), `99.98%` API SLA, and `p99: 48ms` latency.
  - Manage live vs. test API keys (`ff_live_*` / `ff_test_*`) and inspect webhook deliveries.
  - Track developer adoption KPIs (`-60%` integration time, `76.2%` 21-day retention, `$20M ARR` trajectory).

### Persona 2: Sarah Lin - Freelance Design Lead
- **Organization**: `Studio Vertex LLC`
- **Project**: `Client Invoicing & Billing`
- **OAuth Provider**: GitHub OAuth (`sarah.lin@creativestudio.io`)
- **Operating Balance**: `$8,450.00` (Low Balance Threshold: `$10,000.00`)
- **Primary Goals**:
  - Create and track Net-30 client invoices, monitor overdue accounts receivable, and dispatch reminder webhooks.
  - Export CSV transaction/invoice ledgers and print monthly reconciliation statements for tax filing.
  - Ask **FinFlow AI** to surface tax deduction opportunities and overdue cash-flow risks.

### Persona 3: Marcus Vance - Fintech Founder & CTO
- **Organization**: `SaaS MetricFlow`
- **Project**: `Embedded Checkout V2`
- **OAuth Provider**: Google SSO (`marcus@cloudmetrics.dev`)
- **Operating Balance**: `$145,800.00` (Low Balance Threshold: `$20,000.00`)
- **Primary Goals**:
  - Test payment intent payloads, `402 card_declined` error handling, subscriptions, and refunds inside the **API Sandbox**.
  - Copy ready-to-run SDK snippets (`cURL`, `Node.js/TS`, `Python`, `Go`) into backend services.
  - Inspect webhook HMAC signatures and replay failed or overdue events in **Event Logs**.

---

## 2. Visual Usage Guide (Dashboard UI)

### Switching Environment Mode (Sandbox vs. Production)
1. Locate the **Environment Mode** card at the bottom of the left sidebar (`Sidebar.tsx`).
2. Click the toggle (`#toggle-sandbox-btn`) to switch between:
   - **Production (Live)**: Badges turn emerald (`Live Mode`), and Sandbox calls send `Authorization: Bearer ff_live_...`.
   - **Sandbox (Test)**: Badges turn indigo (`Test Mode`), and Sandbox calls send `Authorization: Bearer ff_test_...`.

### Dashboard Overview (`Dashboard` tab)
- **Action Banner**: Displays when active alerts exist (for example, 2 overdue invoices totaling `$7,450.00`). Click **Review Invoices** to jump to billing.
- **KPI Strip**: Displays Total Volume (MTD), API Success Rate (`99.98%`), User Retention (`76.2%`), and Active SDKs (`1,242`).
- **Live Transaction Monitoring**: Click any transaction row to open `TransactionDetailModal` with fee breakdowns, raw JSON payload, and an **Issue Full Refund** action.
- **Export Actions**: Click **Export PDF** (`#export-pdf-statement-btn`) to preview and print a Chase NA Custody Bridge statement, or **CSV** (`#export-csv-btn`) to download `finflow_transactions.csv`.
- **Retention Heatmap**: Hover over any of the 21 cohort cells to inspect daily retention percentages.
- **Production API Key Card**: Copy the masked key or jump directly to **API Sandbox** or **Manage Keys**.

### Payments & Real-Time Ledger (`Payments` tab)
- **Search & Filter**: Filter by transaction ID, endpoint, customer, description, or status (`all`, `succeeded`, `pending`, `failed`).
- **Create Charge**: Click **Create Charge** (or **New Payment** in the header) to open `NewPaymentModal` and simulate a Card (`Visa 4242`) or `Direct ACH Rail` charge. Creating a charge automatically appends a transaction and emits a `payment_intent.succeeded` webhook in **Event Logs**.
- **Issue Refund**: Click the refund icon on any succeeded non-refund transaction to mark it `refunded` and generate a corresponding `POST /v1/refunds` ledger entry and `charge.refunded` webhook.
- **Sync Live**: Click **Sync Live** in the Payments view or **Real-Time Sync** in the header to trigger a simulated ledger sync cycle.

### Invoices & Accounts Receivable (`Invoices & Billing` tab)
- **KPI Summary**: Tracks Overdue Balance, Pending (Net 30), and Collected (MTD).
- **Remind All / Individual Remind**: Clicking **Remind** dispatches an `invoice.payment_reminder_sent` webhook event to **Event Logs**.
- **Mark Paid**: Immediately transitions an invoice from `overdue` or `pending` to `paid`.
- **Create Invoice**: Click **Create Invoice** (`#create-new-invoice-btn`) to issue a new Net-30 invoice.
- **Export**: Download `finflow_invoices.csv` or open the Reconciliation Statement modal.

### Interactive Developer API Sandbox (`API Sandbox` tab)
1. Pick a preset test fixture in the top right:
   - **200 OK Payment** (`amount: 450.00`)
   - **402 Declined Card** (`amount: 99.00` - triggers a real `402` error from `/api/v1/payments`)
   - **Recurring Subscription** (`amount: 1200.00`)
   - **Refund Trigger** (`POST /api/v1/refunds`)
2. Edit the JSON payload in the dark code editor.
3. Click **Execute API Call** (`#send-api-request-btn`) to send a live `fetch` request to the Express backend.
4. Inspect the HTTP status badge, measured round-trip latency (`ms`), JSON response, and gateway headers (`x-finflow-request-id`, `x-idempotency-key`, `x-ledger-lock-latency`).
5. Copy the dynamically generated SDK snippet for **cURL**, **Node (TS)**, **Python**, or **Go**.
   - Successful Sandbox calls automatically append a new transaction to **Dashboard** and **Payments**, plus a webhook event to **Event Logs**.

### API Keys (`API Keys` tab)
- Click the eye icon to reveal or mask full secret keys (`ff_live_*`, `ff_test_*`).
- Click **Copy Key** to copy the full secret to your clipboard.
- Click **Rotate** to regenerate a key's secret in-place.
- Click **Generate New Key** to create an isolated `test` or `live` credential.

### Event Logs (`Event Logs` tab)
- Click any event on the left (`payment_intent.succeeded`, `invoice.payment_overdue`, `charge.refund.pending`) to inspect its signed `HMAC-SHA256` payload and delivery metadata on the right.
- Click **Payment Succeeded** or **Invoice Overdue** at the top right to simulate inbound events.
- Click **Redeliver Webhook** to replay delivery and refresh the status/latency readout.

### Analytics & Retention (`Analytics & Retention` tab)
- Review case-study KPIs (`-60%` integration time, `3x` developer adoption, `$20M ARR`), the 7-day DAU bar chart, the 21-day retention matrix, feature usage split, and the live `#debug-stats` inspector footer.

### Alerts Drawer & FinFlow AI
- **Alerts Bell (`#alerts-notification-bell`)**: Opens `AlertsDrawer` where you can **Dismiss** alerts or click **Take Action** (navigates to Invoices for overdue billing alerts, or tops up operating balance by `$5,000.00` for low-balance alerts).
- **FinFlow AI (`#ai-assistant-header-btn`)**: Opens `AiAssistantModal`. Pick a suggested financial query or type your own prompt to analyze your active transactions and invoices via `POST /api/ai/analyze`.

---

## 3. Programmatic Usage Guide

### REST API Calls (cURL)

**Health Check**:
```bash
curl -s http://localhost:3000/api/health
```

**Create a Payment Intent (200 OK)**:
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 450.00,
    "currency": "USD",
    "customer_id": "cus_apex_logistics_99",
    "payment_method": "pm_card_visa_4242",
    "metadata": { "order_id": "ord_2026_881" }
  }'
```

**Trigger the Deterministic 402 Card Declined Fixture (`amount: 99.00`)**:
```bash
curl -i -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.00,
    "currency": "USD",
    "customer_id": "cus_declined_card_1",
    "payment_method": "pm_card_insufficient_funds"
  }'
```

**Issue a Refund**:
```bash
curl -X POST http://localhost:3000/api/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pi_3M2K9182390aZ",
    "amount": 12.50,
    "reason": "requested_by_customer"
  }'
```

**Run FinFlow AI Financial Analysis**:
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Summarize overdue invoice exposure and cash flow outlook",
    "metricSummary": { "volumeMTD": 842500, "apiSuccessRate": "99.98%" }
  }'
```

### Browser DevTools Telemetry (`window.__FINFLOW_DEBUG__`)

FinFlow maintains a hidden DOM telemetry element (`<div id="debug-stats" style="display:none" ... />`) and exposes helper methods in the browser DevTools console:

```js
// Inspect current visit count (persisted in localStorage under 'finflow_visit_count')
window.__FINFLOW_DEBUG__.getVisitCount();

// Inspect platform state metadata
window.__FINFLOW_DEBUG__.getPlatformState();

// Increment or reset visit counter
window.__FINFLOW_DEBUG__.incrementVisit();
window.__FINFLOW_DEBUG__.resetVisits();
```
