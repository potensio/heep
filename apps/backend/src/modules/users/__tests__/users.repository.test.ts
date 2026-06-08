// src/modules/users/__tests__/users.repository.test.ts
import { describe, it, expect } from 'vitest';
import { testDb, useTestDb } from '../../../core/test/db';
import { createUsersRepository } from '../users.repository';

useTestDb();

const usersRepository = createUsersRepository(testDb);

describe('usersRepository (integration)', () => {
  it('create then findByEmail returns the row', async () => {
    const created = await usersRepository.create({ email: 'a@example.com' });
    expect(created.id).toBeTruthy();
    expect(created.email).toBe('a@example.com');
    expect(created.profileCompleted).toBe(false);

    const found = await usersRepository.findByEmail('a@example.com');
    expect(found?.id).toBe(created.id);
  });

  it('findByEmail returns null when absent', async () => {
    expect(await usersRepository.findByEmail('missing@example.com')).toBeNull();
  });

  it('findById returns the row or null', async () => {
    const created = await usersRepository.create({ email: 'b@example.com' });
    expect((await usersRepository.findById(created.id))?.email).toBe('b@example.com');
    expect(await usersRepository.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('update patches fields and bumps updatedAt', async () => {
    const created = await usersRepository.create({ email: 'c@example.com' });
    const updated = await usersRepository.update(created.id, {
      name: 'Citra', gender: 'female', profileCompleted: true,
    });
    expect(updated.name).toBe('Citra');
    expect(updated.gender).toBe('female');
    expect(updated.profileCompleted).toBe(true);
  });
});
