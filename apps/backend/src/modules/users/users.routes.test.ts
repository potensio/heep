// src/modules/users/users.routes.test.ts
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { signAccessToken } from '../../core/jwt';
import { usersRepository } from './users.repository';

useTestDb();

describe('users routes (integration)', () => {
  it('GET /users/:id returns a public profile', async () => {
    const u = await usersRepository.create({ email: 'pub@example.com' });
    await usersRepository.update(u.id, { name: 'Public Person' });
    const res = await createApp().request(`/users/${u.id}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: u.id, name: 'Public Person' });
  });

  it('GET /users/:id returns 404 for unknown id', async () => {
    const res = await createApp().request('/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('GET /users/me requires auth', async () => {
    const res = await createApp().request('/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /users/me returns the authenticated user', async () => {
    const u = await usersRepository.create({ email: 'me@example.com' });
    const token = await signAccessToken(u.id);
    const res = await createApp().request('/users/me', { headers: { Authorization: `Bearer ${token}` } });
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
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: 'Edited', profileCompleted: true });
  });
});
