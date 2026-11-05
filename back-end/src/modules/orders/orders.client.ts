import { HttpError } from '../../errors/http-error.js';

// Types mirror the JSON of the De Santos Bolos orders service (separate repository).
export const PRODUCT_CATEGORIES = ['CAKE', 'PIE', 'BROWNIE', 'SWEETS', 'OTHER'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type DietaryTag = 'GLUTEN_FREE' | 'LACTOSE_FREE' | 'VEGAN';

export type Product = {
    id: string;
    name: string;
    description: string;
    category: ProductCategory;
    priceCents: number;
    imageUrl: string | null;
    dietaryTags: DietaryTag[];
    servings: number | null;
    weightGrams: number | null;
    leadTimeDays: number;
    available: boolean;
    featured: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
};

export type ProductInput = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

export type ProductFilters = {
    available?: boolean | undefined;
    featured?: boolean | undefined;
    category?: ProductCategory | undefined;
};

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type OrderItem = {
    id: string;
    productId: string;
    productName: string;
    unitPriceCents: number;
    quantity: number;
};

export type Order = {
    id: string;
    userId: string;
    status: OrderStatus;
    deliveryDate: string;
    notes: string | null;
    totalCents: number;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
};

export type NewOrder = {
    userId: string;
    deliveryDate: string;
    items: { productId: string; quantity: number }[];
    notes?: string;
};

export type OrderFilters = {
    userId?: string | undefined;
    status?: OrderStatus | undefined;
};

type OrdersClientOptions = {
    baseUrl: string;
    apiKey: string;
    timeoutMs?: number;
    fetch?: typeof globalThis.fetch;
};

type RequestOptions = {
    body?: unknown;
    query?: Record<string, string | boolean | undefined>;
};

const DEFAULT_TIMEOUT_MS = 5000;

export const createOrdersClient = ({ baseUrl, apiKey, timeoutMs = DEFAULT_TIMEOUT_MS, fetch = globalThis.fetch }: OrdersClientOptions) => {
    const request = async <T>(method: string, path: string, { body, query = {} }: RequestOptions = {}): Promise<T> => {
        const url = new URL(path, baseUrl);
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }

        let response: Response;

        try {
            response = await fetch(url, {
                method,
                headers: { 'x-api-key': apiKey, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
                ...(body === undefined ? {} : { body: JSON.stringify(body) }),
                signal: AbortSignal.timeout(timeoutMs),
            });
        } catch (error) {
            console.error('Orders service unreachable:', error);
            throw new HttpError(503, 'Orders service unavailable');
        }

        const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

        if (response.ok) {
            return payload as T;
        }

        // Its 4xx answers are about the caller's request (invalid data, not found, a business rule), so they pass on.
        // A 401 means our own key is wrong, which is a server problem, like any 5xx.
        if (response.status >= 400 && response.status < 500 && response.status !== 401) {
            const { message, ...details } = payload;
            throw new HttpError(response.status, typeof message === 'string' ? message : 'Orders service error', details);
        }

        console.error(`Orders service answered ${response.status} to ${method} ${url.pathname}:`, payload);
        throw new HttpError(502, 'Orders service error');
    };

    return {
        listProducts: (filters: ProductFilters = {}) => request<Product[]>('GET', '/products', { query: filters }),
        createProduct: (data: ProductInput) => request<Product>('POST', '/products', { body: data }),
        updateProduct: (id: string, data: ProductInput) =>
            request<Product>('PATCH', `/products/${encodeURIComponent(id)}`, { body: data }),
        deleteProduct: async (id: string) => {
            await request<unknown>('DELETE', `/products/${encodeURIComponent(id)}`);
        },

        createOrder: (data: NewOrder) => request<Order>('POST', '/orders', { body: data }),
        listOrders: (filters: OrderFilters = {}) => request<Order[]>('GET', '/orders', { query: filters }),
        getOrder: (id: string, userId?: string) =>
            request<Order>('GET', `/orders/${encodeURIComponent(id)}`, { query: { userId } }),
        updateOrderStatus: (id: string, status: OrderStatus) =>
            request<Order>('PATCH', `/orders/${encodeURIComponent(id)}/status`, { body: { status } }),
    };
};

export type OrdersClient = ReturnType<typeof createOrdersClient>;
