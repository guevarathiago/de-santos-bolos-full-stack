import type { GoogleGenAI } from '@google/genai';
import { Embeddings } from '@langchain/core/embeddings';
import { EMBEDDING_DIMENSIONS } from '../documents/document-chunk.entity.js';

export const EMBEDDING_MODEL = 'gemini-embedding-2';

const BATCH_SIZE = 100;

type EmbeddingClient = Pick<GoogleGenAI['models'], 'embedContent'>;

// LangChain's Google packages have no embeddings class on the @google/genai SDK, so this one wraps it.
export class GeminiEmbeddings extends Embeddings {
    readonly #client: EmbeddingClient;

    constructor(client: EmbeddingClient) {
        super({});
        this.#client = client;
    }

    async #embedBatch(texts: string[]) {
        const response = await this.#client.embedContent({
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
    }

    async embedDocuments(texts: string[]) {
        const vectors: number[][] = [];

        for (let start = 0; start < texts.length; start += BATCH_SIZE) {
            vectors.push(...(await this.#embedBatch(texts.slice(start, start + BATCH_SIZE))));
        }

        return vectors;
    }

    async embedQuery(text: string) {
        const [vector] = await this.#embedBatch([text]);

        return vector!;
    }
}
