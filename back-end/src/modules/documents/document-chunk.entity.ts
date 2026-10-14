import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Document } from './document.entity.js';

// Changing this requires a migration and re-embedding every chunk.
export const EMBEDDING_DIMENSIONS = 768;

export type ChunkMetadata = {
    page?: number;
};

@Entity({ name: 'DocumentChunk' })
export class DocumentChunk {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index('DocumentChunk_documentId_idx')
    @Column('uuid')
    documentId!: string;

    @ManyToOne(() => Document, (document) => document.chunks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'documentId', foreignKeyConstraintName: 'DocumentChunk_documentId_fkey' })
    document!: Document;

    @Column('integer')
    chunkIndex!: number;

    @Column('text')
    content!: string;

    @Column('jsonb', { default: {} })
    metadata!: ChunkMetadata;

    // HNSW index is created by hand in the migration; synchronize: false keeps TypeORM from dropping it.
    @Index('DocumentChunk_embedding_hnsw_idx', { synchronize: false })
    @Column({ type: 'vector', length: EMBEDDING_DIMENSIONS })
    embedding!: number[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}
