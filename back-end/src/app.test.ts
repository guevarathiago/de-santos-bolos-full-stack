import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { HttpError } from './errors/http-error.js';
import { authenticate } from './middlewares/authenticate.js';
import { authorize } from './middlewares/authorize.js';
import type { AuthService } from './modules/auth/auth.service.js';
import type { DocumentService } from './modules/documents/document.service.js';
import type { RagService } from './modules/rag/rag.service.js';
import { signToken } from './modules/auth/token.js';
import { UserRole } from './modules/users/user.entity.js';

const maria = { id: '1', name: 'Maria', email: 'maria@example.com', role: UserRole.USER };
const admin = { ...maria, id: '2', role: UserRole.ADMIN };

const makeAuthService = (overrides: Partial<AuthService> = {}): AuthService => ({
    login: vi.fn().mockResolvedValue(maria),
    register: vi.fn().mockResolvedValue(maria),
    ...overrides,
});

const makeApp = (authService = makeAuthService()) =>
    createApp({ authService, documentService: {} as DocumentService, ragService: {} as RagService });

const tokenCookie = (token: string) => [`token=${token}`];

describe('POST /login', () => {
    it('sets an httpOnly cookie on success', async () => {
        const res = await request(makeApp())
            .post('/login')
            .send({ email: 'maria@example.com', password: 'secret' });

        expect(res.status).toBe(200);
        expect(res.body.user).toEqual(maria);
        expect(res.headers['set-cookie']?.[0]).toMatch(/^token=.+HttpOnly/);
    });

    it('returns 400 and skips the service for an invalid body', async () => {
        const authService = makeAuthService();

        const res = await request(makeApp(authService)).post('/login').send({ email: 'x' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toHaveProperty('email');
        expect(authService.login).not.toHaveBeenCalled();
    });

    it('maps service HttpErrors to their status', async () => {
        const authService = makeAuthService({ login: vi.fn().mockRejectedValue(new HttpError(401, 'Invalid')) });

        const res = await request(makeApp(authService))
            .post('/login')
            .send({ email: 'maria@example.com', password: 'wrong' });

        expect(res.status).toBe(401);
    });

    it('returns 500 without leaking unexpected errors', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const authService = makeAuthService({ login: vi.fn().mockRejectedValue(new Error('db down')) });

        const res = await request(makeApp(authService))
            .post('/login')
            .send({ email: 'maria@example.com', password: 'secret' });

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: 'Internal server error' });
    });
});

describe('GET /me', () => {
    const app = makeApp();

    it('returns the user from a valid token', async () => {
        const res = await request(app).get('/me').set('Cookie', tokenCookie(signToken(maria)));

        expect(res.status).toBe(200);
        expect(res.body.user).toEqual(maria);
    });

    it('returns 401 without a token', async () => {
        expect((await request(app).get('/me')).status).toBe(401);
    });

    it('returns 401 for a token signed with another secret', async () => {
        const forged = jwt.sign(admin, 'other-secret');

        expect((await request(app).get('/me').set('Cookie', tokenCookie(forged))).status).toBe(401);
    });

    it('returns 401 for an old token without role', async () => {
        const { role: _role, ...withoutRole } = maria;
        const legacy = jwt.sign(withoutRole, 'test-secret');

        expect((await request(app).get('/me').set('Cookie', tokenCookie(legacy))).status).toBe(401);
    });
});

describe('authorize(ADMIN)', () => {
    const app = express()
        .use(cookieParser())
        .get('/admin', authenticate, authorize(UserRole.ADMIN), (_req, res) => res.json({ ok: true }));

    it('allows admins', async () => {
        const res = await request(app).get('/admin').set('Cookie', tokenCookie(signToken(admin)));

        expect(res.status).toBe(200);
    });

    it('forbids regular users', async () => {
        const res = await request(app).get('/admin').set('Cookie', tokenCookie(signToken(maria)));

        expect(res.status).toBe(403);
    });

    it('rejects anonymous requests', async () => {
        expect((await request(app).get('/admin')).status).toBe(401);
    });
});
