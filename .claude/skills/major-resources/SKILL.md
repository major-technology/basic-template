---
name: Major Platform Resources
description: Use this skill when the user wants to interact with databases (PostgreSQL), storage (Amazon S3), APIs (HubSpot CRM, custom REST APIs), or other external services. Provides secure invocation patterns through Major's API.
---

# Major Platform Resources

## Overview

This skill provides documentation for accessing external resources (databases, storage, APIs, and services) through your Major application. All resources are accessed through Major's secure invoke API endpoint, which handles authentication, credentials, and security automatically.

## How Resource Access Works

All resources in your application are invoked through the Major API's secure invoke endpoint:

```
POST {process.env.MAJOR_API_BASE_URL}/internal/apps/v1/{process.env.APPLICATION_ID}/resource/{RESOURCE_ID}/invoke
```

**The system prompt contains the actual resource instances available to your application** (names, IDs, descriptions). Use those resource IDs in the invoke endpoint URL.

### Security Requirements

**Critical Rules:**
- NEVER connect directly to databases or external APIs
- NEVER use credentials or secrets directly in your code
- NEVER pass authentication tokens to the frontend
- NEVER attempt to refresh OAuth tokens manually
- ALWAYS use the invoke endpoint

All authentication, credential management, connection pooling, and rate limiting are handled automatically by the Major API. These secrets are critical to your users and their data - leaking them can cause grievous harm.

### Implementation Location

All resource access should be done in server-side code only:
- **Server Components** - TSX components that run on the server and can safely use ResourceClient
- **Server Actions** - Functions tagged with `'use server'` for mutations (can be imported by client components)
- **API Routes** - `/api` endpoints that can be called by the frontend

Use your expertise as a NextJS developer to decide which approach to use for each use case.

### Using the Resource Client

Import the `ResourceClient` from `lib/resource-client` to access resources with a clean, type-safe API:

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});
```

The client provides convenient methods for each resource type and automatically handles authentication headers.

## Resource Type Documentation

For detailed invocation patterns, request/response schemas, and code examples, refer to the type-specific guides:

### PostgreSQL Databases

See [postgresql-guide.md](./postgresql-guide.md) for:
- Complete request/response TypeScript interfaces
- Query examples (SELECT, INSERT, UPDATE, DELETE)
- Parameterized queries to prevent SQL injection
- Complex queries with JOINs
- Transaction handling

**Use this guide when:** User asks to query data, create tables, insert records, update data, or perform any database operations.

### HubSpot CRM API

See [hubspot-guide.md](./hubspot-guide.md) for:
- Available OAuth scopes and permissions
- CRM object operations (contacts, deals, companies, etc.)
- Account information retrieval
- Search and filtering patterns
- Creating and updating CRM records

**Use this guide when:** User asks to integrate with HubSpot, access CRM data, manage contacts/deals, or sync customer information.

### Amazon S3 Storage

See [s3-guide.md](./s3-guide.md) for:
- Object storage operations (upload, download, list, delete)
- Binary file handling (images, PDFs, etc.)
- Bucket and key management
- Object metadata and content types
- Batch operations and folder patterns
- S3-compatible storage (MinIO, DigitalOcean Spaces, etc.)

**Use this guide when:** User asks to upload files, store images/documents, manage object storage, download files, or work with S3 buckets.

### Custom REST APIs

See [custom-api-guide.md](./custom-api-guide.md) for:
- Generic HTTP invocation patterns (GET, POST, PUT, PATCH, DELETE)
- Request body handling (JSON, text, binary)
- Custom headers and query parameters
- Response parsing
- Timeout configuration

**Use this guide when:** User asks to call external APIs, integrate third-party services, or make HTTP requests to custom endpoints.

## General Invoke Pattern

The ResourceClient provides type-safe methods for each resource type:

```typescript
import { ResourceClient } from '@/lib/resource-client';

// Initialize the client (once per request/module)
const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});

// Example: Invoke a PostgreSQL database
const response = await client.invokePostgres(
  process.env.APPLICATION_ID!,
  'RESOURCE_ID',
  'SELECT * FROM users WHERE id = $1',
  [userId],
  'get-user-by-id'
);

if (response.ok) {
  // Access the result
  console.log(response.result.rows);
}
```

**Key parameters:**
- `applicationId`: Your application's ID (from env: `process.env.APPLICATION_ID`)
- `resourceId`: The specific resource ID (found in system prompt)
- Resource-specific parameters (varies by type - see type-specific guides)
- `invocationKey`: Unique identifier for this operation (used for tracking)

## When to Use This Skill

Use this skill when the user's request involves:
- Querying or modifying data in a database
- Uploading, downloading, or managing files in object storage
- Fetching or updating information in HubSpot CRM
- Calling external APIs or third-party services
- Integrating with any resource mentioned in the system prompt
- Working with PostgreSQL, S3 storage, HubSpot, or custom API integrations

The system prompt will tell you which specific resources are available in the current application and their resource IDs.
