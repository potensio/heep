import { describe, it, expect } from 'vitest';
import { createApp } from './app';

describe('app', () => {
  it('GET /health returns ok', async () => {
    const app = createApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('unknown route returns 404 JSON', async () => {
    const app = createApp();
    const res = await app.request('/nope');
    expect(res.status).toBe(404);
  });
});
