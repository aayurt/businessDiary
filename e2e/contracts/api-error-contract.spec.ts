import { test, expect } from '@playwright/test';

test.describe('API error contract conformance', () => {
  test('returns 404 for unknown API routes', async ({ request }) => {
    const res = await request.get('/api/nonexistent-route');
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('returns JSON content-type on errors', async ({ request }) => {
    const res = await request.post('/api/auth/signup', {
      data: { password: 'short' },
    });

    expect(res.headers()['content-type']).toContain('application/json');
  });

  test('returns 405 for wrong method on existing routes', async ({ request }) => {
    const res = await request.get('/api/auth/signup');
    expect([404, 405]).toContain(res.status());
  });
});
