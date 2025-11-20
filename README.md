# Major Resource Client Tool

Next.js 15 + React 19 + TypeScript + Tailwind CSS 4

## Environment
- **Node**: >=20.0.0
- **Package Manager**: pnpm (required)
- **Install**: `pnpm install`
- **Dev**: `pnpm dev`

## Resource Clients

**CRITICAL**: All resource access MUST go through auto-generated clients from `@major-tech/resource-client`.

### Using Generated Clients

Import and use the auto-generated clients from `/clients/`:

```typescript
import { ordersDbClient } from './clients';

const result = await ordersDbClient.invoke(
  'SELECT * FROM orders WHERE user_id = $1',
  [userId],
  'fetch-user-orders'
);

if (result.ok) {
  console.log(result.result.rows);
}
```

## UI Components
**shadcn/ui**: Use exclusively for all UI components. Install components via npx as needed.

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

## Architecture
- Next.js 15 with App Router
- React 19 with TypeScript strict mode
- Tailwind CSS 4 (PostCSS)
- Turbo mode enabled for faster dev server
- `@major-tech/resource-client` for all resource access

## Developing
- Run `pnpm lint` to check if your changes actually work
- Make sure to look at the `@major-tech/resource-client` package, the methods available and how to use them
- All `invokes` of resource-clients should be put in `/app/api` or server actions
- **CRITICAL**: DO NOT remove or modify `/app/api/healthz/route.ts` - required for deployment health checks
