# HubSpot CRM API Resource Guide

## Overview

This guide covers how to interact with HubSpot CRM using the `ResourceClient` from `lib/resource-client`. You must NEVER call HubSpot directly - always use the ResourceClient which handles OAuth authentication, token refresh, and rate limiting automatically through the Major API.

## Important Authentication Note

**CRITICAL**: The Major API handles ALL HubSpot authentication automatically. You MUST NOT attempt to:
- Refresh OAuth tokens
- Manage access tokens yourself
- Call any OAuth or token refresh endpoints

Authentication is completely handled for you behind the scenes. Just use the ResourceClient.

## Setup

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});
```

The resource ID for your HubSpot integration can be found in the system prompt.

## Available OAuth Scopes

The HubSpot integration provides access to the following scopes:

```
crm.schemas.quotes.read crm.objects.line_items.read crm.schemas.deals.read
crm.objects.carts.read crm.schemas.line_items.read crm.pipelines.orders.read
crm.objects.subscriptions.read crm.import crm.schemas.subscriptions.read
crm.schemas.orders.read crm.schemas.commercepayments.read oauth
crm.objects.owners.read crm.objects.commercepayments.read crm.objects.orders.read
crm.objects.invoices.read crm.schemas.invoices.read crm.objects.courses.read
crm.objects.listings.read crm.objects.leads.read crm.objects.services.read
crm.export crm.objects.users.read crm.objects.partner-clients.read
crm.objects.products.read crm.objects.appointments.read
crm.objects.marketing_events.read crm.schemas.custom.read crm.objects.custom.read
crm.objects.feedback_submissions.read crm.schemas.services.read
crm.schemas.courses.read crm.objects.goals.read crm.objects.companies.read
crm.schemas.listings.read crm.lists.read crm.objects.deals.read
crm.schemas.contacts.read crm.schemas.appointments.read crm.objects.contacts.read
crm.schemas.companies.read crm.objects.quotes.read crm.schemas.carts.read
crm.objects.partner-services.read
```

## Additional Resources

More documentation on the HubSpot API: https://developers.hubspot.com/docs/guides/crm/understanding-the-crm

Search the HubSpot API documentation to find the right endpoint for what the user needs.

## Method Signature

```typescript
client.invokeHubspotApi(
  applicationId: string,
  resourceId: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  invocationKey: string,
  options?: {
    query?: Record<string, string | string[]>;
    body?: {
      type: "json";
      value: unknown;
    };
    timeoutMs?: number;
  }
): Promise<InvokeResponse>
```

**Parameters:**
- `applicationId`: Your application ID (from `process.env.APPLICATION_ID`)
- `resourceId`: The HubSpot resource ID (from system prompt)
- `method`: HTTP method to use
- `path`: HubSpot API path relative to https://api.hubapi.com (e.g., "/crm/v3/objects/contacts")
- `invocationKey`: Unique identifier for this operation
- `options`: Optional configuration object
  - `query`: Query parameters
  - `body`: Request body (HubSpot typically uses JSON)
  - `timeoutMs`: Timeout in milliseconds (default: 30000ms)

## Response Schema

```typescript
interface InvokeResponse {
  ok: true;
  requestId: string;
  result: {
    kind: "api";
    status: number; // HTTP status from HubSpot API
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

### Example 1: Get Account Details

Retrieve information about the HubSpot account.

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});

async function getHubSpotAccountDetails() {
  const response = await client.invokeHubspotApi(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID', // Replace with actual resource ID from system prompt
    'GET',
    '/account-info/v3/details',
    'get-account-details'
  );

  if (response.ok && response.result.body.kind === "json") {
    console.log("Account Details:", response.result.body.value);
    return response.result.body.value;
  }
}
```

### Example 2: Get Contacts with Filtering

Retrieve contacts from HubSpot with specific properties and pagination.

```typescript
async function getHubSpotContacts(limit: number = 10) {
  const response = await client.invokeHubspotApi(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'GET',
    '/crm/v3/objects/contacts',
    'get-hubspot-contacts',
    {
      query: {
        limit: String(limit),
        properties: ["firstname", "lastname", "email", "phone"],
      },
    }
  );

  if (response.ok && response.result.body.kind === "json") {
    const data = response.result.body.value as { results: any[] };
    console.log("Contacts:", data.results);
    return data.results;
  }
}
```

### Example 3: Create a New Contact

Create a contact in HubSpot with specified properties.

```typescript
async function createHubSpotContact(firstName: string, lastName: string, email: string) {
  const response = await client.invokeHubspotApi(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'POST',
    '/crm/v3/objects/contacts',
    'create-hubspot-contact',
    {
      body: {
        type: "json",
        value: {
          properties: {
            firstname: firstName,
            lastname: lastName,
            email: email,
          },
        },
      },
    }
  );

  if (response.ok && response.result.body.kind === "json") {
    console.log("Created Contact:", response.result.body.value);
    return response.result.body.value;
  }
}
```

## Best Practices

1. **Use descriptive invocationKeys** for tracking (e.g., "get-contacts", "create-deal")
2. **Specify required properties** in the `query.properties` array to minimize response size
3. **Handle pagination** for large result sets using `after` parameter
4. **Check response status** via `result.result.status` for HTTP status codes
5. **Parse JSON responses** by checking `result.result.body.kind === "json"`
6. **Follow HubSpot API conventions** - paths are relative to https://api.hubapi.com

## Common HubSpot Endpoints

### Contacts
- List: `GET /crm/v3/objects/contacts`
- Get by ID: `GET /crm/v3/objects/contacts/{contactId}`
- Create: `POST /crm/v3/objects/contacts`
- Update: `PATCH /crm/v3/objects/contacts/{contactId}`

### Deals
- List: `GET /crm/v3/objects/deals`
- Create: `POST /crm/v3/objects/deals`

### Companies
- List: `GET /crm/v3/objects/companies`
- Create: `POST /crm/v3/objects/companies`

### Search
- Search contacts: `POST /crm/v3/objects/contacts/search`

## Response Body Types

The response body can be one of three types:

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

## Troubleshooting

- **Authentication errors**: Check that the HubSpot resource is properly configured with OAuth
- **Rate limiting**: HubSpot enforces rate limits - the Major API handles retries automatically
- **404 errors**: Verify the path is correct relative to https://api.hubapi.com
- **Missing properties**: Include the property name in the `query.properties` array
- **Search queries**: Use the search endpoint (`/crm/v3/objects/{object}/search`) for complex filtering
