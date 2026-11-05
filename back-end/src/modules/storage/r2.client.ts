import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env.js';

// Cloudflare R2 speaks the S3 API, so the official AWS SDK works by pointing it at the R2 endpoint.
export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    // Newer SDK versions sign a body checksum by default, which a browser upload to a presigned URL cannot match.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
});
