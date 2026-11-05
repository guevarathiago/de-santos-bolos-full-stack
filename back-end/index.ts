import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
import { createOrdersClient } from './src/modules/orders/orders.client.js';
import { createProductsService } from './src/modules/products/products.service.js';
import { createRagService } from './src/modules/rag/rag.service.js';
import { ChunkRetriever } from './src/modules/rag/retrieval.service.js';
import { r2 } from './src/modules/storage/r2.client.js';
import { createStorageService } from './src/modules/storage/storage.service.js';
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

const ordersClient = createOrdersClient({ baseUrl: env.ORDERS_SERVICE_URL, apiKey: env.ORDERS_SERVICE_API_KEY });

const storageService = createStorageService({
    bucket: env.R2_BUCKET,
    publicUrl: env.R2_PUBLIC_URL,
    // Without signableHeaders the presigner leaves these out of the signature, and any type or size would be accepted.
    sign: (command, expiresIn) =>
        getSignedUrl(r2, command, { expiresIn, signableHeaders: new Set(['content-type', 'content-length']) }),
});

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
    productsService: createProductsService({ orders: ordersClient, storage: storageService }),
    storageService,
});

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});
