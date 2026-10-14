import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { extractText } from './text-extractor.js';

const sample = (name: string) => readFile(new URL(`../../../samples/${name}`, import.meta.url));

describe('extractText', () => {
    it('reads a TXT file as a single block without page number', async () => {
        const pages = await extractText(await sample('perguntas-frequentes.txt'), 'text/plain');

        expect(pages).toHaveLength(1);
        expect(pages[0]?.page).toBeUndefined();
        expect(pages[0]?.text).toContain('Aceitamos Pix');
    });

    it('reads a PDF page by page, keeping the page number', async () => {
        const pages = await extractText(await sample('politicas-entrega.pdf'), 'application/pdf');

        expect(pages.map((page) => page.page)).toEqual([1, 2]);
        expect(pages[0]?.text).toContain('Regiões atendidas');
        expect(pages[1]?.text).toContain('Retirada na loja');
    });

    it('normalizes line endings, repeated spaces and blank lines', async () => {
        const pages = await extractText(Buffer.from('  Linha   um \r\n\r\n\r\n\r\nLinha\tdois  '), 'text/plain');

        expect(pages[0]?.text).toBe('Linha um\n\nLinha dois');
    });

    it('returns no pages for an empty file', async () => {
        expect(await extractText(Buffer.from('  \n\n '), 'text/plain')).toEqual([]);
    });

    it('rejects unsupported file types with 415', async () => {
        await expect(extractText(Buffer.from('x'), 'image/png')).rejects.toMatchObject({ status: 415 });
    });
});
