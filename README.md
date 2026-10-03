# BevShop frontend

React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query and Sonner.

## Run locally

```powershell
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

The existing backend is at `P:\BevShopBe`; its local HTTP service is published on `http://localhost:8081`. The Vite `/api` proxy uses that address by default. Change `API_PROXY_TARGET` in `.env.local` for another port. Leave `VITE_API_URL` empty for same-origin requests. A direct `VITE_API_URL` requires the backend to allow the frontend origin through CORS.

For production, reverse-proxy `/api` to the Go service and serve `index.html` for frontend routes. Vite's development proxy is not included in the build.

Sign in at `/login`, or use `/setup` once to create the single owner. JWTs are kept in tab-scoped session storage and attached as bearer tokens. Expired sessions clear the query cache and return to login. The current API cannot issue HttpOnly session cookies; session storage remains accessible to JavaScript.

## Features

- Existing dashboard connected to real summary, history, damage and owner-money responses.
- Products, categories, suppliers, purchases, sales, expenses, damaged items and owner money.
- Shared native dialogs, responsive tables, pagination, friendly errors, loading skeletons and success notifications.
- Multi-item purchase and sale forms; aggregate stock validation across duplicate sale lines; receipt details after saving.
- History with type/date filters and owner-money entries merged from their dedicated API.
- Backend-calculated reports with Kigali date boundaries and RWF formatting.
- Profile, password changes and server-backed logout.
- Dark desktop sidebar and native modal navigation drawer on mobile.

All application colors are defined in `src/index.css`. Dashboard utilities use semantic tokens mapped to these variables.

## Backend differences from the requested brief

Inspected against the handlers/models in `P:\BevShopBe`:

- Purchase/sale cancellation routes do not exist. Cancellation is not offered, because reversing a transaction requires backend business logic.
- `/reports/products`, `/reports/low-stock` and `/reports/best-selling` do not exist. Reports use `/reports/summary` and `/reports/dashboard`; the latter supplies the top five products by revenue. Current stock tables use `/products`. A full per-product period report still requires backend support.
- History has a limit but no offset, type filter, quantity, or owner-money rows. The UI progressively expands the requested limit, paginates the loaded results, filters locally, and adds real `/owner-money` records. Sale/purchase details are fetched using the reference ID.
- Profile updates accept name and phone only; email is displayed read-only.
- There is no public setup-status endpoint, and login does not reliably report setup-required. A setup link is always available; the backend prevents creating a second owner.

No stock balance, profit, cost, damage-loss or report-total business logic is recreated in the frontend.

## Validation

```powershell
npm.cmd run build
npm.cmd run lint
```

Authenticated end-to-end checks against the real database require an owner sign-in. Do not populate the owner's business records with test transactions.

Browser smoke tests use intercepted API fixtures and do not write to the shop database. With the frontend running on port 5173 and Microsoft Edge installed, run:

```powershell
npm.cmd run test:browser
```

Set `FRONTEND_URL` for a different frontend address. The suite checks all 12 business routes at 320, 375, 768, 1024 and 1440 pixels, navigation, authenticated redirects, transaction forms, stock limits, friendly errors, receipts, record forms and profile actions.

## Downloadable business reports

On Reports, choose Today, This Week, This Month, This Year, or Custom Date Range,
then click **Download PDF**. The screen and PDF use the same `/api/v1/reports/print`
response. Totals are calculated by PostgreSQL/backend code, not from table rows.
The backend returns the full history without a pagination limit in a read-only
snapshot. Reports include stock/payment totals, all six activity types, and a
monthly summary for yearly reports. Stock counts reflect current inventory.

Downloads use structured data with jsPDF and AutoTable (no screenshots), A4 portrait,
repeating table headers, wrapped details, page numbers, and current global theme
colors. Positive, negative and zero results have explicit labels for monochrome
printing. RWF formatting preserves up to two decimal places throughout the app.

### Reporting verification

Run the backend's `scripts/verify-reports.mjs` against a fresh isolated backend on
port 18082 with `TEST_API_URL=http://localhost:18082`. It creates test business
records and saves a fixture in the OS temporary directory. Then, with the frontend
running on 5174:

```powershell
node scripts/verify-report-pdf.mjs
```

The PDF check routes browser reads to that isolated backend, checks every supported
period, opens the actual downloads with PDF.js, verifies totals and complete
history, checks A4 page bounds and headers, and tests result colors and error UI.
It writes sample PDFs to the OS temporary directory under `bevshop-pdf-verification`.
The ordinary regression suite remains `npm run test:browser` (set `FRONTEND_URL`
if your development server uses a different port).
