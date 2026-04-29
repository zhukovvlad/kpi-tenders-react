# CLAUDE.md — react-kpi-tenders

Frontend SaaS-платформы для анализа строительных тендеров. Multi-tenant, React 19 + TypeScript + Vite.

> Known technical debts are tracked in [`TECH_DEBT.md`](./TECH_DEBT.md).

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
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui primitives (do not modify manually)
├── context/            # Global React context (auth session, theme, sidebar)
├── hooks/              # Custom hooks (useAuth, useUser)
├── pages/              # Route-level page components
│   ├── LandingPage.tsx
│   ├── DashboardPage.tsx
│   ├── DocumentsPage.tsx
│   └── AnonymizationPage.tsx
├── services/
│   └── api/
│       ├── client.ts       # Axios instance (base URL, cookies, interceptors)
│       ├── auth.ts         # Auth API methods
│       ├── documents.ts    # Documents CRUD + presigned URL
│       └── tasks.ts        # Tasks API (getByDocument, getByDocuments, start)
├── types/
│   ├── auth.ts             # User, AuthContextValue
│   ├── document.ts         # Document, ArtifactKind
│   └── task.ts             # Task, TaskModule, TaskStatus, TaskResultPayload
├── lib/
│   ├── utils.ts            # cn() helper (clsx + tailwind-merge)
│   └── logger.ts           # Centralized logger
└── App.tsx                 # BrowserRouter + Routes
```

## Routing

```text
/                     — LandingPage (public)
/dashboard            — DashboardPage (protected)
/documents            — DocumentsPage (protected)
/anonymization        — AnonymizationPage (protected)
```

> Planned (not yet registered in `App.tsx`):
> `/login`, `/register`, `/sites`, `/sites/:id`, `/users`, `/profile`

**Note:** The `/anonymization` route uses a single page-level polling query (`queryKey: ["tasks", "batch", ...]`) that covers all documents. `queryClient.invalidateQueries({ queryKey: ["tasks", "batch"] })` is used after starting a task to trigger an immediate refetch.

**Protected routes** use `<ProtectedRoute>`. Add new protected routes via the same wrapper — never add auth checks inside page components.

## State Management

| Layer | Tool | Purpose |
|-------|------|---------|
| Server state | TanStack Query | Fetching, caching, polling `document_tasks` |
| Global client state | Context API | Auth session, theme, sidebar state |
| Local UI state | useState / useReducer | Forms, modals, ephemeral UI |

**Rules:**
- Do not use Context API for server data — use TanStack Query.
- Polling for `document_tasks` statuses is done via `refetchInterval` in TanStack Query.
- `AuthContext` is a thin adapter over `useUser()` — it exposes derived auth flags (`isAuthenticated`, `isLoading`) and actions (`login()`, `logout()`, `register()`). The `user` object is owned by TanStack Query; `AuthContext` re-exposes it but does not store server state directly.

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

**Toast notifications** — use `toast` from shadcn/ui `sonner` component.

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

> `src/lib/logger.ts` — centralized logger implementation. Keep `console.*` wrapped with environment-based checks here.

## Testing

**Stack:** Vitest + @testing-library/react + @testing-library/user-event

**What to test (priority order):**
1. Axios interceptor logic (401 → logout, 403/5xx → toast).
2. Form validation (login, register).
3. Role-based rendering (`admin`-only components).
4. TanStack Query hooks (mock via `msw` or `vi.fn`).

**What NOT to test:** CSS classes, pixel-level layout, shadcn/ui internals.

**Test file location:** Co-located with source — `Component.test.tsx` next to `Component.tsx`.

## Style Guide

### TypeScript
- Strict mode enabled — no `any`, no `@ts-ignore` without a comment explaining why.
- Prefer `interface` for object shapes, `type` for unions and computed types.
- All API response shapes must be typed in `src/services/api/*.ts`.

### Components
- Functional components only — no class components.
- Props interfaces named `{ComponentName}Props`.
- Default export for page/route components, named export for reusable UI components.

```tsx
// ✅
export interface SiteCardProps { siteId: string; name: string; }
export function SiteCard({ siteId, name }: SiteCardProps) { ... }

// Page component
export default function SitesPage() { ... }
```

### Styling
- Tailwind utility classes — no inline `style={{}}` except for dynamic values not achievable with Tailwind.
- Use `cn()` from `@/lib/utils` for conditional classes.
- shadcn/ui components are in `src/components/ui/` — add new ones via `npx shadcn add <component>`, never edit generated files manually.
- Design language: dark glassmorphism (`bg-[#020617]`, backdrop-blur, white/opacity utilities).

### Imports
- Use `@/` alias for all project imports (configured in `vite.config.ts` and `tsconfig.json`).
- Group imports: external libs → internal `@/` → relative.

### Comments
- Write comments only when the WHY is non-obvious.
- English only for comments and variable names.

## Environment Variables

```
VITE_API_URL=   # Backend base URL. Empty = relative (uses Vite proxy in dev)
```

Dev proxy (`vite.config.ts`): `/api` → `http://localhost:8080`.

## shadcn/ui

Add components:
```bash
npx shadcn add <component-name>
```

Config: `components.json` (style: `nova`, baseColor: `zinc`, CSS variables enabled).

Never modify files in `src/components/ui/` manually — they are managed by shadcn CLI.

## Multi-Tenancy

The backend enforces tenant isolation via `organization_id`. The frontend:
- Never constructs API URLs with `org_id` manually — it is extracted from the JWT on the backend.
- `org_id` is available in `AuthContext` via `user.org_id` for display purposes only.
- Never pass `org_id` as a request body field — the backend derives it from the token.

## Documents & Artifacts

**Document** (`src/types/document.ts`) — base upload unit. Two kinds:
- `artifact_kind === null` — user-uploaded file. Shown in `DocumentsPage`.
- `artifact_kind !== null` — processing artifact (`convert_md`, `anonymize_doc`, `anonymize_entities`). Has `parent_id` pointing to the source document. **Never shown in `DocumentsPage`** (backend filters `WHERE parent_id IS NULL`).

**Artifact access**:
- `GET /api/v1/documents?parent_id=:uuid` — fetch artifacts of a document
- `GET /api/v1/documents/:id/url?download=true` — presigned MinIO URL for download

**`TaskResultPayload`** (`src/types/task.ts`) stores artifact document UUIDs, not storage paths:

```ts
export interface TaskResultPayload {
  // convert worker
  md_document_id?: string
  char_count?: number
  section_count?: number
  // anonymize worker
  anonymized_document_id?: string
  entities_map_document_id?: string
  entity_count?: number
}
```

**Download pattern** — always via `documentsApi.getPresignedUrl(documentId, true)`:
```ts
const url = await documentsApi.getPresignedUrl(documentId, true)
const a = document.createElement('a')
a.href = url
a.download = fileName  // use a meaningful name, not empty string
document.body.appendChild(a)
a.click()
document.body.removeChild(a)
```

Never call `tasksApi.getResultUrl` — it was removed. `storage_path` is not part of the `Document` interface and is never returned by the API — always use presigned URLs for downloads.

## Tasks API

`src/services/api/tasks.ts` — three methods:

```ts
tasksApi.getByDocument(documentId)         // GET /api/v1/tasks?document_id=:id
tasksApi.getByDocuments(documentIds[])     // GET /api/v1/tasks?document_ids=id1,id2,...
tasksApi.start(documentId, moduleName)     // POST /api/v1/tasks
```

`getByDocuments` is used by `AnonymizationPage` for page-level batch polling (one request for all visible documents). Task polling is done via TanStack Query `refetchInterval` callback — polling stops automatically when all tasks are in a terminal state (`completed` or `failed`) and no convert-done documents are missing their anonymize task.
