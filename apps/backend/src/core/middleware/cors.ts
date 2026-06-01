// src/core/middleware/cors.ts
// TODO(Task 6): env singleton removed; accept ParsedEnv as a parameter instead.
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: '*', // TODO(Task 6): restore WEB_ORIGIN logic once env is injected
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
