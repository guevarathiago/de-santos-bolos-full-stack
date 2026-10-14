import { describe, expect, it, vi } from 'vitest';
import { buildPrompt, SYSTEM_INSTRUCTION } from './prompt.js';
import { createRagService, NO_CONTEXT_ANSWER } from './rag.service.js';
import type { RetrievalService, RetrievedChunk } from './retrieval.service.js';

const chunk = (overrides: Partial<RetrievedChunk>): RetrievedChunk => ({
    id: 'chunk',
    documentId: 'doc-1',
    filename: 'faq.txt',
    content: 'texto',
    metadata: {},
    similarity: 0.8,
    ...overrides,
});

const delivery = chunk({
    documentId: 'doc-pdf',
    filename: 'politicas-entrega.pdf',
    content: 'Entregamos em Bertioga às sextas. Taxa de R$ 30.',
    metadata: { page: 1 },
});
const payment = chunk({ content: 'Parcelamos em até 3 vezes.' });

const makeRetrieval = (chunks: RetrievedChunk[]): RetrievalService => ({ search: vi.fn().mockResolvedValue(chunks) });

const makeClient = (text: string | undefined) => ({ generateContent: vi.fn().mockResolvedValue({ text }) });

describe('buildPrompt', () => {
    it('numbers each chunk and shows its source and page', () => {
        const prompt = buildPrompt('Entregam em Bertioga?', [delivery, payment]);

        expect(prompt).toContain('[1] (politicas-entrega.pdf, página 1)\nEntregamos em Bertioga');
        expect(prompt).toContain('[2] (faq.txt)\nParcelamos');
        expect(prompt).toContain('Pergunta do cliente: Entregam em Bertioga?');
    });
});

describe('ragService.answer', () => {
    it('sends the rules, the chunks and the question to the model', async () => {
        const client = makeClient('Sim [1].');

        await createRagService({ retrieval: makeRetrieval([delivery]), client, model: 'test-model' })
            .answer('Entregam em Bertioga?');

        expect(client.generateContent).toHaveBeenCalledWith({
            model: 'test-model',
            contents: buildPrompt('Entregam em Bertioga?', [delivery]),
            config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
        });
    });

    it('returns only the sources cited in the answer, without duplicates', async () => {
        const client = makeClient('Sim, às sextas [1]. A taxa é R$ 30 [1].');

        const result = await createRagService({ retrieval: makeRetrieval([delivery, payment]), client, model: 'm' })
            .answer('Entregam em Bertioga?');

        expect(result).toEqual({
            answer: 'Sim, às sextas [1]. A taxa é R$ 30 [1].',
            sources: [{ documentId: 'doc-pdf', filename: 'politicas-entrega.pdf', page: 1 }],
        });
    });

    it('does not call the model when no chunk is similar enough', async () => {
        const client = makeClient('não deveria ser chamado');

        const result = await createRagService({
            retrieval: makeRetrieval([chunk({ similarity: 0.45 })]),
            client,
            model: 'm',
        }).answer('Quem ganhou a Copa de 2002?');

        expect(client.generateContent).not.toHaveBeenCalled();
        expect(result).toEqual({ answer: NO_CONTEXT_ANSWER, sources: [] });
    });

    it('drops weak chunks before building the prompt', async () => {
        const client = makeClient('Sim [1].');
        const weak = chunk({ content: 'irrelevante', similarity: 0.3 });

        await createRagService({ retrieval: makeRetrieval([delivery, weak]), client, model: 'm' }).answer('x');

        expect(client.generateContent.mock.calls[0]?.[0].contents).not.toContain('irrelevante');
    });

    it('falls back to the default message when the model returns no text', async () => {
        const result = await createRagService({ retrieval: makeRetrieval([delivery]), client: makeClient(undefined), model: 'm' })
            .answer('x');

        expect(result).toEqual({ answer: NO_CONTEXT_ANSWER, sources: [] });
    });
});
