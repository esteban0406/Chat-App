# Frontend — Next.js Client

Next.js 16 (App Router) + React 19 + Tailwind v4. Runs on port **3000**.

## Dev Scripts

```bash
pnpm dev        # Next.js dev server with HMR
pnpm build      # Production build
pnpm start      # Serve production build
pnpm lint       # ESLint
pnpm test       # Jest (jsdom environment)
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # HTML shell, loads global CSS
│   ├── page.tsx                # Redirect → /home
│   ├── (auth)/                 # Route group — no shared layout
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── (main)/                 # Protected route group
│       ├── layout.tsx          # Connects socket, mounts contexts
│       ├── home/page.tsx       # Friend + server-invite dashboard
│       └── servers/[serverId]/
│           └── channels/[channelId]/page.tsx
├── ui/                         # React components (colocated by feature)
│   ├── channels/
│   ├── messages/
│   ├── servers/
│   ├── user/
│   ├── home/
│   ├── voice/                  # LiveKit voice/video UI
│   ├── common/                 # Modals, drawers, shared primitives
│   └── layout/
├── lib/                        # Non-component utilities
│   ├── socket.ts               # socket.io singleton
│   ├── useNotificationSocket.ts
│   ├── backend-client.ts       # fetch wrapper (injects Bearer token)
│   ├── auth.ts                 # login / register / logout / getMe
│   ├── definitions.ts          # Shared TypeScript types
│   ├── CurrentUserContext.tsx
│   ├── NotificationContext.tsx
│   ├── ServersContext.tsx
│   ├── FriendsContext.tsx
│   └── useServerPermissions.ts
├── test/                       # Jest unit tests
├── public/
├── globals.css                 # Tailwind v4 entry point
├── next.config.ts
├── tailwind.config.ts
├── jest.config.ts
└── tsconfig.json               # Path alias: @/* → project root
```

## Key Conventions

### Route Groups
- `(auth)/` — unauthenticated pages (login, signup); no shared layout beyond the HTML shell.
- `(main)/` — all protected pages. The `layout.tsx` here:
  - Calls `getMe()` and redirects to `/login` if unauthenticated.
  - Connects the socket singleton (reads token from localStorage).
  - Wraps children in all context providers.

### "use client" Boundary
Interactive components (forms, socket hooks, context consumers) must declare `"use client"` at the top. Prefer keeping page files as Server Components when possible and pushing interactivity into leaf components.

### HTTP Requests
Use `backendFetch(path, options?)` from `lib/backend-client.ts`. It:
- Prepends `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:4000`).
- Injects `Authorization: Bearer <token>` from localStorage.
- Throws a typed error with the NestJS error message on non-2xx responses.

Never construct the backend URL manually in components.

### Authentication (`lib/auth.ts`)
```typescript
login(email, password)          // POST /api/auth/login → stores token
register(email, password, name) // POST /api/auth/register → stores token
logout()                        // POST /api/auth/logout → removes token
getMe()                         // GET /api/auth/me (requires token)
isAuthenticated()               // checks localStorage for token
```
Token key in localStorage: `accessToken`.

### Socket.io Singleton (`lib/socket.ts`)
```typescript
const socket = io(NEXT_PUBLIC_BACKEND_URL, {
  transports: ["websocket"],
  autoConnect: false,
  query: { token: getToken() }
});
```
- Connected once in `(main)/layout.tsx` on mount.
- Import `socket` from `lib/socket` in any client component; do **not** create new instances.
- Disconnect and reconnect if the token changes (e.g., after re-login).

### Notification Hook (`lib/useNotificationSocket.ts`)
```typescript
useNotificationSocket({
  onFriendRequestReceived: (data) => { /* update local state */ },
  onServerInviteReceived: (data) => { /* update local state */ },
  // ... other handlers
});
```
- Call this hook in components that need real-time event callbacks.
- Uses **ref-based callback storage** — callbacks are always current without re-subscribing the socket listener. Do not break this pattern by moving the ref inside the effect.

### Global State (React Context)
| Context | What it holds |
|---------|--------------|
| `CurrentUserContext` | Logged-in user object |
| `NotificationContext` | Pending friend requests + server invites |
| `ServersContext` | List of servers the user belongs to |
| `FriendsContext` | Friends list |

All four are mounted in `(main)/layout.tsx`. Consume with the matching `use*` hooks exported from each file.

### Styling
- **Tailwind v4** via `globals.css` / `postcss.config.mjs` — no `tailwind.config.ts` class list needed.
- Component libraries: `@headlessui/react` for accessible overlays (dialogs, menus), `lucide-react` for icons.
- UI language is **Spanish** — all user-facing labels, error messages, and button text must be in Spanish.

### Path Alias
`@/*` resolves to the project root (same directory as `tsconfig.json`). Use it for all non-relative imports:
```typescript
import { backendFetch } from "@/lib/backend-client";
import type { User } from "@/lib/definitions";
```

## Environment Variables

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000   # base URL for API + socket
```

Prefix `NEXT_PUBLIC_` is required for variables that must be available in browser bundles.

## Image Configuration (`next.config.ts`)

Remote image domains are allowlisted. When adding new external image sources (e.g., a new CDN), add a `remotePatterns` entry in `next.config.ts`.

## Testing

Jest config (`jest.config.ts`):
- Environment: `jsdom`
- CSS modules → `identity-obj-proxy` (class names returned as-is)
- Other static assets → empty string mock
- Tests live in `test/` or alongside components as `*.test.tsx`

Run a single test file:
```bash
pnpm test -- --testPathPattern=auth
```
