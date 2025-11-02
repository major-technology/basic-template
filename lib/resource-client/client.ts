import {
  ResourceInvokePayload,
  InvokeResponse,
  InvokeRequest,
  DbPostgresPayload,
  ApiCustomPayload,
  ApiHubSpotPayload,
  StorageS3Payload,
  HttpMethod,
  QueryParams,
  BodyPayload,
  S3Command,
  DatabaseInvokeResponse,
  ApiInvokeResponse,
  StorageInvokeResponse,
} from "./schemas";
import { ResourceInvokeError } from "./errors";

import { headers } from 'next/headers';

/**
 * Configuration for the ResourceClient
 */
export interface ClientConfig {
  /** Base URL of the Major Tech API (e.g., "https://api.major.tech") */
  baseUrl: string;
  /** JWT token for Major API authentication */
  majorJWTToken: string;
  /** Optional custom fetch implementation (useful for testing or special environments) */
  fetch?: typeof fetch;
}

/**
 * Type-safe client for invoking Major Tech resources
 * 
 * @example
 * ```typescript
 * const client = new ResourceClient({
 *   baseUrl: 'https://api.major.tech',
 *   headers: {
 *     'Authorization': 'Bearer YOUR_TOKEN'
 *   }
 * });
 * 
 * // Invoke a database resource
 * const result = await client.invokeDatabase(
 *   'app-id',
 *   'resource-id',
 *   'SELECT * FROM users WHERE id = $1',
 *   [123],
 *   'fetch-user'
 * );
 * ```
 */
export class ResourceClient {
  private readonly config: {
    baseUrl: string;
    majorJWTToken: string;
    fetch: typeof fetch;
  };

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ""), // Remove trailing slash
      majorJWTToken: config.majorJWTToken,
      fetch: config.fetch || globalThis.fetch,
    };
  }

  /**
   * Low-level method to invoke a resource with any payload type
   * 
   * @param applicationId - UUID of the application
   * @param resourceId - UUID of the resource
   * @param payload - Resource-specific payload
   * @param invocationKey - Tracking key for this invocation
   * @returns Response from the resource invocation
   * @throws {ResourceInvokeError} If the invocation fails
   */
  async invoke(
    applicationId: string,
    resourceId: string,
    payload: ResourceInvokePayload,
    invocationKey: string,
  ): Promise<InvokeResponse> {
    const url = `${this.config.baseUrl}/internal/apps/v1/${applicationId}/resource/${resourceId}/invoke`;
    const headersList = await headers();
    
    const userJWT = headersList.get("x-major-user-jwt");
    const body: InvokeRequest = {
      payload,
      invocationKey,
    };

    try {
      const response = await this.config.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-major-jwt": this.config.majorJWTToken,
          ...(userJWT ? { "x-major-user-jwt": userJWT } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // Return the response (caller can check data.ok)
      return data as InvokeResponse;
    } catch (error) {
      // Network or parsing error
      const message = error instanceof Error ? error.message : String(error);
      throw new ResourceInvokeError(`Failed to invoke resource: ${message}`);
    }
  }

  /**
   * Helper method to invoke a PostgreSQL database resource
   * 
   * @param applicationId - UUID of the application
   * @param resourceId - UUID of the database resource
   * @param sql - SQL query to execute
   * @param params - Optional positional parameters for the query
   * @param invocationKey - Tracking key for this invocation
   * @param timeoutMs - Optional timeout in milliseconds
   * @returns Response with database query results
   */
  async invokePostgres(
    applicationId: string,
    resourceId: string,
    sql: string,
    params: Array<string | number | boolean | null> | undefined,
    invocationKey: string,
    timeoutMs?: number
  ): Promise<DatabaseInvokeResponse> {
    const payload: DbPostgresPayload = {
      type: "database",
      subtype: "postgresql",
      sql,
      params,
      timeoutMs,
    };

    return this.invoke(applicationId, resourceId, payload, invocationKey) as Promise<DatabaseInvokeResponse>;
  }

  /**
   * Helper method to invoke a custom API resource
   * 
   * @param applicationId - UUID of the application
   * @param resourceId - UUID of the API resource
   * @param method - HTTP method to use
   * @param path - Path to append to the resource's base URL
   * @param invocationKey - Tracking key for this invocation
   * @param options - Additional options (query, headers, body, timeoutMs)
   * @returns Response with API result
   */
  async invokeCustomApi(
    applicationId: string,
    resourceId: string,
    method: HttpMethod,
    path: string,
    invocationKey: string,
    options: {
      query?: QueryParams;
      headers?: Record<string, string>;
      body?: BodyPayload;
      timeoutMs?: number;
    } = {}
  ): Promise<ApiInvokeResponse> {
    const payload: ApiCustomPayload = {
      type: "api",
      subtype: "custom",
      method,
      path,
      query: options.query,
      headers: options.headers,
      body: options.body,
      timeoutMs: options.timeoutMs || 30000,
    };

    return this.invoke(
      applicationId,
      resourceId,
      payload,
      invocationKey
    ) as Promise<ApiInvokeResponse>;
  }

  /**
   * Helper method to invoke a HubSpot API resource
   * Note: HubSpot authentication is handled automatically by the API
   * 
   * @param applicationId - UUID of the application
   * @param resourceId - UUID of the HubSpot resource
   * @param method - HTTP method to use
   * @param path - HubSpot API path (e.g., "/crm/v3/objects/deals")
   * @param invocationKey - Tracking key for this invocation
   * @param options - Additional options (query, body, timeoutMs)
   * @returns Response with API result
   */
  async invokeHubspotApi(
    applicationId: string,
    resourceId: string,
    method: HttpMethod,
    path: string,
    invocationKey: string,
    options: {
      query?: QueryParams;
      body?: { type: "json"; value: unknown };
      timeoutMs?: number;
    } = {}
  ): Promise<ApiInvokeResponse> {
    const payload: ApiHubSpotPayload = {
      type: "api",
      subtype: "hubspot",
      method,
      path,
      query: options.query,
      body: options.body,
      timeoutMs: options.timeoutMs || 30000,
    };

    return this.invoke(
      applicationId,
      resourceId,
      payload,
      invocationKey
    ) as Promise<ApiInvokeResponse>;
  }

  /**
   * Helper method to invoke an S3 storage resource
   * 
   * @param applicationId - UUID of the application
   * @param resourceId - UUID of the S3 resource
   * @param command - S3 command to execute
   * @param params - Parameters for the S3 command (varies by command)
   * @param invocationKey - Tracking key for this invocation
   * @param options - Additional options (timeoutMs)
   * @returns Response with S3 operation result
   */
  async invokeS3(
    applicationId: string,
    resourceId: string,
    command: S3Command,
    params: Record<string, unknown>,
    invocationKey: string,
    options: {
      timeoutMs?: number;
    } = {}
  ): Promise<StorageInvokeResponse> {
    const payload: StorageS3Payload = {
      type: "storage",
      subtype: "s3",
      command,
      params,
      timeoutMs: options.timeoutMs,
    };

    return this.invoke(
      applicationId,
      resourceId,
      payload,
      invocationKey
    ) as Promise<StorageInvokeResponse>;
  }
}

