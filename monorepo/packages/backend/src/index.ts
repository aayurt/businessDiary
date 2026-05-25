import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { ApiResponse } from '@monorepo/shared';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

app.get('/api/health', (c) => {
  const response: ApiResponse = {
    success: true,
    data: { status: 'ok', uptime: process.uptime() },
    timestamp: new Date().toISOString(),
  };
  return c.json(response);
});

const port = Number(process.env.PORT) || 3001;

export default {
  port,
  fetch: app.fetch,
  start: () => {
    console.log(`Server running on http://localhost:${port}`);
  },
};
