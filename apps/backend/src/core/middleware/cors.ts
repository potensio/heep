// src/core/middleware/cors.ts
import { cors } from 'hono/cors';
import { env } from '../env';

export const corsMiddleware = cors({
  origin: env.NODE_ENV === 'development' ? '*' : env.WEB_ORIGIN,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
