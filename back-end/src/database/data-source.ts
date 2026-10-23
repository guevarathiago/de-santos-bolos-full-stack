import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { DocumentChunk } from '../modules/documents/document-chunk.entity.js';
import { Document } from '../modules/documents/document.entity.js';
import { Conversation } from '../modules/conversations/conversation.entity.js';
import { User } from '../modules/users/user.entity.js';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: env.DATABASE_URL,
    entities: [User, Document, DocumentChunk, Conversation],
    migrations: [fileURLToPath(new URL('./migrations/*.{ts,js}', import.meta.url))],
    uuidExtension: 'pgcrypto',
    synchronize: false,
    logging: env.NODE_ENV === 'development' ? ['error', 'migration'] : ['error'],
});
