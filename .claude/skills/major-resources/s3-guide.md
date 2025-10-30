# Amazon S3 Storage Resource Guide

## Overview

This guide covers how to interact with Amazon S3 (or S3-compatible storage like MinIO) using the `ResourceClient` from `lib/resource-client`. You must NEVER connect directly to S3 using AWS SDK or credentials - always use the ResourceClient which handles authentication, security, and error handling through the Major API.

## Critical: File Upload/Download Pattern

**The API does NOT support passing file data directly.** For ALL file uploads and downloads, you MUST:
1. Call `GeneratePresignedUrl` command using `client.invokeS3()`
2. Use the returned presigned URL to upload/download directly to/from S3

This is the ONLY way to upload or download files. There is no command to pass file content through the Major API.

## Important Security Note

Never directly connect to S3 using the AWS SDK, access keys, or secret keys. Always use the ResourceClient. The Major API handles all credential management, authentication, and security for you.

## Setup

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});
```

The resource ID for your S3 storage can be found in the system prompt.

## Method Signature

The S3 resource uses AWS SDK commands directly. You specify the command name and parameters that match the AWS Javascript SDK.

See documentation on the commands and their schema here: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/

```typescript
client.invokeS3(
  applicationId: string,
  resourceId: string,
  command: "ListObjectsV2" | "HeadObject" | "GetObjectTagging" | "PutObjectTagging" |
          "DeleteObject" | "DeleteObjects" | "CopyObject" | "ListBuckets" |
          "GetBucketLocation" | "GeneratePresignedUrl",
  params: Record<string, unknown>,
  invocationKey: string,
  options?: {
    timeoutMs?: number;
  }
): Promise<InvokeResponse>
```

**Parameters:**
- `applicationId`: Your application ID (from `process.env.APPLICATION_ID`)
- `resourceId`: The S3 resource ID (from system prompt)
- `command`: AWS S3 SDK command to execute
- `params`: AWS SDK command parameters (use AWS parameter names: `Bucket`, `Key`, etc.)
- `invocationKey`: Unique identifier for this operation
- `options`: Optional configuration object
  - `timeoutMs`: Timeout in milliseconds

## Response Schema

```typescript
interface InvokeResponse {
  ok: true;
  requestId: string;
  result: {
    kind: "storage";
    command: string;
    data: any; // Raw AWS SDK response
  } | {
    kind: "storage";
    presignedUrl: string; // For GeneratePresignedUrl command
    expiresAt: string; // ISO 8601 timestamp
  };
}
```

**Note**: The API passes parameters directly to AWS SDK commands, so you need to use AWS SDK parameter names (e.g., `Bucket`, `Key`, `Prefix`, `MaxKeys` with capital letters).

## Examples

### Example 1: Generate a Presigned URL for Upload

Create a presigned URL that allows uploading a file directly to S3.

```typescript
import { ResourceClient } from '@/lib/resource-client';

const client = new ResourceClient({
  baseUrl: process.env.MAJOR_API_BASE_URL!,
  majorJWTToken: process.env.MAJOR_JWT_TOKEN!,
});

