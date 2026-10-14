import { createApp } from './src/app.js';
import { env } from './src/config/env.js';
import { AppDataSource } from './src/database/data-source.js';
import { createEmbeddingService } from './src/modules/ai/embedding.service.js';
import { gemini } from './src/modules/ai/gemini.client.js';
import { createAuthService } from './src/modules/auth/auth.service.js';
import { Document } from './src/modules/documents/document.entity.js';
import { createDocumentService } from './src/modules/documents/document.service.js';
import { User } from './src/modules/users/user.entity.js';

try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
} catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
}

const app = createApp({
    authService: createAuthService(AppDataSource.getRepository(User)),
    documentService: createDocumentService({
        documents: AppDataSource.getRepository(Document),
        embeddings: createEmbeddingService(gemini.models),
    }),
});

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});
