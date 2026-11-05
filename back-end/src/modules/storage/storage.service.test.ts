import type { PutObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';
import { createStorageService, UPLOAD_URL_TTL_SECONDS } from './storage.service.js';

const makeService = () => {
    const sign = vi.fn(async (_command: PutObjectCommand, _expiresIn: number) => 'https://bucket.test/signed-url');
    const service = createStorageService({ bucket: 'images', publicUrl: 'https://images.test', sign });

    return { service, sign };
};

describe('storageService.createProductImageUpload', () => {
    it('signs an upload with a random name in the products folder, locked to the type and size', async () => {
        const { service, sign } = makeService();

        const upload = await service.createProductImageUpload({ contentType: 'image/webp', sizeBytes: 120_000 });

        const [command, expiresIn] = sign.mock.calls[0]!;
        expect(command.input).toMatchObject({ Bucket: 'images', ContentType: 'image/webp', ContentLength: 120_000 });
        expect(command.input.Key).toMatch(/^products\/[0-9a-f-]{36}\.webp$/);
        expect(expiresIn).toBe(UPLOAD_URL_TTL_SECONDS);

        expect(upload).toEqual({
            uploadUrl: 'https://bucket.test/signed-url',
            method: 'PUT',
            headers: { 'Content-Type': 'image/webp' },
            imageUrl: `https://images.test/${command.input.Key}`,
            expiresIn: UPLOAD_URL_TTL_SECONDS,
        });
    });

    it('never reuses a name, so a new photo does not overwrite an old one', async () => {
        const { service } = makeService();

        const first = await service.createProductImageUpload({ contentType: 'image/png', sizeBytes: 10 });
        const second = await service.createProductImageUpload({ contentType: 'image/png', sizeBytes: 10 });

        expect(first.imageUrl).not.toBe(second.imageUrl);
    });
});

describe('storageService.isProductImageUrl', () => {
    it.each([
        ['an image uploaded to our products folder', 'https://images.test/products/abc.webp', true],
        ['another site', 'https://evil.test/products/abc.webp', false],
        ['our bucket outside the products folder', 'https://images.test/other/abc.webp', false],
        ['a look-alike domain', 'https://images.test.evil.test/products/abc.webp', false],
    ])('accepts %s: %s', (_label, url, expected) => {
        expect(makeService().service.isProductImageUrl(url)).toBe(expected);
    });
});
