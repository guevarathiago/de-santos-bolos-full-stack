import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.entity.js';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: env.DATABASE_URL,
    entities: [User],
    migrations: [fileURLToPath(new URL('./migrations/*.{ts,js}', import.meta.url))],
    synchronize: false,
    logging: env.NODE_ENV === 'development' ? ['error', 'migration'] : ['error'],
});
