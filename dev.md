# Developer Guide (`dev.md`)

This guide helps engineers navigate the FinFlow API codebase, understand state and API boundaries, and safely add or modify components, endpoints, and fixtures.

## 1. Repository Map

| Path | Purpose |
| --- | --- |
| `server.ts` | Express server on port `3000`: API routes (`/api/health`, `/api/ai/analyze`, `/api/v1/payments`, `/api/v1/refunds`) and Vite dev middleware / `dist` static serving |
| `index.html` | Root HTML shell, Plus Jakarta Sans & JetBrains Mono fonts, and `#debug-stats` node |
| `src/main.tsx` | React 19 mount entry point |
| `src/index.css` | Tailwind CSS v4 import (`@import "tailwindcss";`) and print styles |
| `src/types.ts` | Shared TypeScript interfaces (`AppTab`, `Transaction`, `Invoice`, `ApiKey`, `WebhookEvent`, `AlertNotification`, `UserProfile`, `DauMetric`) |
| `src/App.tsx` | Central state owner, tab switcher, business event handlers, and modal/drawer wiring |
| `src/data/mockData.ts` | Seed data for transactions, invoices, API keys, webhooks, alerts, 21-day retention cells, DAU series, and 3 OAuth personas |
| `src/lib/exportUtils.ts` | CSV download helpers (`exportTransactionsToCsv`, `exportInvoicesToCsv`) and `triggerPrintStatement()` |
| `src/lib/debugTracker.ts` | Manages localStorage visit counter, `#debug-stats` DOM attributes, and `window.__FINFLOW_DEBUG__` |

### Component Breakdown (`src/components/`)

| Component | Tab / Trigger | Key Responsibilities |
| --- | --- | --- |
| `Sidebar.tsx` | Persistent left rail | Tab navigation (`AppTab`), mobile drawer toggle, Sandbox/Live environment switch (`#toggle-sandbox-btn`) |
| `Header.tsx` | Persistent top bar | Org/project breadcrumb, Live/Test badge, Sync button, Quick Payment button, FinFlow AI trigger, Alerts bell, Profile switcher |
| `DashboardView.tsx` | `dashboard` | Overdue invoice banner, 4 KPI cards, live 6-row ledger preview, 21-day retention heatmap, Production API key card |
| `PaymentsView.tsx` | `payments` | Full searchable/filterable ledger, filtered volume summary, CSV/PDF export, manual sync, inline refund trigger |
| `InvoicesView.tsx` | `invoices` | AR KPI cards, overdue warning banner, invoice search/filter, **Create Invoice** modal, **Remind** webhook dispatch, **Mark Paid** |
| `ApiSandboxView.tsx` | `sandbox` | Test fixture presets, JSON payload editor, live `fetch` execution to `/api/v1/*`, cURL/Node/Python/Go snippet generator, response & header viewer |
| `ApiKeysView.tsx` | `apikeys` | Reveal/mask/copy/rotate/create `ff_test_*` & `ff_live_*` keys, usage bars, webhook endpoint summary |
| `EventLogsView.tsx` | `eventlogs` | Master-detail webhook stream inspector, simulated event injectors, payload JSON viewer, **Redeliver Webhook** |
| `AnalyticsView.tsx` | `analytics` | Impact cards (`-60%` integration, `3x` adoption, `$20M ARR`), 7-day DAU bar chart, 21-day retention matrix, `#debug-stats` inspector |
| `AiAssistantModal.tsx` | Header AI button | Preset prompt chips, custom query input, calls `POST /api/ai/analyze` with top transactions/invoices/metrics |
| `AuthModal.tsx` | Profile dropdown | Switches `currentUser` across 3 `alternateProfiles` using Google SSO or GitHub OAuth simulation |
| `AlertsDrawer.tsx` | Header Bell icon | Slide-over drawer to dismiss alerts or trigger resolution (`remind_invoice` -> Invoices tab, `add_funds` -> +$5,000 balance) |
| `PrintStatementModal.tsx` | Export PDF buttons | Printable August 2026 Chase NA reconciliation statement (`#printable-statement`, `.no-print` controls) |
| `NewPaymentModal.tsx` | Header / Payments | Simulates Card (`Visa 4242`) or `Direct ACH Rail` charge and appends transaction + webhook |
| `TransactionDetailModal.tsx` | Ledger row click | Shows fee, latency, customer, raw JSON payload, and **Issue Full Refund** button |

