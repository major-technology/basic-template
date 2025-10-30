# Custom API Resource Guide

## Overview

This guide covers how to interact with custom REST APIs using the `ResourceClient` from `lib/resource-client`. Custom API resources allow you to make HTTP requests to any external API while letting Major handle authentication, rate limiting, and error handling.

## Important Security Note

Never directly call external APIs from your code. Always use the ResourceClient which handles authentication, credentials, and security automatically through the Major API.

## Setup

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});
```

The resource ID for your custom API can be found in the system prompt.

## Method Signature

```typescript
client.invokeCustomApi(
  applicationId: string,
  resourceId: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  invocationKey: string,
  options?: {
    query?: Record<string, string | string[]>;
    headers?: Record<string, string>;
    body?: {
      type: "json";
      value: unknown;
    } | {
      type: "text";
      value: string;
    } | {
      type: "bytes";
      base64: string;
      contentType: string;
    };
    timeoutMs?: number;
  }
): Promise<InvokeResponse>
```

**Parameters:**
- `applicationId`: Your application ID (from `process.env.APPLICATION_ID`)
- `resourceId`: The custom API resource ID (from system prompt)
- `method`: HTTP method to use
- `path`: Path relative to the API base URL (e.g., "/users" or "/api/v1/data")
- `invocationKey`: Unique identifier for this operation
- `options`: Optional configuration object
  - `query`: Query parameters
  - `headers`: Additional headers
  - `body`: Request body (json, text, or bytes)
  - `timeoutMs`: Timeout in milliseconds (default: 30000ms)

## Response Schema

```typescript
interface InvokeResponse {
  ok: true;
  requestId: string;
  result: {
    kind: "api";
    status: number; // HTTP status from the external API
    body: {
      kind: "json";
      value: unknown;
    } | {
      kind: "text";
      value: string;
    } | {
      kind: "bytes";
      base64: string;
      contentType: string;
    };
  };
}
```

## Examples

### Example 1: Simple GET Request with Query Parameters

Retrieve data from an external API with pagination.

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});

async function getCustomApiData() {
  const response = await client.invokeCustomApi(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID', // Replace with actual resource ID from system prompt
    'GET',
    '/api/data',
    'get-custom-api-data',
    {
      query: {
        page: "1",
        limit: "10",
      },
    }
  );

  if (response.ok && response.result.body.kind === "json") {
    console.log("API Response:", response.result.body.value);
    return response.result.body.value;
  }
}
```

### Example 2: POST Request with JSON Body

Create a resource in an external API.

```typescript
async function createCustomApiResource(data: { name: string; value: string }) {
  const response = await client.invokeCustomApi(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'POST',
    '/api/resources',
    'create-custom-resource',
    {
      body: {
        type: "json",
        value: data,
      },
    }
  );

  return response;
}
```

### Example 3: Request with Custom Headers and Timeout

Call an API endpoint with custom headers and extended timeout.

```typescript
async function customApiWithHeaders() {
  const response = await client.invokeCustomApi(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'GET',
    '/api/secure-endpoint',
    'secure-api-call',
    {
      headers: {
        "X-Custom-Header": "custom-value",
      },
      timeoutMs: 60000, // 60 second timeout
    }
  );

  return response;
}
```

## Request Body Types

The request body can be one of three types:

### JSON Body (Most Common)
```typescript
body: {
  type: "json",
  value: {
    key: "value",
    nested: { data: true }
  }
}
```

### Text Body
```typescript
body: {
  type: "text",
  value: "plain text content"
}
```

### Binary Body
```typescript
body: {
  type: "bytes",
  base64: "base64EncodedData==",
  contentType: "image/png"
}
```

## Response Body Types

The response body can also be one of three types:

```typescript
// JSON response (most common)
if (result.result.body.kind === "json") {
  const data = result.result.body.value;
}

// Text response
if (result.result.body.kind === "text") {
  const text = result.result.body.value;
}

// Binary response
if (result.result.body.kind === "bytes") {
  const base64Data = result.result.body.base64;
  const contentType = result.result.body.contentType;
}
```

## Best Practices

1. **Use descriptive invocationKeys** for tracking (e.g., "fetch-weather-data", "submit-order")
2. **Set appropriate timeouts** for slow APIs using `timeoutMs`
3. **Check HTTP status codes** via `result.result.status` to handle different response scenarios
4. **Parse response body type** before accessing the value
5. **Add custom headers** when required by the external API
6. **Use query parameters** for GET requests instead of encoding them in the path
7. **Handle errors gracefully** by checking both `result.ok` and `result.result.status`

## Common HTTP Methods

### GET - Retrieve Data
```typescript
method: "GET",
path: "/api/users",
query: { page: "1", limit: "20" }
```

### POST - Create Resource
```typescript
method: "POST",
path: "/api/users",
body: { type: "json", value: { name: "John" } }
```

### PUT - Replace Resource
```typescript
method: "PUT",
path: "/api/users/123",
body: { type: "json", value: { name: "John", email: "john@example.com" } }
```

### PATCH - Partial Update
```typescript
method: "PATCH",
path: "/api/users/123",
body: { type: "json", value: { email: "newemail@example.com" } }
```

### DELETE - Remove Resource
```typescript
method: "DELETE",
path: "/api/users/123"
```

## Path Construction

The `path` field is relative to the API's base URL configured in the resource:

- If API base URL is `https://api.example.com`
- And path is `/users/123`
- Full URL becomes: `https://api.example.com/users/123`

**Important**: Do not include the protocol or domain in the path - only the path portion.

## Query Parameters

Query parameters are automatically URL-encoded and appended to the path:

```typescript
query: {
  search: "hello world",  // becomes ?search=hello%20world
  filters: ["active", "verified"]  // becomes ?filters=active&filters=verified
}
```

## Error Handling

```typescript
const result: InvokeResponse = await response.json();

if (!result.ok) {
  // Handle Major API error
  console.error("Invoke failed");
  return;
}

// Check HTTP status from the external API
if (result.result.status >= 400) {
  console.error(`API returned error status: ${result.result.status}`);
  if (result.result.body.kind === "json") {
    console.error("Error details:", result.result.body.value);
  }
  return;
}

// Success case
if (result.result.status >= 200 && result.result.status < 300) {
  // Process successful response
}
```

## Troubleshooting

- **Timeout errors**: Increase `timeoutMs` for slow APIs
- **404 errors**: Verify the path is correct relative to the API base URL
- **Authentication errors**: Check that the custom API resource is configured with proper credentials
- **Rate limiting**: The external API may enforce rate limits - check their documentation
- **CORS errors**: Not applicable - requests go through Major's backend, not the browser
