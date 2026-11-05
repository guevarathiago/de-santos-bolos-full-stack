import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../orders/orders.client.js';
import { IMAGE_EXTENSIONS, type ImageContentType, MAX_IMAGE_BYTES } from '../storage/storage.service.js';

export const menuQuerySchema = z.object({
    category: z.enum(PRODUCT_CATEGORIES).optional(),
});

export const adminProductsQuerySchema = z.object({
    available: z.stringbool().optional(),
    featured: z.stringbool().optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
});

// The orders service owns the product rules and validates every field; here we only need an object,
// plus the image URL, which must come from our own bucket (checked in the products service).
export const productBodySchema = z.looseObject({
    imageUrl: z.string().nullable().optional(),
});

export const imageUploadSchema = z.object({
    contentType: z.enum(Object.keys(IMAGE_EXTENSIONS) as [ImageContentType, ...ImageContentType[]]),
    sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
});

export type MenuQuery = z.infer<typeof menuQuerySchema>;
export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>;
export type ProductBody = z.infer<typeof productBodySchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