---

## 2. State & Data Flow Architecture

Currently, `src/App.tsx` owns all client-side domain state:
- `transactions`, `invoices`, `alerts`, `apiKeys`, `events`
- `currentTab` (`AppTab`), `isSandbox` (`boolean`), `currentUser` (`UserProfile`), `visitCount` (`number`)

When a user executes an action:
1. **API Sandbox (`ApiSandboxView.tsx`)**: Calls `POST /api/v1/payments` or `POST /api/v1/refunds` on `server.ts`. On HTTP 2xx, `onTransactionCreated` fires in `App.tsx`, prepending a new `Transaction` and a matching `WebhookEvent` (`payment_intent.succeeded` or `charge.refunded`).
2. **Refunds (`PaymentsView.tsx` / `TransactionDetailModal.tsx`)**: `handleTriggerRefund(txId)` updates the original transaction status to `refunded` and appends a new `POST /v1/refunds` transaction + `charge.refunded` webhook.
3. **Invoice Reminders (`InvoicesView.tsx`)**: `handleSendInvoiceReminder(id)` appends an `invoice.payment_reminder_sent` `WebhookEvent` to `events`.
4. **AI Analysis (`AiAssistantModal.tsx`)**: Sends `prompt`, top 10 `transactions`, top 6 `invoices`, and `metricSummary` to `POST /api/ai/analyze` in `server.ts`.

---

## 3. Common Extension Tasks

### How to Add a New Backend API Endpoint
1. Open `server.ts` and add a route above `startServer()` (for example, `app.post("/api/v1/subscriptions", ...)`).
2. Validate `req.headers.authorization` (`Bearer ff_test_` or `Bearer ff_live_`) and return structured `{ error: { code, message } }` JSON on `400`/`401`/`402`.
3. Update `src/components/ApiSandboxView.tsx` in `handleSendRequest()` so `selectedEndpoint === 'subscriptions'` routes to `/api/v1/subscriptions` instead of falling back to `/api/v1/payments`.
4. Document the contract in `docs/api-reference.md`.

### How to Add a New Navigation Tab
1. Add the tab union key to `AppTab` in `src/types.ts`.
2. Add the menu entry in `navItems` inside `src/components/Sidebar.tsx`.
3. Create `src/components/YourNewView.tsx` following the Clean Minimalism palette (`bg-[#F8FAFC]`, `bg-white`, `border-slate-200`, `text-slate-900`, `font-mono` for metrics/IDs).
4. Render `{currentTab === 'your_tab' && <YourNewView ... />}` in `src/App.tsx`.

### How to Modify the Gemini AI Prompt or Model
1. Open `server.ts` and locate `app.post("/api/ai/analyze", ...)`.
2. Update `systemInstruction`, `contextPayload`, or the `model` string (currently `"gemini-3.7-flash"`).
3. Keep the fallback block (`if (!ai) { ... }`) up to date so environments without `GEMINI_API_KEY` continue returning realistic financial guidance.

### How to Add a New Demo Persona
1. Open `src/data/mockData.ts` and append a `UserProfile` object to `alternateProfiles`.
2. It will automatically render inside `AuthModal.tsx` with Google SSO and GitHub OAuth buttons.

---

## 4. Scripts & Build Verification

```bash
npm run dev      # Starts Express + Vite HMR/middleware on port 3000
npm run lint     # Runs tsc --noEmit (strict TypeScript verification)
npm run build    # Builds client bundle to dist/ and server bundle to dist/server.cjs
npm start        # Runs compiled production bundle (node dist/server.cjs)
npm run clean    # Removes dist/ and server.js
```

### Important Runtime Notes
- **Port 3000**: `server.ts` binds to `0.0.0.0:3000`. Do not change the port when running inside AI Studio preview iframes.
- **No `window.alert` in new features**: Existing sandbox/invoice demo handlers use `alert()` in two legacy spots (`ApiSandboxView.tsx` invalid JSON, `App.tsx` reminder toast); prefer inline state banners or toast components for new code.
- **Debug Tracker**: `initDebugTracker()` in `src/lib/debugTracker.ts` reads/writes `localStorage.finflow_visit_count` and updates `<div id="debug-stats">` in the DOM.
