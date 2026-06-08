const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface AuthUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  profile_completed: boolean;
  bubble_token: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function loginApi(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Invalid email or password');
  }
  return res.json() as Promise<AuthTokens>;
}

export async function signupApi(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  if (res.status === 409) throw new Error('Email already registered');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? 'Signup failed');
  }
  return res.json() as Promise<AuthTokens>;
}
