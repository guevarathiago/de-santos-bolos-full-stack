import { Document } from '@langchain/core/documents';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import { BaseRetriever, type BaseRetrieverInput } from '@langchain/core/retrievers';
import type { EntityManager } from 'typeorm';
import type { ChunkMetadata } from '../documents/document-chunk.entity.js';

export type RetrievedMetadata = ChunkMetadata & {
    chunkId: string;
    documentId: string;
    filename: string;
    similarity: number;
};

type ChunkRow = {
    id: string;
    documentId: string;
    filename: string;
    content: string;
    metadata: ChunkMetadata;
    similarity: string | number;
};

type ChunkRetrieverInput = BaseRetrieverInput & {
    manager: Pick<EntityManager, 'query'>;
    embeddings: Pick<EmbeddingsInterface, 'embedQuery'>;
    k?: number;
    minSimilarity?: number;
};

export const DEFAULT_K = 5;

export const MIN_SIMILARITY = 0.5;

export class ChunkRetriever extends BaseRetriever<RetrievedMetadata> {
    lc_namespace = ['de-santos-bolos', 'rag'];

    readonly #manager: ChunkRetrieverInput['manager'];

    readonly #embeddings: ChunkRetrieverInput['embeddings'];

    readonly k: number;

    readonly minSimilarity: number;

    constructor({ manager, embeddings, k = DEFAULT_K, minSimilarity = MIN_SIMILARITY, ...fields }: ChunkRetrieverInput) {
        super(fields);
        this.#manager = manager;
        this.#embeddings = embeddings;
        this.k = k;
        this.minSimilarity = minSimilarity;
    }

    async _getRelevantDocuments(query: string) {
        const vector = await this.#embeddings.embedQuery(query);

        const rows: ChunkRow[] = await this.#manager.query(
            `SELECT c.id, c."documentId", d.filename, c.content, c.metadata,
                    1 - (c.embedding <=> $1::vector) AS similarity
             FROM "DocumentChunk" c
             JOIN "Document" d ON d.id = c."documentId"
             WHERE d.status = 'READY'
             ORDER BY c.embedding <=> $1::vector
             LIMIT $2`,
            [`[${vector.join(',')}]`, this.k],
        );

        return rows
            .map((row) => ({ ...row, similarity: Number(row.similarity) }))
            .filter((row) => row.similarity >= this.minSimilarity)
            .map(({ id, documentId, filename, content, metadata, similarity }) => new Document<RetrievedMetadata>({
                pageContent: content,
                metadata: { ...metadata, chunkId: id, documentId, filename, similarity },
            }));
    }
}
