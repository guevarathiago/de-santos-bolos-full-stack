import type { MigrationInterface, QueryRunner } from 'typeorm';
import { EMBEDDING_DIMENSIONS } from '../../modules/documents/document-chunk.entity.js';

export class DocumentsAndChunks1791942447112 implements MigrationInterface {
    name = 'DocumentsAndChunks1791942447112';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        await queryRunner.query(`CREATE TYPE "document_status" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED')`);
        await queryRunner.query(`
            CREATE TABLE "Document" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "filename" TEXT NOT NULL,
                "mimeType" TEXT NOT NULL,
                "sizeBytes" INTEGER NOT NULL,
                "status" "document_status" NOT NULL DEFAULT 'PENDING',
                "errorMessage" TEXT,
                "chunkCount" INTEGER NOT NULL DEFAULT 0,
                "uploadedById" UUID,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "Document_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById")
                    REFERENCES "User" ("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "DocumentChunk" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "documentId" UUID NOT NULL,
                "chunkIndex" INTEGER NOT NULL,
                "content" TEXT NOT NULL,
                "metadata" JSONB NOT NULL DEFAULT '{}',
                "embedding" vector(${EMBEDDING_DIMENSIONS}) NOT NULL,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId")
                    REFERENCES "Document" ("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk" ("documentId")`);

        await queryRunner.query(`
            CREATE INDEX "DocumentChunk_embedding_hnsw_idx" ON "DocumentChunk"
            USING hnsw ("embedding" vector_cosine_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "DocumentChunk"`);
        await queryRunner.query(`DROP TABLE "Document"`);
        await queryRunner.query(`DROP TYPE "document_status"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
    }
}
