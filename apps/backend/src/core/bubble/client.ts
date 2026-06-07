import { UnauthorizedError, ConflictError } from '../errors';

export interface BubbleLoginResult {
  user_id: string;
}

export interface BubbleSignupResult {
  user_id: string;
}

export interface BubbleClient {
  login(email: string, password: string): Promise<BubbleLoginResult>;
  signup(firstName: string, lastName: string, email: string, password: string): Promise<BubbleSignupResult>;
}

export function createBubbleClient(apiUrl: string, apiKey: string): BubbleClient {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async login(email, password) {
      const res = await fetch(`${apiUrl}/api/1.1/wf/hono-login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new UnauthorizedError('Invalid email or password');
      const data = await res.json() as { status: string; response: { user_id: string } };
      if (data.status !== 'success') throw new UnauthorizedError('Invalid email or password');
      return { user_id: data.response.user_id };
    },

    async signup(firstName, lastName, email, password) {
      const res = await fetch(`${apiUrl}/api/1.1/wf/hono-signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      if (res.status === 409) throw new ConflictError('Email already registered');
      if (!res.ok) throw new Error(`Bubble signup failed: ${res.status}`);
      const data = await res.json() as { status: string; response: { user_id: string } };
      if (data.status !== 'success') throw new Error('Signup failed');
      return { user_id: data.response.user_id };
    },
  };
}
