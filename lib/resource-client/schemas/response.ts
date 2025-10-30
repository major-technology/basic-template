import { ApiResult } from "./common";
import { DbResult } from "./postgres";
import { StorageS3Result } from "./s3";

/**
 * Union of all possible resource invocation result types
 */
export type ResourceInvokeSuccess = ApiResult | DbResult | StorageS3Result;

/**
 * Successful invocation response
 */
export interface InvokeSuccess {
  ok: true;
  /** Unique ID for this request */
  requestId: string;
  /** The result data from the resource */
  result: ResourceInvokeSuccess;
}

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
 * Response envelope for resource invocation
 */
export type InvokeResponse = InvokeSuccess | InvokeFailure;

