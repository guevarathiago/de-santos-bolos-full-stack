import { AppDataSource } from '../src/database/data-source.js';
import { createEmbeddingService } from '../src/modules/ai/embedding.service.js';
import { gemini } from '../src/modules/ai/gemini.client.js';
import { createRetrievalService } from '../src/modules/rag/retrieval.service.js';

const questions = process.argv.length > 2 ? process.argv.slice(2) : [
    'Vocês entregam em Bertioga?',
    'Quanto custa a entrega para o Guarujá?',
    'Tem bolo sem glúten?',
    'Posso pagar parcelado?',
    'Qual a capital da França?',
    'Quem ganhou a Copa do Mundo de 2002?',
];

await AppDataSource.initialize();

const retrieval = createRetrievalService({
    manager: AppDataSource.manager,
    embeddings: createEmbeddingService(gemini.models),
});

for (const question of questions) {
    const chunks = await retrieval.search(question, 3);

    console.log(`\n❓ ${question}`);

    for (const { similarity, filename, metadata, content } of chunks) {
        const page = metadata.page ? ` p.${metadata.page}` : '';
        const preview = content.replace(/\s+/g, ' ').slice(0, 70);
        console.log(`   ${similarity.toFixed(3)}  ${filename}${page}  "${preview}…"`);
    }
}

await AppDataSource.destroy();
