import { describe, expect, it, vi } from 'vitest';
import { createOrdersClient } from './orders.client.js';

const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const makeClient = (respond: () => Promise<Response>) => {
    const fetch = vi.fn((_url: URL | RequestInfo, _init?: RequestInit) => respond());
    const client = createOrdersClient({ baseUrl: 'http://orders.test', apiKey: 'secret-key', fetch });

    return { client, fetch };
};

describe('ordersClient', () => {
    it('sends the internal key and the filters that were given, skipping the empty ones', async () => {
        const { client, fetch } = makeClient(async () => json(200, []));

        await client.listProducts({ available: true, category: undefined });

        const [url, init] = fetch.mock.calls[0]!;
        expect(String(url)).toBe('http://orders.test/products?available=true');
        expect(init?.headers).toEqual({ 'x-api-key': 'secret-key' });
    });

    it('sends bodies as JSON', async () => {
        const { client, fetch } = makeClient(async () => json(200, { id: 'p1' }));

        await client.updateProduct('p1', { priceCents: 7000 });

        const [url, init] = fetch.mock.calls[0]!;
        expect(String(url)).toBe('http://orders.test/products/p1');
        expect(init).toMatchObject({
            method: 'PATCH',
            headers: { 'x-api-key': 'secret-key', 'content-type': 'application/json' },
            body: JSON.stringify({ priceCents: 7000 }),
        });
    });

    it('accepts an empty 204 answer when deleting', async () => {
        const { client, fetch } = makeClient(async () => new Response(null, { status: 204 }));

        await expect(client.deleteProduct('p1')).resolves.toBeUndefined();
        expect(fetch.mock.calls[0]?.[1]?.method).toBe('DELETE');
    });

    it('passes on errors about the request, with their details', async () => {
        const { client } = makeClient(async () =>
            json(422, { message: 'Earliest delivery date for these products is 2026-10-28' }));

        await expect(client.createOrder({ userId: 'u1', deliveryDate: '2026-10-26', items: [] }))
            .rejects.toMatchObject({ status: 422, message: 'Earliest delivery date for these products is 2026-10-28' });
    });

    it('keeps validation errors from the orders service', async () => {
        const { client } = makeClient(async () =>
            json(400, { message: 'Invalid request body', errors: { priceCents: ['Too small'] } }));

        await expect(client.createProduct({ priceCents: 0 }))
            .rejects.toMatchObject({ status: 400, details: { errors: { priceCents: ['Too small'] } } });
    });

    it.each([
        ['the internal key is wrong (401)', 401],
        ['the orders service fails (500)', 500],
    ])('answers 502 when %s, since that is not the caller’s fault', async (_label, status) => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { client } = makeClient(async () => json(status, { message: 'boom' }));

        await expect(client.listOrders()).rejects.toMatchObject({ status: 502, message: 'Orders service error' });
    });

    it('answers 503 when the orders service cannot be reached', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { client } = makeClient(async () => {
            throw new TypeError('fetch failed');
        });

        await expect(client.listProducts()).rejects.toMatchObject({ status: 503, message: 'Orders service unavailable' });
    });

    it('gives up after the timeout', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const fetch = vi.fn((_url: URL | RequestInfo, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))));
        const client = createOrdersClient({ baseUrl: 'http://orders.test', apiKey: 'k', fetch, timeoutMs: 20 });

        await expect(client.listProducts()).rejects.toMatchObject({ status: 503 });
    });
});
