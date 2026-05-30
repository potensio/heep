import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './core/env';

const app = createApp();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`BantuJual API listening on http://localhost:${info.port}`);
});
