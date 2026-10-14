import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import type { AuthService } from '../auth/auth.service.js';
import { signToken } from '../auth/token.js';
import type { DocumentService } from '../documents/document.service.js';
import type { RagService } from '../rag/rag.service.js';
import { UserRole } from '../users/user.entity.js';
import { MAX_MESSAGE_LENGTH } from './chat.schemas.js';

const customer = { id: 'user-id', name: 'Maria', email: 'maria@example.com', role: UserRole.USER };
const cookie = [`token=${signToken(customer)}`];

const reply = {
    answer: 'Sim, às sextas e sábados [1].',
    sources: [{ documentId: 'doc-1', filename: 'politicas-entrega.pdf', page: 1 }],
};

const makeApp = (ragService: RagService = { answer: vi.fn().mockResolvedValue(reply) }) => ({
    app: createApp({ authService: {} as AuthService, documentService: {} as DocumentService, ragService }),
    ragService,
});

describe('POST /chat', () => {
    it('answers a logged-in customer with the answer and its sources', async () => {
        const { app, ragService } = makeApp();

        const res = await request(app).post('/chat').set('Cookie', cookie).send({ message: '  Entregam em Bertioga?  ' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(reply);
        expect(ragService.answer).toHaveBeenCalledWith('Entregam em Bertioga?');
    });

    it('rejects anonymous requests with 401', async () => {
        const { app, ragService } = makeApp();

        const res = await request(app).post('/chat').send({ message: 'Oi' });

        expect(res.status).toBe(401);
        expect(ragService.answer).not.toHaveBeenCalled();
    });

    it.each([
        ['missing message', {}],
        ['blank message', { message: '   ' }],
        ['message that is not text', { message: 42 }],
        ['message that is too long', { message: 'a'.repeat(MAX_MESSAGE_LENGTH + 1) }],
    ])('rejects a %s with 400', async (_label, body) => {
        const { app, ragService } = makeApp();

        const res = await request(app).post('/chat').set('Cookie', cookie).send(body);

        expect(res.status).toBe(400);
        expect(ragService.answer).not.toHaveBeenCalled();
    });

    it('returns 500 when the model fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { app } = makeApp({ answer: vi.fn().mockRejectedValue(new Error('UNAVAILABLE')) });

        const res = await request(app).post('/chat').set('Cookie', cookie).send({ message: 'Oi' });

        expect(res.status).toBe(500);
    });
});
