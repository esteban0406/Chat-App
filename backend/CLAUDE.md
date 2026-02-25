# Backend — NestJS API

NestJS + Prisma + PostgreSQL. Runs on port **4000** with global prefix `/api`.

## Dev Scripts

```bash
pnpm start:dev      # watch mode (hot-reload)
pnpm start:test     # loads .env.test instead of .env
pnpm build          # prisma generate + nest build → dist/
pnpm lint           # ESLint
pnpm test           # Jest unit tests
pnpm test:e2e       # NestJS integration tests (supertest)
```

## Project Structure

```
src/
├── main.ts                      # Bootstrap: port 4000, /api prefix, global ValidationPipe
├── app.module.ts                # Root module — wires all feature modules
└── modules/
    ├── auth/                    # JWT + bcrypt login/register
    │   ├── strategies/          # LocalStrategy (credentials), JwtStrategy (token)
    │   ├── guards/              # LocalAuthGuard, JwtAuthGuard
    │   └── dto/                 # RegisterDto
    ├── gateway/                 # Socket.io WebSocket gateway
    │   ├── chat.gateway.ts
    │   ├── gateway.module.ts    # Exports ChatGateway
    │   └── dto/                 # MessageDto
    ├── users/
    │   ├── friendships/         # Friend request logic
    │   └── cloudinary/          # Avatar upload (CloudinaryModule)
    ├── servers/
    │   ├── roles/               # Role CRUD + permission constants
    │   └── invites/             # ServerInvite CRUD
    ├── channels/                # TEXT / VOICE channels
    ├── messages/                # Message create/list
    ├── livekit/                 # Voice token minting
    └── database/
        └── prisma.service.ts    # PrismaClient singleton (pg adapter)
```

## Key Conventions

### Module Pattern
Each feature module follows the same shape:
- `*.module.ts` — imports, providers, exports
- `*.service.ts` — business logic, injects `PrismaService`
- `*.controller.ts` — HTTP endpoints, uses guards + decorators
- `dto/` — class-validator DTOs for request bodies

Modules that emit WebSocket events must import `GatewayModule`:
```typescript
@Module({ imports: [GatewayModule, ...], ... })
```

### Authentication
- `JwtAuthGuard` protects routes: `@UseGuards(JwtAuthGuard)`.
- Current user is extracted with the `@CurrentUser()` custom decorator.
- JWT expiry: 7 days. Secret from `JWT_SECRET` env var.
- Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

### RBAC (Server Permissions)
- `@UseGuards(ServerPermissionGuard)` + `@RequirePermission(Permission.MANAGE_ROLES)` on controller methods.
- `Permission` enum: `CREATE_CHANNEL`, `DELETE_CHANNEL`, `DELETE_SERVER`, `INVITE_MEMBER`, `REMOVE_MEMBER`, `MANAGE_ROLES`.
- Server owner bypasses all permission checks.

### WebSocket Gateway (`chat.gateway.ts`)
- **Connection**: JWT read from `client.handshake.query.token`; client joins `user:<userId>` room.
- **Rooms**: Clients join/leave channel rooms with `joinChannel` / `leaveChannel` messages.
- **Targeted notifications**: `gateway.emitToUser(userId, event, data)` — used by HTTP controllers after mutations.
- **Channel broadcast**: `gateway.emitToChannel(channelId, event, data)`.
- **Server-wide**: `gateway.broadcast(event, data)`.

### Real-time Notification Events
| Event | Emitted to |
|-------|-----------|
| `friendRequest:received` | receiver |
| `friendRequest:responded` | original sender |
| `friendRequest:cancelled` | receiver |
| `friendship:removed` | the other user |
| `serverInvite:received` | receiver |
| `serverInvite:accepted` | sender |
| `serverInvite:rejected` | sender |
| `serverInvite:cancelled` | receiver |

### Validation
Global `ValidationPipe` with `whitelist: true, transform: true` is applied in `main.ts`. All request bodies should have a corresponding DTO class with `class-validator` decorators.

### Rate Limiting
`ThrottlerModule`: 120 requests / 60 s in development/production, 1200 in test mode.

## Database (Prisma)

Schema lives at `prisma/schema.prisma`. Key models:

| Model | Notes |
|-------|-------|
| `User` | email, username, avatarUrl, status (ONLINE/OFFLINE) |
| `Account` | OAuth provider accounts |
| `Friendship` | senderId, receiverId, status (PENDING/ACCEPTED/REJECTED) |
| `Server` | name, iconUrl, ownerId |
| `Member` | userId + serverId + optional roleId |
| `Role` | name, color, permissions (array of Permission enum) |
| `Channel` | name, type (TEXT/VOICE), serverId |
| `Message` | content, authorId, channelId |
| `ServerInvite` | senderId, receiverId, serverId, status |

Run migrations:
```bash
npx prisma migrate dev --name <migration-name>   # development
npx prisma migrate deploy                         # production/CI
npx prisma studio                                 # GUI browser
```

After schema changes always run `prisma generate` (included in `pnpm build`).

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=...
CORS_ORIGIN=http://localhost:3000        # comma-separated for multiple origins
PORT=4000
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NODE_ENV=development|test|production
```

Test overrides go in `backend/.env.test`. The app loads `.env.test` automatically when `NODE_ENV=test`.

## Testing Endpoint

`POST /api/test/reset` resets the database. It is only registered in test mode and is used by the e2e suite's `global-setup.ts`.
