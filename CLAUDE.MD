# Next.js Starter Template - AI Agent Guide

## IMPORTANT: This is a Starter Template!

**This is a blank canvas meant to be transformed into a real application.** When you receive instructions about what to build:

1. **Update this CLAUDE.MD file first** with project-specific context about the actual application. Also update README.md
2. **Replace the placeholder content in [app/page.tsx](app/page.tsx)** with the real first page of the application
3. **Build the application** according to the user's requirements

## Project Structure

This is a Next.js 15 application with the App Router architecture:

### Key Directories

- **[app/](app/)** - App Router pages and layouts

  - **[app/page.tsx](app/page.tsx)** - Home page (currently placeholder, REPLACE THIS)
  - **[app/layout.tsx](app/layout.tsx)** - Root layout with Tailwind CSS setup
  - **[app/api/](app/api/)** - Create API routes here (e.g., `app/api/users/route.ts`)
    - **[app/api/healthz/](app/api/healthz/)** - Health check endpoint (DO NOT REMOVE)

- **[components/](components/)** - Reusable React components

  - **[components/ui/](components/ui/)** - shadcn/ui components (install as needed)

- **[lib/](lib/)** - Utility functions and shared code
  - **[lib/utils.ts](lib/utils.ts)** - Common utilities including `cn()` for class merging

## Tech Stack

### Core

- **Next.js 15.5.2** with App Router
- **React 19.1** (stable)
- **TypeScript 5**

### Styling

- **Tailwind CSS 4** (PostCSS)
- **shadcn/ui** components (pre-initialized)
- **lucide-react** for icons
- **class-variance-authority** for component variants

### Development

- **Turbo mode** enabled for faster dev server
- **ESLint** + **TypeScript** checking via `pnpm lint`

## Working with shadcn/ui

**shadcn is already initialized** in this project. To add components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
# etc.
```

Components will be installed to [components/ui/](components/ui/). See the [shadcn/ui docs](https://ui.shadcn.com/) for available components.

## API Routes

Create API endpoints in the `app/api/` directory:

```typescript
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: "Hello World" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ received: body });
}
```

Access at: `http://localhost:3000/api/hello`

### Health Check Endpoint

**CRITICAL: DO NOT REMOVE OR MODIFY [app/api/healthz/route.ts](app/api/healthz/route.ts)**

This endpoint is used by the deployment infrastructure to monitor container health:

```
GET /api/healthz
→ { "status": "healthy", "timestamp": "2025-10-23T..." }
```

The deployment platform regularly pings this endpoint to ensure the application container is running properly. Removing or modifying this endpoint will cause health check failures and potential service interruptions.

## Development Workflow

```bash
# Start dev server (with Turbo mode)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting and type checking
pnpm lint
```

## Resource Clients

**CRITICAL**: All resource access MUST go through auto-generated clients from `@major-tech/resource-client`.

### Using Generated Clients

Import and use the auto-generated clients from `/clients/`:

```typescript
import { ordersDbClient } from "./clients";

const result = await ordersDbClient.invoke(
  "SELECT * FROM orders WHERE user_id = $1",
  [userId],
  "fetch-user-orders"
);

if (result.ok) {
  console.log(result.result.rows);
}
```

## Utilities

### Styling

Use the `cn()` utility from [lib/utils.ts](lib/utils.ts) to merge Tailwind classes:

```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", conditional && "conditional-class")} />;
```

## Next Steps for AI Agents

When given a project brief:

1. **Understand the requirements** - Ask clarifying questions if needed
2. **Update CLAUDE.MD** - Replace this file with project-specific context
3. **Build [app/page.tsx](app/page.tsx)** - Create the actual home page
4. **Install shadcn components** - Add UI components as needed with `npx shadcn@latest add <component>`
5. **Create API routes** - Add backend endpoints in [app/api/](app/api/)
6. **Add custom components** - Build reusable components in [components/](components/)
7. **Test thoroughly** - Run `pnpm dev` and verify functionality

## Template Configuration

- **Package manager**: pnpm (preferred)
- **Node version**: 20+
- **Git**: Initialized, current branch: `main`
- **shadcn config**: [components.json](components.json)

---

**Remember**: This template is intentionally minimal. Your job is to transform it into a fully functional application based on the user's requirements!
