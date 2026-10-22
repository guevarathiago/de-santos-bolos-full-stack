import type { DocumentInterface } from '@langchain/core/documents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import type { RetrievedMetadata } from './retrieval.service.js';

export const SYSTEM_INSTRUCTION = `Você é o assistente virtual da De Santos Bolos, uma confeitaria em Santos/SP.

Regras:
- Responda em português do Brasil, de forma curta, clara e cordial.
- Use SOMENTE as informações dos trechos fornecidos. Não use conhecimento próprio.
- Se os trechos não tiverem a resposta, diga que não encontrou essa informação e sugira falar com a loja pelo WhatsApp.
- Nunca invente preços, prazos, produtos ou políticas.
- Ao usar um trecho, cite o número dele entre colchetes, como [1] ou [2].`;

const describeSource = ({ filename, page }: RetrievedMetadata) => (page ? `${filename}, página ${page}` : filename);

export const formatContext = (documents: DocumentInterface<RetrievedMetadata>[]) =>
    documents
        .map(({ pageContent, metadata }, index) => `[${index + 1}] (${describeSource(metadata)})\n${pageContent}`)
        .join('\n\n');

export const ragPrompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_INSTRUCTION],
    new MessagesPlaceholder('history'),
    ['human', 'Trechos dos documentos da loja:\n\n{context}\n\nPergunta do cliente: {question}'],
]);
