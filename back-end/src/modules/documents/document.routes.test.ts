import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import type { ConversationService } from '../conversations/conversation.service.js';
import { HttpError } from '../../errors/http-error.js';
import type { AuthService } from '../auth/auth.service.js';
import type { RagService } from '../rag/rag.service.js';
import { signToken } from '../auth/token.js';
import { UserRole } from '../users/user.entity.js';
import { DocumentStatus, type Document } from './document.entity.js';
import { MAX_UPLOAD_BYTES } from './document.routes.js';
import type { DocumentService } from './document.service.js';

const admin = { id: 'admin-id', name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN };
const customer = { id: 'user-id', name: 'Maria', email: 'maria@example.com', role: UserRole.USER };
const documentId = '6f1c2b9e-8a4d-4f0e-9b7a-1c2d3e4f5a6b';

const pending = { id: documentId, filename: 'faq.txt', status: DocumentStatus.PENDING } as Document;

const makeDocumentService = (overrides: Partial<DocumentService> = {}): DocumentService => ({
    create: vi.fn().mockResolvedValue(pending),
    process: vi.fn().mockResolvedValue(pending),
    list: vi.fn().mockResolvedValue([pending]),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

const makeApp = (documentService = makeDocumentService()) =>
    createApp({
        authService: {} as AuthService,
        documentService,
        ragService: {} as RagService,
        conversationService: {} as ConversationService,
    });

const as = (user: typeof admin) => [`token=${signToken(user)}`];

describe('access control on /admin/documents', () => {
    it('rejects anonymous requests with 401', async () => {
        expect((await request(makeApp()).get('/admin/documents')).status).toBe(401);
    });

    it('rejects regular users with 403', async () => {
        const res = await request(makeApp()).get('/admin/documents').set('Cookie', as(customer));

        expect(res.status).toBe(403);
    });
});

describe('POST /admin/documents', () => {
    it('creates the document, answers 202 and processes it in the background', async () => {
        const documentService = makeDocumentService();

        const res = await request(makeApp(documentService))
            .post('/admin/documents')
            .set('Cookie', as(admin))
            .attach('file', Buffer.from('Bolo de cenoura.'), { filename: 'faq.txt', contentType: 'text/plain' });

        expect(res.status).toBe(202);
        expect(res.body.document.status).toBe(DocumentStatus.PENDING);
        expect(documentService.create).toHaveBeenCalledWith({
            filename: 'faq.txt',
            mimeType: 'text/plain',
            sizeBytes: 16,
            uploadedById: 'admin-id',
        });
        expect(documentService.process).toHaveBeenCalledWith(pending, Buffer.from('Bolo de cenoura.'));
    });

    it('keeps accented file names', async () => {
        const documentService = makeDocumentService();

        await request(makeApp(documentService))
            .post('/admin/documents')
            .set('Cookie', as(admin))
            .attach('file', Buffer.from('x'), { filename: 'políticas.txt', contentType: 'text/plain' });

        expect(documentService.create).toHaveBeenCalledWith(expect.objectContaining({ filename: 'políticas.txt' }));
    });

    it('returns 400 when no file is sent', async () => {
        const res = await request(makeApp()).post('/admin/documents').set('Cookie', as(admin));

        expect(res.status).toBe(400);
    });

    it('returns 413 for files above the size limit', async () => {
        const documentService = makeDocumentService();

        const res = await request(makeApp(documentService))
            .post('/admin/documents')
            .set('Cookie', as(admin))
            .attach('file', Buffer.alloc(MAX_UPLOAD_BYTES + 1), { filename: 'big.txt', contentType: 'text/plain' });

        expect(res.status).toBe(413);
        expect(documentService.create).not.toHaveBeenCalled();
    });

    it('returns the service error for unsupported files', async () => {
        const documentService = makeDocumentService({
            create: vi.fn().mockRejectedValue(new HttpError(415, 'Unsupported file type: image/png')),
        });

        const res = await request(makeApp(documentService))
            .post('/admin/documents')
            .set('Cookie', as(admin))
            .attach('file', Buffer.from('x'), { filename: 'foto.png', contentType: 'image/png' });

        expect(res.status).toBe(415);
        expect(documentService.process).not.toHaveBeenCalled();
    });
});

describe('GET /admin/documents', () => {
    it('lists the documents', async () => {
        const res = await request(makeApp()).get('/admin/documents').set('Cookie', as(admin));

        expect(res.status).toBe(200);
        expect(res.body.documents).toHaveLength(1);
    });
});

describe('DELETE /admin/documents/:id', () => {
    it('deletes the document', async () => {
        const documentService = makeDocumentService();

        const res = await request(makeApp(documentService))
            .delete(`/admin/documents/${documentId}`)
            .set('Cookie', as(admin));

        expect(res.status).toBe(204);
        expect(documentService.remove).toHaveBeenCalledWith(documentId);
    });

    it('returns 400 for an invalid id', async () => {
        const res = await request(makeApp()).delete('/admin/documents/abc').set('Cookie', as(admin));

        expect(res.status).toBe(400);
    });

    it('returns 404 when the document does not exist', async () => {
        const documentService = makeDocumentService({
            remove: vi.fn().mockRejectedValue(new HttpError(404, 'Document not found')),
        });

        const res = await request(makeApp(documentService))
            .delete(`/admin/documents/${documentId}`)
            .set('Cookie', as(admin));

        expect(res.status).toBe(404);
    });
});
