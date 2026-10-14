import { readFile } from 'node:fs/promises';
import { chunkPages } from '../src/modules/documents/chunker.js';
import { extractText } from '../src/modules/documents/text-extractor.js';

const files = [
    { path: 'samples/perguntas-frequentes.txt', mimeType: 'text/plain' },
    { path: 'samples/politicas-entrega.pdf', mimeType: 'application/pdf' },
];

for (const { path, mimeType } of files) {
    const chunks = chunkPages(await extractText(await readFile(path), mimeType));

    console.log(`\n=== ${path} → ${chunks.length} chunks ===`);

    chunks.forEach(({ content, page }, index) => {
        console.log(`\n--- chunk ${index} · page ${page ?? '-'} · ${content.length} characters ---`);
        console.log(content);
    });
}
