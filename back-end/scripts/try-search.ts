import { AppDataSource } from '../src/database/data-source.js';
import { GeminiEmbeddings } from '../src/modules/ai/embedding.service.js';
import { gemini } from '../src/modules/ai/gemini.client.js';
import { ChunkRetriever } from '../src/modules/rag/retrieval.service.js';

const questions = process.argv.length > 2 ? process.argv.slice(2) : [
    'Vocês entregam em Bertioga?',
    'Quanto custa a entrega para o Guarujá?',
    'Tem bolo sem glúten?',
    'Posso pagar parcelado?',
    'Qual a capital da França?',
    'Quem ganhou a Copa do Mundo de 2002?',
];

await AppDataSource.initialize();

const retriever = new ChunkRetriever({
    manager: AppDataSource.manager,
    embeddings: new GeminiEmbeddings(gemini.models),
    k: 3,
    minSimilarity: 0,
});

for (const question of questions) {
    const documents = await retriever.invoke(question);

    console.log(`\n❓ ${question}`);

    for (const { pageContent, metadata: { similarity, filename, page } } of documents) {
        const pageLabel = page ? ` p.${page}` : '';
        const preview = pageContent.replace(/\s+/g, ' ').slice(0, 70);
        console.log(`   ${similarity.toFixed(3)}  ${filename}${pageLabel}  "${preview}…"`);
    }
}

await AppDataSource.destroy();
