import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { AppDataSource } from '../src/database/data-source.js';
import { createEmbeddingService } from '../src/modules/ai/embedding.service.js';
import { gemini } from '../src/modules/ai/gemini.client.js';
import { Document } from '../src/modules/documents/document.entity.js';
import { createDocumentService } from '../src/modules/documents/document.service.js';

const files = [
    { path: 'samples/perguntas-frequentes.txt', mimeType: 'text/plain' },
    { path: 'samples/politicas-entrega.pdf', mimeType: 'application/pdf' },
];

await AppDataSource.initialize();

const documents = AppDataSource.getRepository(Document);
const service = createDocumentService({ documents, embeddings: createEmbeddingService(gemini.models) });

for (const { path, mimeType } of files) {
    const filename = basename(path);

    await documents.delete({ filename });

    const document = await service.create({
        filename,
        mimeType,
        sizeBytes: (await stat(path)).size,
        uploadedById: null,
    });
    console.log(`${filename}: ${document.status}`);

    const processed = await service.process(document, await readFile(path));
    console.log(`${filename}: ${processed.status} · ${processed.chunkCount} chunks${processed.errorMessage ? ` · ${processed.errorMessage}` : ''}`);
}

await AppDataSource.destroy();
