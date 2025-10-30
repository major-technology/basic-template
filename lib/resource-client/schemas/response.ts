import { ApiResult } from "./common";
import { DbResult } from "./postgres";
import { StorageS3Result } from "./s3";

/**
 * Union of all possible resource invocation result types
 */
export type ResourceInvokeSuccess = ApiResult | DbResult | StorageS3Result;

/**
 * Base successful invocation response - generic over result type
 */
export interface BaseInvokeSuccess<T> {
  ok: true;
  /** Unique ID for this request */
  requestId: string;
  /** The result data from the resource */
  result: T;
}

/**
 * Successful invocation response (any resource type)
 */
export type InvokeSuccess = BaseInvokeSuccess<ResourceInvokeSuccess>;

/**
 * Failed invocation response
 */
export interface InvokeFailure {
  ok: false;
  /** Unique ID for this request */
  requestId: string;
  /** Error details */
  error: {
    message: string;
    httpStatus?: number;
  };
}

/**
 * Response envelope for resource invocation (any resource type)
 */
export type InvokeResponse = InvokeSuccess | InvokeFailure;

// ============================================================================
// Resource-specific typed responses
// ============================================================================

/**
 * Response from database resource invocation
 */
export type DatabaseInvokeResponse = BaseInvokeSuccess<DbResult> | InvokeFailure;

/**
 * Response from API resource invocation (custom or HubSpot)
 */
export type ApiInvokeResponse = BaseInvokeSuccess<ApiResult> | InvokeFailure;

/**
 * Response from S3 storage resource invocation
 */
export type StorageInvokeResponse = BaseInvokeSuccess<StorageS3Result> | InvokeFailure;

