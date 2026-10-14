import { env } from '../src/config/env.js';
import { AppDataSource } from '../src/database/data-source.js';
import { createEmbeddingService } from '../src/modules/ai/embedding.service.js';
import { gemini } from '../src/modules/ai/gemini.client.js';
import { createRagService } from '../src/modules/rag/rag.service.js';
import { createRetrievalService } from '../src/modules/rag/retrieval.service.js';

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
    retrieval: createRetrievalService({
        manager: AppDataSource.manager,
        embeddings: createEmbeddingService(gemini.models),
    }),
    client: gemini.models,
    model: env.GEMINI_CHAT_MODEL,
});

console.log(`model: ${env.GEMINI_CHAT_MODEL}`);

for (const question of questions) {
    const { answer, sources } = await rag.answer(question);
    const sourceList = sources.map(({ filename, page }) => (page ? `${filename} p.${page}` : filename)).join(', ');

    console.log(`\n❓ ${question}\n💬 ${answer}\n📄 ${sourceList || '(sem fontes)'}`);
}

await AppDataSource.destroy();
