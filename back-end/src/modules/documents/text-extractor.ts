import { extractText as extractPdfText } from 'unpdf';
import { HttpError } from '../../errors/http-error.js';

export type ExtractedPage = {
    page?: number;
    text: string;
};

export const SUPPORTED_MIME_TYPES = ['application/pdf', 'text/plain'];

const normalize = (text: string) =>
    text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

export const extractText = async (file: Buffer, mimeType: string): Promise<ExtractedPage[]> => {
    if (mimeType === 'application/pdf') {
        const { text: pages } = await extractPdfText(new Uint8Array(file));

        return pages
            .map((text, index) => ({ page: index + 1, text: normalize(text) }))
            .filter((page) => page.text.length > 0);
    }

    if (mimeType === 'text/plain') {
        const text = normalize(file.toString('utf8'));

        return text ? [{ text }] : [];
    }

    throw new HttpError(415, `Unsupported file type: ${mimeType}`);
};