async function generateUploadUrl(bucketName: string, fileName: string) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID', // Replace with actual resource ID from system prompt
    'GeneratePresignedUrl',
    {
      Bucket: bucketName,
      Key: fileName,
      Method: "PUT",
      ExpiresIn: 3600, // 1 hour
      ContentType: "image/jpeg",
    },
    'generate-upload-url'
  );

  if (response.ok) {
    console.log("Presigned URL:", response.result.presignedUrl);
    console.log("Expires at:", response.result.expiresAt);
    return response.result.presignedUrl;
  }
}
```

### Example 2: Generate a Presigned URL for Download

Create a presigned URL that allows downloading a file from S3.

```typescript
async function generateDownloadUrl(bucketName: string, fileName: string) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'GeneratePresignedUrl',
    {
      Bucket: bucketName,
      Key: fileName,
      Method: "GET",
      ExpiresIn: 3600, // 1 hour
    },
    'generate-download-url'
  );

  if (response.ok) {
    console.log("Download URL:", response.result.presignedUrl);
    return response.result.presignedUrl;
  }
}
```

### Example 3: List Objects in a Bucket

List all objects or filter by prefix using AWS SDK `ListObjectsV2` command.

```typescript
async function listFiles(bucketName: string, folderPrefix?: string) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'ListObjectsV2',
    {
      Bucket: bucketName,
      Prefix: folderPrefix, // Optional: filter by folder/prefix
      MaxKeys: 100, // Limit results
    },
    'list-files'
  );

  if (response.ok) {
    const contents = response.result.data.Contents || [];
    console.log(`Found ${contents.length} objects`);
    contents.forEach((obj: any) => {
      console.log(`- ${obj.Key} (${obj.Size} bytes, modified: ${obj.LastModified})`);
    });
    return contents;
  }
}
```

### Example 4: Check if Object Exists (HeadObject)

Get metadata about an object without downloading it using AWS SDK `HeadObject` command.

```typescript
async function checkFileExists(bucketName: string, fileName: string) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'HeadObject',
    {
      Bucket: bucketName,
      Key: fileName,
    },
    'check-file-exists'
  );

  if (response.ok) {
    console.log("File exists!");
    console.log("Metadata:", response.result.data.Metadata);
    console.log("Content-Type:", response.result.data.ContentType);
    console.log("Size:", response.result.data.ContentLength);
    return true;
  } else {
    console.log("File does not exist");
    return false;
  }
}
```

### Example 5: Delete an Object (DeleteObject)

Remove a file from S3 using AWS SDK `DeleteObject` command.

```typescript
async function deleteFile(bucketName: string, fileName: string) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'DeleteObject',
    {
      Bucket: bucketName,
      Key: fileName,
    },
    'delete-file'
  );

  if (response.ok) {
    console.log("File deleted successfully");
    return true;
  }
}
```

### Example 6: Copy an Object (CopyObject)

Copy a file from one location to another within S3 using AWS SDK `CopyObject` command.

```typescript
async function copyFile(
  sourceBucket: string,
  sourceKey: string,
  destBucket: string,
  destKey: string
) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'CopyObject',
    {
      Bucket: destBucket,
      Key: destKey,
      CopySource: `${sourceBucket}/${sourceKey}`,
    },
    'copy-file'
  );

  if (response.ok) {
    console.log("File copied successfully");
    console.log("ETag:", response.result.data.CopyObjectResult?.ETag);
    return response.result.data;
  }
}
```

### Example 7: List All Buckets (ListBuckets)

List all S3 buckets accessible with the credentials.

```typescript
async function listBuckets() {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'ListBuckets',
    {},
    'list-buckets'
  );

  if (response.ok) {
    const buckets = response.result.data.Buckets || [];
    console.log(`Found ${buckets.length} buckets`);
    buckets.forEach((bucket: any) => {
      console.log(`- ${bucket.Name} (created: ${bucket.CreationDate})`);
    });
    return buckets;
  }
}
```

### Example 8: Manage Object Tags

Get and set tags on S3 objects using `GetObjectTagging` and `PutObjectTagging` commands.

```typescript
async function getObjectTags(bucketName: string, fileName: string) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'GetObjectTagging',
    {
      Bucket: bucketName,
      Key: fileName,
    },
    'get-object-tags'
  );

  if (response.ok) {
    console.log("Tags:", response.result.data.TagSet);
    return response.result.data.TagSet;
  }
}

