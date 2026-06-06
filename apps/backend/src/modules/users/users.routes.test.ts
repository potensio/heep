// src/modules/users/users.routes.test.ts
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { signAccessToken } from '../../core/jwt';
import { createUsersRepository } from './users.repository';
import { testDb as db } from '../../core/test/db';

const usersRepository = createUsersRepository(db);

useTestDb();

const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: 'test-access-secret-16chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16ch',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  OTP_TTL: '300',
  OTP_MAX_ATTEMPTS: '5',
  EMAIL_FROM: 'test@example.com',
  WEB_ORIGIN: 'http://localhost:5173',
  CHAT_ROOM: {} as any,
};

describe('users routes (integration)', () => {
  it('GET /users/:id returns a public profile', async () => {
    const u = await usersRepository.create({ email: 'pub@example.com' });
    await usersRepository.update(u.id, { name: 'Public Person' });
    const res = await createApp().request(`/users/${u.id}`, {}, testEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: u.id, name: 'Public Person' });
  });

  it('GET /users/:id returns 404 for unknown id', async () => {
    const res = await createApp().request('/users/00000000-0000-0000-0000-000000000000', {}, testEnv);
    expect(res.status).toBe(404);
  });

  it('GET /users/me requires auth', async () => {
    const res = await createApp().request('/users/me', {}, testEnv);
    expect(res.status).toBe(401);
  });

  it('GET /users/me returns the authenticated user', async () => {
    const u = await usersRepository.create({ email: 'me@example.com' });
    const token = await signAccessToken(u.id);
    const res = await createApp().request('/users/me', { headers: { Authorization: `Bearer ${token}` } }, testEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: u.id, email: 'me@example.com' });
  });

  it('PATCH /users/me updates the profile and flips profileCompleted', async () => {
    const u = await usersRepository.create({ email: 'edit@example.com' });
    const token = await signAccessToken(u.id);
    const res = await createApp().request('/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Edited', gender: 'male' }),
    }, testEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: 'Edited', profileCompleted: true });
  });
});

describe('GET /users/:id — extended response', () => {
  it('includes createdAt', async () => {
    const u = await usersRepository.create({ email: 'extended@example.com' });
    const res = await createApp().request(`/users/${u.id}`, {}, testEnv);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(typeof body.createdAt).toBe('string');
  });
});
