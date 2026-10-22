import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { ExtractedPage } from './text-extractor.js';

export type TextChunk = {
    content: string;
    page?: number;
};

export type ChunkOptions = {
    maxChars: number;
    overlapChars: number;
};

const DEFAULT_OPTIONS: ChunkOptions = { maxChars: 800, overlapChars: 150 };

const SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

export const chunkPages = async (pages: ExtractedPage[], options: ChunkOptions = DEFAULT_OPTIONS): Promise<TextChunk[]> => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: options.maxChars,
        chunkOverlap: options.overlapChars,
        separators: SEPARATORS,
        // Drops the separator at chunk edges, so no chunk starts with ". ".
        keepSeparator: false,
    });

    const documents = pages.map(({ text, page }) =>
        new Document({ pageContent: text, metadata: page === undefined ? {} : { page } }));

    const chunks = await splitter.splitDocuments(documents);

    return chunks.map(({ pageContent, metadata }) =>
        typeof metadata.page === 'number' ? { content: pageContent, page: metadata.page } : { content: pageContent });
};
