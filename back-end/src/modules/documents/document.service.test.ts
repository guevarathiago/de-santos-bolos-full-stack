import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import type { EmbeddingService } from '../ai/embedding.service.js';
import { DocumentChunk } from './document-chunk.entity.js';
import { Document, DocumentStatus } from './document.entity.js';
import { createDocumentService } from './document.service.js';

const txtDocument = { id: 'doc-1', mimeType: 'text/plain' } as Document;

const makeDocuments = () => {
    const manager = {
        delete: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
    };

    const documents = {
        create: vi.fn((data: Partial<Document>) => data),
        save: vi.fn(async (data: Partial<Document>) => ({ id: 'doc-1', ...data })),
        update: vi.fn(),
        findOneByOrFail: vi.fn(async () => txtDocument),
        manager: { transaction: vi.fn(async (work: (m: typeof manager) => Promise<void>) => work(manager)) },
    };

    return { documents: documents as unknown as Repository<Document>, mocks: { ...documents, manager } };
};

const makeEmbeddings = (overrides: Partial<EmbeddingService> = {}): EmbeddingService => ({
    embedDocuments: vi.fn(async (texts: string[]) => texts.map(() => [0.1, 0.2])),
    embedQuery: vi.fn(),
    ...overrides,
});

describe('documentService.create', () => {
    it('saves a supported file as PENDING', async () => {
        const { documents, mocks } = makeDocuments();
        const service = createDocumentService({ documents, embeddings: makeEmbeddings() });

        await service.create({ filename: 'faq.txt', mimeType: 'text/plain', sizeBytes: 10, uploadedById: 'admin' });

        expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ status: DocumentStatus.PENDING }));
    });

    it('rejects unsupported files with 415 without saving', async () => {
        const { documents, mocks } = makeDocuments();
        const service = createDocumentService({ documents, embeddings: makeEmbeddings() });

        await expect(service.create({ filename: 'a.png', mimeType: 'image/png', sizeBytes: 10, uploadedById: null }))
            .rejects.toMatchObject({ status: 415 });
        expect(mocks.save).not.toHaveBeenCalled();
    });
});

describe('documentService.process', () => {
    it('stores one chunk per piece of text with its vector and marks the document READY', async () => {
        const { documents, mocks } = makeDocuments();
        const embeddings = makeEmbeddings();

        await createDocumentService({ documents, embeddings }).process(txtDocument, Buffer.from('Bolo de cenoura.'));

        expect(mocks.update).toHaveBeenCalledWith('doc-1', { status: DocumentStatus.PROCESSING, errorMessage: null });
        expect(embeddings.embedDocuments).toHaveBeenCalledWith(['Bolo de cenoura.']);
        expect(mocks.manager.delete).toHaveBeenCalledWith(DocumentChunk, { documentId: 'doc-1' });
        expect(mocks.manager.insert).toHaveBeenCalledWith(DocumentChunk, [{
            documentId: 'doc-1',
            chunkIndex: 0,
            content: 'Bolo de cenoura.',
            metadata: {},
            embedding: [0.1, 0.2],
        }]);
        expect(mocks.manager.update).toHaveBeenCalledWith(Document, 'doc-1', {
            status: DocumentStatus.READY,
            chunkCount: 1,
        });
    });

    it('marks the document FAILED when the embedding call fails, without saving chunks', async () => {
        const { documents, mocks } = makeDocuments();
        const embeddings = makeEmbeddings({ embedDocuments: vi.fn().mockRejectedValue(new Error('quota exceeded')) });

        await createDocumentService({ documents, embeddings }).process(txtDocument, Buffer.from('Bolo de cenoura.'));

        expect(mocks.manager.insert).not.toHaveBeenCalled();
        expect(mocks.update).toHaveBeenLastCalledWith('doc-1', {
            status: DocumentStatus.FAILED,
            errorMessage: 'quota exceeded',
        });
    });

    it('marks the document FAILED when the file has no text', async () => {
        const { documents, mocks } = makeDocuments();
        const embeddings = makeEmbeddings();

        await createDocumentService({ documents, embeddings }).process(txtDocument, Buffer.from('   '));

        expect(embeddings.embedDocuments).not.toHaveBeenCalled();
        expect(mocks.update).toHaveBeenLastCalledWith('doc-1', {
            status: DocumentStatus.FAILED,
            errorMessage: 'No text could be extracted from the file',
        });
    });
});
