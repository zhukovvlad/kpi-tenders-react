# CLAUDE.md — react-kpi-tenders

Frontend SaaS-платформы Tender Analysis: семантический анализ договоров строительного подряда. Multi-tenant, React 19 + TypeScript + Vite + Tailwind v4.

> Information architecture and routes: `Tender_Analysis_IA_routes.md` (внешний документ дизайн-материалов).
> Design tokens: `Tender_Analysis_design_tokens.md` (внешний).
> Known technical debts: [`TECH_DEBT.md`](./TECH_DEBT.md).
> Latest devlog: [`docs/devlog/`](./docs/devlog/).

## Commands

```bash
npm run dev          # dev-server (Vite, port 5173, proxy /api → localhost:8080)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc --noEmit (without emitting files)
npm run lint         # ESLint
npm run format       # Prettier for **/*.{ts,tsx}
npm run preview      # Preview production build
```

**Testing (to be configured):**
```bash
npm run test         # Vitest
npm run test:ui      # Vitest UI
npm run coverage     # Coverage report
```

> Vitest + @testing-library/react — not yet installed. Add before writing first test:
> `npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`

## Project Structure

```
src/
├── App.tsx                          # BrowserRouter + Routes (public + AppShell-wrapped private)
├── main.tsx                         # React root
├── index.css                        # Design tokens + Tailwind v4 @theme + base layer
├── components/
│   ├── layout/                      # App shell
│   │   ├── AppShell.tsx             # Topnav + <Outlet/> for private routes
│   │   ├── TopNav.tsx               # Logo + nav links + theme toggle + user menu
│   │   ├── Logo.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── UserMenu.tsx
│   ├── ui/                          # shadcn/ui primitives (DO NOT modify manually)
│   ├── ui-domain/                   # Tender Analysis primitives (use these in pages)
│   │   ├── Button.tsx               # primary | secondary | ghost | link | danger
│   │   ├── Surface.tsx              # tonal card surface
│   │   ├── PageHeader.tsx
│   │   ├── KpiCard.tsx
│   │   ├── StatusPill.tsx           # ready | processing | attention | empty | info
│   │   ├── ContractKindChip.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Breadcrumbs.tsx          # hierarchy crumbs «Объекты › ЖК › Очередь»
│   │   └── Tabs.tsx                 # custom tabs with 2px active border
│   ├── site/                        # /sites/:id (overview + tabs)
│   │   ├── SiteOverview.tsx         # intermediate screen for sites with children
│   │   ├── ContractsTab.tsx
│   │   ├── InflationTab.tsx
│   │   ├── ComparisonsTab.tsx
│   │   ├── HistoryTab.tsx
│   │   ├── AuditTab.tsx
│   │   └── UploadDocumentDialog.tsx
│   ├── contract/                    # /sites/:id/documents/:docId
│   │   ├── ContractFiles.tsx
│   │   ├── ParametersTable.tsx
│   │   ├── RequestParameterForm.tsx
│   │   └── ExtractionRequestsList.tsx
│   ├── SiteCard.tsx                 # used on dashboard
│   └── ProtectedRoute.tsx
├── pages/                           # Route-level page components
│   ├── LandingPage.tsx              # public
│   ├── LoginPage.tsx                # public
│   ├── RegisterPage.tsx             # public
│   ├── DashboardPage.tsx            # /dashboard (root sites only)
│   ├── SitesNewPage.tsx             # /sites/new (?parentId= prefill)
│   ├── SitePage.tsx                 # /sites/:siteId (overview OR tabs by hasChildren)
│   ├── SiteEditPage.tsx             # /sites/:siteId/edit (placeholder)
│   ├── ContractPage.tsx             # /sites/:siteId/documents/:docId
│   ├── ExtractionRequestPage.tsx    # /sites/:siteId/documents/:docId/extractions/:requestId
│   ├── ComparePage.tsx              # /compare
│   ├── KeysPage.tsx                 # /keys (admin)
│   ├── SettingsPage.tsx             # /settings (admin)
│   └── ProfilePage.tsx              # /profile
├── context/
│   └── AuthContext.tsx              # AuthProvider over useUser() (TanStack Query)
├── hooks/
│   ├── useAuth.ts
│   └── useUser.ts
├── services/
│   ├── api/
│   │   ├── client.ts                # Axios instance (cookies, interceptors)
│   │   ├── auth.ts                  # auth + mock session via localStorage
│   │   ├── sites.ts                 # list, listForDashboard (roots only), listChildren, get, create, update, delete
│   │   ├── documents.ts             # list, listBySite, bundlesForSite, get, upload, delete, getPresignedUrl
│   │   ├── extraction.ts            # initiate, get, listForDocument, answersForDocument
│   │   ├── keys.ts                  # CRUD for extraction_keys
│   │   ├── comparisons.ts           # list, listForSite, save
│   │   ├── site-events.ts           # listForSite
│   │   └── tasks.ts                 # legacy document_tasks API (used by future Audit tab)
│   └── mocks/
│       ├── index.ts                 # USE_MOCKS flag + mockDelay helper
│       └── data.ts                  # seed data (sites, documents, keys, requests, events, comparisons)
├── types/
│   ├── auth.ts                      # User
│   ├── contract.ts                  # ContractKind + CONTRACT_KINDS metadata
│   ├── site.ts                      # ConstructionSite, SiteListItem, SiteAggregateStatus
│   ├── document.ts                  # Document (with contract_kind, bundle_id), ContractBundle, ArtifactKind
│   ├── extraction.ts                # ExtractionRequest, ExtractionAnswer
│   ├── extraction-key.ts            # ExtractionKey, ExtractedDataItem
│   ├── comparison.ts                # ComparisonSession
│   ├── site-event.ts                # SiteEvent
│   └── task.ts                      # legacy document_tasks shape
└── lib/
    ├── utils.ts                     # cn() helper (clsx + tailwind-merge)
    ├── format.ts                    # formatBytes, formatDate, formatRelative, formatPercent
    ├── logger.ts                    # centralized logger
    └── site-status.ts               # aggregateStatusToPill() helper
```

