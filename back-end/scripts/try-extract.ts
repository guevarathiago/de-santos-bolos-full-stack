import { readFile } from 'node:fs/promises';
import { extractText } from '../src/modules/documents/text-extractor.js';

const files = [
    { path: 'samples/perguntas-frequentes.txt', mimeType: 'text/plain' },
    { path: 'samples/politicas-entrega.pdf', mimeType: 'application/pdf' },
];

for (const { path, mimeType } of files) {
    const pages = await extractText(await readFile(path), mimeType);

    console.log(`\n=== ${path} (${pages.length} page(s)) ===`);

    for (const { page, text } of pages) {
        console.log(`\n--- page ${page ?? '-'} · ${text.length} characters ---`);
        console.log(text.length > 400 ? `${text.slice(0, 400)}…` : text);
    }
}
