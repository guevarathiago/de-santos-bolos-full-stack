import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';
import { DocumentChunk } from './document-chunk.entity.js';

export enum DocumentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED',
}

@Entity({ name: 'Document' })
export class Document {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    filename!: string;

    @Column('text')
    mimeType!: string;

    @Column('integer')
    sizeBytes!: number;

    @Column({ type: 'enum', enum: DocumentStatus, enumName: 'document_status', default: DocumentStatus.PENDING })
    status!: DocumentStatus;

    @Column('text', { nullable: true })
    errorMessage!: string | null;

    @Column('integer', { default: 0 })
    chunkCount!: number;

    @Column('uuid', { nullable: true })
    uploadedById!: string | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'uploadedById', foreignKeyConstraintName: 'Document_uploadedById_fkey' })
    uploadedBy!: User | null;

    @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
    chunks!: DocumentChunk[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
