# CLAUDE.md — react-kpi-tenders

Frontend SaaS-платформы для анализа строительных тендеров. Multi-tenant, React 19 + TypeScript + Vite.

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
├── hooks/              # Custom hooks (useAuth, future: useToast, etc.)
├── pages/              # Route-level page components
├── services/
│   └── api/
│       ├── client.ts   # Axios instance (base URL, cookies, interceptors)
│       └── auth.ts     # Auth API methods
├── lib/
│   └── utils.ts        # cn() helper (clsx + tailwind-merge)
└── App.tsx             # BrowserRouter + Routes
```

## Routing

```
/                  — LandingPage (public)
/login             — Login page
/register          — Register organization page
/dashboard         — Dashboard (protected)
/sites             — Construction sites registry
/sites/:id         — Site detail: nested object tree + documents
/tasks             — AI task monitoring (document_tasks polling)
/users             — Team management (admin only)
/profile           — User settings, password change, session management
```

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
- `AuthContext` stores only: `isAuthenticated`, `isLoading`, `user` (from `/api/v1/auth/me`), `login()`, `logout()`, `register()`.

## Authentication

**Flow:**
1. App mount → `AuthProvider` calls `GET /api/v1/auth/me`.
2. Success → stores `{ id, email, full_name, role, org_id }` in `AuthContext`.
3. 401 → `isAuthenticated = false`, redirect to `/login`.
4. Login/Register → backend sets HTTP-only cookies, then re-call `/api/v1/auth/me`.
5. Logout → `POST /api/v1/auth/logout`, clear context state.

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
- `401` → call `logout()` from `AuthContext` + redirect `/login`.
- `403` → `toast.error('Access denied')`.
- `400` → `toast.error(response.data.message ?? 'Invalid request')`.
- `5xx` → `toast.error('Server error. Please try again later.')`.
- Do NOT add per-component try/catch for network errors that are handled by the interceptor.

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

> `src/lib/logger.ts` — to be created. Wrap `console.*` with env check.

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
