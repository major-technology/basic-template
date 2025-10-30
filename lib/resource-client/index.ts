/**
 * @major-tech/resource-client
 * 
 * Type-safe client for invoking Major Tech resources
 * Provides schemas, types, and HTTP client for resource invocations
 */

// Export all schemas and types
export * from "./schemas";

// Export client
export { ResourceClient, type ClientConfig } from "./client";

// Export errors
export { ResourceInvokeError } from "./errors";

