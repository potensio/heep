import { UnauthorizedError, ConflictError } from '../errors';

export interface BubbleLoginResult {
  user_id: string;
  token: string;
}

export interface BubbleSignupResult {
  user_id: string;
}

export interface BubbleProfileResult {
  first_name: string;
  last_name: string;
  email: string;
  team_id: string | null;
}

export interface BubbleClient {
  login(email: string, password: string): Promise<BubbleLoginResult>;
  signup(firstName: string, lastName: string, email: string, password: string): Promise<BubbleSignupResult>;
  getProfile(bubbleToken: string): Promise<BubbleProfileResult>;
  sendMessage(conversationId: string, body: string): Promise<void>;
}

export function createBubbleClient(apiUrl: string, apiKey: string): BubbleClient {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async login(email, password) {
      const res = await fetch(`${apiUrl}/hono-login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new UnauthorizedError('Invalid email or password');
      const data = await res.json() as { status: string; response: { user_id: string; token: string } };
      if (data.status !== 'success') throw new UnauthorizedError('Invalid email or password');
      return { user_id: data.response.user_id, token: data.response.token };
    },

    async signup(firstName, lastName, email, password) {
      const res = await fetch(`${apiUrl}/hono-signup`, {
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

    async getProfile(bubbleToken) {
      const res = await fetch(`${apiUrl}/hono-me`, {
        method: 'POST',
        headers: { ...headers, Authorization: `Bearer ${bubbleToken}` },
      });
      if (!res.ok) throw new Error(`Bubble getProfile failed: ${res.status}`);
      const data = await res.json() as { status: string; response: BubbleProfileResult };
      if (data.status !== 'success') throw new Error('getProfile failed');
      return {
        first_name: data.response.first_name,
        last_name: data.response.last_name,
        email: data.response.email,
        team_id: data.response.team_id ?? null,
      };
    },

    async sendMessage(conversationId, body) {
      const res = await fetch(`${apiUrl}/hono-conversations-send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversation_id: conversationId, body }),
      });
      if (!res.ok) throw new Error(`Bubble sendMessage failed: ${res.status}`);
    },
  };
}
