import type { RetrievedChunk } from './retrieval.service.js';

export const SYSTEM_INSTRUCTION = `Você é o assistente virtual da De Santos Bolos, uma confeitaria em Santos/SP.

Regras:
- Responda em português do Brasil, de forma curta, clara e cordial.
- Use SOMENTE as informações dos trechos fornecidos. Não use conhecimento próprio.
- Se os trechos não tiverem a resposta, diga que não encontrou essa informação e sugira falar com a loja pelo WhatsApp.
- Nunca invente preços, prazos, produtos ou políticas.
- Ao usar um trecho, cite o número dele entre colchetes, como [1] ou [2].`;

const describeSource = ({ filename, metadata }: RetrievedChunk) =>
    metadata.page ? `${filename}, página ${metadata.page}` : filename;

export const buildPrompt = (question: string, chunks: RetrievedChunk[]) => {
    const context = chunks
        .map((chunk, index) => `[${index + 1}] (${describeSource(chunk)})\n${chunk.content}`)
        .join('\n\n');

    return `Trechos dos documentos da loja:\n\n${context}\n\nPergunta do cliente: ${question}`;
};
