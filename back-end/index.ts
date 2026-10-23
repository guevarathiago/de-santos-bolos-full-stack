import { createApp } from './src/app.js';
import { env } from './src/config/env.js';
import { checkpointer } from './src/database/checkpointer.js';
import { AppDataSource } from './src/database/data-source.js';
import { GeminiEmbeddings } from './src/modules/ai/embedding.service.js';
import { gemini, geminiChat } from './src/modules/ai/gemini.client.js';
import { createAuthService } from './src/modules/auth/auth.service.js';
import { Conversation } from './src/modules/conversations/conversation.entity.js';
import { createConversationService } from './src/modules/conversations/conversation.service.js';
import { Document } from './src/modules/documents/document.entity.js';
import { createDocumentService } from './src/modules/documents/document.service.js';
import { createRagService } from './src/modules/rag/rag.service.js';
import { ChunkRetriever } from './src/modules/rag/retrieval.service.js';
import { User } from './src/modules/users/user.entity.js';

try {
    await AppDataSource.initialize();
    // Creates the checkpointer's own schema and tables on first run; does nothing afterwards.
    await checkpointer.setup();
    console.log('Database connected successfully');
} catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
}

const embeddings = new GeminiEmbeddings(gemini.models);

const app = createApp({
    authService: createAuthService(AppDataSource.getRepository(User)),
    documentService: createDocumentService({
        documents: AppDataSource.getRepository(Document),
        embeddings,
    }),
    ragService: createRagService({
        retriever: new ChunkRetriever({ manager: AppDataSource.manager, embeddings }),
        model: geminiChat,
        checkpointer,
    }),
    conversationService: createConversationService(AppDataSource.getRepository(Conversation)),
});

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});
