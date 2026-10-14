import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth.schemas.js';

const validRegister = {
    name: 'Maria',
    email: 'maria@example.com',
    password: 'secret',
    celular: '11985403039',
    cep: '11070011',
};

describe('loginSchema', () => {
    it('accepts a valid payload', () => {
        expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    });

    it.each([
        [{}],
        [{ email: 'not-an-email', password: 'x' }],
        [{ email: 'a@b.com', password: '' }],
    ])('rejects %o', (payload) => {
        expect(loginSchema.safeParse(payload).success).toBe(false);
    });
});

describe('registerSchema', () => {
    it('accepts a valid payload and trims the name', () => {
        const result = registerSchema.parse({ ...validRegister, name: '  Maria  ' });

        expect(result.name).toBe('Maria');
    });

    it.each([
        ['missing name', { name: '' }],
        ['formatted CEP', { cep: '11070-011' }],
        ['short CEP', { cep: '1107001' }],
        ['formatted celular', { celular: '(11) 98540-3039' }],
        ['short celular', { celular: '119854' }],
    ])('rejects %s', (_label, override) => {
        expect(registerSchema.safeParse({ ...validRegister, ...override }).success).toBe(false);
    });
});
