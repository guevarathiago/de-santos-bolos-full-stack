import type { GoogleGenAI } from '@google/genai';
import { EMBEDDING_DIMENSIONS } from '../documents/document-chunk.entity.js';

export const EMBEDDING_MODEL = 'gemini-embedding-2';

const BATCH_SIZE = 100;

type EmbeddingClient = Pick<GoogleGenAI['models'], 'embedContent'>;

export const createEmbeddingService = (client: EmbeddingClient) => {
    const embedBatch = async (texts: string[]) => {
        const response = await client.embedContent({
            model: EMBEDDING_MODEL,
            // A plain string array is merged into one input and returns a single embedding.
            contents: texts.map((text) => ({ parts: [{ text }] })),
            config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        });

        const vectors = (response.embeddings ?? []).map((embedding) => embedding.values ?? []);

        if (vectors.length !== texts.length) {
            throw new Error(`Expected ${texts.length} embeddings, received ${vectors.length}`);
        }

        if (vectors.some((vector) => vector.length !== EMBEDDING_DIMENSIONS)) {
            throw new Error(`Expected embeddings with ${EMBEDDING_DIMENSIONS} dimensions`);
        }

        return vectors;
    };

    return {
        async embedDocuments(texts: string[]) {
            const vectors: number[][] = [];

            for (let start = 0; start < texts.length; start += BATCH_SIZE) {
                vectors.push(...(await embedBatch(texts.slice(start, start + BATCH_SIZE))));
            }

            return vectors;
        },

        async embedQuery(text: string) {
            const [vector] = await embedBatch([text]);

            return vector!;
        },
    };
};

export type EmbeddingService = ReturnType<typeof createEmbeddingService>;
