import { Document } from '@langchain/core/documents';
import type { BaseMessage } from '@langchain/core/messages';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { describe, expect, it, vi } from 'vitest';
import { formatContext, SYSTEM_INSTRUCTION } from './prompt.js';
import { createRagService, NO_CONTEXT_ANSWER } from './rag.service.js';
import type { RetrievedMetadata } from './retrieval.service.js';

const chunk = (pageContent: string, metadata: Partial<RetrievedMetadata> = {}) =>
    new Document<RetrievedMetadata>({
        pageContent,
        metadata: { chunkId: 'chunk', documentId: 'doc-1', filename: 'faq.txt', similarity: 0.8, ...metadata },
    });

const delivery = chunk('Entregamos em Bertioga às sextas. Taxa de R$ 30.', {
    documentId: 'doc-pdf',
    filename: 'politicas-entrega.pdf',
    page: 1,
});
const payment = chunk('Parcelamos em até 3 vezes.');

const makeRetriever = (documents: Document<RetrievedMetadata>[]) => ({ invoke: vi.fn().mockResolvedValue(documents) });

const makeModel = (response: string) => {
    const model = new FakeListChatModel({ responses: [response] });
    const generate = vi.spyOn(model, '_streamResponseChunks');

    const sentMessages = (): BaseMessage[] => generate.mock.calls[0]?.[0] ?? [];

    return { model, generate, sentMessages };
};

describe('formatContext', () => {
    it('numbers each chunk and shows its source and page', () => {
        const context = formatContext([delivery, payment]);

        expect(context).toContain('[1] (politicas-entrega.pdf, página 1)\nEntregamos em Bertioga');
        expect(context).toContain('[2] (faq.txt)\nParcelamos');
    });
});

describe('ragService.answer', () => {
    it('sends the rules, the chunks and the question to the model', async () => {
        const { model, sentMessages } = makeModel('Sim [1].');

        await createRagService({ retriever: makeRetriever([delivery]), model }).answer('Entregam em Bertioga?');

        const [system, human] = sentMessages();
        expect(system?.getType()).toBe('system');
        expect(system?.content).toBe(SYSTEM_INSTRUCTION);
        expect(human?.getType()).toBe('human');
        expect(human?.content).toBe(
            `Trechos dos documentos da loja:\n\n${formatContext([delivery])}\n\nPergunta do cliente: Entregam em Bertioga?`,
        );
    });

    it('sends the previous messages between the rules and the new question', async () => {
        const { model, sentMessages } = makeModel('R$ 15 [1].');
        const history = [
            { role: 'user' as const, content: 'Entregam em Bertioga?' },
            { role: 'assistant' as const, content: 'Sim, às sextas.' },
        ];

        await createRagService({ retriever: makeRetriever([delivery]), model }).answer('e no Guarujá?', history);

        expect(sentMessages().map((message) => [message.getType(), message.content])).toEqual([
            ['system', SYSTEM_INSTRUCTION],
            ['human', 'Entregam em Bertioga?'],
            ['ai', 'Sim, às sextas.'],
            ['human', expect.stringContaining('Pergunta do cliente: e no Guarujá?')],
        ]);
    });

    it('searches with the previous question so follow-ups find the right chunks', async () => {
        const retriever = makeRetriever([delivery]);
        const history = [
            { role: 'user' as const, content: 'Entregam em Bertioga?' },
            { role: 'assistant' as const, content: 'Sim, às sextas.' },
        ];

        await createRagService({ retriever, model: makeModel('ok').model }).answer('e no Guarujá?', history);

        expect(retriever.invoke).toHaveBeenCalledWith('Entregam em Bertioga?\ne no Guarujá?', expect.anything());
    });

    it('searches with the question alone when there is no history', async () => {
        const retriever = makeRetriever([delivery]);

        await createRagService({ retriever, model: makeModel('ok').model }).answer('Tem bolo sem glúten?');

        expect(retriever.invoke).toHaveBeenCalledWith('Tem bolo sem glúten?', expect.anything());
    });

    it('returns only the sources cited in the answer, without duplicates', async () => {
        const { model } = makeModel('Sim, às sextas [1]. A taxa é R$ 30 [1].');

        const result = await createRagService({ retriever: makeRetriever([delivery, payment]), model })
            .answer('Entregam em Bertioga?');

        expect(result).toEqual({
            answer: 'Sim, às sextas [1]. A taxa é R$ 30 [1].',
            sources: [{ documentId: 'doc-pdf', filename: 'politicas-entrega.pdf', page: 1 }],
        });
    });

    it('does not call the model when no chunk is relevant', async () => {
        const { model, generate } = makeModel('não deveria ser chamado');

        const result = await createRagService({ retriever: makeRetriever([]), model }).answer('Quem ganhou a Copa de 2002?');

        expect(generate).not.toHaveBeenCalled();
        expect(result).toEqual({ answer: NO_CONTEXT_ANSWER, sources: [] });
    });

    it('falls back to the default message when the model returns no text', async () => {
        const result = await createRagService({ retriever: makeRetriever([delivery]), model: makeModel('  ').model })
            .answer('x');

        expect(result).toEqual({ answer: NO_CONTEXT_ANSWER, sources: [] });
    });
});

describe('ragService.stream', () => {
    const collect = async <T>(events: AsyncIterable<T>) => {
        const collected: T[] = [];
        for await (const event of events) collected.push(event);
        return collected;
    };

    it('sends the answer piece by piece and ends with the full answer and its sources', async () => {
        const { model } = makeModel('Sim [1].');

        const events = await collect(createRagService({ retriever: makeRetriever([delivery]), model }).stream('x'));
        const tokens = events.flatMap((event) => (event.type === 'token' ? [event.text] : []));

        expect(tokens.length).toBeGreaterThan(1);
        expect(tokens.join('')).toBe('Sim [1].');
        expect(events.at(-1)).toEqual({
            type: 'done',
            answer: 'Sim [1].',
            sources: [{ documentId: 'doc-pdf', filename: 'politicas-entrega.pdf', page: 1 }],
        });
    });

    it('sends the default message as a single piece when no chunk is relevant', async () => {
        const { model } = makeModel('não deveria ser chamado');

        const events = await collect(createRagService({ retriever: makeRetriever([]), model }).stream('x'));

        expect(events).toEqual([
            { type: 'token', text: NO_CONTEXT_ANSWER },
            { type: 'done', answer: NO_CONTEXT_ANSWER, sources: [] },
        ]);
    });
});
