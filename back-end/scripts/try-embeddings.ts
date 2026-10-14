import { createEmbeddingService } from '../src/modules/ai/embedding.service.js';
import { gemini } from '../src/modules/ai/gemini.client.js';

const sentences = [
    'Bolo de cenoura com cobertura de chocolate',
    'Torta de chocolate com morango',
    'Meu pedido está atrasado',
    'Qual o horário de funcionamento da loja?',
];

const cosineSimilarity = (a: number[], b: number[]) => {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!;
        normA += a[i]! ** 2;
        normB += b[i]! ** 2;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const embeddings = createEmbeddingService(gemini.models);
const vectors = await embeddings.embedDocuments(sentences);

console.log(`\nReceived ${vectors.length} vectors with ${vectors[0]?.length} numbers each.`);
console.log(`First 5 numbers of "${sentences[0]}":`, vectors[0]?.slice(0, 5), '\n');

for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
        const similarity = cosineSimilarity(vectors[i]!, vectors[j]!);
        console.log(`${similarity.toFixed(3)}  "${sentences[i]}"  ↔  "${sentences[j]}"`);
    }
}
