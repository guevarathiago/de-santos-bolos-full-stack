import { env } from '../src/config/env.js';
import { AppDataSource } from '../src/database/data-source.js';
import { GeminiEmbeddings } from '../src/modules/ai/embedding.service.js';
import { gemini, geminiChat } from '../src/modules/ai/gemini.client.js';
import { createRagService } from '../src/modules/rag/rag.service.js';
import { ChunkRetriever } from '../src/modules/rag/retrieval.service.js';

const questions = process.argv.length > 2 ? process.argv.slice(2) : [
    'Vocês entregam em Bertioga?',
    'Posso pagar parcelado?',
    'Tem bolo sem glúten? Sou celíaca, é seguro?',
    'Vocês abrem segunda-feira?',
    'Qual a capital da França?',
    'Vocês vendem pão de queijo?',
];

await AppDataSource.initialize();

const rag = createRagService({
    retriever: new ChunkRetriever({
        manager: AppDataSource.manager,
        embeddings: new GeminiEmbeddings(gemini.models),
    }),
    model: geminiChat,
});

console.log(`model: ${env.GEMINI_CHAT_MODEL}`);

for (const question of questions) {
    const { answer, sources } = await rag.answer(question);
    const sourceList = sources.map(({ filename, page }) => (page ? `${filename} p.${page}` : filename)).join(', ');

    console.log(`\n❓ ${question}\n💬 ${answer}\n📄 ${sourceList || '(sem fontes)'}`);
}

await AppDataSource.destroy();
