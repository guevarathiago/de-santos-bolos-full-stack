import { createApp } from './src/app.js';
import { env } from './src/config/env.js';
import { AppDataSource } from './src/database/data-source.js';
import { createEmbeddingService } from './src/modules/ai/embedding.service.js';
import { gemini } from './src/modules/ai/gemini.client.js';
import { createAuthService } from './src/modules/auth/auth.service.js';
import { Document } from './src/modules/documents/document.entity.js';
import { createDocumentService } from './src/modules/documents/document.service.js';
import { createRagService } from './src/modules/rag/rag.service.js';
import { createRetrievalService } from './src/modules/rag/retrieval.service.js';
import { User } from './src/modules/users/user.entity.js';

try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
} catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
}

const embeddings = createEmbeddingService(gemini.models);

const app = createApp({
    authService: createAuthService(AppDataSource.getRepository(User)),
    documentService: createDocumentService({
        documents: AppDataSource.getRepository(Document),
        embeddings,
    }),
    ragService: createRagService({
        retrieval: createRetrievalService({ manager: AppDataSource.manager, embeddings }),
        client: gemini.models,
        model: env.GEMINI_CHAT_MODEL,
    }),
});

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});
