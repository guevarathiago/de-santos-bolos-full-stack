import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export const IMAGE_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
} as const;

export type ImageContentType = keyof typeof IMAGE_EXTENSIONS;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const UPLOAD_URL_TTL_SECONDS = 5 * 60;

const PRODUCT_IMAGES_FOLDER = 'products';

type Signer = (command: PutObjectCommand, expiresIn: number) => Promise<string>;

type StorageDependencies = {
    bucket: string;
    publicUrl: string;
    sign: Signer;
};

export type ImageUploadRequest = {
    contentType: ImageContentType;
    sizeBytes: number;
};

export const createStorageService = ({ bucket, publicUrl, sign }: StorageDependencies) => ({
    // The browser sends the file straight to the bucket with this URL; the API only authorizes it.
    async createProductImageUpload({ contentType, sizeBytes }: ImageUploadRequest) {
        const key = `${PRODUCT_IMAGES_FOLDER}/${randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;

        // Type and size are part of the signature, so the upload fails if the browser sends anything else.
        const uploadUrl = await sign(
            new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: sizeBytes }),
            UPLOAD_URL_TTL_SECONDS,
        );

        return {
            uploadUrl,
            method: 'PUT' as const,
            headers: { 'Content-Type': contentType },
            imageUrl: `${publicUrl}/${key}`,
            expiresIn: UPLOAD_URL_TTL_SECONDS,
        };
    },

    // Products may only point at images uploaded through this API.
    isProductImageUrl(url: string) {
        return url.startsWith(`${publicUrl}/${PRODUCT_IMAGES_FOLDER}/`);
    },
});

export type StorageService = ReturnType<typeof createStorageService>;
