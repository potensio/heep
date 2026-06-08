export interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL: string;
  BUBBLE_API_URL: string;
  BUBBLE_DATA_URL: string;
  BUBBLE_API_KEY: string;
  WEBHOOK_SECRET: string;
  WEB_ORIGIN: string;
  CONNECTIONS: DurableObjectNamespace;
}
