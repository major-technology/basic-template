# PostgreSQL Database Resource Guide

## Overview

This guide covers how to interact with PostgreSQL databases using the `ResourceClient` from `lib/resource-client`. You must NEVER connect directly to databases - always use the ResourceClient which handles connection pooling, security, and error handling through the Major API.

## Important Security Note

Never directly connect to the database using connection strings or the `pg` library. Always use the ResourceClient. The Major API handles all connection management, credentials, and security for you.

## Setup

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});
```

The resource ID for your PostgreSQL database can be found in the system prompt.

## Method Signature

```typescript
client.invokePostgres(
  applicationId: string,
  resourceId: string,
  sql: string,
  params: Array<string | number | boolean | null> | undefined,
  invocationKey: string,
  timeoutMs?: number
): Promise<InvokeResponse>
```

**Parameters:**
- `applicationId`: Your application ID (from `process.env.APPLICATION_ID`)
- `resourceId`: The PostgreSQL resource ID (from system prompt)
- `sql`: SQL query to execute
- `params`: Optional positional parameters for parameterized queries (`$1`, `$2`, etc.)
- `invocationKey`: Unique identifier for this operation (used for tracking)
- `timeoutMs`: Optional timeout in milliseconds (default: 30000ms)

## Response Schema

```typescript
interface InvokeResponse {
  ok: true;
  requestId: string;
  result: {
    kind: "database";
    rows: Record<string, unknown>[]; // Array of row objects
    rowsAffected?: number; // Number of rows affected (for INSERT/UPDATE/DELETE)
  };
}
```

## Examples

### Example 1: Simple SELECT Query

Retrieve recent users from the database.

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});

async function getUsersFromDatabase() {
  const response = await client.invokePostgres(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID', // Replace with actual resource ID from system prompt
    'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10',
    undefined, // No parameters
    'get-recent-users'
  );

  if (response.ok) {
    console.log("Users:", response.result.rows);
    return response.result.rows;
  }
}
```

### Example 2: Parameterized Query (Prevents SQL Injection)

Use positional parameters (`$1`, `$2`, etc.) to safely pass values to your SQL queries.

```typescript
async function getUserByEmail(email: string) {
  const response = await client.invokePostgres(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'SELECT * FROM users WHERE email = $1',
    [email], // Positional parameters ($1, $2, etc.)
    'get-user-by-email'
  );

  if (response.ok && response.result.rows.length > 0) {
    return response.result.rows[0];
  }
  return null;
}
```

### Example 3: INSERT with Parameters and Returning Values

Insert a new user and return the created record.

```typescript
async function createUser(name: string, email: string) {
  const response = await client.invokePostgres(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING *',
    [name, email],
    'create-user'
  );

  if (response.ok) {
    console.log("Created user:", response.result.rows[0]);
    console.log("Rows affected:", response.result.rowsAffected);
    return response.result.rows[0];
  }
}
```

### Example 4: Complex Query with JOIN

Retrieve aggregated data using JOINs and GROUP BY.

```typescript
async function getUsersWithOrders() {
  const response = await client.invokePostgres(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    `
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(o.id) as order_count,
        SUM(o.total) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
    `,
    undefined,
    'users-with-orders-summary',
    60000 // 60 second timeout for complex queries
  );

  if (response.ok) {
    return response.result.rows;
  }
}
```

## Best Practices

1. **Always use parameterized queries** with `params` instead of string concatenation to prevent SQL injection
2. **Use descriptive invocationKeys** that identify the operation (e.g., "get-user-by-email", "create-order")
3. **Set appropriate timeouts** for complex queries using `timeoutMs`
4. **Use RETURNING clause** in INSERT/UPDATE/DELETE to get back the affected rows
5. **Check `result.ok`** before accessing the result data
6. **Handle errors gracefully** by checking if rows exist before accessing them

## Common Patterns

### UPDATE with RETURNING
```typescript
sql: "UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING *",
params: [userId]
```

### DELETE with condition
```typescript
sql: "DELETE FROM sessions WHERE expires_at < NOW() RETURNING id",
```

### Transactions
For multi-step operations, use multiple invocations and handle rollback logic in your application code if needed. Each invocation is an independent database operation.

## Troubleshooting

- **Timeout errors**: Increase `timeoutMs` for complex queries
- **Empty result.rows**: Query succeeded but returned no data - check your WHERE conditions
- **Parameter mismatch**: Ensure the number of `$N` placeholders matches the length of your `params` array
