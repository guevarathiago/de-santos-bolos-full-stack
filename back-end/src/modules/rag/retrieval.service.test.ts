import { describe, expect, it, vi } from 'vitest';
import type { EmbeddingService } from '../ai/embedding.service.js';
import { createRetrievalService } from './retrieval.service.js';

const makeEmbeddings = (): EmbeddingService => ({
    embedDocuments: vi.fn(),
    embedQuery: vi.fn().mockResolvedValue([0.1, -0.2, 0.3]),
});

const row = {
    id: 'chunk-1',
    documentId: 'doc-1',
    filename: 'politicas-entrega.pdf',
    content: 'Entregamos em Bertioga às sextas.',
    metadata: { page: 1 },
    similarity: '0.767',
};

describe('retrievalService.search', () => {
    it('embeds the question and searches with the vector and the limit', async () => {
        const manager = { query: vi.fn().mockResolvedValue([row]) };
        const embeddings = makeEmbeddings();

        await createRetrievalService({ manager, embeddings }).search('Entregam em Bertioga?', 3);

        expect(embeddings.embedQuery).toHaveBeenCalledWith('Entregam em Bertioga?');
        expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('<=>'), ['[0.1,-0.2,0.3]', 3]);
    });

    it('only searches documents that finished processing', async () => {
        const manager = { query: vi.fn().mockResolvedValue([]) };

        await createRetrievalService({ manager, embeddings: makeEmbeddings() }).search('x');

        expect(manager.query).toHaveBeenCalledWith(expect.stringContaining(`d.status = 'READY'`), expect.anything());
    });

    it('returns similarity as a number', async () => {
        const manager = { query: vi.fn().mockResolvedValue([row]) };

        const [chunk] = await createRetrievalService({ manager, embeddings: makeEmbeddings() }).search('x');

        expect(chunk?.similarity).toBe(0.767);
        expect(chunk?.filename).toBe('politicas-entrega.pdf');
    });

    it('uses 5 results by default', async () => {
        const manager = { query: vi.fn().mockResolvedValue([]) };

        await createRetrievalService({ manager, embeddings: makeEmbeddings() }).search('x');

        expect(manager.query).toHaveBeenCalledWith(expect.any(String), [expect.any(String), 5]);
    });
});
