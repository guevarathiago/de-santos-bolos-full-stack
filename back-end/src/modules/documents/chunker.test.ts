import { describe, expect, it } from 'vitest';
import { chunkPages } from './chunker.js';

const paragraph = (label: string, length: number) => `${label} ${'x'.repeat(length - label.length - 1)}`;

describe('chunkPages', () => {
    it('keeps a short text in a single chunk', () => {
        expect(chunkPages([{ text: 'Bolo de cenoura.' }])).toEqual([{ content: 'Bolo de cenoura.' }]);
    });

    it('never creates chunks larger than maxChars', () => {
        const text = Array.from({ length: 20 }, (_, i) => paragraph(`P${i}`, 90)).join('\n\n');

        const chunks = chunkPages([{ text }], { maxChars: 300, overlapChars: 100 });

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.every((chunk) => chunk.content.length <= 300)).toBe(true);
    });

    it('cuts between paragraphs instead of in the middle of them', () => {
        const text = [paragraph('A', 120), paragraph('B', 120), paragraph('C', 120)].join('\n\n');

        const chunks = chunkPages([{ text }], { maxChars: 260, overlapChars: 0 });

        expect(chunks.map((chunk) => chunk.content)).toEqual([
            `${paragraph('A', 120)}\n\n${paragraph('B', 120)}`,
            paragraph('C', 120),
        ]);
    });

    it('repeats the end of a chunk at the start of the next one', () => {
        const text = [paragraph('A', 120), paragraph('B', 60), paragraph('C', 120)].join('\n\n');

        const [first, second] = chunkPages([{ text }], { maxChars: 200, overlapChars: 80 });

        expect(first?.content).toContain(paragraph('B', 60));
        expect(second?.content.startsWith(paragraph('B', 60))).toBe(true);
    });

    it('falls back to sentences and words when a paragraph is too long', () => {
        const longParagraph = `${'palavra '.repeat(60)}fim.`;

        const chunks = chunkPages([{ text: longParagraph }], { maxChars: 100, overlapChars: 0 });

        expect(chunks.every((chunk) => chunk.content.length <= 100)).toBe(true);
        expect(chunks.every((chunk) => !chunk.content.startsWith('alavra'))).toBe(true);
    });

    it('chunks across pages and records the page where each chunk starts', () => {
        const pages = [
            { page: 1, text: paragraph('Page1', 150) },
            { page: 2, text: paragraph('Page2', 150) },
            { page: 3, text: paragraph('Page3', 150) },
        ];

        const chunks = chunkPages(pages, { maxChars: 320, overlapChars: 0 });

        expect(chunks.map((chunk) => chunk.page)).toEqual([1, 3]);
        expect(chunks[0]?.content).toContain('Page2');
    });

    it('returns no chunks for empty input', () => {
        expect(chunkPages([])).toEqual([]);
    });
});
