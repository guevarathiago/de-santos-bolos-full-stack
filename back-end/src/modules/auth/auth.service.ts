import bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import { HttpError } from '../../errors/http-error.js';
import type { User } from '../users/user.entity.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import type { TokenPayload } from './token.js';

const toPublicUser = ({ id, name, email, role }: User): TokenPayload => ({ id, name, email, role });

export const createAuthService = (users: Repository<User>) => ({
    async login({ email, password }: LoginInput) {
        const user = await users.findOne({
            where: { email },
            select: { id: true, name: true, email: true, role: true, password: true },
        });

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        if (!(await bcrypt.compare(password, user.password))) {
            throw new HttpError(401, 'Invalid email or password');
        }

        return toPublicUser(user);
    },

    async register({ password, ...data }: RegisterInput) {
        if (await users.existsBy({ email: data.email })) {
            throw new HttpError(409, 'Email already exists');
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await users.save(users.create({ ...data, password: hash }));

        return toPublicUser(user);
    },
});

export type AuthService = ReturnType<typeof createAuthService>;
