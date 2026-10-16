import type { Content, GoogleGenAI } from '@google/genai';
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

export type HistoryMessage = {
    role: 'user' | 'assistant';
    content: string;
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

const searchQuery = (question: string, history: HistoryMessage[]) => {
    const previousQuestion = history.findLast((message) => message.role === 'user');

    return previousQuestion ? `${previousQuestion.content}\n${question}` : question;
};

const toContents = (history: HistoryMessage[], prompt: string): Content[] => [
    ...history.map(({ role, content }) => ({
        role: role === 'assistant' ? 'model' : 'user',
        parts: [{ text: content }],
    })),
    { role: 'user', parts: [{ text: prompt }] },
];

export const createRagService = ({ retrieval, client, model }: RagDependencies) => ({
    async answer(question: string, history: HistoryMessage[] = []) {
        const chunks = (await retrieval.search(searchQuery(question, history)))
            .filter((chunk) => chunk.similarity >= MIN_SIMILARITY);

        if (chunks.length === 0) {
            return { answer: NO_CONTEXT_ANSWER, sources: [] };
        }

        const response = await client.generateContent({
            model,
            contents: toContents(history, buildPrompt(question, chunks)),
            config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
        });

        const answer = response.text?.trim() || NO_CONTEXT_ANSWER;

        return { answer, sources: citedSources(answer, chunks) };
    },
});

export type RagService = ReturnType<typeof createRagService>;
