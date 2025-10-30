// Re-export all types
export * from "./common";
export * from "./postgres";
export * from "./storage";
export * from "./api-custom";
export * from "./api-hubspot";
export * from "./request";
export * from "./response";

// Import for discriminated union
import type { ApiCustomPayload } from "./api-custom";
import type { ApiHubSpotPayload } from "./api-hubspot";
import type { DbPostgresPayload } from "./postgres";
import type { StorageS3Payload } from "./storage";

/**
 * Discriminated union of all resource payload types
 * Use the 'subtype' field to narrow the type
 */
export type ResourceInvokePayload =
  | ApiCustomPayload
  | DbPostgresPayload
  | ApiHubSpotPayload
  | StorageS3Payload;