async function setObjectTags(bucketName: string, fileName: string, tags: { Key: string; Value: string }[]) {
  const response = await client.invokeS3(
    process.env.APPLICATION_ID!,
    'RESOURCE_ID',
    'PutObjectTagging',
    {
      Bucket: bucketName,
      Key: fileName,
      Tagging: {
        TagSet: tags,
      },
    },
    'set-object-tags'
  );

  if (response.ok) {
    console.log("Tags updated successfully");
    return true;
  }
}
```

## Best Practices

1. **ALWAYS use presigned URLs for file uploads/downloads** - This is the ONLY way to upload or download files. The API does NOT support passing file content directly.
2. **Use descriptive keys** - Organize files with logical paths (e.g., `users/123/avatar.jpg`, `uploads/2024/report.pdf`)
3. **Capitalize AWS parameters** - All AWS SDK parameters use PascalCase (e.g., `Bucket`, `Key`, `Prefix`, `MaxKeys`)
4. **Set ExpiresIn appropriately** - Presigned URLs expire after the specified time (default 3600 seconds / 1 hour)
5. **List with prefixes** - Use the `Prefix` parameter in `ListObjectsV2` to efficiently filter objects by folder/path
6. **Check existence first** - Use `HeadObject` before performing operations to verify objects exist
7. **Use descriptive invocationKeys** - Name operations clearly (e.g., "generate-upload-url", "list-user-files")
8. **Use tags for metadata** - Store additional information with objects using `PutObjectTagging`

## Common Patterns

### Uploading Files via Presigned URL
This is the ONLY way to upload files. You cannot pass file data through the Major API.

```typescript
// Step 1: Generate presigned URL for upload (server-side via Major API)
const uploadUrl = await generateUploadUrl(bucket, `users/${userId}/avatar.jpg`);

// Step 2: Client uploads directly to S3 using the presigned URL
// This happens on the client side or in your server code, NOT through Major API
await fetch(uploadUrl, {
  method: 'PUT',
  body: fileData,
  headers: { 'Content-Type': 'image/jpeg' }
});
```

### Downloading Files via Presigned URL
This is the ONLY way to download files. You cannot retrieve file data through the Major API.

```typescript
// Generate download URL (server-side via Major API)
const downloadUrl = await generateDownloadUrl(bucket, `documents/${docId}.pdf`);

// Return this URL to the client, or use it directly
// Client downloads directly from S3, NOT through Major API
window.location.href = downloadUrl;
// Or use in <img src={downloadUrl} />, <a href={downloadUrl}>Download</a>, etc.
```

### Batch Operations
To process multiple files, make separate invocations for each operation:

```typescript
const files = ['file1.txt', 'file2.txt', 'file3.txt'];
const results = await Promise.all(
  files.map(file => checkFileExists(bucket, file))
);
```

### Managing Folders
S3 doesn't have true folders, but you can simulate them with key prefixes:

```typescript
// List all files in "images/" folder
await listFiles(bucket, "images/");

// Objects with "/" in the Key simulate folder structure
// e.g., Key: "images/avatars/user123.jpg"
```

## Troubleshooting

- **Cannot upload/download files through API**: You MUST use `GeneratePresignedUrl` - there is NO command to pass file data through the Major API
- **Presigned URL expired**: Default expiration is 3600 seconds (1 hour). Set `ExpiresIn` parameter when generating
- **Timeout errors**: Increase `timeoutMs` parameter for operations that may take longer
- **Access denied**: Ensure the resource credentials have proper IAM permissions for the bucket and operations
- **Bucket not found**: Verify the bucket name is correct and exists in the configured region
- **Invalid key**: Keys cannot start with `/` and have size/character limitations (use `Key` not `key`)
- **Parameter naming**: All AWS SDK parameters use PascalCase (`Bucket`, `Key`, `Prefix`) not camelCase
- **404 errors**: Use `HeadObject` to check if an object exists before attempting other operations

## Available Commands

The S3 resource supports these AWS SDK commands:

- **`ListObjectsV2`** - List objects in a bucket with optional prefix filtering
- **`HeadObject`** - Get object metadata without downloading the object
- **`GetObjectTagging`** - Retrieve tags associated with an object
- **`PutObjectTagging`** - Set tags on an object
- **`DeleteObject`** - Delete a single object
- **`DeleteObjects`** - Delete multiple objects in one request
- **`CopyObject`** - Copy an object within or between buckets
- **`ListBuckets`** - List all accessible S3 buckets
- **`GetBucketLocation`** - Get the AWS region of a bucket
- **`GeneratePresignedUrl`** - Generate a presigned URL for upload (PUT) or download (GET)

For detailed parameters, refer to the [AWS S3 SDK documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/).

## S3-Compatible Storage (MinIO, DigitalOcean Spaces, etc.)

The invoke endpoint works with any S3-compatible storage service. The resource configuration handles the endpoint URL and authentication automatically. All commands and parameters remain the same across all S3-compatible services.
