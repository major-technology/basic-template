# @major-tech/resource-client

Type-safe client for invoking Major Tech resources. This package provides TypeScript types and an HTTP client for interacting with the Major Tech resource invocation API.

## Installation

```bash
npm install @major-tech/resource-client
# or
yarn add @major-tech/resource-client
```

## Usage

### Basic Setup

```typescript
import { ResourceClient } from '@major-tech/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});
```

### Database Resources

```typescript
// Query a PostgreSQL database
const response = await client.invokeDatabase(
  'application-id',
  'resource-id',
  'SELECT * FROM users WHERE id = $1',
  [123],
  'fetch-user-by-id', // invocationKey is required
  30000 // optional timeout
);

if (response.ok) {
  console.log(response.result.rows);
  console.log(response.result.rowsAffected);
}
```

### Custom API Resources

```typescript
// Call a custom API
const response = await client.invokeCustomApi(
  'application-id',
  'resource-id',
  'POST',
  '/api/users',
  'create-user', // invocationKey is required
  {
    body: {
      type: 'json',
      value: { name: 'John Doe' }
    }
  }
);

if (response.ok && response.result.kind === 'api') {
  console.log('Status:', response.result.status);
  console.log('Body:', response.result.body);
}
```

### HubSpot API Resources

```typescript
// Query HubSpot CRM
const response = await client.invokeHubspotApi(
  'application-id',
  'resource-id',
  'GET',
  '/crm/v3/objects/contacts',
  'fetch-contacts', // invocationKey is required
  {
    query: { limit: '10' }
  }
);
```

### S3 Storage Resources

```typescript
// List objects in an S3 bucket
const response = await client.invokeS3(
  'application-id',
  'resource-id',
  'ListObjectsV2',
  {
    Bucket: 'my-bucket',
    Prefix: 'uploads/'
  },
  'list-uploads' // invocationKey is required
);

// Generate a presigned URL
const response = await client.invokeS3(
  'application-id',
  'resource-id',
  'GeneratePresignedUrl',
  {
    Bucket: 'my-bucket',
    Key: 'document.pdf',
    Method: 'GET',
    ExpiresIn: 3600
  },
  'generate-presigned-url' // invocationKey is required
);

if (response.ok && response.result.kind === 'storage' && 'presignedUrl' in response.result) {
  console.log('URL:', response.result.presignedUrl);
  console.log('Expires:', response.result.expiresAt);
}
```

### Error Handling

```typescript
const response = await client.invokeDatabase(
  'app-id',
  'resource-id',
  'SELECT * FROM users',
  undefined, // no params
  'fetch-all-users'
);

if (!response.ok) {
  console.error('Error:', response.error.message);
  console.error('Status:', response.error.httpStatus);
} else {
  // Success - process result
  console.log(response.result);
}
```

### Using Types Directly

```typescript
import type { 
  DbPostgresPayload, 
  InvokeResponse 
} from '@major-tech/resource-client';

// Use types for type safety
const payload: DbPostgresPayload = {
  type: 'database',
  subtype: 'postgresql',
  sql: 'SELECT * FROM users',
  params: []
};

// Response is typed automatically
const response: InvokeResponse = await client.invoke(...);
```

## Authentication

Authentication is handled via the `majorJWTToken` parameter, which should be sourced from your environment variables:

```typescript
const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});
```

The client automatically includes the JWT token in the `x-major-jwt` header for all requests. It also automatically forwards the `x-major-user-id` header from Next.js request headers if present.

## TypeScript Support

This package is written in TypeScript and provides full type definitions with zero runtime dependencies.

```typescript
import type { 
  DbResult, 
  ApiResult, 
  InvokeResponse 
} from '@major-tech/resource-client';
```

## License

Private package - not for public distribution.

