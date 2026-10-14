import type { Repository } from 'typeorm';
import { HttpError } from '../../errors/http-error.js';
import type { EmbeddingService } from '../ai/embedding.service.js';
import { chunkPages } from './chunker.js';
import { DocumentChunk } from './document-chunk.entity.js';
import { Document, DocumentStatus } from './document.entity.js';
import { extractText, SUPPORTED_MIME_TYPES } from './text-extractor.js';

type DocumentServiceDependencies = {
    documents: Repository<Document>;
    embeddings: EmbeddingService;
};

type NewDocument = {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string | null;
};

export const createDocumentService = ({ documents, embeddings }: DocumentServiceDependencies) => ({
    async create(data: NewDocument) {
        if (!SUPPORTED_MIME_TYPES.includes(data.mimeType)) {
            throw new HttpError(415, `Unsupported file type: ${data.mimeType}`);
        }

        return documents.save(documents.create({ ...data, status: DocumentStatus.PENDING }));
    },

    async process(document: Document, file: Buffer) {
        await documents.update(document.id, { status: DocumentStatus.PROCESSING, errorMessage: null });

        try {
            const chunks = chunkPages(await extractText(file, document.mimeType));

            if (chunks.length === 0) {
                throw new Error('No text could be extracted from the file');
            }

            const vectors = await embeddings.embedDocuments(chunks.map((chunk) => chunk.content));

            await documents.manager.transaction(async (manager) => {
                await manager.delete(DocumentChunk, { documentId: document.id });
                await manager.insert(DocumentChunk, chunks.map((chunk, index) => ({
                    documentId: document.id,
                    chunkIndex: index,
                    content: chunk.content,
                    metadata: chunk.page === undefined ? {} : { page: chunk.page },
                    embedding: vectors[index]!,
                })));
                await manager.update(Document, document.id, {
                    status: DocumentStatus.READY,
                    chunkCount: chunks.length,
                });
            });
        } catch (error) {
            await documents.update(document.id, {
                status: DocumentStatus.FAILED,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return documents.findOneByOrFail({ id: document.id });
    },

    list() {
        return documents.find({ order: { createdAt: 'DESC' } });
    },

    async remove(id: string) {
        const { affected } = await documents.delete(id);

        if (!affected) {
            throw new HttpError(404, 'Document not found');
        }
    },
});

export type DocumentService = ReturnType<typeof createDocumentService>;
