/**
 * Error thrown when resource invocation fails
 * Contains the error message and optional HTTP status code
 */
export class ResourceInvokeError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "ResourceInvokeError";
  }
}

