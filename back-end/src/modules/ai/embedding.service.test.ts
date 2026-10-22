import type { EmbedContentParameters } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import { EMBEDDING_DIMENSIONS } from '../documents/document-chunk.entity.js';
import { GeminiEmbeddings } from './embedding.service.js';

const textOf = (content: unknown) => (content as { parts: [{ text: string }] }).parts[0].text;

const makeClient = () => ({
    embedContent: vi.fn(async ({ contents }: EmbedContentParameters) => ({
        embeddings: (contents as unknown[]).map((content) => ({
            values: Array<number>(EMBEDDING_DIMENSIONS).fill(textOf(content).length),
        })),
    })),
});

describe('GeminiEmbeddings.embedDocuments', () => {
    it('returns one vector per text, in the same order', async () => {
        const embeddings = new GeminiEmbeddings(makeClient());

        const vectors = await embeddings.embedDocuments(['a', 'bb', 'ccc']);

        expect(vectors.map((vector) => vector[0])).toEqual([1, 2, 3]);
        expect(vectors[0]).toHaveLength(EMBEDDING_DIMENSIONS);
    });

    it('sends each text as a separate content with the configured dimensions', async () => {
        const client = makeClient();

        await new GeminiEmbeddings(client).embedDocuments(['a', 'bb']);

        expect(client.embedContent).toHaveBeenCalledWith(expect.objectContaining({
            contents: [{ parts: [{ text: 'a' }] }, { parts: [{ text: 'bb' }] }],
            config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        }));
    });

    it('splits large inputs into batches of 100 and keeps the order', async () => {
        const client = makeClient();
        const texts = Array.from({ length: 250 }, (_, i) => 'x'.repeat(i + 1));

        const vectors = await new GeminiEmbeddings(client).embedDocuments(texts);

        expect(client.embedContent).toHaveBeenCalledTimes(3);
        expect(vectors).toHaveLength(250);
        expect(vectors[249]?.[0]).toBe(250);
    });

    it('does not call the API for an empty list', async () => {
        const client = makeClient();

        expect(await new GeminiEmbeddings(client).embedDocuments([])).toEqual([]);
        expect(client.embedContent).not.toHaveBeenCalled();
    });

    it('fails when the API returns fewer vectors than texts', async () => {
        const client = { embedContent: vi.fn().mockResolvedValue({ embeddings: [{ values: [] }] }) };

        await expect(new GeminiEmbeddings(client).embedDocuments(['a', 'b']))
            .rejects.toThrow('Expected 2 embeddings, received 1');
    });

    it('fails when a vector has the wrong size', async () => {
        const client = { embedContent: vi.fn().mockResolvedValue({ embeddings: [{ values: [0.1, 0.2] }] }) };

        await expect(new GeminiEmbeddings(client).embedDocuments(['a']))
            .rejects.toThrow(`Expected embeddings with ${EMBEDDING_DIMENSIONS} dimensions`);
    });
});

describe('GeminiEmbeddings.embedQuery', () => {
    it('returns a single vector', async () => {
        const vector = await new GeminiEmbeddings(makeClient()).embedQuery('pergunta');

        expect(vector).toHaveLength(EMBEDDING_DIMENSIONS);
        expect(vector[0]).toBe('pergunta'.length);
    });
});
