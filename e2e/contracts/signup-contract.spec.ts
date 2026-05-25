import { test, expect } from '@playwright/test';
import type { ApiResponse, ApiError } from '../../src/types/contracts';

function assertApiResponseShape(body: unknown, expectedSuccess: boolean): void {
  expect(body).toHaveProperty('success');
  const res = body as ApiResponse;
  expect(typeof res.success).toBe('boolean');
  expect(res.success).toBe(expectedSuccess);

  if (expectedSuccess) {
    expect(res.error).toBeUndefined();
  } else {
    expect(res.data).toBeUndefined();
    expect(res.error).toBeDefined();
  }

  if (res.error) {
    assertApiErrorShape(res.error);
  }

  const allowedKeys = ['success', 'data', 'error', 'meta'];
  for (const key of Object.keys(res as unknown as Record<string, unknown>)) {
    expect(allowedKeys).toContain(key);
  }
}

function assertApiErrorShape(error: ApiError): void {
  expect(typeof error.code).toBe('string');
  expect(error.code.length).toBeGreaterThan(0);
  expect(typeof error.message).toBe('string');
  expect(error.message.length).toBeGreaterThan(0);

  if (error.details !== undefined) {
    expect(typeof error.details).toBe('object');
    expect(error.details).not.toBeNull();
    for (const [, messages] of Object.entries(error.details)) {
      expect(Array.isArray(messages)).toBe(true);
      for (const msg of messages) {
        expect(typeof msg).toBe('string');
      }
    }
  }
}

test.describe('POST /api/auth/signup — ApiResponse contract conformance', () => {
  test('returns 201 with success response for valid signup data', async ({ request }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const res = await request.post('/api/auth/signup', {
      data: { name: 'Test User', email: uniqueEmail, password: 'securePass123' },
    });

    expect(res.status()).toBe(201);

    const body = await res.json();
    assertApiResponseShape(body, true);
  });

  test('returns 400 when email is missing', async ({ request }) => {
    const res = await request.post('/api/auth/signup', {
      data: { password: 'securePass123' },
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  test('returns 400 when password is too short', async ({ request }) => {
    const res = await request.post('/api/auth/signup', {
      data: { email: 'short@example.com', password: 'short' },
    });

    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('content-type is application/json', async ({ request }) => {
    const res = await request.post('/api/auth/signup', {
      data: { email: 'type@example.com', password: 'password123' },
    });

    expect(res.headers()['content-type']).toContain('application/json');
  });
});
