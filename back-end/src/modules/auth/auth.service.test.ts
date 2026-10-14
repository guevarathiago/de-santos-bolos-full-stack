import bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../errors/http-error.js';
import { UserRole, type User } from '../users/user.entity.js';
import { createAuthService } from './auth.service.js';

const makeRepository = (overrides: Partial<Record<keyof Repository<User>, unknown>> = {}) =>
    ({
        findOne: vi.fn(),
        existsBy: vi.fn(),
        create: vi.fn((data: Partial<User>) => data),
        save: vi.fn(async (data: Partial<User>) => ({ id: 'new-id', role: UserRole.USER, ...data })),
        ...overrides,
    }) as unknown as Repository<User>;

const registerInput = {
    name: 'Maria',
    email: 'maria@example.com',
    password: 'secret',
    celular: '11985403039',
    cep: '11070011',
};

describe('authService.login', () => {
    it('returns the public user when the password matches', async () => {
        const password = await bcrypt.hash('secret', 4);
        const users = makeRepository({
            findOne: vi.fn().mockResolvedValue({
                id: '1', name: 'Maria', email: 'maria@example.com', role: UserRole.ADMIN, password,
            }),
        });

        const user = await createAuthService(users).login({ email: 'maria@example.com', password: 'secret' });

        expect(user).toEqual({ id: '1', name: 'Maria', email: 'maria@example.com', role: UserRole.ADMIN });
    });

    it('rejects a wrong password with 401', async () => {
        const password = await bcrypt.hash('secret', 4);
        const users = makeRepository({ findOne: vi.fn().mockResolvedValue({ id: '1', password }) });

        await expect(createAuthService(users).login({ email: 'a@b.com', password: 'wrong' }))
            .rejects.toMatchObject({ status: 401 });
    });

    it('rejects an unknown email with 404', async () => {
        const users = makeRepository({ findOne: vi.fn().mockResolvedValue(null) });

        await expect(createAuthService(users).login({ email: 'a@b.com', password: 'x' }))
            .rejects.toBeInstanceOf(HttpError);
    });
});

describe('authService.register', () => {
    it('hashes the password and never returns it', async () => {
        const users = makeRepository({ existsBy: vi.fn().mockResolvedValue(false) });

        const user = await createAuthService(users).register(registerInput);

        const saved = vi.mocked(users.save).mock.calls[0]?.[0] as User;
        expect(saved.password).not.toBe('secret');
        expect(await bcrypt.compare('secret', saved.password)).toBe(true);
        expect(user).toEqual({ id: 'new-id', name: 'Maria', email: 'maria@example.com', role: UserRole.USER });
    });

    it('rejects a duplicated email with 409', async () => {
        const users = makeRepository({ existsBy: vi.fn().mockResolvedValue(true) });

        await expect(createAuthService(users).register(registerInput)).rejects.toMatchObject({ status: 409 });
        expect(users.save).not.toHaveBeenCalled();
    });
});
