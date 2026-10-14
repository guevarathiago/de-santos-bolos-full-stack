import type { GoogleGenAI } from '@google/genai';
import { buildPrompt, SYSTEM_INSTRUCTION } from './prompt.js';
import type { RetrievalService, RetrievedChunk } from './retrieval.service.js';

export const MIN_SIMILARITY = 0.5;

export const NO_CONTEXT_ANSWER =
    'Não encontrei essa informação nos documentos da loja. Para ajudar melhor, fale com a gente pelo WhatsApp.';

export type Source = {
    documentId: string;
    filename: string;
    page?: number;
};

type ChatClient = Pick<GoogleGenAI['models'], 'generateContent'>;

type RagDependencies = {
    retrieval: RetrievalService;
    client: ChatClient;
    model: string;
};

const citedSources = (answer: string, chunks: RetrievedChunk[]): Source[] => {
    const cited = new Set([...answer.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1])));
    const sources = new Map<string, Source>();

    chunks.forEach(({ documentId, filename, metadata }, index) => {
        if (!cited.has(index + 1)) return;

        const key = `${documentId}:${metadata.page ?? ''}`;
        sources.set(key, metadata.page ? { documentId, filename, page: metadata.page } : { documentId, filename });
    });

    return [...sources.values()];
};

export const createRagService = ({ retrieval, client, model }: RagDependencies) => ({
    async answer(question: string) {
        const chunks = (await retrieval.search(question)).filter((chunk) => chunk.similarity >= MIN_SIMILARITY);

        if (chunks.length === 0) {
            return { answer: NO_CONTEXT_ANSWER, sources: [] };
        }

        const response = await client.generateContent({
            model,
            contents: buildPrompt(question, chunks),
            config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
        });

        const answer = response.text?.trim() || NO_CONTEXT_ANSWER;

        return { answer, sources: citedSources(answer, chunks) };
    },
});

export type RagService = ReturnType<typeof createRagService>;
