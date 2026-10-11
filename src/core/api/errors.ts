export type ApiErrorCode =
  | 'invalid_request'
  | 'payload_too_large'
  | 'unsupported_media_type'
  | 'rate_limited'
  | 'model_unavailable'
  | 'timeout'
  | 'internal'
  | 'network_error'
  | 'aborted';

export interface ApiErrorResponseEnvelope {
  requestId?: string;
  error: {
    code: ApiErrorCode | string;
    message: string;
    retryable?: boolean;
  };
}

export class ApiClientError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly retryable: boolean;
  public readonly requestId?: string;
  public readonly retryAfterSec?: number;

  constructor(options: {
    message: string;
    code: ApiErrorCode;
    status?: number;
    retryable?: boolean;
    requestId?: string;
    retryAfterSec?: number;
  }) {
    super(options.message);
    this.name = 'ApiClientError';
    this.code = options.code;
    this.status = options.status ?? 0;
    this.retryable = options.retryable ?? false;
    this.requestId = options.requestId;
    this.retryAfterSec = options.retryAfterSec;
  }
}
