# FinFlow API - Developer-First Payments Platform

FinFlow API is a minimalist payments infrastructure platform and real-time financial operations dashboard built for developers, SaaS founders, and finance teams. It combines a RESTful payments gateway, an interactive multi-language API sandbox, cryptographically modeled webhook event streams, automated accounts receivable invoicing, and a server-side Gemini AI financial analyst.

## Key Capabilities

- **Live Transaction Ledger & Telemetry**: Real-time transaction monitoring (`POST /v1/payments`, `POST /v1/refunds`, `POST /v1/subscriptions`, `POST /v1/payouts`) with status codes (`200 OK`, `202 Pending`, `402 Error`), latency tracking, fee breakdowns, and one-click refunds.
- **Interactive Developer API Sandbox**: Execute live HTTP requests against the Express API gateway with editable JSON payloads, test fixtures (`200 OK`, `402 Declined Card` via `amount: 99.00`, Subscriptions, Refunds), and instant code generation in **cURL**, **Node.js (TypeScript)**, **Python**, and **Go**.
- **Invoices & Accounts Receivable**: Track overdue, pending, and paid invoices, create new Net-30 invoices, dispatch automated dunning reminder webhooks, and export reconciliation data.
- **Exportable Financial Reports (CSV & Print/PDF)**: Download itemized transaction and invoice CSVs for accounting or generate a printable Chase NA Custody Bridge monthly reconciliation statement.
- **API Security & Key Management**: Manage environment-scoped Bearer tokens (`ff_test_*` for Sandbox, `ff_live_*` for Production), reveal/mask keys, rotate secrets, and monitor monthly request quotas.
- **Webhook Event Stream**: Inspect `HMAC-SHA256` signed payloads (`payment_intent.succeeded`, `charge.refunded`, `invoice.payment_overdue`, `invoice.payment_reminder_sent`), trigger simulated events, and redeliver failed webhooks.
- **Platform Analytics & Cohort Retention**: Visualize 7-day Daily Active Usage (DAU), a 21-day developer retention heatmap (76.2% average retention), and product impact benchmarks (`-60%` integration time, `3x` developer adoption, `$20M ARR` potential).
- **FinFlow AI Financial Analyst**: Server-side Gemini (`gemini-3.7-flash`) financial advisor accessible from the header for cash-flow projections, overdue invoice risk analysis, and tax deduction insights, with an automatic deterministic fallback when no API key is configured.
- **OAuth 2.0 Persona Switcher & Debug Telemetry**: Switch between three pre-configured developer/merchant personas via Google SSO or GitHub OAuth simulation, and inspect session telemetry via `#debug-stats` and `window.__FINFLOW_DEBUG__`.

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React icons
- **Backend**: Node.js, Express 4 (`server.ts`), `tsx` for dev execution, `esbuild` for production bundling
- **AI Integration**: `@google/genai` (`gemini-3.7-flash`) running server-side in `server.ts`
- **Typography**: Plus Jakarta Sans (UI) and JetBrains Mono (API endpoints, ledger amounts, code snippets)

## Quick Start

### Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm or bun

### Installation & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and optionally add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   APP_URL="http://localhost:3000"
   ```
   > Note: If `GEMINI_API_KEY` is omitted, `POST /api/ai/analyze` automatically returns a structured deterministic financial preview so the app remains fully functional offline or in demos.

3. **Run the development server** (Express + Vite middleware on port `3000`):
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:3000`.

### Build & Production Run

```bash
# Typecheck
npm run lint

# Build frontend (dist/) and bundle server (dist/server.cjs)
npm run build

# Start production server on port 3000
NODE_ENV=production npm start
```

## Project Structure

```text
.
├── server.ts                  # Express API gateway, Gemini AI proxy, and Vite dev/prod server
├── index.html                 # Entry HTML, Google Fonts, and #debug-stats telemetry tag
├── package.json               # Scripts (dev, build, start, lint) and dependencies
├── .env.example               # Environment variable template
├── src/
│   ├── App.tsx                # Root state container, tab router, and modal orchestration
│   ├── types.ts               # Core TypeScript interfaces (Transaction, Invoice, ApiKey, etc.)
│   ├── data/mockData.ts       # Seed transactions, invoices, API keys, webhooks, alerts, and personas
│   ├── lib/
│   │   ├── exportUtils.ts     # CSV generators and window.print() statement trigger
│   │   └── debugTracker.ts    # #debug-stats DOM updater and window.__FINFLOW_DEBUG__ API
│   └── components/            # Modular views (Dashboard, Payments, Invoices, Sandbox, Keys, Logs, Analytics)
└── docs/                      # Detailed architecture, API, security, runbook, testing, and roadmap docs
```

## Documentation Index

| Document | Audience | Description |
| --- | --- | --- |
| [userguide.md](./userguide.md) | End Users & API Consumers | Personas, UI workflows, sandbox fixtures, and programmatic usage |
| [systdesign.md](./systdesign.md) | Architects & DevOps | Current prototype design and target production AWS architecture |
| [dev.md](./dev.md) | Contributors & Maintainers | Component map, state flows, and instructions to extend the codebase |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contributors | Branching, code style, and pull request checklist |
| [docs/api-reference.md](./docs/api-reference.md) | Backend & SDK Developers | Endpoints, JSON schemas, error codes, and deterministic AI fallback |
| [docs/sdk-quickstart.md](./docs/sdk-quickstart.md) | Integrating Developers | Quickstart snippets in cURL, Node.js, Python, and Go |
| [docs/webhooks-and-events.md](./docs/webhooks-and-events.md) | Backend Engineers | Event catalog, HMAC-SHA256 verification, and retry policies |
| [docs/data-model.md](./docs/data-model.md) | Database & Backend Engineers | TypeScript types mapped to a production PostgreSQL double-entry ledger |
| [docs/security-compliance.md](./docs/security-compliance.md) | Security & Compliance | PCI-DSS scope minimization, pre-LLM PII redaction, RBAC, and HMAC rules |
| [docs/runbook.md](./docs/runbook.md) | SRE & On-Call | Playbooks for Gemini 429 failover, webhook DLQs, key rotation, and latency |
| [docs/testing.md](./docs/testing.md) | QA & Engineers | Smoke test cURLs, unit/contract/Playwright strategy, and benchmarks |
| [docs/roadmap.md](./docs/roadmap.md) | Product & Engineering Leads | Prototype-to-production gap matrix and 4-phase delivery roadmap |
