# Contributing to FinFlow API

Thank you for contributing to FinFlow API. This guide outlines our workflow, coding standards, and verification checklist.

## Development Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:3000` with Express serving both API endpoints and the Vite SPA.

## Coding Standards

1. **TypeScript**: All new modules and components must be strongly typed using interfaces in `src/types.ts` (avoid `any` where practical).
2. **Styling**: Use Tailwind CSS utility classes only (`@import "tailwindcss";` in `src/index.css`). Follow the Clean Minimalism palette:
   - Canvas: `#F8FAFC`
   - Sidebar: `#1E293B`
   - Cards: `bg-white border border-slate-200 rounded-xl shadow-xs`
   - Accents: `indigo-600` (primary actions), `emerald-600` (success/live), `amber-600` (warnings/overdue), `rose-600` (errors)
   - Data & Code: `font-mono` (`JetBrains Mono`) for IDs, endpoints, latency, and currency amounts.
3. **Server-Side Secrets**: Never expose `GEMINI_API_KEY`, `ff_live_*` signing secrets, or external credentials to the client bundle (`VITE_*` variables are public). Proxy all LLM and third-party API calls through `server.ts`.
4. **Documentation Consistency**: Whenever adding a route in `server.ts`, update `docs/api-reference.md` and `docs/testing.md`.

## Branching & Pull Request Checklist

- Create a focused feature branch (`feat/subscriptions-endpoint`, `fix/csv-escaping`, `docs/aws-runbook`).
- Run TypeScript verification and production build before opening a PR:
  ```bash
  npm run lint
  npm run build
  ```
- Verify both Sandbox (`Test Mode`) and Production (`Live Mode`) UI states if touching payment, key, or header components.
- Confirm `POST /api/ai/analyze` works both with and without `GEMINI_API_KEY` set (fallback path).
