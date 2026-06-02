/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ZhipuApiError } from './zhipuContentGenerator.js';
import { getErrorStatus } from '../utils/httpErrors.js';
import { isRetryableError } from '../utils/retry.js';
import { classifyGoogleError } from '../utils/googleQuotaErrors.js';

describe('ZhipuApiError', () => {
  it('should have the correct name and status', () => {
    const error = new ZhipuApiError('Rate limit exceeded', 429);
    expect(error.name).toBe('ZhipuApiError');
    expect(error.status).toBe(429);
    expect(error.message).toBe('Rate limit exceeded');
    expect(error).toBeInstanceOf(Error);
  });

  it('should expose status to getErrorStatus()', () => {
    const error429 = new ZhipuApiError('Rate limit', 429);
    expect(getErrorStatus(error429)).toBe(429);

    const error500 = new ZhipuApiError('Internal error', 500);
    expect(getErrorStatus(error500)).toBe(500);

    const error401 = new ZhipuApiError('Unauthorized', 401);
    expect(getErrorStatus(error401)).toBe(401);
  });

  it('should be classified as retryable for 429', () => {
    const error = new ZhipuApiError('Rate limit', 429);
    expect(isRetryableError(error)).toBe(true);
  });

  it('should be classified as retryable for 5xx', () => {
    const error500 = new ZhipuApiError('Internal error', 500);
    expect(isRetryableError(error500)).toBe(true);

    const error503 = new ZhipuApiError('Service unavailable', 503);
    expect(isRetryableError(error503)).toBe(true);
  });

  it('should NOT be classified as retryable for 4xx (non-429)', () => {
    const error400 = new ZhipuApiError('Bad request', 400);
    expect(isRetryableError(error400)).toBe(false);

    const error401 = new ZhipuApiError('Unauthorized', 401);
    expect(isRetryableError(error401)).toBe(false);

    const error403 = new ZhipuApiError('Forbidden', 403);
    expect(isRetryableError(error403)).toBe(false);
  });

  it('429 ZhipuApiError is retryable via isRetryableError even when classifyGoogleError does not classify it', () => {
    // classifyGoogleError may not classify ZhipuApiError as RetryableQuotaError
    // because the Zhipu error body ({"error":{"code":"1305",...}}) gets partially
    // parsed by the Google error parser. But isRetryableError (the primary retry
    // gate in both streamWithRetries and the generic retry loop) correctly
    // identifies it as retryable via getErrorStatus().
    const error = new ZhipuApiError(
      'Zhipu API error (429): {"error":{"code":"1305","message":"rate limit"}}',
      429,
    );
    // This is the critical check — isRetryableError is what streamWithRetries uses
    expect(isRetryableError(error)).toBe(true);
  });

  it('should pass through non-429 errors from classifyGoogleError', () => {
    const error = new ZhipuApiError('Bad request', 400);
    const classified = classifyGoogleError(error);
    // Non-429 errors without Google API structure should be returned as-is
    expect(classified).toBe(error);
  });

  it('should preserve the Zhipu error message through retry path', () => {
    const originalMessage =
      'Zhipu API error (429): {"error":{"code":"1305","message":"该模型当前访问量过大"}}';
    const error = new ZhipuApiError(originalMessage, 429);
    // The error message is preserved on the ZhipuApiError itself
    expect(error.message).toBe(originalMessage);
    // And it is retryable
    expect(isRetryableError(error)).toBe(true);
    expect(error.status).toBe(429);
  });
});
