import { describe, expect, it, vi } from 'vitest';
import { ChunkRetriever } from './retrieval.service.js';

const makeEmbeddings = () => ({ embedQuery: vi.fn().mockResolvedValue([0.1, -0.2, 0.3]) });

const row = {
    id: 'chunk-1',
    documentId: 'doc-1',
    filename: 'politicas-entrega.pdf',
    content: 'Entregamos em Bertioga às sextas.',
    metadata: { page: 1 },
    similarity: '0.767',
};

describe('ChunkRetriever', () => {
    it('embeds the question and searches with the vector and k', async () => {
        const manager = { query: vi.fn().mockResolvedValue([row]) };
        const embeddings = makeEmbeddings();

        await new ChunkRetriever({ manager, embeddings, k: 3 }).invoke('Entregam em Bertioga?');

        expect(embeddings.embedQuery).toHaveBeenCalledWith('Entregam em Bertioga?');
        expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('<=>'), ['[0.1,-0.2,0.3]', 3]);
    });

    it('only searches documents that finished processing', async () => {
        const manager = { query: vi.fn().mockResolvedValue([]) };

        await new ChunkRetriever({ manager, embeddings: makeEmbeddings() }).invoke('x');

        expect(manager.query).toHaveBeenCalledWith(expect.stringContaining(`d.status = 'READY'`), expect.anything());
    });

    it('returns LangChain documents with the chunk text and its source in the metadata', async () => {
        const manager = { query: vi.fn().mockResolvedValue([row]) };

        const [document] = await new ChunkRetriever({ manager, embeddings: makeEmbeddings() }).invoke('x');

        expect(document?.pageContent).toBe('Entregamos em Bertioga às sextas.');
        expect(document?.metadata).toEqual({
            chunkId: 'chunk-1',
            documentId: 'doc-1',
            filename: 'politicas-entrega.pdf',
            page: 1,
            similarity: 0.767,
        });
    });

    it('drops chunks below the minimum similarity', async () => {
        const manager = { query: vi.fn().mockResolvedValue([row, { ...row, id: 'weak', similarity: '0.45' }]) };

        const documents = await new ChunkRetriever({ manager, embeddings: makeEmbeddings() }).invoke('x');

        expect(documents.map(({ metadata }) => metadata.chunkId)).toEqual(['chunk-1']);
    });

    it('uses 5 results by default', async () => {
        const manager = { query: vi.fn().mockResolvedValue([]) };

        await new ChunkRetriever({ manager, embeddings: makeEmbeddings() }).invoke('x');

        expect(manager.query).toHaveBeenCalledWith(expect.any(String), [expect.any(String), 5]);
    });
});
