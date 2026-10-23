import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity.js';

// Only records who owns each chat; the messages live in the LangGraph checkpointer, keyed by this id.
@Entity({ name: 'Conversation' })
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index('Conversation_userId_idx')
    @Column('uuid')
    userId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'Conversation_userId_fkey' })
    user!: User;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