## Routing

```text
/                                                          — LandingPage (public)
/login                                                     — LoginPage (public)
/register                                                  — RegisterPage (public)

# wrapped in <ProtectedRoute><AppShell/></ProtectedRoute>:
/dashboard                                                 — DashboardPage (root sites only)
/sites/new                                                 — SitesNewPage (supports ?parentId=)
/sites/:siteId                                             — SitePage (overview OR tabs)
/sites/:siteId/edit                                        — SiteEditPage (placeholder)
/sites/:siteId/documents/:docId                            — ContractPage
/sites/:siteId/documents/:docId/extractions/:requestId     — ExtractionRequestPage
/compare                                                   — ComparePage
/keys                                                      — KeysPage (admin)
/settings                                                  — SettingsPage (admin)
/profile                                                   — ProfilePage
*                                                          — Navigate → /dashboard
```

The legacy routes `/documents`, `/anonymization`, `/extraction` were removed entirely — that flow lives now inside the site/contract pages (upload dialog + free-form parameter request).

**Protected routes** use `<ProtectedRoute>` (in `App.tsx` it wraps `<AppShell/>`, and the actual pages render inside `<Outlet/>`). Add new protected routes as children of that outlet wrapper — never add auth checks inside page components.

### Site nesting & `/sites/:siteId` dual behavior

`construction_sites` is hierarchical via `parent_id` (microdistrict → ЖК → очередь → корпус). The IA collapses this onto a single route:

- **`/dashboard` shows only root sites** (`parent_id IS NULL`). Root means «ЖК / БЦ / складской комплекс целиком», not an individual очередь. `sitesApi.listForDashboard()` filters by `parent_id === null` in mocks; on the backend this is `?aggregate=true&roots=true`.
- **`/sites/:siteId` has two behaviors decided by data, not URL.** `SitePage` loads the full sites list, computes `hasChildren = some(s.parent_id === siteId)`, and renders one of:
  - `<SiteOverview/>` — intermediate screen: project header, 4 KPIs (готовы / требуют внимания / ср. удорожание / худшее удорожание), table of children with status pills and contract chips. Drill-down click on a child row goes to `/sites/:siteId` of the child — which again resolves to overview or card by the same rule.
  - `<SiteCardView/>` (in `SitePage.tsx`) — final card: tabs «Договоры / Удорожание / Сравнения / История / Аудит обработки», upload dialog. This is the existing leaf behavior.
- **`/sites/:siteId/edit`** is a deep-link placeholder for object editing (PATCH `/sites/:id` not yet on the backend).
- **`/sites/new?parentId=…`** is the alternative entry from the intermediate screen's «+ Новый объект» button — `SitesNewPage` reads `useSearchParams()` and prefills the parent select.

