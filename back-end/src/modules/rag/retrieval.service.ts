import type { EntityManager } from 'typeorm';
import type { EmbeddingService } from '../ai/embedding.service.js';
import type { ChunkMetadata } from '../documents/document-chunk.entity.js';

export type RetrievedChunk = {
    id: string;
    documentId: string;
    filename: string;
    content: string;
    metadata: ChunkMetadata;
    similarity: number;
};

type RetrievalDependencies = {
    manager: Pick<EntityManager, 'query'>;
    embeddings: EmbeddingService;
};

const DEFAULT_LIMIT = 5;

export const createRetrievalService = ({ manager, embeddings }: RetrievalDependencies) => ({
    async search(question: string, limit = DEFAULT_LIMIT): Promise<RetrievedChunk[]> {
        const vector = await embeddings.embedQuery(question);

        const rows: RetrievedChunk[] = await manager.query(
            `SELECT c.id, c."documentId", d.filename, c.content, c.metadata,
                    1 - (c.embedding <=> $1::vector) AS similarity
             FROM "DocumentChunk" c
             JOIN "Document" d ON d.id = c."documentId"
             WHERE d.status = 'READY'
             ORDER BY c.embedding <=> $1::vector
             LIMIT $2`,
            [`[${vector.join(',')}]`, limit],
        );

        return rows.map((row) => ({ ...row, similarity: Number(row.similarity) }));
    },
});

export type RetrievalService = ReturnType<typeof createRetrievalService>;
