import type { ExtractedPage } from './text-extractor.js';

export type TextChunk = {
    content: string;
    page?: number;
};

export type ChunkOptions = {
    maxChars: number;
    overlapChars: number;
};

type Piece = {
    text: string;
    page?: number;
};

const DEFAULT_OPTIONS: ChunkOptions = { maxChars: 800, overlapChars: 150 };

const SEPARATORS = ['\n\n', '\n', '. ', ' '];

const splitText = (text: string, maxChars: number, separators = SEPARATORS): string[] => {
    if (text.length <= maxChars) {
        return [text];
    }

    const [separator, ...nextSeparators] = separators;

    if (separator === undefined) {
        return Array.from({ length: Math.ceil(text.length / maxChars) }, (_, i) =>
            text.slice(i * maxChars, (i + 1) * maxChars));
    }

    const parts = text.split(separator);

    return parts.flatMap((part, i) => {
        const withSeparator = i < parts.length - 1 ? part + separator : part;

        return splitText(withSeparator, maxChars, nextSeparators);
    });
};

const totalLength = (pieces: Piece[]) => pieces.reduce((sum, piece) => sum + piece.text.length, 0);

const toChunk = (pieces: Piece[]): TextChunk => {
    const content = pieces.map((piece) => piece.text).join('').trim();
    const page = pieces[0]?.page;

    return page === undefined ? { content } : { content, page };
};

export const chunkPages = (pages: ExtractedPage[], options: ChunkOptions = DEFAULT_OPTIONS): TextChunk[] => {
    const { maxChars, overlapChars } = options;

    const pieces: Piece[] = pages.flatMap(({ text, page }) =>
        splitText(`${text}\n\n`, maxChars).map((piece) => (page === undefined ? { text: piece } : { text: piece, page })));

    const chunks: TextChunk[] = [];
    let current: Piece[] = [];

    for (const piece of pieces) {
        if (current.length > 0 && totalLength(current) + piece.text.length > maxChars) {
            chunks.push(toChunk(current));

            const overlap: Piece[] = [];

            for (let i = current.length - 1; i >= 0; i--) {
                if (totalLength(overlap) + current[i]!.text.length > overlapChars) break;
                overlap.unshift(current[i]!);
            }

            while (overlap.length > 0 && totalLength(overlap) + piece.text.length > maxChars) {
                overlap.shift();
            }

            current = overlap;
        }

        current.push(piece);
    }

    if (current.length > 0) {
        chunks.push(toChunk(current));
    }

    return chunks.filter((chunk) => chunk.content.length > 0);
};