**Breadcrumbs** (`<Breadcrumbs/>` in `ui-domain`) appear on `/sites/:siteId` and `/sites/:siteId/edit`, never on the dashboard. The chain is built by walking `parent_id` upward through a `Map<id, site>` with cycle protection. Root segment is always «Объекты» → `/dashboard`. The last segment is non-clickable (it's the current page).

**Common-sense rule when adding new flows**: a list of sites at any depth uses the same shape (table on intermediate screen, cards on the dashboard) — only the depth changes. Avoid building a separate component tree per level.

## Design System

The visual language is **calm and dense**, not decorative. Hierarchy comes from borders and tonal surfaces, not shadows. Color carries semantic meaning, not mood.

### Tokens

`src/index.css` declares CSS variables for both themes under `:root, [data-theme="light"]` and `[data-theme="dark"]`, then exposes them as Tailwind utilities through `@theme inline`.

| Tailwind class | Purpose |
|---|---|
| `bg-page`, `bg-surface`, `bg-surface-sunken`, `bg-surface-hover`, `bg-section-header` | Three-layer surface depth |
| `text-fg`, `text-fg-secondary`, `text-fg-tertiary`, `text-fg-muted` | Body text scale (descending contrast) |
| `border-border-subtle`, `border-border-default`, `border-border-strong` | Border weights |
| `bg-accent`, `text-accent`, `bg-accent-soft`, `border-accent-border`, `text-accent-text` | Sage — «Готов», success, min in compare, active tabs, link-actions |
| `bg-action`, `text-action-text`, `bg-action-hover` | CTA buttons (anthracite light / inverted dark) |
| `bg-warning`, `bg-warning-strong`, `bg-warning-soft`, `border-warning-border`, `text-warning-text` | Above-threshold inflation, max in compare |
| `bg-neutral-soft`, `border-neutral-border`, `text-neutral-text`, `bg-neutral-dot` | Process «В работе», emotion-neutral states |
| `bg-danger`, `bg-danger-soft`, `text-danger-text` | Reserved for system errors only |
| `bg-info`, `bg-info-soft`, `text-info-text` | Reserved for informational hints |

**Names that diverge from the design doc**: the doc uses `text-primary` for body text. We use `text-fg` instead — this avoids a collision with shadcn's `text-primary` (which means CTA primary color in shadcn primitives). Treat `text-fg` as the body text token everywhere in our pages.

### Theme switching

Powered by `next-themes` configured with `attribute="data-theme"` (in `App.tsx`). Adds/removes `data-theme="light|dark"` on `<html>`, which makes the entire token tree swap. Default is dark (`<html lang="ru" data-theme="dark">` in `index.html`).

`<ThemeToggle/>` (in `src/components/layout/ThemeToggle.tsx`) flips the attribute. Use it to manually test both themes.

### Typography

- `font-sans` — Inter / Manrope / Geist Variable. Used for everything: tables, body, buttons, numbers.
- `font-serif` — Cormorant Garamond. Used **only** on key H1 headings (Объекты, имя объекта, имя договора, Сравнение договоров) and the landing page. Not on section headers, not in cards.
- Allowed weights: `regular (400)` and `medium (500)`. Heavier weights are forbidden — `index.css` forces `font-weight: 500` on all `h1..h6` and the design language doesn't use `font-bold`.
- Size scale (Tailwind classes): `text-2xs (11px)` for uppercase eyebrows, `text-xs (12px)` for status pills, `text-sm (13px)` for tables/secondary, `text-base (14px)` for primary body, `text-md (15px)` for card titles, `text-lg (18px)` for H3, `text-xl (22px)` for KPI numbers, `text-2xl/3xl` for H1.

### Borders

Default border thickness is **0.5px** for crispness on high-DPI screens. The `@layer base` rules in `index.css` override every Tailwind `border` / `border-{x,y,t,r,b,l}` utility to `0.5px`. Keep `border-2` for explicit emphasis (active tabs, alerts). `border-0` zeroes it out.

For ad-hoc semantic borders without using a Tailwind color utility, use the custom utilities `hairline`, `hairline-strong`, `hairline-dashed` (defined in `index.css`).

### Shadows

Hierarchy is built from borders and tonal surfaces, **not shadows**. The only allowed shadows are `shadow-popover`, `shadow-modal`, `shadow-focus` — for elements that genuinely sit above content. Tailwind's `shadow-md/lg/xl` should not be used.

### Don't

- No arbitrary hex values in JSX — only token-driven utilities. If you need a new color, extend the system, don't introduce a one-off.
- No `font-bold` (700). Only `font-medium` (500).
- No `shadow-md/lg/xl`.
- No icons larger than 24 px in product UIs (14–18 px inline, 22–32 px for cover-icons).
- No `dark glassmorphism` — that language was retired with the redesign.

## State Management

| Layer | Tool | Purpose |
|-------|------|---------|
| Server state | TanStack Query | Fetching, caching, polling extraction requests |
| Auth/session | Context API (over Query) | `AuthContext` is a thin adapter — see below |
| Local UI state | useState / useReducer | Forms, modals, dialogs, ephemeral UI |

**Rules:**
- Do not use Context API for server data — use TanStack Query.
- Polling extraction requests is done via `refetchInterval: (q) => isActive ? 1500 : false`. Polling stops automatically on terminal status (`completed`/`failed`).
- `AuthContext` is a thin adapter over `useUser()` — exposes derived auth flags (`isAuthenticated`, `isLoading`) and actions (`login()`, `logout()`, `register()`). The `user` object is owned by TanStack Query.
- Avoid `useEffect` to sync state from props or queries. Derive with `useMemo`, or remount via `key=` / conditional rendering instead. Example: `UploadDocumentDialog` is conditionally mounted (`{open && <Dialog/>}`) so its initial state initializes fresh on open without an `useEffect` resync.

## Authentication

**Flow:**
1. App mount → `AuthProvider` calls `GET /api/v1/auth/me`.
2. Success → stores `{ id, email, full_name, role, org_id }` in `AuthContext`.
3. 401 → `isAuthenticated = false`, `AuthContext` navigates to `/`.
4. Login/Register → backend sets HTTP-only cookies, then re-call `/api/v1/auth/me`.
5. Logout → `POST /api/v1/auth/logout`, clear query cache, navigate to `/`.

**Endpoints:**
```
POST /api/v1/auth/login      { email, password }
POST /api/v1/auth/register   { name, inn?, email, password, full_name }
POST /api/v1/auth/logout
GET  /api/v1/auth/me         → { id, email, full_name, role, org_id }
```

**Role-based rendering:**
```tsx
const { user } = useAuth();
if (user?.role !== 'admin') return null;
```

Admin-only pages (`/keys`, `/settings`) gate with this pattern; non-admin sees `EmptyState` with a “раздел доступен только администраторам” message.

## API Client & Error Handling

**Axios instance** (`src/services/api/client.ts`):
- `withCredentials: true` — always include cookies.
- Base URL from `VITE_API_URL` env var (empty = relative paths for proxy).

**Interceptor rules** (centralized, in `client.ts`):
- `401` → **not** handled by the interceptor; `AuthContext` navigates to `/` (with `replace: true`) on 401 to avoid redirect loops.
- `403` → `toast.error('Доступ запрещён')`.
- `400` → `toast.error(message)` — skipped for `/auth/login`, `/auth/register`, `/auth/logout` (they show inline errors). `/auth/me` errors **do** surface here.
- `5xx` → `toast.error('Ошибка сервера. Попробуйте позже.')`.
- Do NOT add per-component try/catch for `403`, `400`, `5xx` — they are handled globally by the interceptor.

**Toast notifications** — `toast` from shadcn/ui `sonner`.

## Mock Layer

Most domain endpoints aren't ready on the backend yet, so the frontend ships a deterministic mock layer.

`src/services/mocks/`:
- **`index.ts`** exports `USE_MOCKS = !PROD && VITE_USE_MOCKS !== "false"` and helpers `mockDelay`, `mockReject`. Default in dev = on. To talk to the real backend in dev, set `VITE_USE_MOCKS=false` in `.env.local`.
- **`data.ts`** holds seed data: 8 construction sites with hierarchy, 9 documents with bundle structure (contract root + estimate + TZ children), 10 extraction keys (8 system + 2 tenant), ~30 extracted values, 3 extraction requests, 2 saved comparisons, 8 site events. All IDs are deterministic UUID-like strings for stable cross-references.

Each service in `src/services/api/*.ts` checks `if (USE_MOCKS)` at the top of every method and either returns mock data or hits the real endpoint.

`auth.fetchMe()` in mock mode reads/writes `localStorage["mock-auth-session"]` and rejects with an axios-shaped 401 error so the existing `AuthContext` 401 handler still triggers correctly.

When wiring a new endpoint, the pattern is: keep the real `apiClient.get/post(...)` branch as the source of truth, and add a parallel `if (USE_MOCKS) return mockDelay(...)` branch reading or mutating the seed data so UIs work end-to-end without the backend.

## Logging

Never use `console.log` in business logic or components. Use the centralized `logger` utility:

```ts
import { logger } from '@/lib/logger';

logger.info('Auth session initialized', { userId: user.id });
logger.warn('Token refresh failed');
logger.error('Upload failed', { docId, error });
```

**Behavior:**
- `development` — all levels with context.
- `production` — only `warn` and `error`.

> `src/lib/logger.ts` — centralized logger implementation.

## Style Guide

### TypeScript
- Strict mode enabled — no `any`, no `@ts-ignore` without a comment explaining why.
- Prefer `interface` for object shapes, `type` for unions and computed types.
- All API response shapes must be typed in `src/services/api/*.ts`.

### Components
- Functional components only.
- Props interfaces named `{ComponentName}Props`.
- Default export for page/route components, named export for reusable UI.
- Build product UI with **`src/components/ui-domain/*`** primitives (`Button`, `Surface`, `PageHeader`, `KpiCard`, `StatusPill`, `ContractKindChip`, `EmptyState`, `Tabs`). Reach into `src/components/ui/*` (shadcn) only when one of those primitives doesn't exist for the use case.

### Styling
- Tailwind utility classes — no inline `style={{}}` except for dynamic values not achievable with Tailwind (e.g., dynamic widths from data).
- Use `cn()` from `@/lib/utils` for conditional classes.
- shadcn/ui components are in `src/components/ui/` — add new ones via `npx shadcn add <component>`, never edit generated files manually.
- Prefer semantic tokens (`bg-surface`, `text-fg-secondary`, `border-border-subtle`) over palette utilities. Don't reach for `bg-zinc-900` or `text-white` — those break the theme.

### Imports
- Use `@/` alias for all project imports.
- Group imports: external libs → internal `@/` → relative.

### Comments
- Write comments only when the WHY is non-obvious.
- Russian is fine for product-domain comments where it clarifies intent — both languages are present in the codebase.

## Environment Variables

```
VITE_API_URL=         # Backend base URL. Empty = relative (uses Vite proxy in dev)
VITE_USE_MOCKS=       # "false" to disable mocks in dev. Default: mocks on in dev, off in prod.
```

Dev proxy (`vite.config.ts`): `/api` → `http://localhost:8080`.

## shadcn/ui

Add components:
```bash
npx shadcn add <component-name>
```

Config: `components.json` (style: `radix-nova`, baseColor: `neutral`, CSS variables enabled). The shadcn CSS variables (`--primary`, `--background`, etc.) are mapped to our design tokens in `index.css @theme inline` so shadcn primitives inherit the new theme without modification.

Never modify files in `src/components/ui/` manually — they are managed by shadcn CLI. ESLint `react-refresh/only-export-components` is disabled for that directory in `eslint.config.js`.

## Multi-Tenancy

The backend enforces tenant isolation via `organization_id`. The frontend:
- Never constructs API URLs with `org_id` manually — it is extracted from the JWT on the backend.
- `org_id` is available in `AuthContext` via `user.org_id` for display purposes only.
- Never pass `org_id` as a request body field — the backend derives it from the token.

## Information Architecture

The hierarchy of entities is **organization → construction site → document → parameters**.

- A **site** (`construction_sites`) is a project (ЖК / очередь / корпус). Sites can have a `parent_id` for hierarchy. **Only root sites** (`parent_id IS NULL`) appear on `/dashboard`; nested sites are reached by drill-down through the parent's intermediate screen (`/sites/:rootId`). The same `/sites/:siteId` route renders an overview (children list + KPIs) for non-leaf sites and a tabbed card for leaves — see Routing § Site nesting.
- A **document** (`documents`) is a file uploaded to a site. The user-facing dimension is `contract_kind` (`gp | construction_control | finishing | estimate | tz | responsibility_matrix`). Documents are grouped into **bundles** by `bundle_id` — a contract `.docx` is the bundle root, with estimate `.xlsx` and TZ `.pdf` as children.
- An **extraction key** (`extraction_keys`) is a semantic parameter (e.g., «Аванс», «Срок выполнения, мес.»). Keys can be system-wide (`organization_id IS NULL`) or tenant-owned. UI shows `display_name`, never the machine `key_name`.
- A **value** (`document_extracted_data`) is one extracted answer keyed by `(document_id, key_id)`.
- An **extraction request** (`extraction_requests`) is a user-initiated extraction with a list of free-form questions and an `anonymize` flag. Multiple parallel requests against the same document are supported. Each request goes through `convert → [anonymize] → resolve_keys → extract`.

UX principles, distilled from the IA document:

1. **Data-First.** Show data, not the processing pipeline. Tables of parameters live above forms; status pills are short labels, not progress bars.
2. **Progressive disclosure.** Hide pipeline stages, anonymization artifacts, machine `key_name`s by default. They live behind «Аудит обработки» (admin-only) on the site card.
3. **Invisible anonymization.** Anonymization is a technical step for external LLM compatibility, not a feature. There is no `/anonymization` route.
4. **Site is the container, contract is the unit of work.** Comparison runs at contract level (within one `contract_kind`), not at site level.

## Documents & Bundles

**Document** (`src/types/document.ts`) — base unit, two kinds:
- `artifact_kind === null && parent_id === null` — user-uploaded original. Has `contract_kind` and `bundle_id`.
- `artifact_kind !== null && parent_id !== null` — processing artifact (`convert_md`, `anonymize_doc`, `anonymize_entities`). Used by the future Audit tab.

**Bundle** (`src/types/document.ts → ContractBundle`) — frontend-side grouping of bundle root + child files for one contract. Built by `documentsApi.bundlesForSite(siteId)` from a flat documents list using `bundle_id` (root self-references its own id; children point at the root). Used by `ContractsTab` and `ContractFiles`.

**Display naming** — show `doc.display_name ?? doc.file_name` in headers, with the raw `file_name` as a small caption. Estimate / TZ children get type labels («Смета», «ТЗ», «Матрица»).

**Download pattern** — always via `documentsApi.getPresignedUrl(documentId, true)`:
```ts
const url = await documentsApi.getPresignedUrl(documentId, true)
const a = document.createElement('a')
a.href = url
a.download = fileName
document.body.appendChild(a)
a.click()
document.body.removeChild(a)
```
`storage_path` is never returned by the API — always presigned URLs.

## Extraction Flow

The legacy `/extraction` wizard is gone. The new flow is in-place on the contract card.

**On `ContractPage`:**
- Sidebar widget `RequestParameterForm` accepts a single free-form question + `anonymize` toggle (default ON) and posts via `extractionApi.initiate(documentId, { questions: [q], anonymize })`.
- `ExtractionRequestsList` shows the document's history with TanStack Query `refetchInterval: (q) => hasActiveRequest ? 1500 : false`. Polls until terminal.
- Clicking a request opens `/sites/:siteId/documents/:docId/extractions/:requestId` (`ExtractionRequestPage`), which displays status, asked questions, answers, `resolved_schema`, `error_message`, and a «Повторить запрос» action.

**Extraction API** (`src/services/api/extraction.ts`):

```ts
extractionApi.initiate(documentId, { questions, anonymize? })
  // POST /api/v1/documents/:id/extract
  // body: { questions: string[], anonymize?: boolean }   // anonymize defaults to true
  // → { extraction_request_id, status }

extractionApi.get(extractionRequestId)
  // GET /api/v1/extraction-requests/:id
  // → ExtractionRequest

extractionApi.listForDocument(documentId)
  // GET /api/v1/documents/:id/extraction-requests  (planned endpoint)
  // → ExtractionRequest[]

extractionApi.answersForDocument(documentId)
  // GET /api/v1/documents/:id/answers  (planned endpoint)
  // → ExtractedDataItem[]
```

**Backend pipeline** runs `convert → [anonymize] → resolve_keys → extract` per request. Multiple parallel `extraction_requests` against the same document are supported — each gets its own `resolve_keys`/`extract` answers. The `convert`/`anonymize` artifacts are document-scoped singletons reused across requests.

**Statuses** (`src/types/extraction.ts → ExtractionRequestStatus`):
`pending → running → completed | failed`.

## Sites API

`src/services/api/sites.ts`:

```ts
sitesApi.list()                            // GET /api/v1/sites → ConstructionSite[]
sitesApi.listForDashboard()                // → SiteListItem[] — ROOT SITES ONLY (parent_id IS NULL); aggregates: contract_kinds, aggregate_status, inflation_pct, last_activity_at
sitesApi.listChildren(parentId)            // → SiteListItem[] — direct children of :parentId, used by SiteOverview intermediate screen
sitesApi.get(siteId)                       // → ConstructionSite
sitesApi.create({ name, parent_id?, cover_image_path? })
sitesApi.update(siteId, partial)
sitesApi.delete(siteId)
```

`SiteAggregateStatus` (`ready | processing | attention | empty`) maps to the planned `v_site_status` VIEW. Use `aggregateStatusToPill()` from `src/lib/site-status.ts` to convert it to `{ tone, label }` for `<StatusPill/>`.

## Documents API

`src/services/api/documents.ts`:

```ts
documentsApi.list()                          // → Document[]
documentsApi.listBySite(siteId)              // → Document[]
documentsApi.bundlesForSite(siteId)          // → ContractBundle[] (frontend grouping)
documentsApi.get(docId)                      // → Document
documentsApi.upload({ file, siteId, contractKind, bundleId })  // → Document
documentsApi.delete(docId)
documentsApi.getPresignedUrl(docId, download = false)  // → string
```

> Breaking change vs. previous version: `upload(file, siteId)` was replaced by `upload({ file, siteId?, contractKind?, bundleId? })`. The object form supports the new contract-bundle workflow.

## Tasks API

`src/services/api/tasks.ts` is kept for the future «Аудит обработки» tab on the site card. In mock mode it returns an empty array. The API is:

```ts
tasksApi.getByDocument(documentId)
tasksApi.getByDocuments(documentIds[])
tasksApi.start(documentId, moduleName)
```

`TaskModule` values: `"convert" | "anonymize" | "resolve_keys" | "extract"`.

## Comparison Flow

`/compare` is a two-pane view:
- Left pane — `contract_kind` selector, search, list of candidate documents (root documents of that kind) with checkboxes (2–5 selections).
- Right pane — table where rows are intersected `extraction_keys` and columns are selected documents. For numeric `data_type`, min is highlighted via `bg-accent-soft text-accent-text`, max via `bg-warning-soft text-warning`. Empty cells render an «извлечь» link (placeholder for a per-cell `extraction_request`).
- «Показать все ключи» extends rows to include keys present in only some documents (with empty cells).

Saving a comparison and Excel export are stubbed buttons until `comparison_sessions` is added on the backend.

Entry points:
- From `ContractPage` — «Сравнить с другими [тип]» → `/compare?baseDocId=…&kind=…`.
- From `SitePage > Сравнения` — list of saved sessions; clicking opens `/compare?session=…`.

## Keys Registry

`/keys` (`KeysPage`) — table of `extraction_keys`. Filter «Все / Системные / Моей организации». Member roles see this in read-only via the document's parameter view; admins can:
- Create a new tenant key (form: `key_name` machine name, `display_name`, `source_query`, `data_type`).
- Edit a tenant key's `display_name` and `source_query`.
- Delete a tenant key (cascade-deletes its values from `document_extracted_data` — confirm dialog).

System keys (`organization_id IS NULL`) are read-only.

## Audit / Edit / Settings — placeholders

These surfaces ship as `EmptyState` placeholders or disabled actions, awaiting backend support:

- `SitePage > Аудит обработки` — needs `document_tasks` API + artifact listing.
- `/sites/:siteId/edit` (`SiteEditPage`) — `EmptyState` placeholder; needs PATCH `/sites/:id`.
- `ComparePage` save / export — needs `comparison_sessions`.
- `SettingsPage` (admin) — needs PATCH `/organizations/me`, `/users` invites, threshold storage in `organizations.settings`.
- `ProfilePage` change password — needs POST `/auth/change-password`.

## Testing

**Stack (planned):** Vitest + @testing-library/react + @testing-library/user-event.

**What to test (priority order):**
1. Axios interceptor logic (401 → logout, 403/5xx → toast).
2. Form validation (login, register, sites/new, request-parameter form).
3. Role-based rendering (`admin`-only components).
4. TanStack Query hooks (mock via `msw` or `vi.fn`).
5. Mock layer behavior parity with real API contract.

**What NOT to test:** CSS classes, pixel-level layout, shadcn/ui internals.

**Test file location:** Co-located with source — `Component.test.tsx` next to `Component.tsx`.
