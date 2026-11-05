import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import { HttpError } from '../../errors/http-error.js';
import type { AuthService } from '../auth/auth.service.js';
import { signToken } from '../auth/token.js';
import type { ConversationService } from '../conversations/conversation.service.js';
import type { DocumentService } from '../documents/document.service.js';
import type { OrdersClient } from '../orders/orders.client.js';
import type { RagService } from '../rag/rag.service.js';
import { createStorageService, MAX_IMAGE_BYTES } from '../storage/storage.service.js';
import { UserRole } from '../users/user.entity.js';
import { createProductsService } from './products.service.js';

const admin = { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: UserRole.ADMIN };
const customer = { id: 'user-1', name: 'Cliente', email: 'cliente@example.com', role: UserRole.USER };
const as = (user: typeof admin) => [`token=${signToken(user)}`];

const productId = '11111111-1111-4111-8111-111111111111';
const ownImage = 'https://images.test/products/0f8d7a2e.webp';

const makeApp = (orderOverrides: Partial<OrdersClient> = {}) => {
    const orders = {
        listProducts: vi.fn().mockResolvedValue([{ id: productId, name: 'Bolo de cenoura' }]),
        createProduct: vi.fn(async (data) => ({ id: productId, ...data })),
        updateProduct: vi.fn(async (id, data) => ({ id, ...data })),
        deleteProduct: vi.fn(async () => {}),
        ...orderOverrides,
    } as unknown as OrdersClient;

    const storageService = createStorageService({
        bucket: 'images',
        publicUrl: 'https://images.test',
        sign: async () => 'https://bucket.test/signed-url',
    });

    const app = createApp({
        authService: {} as AuthService,
        documentService: {} as DocumentService,
        ragService: {} as RagService,
        conversationService: {} as ConversationService,
        productsService: createProductsService({ orders, storage: storageService }),
        storageService,
    });

    return { app, orders };
};

describe('GET /products (public menu)', () => {
    it('shows only available products to anyone, without login', async () => {
        const { app, orders } = makeApp();

        const res = await request(app).get('/products?category=CAKE');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ products: [{ id: productId, name: 'Bolo de cenoura' }] });
        expect(orders.listProducts).toHaveBeenCalledWith({ available: true, category: 'CAKE' });
    });

    it('cannot be asked for unavailable products', async () => {
        const { app, orders } = makeApp();

        await request(app).get('/products?available=false');

        expect(orders.listProducts).toHaveBeenCalledWith({ available: true });
    });

    it('answers 503 when the orders service is down', async () => {
        const { app } = makeApp({ listProducts: vi.fn().mockRejectedValue(new HttpError(503, 'Orders service unavailable')) });

        const res = await request(app).get('/products');

        expect(res.status).toBe(503);
        expect(res.body).toEqual({ message: 'Orders service unavailable' });
    });
});

describe('/admin/products', () => {
    it.each([
        ['without login', undefined, 401],
        ['as a customer', as(customer), 403],
    ])('is closed %s', async (_label, cookie, status) => {
        const { app, orders } = makeApp();

        const res = await request(app).get('/admin/products').set('Cookie', cookie ?? []);

        expect(res.status).toBe(status);
        expect(orders.listProducts).not.toHaveBeenCalled();
    });

    it('lists every product to admins, with the filters sent', async () => {
        const { app, orders } = makeApp();

        const res = await request(app).get('/admin/products?available=false').set('Cookie', as(admin));

        expect(res.status).toBe(200);
        expect(orders.listProducts).toHaveBeenCalledWith({ available: false });
    });

    it('creates a product with an image from our bucket', async () => {
        const { app, orders } = makeApp();

        const res = await request(app)
            .post('/admin/products')
            .set('Cookie', as(admin))
            .send({ name: 'Bolo de milho', priceCents: 5000, imageUrl: ownImage });

        expect(res.status).toBe(201);
        expect(orders.createProduct).toHaveBeenCalledWith({ name: 'Bolo de milho', priceCents: 5000, imageUrl: ownImage });
    });

    it('refuses images hosted anywhere else', async () => {
        const { app, orders } = makeApp();

        const res = await request(app)
            .post('/admin/products')
            .set('Cookie', as(admin))
            .send({ name: 'Bolo de milho', priceCents: 5000, imageUrl: 'https://other.test/products/x.webp' });

        expect(res.status).toBe(400);
        expect(orders.createProduct).not.toHaveBeenCalled();
    });

    it('lets an update remove the image with null', async () => {
        const { app, orders } = makeApp();

        const res = await request(app).patch(`/admin/products/${productId}`).set('Cookie', as(admin)).send({ imageUrl: null });

        expect(res.status).toBe(200);
        expect(orders.updateProduct).toHaveBeenCalledWith(productId, { imageUrl: null });
    });

    it('passes on the validation errors of the orders service', async () => {
        const { app } = makeApp({
            createProduct: vi.fn().mockRejectedValue(
                new HttpError(400, 'Invalid request body', { errors: { priceCents: ['Too small'] } }),
            ),
        });

        const res = await request(app).post('/admin/products').set('Cookie', as(admin)).send({ name: 'X', priceCents: 0 });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'Invalid request body', errors: { priceCents: ['Too small'] } });
    });
});

describe('POST /admin/products/image-upload', () => {
    it('returns where to send the photo and the URL to save in the product', async () => {
        const { app } = makeApp();

        const res = await request(app)
            .post('/admin/products/image-upload')
            .set('Cookie', as(admin))
            .send({ contentType: 'image/jpeg', sizeBytes: 250_000 });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            uploadUrl: 'https://bucket.test/signed-url',
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
        });
        expect(res.body.imageUrl).toMatch(/^https:\/\/images\.test\/products\/.+\.jpg$/);
    });

    it.each([
        ['a file type that is not an image we accept', { contentType: 'image/gif', sizeBytes: 1000 }],
        ['a file over 5 MB', { contentType: 'image/png', sizeBytes: MAX_IMAGE_BYTES + 1 }],
    ])('refuses %s', async (_label, body) => {
        const { app } = makeApp();

        const res = await request(app).post('/admin/products/image-upload').set('Cookie', as(admin)).send(body);

        expect(res.status).toBe(400);
    });

    it('is only for admins', async () => {
        const { app } = makeApp();

        const res = await request(app)
            .post('/admin/products/image-upload')
            .set('Cookie', as(customer))
            .send({ contentType: 'image/jpeg', sizeBytes: 1000 });

        expect(res.status).toBe(403);
    });
});

describe('DELETE /admin/products/:id', () => {
    it('deletes the product for admins with 204', async () => {
        const { app, orders } = makeApp();

        const res = await request(app).delete(`/admin/products/${productId}`).set('Cookie', as(admin));

        expect(res.status).toBe(204);
        expect(orders.deleteProduct).toHaveBeenCalledWith(productId);
    });

    it('is only for admins', async () => {
        const { app, orders } = makeApp();

        const res = await request(app).delete(`/admin/products/${productId}`).set('Cookie', as(customer));

        expect(res.status).toBe(403);
        expect(orders.deleteProduct).not.toHaveBeenCalled();
    });

    it('answers 404 when the product was already deleted', async () => {
        const { app } = makeApp({ deleteProduct: vi.fn().mockRejectedValue(new HttpError(404, 'Product not found')) });

        const res = await request(app).delete(`/admin/products/${productId}`).set('Cookie', as(admin));

        expect(res.status).toBe(404);
    });
});
